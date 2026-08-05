// Anúncios agrupados por nomenclatura — dados mockados.
//
// REGRA DE AGREGAÇÃO (o motivo deste arquivo existir):
// Toda métrica de anúncio cai em uma de duas categorias, nunca as duas:
//
//   1. SOMÁVEL  — é uma contagem/total bruto. Junta vários anúncios com o
//      mesmo nome? Soma direto. Ex: Investimento, Compras, Leads, Cliques,
//      Alcance, Impressões, Page Views, Initiate Checkout.
//
//   2. DERIVADA — é uma razão entre duas somáveis (custo por X, CPM, CTR,
//      frequência, taxa de qualquer coisa). NUNCA tira a média das razões
//      de cada linha — isso dá número errado quando uma linha tem
//      denominador zero ou peso diferente. Sempre recalcula a razão a
//      partir das somas já agregadas: total do numerador / total do
//      denominador. É a mesma lógica que o Meta Ads Manager usa quando
//      você seleciona várias linhas e ele soma a coluna.
//
// Isso significa que pra adicionar uma métrica nova no futuro, quase nunca
// se escreve lógica de agregação nova: só declara se ela é BASE (soma) ou
// DERIVED (numerador/denominador), e o resto do arquivo já sabe combinar
// qualquer grupo de anúncios corretamente.

// Campos base — mapeiam 1:1 pras colunas numeric() de lovable/sql/schema.sql
// (spend, compra, lead, initiate_checkout, landing_page_views,
// unique_link_clicks, reach, impressions). Nomes aqui em camelCase.
const BASE_METRICS = ["spend", "compra", "lead", "initiateCheckout", "landingPageViews", "uniqueLinkClicks", "reach", "impressions"];

// Métricas derivadas: { numerador, denominador, multiplicador (opcional) }.
// custo_por_compra, custo_por_lead etc. do schema caem todas no mesmo padrão
// "spend / contagem".
const DERIVED_METRICS = {
  custoPorCompra: { num: "spend", den: "compra" },
  custoPorLead: { num: "spend", den: "lead" },
  custoPorInitiateCheckout: { num: "spend", den: "initiateCheckout" },
  custoPorLpv: { num: "spend", den: "landingPageViews" },
  custoPorUniqueLinkClick: { num: "spend", den: "uniqueLinkClicks" },
  cpm: { num: "spend", den: "impressions", mult: 1000 },
  uniqueCtrLink: { num: "uniqueLinkClicks", den: "reach", mult: 100 },
  frequency: { num: "impressions", den: "reach" },
};

/**
 * Recalcula as métricas derivadas a partir de um conjunto de somas (base
 * numerador/denominador). Funciona tanto pra uma linha só (a "soma" de um
 * grupo de 1) quanto pro total de várias — é a mesma conta nos dois casos,
 * só muda quantas linhas entraram na soma antes.
 */
function deriveMetrics(sums) {
  const derived = {};
  for (const [key, { num, den, mult }] of Object.entries(DERIVED_METRICS)) {
    derived[key] = sums[den] > 0 ? (sums[num] / sums[den]) * (mult || 1) : null;
  }
  return derived;
}

/**
 * Agrega uma lista de linhas de anúncio (mesmo formato de AD_ROWS) em um
 * único objeto: soma as métricas base e recalcula as derivadas a partir
 * das somas — nunca faz média das razões prontas de cada linha.
 */
export function aggregateAds(rows) {
  const sums = Object.fromEntries(BASE_METRICS.map((k) => [k, 0]));
  rows.forEach((r) => BASE_METRICS.forEach((k) => (sums[k] += r[k] || 0)));
  return { ...sums, ...deriveMetrics(sums), usos: rows.length };
}

/** Enriquece uma linha crua (só métricas base) com suas próprias derivadas. */
export function withDerivedMetrics(row) {
  return { ...row, ...deriveMetrics(row) };
}

