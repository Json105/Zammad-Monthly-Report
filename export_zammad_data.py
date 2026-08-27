"""
Export simplified Zammad asset lookup tables (State, Group, User) to JSON.

Usage:
    python export_zammad_data.py
"""

import json
import logging
from zammad_utils.config import load_zammad_config
from zammad_utils.api import fetch_simplified_assets


def main():
    logging.basicConfig(
        level=logging.WARNING,
        format="%(levelname)s [%(name)s] %(message)s",
    )

    config = load_zammad_config(require=True)

    print("正在請求 Zammad API 擷取資產對照資料...")
    simplified_data = fetch_simplified_assets(config)

    filename = "zammad_simplified_assets.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(simplified_data, f, ensure_ascii=False, indent=4)

    print(f"✅ 成功！精簡後的對照表已儲存至 {filename}")


if __name__ == "__main__":
    main()