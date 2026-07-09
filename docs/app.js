const SPREADSHEET_ID = '1SFseYaRj9rFcg8Hk4X9snHjypjfX_DLRQ8MYOKOKmSQ';

const LEVELS = [
  { key: 'campaign', sheetName: 'Campanhas', label: 'Campanhas', nameCols: ['Campanha'] },
  { key: 'adset', sheetName: 'Conjuntos de Anúncio', label: 'Conjuntos de Anúncio', nameCols: ['Campanha', 'Conjunto de Anúncios'] },
  { key: 'ad', sheetName: 'Anúncios', label: 'Anúncios', nameCols: ['Campanha', 'Conjunto de Anúncios', 'Anúncio'] },
];

const state = { data: {}, activeLevel: 'campaign', charts: {} };

function num(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'string' ? parseFloat(v.replace('%', '').replace(',', '.')) : v;
  return isNaN(n) ? 0 : n;
}

function fmtInt(n) {
  return Math.round(n).toLocaleString('pt-BR');
}

function fmtMoney(n) {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

function cellValue(cell) {
  if (!cell) return null;
  const v = cell.v;
  if (typeof v === 'string' && v.startsWith('Date(')) {
    const nums = v.match(/-?\d+/g).map(Number);
    const d = new Date(nums[0], nums[1], nums[2]);
    return d.toISOString().slice(0, 10);
  }
  return v;
}

async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&_=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Não consegui acessar a aba "${sheetName}" (HTTP ${res.status}). Verifique se a planilha está compartilhada como "Qualquer pessoa com o link → Leitor".`);
  }
  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);\s*$/);
  if (!match) {
    throw new Error(`Não consegui ler os dados da aba "${sheetName}". Verifique se a planilha está compartilhada como "Qualquer pessoa com o link → Leitor" e se a aba existe.`);
  }
  const json = JSON.parse(match[1]);
  const cols = json.table.cols.map((c) => c.label);
  const rows = (json.table.rows || []).map((r) => {
    const obj = {};
    cols.forEach((label, i) => { obj[label] = cellValue(r.c[i]); });
    return obj;
  });
  return rows;
}

function groupBy(rows, keyFn) {
  const map = new Map();
  rows.forEach((r) => {
    const key = keyFn(r);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  return map;
}

function aggregate(rows) {
  const s = {
    resultado: 0, resultadoCost: 0,
    initiate: 0, initiateCost: 0,
    lpv: 0, lpvCost: 0,
    reach: 0, impressions: 0, cpmWeighted: 0,
    ulc: 0, ulcCost: 0,
  };
  rows.forEach((r) => {
    const resultado = num(r['Resultado']);
    const initiate = num(r['Initiate Checkout']);
    const lpv = num(r['Landing Page Views']);
    const impressions = num(r['Impressions']);
    const reach = num(r['Reach']);
    const ulc = num(r['Unique Link Clicks']);

    s.resultado += resultado;
    s.resultadoCost += num(r['Custo por Resultado']) * resultado;
    s.initiate += initiate;
    s.initiateCost += num(r['Custo por Initiate Checkout']) * initiate;
    s.lpv += lpv;
    s.lpvCost += num(r['Custo por Landing Page View']) * lpv;
    s.reach += reach;
    s.impressions += impressions;
    s.cpmWeighted += num(r['CPM']) * impressions;
    s.ulc += ulc;
    s.ulcCost += num(r['Custo por Unique Link Click']) * ulc;
  });

  return {
    resultado: s.resultado,
    custoPorResultado: s.resultado > 0 ? s.resultadoCost / s.resultado : 0,
    initiate: s.initiate,
    custoPorInitiate: s.initiate > 0 ? s.initiateCost / s.initiate : 0,
    lpv: s.lpv,
    custoPorLpv: s.lpv > 0 ? s.lpvCost / s.lpv : 0,
    cpm: s.impressions > 0 ? s.cpmWeighted / s.impressions : 0,
    frequency: s.reach > 0 ? s.impressions / s.reach : 0,
    reach: s.reach,
    impressions: s.impressions,
    ulc: s.ulc,
    custoPorUlc: s.ulc > 0 ? s.ulcCost / s.ulc : 0,
    uniqueCtr: s.reach > 0 ? (s.ulc / s.reach) * 100 : 0,
    lpvRate: s.ulc > 0 ? (s.lpv / s.ulc) * 100 : 0,
  };
}

function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function destroyChart(id) {
  if (state.charts[id]) { state.charts[id].destroy(); delete state.charts[id]; }
}

function lineChart(canvasId, labels, values, colorVar, valueFormatter) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId).getContext('2d');
  const color = themeColor(colorVar);
  const grid = themeColor('--gridline');
  const muted = themeColor('--muted');
  state.charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        tension: 0.15,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (item) => valueFormatter(item.parsed.y) },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
        y: { grid: { color: grid }, ticks: { color: muted, callback: (v) => valueFormatter(v) }, beginAtZero: true },
      },
    },
  });
}

function renderKpis(agg) {
  const items = [
    ['Resultado', fmtInt(agg.resultado)],
    ['Custo por Resultado', fmtMoney(agg.custoPorResultado)],
    ['Initiate Checkout', fmtInt(agg.initiate)],
    ['Custo por Initiate Checkout', fmtMoney(agg.custoPorInitiate)],
    ['Landing Page Views', fmtInt(agg.lpv)],
    ['Custo por Landing Page View', fmtMoney(agg.custoPorLpv)],
    ['Unique CTR (Link)', fmtPct(agg.uniqueCtr)],
    ['LPV Rate por Link Clicks', fmtPct(agg.lpvRate)],
    ['CPM', fmtMoney(agg.cpm)],
    ['Frequency', agg.frequency.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ['Reach', fmtInt(agg.reach)],
    ['Impressions', fmtInt(agg.impressions)],
    ['Unique Link Clicks', fmtInt(agg.ulc)],
    ['Custo por Unique Link Click', fmtMoney(agg.custoPorUlc)],
  ];
  const grid = document.getElementById('kpi-grid');
  grid.innerHTML = items.map(([label, value]) => `
    <div class="stat-tile">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
    </div>
  `).join('');
}

function renderTable(level, rows) {
  const nameCols = level.nameCols;
  const grouped = groupBy(rows, (r) => nameCols.map((c) => r[c]).join(' | '));
  const entries = Array.from(grouped.entries()).map(([key, groupRows]) => {
    const agg = aggregate(groupRows);
    const lastRow = groupRows[groupRows.length - 1];
    return { names: key.split(' | '), budget: lastRow['Orçamento'] || '—', agg };
  });
  entries.sort((a, b) => b.agg.resultado - a.agg.resultado);

  const thead = `<tr>${nameCols.map((c) => `<th>${c}</th>`).join('')}<th>Orçamento</th><th>Resultado</th><th>Custo/Resultado</th><th>CPM</th><th>Reach</th><th>Impressions</th></tr>`;
  const tbody = entries.map((e) => `
    <tr>
      ${e.names.map((n) => `<td>${n || '—'}</td>`).join('')}
      <td>${e.budget}</td>
      <td class="num">${fmtInt(e.agg.resultado)}</td>
      <td class="num">${fmtMoney(e.agg.custoPorResultado)}</td>
      <td class="num">${fmtMoney(e.agg.cpm)}</td>
      <td class="num">${fmtInt(e.agg.reach)}</td>
      <td class="num">${fmtInt(e.agg.impressions)}</td>
    </tr>
  `).join('');

  document.getElementById('table-wrap').innerHTML = `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

function renderCharts(rows) {
  const byDate = groupBy(rows, (r) => r['Data']);
  const dates = Array.from(byDate.keys()).sort();
  const perDate = dates.map((d) => aggregate(byDate.get(d)));

  lineChart('chart-resultado', dates, perDate.map((a) => a.resultado), '--series-1', fmtInt);
  lineChart('chart-custo-resultado', dates, perDate.map((a) => a.custoPorResultado), '--series-2', fmtMoney);
  lineChart('chart-cpm', dates, perDate.map((a) => a.cpm), '--series-3', fmtMoney);
}

function renderLevel(levelKey) {
  const level = LEVELS.find((l) => l.key === levelKey);
  const rows = state.data[level.sheetName] || [];
  state.activeLevel = levelKey;

  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.level === levelKey));

  if (rows.length === 0) {
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('dashboard-content').style.display = 'none';
    return;
  }
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('dashboard-content').style.display = 'block';

  renderKpis(aggregate(rows));
  renderCharts(rows);
  renderTable(level, rows);
}

async function loadAll() {
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Carregando dados da planilha…';
  try {
    for (const level of LEVELS) {
      state.data[level.sheetName] = await fetchSheet(level.sheetName);
    }
    statusEl.textContent = 'Atualizado em ' + new Date().toLocaleString('pt-BR');
    renderLevel(state.activeLevel);
  } catch (err) {
    statusEl.textContent = '';
    document.getElementById('error-state').style.display = 'block';
    document.getElementById('error-state').textContent = err.message;
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => renderLevel(tab.dataset.level));
  });
  document.getElementById('refresh-btn').addEventListener('click', loadAll);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => renderLevel(state.activeLevel));
  loadAll();
});
