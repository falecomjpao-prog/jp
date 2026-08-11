// Supabase Edge Function — busca dados do Google Ads (Google Ads API v24) e
// grava nas 3 tabelas do Supabase. Roda no servidor: as credenciais nunca
// ficam expostas no navegador do cliente.
//
// ATENÇÃO: esta função não foi testada contra a API real (o Developer Token
// ainda não tinha Basic Access aprovado no momento em que foi escrita, e o
// ambiente onde ela foi escrita não tem acesso à internet do Google Ads).
// É esperado que a primeira invocação real possa retornar algum erro que
// precise de um ajuste pontual — normal, mesmo processo que tivemos com o
// Meta Ads.
//
// Secrets necessários (Supabase > Edge Functions > sync-google-ads > Secrets):
//   GOOGLE_ADS_DEVELOPER_TOKEN
//   GOOGLE_ADS_CLIENT_ID
//   GOOGLE_ADS_CLIENT_SECRET
//   GOOGLE_ADS_REFRESH_TOKEN
//   GOOGLE_ADS_CUSTOMER_ID          - ex: 246-874-0684 (com ou sem traço, tanto faz)
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID    - opcional; só preencher se a conta for
//                                     acessada através de uma conta MCC/gerenciadora.
//                                     Se não usar MCC, pode deixar em branco.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm prontos automaticamente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_VERSION = "v24";
const DAYS_BACK = 30;

function digitsOnly(v: string): string {
  return v.replace(/\D/g, "");
}

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error("Erro ao renovar access token do Google: " + JSON.stringify(payload));
  return payload.access_token;
}

async function gaqlSearch(
  customerId: string,
  loginCustomerId: string,
  accessToken: string,
  developerToken: string,
  query: string
): Promise<any[]> {
  const results: any[] = [];
  let pageToken: string | undefined;
  do {
    const res = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
      },
      body: JSON.stringify({ query, pageSize: 10000, ...(pageToken ? { pageToken } : {}) }),
    });
    const payload = await res.json();
    if (!res.ok) {
      throw new Error("Erro na API do Google Ads: " + JSON.stringify(payload));
    }
    results.push(...(payload.results || []));
    pageToken = payload.nextPageToken;
  } while (pageToken);
  return results;
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return typeof n === "number" && !isNaN(n) ? n : 0;
}

function safeDiv(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

function round2(n: number | null): number | null {
  return n === null || isNaN(n) ? n : Math.round(n * 100) / 100;
}

type Level = "campaign" | "ad_group" | "ad_group_ad";

const LEVEL_CONFIG: Record<Level, { resource: string; idField: string; nameField: string; statusField: string; extra?: string }> = {
  campaign: { resource: "campaign", idField: "campaign.id", nameField: "campaign.name", statusField: "campaign.status" },
  ad_group: { resource: "ad_group", idField: "ad_group.id", nameField: "ad_group.name", statusField: "ad_group.status" },
  ad_group_ad: { resource: "ad_group_ad", idField: "ad_group_ad.ad.id", nameField: "ad_group_ad.ad.name", statusField: "ad_group_ad.status" },
};

function dig(obj: any, path: string): any {
  // aceita tanto snake_case quanto camelCase nas chaves do JSON de resposta
  const camel = path.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return path.split(".").reduce((acc, _key, i, arr) => acc, undefined) ??
    camel.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj) ??
    path.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
}

