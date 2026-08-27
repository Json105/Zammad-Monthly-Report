from __future__ import annotations

import requests
import pandas as pd
import os
import sys
import argparse
import random
import logging
import calendar
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from concurrent.futures import ThreadPoolExecutor

from zammad_utils.config import load_zammad_config
from zammad_utils.date_utils import calculate_month_range, days_in_month

logger = logging.getLogger(__name__)

# === 預設對照字典 ===
# ⚠️ 以下 ID → 名稱的對應僅適用於特定 Zammad 實例，作為 API 回傳資料前的
#    fallback 基礎。實際執行時會優先使用 API 動態取得的對應值覆蓋。
DEFAULT_STATE_DICT = {
    1: "new", 2: "open", 3: "pending reminder", 4: "closed", 
    5: "merged", 6: "removed", 7: "pending close"
}

DEFAULT_GROUP_DICT = {
    1: "Users / General", 2: "Software", 3: "Hardware", 4: "Network",
    5: "Infrastructure", 6: "Security", 7: "ERP / Core", 8: "Development"
}

DEFAULT_USER_DICT = {
    1: "-", 2: "System Admin"
}


def generate_mock_tickets(year_month: str, count: int = 60):
    """產生高品質的模擬工單資料供 Demo 或測試使用"""
    print(f"🎲 正在產生 {year_month} 的模擬工單資料 (共 {count} 筆)...")
    
    statuses = ["closed", "closed", "closed", "open", "pending reminder", "new", "merged"]
    groups = ["Software", "Hardware", "Network", "ERP / Core", "Security", "Users / General"]
    assignees = ["Alex Chen", "Sarah Lin", "Jason Wu", "Emily Wang", "David Chang"]
    requesters = ["Michael Scott", "Jim Halpert", "Pam Beesly", "Dwight Schrute", "Stanley Hudson", "Kevin Malone", "Angela Martin"]
    sample_titles = [
        ("SOP - 新進員工帳號與權限開通標準流程建立", "SOP, onboarding"),
        ("VPN 連線異常，無法連入內網系統", "network, vpn"),
        ("公司印表機驅動程式重新設定需求", "hardware, printer"),
        ("SOP - 辦公室網路障礙通報與緊急應變指引", "SOP, incident"),
        ("筆記型電腦黑屏無法開機，需申請備用機", "hardware, urgent"),
        ("ERP 系統權限申請與審核表單流轉異常", "erp, permission"),
        ("Outlook 收到疑似釣魚信件，請協助資安確認", "security, urgent"),
        ("螢幕閃爍問題排查與線材更換", "hardware"),
        ("軟體授權轉移與安裝需求", "software, license"),
        ("Teams / OneDrive 檔案同步異常處理", "software, cloud"),
        ("離職員工資產清點與帳號封鎖", "offboarding, asset"),
        ("SOP - 伺服器定期備份與異地還原操作手冊", "SOP, backup"),
        ("遠端桌面連線逾時無法存取資料庫", "network, database"),
        ("新進同仁 NB 配發與基礎環境部署", "hardware, onboarding"),
    ]

    year, month = map(int, year_month.split('-'))
    month_days = days_in_month(year, month)

    mock_tickets = []
    for i in range(1, count + 1):
        ticket_num = f"56{random.randint(5000, 5999)}"
        title, tags = random.choice(sample_titles)
        day = random.randint(1, month_days)
        create_date = f"{year:04d}-{month:02d}-{day:02d}"
        update_day = min(day + random.randint(0, 5), month_days)
        update_date = f"{year:04d}-{month:02d}-{update_day:02d}"
        
        mock_tickets.append({
            '工單編號': ticket_num,
            '主旨': f"{title} (#{i})" if random.random() > 0.5 else title,
            '標籤': tags if random.random() > 0.3 else "",
            '狀態': random.choice(statuses),
            '群組': random.choice(groups),
            '處理人': random.choice(assignees),
            '提單人': random.choice(requesters),
            '建立時間': create_date,
            '最後更新時間': update_date
        })

    return mock_tickets


