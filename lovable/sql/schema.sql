-- Rode isso no Supabase: SQL Editor > New query > cola e clica em Run.
-- Cria 3 tabelas (uma por nível) espelhando o que já existia na planilha.

create table if not exists public.meta_insights_campaign (
  id bigint generated always as identity primary key,
  date date not null,
  campaign_id text not null,
  campaign_name text not null,
  status text,
  budget_amount numeric,
  budget_type text check (budget_type in ('daily', 'lifetime')),
  spend numeric default 0,
  compra numeric default 0,
  custo_por_compra numeric,
  lead numeric default 0,
  custo_por_lead numeric,
  initiate_checkout numeric default 0,
  custo_por_initiate_checkout numeric,
  unique_ctr_link numeric,
  landing_page_views numeric default 0,
  custo_por_lpv numeric,
  cpm numeric,
  frequency numeric,
  reach numeric default 0,
  impressions numeric default 0,
  custo_por_unique_link_click numeric,
  unique_link_clicks numeric default 0,
  lpv_rate numeric,
  synced_at timestamptz not null default now(),
  unique (date, campaign_id)
);

create table if not exists public.meta_insights_adset (
  id bigint generated always as identity primary key,
  date date not null,
  campaign_id text not null,
  campaign_name text not null,
  adset_id text not null,
  adset_name text not null,
  status text,
  budget_amount numeric,
  budget_type text check (budget_type in ('daily', 'lifetime')),
  spend numeric default 0,
  compra numeric default 0,
  custo_por_compra numeric,
  lead numeric default 0,
  custo_por_lead numeric,
  initiate_checkout numeric default 0,
  custo_por_initiate_checkout numeric,
  unique_ctr_link numeric,
  landing_page_views numeric default 0,
  custo_por_lpv numeric,
  cpm numeric,
  frequency numeric,
  reach numeric default 0,
  impressions numeric default 0,
  custo_por_unique_link_click numeric,
  unique_link_clicks numeric default 0,
  lpv_rate numeric,
  synced_at timestamptz not null default now(),
  unique (date, adset_id)
);

create table if not exists public.meta_insights_ad (
  id bigint generated always as identity primary key,
  date date not null,
  campaign_id text not null,
  campaign_name text not null,
  adset_id text not null,
  adset_name text not null,
  ad_id text not null,
  ad_name text not null,
  status text,
  budget_amount numeric,
  budget_type text check (budget_type in ('daily', 'lifetime')),
  spend numeric default 0,
  compra numeric default 0,
  custo_por_compra numeric,
  lead numeric default 0,
  custo_por_lead numeric,
  initiate_checkout numeric default 0,
  custo_por_initiate_checkout numeric,
  unique_ctr_link numeric,
  landing_page_views numeric default 0,
  custo_por_lpv numeric,
  cpm numeric,
  frequency numeric,
  reach numeric default 0,
  impressions numeric default 0,
  custo_por_unique_link_click numeric,
  unique_link_clicks numeric default 0,
  lpv_rate numeric,
  instagram_url text,
  thumbnail_url text,
  synced_at timestamptz not null default now(),
  unique (date, ad_id)
);

alter table public.meta_insights_campaign enable row level security;
alter table public.meta_insights_adset enable row level security;
alter table public.meta_insights_ad enable row level security;

-- Leitura liberada pro dashboard funcionar sem login. Se seu app Lovable tiver
-- autenticação, troque "to anon" por "to authenticated" nas 3 policies abaixo.
create policy "Public read access" on public.meta_insights_campaign for select to anon using (true);
create policy "Public read access" on public.meta_insights_adset for select to anon using (true);
create policy "Public read access" on public.meta_insights_ad for select to anon using (true);

-- Não existe policy de INSERT/UPDATE pra "anon" de propósito: só a Edge Function
-- (que usa a service role key, com acesso total) consegue escrever nessas tabelas.

-- Se as tabelas já existiam antes da coluna "spend" ser adicionada acima, rode:
-- alter table public.meta_insights_campaign add column if not exists spend numeric default 0;
-- alter table public.meta_insights_adset add column if not exists spend numeric default 0;
-- alter table public.meta_insights_ad add column if not exists spend numeric default 0;
