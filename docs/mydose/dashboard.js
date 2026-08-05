import { fetchDashboardData } from "./data.js";
import { icon } from "./icons.js";
import { renderTopNav, getSelectedMonthKey } from "./nav.js";
import { fmtMoneyBRL, fmtUsd, fmtInt, fmtPct, fmtRoas, fmtDeltaPct } from "./format.js";

const nav = document.getElementById("app-nav");
const infoBar = document.getElementById("info-bar");
const row1 = document.getElementById("kpi-row-1");
const strip = document.getElementById("receita-strip");
const row2 = document.getElementById("kpi-row-2");
const row3 = document.getElementById("kpi-row-3");
const tableWrap = document.getElementById("funnel-table-wrap");
const creativeGrid = document.getElementById("creative-grid");

let sortKey = "faturamento";
let sortDir = "desc";
let currentCanais = [];

function badgeHtml(deltaObj) {
  if (!deltaObj) return "";
  const arrow = deltaObj.direction === "up" ? "↗" : "↘";
  const cls = deltaObj.good ? "good" : "bad";
  return `<span class="kpi-badge ${cls}">${arrow} ${fmtDeltaPct(deltaObj.pct).replace("+", "")}</span>`;
}

function kpiCard({ label, iconName, accent, value, deltaObj, subleft, subright }) {
  return `
    <div class="kpi-card" style="--accent:${accent}">
      <div class="kpi-head">
        <div class="kpi-label">${label}</div>
        <div class="kpi-icon">${icon(iconName)}</div>
      </div>
      <div class="kpi-value-row">
        <span class="kpi-value">${value}</span>
        ${badgeHtml(deltaObj)}
      </div>
      <div class="kpi-foot">
        <span>${subleft ?? ""}</span>
        <span class="prev">${subright ?? ""}</span>
      </div>
    </div>
  `;
}

function renderInfoBar(d) {
  const mqlPct = Math.min(100, (d.goals.mql.current / d.goals.mql.target) * 100);
  const sqlPct = Math.min(100, (d.goals.sql.current / d.goals.sql.target) * 100);

  infoBar.innerHTML = `
    <div class="info-pill info-pill--compare">
      ${icon("history")}
      <span>Comparando <strong>${d.month.label}</strong> com <strong>${d.prevMonthLabel}</strong></span>
    </div>
    <div class="info-pill info-pill--goals">
      ${icon("flag")}
      <strong style="white-space:nowrap;">Metas ${d.month.label}</strong>
      <div class="goal-track-group">
        <div class="goal-track">
          <div class="goal-track-head">
            <span>MQL: <strong>${fmtInt(d.goals.mql.current)} / ${fmtInt(d.goals.mql.target)}</strong></span>
            <span>${fmtPct(mqlPct)}</span>
          </div>
          <div class="goal-track-bar"><div class="goal-track-fill mql" style="width:${mqlPct}%"></div></div>
        </div>
        <div class="goal-track">
          <div class="goal-track-head">
            <span>SQL: <strong>${fmtInt(d.goals.sql.current)} / ${fmtInt(d.goals.sql.target)}</strong></span>
            <span>${fmtPct(sqlPct)}</span>
          </div>
          <div class="goal-track-bar"><div class="goal-track-fill sql" style="width:${sqlPct}%"></div></div>
        </div>
      </div>
    </div>
  `;
}

function renderKpis(d) {
  const k = d.kpis;

  row1.innerHTML = [
    kpiCard({
      label: "Investimento Total",
      iconName: "dollar",
      accent: "var(--cat-blue)",
      value: fmtMoneyBRL(k.investimentoTotal.value),
      deltaObj: k.investimentoTotal.delta,
      subleft: k.investimentoTotal.sublabel,
      subright: "Prev: " + fmtMoneyBRL(k.investimentoTotal.prev),
    }),
    kpiCard({
      label: "Faturamento Total (TCV)",
      iconName: "trendingUp",
      accent: "var(--cat-aqua)",
      value: fmtMoneyBRL(k.faturamentoTotal.value),
      deltaObj: k.faturamentoTotal.delta,
      subleft: k.faturamentoTotal.sublabel,
      subright: "Prev: " + fmtMoneyBRL(k.faturamentoTotal.prev),
    }),
    kpiCard({
      label: "Novos Clientes",
      iconName: "users",
      accent: "var(--cat-violet)",
      value: fmtInt(k.novosClientes.value),
      deltaObj: k.novosClientes.delta,
      subleft: "",
      subright: "Prev: " + fmtInt(k.novosClientes.prev),
    }),
  ].join("");

  strip.innerHTML = `
    <div class="strip-label">
      <span class="kpi-icon">${icon("activity")}</span>
      Receita Realizada (Caixa):
    </div>
    <div class="strip-value">${fmtMoneyBRL(k.receitaRealizada)}</div>
  `;

  row2.innerHTML = [
    kpiCard({
      label: "CPM Médio (USD)",
      iconName: "eye",
      accent: "var(--cat-blue)",
      value: fmtUsd(k.cpmMedio.value),
      deltaObj: k.cpmMedio.delta,
      subleft: "Custo p/ mil",
      subright: "Prev: " + fmtUsd(k.cpmMedio.prev),
    }),
    kpiCard({
      label: "CTR Médio",
      iconName: "cursor",
      accent: "var(--cat-aqua)",
      value: fmtPct(k.ctrMedio.value),
      deltaObj: k.ctrMedio.delta,
      subleft: "Taxa de clique",
      subright: "Prev: " + fmtPct(k.ctrMedio.prev),
    }),
    kpiCard({
      label: "Taxa Comunidade",
      iconName: "percent",
      accent: "var(--cat-orange)",
      value: fmtPct(k.taxaComunidade.value),
      deltaObj: k.taxaComunidade.delta,
      subleft: "MQL → Comunidade",
      subright: "Prev: " + fmtPct(k.taxaComunidade.prev),
    }),
  ].join("");

  row3.innerHTML = [
    kpiCard({
      label: "MQL (Leads)",
      iconName: "target",
      accent: "var(--cat-blue)",
      value: fmtInt(k.mql.value),
      deltaObj: k.mql.delta,
      subleft: "Custo: " + fmtMoneyBRL(k.mql.custo),
      subright: "Prev: " + fmtInt(k.mql.prev),
    }),
    kpiCard({
      label: "SQL (Agendados)",
      iconName: "zap",
      accent: "var(--cat-violet)",
      value: fmtInt(k.sql.value),
      deltaObj: k.sql.delta,
      subleft: "Custo: " + fmtMoneyBRL(k.sql.custo),
      subright: "Prev: " + fmtInt(k.sql.prev),
    }),
    kpiCard({
      label: "OPP (Realizados)",
      iconName: "briefcase",
      accent: "var(--cat-violet)",
      value: fmtInt(k.opp.value),
      deltaObj: k.opp.delta,
      subleft: "Custo: " + fmtMoneyBRL(k.opp.custo),
      subright: "Prev: " + fmtInt(k.opp.prev),
    }),
  ].join("");
}

