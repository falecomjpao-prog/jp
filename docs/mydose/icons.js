// Ícones inline (stroke, sem emoji) — mesmo conjunto usado no topo e nos cards.
// Baseados em outline 24x24, stroke-width controlado via CSS (.icon).

const PATHS = {
  history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 3"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h13l-3 4.5L18 13H5"/>',
  dollar: '<path d="M12 2v20"/><path d="M17 5.5c0-1.9-2.2-3.5-5-3.5S7 3.6 7 5.5 9.2 9 12 9s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5"/>',
  trendingUp: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  activity: '<path d="M22 12h-4l-3 8-6-16-3 8H2"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/>',
  cursor: '<path d="M4 4l7 17 2.5-7.5L21 11 4 4Z"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  zap: '<path d="M12 2 4 13h7l-1 9 9-13h-7l1-9Z"/>',
  briefcase: '<rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  layoutGrid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  lineChart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
  chevronLeft: '<path d="m15 5-7 7 7 7"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  externalLink: '<path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M19 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  megaphone: '<path d="M3 11v2a2 2 0 0 0 2 2h1l3 6h2l-1-6h2l7 4V5l-7 4H8l-3 0a2 2 0 0 0-2 2Z"/><path d="M13 9v6"/>',
};

export function icon(name, extraClass = "") {
  const d = PATHS[name] ?? "";
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24">${d}</svg>`;
}
