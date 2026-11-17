"""
Report metrics computation and Excel table formatting utilities.

Provides a single source of truth for classifying valid service tickets
(excluding ``merged`` duplicates) and formatting openpyxl worksheets as
structured Excel Tables matching the Open-Slide monthly report metrics.
"""

from __future__ import annotations

import unicodedata
from collections import Counter
from typing import Any

import pandas as pd
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.worksheet.worksheet import Worksheet

# Must stay in sync with zammad-report-slide/themes/monthlyReportTemplate.tsx
GROUP_DISPLAY_NAME: dict[str, str] = {
    "Others": "General Support",
}

DEFAULT_DOMAIN = "日常維運與行政事務"

DOMAIN_MAP: dict[str, str] = {
    "ERP / Core": "ERP 與業務系統",
    "ERP System": "ERP 與業務系統",
    "Software": "電腦硬體與辦公軟體",
    "Hardware": "電腦硬體與辦公軟體",
    "Peripherals & Printing": "電腦硬體與辦公軟體",
    "Email Security": "資安防護與帳號權限",
    "Security": "資安防護與帳號權限",
    "Account & Access": "資安防護與帳號權限",
    "On/Offboarding": "資安防護與帳號權限",
    "Network": "辦公網路與通訊設備",
    "IP-Phone": "辦公網路與通訊設備",
    "Development": "辦公網路與通訊設備",
    "IT Request & Project": "辦公網路與通訊設備",
    "Others": DEFAULT_DOMAIN,
    "Users / General": DEFAULT_DOMAIN,
    "General Support": DEFAULT_DOMAIN,
}

BASE_TICKET_COLUMNS: list[str] = [
    "工單編號",
    "主旨",
    "標籤",
    "狀態",
    "群組",
    "處理人",
    "提單人",
    "建立時間",
    "最後更新時間",
]

VALID_TICKET_AUDIT_COLUMNS: list[str] = [
    "簡報狀態分類",
    "簡報服務類別",
    "IT服務領域",
    "資安郵件",
    "SOP工單",
    "總部支援",
    "資料來源",
]


def _display_width(text: str) -> int:
    """Estimate terminal/Excel character width (CJK wide chars count as 2)."""
    width = 0
    for ch in text:
        width += 2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1
    return width


def resolve_target_month(records: list[dict[str, Any]], fallback_ym: str = "") -> str:
    """Resolve the report month (YYYY-MM) from *fallback_ym* or ticket dates."""
    if fallback_ym:
        return fallback_ym

    counts: Counter[str] = Counter()
    for rec in records:
        if str(rec.get("狀態", "")).strip().lower() == "merged":
            continue
        date_str = str(rec.get("建立時間") or rec.get("最後更新時間") or "")
        if len(date_str) >= 7:
            counts[date_str[:7]] += 1
    return counts.most_common(1)[0][0] if counts else ""


