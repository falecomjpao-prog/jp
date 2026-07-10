// Supabase Edge Function — busca dados do Meta Ads (Graph Marketing API) e
// grava nas 3 tabelas do Supabase. Roda no servidor: o token do Meta nunca
// fica exposto no navegador do cliente.
//
// Secrets necessários (Supabase > Edge Functions > sync-meta-ads > Secrets):
//   META_ACCESS_TOKEN    - token do system user gerado na Business Manager
//   META_AD_ACCOUNT_ID   - ex: act_5914817155286462
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm prontos automaticamente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_VERSION = "v21.0";
const DAYS_BACK = 30;

const ACTION_TYPE_PRIORITY: Record<string, string[]> = {
  purchase: ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase", "onsite_conversion.purchase"],
  lead: ["onsite_conversion.lead_grouped", "omni_lead", "lead", "offsite_conversion.fb_pixel_lead"],
  initiate_checkout: [
    "omni_initiated_checkout",
    "initiate_checkout",
    "offsite_conversion.fb_pixel_initiate_checkout",
    "onsite_conversion.initiate_checkout",
  ],
};

type Action = { action_type: string; value: string };

function actionValue(actions: Action[] | undefined, key: string): number {
  if (!actions) return 0;
  for (const type of ACTION_TYPE_PRIORITY[key]) {
    const found = actions.find((a) => a.action_type === type);
    if (found) return parseFloat(found.value || "0");
  }
  return 0;
}

function costValue(costs: Action[] | undefined, key: string): number | null {
  if (!costs) return null;
  for (const type of ACTION_TYPE_PRIORITY[key]) {
    const found = costs.find((c) => c.action_type === type);
    if (found) return parseFloat(found.value);
  }
  return null;
}

function sumByKeyword(actions: Action[] | undefined, keywords: string[]): number {
  if (!actions) return 0;
  return actions
    .filter((a) => a.action_type && keywords.some((k) => a.action_type.includes(k)))
    .reduce((sum, a) => sum + parseFloat(a.value || "0"), 0);
}

function costByKeyword(costs: Action[] | undefined, keywords: string[]): number | null {
  if (!costs) return null;
  const found = costs.find((c) => c.action_type && keywords.some((k) => c.action_type.includes(k)));
  return found ? parseFloat(found.value) : null;
}