// ---------- dados mockados ----------
// Os dois primeiros grupos (AD32 e AD33) usam os números reais que você
// mandou print — servem de conferência: some Invest./Leads das 3 linhas de
// cada grupo e bate com o TOTAL que você viu.
const AD_ROWS = [
  // AD32 - RMKT HOME - Copy
  { adId: "a32-1", adName: "AD32 - RMKT HOME - Copy", campaignName: "66 - [VENDAS] [RMKT HOME ONLINE] [Q]", status: "CAMPAIGN_PAUSED", instagramUrl: "#", spend: 308.36, compra: 3, lead: 22, initiateCheckout: 5, landingPageViews: 41, uniqueLinkClicks: 58, reach: 1120, impressions: 1980 },
  { adId: "a32-2", adName: "AD32 - RMKT HOME - Copy", campaignName: "66 - [VENDAS] [RMKT HOME ONLINE] [Q]", status: "CAMPAIGN_PAUSED", instagramUrl: "#", spend: 163.08, compra: 0, lead: 14, initiateCheckout: 2, landingPageViews: 25, uniqueLinkClicks: 33, reach: 640, impressions: 1105 },
  { adId: "a32-3", adName: "AD32 - RMKT HOME - Copy", campaignName: "66 - [VENDAS] [RMKT HOME ONLINE] [Q]", status: "CAMPAIGN_PAUSED", instagramUrl: "#", spend: 117.11, compra: 0, lead: 9, initiateCheckout: 1, landingPageViews: 17, uniqueLinkClicks: 22, reach: 455, impressions: 780 },

  // AD33 - RMKT HOME - Copy
  { adId: "a33-1", adName: "AD33 - RMKT HOME - Copy", campaignName: "65 - [VENDAS] [RMKT HOME ONLINE] [Q]", status: "CAMPAIGN_PAUSED", instagramUrl: "#", spend: 60.41, compra: 2, lead: 1, initiateCheckout: 2, landingPageViews: 6, uniqueLinkClicks: 9, reach: 210, impressions: 340 },
  { adId: "a33-2", adName: "AD33 - RMKT HOME - Copy", campaignName: "65 - [VENDAS] [RMKT HOME ONLINE] [Q]", status: "CAMPAIGN_PAUSED", instagramUrl: "#", spend: 47.87, compra: 0, lead: 2, initiateCheckout: 1, landingPageViews: 4, uniqueLinkClicks: 7, reach: 175, impressions: 260 },
  { adId: "a33-3", adName: "AD33 - RMKT HOME - Copy", campaignName: "65 - [VENDAS] [RMKT HOME ONLINE] [Q]", status: "CAMPAIGN_PAUSED", instagramUrl: "#", spend: 14.95, compra: 0, lead: 0, initiateCheckout: 0, landingPageViews: 1, uniqueLinkClicks: 2, reach: 60, impressions: 95 },

  // AD34 - Comunidade - Depoimento (ativo, pra dar exemplo do filtro "somente ativos")
  { adId: "a34-1", adName: "AD34 - Comunidade - Depoimento", campaignName: "70 - [VENDAS] [COMUNIDADE] [Q]", status: "ACTIVE", instagramUrl: "#", spend: 421.9, compra: 6, lead: 31, initiateCheckout: 9, landingPageViews: 60, uniqueLinkClicks: 88, reach: 1840, impressions: 3120 },
  { adId: "a34-2", adName: "AD34 - Comunidade - Depoimento", campaignName: "70 - [VENDAS] [COMUNIDADE] [Q]", status: "ACTIVE", instagramUrl: "#", spend: 205.6, compra: 2, lead: 18, initiateCheckout: 4, landingPageViews: 29, uniqueLinkClicks: 40, reach: 890, impressions: 1510 },

  // AD35 - Calculadora - UGC (ativo)
  { adId: "a35-1", adName: "AD35 - Calculadora - UGC", campaignName: "71 - [VENDAS] [CALCULADORA] [Q]", status: "ACTIVE", instagramUrl: "#", spend: 156.2, compra: 1, lead: 12, initiateCheckout: 3, landingPageViews: 22, uniqueLinkClicks: 30, reach: 610, impressions: 990 },
  { adId: "a35-2", adName: "AD35 - Calculadora - UGC", campaignName: "71 - [VENDAS] [CALCULADORA] [Q]", status: "ADSET_PAUSED", instagramUrl: "#", spend: 39.5, compra: 0, lead: 3, initiateCheckout: 0, landingPageViews: 5, uniqueLinkClicks: 8, reach: 150, impressions: 240 },
];

/** Assíncrono de propósito — vira um fetch pro backend real depois. */
export async function fetchAdsData() {
  return AD_ROWS;
}

export function groupAdsByName(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!map.has(r.adName)) map.set(r.adName, []);
    map.get(r.adName).push(r);
  });
  return Array.from(map.entries()).map(([adName, adRows]) => ({
    adName,
    rows: adRows,
    total: aggregateAds(adRows),
  }));
}