def classify_valid_service_tickets(
    records: list[dict[str, Any]],
    target_ym: str,
    hq_email: str = "",
) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, Any]]:
    """
    Separate valid service tickets from merged duplicates and enrich audit columns.

    Parameters
    ----------
    records : list[dict[str, Any]]
        Normalized ticket records exported by ``fetch_zammad_tickets`` or ``generate_mock_tickets``.
    target_ym : str
        Target month string in ``YYYY-MM`` format.
    hq_email : str, optional
        Optional HQ email address used to flag HQ/featured support tickets.

    Returns
    -------
    tuple[pd.DataFrame, pd.DataFrame, dict[str, Any]]
        ``(valid_df, all_df, summary_dict)`` matching the slide template logic.
    """
    if not records:
        empty_valid = pd.DataFrame(columns=BASE_TICKET_COLUMNS + VALID_TICKET_AUDIT_COLUMNS)
        empty_all = pd.DataFrame(columns=BASE_TICKET_COLUMNS + ["是否計入有效工單"])
        empty_summary = {
            "target_ym": target_ym,
            "total_raw": 0,
            "total_valid": 0,
            "excluded_merged": 0,
            "closed_count": 0,
            "new_unclosed_count": 0,
            "accumulated_unclosed_count": 0,
            "resolution_rate": "0.0",
            "email_security_count": 0,
            "sop_count": 0,
            "featured_count": 0,
            "status_counts": {},
            "group_counts": {},
            "domain_counts": {},
        }
        return empty_valid, empty_all, empty_summary

    resolved_ym = resolve_target_month(records, target_ym)
    hq_marker = (hq_email or "").strip().lower()

    all_rows: list[dict[str, Any]] = []
    valid_rows: list[dict[str, Any]] = []

    status_counts: Counter[str] = Counter()
    group_counts: Counter[str] = Counter()
    domain_counts: Counter[str] = Counter()

    closed_count = 0
    new_unclosed_count = 0
    accumulated_unclosed_count = 0
    email_security_count = 0
    sop_count = 0
    featured_count = 0

    for rec in records:
        raw_status = str(rec.get("狀態", "Unknown") or "Unknown").strip()
        is_merged = raw_status.lower() == "merged"

        all_row = dict(rec)
        all_row["是否計入有效工單"] = "否 (merged 排除)" if is_merged else "是"
        all_rows.append(all_row)

        if is_merged:
            continue

        raw_group = str(rec.get("群組", "Unknown") or "Unknown")
        display_group = GROUP_DISPLAY_NAME.get(raw_group, raw_group)
        domain = DOMAIN_MAP.get(raw_group, DEFAULT_DOMAIN)
        tags = str(rec.get("標籤", "") or "")
        title = str(rec.get("主旨", "") or "")
        requester = str(rec.get("提單人", "") or "")
        created_at = str(rec.get("建立時間", "") or "")
        is_current_month = bool(resolved_ym and created_at.startswith(resolved_ym))

        if raw_status.lower() == "closed":
            slide_status = "closed"
            closed_count += 1
            data_source = "當月新進" if is_current_month else "跨月結案/異動"
        elif is_current_month:
            slide_status = "Work in Progress (本月)"
            new_unclosed_count += 1
            data_source = "當月新進"
        else:
            slide_status = "Work in Progress (過去)"
            accumulated_unclosed_count += 1
            data_source = "歷史在辦"

        is_email_sec = raw_group == "Email Security"
        is_sop = "SOP" in title.upper()
        # Case-insensitive check so mixed-case tags/requesters match the configured HQ marker
        tags_lower = tags.lower()
        requester_lower = requester.strip().lower()
        is_hq = bool(
            (hq_marker and (hq_marker in tags_lower or requester_lower == hq_marker))
            or ("group-it support" in requester_lower)
        )

        if is_email_sec:
            email_security_count += 1
        if is_sop:
            sop_count += 1
        if is_hq:
            featured_count += 1

        status_counts[slide_status] += 1
        group_counts[display_group] += 1
        domain_counts[domain] += 1

        enriched = dict(rec)
        enriched["簡報狀態分類"] = slide_status
        enriched["簡報服務類別"] = display_group
        enriched["IT服務領域"] = domain
        enriched["資安郵件"] = "是" if is_email_sec else "否"
        enriched["SOP工單"] = "是" if is_sop else "否"
        enriched["總部支援"] = "是" if is_hq else "否"
        enriched["資料來源"] = data_source
        valid_rows.append(enriched)

    all_df = pd.DataFrame(all_rows)
    valid_df = pd.DataFrame(valid_rows)

    if not all_df.empty and {"狀態", "建立時間"}.issubset(all_df.columns):
        all_df = all_df.sort_values(by=["狀態", "建立時間"], ascending=[True, False]).reset_index(drop=True)

    if not valid_df.empty and {"簡報狀態分類", "建立時間"}.issubset(valid_df.columns):
        valid_df = valid_df.sort_values(
            by=["簡報狀態分類", "建立時間"], ascending=[True, False]
        ).reset_index(drop=True)

    total_valid = len(valid_df)
    total_raw = len(all_df)
    resolution_rate = f"{(closed_count / total_valid) * 100:.1f}" if total_valid > 0 else "0.0"

    summary = {
        "target_ym": resolved_ym,
        "total_raw": total_raw,
        "total_valid": total_valid,
        "excluded_merged": total_raw - total_valid,
        "closed_count": closed_count,
        "new_unclosed_count": new_unclosed_count,
        "accumulated_unclosed_count": accumulated_unclosed_count,
        "resolution_rate": resolution_rate,
        "email_security_count": email_security_count,
        "sop_count": sop_count,
        "featured_count": featured_count,
        "status_counts": dict(status_counts),
        "group_counts": dict(sorted(group_counts.items(), key=lambda x: x[1], reverse=True)),
        "domain_counts": dict(sorted(domain_counts.items(), key=lambda x: x[1], reverse=True)),
    }
    return valid_df, all_df, summary


