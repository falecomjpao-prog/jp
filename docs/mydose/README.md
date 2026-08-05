# MyDose Performance — Dashboard (front-end)

Front-end puro (HTML/CSS/JS, sem build step), no mesmo padrão do dashboard
que já existe em `docs/index.html`. Ainda **não está ligado a nenhum
backend** — todos os números vêm de `data.js`, propositalmente estruturado
pra ficar fácil de trocar depois pela integração real (Meta Ads / CRM).

## Páginas

- `index.html` — Dashboard: comparação de mês, metas (MQL/SQL), cards de
  métricas e tabela de performance por canal.
- `evolucao.html` — Evolução: gráficos de linha mês a mês pra cada métrica
  principal.
- `anuncios.html` — Anúncios: filtro de "somente ativos" + busca por
  nomenclatura, agrupados por nome do anúncio (várias variações do mesmo
  `AD32 - RMKT HOME - Copy` viram um grupo, com uma linha TOTAL combinando
  os KPIs — ver regra de agregação abaixo).

As três compartilham a barra superior (marca, tabs e seletor de mês) via
`nav.js`, e o mês selecionado é preservado na URL (`?mes=2026-07`) ao
navegar entre elas.

## Agregação de anúncios (Invest./Compras/CPA/CPL/…)

`ads.js` agrupa por `adName` e junta os KPIs de cada grupo seguindo uma
regra fixa — nunca hardcoded métrica por métrica:

- **Somável** (conta bruta): Investimento, Compras, Leads, Cliques,
  Page Views, Initiate Checkout, Alcance, Impressões. Combina vários
  anúncios com o mesmo nome? Soma direto.
- **Derivada** (razão entre duas somáveis: custo por X, CPM, CTR,
  frequência): **nunca** é a média das razões de cada linha — sempre
  recalculada como `soma do numerador / soma do denominador` depois de
  agregar. É a mesma lógica que o Meta Ads Manager usa quando você
  seleciona várias linhas e ele soma a coluna.

Isso é declarado uma vez em `ads.js` (`BASE_METRICS` + `DERIVED_METRICS`);
pra adicionar uma métrica nova no futuro, basta declarar se ela é soma ou
razão — nenhuma lógica de agregação nova precisa ser escrita por métrica.

## Estrutura

| Arquivo | O que faz |
|---|---|
| `data.js` | Dados mockados + `fetchDashboardData(mes)` / `fetchEvolutionData()`. **É aqui que entra a API real depois** — só trocar o corpo dessas duas funções por `fetch(...)`, mantendo o mesmo formato de retorno. |
| `ads.js` | Dados mockados de anúncios + `aggregateAds()`/`withDerivedMetrics()` (regra de agregação soma vs. derivada, ver acima) + `groupAdsByName()`. |
| `nav.js` | Barra superior (marca, tabs Dashboard/Evolução/Anúncios, seletor de mês). |
| `dashboard.js` | Monta a página do Dashboard a partir de `fetchDashboardData`. |
| `evolucao.js` | Monta a página de Evolução a partir de `fetchEvolutionData`. |
| `anuncios.js` | Monta a página de Anúncios: filtro de ativos, busca por nome, tabela agrupada e ordenável. |
| `linechart.js` | Mini gráfico de linha em SVG (sem dependência externa), com crosshair + tooltip no hover. |
| `icons.js` | Ícones inline (SVG outline, sem emoji). |
| `format.js` | Formatação de moeda/percentual/inteiro em pt-BR. |
| `style.css` | Estilos compartilhados (paleta validada — ver `.claude/skills/ui-ux-pro-max` e a skill `dataviz` desta sessão). Suporta modo claro/escuro automático (`prefers-color-scheme`). |

## Plugando o backend depois

1. Em `data.js`, troque o corpo de `fetchDashboardData(monthKey)` por uma
   chamada real (`fetch('/api/dashboard?mes=' + monthKey)`), mantendo as
   mesmas chaves de retorno (`goals`, `kpis`, `canais`).
2. Troque `fetchEvolutionData()` por uma chamada que devolva um array com
   um item por mês, no mesmo formato.
3. Em `ads.js`, troque `fetchAdsData()` por uma chamada que devolva a lista
   crua de anúncios (uma linha por `ad_id`, só métricas base — `spend`,
   `compra`, `lead`, etc.). `aggregateAds`/`withDerivedMetrics` continuam
   calculando as derivadas no front, então o backend não precisa mandar
   `custo_por_compra` já pronto.
4. Nenhum outro arquivo precisa mudar — `dashboard.js`, `evolucao.js`,
   `anuncios.js` e o CSS já consomem esse formato.

## Rodar localmente

Sem build step. Basta servir a pasta como arquivo estático:

```bash
cd docs/mydose
python3 -m http.server 8080
# abrir http://localhost:8080/index.html
```
