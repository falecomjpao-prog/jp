import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Level = "campaign" | "adset" | "ad";
type Row = Record<string, any>;

const LEVELS: { key: Level; table: string; label: string; nameCols: string[] }[] = [
  { key: "campaign", table: "meta_insights_campaign", label: "Campanhas", nameCols: ["campaign_name"] },
  { key: "adset", table: "meta_insights_adset", label: "Conjuntos de Anúncio", nameCols: ["campaign_name", "adset_name"] },
  { key: "ad", table: "meta_insights_ad", label: "Anúncios", nameCols: ["campaign_name", "adset_name", "ad_name"] },
];

function num(v: any): number {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && !isNaN(n) ? n : 0;
}

function fmtInt(n: number) {
  return Math.round(n).toLocaleString("pt-BR");
}
function fmtMoney(n: number) {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

function aggregate(rows: Row[]) {
  const s = {
    compra: 0, compraCost: 0, lead: 0, leadCost: 0,
    initiate: 0, initiateCost: 0, lpv: 0, lpvCost: 0,
    reach: 0, impressions: 0, cpmW: 0, ulc: 0, ulcCost: 0,
  };
  rows.forEach((r) => {
    const compra = num(r.compra), lead = num(r.lead), initiate = num(r.initiate_checkout), lpv = num(r.landing_page_views);
    const impressions = num(r.impressions), reach = num(r.reach), ulc = num(r.unique_link_clicks);
    s.compra += compra; s.compraCost += num(r.custo_por_compra) * compra;
    s.lead += lead; s.leadCost += num(r.custo_por_lead) * lead;
    s.initiate += initiate; s.initiateCost += num(r.custo_por_initiate_checkout) * initiate;
    s.lpv += lpv; s.lpvCost += num(r.custo_por_lpv) * lpv;
    s.reach += reach; s.impressions += impressions; s.cpmW += num(r.cpm) * impressions;
    s.ulc += ulc; s.ulcCost += num(r.custo_por_unique_link_click) * ulc;
  });
  return {
    compra: s.compra, custoPorCompra: s.compra > 0 ? s.compraCost / s.compra : 0,
    lead: s.lead, custoPorLead: s.lead > 0 ? s.leadCost / s.lead : 0,
    initiate: s.initiate, custoPorInitiate: s.initiate > 0 ? s.initiateCost / s.initiate : 0,
    lpv: s.lpv, custoPorLpv: s.lpv > 0 ? s.lpvCost / s.lpv : 0,
    cpm: s.impressions > 0 ? s.cpmW / s.impressions : 0,
    frequency: s.reach > 0 ? s.impressions / s.reach : 0,
    reach: s.reach, impressions: s.impressions,
    ulc: s.ulc, custoPorUlc: s.ulc > 0 ? s.ulcCost / s.ulc : 0,
    uniqueCtr: s.reach > 0 ? (s.ulc / s.reach) * 100 : 0,
    lpvRate: s.ulc > 0 ? (s.lpv / s.ulc) * 100 : 0,
  };
}

function groupBy<T>(rows: T[], keyFn: (r: T) => string) {
  const map = new Map<string, T[]>();
  rows.forEach((r) => {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  });
  return map;
}

function ChartCard({ title, data, dataKey, color, formatter }: { title: string; data: any[]; dataKey: string; color: string; formatter: (n: number) => string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm text-muted-foreground mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatter} width={60} />
          <Tooltip formatter={(v: number) => formatter(v)} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function MetaAdsDashboard() {
  const [levelKey, setLevelKey] = useState<Level>("campaign");
  const [data, setData] = useState<Record<Level, Row[]>>({ campaign: [], adset: [], ad: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          LEVELS.map((l) =>
            supabase.from(l.table).select("*").order("date", { ascending: true }).then(({ data, error }) => {
              if (error) throw error;
              return data || [];
            })
          )
        );
        setData({ campaign: results[0], adset: results[1], ad: results[2] });
      } catch (e: any) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const level = LEVELS.find((l) => l.key === levelKey)!;
  const allRows = data[levelKey];

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (activeOnly && r.status !== "ACTIVE") return false;
      if (term && !level.nameCols.some((c) => String(r[c] || "").toLowerCase().includes(term))) return false;
      return true;
    });
  }, [allRows, activeOnly, search, level]);

  const agg = useMemo(() => aggregate(filteredRows), [filteredRows]);

  const chartData = useMemo(() => {
    const byDate = groupBy(filteredRows, (r) => r.date);
    const dates = Array.from(byDate.keys()).sort();
    return dates.map((d) => ({ date: d, ...aggregate(byDate.get(d)!) }));
  }, [filteredRows]);

  const tableEntries = useMemo(() => {
    const grouped = groupBy(filteredRows, (r) => level.nameCols.map((c) => r[c]).join(" | "));
    const entries = Array.from(grouped.entries()).map(([key, rows]) => {
      const last = rows[rows.length - 1];
      return {
        names: key.split(" | "),
        status: last.status as string | null,
        budget: last.budget_amount as number | null,
        budgetType: last.budget_type as string | null,
        instagramUrl: last.instagram_url as string | null,
        thumbnail: last.thumbnail_url as string | null,
        agg: aggregate(rows),
      };
    });
    entries.sort((a, b) => b.agg.compra - a.agg.compra);
    return entries;
  }, [filteredRows, level]);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando dados…</div>;
  if (error) return <div className="p-8 text-red-500">Erro ao carregar: {error}</div>;

  const kpis: [string, string][] = [
    ["Compra", fmtInt(agg.compra)],
    ["Custo por Compra", fmtMoney(agg.custoPorCompra)],
    ["Lead", fmtInt(agg.lead)],
    ["Custo por Lead", fmtMoney(agg.custoPorLead)],
    ["Initiate Checkout", fmtInt(agg.initiate)],
    ["Custo por Initiate Checkout", fmtMoney(agg.custoPorInitiate)],
    ["Landing Page Views", fmtInt(agg.lpv)],
    ["Custo por LPV", fmtMoney(agg.custoPorLpv)],
    ["Unique CTR (Link)", fmtPct(agg.uniqueCtr)],
    ["LPV Rate por Link Clicks", fmtPct(agg.lpvRate)],
    ["CPM", fmtMoney(agg.cpm)],
    ["Frequency", agg.frequency.toFixed(2)],
    ["Reach", fmtInt(agg.reach)],
    ["Impressions", fmtInt(agg.impressions)],
    ["Unique Link Clicks", fmtInt(agg.ulc)],
    ["Custo por Unique Link Click", fmtMoney(agg.custoPorUlc)],
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold">Dashboard Meta Ads</h1>
      </header>

      <nav className="flex gap-1 border-b mb-4">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            onClick={() => setLevelKey(l.key)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              levelKey === l.key ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
          Somente ativos agora
        </label>
        <input
          className="flex-1 min-w-[220px] max-w-sm px-3 py-2 rounded-md border bg-background text-sm"
          placeholder="Buscar por nome (ex: AD01, Leads, Vendas)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(search || activeOnly) && <span className="text-xs text-muted-foreground">{tableEntries.length} encontrado(s)</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="text-xl font-semibold tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <ChartCard title="Compra por dia" data={chartData} dataKey="compra" color="#2a78d6" formatter={fmtInt} />
        <ChartCard title="Lead por dia" data={chartData} dataKey="lead" color="#1baf7a" formatter={fmtInt} />
        <ChartCard title="CPM por dia" data={chartData} dataKey="cpm" color="#eda100" formatter={fmtMoney} />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b">
              {level.key === "ad" && <th className="text-left p-3">Anúncio</th>}
              {level.nameCols.map((c) => (
                <th key={c} className="text-left p-3">{c}</th>
              ))}
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Orçamento</th>
              <th className="text-right p-3">Compra</th>
              <th className="text-right p-3">Custo/Compra</th>
              <th className="text-right p-3">Lead</th>
              <th className="text-right p-3">Custo/Lead</th>
              <th className="text-right p-3">CPM</th>
              <th className="text-right p-3">Reach</th>
              <th className="text-right p-3">Impressions</th>
            </tr>
          </thead>
          <tbody>
            {tableEntries.map((e, i) => (
              <tr key={i} className="border-b last:border-0">
                {level.key === "ad" && (
                  <td className="p-3">
                    {e.thumbnail && <img src={e.thumbnail} className="w-8 h-8 rounded object-cover inline-block mr-2" alt="" />}
                    {e.instagramUrl && (
                      <a href={e.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs">
                        Ver no Instagram
                      </a>
                    )}
                  </td>
                )}
                {e.names.map((n, j) => (
                  <td key={j} className="p-3">{n || "—"}</td>
                ))}
                <td className="p-3">
                  <span className={e.status === "ACTIVE" ? "text-green-600" : "text-muted-foreground"}>
                    ● {e.status === "ACTIVE" ? "Ativo" : e.status || "—"}
                  </span>
                </td>
                <td className="p-3">{e.budget ? `R$ ${e.budget.toLocaleString("pt-BR")}${e.budgetType === "daily" ? "/dia" : " (total)"}` : "—"}</td>
                <td className="p-3 text-right tabular-nums">{fmtInt(e.agg.compra)}</td>
                <td className="p-3 text-right tabular-nums">{fmtMoney(e.agg.custoPorCompra)}</td>
                <td className="p-3 text-right tabular-nums">{fmtInt(e.agg.lead)}</td>
                <td className="p-3 text-right tabular-nums">{fmtMoney(e.agg.custoPorLead)}</td>
                <td className="p-3 text-right tabular-nums">{fmtMoney(e.agg.cpm)}</td>
                <td className="p-3 text-right tabular-nums">{fmtInt(e.agg.reach)}</td>
                <td className="p-3 text-right tabular-nums">{fmtInt(e.agg.impressions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
