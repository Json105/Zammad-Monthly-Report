"""
Query and display all ticket state IDs from the Zammad API.

Usage:
    python get_states.py
"""

import json
import logging
from zammad_utils.config import load_zammad_config
from zammad_utils.api import fetch_ticket_states


def main():
    logging.basicConfig(
        level=logging.WARNING,
        format="%(levelname)s [%(name)s] %(message)s",
    )

    config = load_zammad_config(require=True)

    print("正在查詢 Zammad 工單狀態列表...")
    state_dict = fetch_ticket_states(config)

    if state_dict:
        print("✅ 成功獲取狀態列表！\n")
        print(json.dumps(state_dict, indent=4, ensure_ascii=False))
    else:
        print("❌ 無法取得狀態列表。")
        print("可能的原因：你的 Token 權限不足以讀取系統設定 (需要 admin.ticket_states 權限)。")


if __name__ == "__main__":
    main()