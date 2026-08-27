"""
Shared Zammad API helpers.

Provides thin wrappers around commonly-used Zammad REST endpoints so that
every script uses consistent error handling, logging, and timeout settings.
from __future__ import annotations

import logging
import requests
from zammad_utils.config import ZammadConfig

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 15  # seconds


def fetch_ticket_states(config: ZammadConfig) -> dict:
    """
    Fetch the ticket state mapping {id: name} from the Zammad API.

    Returns an empty dict on failure rather than crashing, so callers can
    fall back to their own defaults.
    """
    try:
        res = requests.get(
            f"{config.url}/api/v1/ticket_states",
            headers=config.headers,
            timeout=DEFAULT_TIMEOUT,
        )
        if res.status_code == 200:
            return {s["id"]: s["name"] for s in res.json()}
        logger.warning(
            "取得 ticket_states 失敗 (HTTP %d): %s", res.status_code, res.text
        )
    except requests.exceptions.RequestException as e:
        logger.warning("取得 ticket_states 時連線失敗: %s", e)
    return {}


def fetch_groups(config: ZammadConfig) -> dict:
    """
    Fetch the group mapping {name: id} from the Zammad API.

    Returns an empty dict on failure.
    """
    try:
        res = requests.get(
            f"{config.url}/api/v1/groups",
            headers=config.headers,
            timeout=DEFAULT_TIMEOUT,
        )
        if res.status_code == 200:
            return {g["name"]: g["id"] for g in res.json()}
        logger.warning(
            "取得 groups 失敗 (HTTP %d): %s", res.status_code, res.text
        )
    except requests.exceptions.RequestException as e:
        logger.warning("取得 groups 時連線失敗: %s", e)
    return {}


def fetch_simplified_assets(config: ZammadConfig) -> dict:
    """
    Perform a minimal ticket search to extract the 'assets' lookup tables
    (State, Group, User) and return them in a simplified structure.

    Used by ``export_zammad_data.py``.
    """
    simplified: dict = {"State": {}, "Group": {}, "User": {}}

    # --- States (prefer dedicated endpoint) ---
    states = fetch_ticket_states(config)
    if states:
        simplified["State"] = {str(k): v for k, v in states.items()}
    else:
        logger.info("ticket_states 端點不可用，嘗試從 search assets 回退")

    # --- Groups & Users from a search call ---
    try:
        res = requests.get(
            f"{config.url}/api/v1/tickets/search",
            headers=config.headers,
            params={"query": "created_at:>1970-01-01", "per_page": 1},
            timeout=DEFAULT_TIMEOUT,
        )
        if res.status_code != 200:
            logger.warning("assets 搜尋失敗 (HTTP %d): %s", res.status_code, res.text)
            return simplified

        assets = res.json().get("assets", {})

        # Backfill states from assets if the dedicated endpoint failed
        if not simplified["State"]:
            for sid, sinfo in assets.get("State", {}).items():
                simplified["State"][sid] = sinfo.get("name")

        for gid, ginfo in assets.get("Group", {}).items():
            simplified["Group"][gid] = ginfo.get("name")

        for uid, uinfo in assets.get("User", {}).items():
            firstname = uinfo.get("firstname") or ""
            lastname = uinfo.get("lastname") or ""
            simplified["User"][uid] = f"{firstname} {lastname}".strip()

    except requests.exceptions.RequestException as e:
        logger.warning("assets 搜尋時連線失敗: %s", e)

    return simplified
