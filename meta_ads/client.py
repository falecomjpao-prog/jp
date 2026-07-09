import os
import time

import requests

GRAPH_BASE_URL = "https://graph.facebook.com"

INSIGHT_FIELDS = [
    "campaign_name",
    "adset_name",
    "ad_name",
    "spend",
    "impressions",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "actions",
    "action_values",
]


class MetaAdsClient:
    def __init__(self, access_token=None, api_version=None):
        self.access_token = access_token or os.environ["META_ACCESS_TOKEN"]
        self.api_version = api_version or os.environ.get("META_API_VERSION", "v21.0")
        self.base_url = f"{GRAPH_BASE_URL}/{self.api_version}"

    def _get(self, path, params):
        params = {**params, "access_token": self.access_token}
        url = f"{self.base_url}/{path}"
        results = []
        while url:
            response = requests.get(url, params=params)
            if response.status_code == 429:
                time.sleep(5)
                continue
            response.raise_for_status()
            payload = response.json()
            results.extend(payload.get("data", []))
            url = payload.get("paging", {}).get("next")
            params = {}
        return results

    def get_insights(self, ad_account_id, date_from, date_to, level="campaign", time_increment=1):
        path = f"{ad_account_id}/insights"
        params = {
            "fields": ",".join(INSIGHT_FIELDS),
            "level": level,
            "time_increment": time_increment,
            "time_range": f'{{"since":"{date_from}","until":"{date_to}"}}',
            "limit": 500,
        }
        return self._get(path, params)
