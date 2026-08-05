# MyDose Performance — Dashboard (front-end)

Front-end puro (HTML/CSS/JS, sem build step), no mesmo padrão do dashboard
que já existe em `docs/index.html`. Ainda **não está ligado a nenhum
backend** — todos os números vêm de `data.js`, propositalmente estruturado
pra ficar fácil de trocar depois pela integração real (Meta Ads / CRM).

## Páginas

- `index.html` — Dashboard: comparação de mês, metas (MQL/SQL), cards de
  métricas, tabela de performance por canal e melhores criativos.
- `evolucao.html` — Evolução: gráficos de linha mês a mês pra cada métrica
  principal.

Ambas compartilham a barra superior (marca, tabs e seletor de mês) via
`nav.js`, e o mês selecionado é preservado na URL (`?mes=2026-07`) ao
navegar entre as duas.

## Estrutura

| Arquivo | O que faz |
|---|---|
| `data.js` | Dados mockados + `fetchDashboardData(mes)` / `fetchEvolutionData()`. **É aqui que entra a API real depois** — só trocar o corpo dessas duas funções por `fetch(...)`, mantendo o mesmo formato de retorno. |
| `nav.js` | Barra superior (marca, tabs Dashboard/Evolução, seletor de mês). |
| `dashboard.js` | Monta a página do Dashboard a partir de `fetchDashboardData`. |
| `evolucao.js` | Monta a página de Evolução a partir de `fetchEvolutionData`. |
| `linechart.js` | Mini gráfico de linha em SVG (sem dependência externa), com crosshair + tooltip no hover. |
| `icons.js` | Ícones inline (SVG outline, sem emoji). |
| `format.js` | Formatação de moeda/percentual/inteiro em pt-BR. |
| `style.css` | Estilos compartilhados (paleta validada — ver `.claude/skills/ui-ux-pro-max` e a skill `dataviz` desta sessão). Suporta modo claro/escuro automático (`prefers-color-scheme`). |

## Plugando o backend depois

1. Em `data.js`, troque o corpo de `fetchDashboardData(monthKey)` por uma
   chamada real (`fetch('/api/dashboard?mes=' + monthKey)`), mantendo as
   mesmas chaves de retorno (`goals`, `kpis`, `canais`, `criativos`).
2. Troque `fetchEvolutionData()` por uma chamada que devolva um array com
   um item por mês, no mesmo formato.
3. Nenhum outro arquivo precisa mudar — `dashboard.js`, `evolucao.js` e o
   CSS já consomem esse formato.

## Rodar localmente

Sem build step. Basta servir a pasta como arquivo estático:

```bash
cd docs/mydose
python3 -m http.server 8080
# abrir http://localhost:8080/index.html
```