def fetch_zammad_tickets(url: str, token: str, start_date: str, end_date: str, report_end: str):
    """透過 Zammad API 撈取真實工單 (包含當月新進工單 + 跨月結案與歷史在辦未結工單，自動加總)"""
    headers = {"Authorization": f"Token token={token}"}
    
    state_dict = DEFAULT_STATE_DICT.copy()
    try:
        states_res = requests.get(f"{url}/api/v1/ticket_states", headers=headers, timeout=10)
        if states_res.status_code == 200:
            for s in states_res.json():
                state_dict[s['id']] = s['name']
    except requests.exceptions.RequestException as e:
        logger.warning("取得 ticket_states 失敗，使用預設值: %s", e)

    group_dict = DEFAULT_GROUP_DICT.copy()
    user_dict = DEFAULT_USER_DICT.copy()
    user_email_dict = {}

    print(f"📡 連線至 Zammad: {url}")
    print(f"📅 報表查詢月份: {start_date} ~ {end_date}")
    print(f"📅 報告視角截止日: {report_end}")

    # 1. 查詢當月新進工單
    query_new = f"created_at:>={start_date} AND created_at:<={end_date}"
    # 2. 查詢跨月結案/異動工單 (過去開立、當月更新/結案)
    query_updated = f"created_at:<{start_date} AND updated_at:>={start_date} AND updated_at:<={end_date}"
    # 3. 查詢歷史在辦未結工單 (過去開立、目前仍處於 open / pending reminder / new 狀態；pending close 視為結案)
    query_pending = f"created_at:<{start_date} AND (state_id:1 OR state_id:2 OR state_id:3)"

    queries_to_run = [
        ("📥 當月新進工單", query_new),
        ("🔄 跨月結案/異動工單", query_updated),
        ("⏳ 歷史在辦未結工單", query_pending),
    ]

    all_tickets_map = {}

    for label, q in queries_to_run:
        page = 1
        sub_count = 0
        while True:
            try:
                response = requests.get(
                    f"{url}/api/v1/tickets/search",
                    headers=headers,
                    params={"query": q, "per_page": 100, "page": page},
                    timeout=30
                )
            except requests.exceptions.RequestException as e:
                print(f"❌ 連線失敗 ({label}): {e}")
                break

            if response.status_code != 200:
                print(f"⚠️ API 查詢略過 (狀態碼 {response.status_code}): {response.text}")
                break
                
            data = response.json()
            if not data or 'assets' not in data or 'Ticket' not in data['assets']:
                break
                
            tickets_on_page = list(data['assets']['Ticket'].values())
            for t in tickets_on_page:
                t_id = t.get('id')
                if t_id and t_id not in all_tickets_map:
                    all_tickets_map[t_id] = t
                    sub_count += 1
            
            # 動態更新 assets 對照字典
            if 'State' in data['assets']:
                for state_id, state_info in data['assets']['State'].items():
                    state_dict[int(state_id)] = state_info['name']
                    
            if 'Group' in data['assets']:
                for group_id, group_info in data['assets']['Group'].items():
                    group_dict[int(group_id)] = group_info['name']
                    
            if 'User' in data['assets']:
                for user_id, user_info in data['assets']['User'].items():
                    fullname = f"{user_info.get('firstname', '')} {user_info.get('lastname', '')}".strip()
                    user_dict[int(user_id)] = fullname or user_info.get('login', f"User {user_id}")
                    user_email_dict[int(user_id)] = (user_info.get('email') or '').strip().lower()
            
            if len(tickets_on_page) < 100:
                break
                
            page += 1
        print(f"  ➜ {label}: 成功擷取 {sub_count} 筆")

    all_tickets = list(all_tickets_map.values())

    if not all_tickets:
        return []

    # 擷取 Tags (使用 ThreadPoolExecutor 併發加速)
    print(f"🏷️  撈取到 {len(all_tickets)} 筆工單，正在同步 Tags 標籤資訊...")
    def fetch_tag(ticket):
        ticket_id = ticket.get('id')
        if not ticket_id:
            ticket['tags'] = ""
            return
        try:
            tag_res = requests.get(
                f"{url}/api/v1/tags", 
                headers=headers, 
                params={"object": "Ticket", "o_id": ticket_id},
                timeout=10
            )
            if tag_res.status_code == 200:
                ticket['tags'] = ", ".join(tag_res.json().get('tags', []))
            else:
                ticket['tags'] = ""
        except requests.exceptions.RequestException as e:
            logger.warning("取得工單 #%s tags 失敗: %s", ticket_id, e)
            ticket['tags'] = ""

    with ThreadPoolExecutor(max_workers=10) as executor:
        list(executor.map(fetch_tag, all_tickets))

    # 資料轉換為 DataFrame
    df = pd.DataFrame(all_tickets)
    if 'state_id' in df.columns:
        df['狀態'] = df['state_id'].map(state_dict).fillna(df['state_id'])
        # 狀態標準化：pending close 歸類為 closed, pending reminder 歸類為 open
        df['狀態'] = df['狀態'].replace({
            'pending close': 'closed',
            'pending reminder': 'open'
        })
    if 'group_id' in df.columns:
        df['群組'] = df['group_id'].map(group_dict).fillna(df['group_id'])
    if 'owner_id' in df.columns:
        df['處理人'] = df['owner_id'].map(user_dict).fillna(df['owner_id'])
    if 'customer_id' in df.columns:
        df['提單人'] = df['customer_id'].map(user_dict).fillna(df['customer_id'])
        df['提單人Email'] = df['customer_id'].map(user_email_dict).fillna('')
        
    df = df.rename(columns={
        'number': '工單編號',
        'title': '主旨',
        'tags': '標籤',
        'created_at': '建立時間',
        'updated_at': '最後更新時間'
    })

    if '建立時間' in df.columns:
        df['建立時間'] = pd.to_datetime(df['建立時間']).dt.strftime('%Y-%m-%d')
    if '最後更新時間' in df.columns:
        df['最後更新時間'] = pd.to_datetime(df['最後更新時間']).dt.strftime('%Y-%m-%d')

    # 提單人組織網域篩選：從 config 的 allowed_domains 讀取
    config = load_zammad_config(require=False)
    allowed_domains = config.allowed_domains if config else ()

    if '提單人Email' in df.columns and allowed_domains:
        is_allowed = df['提單人Email'].str.lower().str.endswith(allowed_domains)
        dropped_count = (~is_allowed).sum()
        if dropped_count > 0:
            print(f"🧹 已自動過濾 {dropped_count} 筆非授權網域提單的無效工單")
            df = df[is_allowed]

    columns_to_export = ['工單編號', '主旨', '標籤', '狀態', '群組', '處理人', '提單人', '建立時間', '最後更新時間']
    final_columns = [col for col in columns_to_export if col in df.columns]
    return df[final_columns].to_dict(orient='records')


