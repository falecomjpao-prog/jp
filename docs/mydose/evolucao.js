import { fetchEvolutionData } from "./data.js";
import { renderTopNav, getSelectedMonthKey } from "./nav.js";
import { fmtMoneyBRLCompact, fmtUsd, fmtInt, fmtPct } from "./format.js";
import { renderLineChart } from "./linechart.js";

const nav = document.getElementById("app-nav");
const grid = document.getElementById("chart-grid");

const root = getComputedStyle(document.documentElement);
const cssVar = (name) => root.getPropertyValue(name).trim();

const COLORS = {
  blue: cssVar("--cat-blue"),
  aqua: cssVar("--cat-aqua"),
  violet: cssVar("--cat-violet"),
  magenta: cssVar("--cat-magenta"),
  orange: cssVar("--cat-orange"),
};

// Cada gráfico é uma série única (o título já nomeia a métrica), então
// nenhum precisa de legenda — ver dataviz skill, regra de single-series.
const CHART_DEFS = [
  { key: "investimento", title: "Investimento Total", color: COLORS.blue, formatter: fmtMoneyBRLCompact, get: (d) => d.kpis.investimentoTotal.value },
  { key: "faturamento", title: "Faturamento Total (TCV)", color: COLORS.aqua, formatter: fmtMoneyBRLCompact, get: (d) => d.kpis.faturamentoTotal.value },
  { key: "clientes", title: "Novos Clientes", color: COLORS.violet, formatter: fmtInt, get: (d) => d.kpis.novosClientes.value },
  { key: "mql", title: "MQL (Leads)", color: COLORS.blue, formatter: fmtInt, get: (d) => d.kpis.mql.value },
  { key: "sql", title: "SQL (Agendados)", color: COLORS.violet, formatter: fmtInt, get: (d) => d.kpis.sql.value },
  { key: "opp", title: "OPP (Realizados)", color: COLORS.magenta, formatter: fmtInt, get: (d) => d.kpis.opp.value },
  { key: "cpm", title: "CPM Médio (USD)", color: COLORS.blue, formatter: fmtUsd, get: (d) => d.kpis.cpmMedio.value },
  { key: "ctr", title: "CTR Médio", color: COLORS.aqua, formatter: (n) => fmtPct(n), get: (d) => d.kpis.ctrMedio.value },
  { key: "comunidade", title: "Taxa Comunidade", color: COLORS.orange, formatter: (n) => fmtPct(n), get: (d) => d.kpis.taxaComunidade.value },
];

function renderCharts(series) {
  grid.innerHTML = "";
  const labels = series.map((s) => s.month.label);

  CHART_DEFS.forEach((def) => {
    const card = document.createElement("div");
    card.className = "chart-card";
    card.innerHTML = `<div class="chart-card-head"><h3>${def.title}</h3></div><div class="chart-mount"></div>`;
    grid.appendChild(card);

    const values = series.map((s) => def.get(s));
    renderLineChart(card.querySelector(".chart-mount"), {
      labels,
      values,
      color: def.color,
      formatter: def.formatter,
    });
  });
}

async function render() {
  const series = await fetchEvolutionData();
  renderCharts(series);
}

const initialMonth = getSelectedMonthKey();
renderTopNav(nav, {
  activePage: "evolucao",
  monthKey: initialMonth,
  onMonthChange: () => {}, // Evolução mostra a série completa; o mês só é preservado ao voltar pro Dashboard
});
render();
