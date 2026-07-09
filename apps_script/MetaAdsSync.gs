// Google Apps Script — cole este código em Extensions > Apps Script na planilha.
// Puxa dados de campanhas, conjuntos de anúncio e anúncios do Meta Ads (Graph API)
// e escreve em 3 abas separadas da planilha.

const AD_ACCOUNT_ID = 'act_5914817155286462';
const API_VERSION = 'v21.0';
const DAYS_BACK = 30;

const LEVELS = {
  campaign: {
    sheetName: 'Campanhas',
    insightFields: ['campaign_id', 'campaign_name'],
    nameHeaders: ['Campanha'],
  },
  adset: {
    sheetName: 'Conjuntos de Anúncio',
    insightFields: ['campaign_id', 'campaign_name', 'adset_id', 'adset_name'],
    nameHeaders: ['Campanha', 'Conjunto de Anúncios'],
  },
  ad: {
    sheetName: 'Anúncios',
    insightFields: ['campaign_id', 'campaign_name', 'adset_id', 'adset_name', 'ad_id', 'ad_name'],
    nameHeaders: ['Campanha', 'Conjunto de Anúncios', 'Anúncio'],
  },
};

const COMMON_FIELDS = ['spend', 'impressions', 'reach', 'frequency', 'cpm', 'actions', 'unique_actions', 'cost_per_action_type'];

const METRIC_HEADERS = [
  'Orçamento', 'Compra', 'Custo por Compra', 'Lead', 'Custo por Lead', 'Initiate Checkout', 'Custo por Initiate Checkout',
  'Unique CTR (Link)', 'Landing Page Views', 'Custo por Landing Page View', 'CPM', 'Frequency',
  'Reach', 'Impressions', 'Custo por Unique Link Click', 'Unique Link Clicks', 'LPV Rate por Link Clicks (%)',
];

// Para cada métrica de conversão, os tipos de ação do Meta que podem representá-la,
// em ordem de prioridade — usamos só o primeiro que existir na linha, nunca somamos
// vários ao mesmo tempo (tipos diferentes às vezes contam o mesmo evento duas vezes).
const ACTION_TYPE_PRIORITY = {
  purchase: ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_conversion.purchase'],
  lead: ['onsite_conversion.lead_grouped', 'omni_lead', 'lead', 'offsite_conversion.fb_pixel_lead'],
  initiate_checkout: ['omni_initiated_checkout', 'initiate_checkout', 'offsite_conversion.fb_pixel_initiate_checkout', 'onsite_conversion.initiate_checkout'],
};

function actionValue_(actionsArray, metricKey) {
  if (!actionsArray) return 0;
  const priority = ACTION_TYPE_PRIORITY[metricKey];
  for (const type of priority) {
    const found = actionsArray.find((a) => a.action_type === type);
    if (found) return parseFloat(found.value || 0);
  }
  return 0;
}

function costValue_(costArray, metricKey) {
  if (!costArray) return null;
  const priority = ACTION_TYPE_PRIORITY[metricKey];
  for (const type of priority) {
    const found = costArray.find((c) => c.action_type === type);
    if (found) return parseFloat(found.value);
  }
  return null;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Meta Ads')
    .addItem('1. Configurar Token', 'configurarToken')
    .addItem('2. Atualizar Dados Agora', 'atualizarDados')
    .addItem('3. Ativar Atualização Diária Automática', 'ativarAtualizacaoDiaria')
    .addToUi();
}

function configurarToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Configurar Token do Meta Ads',
    'Cole aqui o token de acesso gerado na Business Manager:',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() == ui.Button.OK) {
    const token = response.getResponseText().trim();
    PropertiesService.getScriptProperties().setProperty('META_ACCESS_TOKEN', token);
    ui.alert('Token salvo com sucesso!');
  }
}

function getToken_() {
  const token = PropertiesService.getScriptProperties().getProperty('META_ACCESS_TOKEN');
  if (!token) {
    throw new Error('Configure o token primeiro (menu Meta Ads > 1. Configurar Token).');
  }
  return token;
}