function safeDiv(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

function round2(n: number | null): number | null {
  return n === null || isNaN(n) ? n : Math.round(n * 100) / 100;
}

async function fetchAllPaginated(url: string): Promise<any[]> {
  const results: any[] = [];
  let next: string | null = url;
  while (next) {
    const res = await fetch(next);
    const payload = await res.json();
    if (payload.error) throw new Error("Erro na API do Meta: " + payload.error.message);
    results.push(...(payload.data || []));
    next = payload.paging?.next || null;
  }
  return results;
}

function formatBudget(meta: any): { amount: number | null; type: string | null } {
  if (!meta) return { amount: null, type: null };
  if (meta.daily_budget) return { amount: parseFloat(meta.daily_budget) / 100, type: "daily" };
  if (meta.lifetime_budget) return { amount: parseFloat(meta.lifetime_budget) / 100, type: "lifetime" };
  return { amount: null, type: null };
}

Deno.serve(async (_req) => {
  try {
    const token = Deno.env.get("META_ACCESS_TOKEN");
    const adAccountId = Deno.env.get("META_AD_ACCOUNT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!token || !adAccountId) {
      return new Response(
        JSON.stringify({ error: "Configure META_ACCESS_TOKEN e META_AD_ACCOUNT_ID nos secrets da função." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateTo.getDate() - DAYS_BACK);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const timeRange = encodeURIComponent(JSON.stringify({ since: fmt(dateFrom), until: fmt(dateTo) }));

    const campaignsRaw = await fetchAllPaginated(
      `https://graph.facebook.com/${API_VERSION}/${adAccountId}/campaigns?fields=id,daily_budget,lifetime_budget,effective_status&limit=500&access_token=${token}`
    );
    const campaignsMeta = new Map(campaignsRaw.map((c: any) => [c.id, c]));

    const adsetsRaw = await fetchAllPaginated(
      `https://graph.facebook.com/${API_VERSION}/${adAccountId}/adsets?fields=id,campaign_id,daily_budget,lifetime_budget,effective_status&limit=500&access_token=${token}`
    );
    const adsetsMeta = new Map(adsetsRaw.map((a: any) => [a.id, a]));

    const adsFields = encodeURIComponent("id,effective_status,creative{thumbnail_url,instagram_permalink_url}");
    const adsRaw = await fetchAllPaginated(
      `https://graph.facebook.com/${API_VERSION}/${adAccountId}/ads?fields=${adsFields}&limit=500&access_token=${token}`
    );
    const adsMeta = new Map(adsRaw.map((a: any) => [a.id, a]));

    async function syncLevel(level: "campaign" | "adset" | "ad") {
      const insightFields =
        level === "campaign"
          ? "campaign_id,campaign_name"
          : level === "adset"
          ? "campaign_id,campaign_name,adset_id,adset_name"
          : "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name";
      const commonFields = "spend,impressions,reach,frequency,cpm,actions,unique_actions,cost_per_action_type";
      const url = `https://graph.facebook.com/${API_VERSION}/${adAccountId}/insights?fields=${insightFields},${commonFields}&level=${level}&time_increment=1&time_range=${timeRange}&limit=500&access_token=${token}`;
      const rawRows = await fetchAllPaginated(url);

      const rows = rawRows.map((raw: any) => {
        const actions: Action[] = raw.actions || [];
        const uniqueActions: Action[] = raw.unique_actions || [];
        const costs: Action[] = raw.cost_per_action_type || [];
        const spend = parseFloat(raw.spend || "0");
        const reach = parseFloat(raw.reach || "0");

        const linkClicks = sumByKeyword(uniqueActions, ["link_click"]);
        const lpv = sumByKeyword(actions, ["landing_page_view"]);
        const compra = actionValue(actions, "purchase");
        const custoPorCompra = costValue(costs, "purchase") ?? safeDiv(spend, compra);
        const lead = actionValue(actions, "lead");
        const custoPorLead = costValue(costs, "lead") ?? safeDiv(spend, lead);
        const initiateCheckout = actionValue(actions, "initiate_checkout");
        const custoPorInitiate = costValue(costs, "initiate_checkout") ?? safeDiv(spend, initiateCheckout);
        const custoPorLpv = costByKeyword(costs, ["landing_page_view"]) ?? safeDiv(spend, lpv);
        const custoPorUlc = safeDiv(spend, linkClicks);
        const uniqueCtr = reach > 0 ? round2((linkClicks / reach) * 100) : 0;
        const lpvRate = linkClicks > 0 ? round2((lpv / linkClicks) * 100) : 0;

        const campaignMeta = campaignsMeta.get(raw.campaign_id);
        const adsetMeta = level !== "campaign" ? adsetsMeta.get(raw.adset_id) : null;
        const adMeta = level === "ad" ? adsMeta.get(raw.ad_id) : null;

        let budget = formatBudget(level === "campaign" ? campaignMeta : adsetMeta);
        if (level !== "campaign" && budget.amount === null) {
          budget = formatBudget(campaignMeta);
        }

        const status = level === "ad" ? adMeta?.effective_status : level === "adset" ? adsetMeta?.effective_status : campaignMeta?.effective_status;

        const base: Record<string, unknown> = {
          date: raw.date_start,
          campaign_id: raw.campaign_id,
          campaign_name: raw.campaign_name,
          status: status || null,
          budget_amount: budget.amount,
          budget_type: budget.type,
          compra,
          custo_por_compra: round2(custoPorCompra),
          lead,
          custo_por_lead: round2(custoPorLead),
          initiate_checkout: initiateCheckout,
          custo_por_initiate_checkout: round2(custoPorInitiate),
          unique_ctr_link: uniqueCtr,
          landing_page_views: lpv,
          custo_por_lpv: round2(custoPorLpv),
          cpm: raw.cpm ? parseFloat(raw.cpm) : null,
          frequency: raw.frequency ? parseFloat(raw.frequency) : null,
          reach,
          impressions: raw.impressions ? parseFloat(raw.impressions) : 0,
          custo_por_unique_link_click: round2(custoPorUlc),
          unique_link_clicks: linkClicks,
          lpv_rate: lpvRate,
          synced_at: new Date().toISOString(),
        };

        if (level === "adset" || level === "ad") {
          base.adset_id = raw.adset_id;
          base.adset_name = raw.adset_name;
        }
        if (level === "ad") {
          base.ad_id = raw.ad_id;
          base.ad_name = raw.ad_name;
          base.instagram_url = adMeta?.creative?.instagram_permalink_url || null;
          base.thumbnail_url = adMeta?.creative?.thumbnail_url || null;
        }
        return base;
      });

      const table = level === "campaign" ? "meta_insights_campaign" : level === "adset" ? "meta_insights_adset" : "meta_insights_ad";
      const conflictKey = level === "campaign" ? "date,campaign_id" : level === "adset" ? "date,adset_id" : "date,ad_id";

      if (rows.length > 0) {
        const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictKey });
        if (error) throw error;
      }
      return rows.length;
    }

    const counts = {
      campaign: await syncLevel("campaign"),
      adset: await syncLevel("adset"),
      ad: await syncLevel("ad"),
    };

    return new Response(JSON.stringify({ ok: true, counts }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
