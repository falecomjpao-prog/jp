-- Rode isso no Supabase: SQL Editor > New query > cola e clica em Run.
-- Cria 3 tabelas (uma por nível) pros dados do Google Ads.

create table if not exists public.google_ads_insights_campaign (
  id bigint generated always as identity primary key,
  date date not null,
  campaign_id text not null,
  campaign_name text not null,
  status text,
  budget_amount numeric,
  spend numeric default 0,
  compra numeric default 0,
  custo_por_compra numeric,
  lead numeric default 0,
  custo_por_lead numeric,
  impressions numeric default 0,
  clicks numeric default 0,
  ctr numeric,
  cpc_medio numeric,
  synced_at timestamptz not null default now(),
  unique (date, campaign_id)
);

create table if not exists public.google_ads_insights_adgroup (
  id bigint generated always as identity primary key,
  date date not null,
  campaign_id text not null,
  campaign_name text not null,
  ad_group_id text not null,
  ad_group_name text not null,
  status text,
  spend numeric default 0,
  compra numeric default 0,
  custo_por_compra numeric,
  lead numeric default 0,
  custo_por_lead numeric,
  impressions numeric default 0,
  clicks numeric default 0,
  ctr numeric,
  cpc_medio numeric,
  synced_at timestamptz not null default now(),
  unique (date, ad_group_id)
);

create table if not exists public.google_ads_insights_ad (
  id bigint generated always as identity primary key,
  date date not null,
  campaign_id text not null,
  campaign_name text not null,
  ad_group_id text not null,
  ad_group_name text not null,
  ad_id text not null,
  ad_name text,
  status text,
  spend numeric default 0,
  compra numeric default 0,
  custo_por_compra numeric,
  lead numeric default 0,
  custo_por_lead numeric,
  impressions numeric default 0,
  clicks numeric default 0,
  ctr numeric,
  cpc_medio numeric,
  synced_at timestamptz not null default now(),
  unique (date, ad_id)
);

alter table public.google_ads_insights_campaign enable row level security;
alter table public.google_ads_insights_adgroup enable row level security;
alter table public.google_ads_insights_ad enable row level security;

create policy "Public read access" on public.google_ads_insights_campaign for select to anon using (true);
create policy "Public read access" on public.google_ads_insights_adgroup for select to anon using (true);
create policy "Public read access" on public.google_ads_insights_ad for select to anon using (true);

-- Só a Edge Function (service role key) consegue escrever nessas tabelas.