def export_reports(ticket_records: list, year_month: str, output_slide_data: bool = True):
    """匯出 Excel 報表與 Open-Slide 用的 tickets.json"""
    if not ticket_records:
        print("⚠️ 查無任何工單資料，略過匯出。")
        return

    df = pd.DataFrame(ticket_records)

    # 1. 匯出 Open Slide 專用的 JSON
    if output_slide_data:
        json_dir = os.path.join("zammad-report-slide", "public", "data")
        os.makedirs(json_dir, exist_ok=True)
        json_filename = os.path.join(json_dir, "tickets.json")
        df.to_json(json_filename, orient='records', force_ascii=False, indent=2)
        # 同步備份特定月份的 JSON 封裝檔
        archive_json = os.path.join(json_dir, f"tickets_{year_month}.json")
        df.to_json(archive_json, orient='records', force_ascii=False, indent=2)
        print(f"✅ 簡報資料已儲存至: {json_filename} (已封存為 {archive_json})")

        # 2. 自動在 Open Slide 中生成該月份專屬簡報 (如 slides/report-YYYY-MM/index.tsx)
        slide_folder = os.path.join("zammad-report-slide", "slides", f"report-{year_month}")
        os.makedirs(slide_folder, exist_ok=True)
        slide_index = os.path.join(slide_folder, "index.tsx")
        slide_content = f"""import ticketsData from '../../public/data/tickets_{year_month}.json';
import {{ createReportSlides, design }} from '../../themes/monthlyReportTemplate';

export {{ design }};
export default createReportSlides(ticketsData);
"""
        with open(slide_index, "w", encoding="utf-8") as f:
            f.write(slide_content)
        print(f"🎯 Open Slide 簡報已自動生成: {slide_folder}/ (可於瀏覽器左側選單點選 report-{year_month})")

    # 3. 匯出 Excel (含分頁)
    excel_filename = f"Zammad_Report_{year_month}.xlsx"
    with pd.ExcelWriter(excel_filename, engine='openpyxl') as writer:
        # 全部工單
        df_sorted = df.sort_values(by=['狀態', '建立時間'], ascending=[True, False])
        df_sorted.to_excel(writer, sheet_name='全部工單', index=False)
        
        # 依狀態自動拆分工作表
        if '狀態' in df.columns:
            for state in df['狀態'].unique():
                df_state = df[df['狀態'] == state]
                safe_sheet_name = str(state)[:30].replace('/', '_').replace('\\', '_')
                df_state.to_excel(writer, sheet_name=safe_sheet_name, index=False)
                
    print(f"📊 Excel 報表產出成功: {excel_filename} (已依狀態自動建立分頁)")