function fetchAllPaginated_(url) {
  const results = [];
  while (url) {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const payload = JSON.parse(response.getContentText());
    if (payload.error) {
      throw new Error('Erro na API do Meta: ' + payload.error.message);
    }
    results.push.apply(results, payload.data || []);
    url = payload.paging && payload.paging.next ? payload.paging.next : null;
  }
  return results;
}

function getCampaignsMeta_(token) {
  const url = `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/campaigns?fields=id,daily_budget,lifetime_budget,effective_status&limit=500&access_token=${token}`;
  const rows = fetchAllPaginated_(url);
  const map = {};
  rows.forEach((c) => {
    map[c.id] = { dailyBudget: c.daily_budget, lifetimeBudget: c.lifetime_budget, status: c.effective_status };
  });
  return map;
}

function getAdSetsMeta_(token) {
  const url = `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/adsets?fields=id,campaign_id,daily_budget,lifetime_budget,effective_status&limit=500&access_token=${token}`;
  const rows = fetchAllPaginated_(url);
  const map = {};
  rows.forEach((a) => {
    map[a.id] = {
      campaignId: a.campaign_id,
      dailyBudget: a.daily_budget,
      lifetimeBudget: a.lifetime_budget,
      status: a.effective_status,
    };
  });
  return map;
}

function getAdsMeta_(token) {
  const fields = encodeURIComponent('id,effective_status,creative{thumbnail_url,instagram_permalink_url}');
  const url = `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/ads?fields=${fields}&limit=500&access_token=${token}`;
  const rows = fetchAllPaginated_(url);
  const map = {};
  rows.forEach((a) => {
    map[a.id] = {
      status: a.effective_status,
      instagramUrl: a.creative && a.creative.instagram_permalink_url,
      thumbnailUrl: a.creative && a.creative.thumbnail_url,
    };
  });
  return map;
}

function fetchInsights_(token, levelKey) {
  const level = LEVELS[levelKey];
  const fields = level.insightFields.concat(COMMON_FIELDS).join(',');
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateTo.getDate() - DAYS_BACK);
  const fmt = (d) => Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const timeRange = encodeURIComponent(JSON.stringify({ since: fmt(dateFrom), until: fmt(dateTo) }));
  const url = `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/insights?fields=${fields}&level=${levelKey}&time_increment=1&time_range=${timeRange}&limit=500&access_token=${token}`;
  return fetchAllPaginated_(url);
}

function sumByKeyword_(actionsArray, keywords) {
  if (!keywords || !actionsArray) return 0;
  let total = 0;
  actionsArray.forEach((a) => {
    if (a.action_type && keywords.some((k) => a.action_type.indexOf(k) !== -1)) {
      total += parseFloat(a.value || 0);
    }
  });
  return total;
}

function costByKeyword_(costArray, keywords) {
  if (!keywords || !costArray) return null;
  for (const c of costArray) {
    if (c.action_type && keywords.some((k) => c.action_type.indexOf(k) !== -1)) {
      return parseFloat(c.value);
    }
  }
  return null;
}

function safeDiv_(a, b) {
  return b > 0 ? a / b : '';
}

function round2_(n) {
  return typeof n === 'number' && !isNaN(n) ? Math.round(n * 100) / 100 : n;
}

function formatBudget_(meta) {
  if (!meta) return '';
  if (meta.dailyBudget) return (meta.dailyBudget / 100) + '/dia';
  if (meta.lifetimeBudget) return (meta.lifetimeBudget / 100) + ' (total)';
  return '';
}

