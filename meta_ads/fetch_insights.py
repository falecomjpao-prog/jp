import argparse
import csv
import datetime
import json
import os

from dotenv import load_dotenv

from meta_ads.client import MetaAdsClient

ACTION_TYPES_TO_TRACK = ["purchase", "lead", "link_click", "landing_page_view"]


def flatten_row(client_name, row):
    flat = {
        "client": client_name,
        "date": row.get("date_start"),
        "campaign_name": row.get("campaign_name"),
        "adset_name": row.get("adset_name"),
        "ad_name": row.get("ad_name"),
        "spend": row.get("spend"),
        "impressions": row.get("impressions"),
        "clicks": row.get("clicks"),
        "ctr": row.get("ctr"),
        "cpc": row.get("cpc"),
        "cpm": row.get("cpm"),
    }
    actions = {a["action_type"]: a["value"] for a in row.get("actions", [])}
    for action_type in ACTION_TYPES_TO_TRACK:
        flat[action_type] = actions.get(action_type, 0)
    return flat


def main():
    parser = argparse.ArgumentParser(description="Puxa insights de campanhas do Meta Ads para todos os clientes.")
    parser.add_argument("--days", type=int, default=30, help="Quantidade de dias para trás a partir de hoje.")
    parser.add_argument("--clients-file", default="config/clients.json", help="Arquivo com a lista de clientes/contas.")
    parser.add_argument("--out", default="data/meta_insights.csv", help="Arquivo CSV de saída.")
    args = parser.parse_args()

    load_dotenv()

    with open(args.clients_file, encoding="utf-8") as f:
        clients = json.load(f)["clientes"]

    date_to = datetime.date.today()
    date_from = date_to - datetime.timedelta(days=args.days)

    api = MetaAdsClient()

    all_rows = []
    for client in clients:
        print(f"Puxando dados de {client['nome']} ({client['ad_account_id']})...")
        raw_rows = api.get_insights(
            client["ad_account_id"],
            date_from.isoformat(),
            date_to.isoformat(),
        )
        for row in raw_rows:
            all_rows.append(flatten_row(client["nome"], row))

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    fieldnames = ["client", "date", "campaign_name", "adset_name", "ad_name", "spend", "impressions", "clicks", "ctr", "cpc", "cpm", *ACTION_TYPES_TO_TRACK]
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"{len(all_rows)} linhas salvas em {args.out}")


if __name__ == "__main__":
    main()