Deno.serve(async (_req) => {
  try {
    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
    const refreshToken = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN");
    const rawCustomerId = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID");
    const rawLoginCustomerId = Deno.env.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!developerToken || !clientId || !clientSecret || !refreshToken || !rawCustomerId) {
      return new Response(
        JSON.stringify({ error: "Configure GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN e GOOGLE_ADS_CUSTOMER_ID nos secrets da função." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const customerId = digitsOnly(rawCustomerId);
    const loginCustomerId = rawLoginCustomerId ? digitsOnly(rawLoginCustomerId) : customerId;

    const supabase = createClient(supabaseUrl, serviceKey);
    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);

    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateTo.getDate() - DAYS_BACK);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const since = fmt(dateFrom);
    const until = fmt(dateTo);

    async function syncLevel(level: Level) {
      const cfg = LEVEL_CONFIG[level];
      const idFields =
        level === "campaign"
          ? "campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros"
          : level === "ad_group"
          ? "campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group.status"
          : "campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status";

      const baseQuery = `SELECT segments.date, ${idFields}, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc FROM ${cfg.resource} WHERE segments.date BETWEEN '${since}' AND '${until}'`;
      const baseRows = await gaqlSearch(customerId, loginCustomerId, accessToken, developerToken, baseQuery);

      let convRows: any[] = [];
      try {
        const convQuery = `SELECT segments.date, ${idFields}, segments.conversion_action_category, metrics.conversions FROM ${cfg.resource} WHERE segments.date BETWEEN '${since}' AND '${until}'`;
        convRows = await gaqlSearch(customerId, loginCustomerId, accessToken, developerToken, convQuery);
      } catch (e) {
        console.error(`Falha ao buscar conversões por categoria no nível ${level}, seguindo sem Compra/Lead:`, e);
      }

      const convMap = new Map<string, { compra: number; lead: number }>();
      convRows.forEach((r) => {
        const entityId =
          level === "campaign" ? r.campaign?.id : level === "ad_group" ? r.adGroup?.id : r.adGroupAd?.ad?.id;
        const key = `${r.segments?.date}|${entityId}`;
        const category = r.segments?.conversionActionCategory;
        const conversions = num(r.metrics?.conversions);
        if (!convMap.has(key)) convMap.set(key, { compra: 0, lead: 0 });
        const entry = convMap.get(key)!;
        if (category === "PURCHASE") entry.compra += conversions;
        if (category === "LEAD" || category === "SUBMIT_LEAD_FORM") entry.lead += conversions;
      });

      const rows = baseRows.map((r) => {
        const date = r.segments?.date;
        const spend = num(r.metrics?.costMicros) / 1_000_000;
        const impressions = num(r.metrics?.impressions);
        const clicks = num(r.metrics?.clicks);
        const ctr = r.metrics?.ctr ? num(r.metrics.ctr) * 100 : null;
        const cpcMedio = r.metrics?.averageCpc ? num(r.metrics.averageCpc) / 1_000_000 : null;

        const campaignId = r.campaign?.id;
        const campaignName = r.campaign?.name;

        let entityId: string, entityName: string, status: string | undefined;
        if (level === "campaign") {
          entityId = campaignId;
          entityName = campaignName;
          status = r.campaign?.status;
        } else if (level === "ad_group") {
          entityId = r.adGroup?.id;
          entityName = r.adGroup?.name;
          status = r.adGroup?.status;
        } else {
          entityId = r.adGroupAd?.ad?.id;
          entityName = r.adGroupAd?.ad?.name;
          status = r.adGroupAd?.status;
        }

        const conv = convMap.get(`${date}|${entityId}`) || { compra: 0, lead: 0 };

        const base: Record<string, unknown> = {
          date,
          campaign_id: campaignId,
          campaign_name: campaignName,
          status: status || null,
          spend: round2(spend),
          compra: conv.compra,
          custo_por_compra: round2(safeDiv(spend, conv.compra)),
          lead: conv.lead,
          custo_por_lead: round2(safeDiv(spend, conv.lead)),
          impressions,
          clicks,
          ctr: round2(ctr),
          cpc_medio: round2(cpcMedio),
          synced_at: new Date().toISOString(),
        };

        if (level === "campaign") {
          base.budget_amount = r.campaignBudget?.amountMicros ? num(r.campaignBudget.amountMicros) / 1_000_000 : null;
        }
        if (level === "ad_group" || level === "ad_group_ad") {
          base.ad_group_id = r.adGroup?.id;
          base.ad_group_name = r.adGroup?.name;
        }
        if (level === "ad_group_ad") {
          base.ad_id = entityId;
          base.ad_name = entityName || entityId;
        }

        return base;
      });

      const table =
        level === "campaign" ? "google_ads_insights_campaign" : level === "ad_group" ? "google_ads_insights_adgroup" : "google_ads_insights_ad";
      const conflictKey = level === "campaign" ? "date,campaign_id" : level === "ad_group" ? "date,ad_group_id" : "date,ad_id";

      if (rows.length > 0) {
        const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictKey });
        if (error) throw error;
      }
      return rows.length;
    }

    const counts = {
      campaign: await syncLevel("campaign"),
      ad_group: await syncLevel("ad_group"),
      ad_group_ad: await syncLevel("ad_group_ad"),
    };

    return new Response(JSON.stringify({ ok: true, counts }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
