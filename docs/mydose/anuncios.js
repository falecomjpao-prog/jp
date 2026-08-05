import { fetchAdsData, groupAdsByName, withDerivedMetrics } from "./ads.js";
import { icon } from "./icons.js";
import { renderTopNav, getSelectedMonthKey } from "./nav.js";
import { fmtMoneyBRL, fmtInt, fmtPct, fmtFreq, orDash } from "./format.js";

const nav = document.getElementById("app-nav");
const filterActive = document.getElementById("filter-active");
const filterSearch = document.getElementById("filter-search");
const filterSummary = document.getElementById("filter-summary");
const tableWrap = document.getElementById("ads-table-wrap");

let allRows = [];
let sortKey = "spend";
let sortDir = "desc";

const STATUS_LABELS = {
  ACTIVE: "Ativo",
  CAMPAIGN_PAUSED: "Campanha pausada",
  ADSET_PAUSED: "Conjunto pausado",
  PAUSED: "Pausado",
};

// Colunas da tabela: `key` bate com os campos somáveis/derivados de ads.js
// (ver a regra de agregação lá). `total: true` marca colunas onde o valor
// mostrado na linha TOTAL vem de `group.total`, calculado com soma real —
// nunca com média das linhas.
const COLUMNS = [
  { key: "spend", label: "Invest.", fmt: fmtMoneyBRL },
  { key: "compra", label: "Compras", fmt: fmtInt },
  { key: "custoPorCompra", label: "CPA", fmt: (n) => orDash(n, fmtMoneyBRL) },
  { key: "lead", label: "Leads", fmt: fmtInt },
  { key: "custoPorLead", label: "CPL", fmt: (n) => orDash(n, fmtMoneyBRL) },
  { key: "uniqueLinkClicks", label: "Cliques", fmt: fmtInt },
  { key: "custoPorUniqueLinkClick", label: "Custo/Clique", fmt: (n) => orDash(n, fmtMoneyBRL) },
  { key: "landingPageViews", label: "Page Views", fmt: fmtInt },
  { key: "custoPorLpv", label: "Custo/PV", fmt: (n) => orDash(n, fmtMoneyBRL) },
  { key: "cpm", label: "CPM", fmt: (n) => orDash(n, fmtMoneyBRL) },
  { key: "uniqueCtrLink", label: "CTR", fmt: (n) => orDash(n, fmtPct) },
  { key: "frequency", label: "Frequência", fmt: (n) => orDash(n, fmtFreq) },
  { key: "reach", label: "Alcance", fmt: fmtInt },
  { key: "impressions", label: "Impressões", fmt: fmtInt },
];

function statusPill(status) {
  if (!status) return "";
  return `<span class="status-pill">${STATUS_LABELS[status] ?? status}</span>`;
}

function nameCell(row) {
  return `
    <div class="ad-name-cell">
      <div class="ad-avatar">${icon("megaphone")}</div>
      <div class="ad-name-text">
        <div class="ad-name">${row.adName}</div>
        <div class="ad-campaign">${row.campaignName}</div>
        <a class="ad-instagram-link" href="${row.instagramUrl}" target="_blank" rel="noopener noreferrer">
          Instagram ${icon("externalLink")}
        </a>
      </div>
    </div>
  `;
}

function filteredGroups() {
  const term = filterSearch.value.trim().toLowerCase();
  const activeOnly = filterActive.checked;

  const rows = allRows.filter((r) => {
    if (activeOnly && r.status !== "ACTIVE") return false;
    if (term && !r.adName.toLowerCase().includes(term)) return false;
    return true;
  });

  let groups = groupAdsByName(rows);
  groups.forEach((g) => {
    g.rows = g.rows.map(withDerivedMetrics).sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
  });
  groups.sort((a, b) => {
    const va = a.total[sortKey] ?? 0;
    const vb = b.total[sortKey] ?? 0;
    return sortDir === "asc" ? va - vb : vb - va;
  });
  return groups;
}

function renderTable() {
  const groups = filteredGroups();

  const thead =
    `<th>Nome</th><th>Status</th>` +
    COLUMNS.map((c) => {
      const isSorted = c.key === sortKey;
      const arrow = isSorted ? (sortDir === "desc" ? "▾" : "▴") : "";
      return `<th class="sortable ${isSorted ? "sorted" : ""}" data-key="${c.key}">${c.label}<span class="sort-arrow">${arrow}</span></th>`;
    }).join("");

  const bodyParts = groups.map((g) => {
    const leafRows = g.rows
      .map(
        (r) => `
          <tr>
            <td>${nameCell(r)}</td>
            <td>${statusPill(r.status)}</td>
            ${COLUMNS.map((c) => `<td>${c.fmt(r[c.key])}</td>`).join("")}
          </tr>
        `
      )
      .join("");

    const totalRow = `
      <tr class="group-total-row">
        <td>
          <div class="group-total-label">TOTAL · ${g.total.usos} usos</div>
          <div class="group-total-sublabel">Totais e médias combinadas</div>
        </td>
        <td></td>
        ${COLUMNS.map((c) => `<td>${c.fmt(g.total[c.key])}</td>`).join("")}
      </tr>
    `;

    return leafRows + (g.rows.length > 1 ? totalRow : "");
  });

  tableWrap.innerHTML = `
    <table class="funnel-table ads-table">
      <thead><tr>${thead}</tr></thead>
      <tbody>${bodyParts.join("")}</tbody>
    </table>
  `;

  tableWrap.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (key === sortKey) sortDir = sortDir === "desc" ? "asc" : "desc";
      else {
        sortKey = key;
        sortDir = "desc";
      }
      renderTable();
    });
  });

  const groupCount = groups.length;
  const rowCount = groups.reduce((sum, g) => sum + g.rows.length, 0);
  filterSummary.textContent = `${groupCount} nomenclatura(s) · ${rowCount} anúncio(s)`;
}

async function render(monthKey) {
  allRows = await fetchAdsData(monthKey);
  renderTable();
}

filterActive.addEventListener("change", renderTable);
filterSearch.addEventListener("input", renderTable);

const initialMonth = getSelectedMonthKey();
renderTopNav(nav, {
  activePage: "anuncios",
  monthKey: initialMonth,
  onMonthChange: (key) => render(key),
});
render(initialMonth);
