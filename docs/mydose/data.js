// Dados mockados do MyDose Performance.
//
// Quando o backend (Meta Ads / CRM) estiver pronto, troque só o corpo de
// `fetchDashboardData()` e `fetchEvolutionData()` por chamadas reais — o
// resto do front (nav, cards, tabela, gráficos) consome o mesmo formato
// de dados definido aqui e não precisa mudar.

const MONTHS = [
  { key: "2025-12", label: "Dezembro/25" },
  { key: "2026-01", label: "Janeiro/26" },
  { key: "2026-02", label: "Fevereiro/26" },
  { key: "2026-03", label: "Março/26" },
  { key: "2026-04", label: "Abril/26" },
  { key: "2026-05", label: "Maio/26" },
  { key: "2026-06", label: "Junho/26" },
  { key: "2026-07", label: "Julho/26" },
];

const CURRENT_MONTH_KEY = "2026-07";

// direction: sinal real do delta (usado pra escolher a seta ↗/↘)
// good: se ESSA direção é favorável pro negócio (usado pra escolher a cor do badge)
function delta(pct, good) {
  return { pct, direction: pct >= 0 ? "up" : "down", good };
}

const MONTHLY = {
  "2025-12": {
    goals: { mql: { current: 210, target: 380 }, sql: { current: 18, target: 95 } },
    kpis: {
      investimentoTotal: { value: 5210.4, prev: 4820.1, delta: delta(8.1, true), sublabel: "Mídia Paga" },
      faturamentoTotal: { value: 41200, prev: 38650, delta: delta(6.6, true), sublabel: "ROAS Médio: 7.91x" },
      novosClientes: { value: 4, prev: 3, delta: delta(33.3, true) },
      receitaRealizada: 28900,
      cpmMedio: { value: 9.42, prev: 9.85, delta: delta(-4.4, true) },
      ctrMedio: { value: 3.1, prev: 2.9, delta: delta(6.9, true) },
      taxaComunidade: { value: 22.4, prev: 19.8, delta: delta(13.1, true) },
      mql: { value: 210, prev: 198, delta: delta(6.1, true), custo: 24.81 },
      sql: { value: 18, prev: 15, delta: delta(20.0, true), custo: 289.47 },
      opp: { value: 20, prev: 17, delta: delta(17.6, true), custo: 260.52 },
    },
    canais: [
      { origem: "Comunidade", mql: 34, custoMql: 18.4, sql: 8, custoSql: 78.2, opp: 8, custoOpp: 78.2, clientes: 1, receita: 9800, faturamento: 12400, roas: 9.12 },
      { origem: "WhatsApp Site", mql: 9, custoMql: 0, sql: 3, custoSql: 0, opp: 4, custoOpp: 0, clientes: 1, receita: 6100, faturamento: 8900, roas: 0 },
      { origem: "Calculadora", mql: 21, custoMql: 31.2, sql: 6, custoSql: 109.2, opp: 6, custoOpp: 109.2, clientes: 1, receita: 4200, faturamento: 6800, roas: 6.85 },
      { origem: "WhatsApp Ads", mql: 2, custoMql: 210.0, sql: 1, custoSql: 420.0, opp: 1, custoOpp: 420.0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Workshop", mql: 98, custoMql: 12.9, sql: 0, custoSql: 0, opp: 1, custoOpp: 1264.8, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Lab", mql: 46, custoMql: 14.1, sql: 0, custoSql: 0, opp: 0, custoOpp: 0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
    ],
  },
  "2026-01": {
    goals: { mql: { current: 240, target: 380 }, sql: { current: 22, target: 95 } },
    kpis: {
      investimentoTotal: { value: 5680.2, prev: 5210.4, delta: delta(9.0, true), sublabel: "Mídia Paga" },
      faturamentoTotal: { value: 45300, prev: 41200, delta: delta(10.0, true), sublabel: "ROAS Médio: 7.98x" },
      novosClientes: { value: 5, prev: 4, delta: delta(25.0, true) },
      receitaRealizada: 31200,
      cpmMedio: { value: 9.9, prev: 9.42, delta: delta(5.1, false) },
      ctrMedio: { value: 3.3, prev: 3.1, delta: delta(6.5, true) },
      taxaComunidade: { value: 24.1, prev: 22.4, delta: delta(7.6, true) },
      mql: { value: 240, prev: 210, delta: delta(14.3, true), custo: 23.67 },
      sql: { value: 22, prev: 18, delta: delta(22.2, true), custo: 258.19 },
      opp: { value: 24, prev: 20, delta: delta(20.0, true), custo: 236.68 },
    },
    canais: [
      { origem: "Comunidade", mql: 40, custoMql: 19.1, sql: 10, custoSql: 76.4, opp: 10, custoOpp: 76.4, clientes: 2, receita: 15400, faturamento: 18900, roas: 12.4 },
      { origem: "WhatsApp Site", mql: 10, custoMql: 0, sql: 4, custoSql: 0, opp: 5, custoOpp: 0, clientes: 2, receita: 9800, faturamento: 15200, roas: 0 },
      { origem: "Calculadora", mql: 24, custoMql: 33.8, sql: 7, custoSql: 115.9, opp: 7, custoOpp: 115.9, clientes: 1, receita: 6000, faturamento: 11200, roas: 8.9 },
      { origem: "WhatsApp Ads", mql: 3, custoMql: 245.0, sql: 1, custoSql: 735.0, opp: 2, custoOpp: 367.5, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Workshop", mql: 112, custoMql: 13.4, sql: 0, custoSql: 0, opp: 0, custoOpp: 0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Lab", mql: 51, custoMql: 15.0, sql: 0, custoSql: 0, opp: 0, custoOpp: 0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
    ],
  },
  "2026-02": {
    goals: { mql: { current: 265, target: 385 }, sql: { current: 25, target: 98 } },
    kpis: {
      investimentoTotal: { value: 6120.9, prev: 5680.2, delta: delta(7.8, true), sublabel: "Mídia Paga" },
      faturamentoTotal: { value: 48900, prev: 45300, delta: delta(7.9, true), sublabel: "ROAS Médio: 7.99x" },
      novosClientes: { value: 5, prev: 5, delta: delta(0, true) },
      receitaRealizada: 33500,
      cpmMedio: { value: 10.4, prev: 9.9, delta: delta(5.1, false) },
      ctrMedio: { value: 3.5, prev: 3.3, delta: delta(6.1, true) },
      taxaComunidade: { value: 25.8, prev: 24.1, delta: delta(7.1, true) },
      mql: { value: 265, prev: 240, delta: delta(10.4, true), custo: 23.1 },
      sql: { value: 25, prev: 22, delta: delta(13.6, true), custo: 244.84 },
      opp: { value: 27, prev: 24, delta: delta(12.5, true), custo: 226.7 },
    },
    canais: [
      { origem: "Comunidade", mql: 44, custoMql: 20.0, sql: 11, custoSql: 80.0, opp: 11, custoOpp: 80.0, clientes: 1, receita: 8200, faturamento: 10400, roas: 8.6 },
      { origem: "WhatsApp Site", mql: 11, custoMql: 0, sql: 4, custoSql: 0, opp: 6, custoOpp: 0, clientes: 2, receita: 10900, faturamento: 16800, roas: 0 },
      { origem: "Calculadora", mql: 27, custoMql: 35.6, sql: 8, custoSql: 120.1, opp: 8, custoOpp: 120.1, clientes: 2, receita: 8900, faturamento: 15900, roas: 13.1 },
      { origem: "WhatsApp Ads", mql: 3, custoMql: 260.4, sql: 1, custoSql: 781.2, opp: 3, custoOpp: 260.4, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Workshop", mql: 130, custoMql: 13.9, sql: 1, custoSql: 1807, opp: 0, custoOpp: 0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Lab", mql: 50, custoMql: 15.6, sql: 0, custoSql: 0, opp: 0, custoOpp: 0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
    ],
  },
  "2026-03": {
    goals: { mql: { current: 300, target: 390 }, sql: { current: 29, target: 99 } },
    kpis: {
      investimentoTotal: { value: 6540.0, prev: 6120.9, delta: delta(6.8, true), sublabel: "Mídia Paga" },
      faturamentoTotal: { value: 52100, prev: 48900, delta: delta(6.5, true), sublabel: "ROAS Médio: 7.97x" },
      novosClientes: { value: 6, prev: 5, delta: delta(20.0, true) },
      receitaRealizada: 36700,
      cpmMedio: { value: 10.9, prev: 10.4, delta: delta(4.8, false) },
      ctrMedio: { value: 3.6, prev: 3.5, delta: delta(2.9, true) },
      taxaComunidade: { value: 27.0, prev: 25.8, delta: delta(4.7, true) },
      mql: { value: 300, prev: 265, delta: delta(13.2, true), custo: 21.8 },
      sql: { value: 29, prev: 25, delta: delta(16.0, true), custo: 225.5 },
      opp: { value: 31, prev: 27, delta: delta(14.8, true), custo: 211.0 },
    },
    canais: [
      { origem: "Comunidade", mql: 48, custoMql: 20.6, sql: 12, custoSql: 82.4, opp: 12, custoOpp: 82.4, clientes: 2, receita: 16900, faturamento: 20800, roas: 15.1 },
      { origem: "WhatsApp Site", mql: 12, custoMql: 0, sql: 5, custoSql: 0, opp: 6, custoOpp: 0, clientes: 2, receita: 12100, faturamento: 18900, roas: 0 },
      { origem: "Calculadora", mql: 30, custoMql: 37.1, sql: 9, custoSql: 123.7, opp: 9, custoOpp: 123.7, clientes: 2, receita: 9400, faturamento: 16500, roas: 12.3 },
      { origem: "WhatsApp Ads", mql: 3, custoMql: 271.0, sql: 1, custoSql: 813.0, opp: 3, custoOpp: 271.0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Workshop", mql: 148, custoMql: 14.6, sql: 2, custoSql: 1080, opp: 1, custoOpp: 2160, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Lab", mql: 55, custoMql: 16.0, sql: 0, custoSql: 0, opp: 0, custoOpp: 0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
    ],
  },
  "2026-04": {
    goals: { mql: { current: 330, target: 395 }, sql: { current: 33, target: 100 } },
    kpis: {
      investimentoTotal: { value: 7010.5, prev: 6540.0, delta: delta(7.2, true), sublabel: "Mídia Paga" },
      faturamentoTotal: { value: 56400, prev: 52100, delta: delta(8.3, true), sublabel: "ROAS Médio: 8.04x" },
      novosClientes: { value: 6, prev: 6, delta: delta(0, true) },
      receitaRealizada: 39900,
      cpmMedio: { value: 11.3, prev: 10.9, delta: delta(3.7, false) },
      ctrMedio: { value: 3.7, prev: 3.6, delta: delta(2.8, true) },
      taxaComunidade: { value: 28.6, prev: 27.0, delta: delta(5.9, true) },
      mql: { value: 330, prev: 300, delta: delta(10.0, true), custo: 21.2 },
      sql: { value: 33, prev: 29, delta: delta(13.8, true), custo: 212.4 },
      opp: { value: 35, prev: 31, delta: delta(12.9, true), custo: 200.3 },
    },
    canais: [
      { origem: "Comunidade", mql: 52, custoMql: 21.0, sql: 13, custoSql: 84.0, opp: 13, custoOpp: 84.0, clientes: 2, receita: 18200, faturamento: 22400, roas: 16.8 },
      { origem: "WhatsApp Site", mql: 12, custoMql: 0, sql: 5, custoSql: 0, opp: 6, custoOpp: 0, clientes: 2, receita: 13100, faturamento: 19900, roas: 0 },
      { origem: "Calculadora", mql: 32, custoMql: 38.4, sql: 10, custoSql: 122.9, opp: 10, custoOpp: 122.9, clientes: 2, receita: 10200, faturamento: 17800, roas: 13.9 },
      { origem: "WhatsApp Ads", mql: 3, custoMql: 280.1, sql: 1, custoSql: 840.3, opp: 3, custoOpp: 280.1, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Workshop", mql: 165, custoMql: 15.1, sql: 3, custoSql: 806, opp: 2, custoOpp: 1209, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Lab", mql: 58, custoMql: 16.6, sql: 1, custoSql: 962, opp: 1, custoOpp: 962, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
    ],
  },
  "2026-05": {
    goals: { mql: { current: 355, target: 400 }, sql: { current: 36, target: 100 } },
    kpis: {
      investimentoTotal: { value: 7480.9, prev: 7010.5, delta: delta(6.7, true), sublabel: "Mídia Paga" },
      faturamentoTotal: { value: 60800, prev: 56400, delta: delta(7.8, true), sublabel: "ROAS Médio: 8.13x" },
      novosClientes: { value: 6, prev: 6, delta: delta(0, true) },
      receitaRealizada: 42600,
      cpmMedio: { value: 11.7, prev: 11.3, delta: delta(3.5, false) },
      ctrMedio: { value: 3.8, prev: 3.7, delta: delta(2.7, true) },
      taxaComunidade: { value: 17.8, prev: 28.6, delta: delta(-37.8, false) },
      mql: { value: 355, prev: 330, delta: delta(7.6, true), custo: 21.1 },
      sql: { value: 36, prev: 33, delta: delta(9.1, true), custo: 207.8 },
      opp: { value: 38, prev: 35, delta: delta(8.6, true), custo: 196.9 },
    },
    canais: [
      { origem: "Comunidade", mql: 57, custoMql: 21.4, sql: 13, custoSql: 93.8, opp: 13, custoOpp: 93.8, clientes: 2, receita: 19700, faturamento: 24100, roas: 17.3 },
      { origem: "WhatsApp Site", mql: 12, custoMql: 0, sql: 4, custoSql: 0, opp: 6, custoOpp: 0, clientes: 3, receita: 14800, faturamento: 22300, roas: 0 },
      { origem: "Calculadora", mql: 33, custoMql: 39.1, sql: 11, custoSql: 117.4, opp: 11, custoOpp: 117.4, clientes: 1, receita: 8900, faturamento: 14400, roas: 10.9 },
      { origem: "WhatsApp Ads", mql: 3, custoMql: 260.4, sql: 1, custoSql: 781.2, opp: 4, custoOpp: 195.3, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Workshop", mql: 174, custoMql: 15.9, sql: 5, custoSql: 553, opp: 3, custoOpp: 922, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Lab", mql: 60, custoMql: 17.1, sql: 2, custoSql: 513, opp: 1, custoOpp: 1026, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
    ],
  },
  "2026-06": {
    goals: { mql: { current: 364, target: 402 }, sql: { current: 34, target: 100 } },
    kpis: {
      investimentoTotal: { value: 7154.69, prev: 7480.9, delta: delta(-4.4, true), sublabel: "Mídia Paga" },
      faturamentoTotal: { value: 84876.0, prev: 60800, delta: delta(39.6, true), sublabel: "ROAS Médio: 11.86x" },
      novosClientes: { value: 6, prev: 6, delta: delta(0, true) },
      receitaRealizada: 51200,
      cpmMedio: { value: 11.39, prev: 11.7, delta: delta(-2.6, true) },
      ctrMedio: { value: 3.4, prev: 3.8, delta: delta(-10.5, false) },
      taxaComunidade: { value: 17.8, prev: 17.8, delta: delta(0, true) },
      mql: { value: 406, prev: 355, delta: delta(14.4, true), custo: 17.62 },
      sql: { value: 364, prev: 36, delta: delta(911.1, true), custo: 19.65 },
      opp: { value: 42, prev: 38, delta: delta(10.5, true), custo: 176.97 },
    },
    canais: [
      { origem: "Comunidade", mql: 59, custoMql: 20.9, sql: 14, custoSql: 88.2, opp: 14, custoOpp: 88.2, clientes: 2, receita: 20100, faturamento: 25300, roas: 18.0 },
      { origem: "WhatsApp Site", mql: 13, custoMql: 0, sql: 4, custoSql: 0, opp: 6, custoOpp: 0, clientes: 3, receita: 15900, faturamento: 24100, roas: 0 },
      { origem: "Calculadora", mql: 34, custoMql: 40.2, sql: 12, custoSql: 113.9, opp: 12, custoOpp: 113.9, clientes: 2, receita: 9600, faturamento: 15200, roas: 11.6 },
      { origem: "WhatsApp Ads", mql: 3, custoMql: 254.2, sql: 1, custoSql: 762.6, opp: 4, custoOpp: 190.7, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Workshop", mql: 168, custoMql: 16.5, sql: 4, custoSql: 692, opp: 3, custoOpp: 923, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Lab", mql: 63, custoMql: 17.9, sql: 2, custoSql: 564, opp: 1, custoOpp: 1128, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
    ],
  },
  // Julho/26 — mês corrente, valores batendo com o print de referência.
  "2026-07": {
    goals: { mql: { current: 386, target: 404 }, sql: { current: 41, target: 101 } },
    kpis: {
      investimentoTotal: { value: 8848.63, prev: 7154.69, delta: delta(23.7, true), sublabel: "Mídia Paga" },
      faturamentoTotal: { value: 67806.0, prev: 84876.0, delta: delta(-20.1, false), sublabel: "ROAS Médio: 7.66x" },
      novosClientes: { value: 7, prev: 6, delta: delta(16.7, true) },
      receitaRealizada: 47226.0,
      cpmMedio: { value: 14.08, prev: 11.39, delta: delta(23.6, false) },
      ctrMedio: { value: 4.0, prev: 3.4, delta: delta(16.6, true) },
      taxaComunidade: { value: 37.6, prev: 17.8, delta: delta(111.8, true) },
      mql: { value: 386, prev: 406, delta: delta(-4.9, false), custo: 22.92 },
      sql: { value: 41, prev: 364, delta: delta(-88.7, false), custo: 215.82 },
      opp: { value: 50, prev: 42, delta: delta(19.0, true), custo: 176.97 },
    },
    canais: [
      { origem: "Comunidade", mql: 62, custoMql: 21.63, sql: 15, custoSql: 89.4, opp: 15, custoOpp: 89.4, clientes: 2, receita: 22686, faturamento: 27366, roas: 20.41 },
      { origem: "WhatsApp Site", mql: 12, custoMql: 0, sql: 4, custoSql: 0, opp: 6, custoOpp: 0, clientes: 3, receita: 15300, faturamento: 25560, roas: 0 },
      { origem: "Calculadora", mql: 33, custoMql: 39.19, sql: 12, custoSql: 107.76, opp: 12, custoOpp: 107.76, clientes: 2, receita: 9240, faturamento: 14880, roas: 11.51 },
      { origem: "WhatsApp Ads", mql: 3, custoMql: 254.21, sql: 1, custoSql: 762.63, opp: 4, custoOpp: 190.66, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Retomada", mql: 1, custoMql: 0, sql: 0, custoSql: 0, opp: 0, custoOpp: 0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Não Identificado (Orgânico)", mql: 15, custoMql: 0, sql: 0, custoSql: 0, opp: 0, custoOpp: 0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Inbound", mql: 1, custoMql: 0, sql: 1, custoSql: 0, opp: 1, custoOpp: 0, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Workshop", mql: 157, custoMql: 17.86, sql: 4, custoSql: 701.04, opp: 3, custoOpp: 934.72, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
      { origem: "Lab", mql: 61, custoMql: 19.36, sql: 2, custoSql: 590.55, opp: 2, custoOpp: 590.55, clientes: 0, receita: 0, faturamento: 0, roas: 0 },
    ],
  },
};

/**
 * Retorna os dados do dashboard pro mês pedido (ou o mês corrente).
 * Assíncrono de propósito: quando plugar a API real, essa função vira
 * um fetch pro backend sem precisar mexer em quem a chama.
 */
export async function fetchDashboardData(monthKey = CURRENT_MONTH_KEY) {
  const month = MONTHS.find((m) => m.key === monthKey) ?? MONTHS.find((m) => m.key === CURRENT_MONTH_KEY);
  const prevIndex = MONTHS.findIndex((m) => m.key === month.key) - 1;
  const prevMonth = prevIndex >= 0 ? MONTHS[prevIndex] : null;
  return {
    month,
    prevMonthLabel: prevMonth ? prevMonth.label : "—",
    ...MONTHLY[month.key],
  };
}

/** Série completa (todos os meses) pros gráficos de evolução. */
export async function fetchEvolutionData() {
  return MONTHS.map((m) => ({ month: m, ...MONTHLY[m.key] }));
}

export { MONTHS, CURRENT_MONTH_KEY };
