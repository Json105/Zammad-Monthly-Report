"""
Zammad "Others" ticket auto-reclassification tool.

Scans tickets assigned to the "Others" group and reclassifies them into
appropriate groups based on keyword rules applied to the ticket title.

Usage:
    python reclassify_others.py                     # Process last month
    python reclassify_others.py --month 2026-07     # Process a specific month
    python reclassify_others.py --all               # Process all history
    python reclassify_others.py --dry-run           # Preview only (no writes)
"""

from __future__ import annotations

import re
import sys
import logging
import argparse
from typing import Optional

import requests

from zammad_utils.config import load_zammad_config
from zammad_utils.date_utils import calculate_month_range

logger = logging.getLogger(__name__)


# === 關鍵字規則辨識邏輯 ===

def determine_new_group(title: str) -> str | None:
    """
    Determine the target group for a ticket based on keyword matching.

    Returns the group name string if a rule matches, or ``None`` if the
    ticket should remain in "Others".
    """
    title_lower = str(title).lower()

    # 1. 人事異動與交接 (On/Offboarding)
    if re.search(r'\b(onboarding|offboarding|on[- ]boarding|off[- ]boarding)\b', title_lower) or any(k in title_lower for k in ['新人', '離職', '入職', '配發', '交接', '新人報到']):
        return "On/Offboarding"

    # 2. 郵件資安與防護 (Email Security)
    if re.search(r'\b(amp-errors|phishing|spam|hacked)\b', title_lower) or any(k in title_lower for k in ['e-mail security', 'email security', 'mail release', '釣魚信', '垃圾信', '收信權限']):
        return "Email Security"

    # 3. 帳號與權限 (Account & Access)
    if re.search(r'\b(password|pwd|login|account|permission|vpn|openvpn|byod|license|ad|moderation|moderator|distribution group)\b', title_lower) or any(k in title_lower for k in ['密碼', '權限', '帳號', '開通', '授權', '登入', '重設密碼', '設定密碼', 'openvpn']):
        return "Account & Access"

    # 4. 事務機與週邊設備 (Peripherals & Printing)
    if re.search(r'\b(printer|print|scanner|toner)\b', title_lower) or any(k in title_lower for k in ['印表機', '掃描', '驅動', '碳粉', '耗材', '影印機']):
        return "Peripherals & Printing"

    # 5. 電腦硬體與設備 (Hardware)
    if re.search(r'\b(monitor|keyboard|mouse|laptop|notebook|nb\b|desktop)\b', title_lower) or any(k in title_lower for k in ['螢幕', '鍵盤', '滑鼠', '讀卡機', '筆電', '主機', '黑屏', '備用機', '歸還']):
        return "Hardware"

    # 6. 辦公軟體與系統維護 (Software)
    if re.search(r'\b(excel|word|powerpoint|teams|onedrive|outlook|m365|office|portal)\b', title_lower) or any(k in title_lower for k in ['保固', '後台', '神算', '軟體', '檔案消失', '開啟excel']):
        return "Software"

    # 7. IT 諮詢與專案 (IT Request & Project)
    if re.search(r'\b(sop|project|allocation|billing process)\b', title_lower) or any(k in title_lower for k in ['諮詢', '評估', '採購', '專案', '流程', '報價', '估價', '建置']):
        return "IT Request & Project"

    return None


