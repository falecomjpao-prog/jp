// Mini gráfico de linha em SVG puro (sem dependência externa).
// Uma série por gráfico -> sem legenda (o título já nomeia a métrica).
// Segue os specs da skill dataviz: linha 2px, grid recessivo, crosshair + tooltip no hover.

const NS = "http://www.w3.org/2000/svg";
const PAD = { top: 14, right: 28, bottom: 26, left: 66 };

function el(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

export function renderLineChart(container, { labels, values, color, formatter }) {
  container.innerHTML = "";

  const width = container.clientWidth || 480;
  const height = 230;
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const maxVal = Math.max(1, ...values) * 1.15;
  const minVal = 0;

  const xAt = (i) => PAD.left + (plotW * i) / Math.max(1, values.length - 1);
  const yAt = (v) => PAD.top + plotH - (plotH * (v - minVal)) / (maxVal - minVal || 1);

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: `${height}px`,
    role: "img",
    "aria-label": "Gráfico de evolução mensal",
  });

  // gridlines + eixo y
  const steps = 4;
  for (let s = 0; s <= steps; s++) {
    const v = (maxVal / steps) * s;
    const y = yAt(v);
    svg.appendChild(el("line", { x1: PAD.left, x2: width - PAD.right, y1: y, y2: y, class: "chart-grid-line" }));
    const label = el("text", { x: PAD.left - 8, y: y + 3, class: "chart-axis-label", "text-anchor": "end" });
    label.textContent = formatter(v);
    svg.appendChild(label);
  }

  // eixo x — mostra no máximo ~6 rótulos, sempre com o primeiro e o último,
  // e nunca dois vizinhos colados na ponta.
  const lastIdx = labels.length - 1;
  const step = labels.length > 6 ? 2 : 1;
  let shown = [];
  for (let i = 0; i <= lastIdx; i += step) shown.push(i);
  if (shown[shown.length - 1] !== lastIdx) shown.push(lastIdx);
  if (shown.length >= 2 && lastIdx - shown[shown.length - 2] < step) {
    shown.splice(shown.length - 2, 1);
  }

  shown.forEach((i) => {
    const x = xAt(i);
    const anchor = i === 0 ? "start" : i === lastIdx ? "end" : "middle";
    const label = el("text", { x, y: height - 8, class: "chart-axis-label", "text-anchor": anchor });
    label.textContent = labels[i];
    svg.appendChild(label);
  });

  // linha + área
  const linePoints = values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
  const areaPoints = `${xAt(0)},${yAt(minVal)} ${linePoints} ${xAt(values.length - 1)},${yAt(minVal)}`;

  svg.appendChild(el("polygon", { points: areaPoints, fill: color, opacity: 0.12, stroke: "none" }));
  svg.appendChild(el("polyline", { points: linePoints, fill: "none", stroke: color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));

  // camada de hover
  const crosshair = el("line", { class: "chart-crosshair", y1: PAD.top, y2: PAD.top + plotH, opacity: 0 });
  const dot = el("circle", { r: 4.5, fill: color, class: "chart-hover-dot", opacity: 0 });
  svg.appendChild(crosshair);
  svg.appendChild(dot);

  const overlay = el("rect", {
    x: PAD.left,
    y: PAD.top,
    width: Math.max(0, plotW),
    height: Math.max(0, plotH),
    fill: "transparent",
    style: "cursor:crosshair",
  });
  svg.appendChild(overlay);

  const wrap = document.createElement("div");
  wrap.className = "chart-svg-wrap";
  wrap.appendChild(svg);

  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  wrap.appendChild(tooltip);

  function nearestIndex(mouseX) {
    let best = 0;
    let bestDist = Infinity;
    values.forEach((_, i) => {
      const d = Math.abs(xAt(i) - mouseX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  overlay.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const i = nearestIndex(mouseX);
    const x = xAt(i);
    const y = yAt(values[i]);

    crosshair.setAttribute("x1", x);
    crosshair.setAttribute("x2", x);
    crosshair.setAttribute("opacity", 1);
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("opacity", 1);

    tooltip.style.opacity = 1;
    tooltip.style.left = `${(x / width) * 100}%`;
    tooltip.style.top = `${Math.max(0, (y / height) * 100 - 12)}%`;
    tooltip.innerHTML = `<strong>${labels[i]}</strong><br>${formatter(values[i])}`;
  });

  overlay.addEventListener("mouseleave", () => {
    crosshair.setAttribute("opacity", 0);
    dot.setAttribute("opacity", 0);
    tooltip.style.opacity = 0;
  });

  container.appendChild(wrap);
}