function buildRow_(levelKey, raw, campaignsMeta, adsetsMeta, adsMeta) {
  const actions = raw.actions || [];
  const uniqueActions = raw.unique_actions || [];
  const costPerAction = raw.cost_per_action_type || [];
  const spend = parseFloat(raw.spend || 0);
  const reach = parseFloat(raw.reach || 0);

  const linkClicks = sumByKeyword_(uniqueActions, ['link_click']);
  const landingPageViews = sumByKeyword_(actions, ['landing_page_view']);

  const purchases = actionValue_(actions, 'purchase');
  const custoPorCompra = costValue_(costPerAction, 'purchase') || safeDiv_(spend, purchases);
  const leads = actionValue_(actions, 'lead');
  const custoPorLead = costValue_(costPerAction, 'lead') || safeDiv_(spend, leads);
  const initiateCheckout = actionValue_(actions, 'initiate_checkout');
  const custoPorInitiate = costValue_(costPerAction, 'initiate_checkout') || safeDiv_(spend, initiateCheckout);

  const custoPorLPV = costByKeyword_(costPerAction, ['landing_page_view']) || safeDiv_(spend, landingPageViews);
  const custoPorLinkClickUnico = safeDiv_(spend, linkClicks);
  const uniqueLinkCtr = reach > 0 ? round2_((linkClicks / reach) * 100) : 0;
  const lpvRate = linkClicks > 0 ? round2_((landingPageViews / linkClicks) * 100) : 0;

  const campaignMeta = campaignsMeta[raw.campaign_id];
  let adsetMeta = null;
  let adMeta = null;
  let budget = '';
  let status = '';

  if (levelKey === 'campaign') {
    budget = formatBudget_(campaignMeta);
    status = (campaignMeta && campaignMeta.status) || '';
  } else {
    adsetMeta = adsetsMeta[raw.adset_id];
    budget = formatBudget_(adsetMeta) || formatBudget_(campaignMeta);
    status = (adsetMeta && adsetMeta.status) || '';
  }

  if (levelKey === 'ad') {
    adMeta = adsMeta[raw.ad_id];
    status = (adMeta && adMeta.status) || status;
  }

  const nameCols = LEVELS[levelKey].nameHeaders.map((_, i) => {
    if (i === 0) return raw.campaign_name;
    if (i === 1) return raw.adset_name;
    return raw.ad_name;
  });

  const row = [raw.date_start].concat(nameCols).concat([status]).concat([
    budget,
    purchases,
    round2_(custoPorCompra),
    leads,
    round2_(custoPorLead),
    initiateCheckout,
    round2_(custoPorInitiate),
    uniqueLinkCtr + '%',
    landingPageViews,
    round2_(custoPorLPV),
    raw.cpm,
    raw.frequency,
    reach,
    raw.impressions,
    round2_(custoPorLinkClickUnico),
    linkClicks,
    lpvRate + '%',
  ]);

  if (levelKey === 'ad') {
    row.push((adMeta && adMeta.instagramUrl) || '');
    row.push((adMeta && adMeta.thumbnailUrl) || '');
  }

  return row;
}

function syncLevel_(levelKey, token, campaignsMeta, adsetsMeta, adsMeta) {
  const level = LEVELS[levelKey];
  const rawRows = fetchInsights_(token, levelKey);
  let headers = ['Data'].concat(level.nameHeaders).concat(['Status']).concat(METRIC_HEADERS);
  if (levelKey === 'ad') headers = headers.concat(['Link Instagram', 'Miniatura']);
  const rows = rawRows.map((raw) => buildRow_(levelKey, raw, campaignsMeta, adsetsMeta, adsMeta));

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(level.sheetName);
  if (!sheet) sheet = ss.insertSheet(level.sheetName);
  sheet.clear();
  sheet.appendRow(headers);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return rows.length;
}

function atualizarDados() {
  const ui = SpreadsheetApp.getUi();
  let token;
  try {
    token = getToken_();
  } catch (e) {
    ui.alert(e.message);
    return;
  }

  try {
    const campaignsMeta = getCampaignsMeta_(token);
    const adsetsMeta = getAdSetsMeta_(token);
    const adsMeta = getAdsMeta_(token);

    const counts = {};
    Object.keys(LEVELS).forEach((levelKey) => {
      counts[LEVELS[levelKey].sheetName] = syncLevel_(levelKey, token, campaignsMeta, adsetsMeta, adsMeta);
    });

    const summary = Object.keys(counts).map((name) => `${name}: ${counts[name]} linhas`).join('\n');
    ui.alert('Dados atualizados!\n\n' + summary);
  } catch (e) {
    ui.alert('Erro ao atualizar: ' + e.message);
  }
}

function ativarAtualizacaoDiaria() {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'atualizarDados') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('atualizarDados')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
  SpreadsheetApp.getUi().alert('Atualização automática diária ativada (todo dia por volta das 6h).');
}
