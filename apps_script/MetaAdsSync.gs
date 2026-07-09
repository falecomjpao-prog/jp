// Google Apps Script — cole este código em Extensions > Apps Script na planilha.
// Puxa dados de campanhas do Meta Ads (Graph API) e escreve numa aba da planilha.

const AD_ACCOUNT_ID = 'act_5914817155286462'; // conta de anúncios
const API_VERSION = 'v21.0';
const SHEET_NAME = 'Meta Ads';
const DAYS_BACK = 30;

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

function atualizarDados() {
  const token = PropertiesService.getScriptProperties().getProperty('META_ACCESS_TOKEN');
  if (!token) {
    SpreadsheetApp.getUi().alert('Configure o token primeiro (menu Meta Ads > 1. Configurar Token).');
    return;
  }

  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateTo.getDate() - DAYS_BACK);

  const fmt = (d) => Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const fields = 'campaign_name,spend,impressions,clicks,ctr,cpc,actions';
  const timeRange = encodeURIComponent(JSON.stringify({ since: fmt(dateFrom), until: fmt(dateTo) }));
  let url = `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/insights?fields=${fields}&level=campaign&time_increment=1&time_range=${timeRange}&limit=500&access_token=${token}`;

  const rows = [];
  while (url) {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const payload = JSON.parse(response.getContentText());
    if (payload.error) {
      SpreadsheetApp.getUi().alert('Erro na API do Meta: ' + payload.error.message);
      return;
    }
    (payload.data || []).forEach((row) => {
      const actions = {};
      (row.actions || []).forEach((a) => { actions[a.action_type] = a.value; });
      rows.push([
        row.date_start,
        row.campaign_name,
        row.spend,
        row.impressions,
        row.clicks,
        row.ctr,
        row.cpc,
        actions['purchase'] || 0,
        actions['lead'] || 0,
        actions['link_click'] || 0,
      ]);
    });
    url = payload.paging && payload.paging.next ? payload.paging.next : null;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.clear();
  const headers = ['Data', 'Campanha', 'Gasto', 'Impressões', 'Cliques', 'CTR', 'CPC', 'Compras', 'Leads', 'Cliques no Link'];
  sheet.appendRow(headers);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  SpreadsheetApp.getUi().alert(`${rows.length} linhas atualizadas na aba "${SHEET_NAME}".`);
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
