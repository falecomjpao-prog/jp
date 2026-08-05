import { icon } from "./icons.js";
import { MONTHS, CURRENT_MONTH_KEY } from "./data.js";

const PARAM = "mes";

export function getSelectedMonthKey() {
  const fromUrl = new URLSearchParams(location.search).get(PARAM);
  return MONTHS.some((m) => m.key === fromUrl) ? fromUrl : CURRENT_MONTH_KEY;
}

function setSelectedMonthKey(key) {
  const url = new URL(location.href);
  url.searchParams.set(PARAM, key);
  history.replaceState(null, "", url);
}

/**
 * Renderiza a barra superior (marca, tabs Dashboard/Evolução e seletor de mês)
 * dentro de `container`, e chama `onMonthChange(key)` sempre que o mês mudar.
 */
export function renderTopNav(container, { activePage, monthKey, onMonthChange }) {
  const withMonth = (href) => `${href}?${PARAM}=${monthKey}`;

  container.innerHTML = `
    <div class="brand">
      <span class="brand-mark">${icon("trendingUp")}</span>
      MyDose Performance
    </div>
    <nav class="tabs">
      <a class="tab ${activePage === "dashboard" ? "active" : ""}" href="${withMonth("index.html")}">
        ${icon("layoutGrid")} Dashboard
      </a>
      <a class="tab ${activePage === "evolucao" ? "active" : ""}" href="${withMonth("evolucao.html")}">
        ${icon("lineChart")} Evolução
      </a>
      <a class="tab ${activePage === "anuncios" ? "active" : ""}" href="${withMonth("anuncios.html")}">
        ${icon("megaphone")} Anúncios
      </a>
    </nav>
    <div class="month-rail" id="month-rail"></div>
  `;

  const rail = container.querySelector("#month-rail");
  rail.innerHTML = MONTHS.map(
    (m) => `<button type="button" class="month-pill ${m.key === monthKey ? "active" : ""}" data-month="${m.key}">${m.label}</button>`
  ).join("");

  rail.querySelectorAll(".month-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.month;
      setSelectedMonthKey(key);
      rail.querySelectorAll(".month-pill").forEach((b) => b.classList.toggle("active", b === btn));
      onMonthChange(key);
    });
  });

  // mantém o mês selecionado ao trocar de aba (Dashboard <-> Evolução)
  container.querySelectorAll(".tab").forEach((a) => {
    a.addEventListener("click", () => setSelectedMonthKey(monthKey));
  });

  // deixa o mês ativo visível no scroll horizontal
  const activeBtn = rail.querySelector(".month-pill.active");
  if (activeBtn) activeBtn.scrollIntoView({ inline: "center", block: "nearest" });
}
