# Meta Ads Dashboard — versão Lovable/Supabase

Mesma lógica do que já rodava no Google Sheets, só que agora os dados ficam
num banco Supabase (que o Lovable já integra nativamente) em vez de planilha.

## Passo a passo

1. **No Lovable**: abra o menu de integrações do projeto e conecte o Supabase
   (se ainda não estiver conectado). Isso cria `src/integrations/supabase/client.ts`
   automaticamente.

2. **Banco de dados**: no painel do Supabase → SQL Editor → New query → cole o
   conteúdo de `sql/schema.sql` → Run. Isso cria as 3 tabelas
   (`meta_insights_campaign`, `meta_insights_adset`, `meta_insights_ad`).

3. **Edge Function**: no painel do Supabase → Edge Functions → Create a new
   function → nome `sync-meta-ads` → cole o conteúdo de
   `supabase/functions/sync-meta-ads/index.ts` → Deploy.

4. **Secrets da função** (Edge Functions → sync-meta-ads → Secrets):
   - `META_ACCESS_TOKEN`: o token do system user que você já gerou na Business Manager.
   - `META_AD_ACCOUNT_ID`: `act_5914817155286462`.
   (`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente, não precisa criar.)

5. **Testar**: chame a função uma vez manualmente (botão "Invoke" no painel,
   ou `curl` na URL da função) e confira se as 3 tabelas foram preenchidas.

6. **Agendar** (pra atualizar sozinho todo dia): Supabase → Database → Cron Jobs
   → New Cron Job → escolha "Invoke a Supabase Edge Function", selecione
   `sync-meta-ads`, defina o horário (ex: todo dia às 6h). Sem isso os dados
   não atualizam sozinhos.

7. **Front-end**: copie `src/pages/MetaAdsDashboard.tsx` para dentro do seu
   projeto Lovable (`src/pages/`). Peça pro Lovable instalar a dependência
   `recharts` caso ainda não tenha (`npm install recharts` ou peça pra IA do
   Lovable fazer isso). Adicione uma rota pra essa página no seu roteador
   (ex: `<Route path="/dashboard" element={<MetaAdsDashboard />} />`).

## Observação de segurança

A policy de leitura das tabelas está liberada para "anon" (qualquer um com a
URL/chave pública do seu Supabase consegue ler os dados) — isso é necessário
pro dashboard funcionar sem exigir login. Se seu app Lovable tiver
autenticação de usuários, troque as policies em `sql/schema.sql` para
`to authenticated` em vez de `to anon`.