const COLUMNS = [
  { key: "origem", label: "Origem", align: "left" },
  { key: "mql", label: "MQL" },
  { key: "custoMql", label: "Custo MQL", money: true },
  { key: "sql", label: "SQL" },
  { key: "custoSql", label: "Custo SQL", money: true },
  { key: "opp", label: "OPP" },
  { key: "custoOpp", label: "Custo OPP", money: true },
  { key: "clientes", label: "Clientes" },
  { key: "receita", label: "Receita (Realizada)", money: true },
  { key: "faturamento", label: "Faturamento (TCV)", money: true },
  { key: "roas", label: "ROAS (TCV)" },
];

function sortedCanais() {
  const rows = [...currentCanais];
  rows.sort((a, b) => {
    const va = a[sortKey] ?? 0;
    const vb = b[sortKey] ?? 0;
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === "asc" ? va - vb : vb - va;
  });
  return rows;
}

function renderTable() {
  const rows = sortedCanais();

  const thead = COLUMNS.map((c) => {
    const isSorted = c.key === sortKey;
    const arrow = isSorted ? (sortDir === "desc" ? "▾" : "▴") : "";
    return `<th class="sortable ${isSorted ? "sorted" : ""}" data-key="${c.key}">${c.label}<span class="sort-arrow">${arrow}</span></th>`;
  }).join("");

  const tbody = rows
    .map((r) => {
      const roasClass = r.roas > 0 ? "positive" : "zero";
      return `
        <tr>
          <td>${r.origem}</td>
          <td>${fmtInt(r.mql)}</td>
          <td>${fmtMoneyBRL(r.custoMql)}</td>
          <td>${fmtInt(r.sql)}</td>
          <td>${fmtMoneyBRL(r.custoSql)}</td>
          <td>${fmtInt(r.opp)}</td>
          <td>${fmtMoneyBRL(r.custoOpp)}</td>
          <td class="cell-clientes">${fmtInt(r.clientes)}</td>
          <td class="cell-receita">${fmtMoneyBRL(r.receita)}</td>
          <td class="cell-faturamento">${fmtMoneyBRL(r.faturamento)}</td>
          <td><span class="roas-pill ${roasClass}">${fmtRoas(r.roas)}</span></td>
        </tr>
      `;
    })
    .join("");

  tableWrap.innerHTML = `
    <table class="funnel-table">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>
  `;

  tableWrap.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (key === sortKey) {
        sortDir = sortDir === "desc" ? "asc" : "desc";
      } else {
        sortKey = key;
        sortDir = "desc";
      }
      renderTable();
    });
  });
}

function renderCreatives(d) {
  creativeGrid.innerHTML = d.criativos
    .map(
      (c) => `
        <div class="creative-item">
          <div class="creative-item-head">
            <a class="creative-link" href="${c.link}" target="_blank" rel="noopener noreferrer">
              LINK ${icon("externalLink")}
            </a>
          </div>
          <div class="creative-thumb">${icon("image")}</div>
        </div>
      `
    )
    .join("");
}

async function render(monthKey) {
  const d = await fetchDashboardData(monthKey);
  currentCanais = d.canais;
  renderInfoBar(d);
  renderKpis(d);
  renderTable();
  renderCreatives(d);
}

const initialMonth = getSelectedMonthKey();
renderTopNav(nav, {
  activePage: "dashboard",
  monthKey: initialMonth,
  onMonthChange: (key) => render(key),
});
render(initialMonth);