def main():
    logging.basicConfig(
        level=logging.WARNING,
        format="%(levelname)s [%(name)s] %(message)s",
    )

    parser = argparse.ArgumentParser(
        description="Zammad Monthly Report Generator - 自動從 Zammad 產出月報與簡報資料",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""範例使用:
  python generate_report.py                     # 自動抓取上個月資料
  python generate_report.py --month 2026-07     # 指定抓取 2026 年 7 月
  python generate_report.py --mock              # 快速產生模擬資料供 Demo 體驗
        """
    )
    parser.add_argument("--month", type=str, help="指定報表月份 (格式: YYYY-MM，預設為上個月)")
    parser.add_argument("--mock", action="store_true", help="使用模擬資料產生報表 (無需連線 Zammad)")
    parser.add_argument("--mock-count", type=int, default=60, help="模擬資料筆數 (預設: 60)")

    args = parser.parse_args()

    # 計算月份區間 (使用共用模組)
    try:
        month_range = calculate_month_range(args.month)
    except ValueError:
        print("❌ 月份格式錯誤，請使用 YYYY-MM (例如 2026-07)")
        sys.exit(1)

    year_month = month_range.year_month
    start_date = month_range.start_date
    end_date = month_range.end_date
    report_end = month_range.report_end

    # 執行 Mock 模式或 API 連線模式
    if args.mock:
        records = generate_mock_tickets(year_month, count=args.mock_count)
        export_reports(records, year_month)
        print("\n🎉 模擬資料產生完成！你可以直接執行以下指令啟動簡報：")
        print("   cd zammad-report-slide && npm run dev\n")
    else:
        config = load_zammad_config(require=True)
        # load_zammad_config calls sys.exit(1) if config is invalid,
        # so we are guaranteed a valid config here.

        records = fetch_zammad_tickets(config.url, config.token, start_date, end_date, report_end)
        export_reports(records, year_month)
        print("\n🎉 報表處理完成！")


if __name__ == "__main__":
    main()