def build_summary_dataframe(summary: dict[str, Any]) -> pd.DataFrame:
    """Build an audit summary DataFrame matching every metric on the report slides."""
    total_valid = summary["total_valid"]
    rows: list[dict[str, Any]] = [
        {
            "統計維度": "核心指標",
            "項目": "有效服務工單總計 (排除 merged)",
            "數量": total_valid,
            "備註 / 佔比": f"原始擷取 {summary['total_raw']} 筆，排除 {summary['excluded_merged']} 筆 merged",
        },
        {
            "統計維度": "核心指標",
            "項目": "當月結案數 (closed)",
            "數量": summary["closed_count"],
            "備註 / 佔比": f"結案率 {summary['resolution_rate']}%",
        },
        {
            "統計維度": "核心指標",
            "項目": "資安與郵件防護 (Email Security)",
            "數量": summary["email_security_count"],
            "備註 / 佔比": "群組為 Email Security 之有效工單",
        },
        {
            "統計維度": "重點追蹤",
            "項目": "總部支援工單",
            "數量": summary["featured_count"],
            "備註 / 佔比": "提單人含 Group-IT Support 或符合 HQ 標記",
        },
        {
            "統計維度": "重點追蹤",
            "項目": "SOP 標準化流程工單",
            "數量": summary["sop_count"],
            "備註 / 佔比": "主旨包含 SOP 之有效工單",
        },
    ]

    for status_name in ("closed", "Work in Progress (過去)", "Work in Progress (本月)"):
        cnt = summary["status_counts"].get(status_name, 0)
        if cnt > 0 or status_name == "closed":
            pct = f"{(cnt / total_valid) * 100:.1f}%" if total_valid > 0 else "0.0%"
            rows.append(
                {
                    "統計維度": "工單狀態結算",
                    "項目": status_name,
                    "數量": cnt,
                    "備註 / 佔比": pct,
                }
            )

    for grp_name, cnt in summary["group_counts"].items():
        pct = f"{(cnt / total_valid) * 100:.1f}%" if total_valid > 0 else "0.0%"
        rows.append(
            {
                "統計維度": "服務類別統計",
                "項目": grp_name,
                "數量": cnt,
                "備註 / 佔比": pct,
            }
        )

    for dom_name, cnt in summary["domain_counts"].items():
        pct = f"{(cnt / total_valid) * 100:.1f}%" if total_valid > 0 else "0.0%"
        rows.append(
            {
                "統計維度": "IT 服務領域佔比",
                "項目": dom_name,
                "數量": cnt,
                "備註 / 佔比": pct,
            }
        )

    return pd.DataFrame(rows)


def format_excel_table_sheet(
    ws: Worksheet,
    df: pd.DataFrame,
    table_name: str,
    *,
    header_fill_hex: str = "00418F",
) -> None:
    """
    Apply Isometric-styled header formatting, auto column widths, freeze panes,
    and an Excel structured Table object to *ws*.
    """
    if df.empty or len(df.columns) == 0:
        return

    num_cols = len(df.columns)
    num_rows = len(df) + 1  # including header row
    end_col_letter = get_column_letter(num_cols)

    # Style header row with corporate navy & crisp white text
    header_fill = PatternFill(start_color=header_fill_hex, end_color=header_fill_hex, fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_align = Alignment(horizontal="left", vertical="center")

    for col_idx in range(1, num_cols + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_align

    ws.row_dimensions[1].height = 24
    ws.freeze_panes = "A2"

    # Auto-adjust column widths accounting for wide CJK characters
    for col_idx, col_name in enumerate(df.columns, start=1):
        col_letter = get_column_letter(col_idx)
        max_width = _display_width(str(col_name)) + 4  # room for filter dropdown arrow
        for val in df.iloc[:, col_idx - 1]:
            val_str = "" if pd.isna(val) else str(val)
            w = _display_width(val_str) + 2
            if w > max_width:
                max_width = w
        ws.column_dimensions[col_letter].width = max(12, min(max_width, 58))

    # Attach native Excel Table (requires >= 1 data row)
    if num_rows >= 2:
        tab = Table(displayName=table_name, ref=f"A1:{end_col_letter}{num_rows}")
        tab.tableStyleInfo = TableStyleInfo(
            name="TableStyleMedium2",
            showFirstColumn=False,
            showLastColumn=False,
            showRowStripes=True,
            showColumnStripes=False,
        )
        ws.add_table(tab)