def main():
    logging.basicConfig(
        level=logging.WARNING,
        format="%(levelname)s [%(name)s] %(message)s",
    )

    # === 1. 解析參數 ===
    parser = argparse.ArgumentParser(description="Zammad Others 工單自動重分類工具")
    parser.add_argument("--month", type=str, help="指定處理月份 (格式: YYYY-MM，預設為上個月)")
    parser.add_argument("--all", action="store_true", help="處理所有歷史期間的 Others 工單")
    parser.add_argument("--dry-run", action="store_true", help="僅預覽不實際寫入")
    args = parser.parse_args()

    DRY_RUN = args.dry_run

    # === 2. 載入 Zammad 連線設定 ===
    config = load_zammad_config(require=True)

    headers = {
        **config.headers,
        "Content-Type": "application/json",
    }

    # === 3. 計算月份區間 ===
    if args.all:
        TARGET_MONTH = None
        DATE_START = None
        DATE_END = None
    else:
        try:
            month_range = calculate_month_range(args.month)
        except ValueError:
            print("❌ 月份格式錯誤，請使用 YYYY-MM (例如 2026-07)")
            sys.exit(1)
        TARGET_MONTH = month_range.year_month
        DATE_START = month_range.start_date
        DATE_END = month_range.end_date

    # === 4. 取得群組清單 ===
    print("正在取得最新群組清單...")
    try:
        resp = requests.get(f"{config.url}/api/v1/groups", headers=headers, timeout=15)
    except requests.exceptions.RequestException as e:
        print(f"❌ 連線失敗: {e}")
        sys.exit(1)

    if resp.status_code != 200:
        print(f"無法取得群組清單 (狀態碼 {resp.status_code}):", resp.text)
        sys.exit(1)

    groups_data = resp.json()
    name_to_group_id = {g['name']: g['id'] for g in groups_data}
    id_to_group_name = {g['id']: g['name'] for g in groups_data}

    print(f"成功取得 {len(groups_data)} 個群組資訊。")

    # 檢查新群組是否存在
    target_groups = [
        "Account & Access",
        "Peripherals & Printing",
        "On/Offboarding",
        "IT Request & Project",
        "Email Security",
        "Software",
        "Hardware"
    ]
    for gname in target_groups:
        if gname not in name_to_group_id:
            print(f"警告：找不到群組 [{gname}]，請確認 Zammad 後台名稱是否完全相符！")

    # === 5. 搜尋 "Others" 工單 ===
    others_group_id = name_to_group_id.get("Others", 1)
    if TARGET_MONTH:
        print(f"\n開始搜尋 {TARGET_MONTH} ({DATE_START} ~ {DATE_END}) 期間 Group 為 'Others' (ID: {others_group_id}) 的工單...")
        query = f"group_id:{others_group_id} AND created_at:>={DATE_START} AND created_at:<={DATE_END}"
    else:
        print(f"\n開始搜尋所有歷史期間 Group 為 'Others' (ID: {others_group_id}) 的工單...")
        query = f"group_id:{others_group_id}"

    page = 1
    others_tickets = []

    while True:
        try:
            res = requests.get(
                f"{config.url}/api/v1/tickets/search",
                headers=headers,
                params={"query": query, "per_page": 100, "page": page},
                timeout=30
            )
        except requests.exceptions.RequestException as e:
            print(f"❌ 搜尋工單時連線失敗: {e}")
            break

        if res.status_code != 200:
            print(f"搜尋工單失敗 (狀態碼 {res.status_code}):", res.text)
            break
        data = res.json()
        if not data or 'assets' not in data or 'Ticket' not in data['assets']:
            break
        tickets = list(data['assets']['Ticket'].values())
        others_tickets.extend(tickets)
        if len(tickets) < 100:
            break
        page += 1

    print(f"共找到 {len(others_tickets)} 筆位於 'Others' 的工單。\n")

    # === 6. 執行辨識與更新 ===
    updated_count = 0
    skipped_count = 0

    for ticket in others_tickets:
        t_id = ticket['id']
        t_num = ticket['number']
        title = ticket['title']

        target_group_name = determine_new_group(title)

        if target_group_name and target_group_name in name_to_group_id:
            new_gid = name_to_group_id[target_group_name]
            updated_count += 1

            if DRY_RUN:
                print(f"[預覽] 工單 #{t_num} ({title[:35]}...) -> 建議變更為: [{target_group_name}] (ID: {new_gid})")
            else:
                update_url = f"{config.url}/api/v1/tickets/{t_id}"
                payload = {"group_id": new_gid}
                try:
                    update_res = requests.put(update_url, headers=headers, json=payload, timeout=15)
                    if update_res.status_code == 200:
                        print(f"[成功] 工單 #{t_num} 已更新為 [{target_group_name}]")
                    else:
                        print(f"[失敗] 工單 #{t_num} 更新失敗: {update_res.text}")
                except requests.exceptions.RequestException as e:
                    print(f"[失敗] 工單 #{t_num} 更新時連線失敗: {e}")
        else:
            skipped_count += 1
            print(f"[保留] 工單 #{t_num} ({title[:35]}...) -> 無符合規則，保留在 Others")

    print("\n=== 執行統計 ===")
    print(f"符合可修改規則: {updated_count} 筆")
    print(f"無法辨識保留: {skipped_count} 筆")
    if DRY_RUN:
        print("\n提醒：目前處於 [預覽模式 (--dry-run)]，系統資料尚未修改。")
        print("若預覽結果正確，請移除 --dry-run 參數後再次執行！")


if __name__ == "__main__":
    main()