"""Tests for valid service ticket classification and Excel table export."""

from __future__ import annotations

import os
import openpyxl
import pytest

from generate_report import export_reports
from zammad_utils.report_metrics import (
    build_summary_dataframe,
    classify_valid_service_tickets,
)


def _sample_records() -> list[dict[str, str]]:
    return [
        {
            "工單編號": "1001",
            "主旨": "M365 license activation",
            "標籤": "",
            "狀態": "closed",
            "群組": "Software",
            "處理人": "Alex Chen",
            "提單人": "Alice",
            "建立時間": "2026-10-12",
            "最後更新時間": "2026-10-13",
        },
        {
            "工單編號": "1002",
            "主旨": "SOP - Onboarding checklist",
            "標籤": "sop",
            "狀態": "open",
            "群組": "Others",
            "處理人": "Sarah Lin",
            "提單人": "Bob",
            "建立時間": "2026-10-20",
            "最後更新時間": "2026-10-21",
        },
        {
            "工單編號": "1003",
            "主旨": "Historical unresolved VPN issue",
            "標籤": "",
            "狀態": "open",
            "群組": "Network",
            "處理人": "Alex Chen",
            "提單人": "Group-IT Support",
            "建立時間": "2026-09-05",
            "最後更新時間": "2026-10-10",
        },
        {
            "工單編號": "1004",
            "主旨": "Phishing alert verification",
            "標籤": "security",
            "狀態": "closed",
            "群組": "Email Security",
            "處理人": "Sarah Lin",
            "提單人": "Carol",
            "建立時間": "2026-09-28",
            "最後更新時間": "2026-10-02",
        },
        {
            "工單編號": "1005",
            "主旨": "Duplicate email ticket",
            "標籤": "",
            "狀態": "merged",
            "群組": "Email Security",
            "處理人": "Alex Chen",
            "提單人": "Dave",
            "建立時間": "2026-10-15",
            "最後更新時間": "2026-10-15",
        },
    ]


class TestClassifyValidServiceTickets:
    """Verify valid service ticket filtering and slide-aligned classification."""

    def test_excludes_merged_and_computes_metrics(self):
        valid_df, all_df, summary = classify_valid_service_tickets(
            _sample_records(), "2026-10", hq_email="hq@example.com"
        )

        assert len(all_df) == 5
        assert len(valid_df) == 4
        assert summary["total_raw"] == 5
        assert summary["total_valid"] == 4
        assert summary["excluded_merged"] == 1
        assert summary["closed_count"] == 2
        assert summary["new_unclosed_count"] == 1
        assert summary["accumulated_unclosed_count"] == 1
        assert summary["resolution_rate"] == "50.0"
        assert summary["email_security_count"] == 1  # merged email security ticket excluded
        assert summary["sop_count"] == 1
        assert summary["featured_count"] == 1

    def test_audit_columns_mapping(self):
        valid_df, all_df, _ = classify_valid_service_tickets(_sample_records(), "2026-10")

        merged_row = all_df[all_df["工單編號"] == "1005"].iloc[0]
        assert merged_row["是否計入有效工單"] == "否 (merged 排除)"

        row_1002 = valid_df[valid_df["工單編號"] == "1002"].iloc[0]
        assert row_1002["簡報狀態分類"] == "Work in Progress (本月)"
        assert row_1002["簡報服務類別"] == "General Support"
        assert row_1002["IT服務領域"] == "日常維運與行政事務"
        assert row_1002["SOP工單"] == "是"
        assert row_1002["資料來源"] == "當月新進"

        row_1003 = valid_df[valid_df["工單編號"] == "1003"].iloc[0]
        assert row_1003["簡報狀態分類"] == "Work in Progress (過去)"
        assert row_1003["總部支援"] == "是"
        assert row_1003["資料來源"] == "歷史在辦"

        row_1004 = valid_df[valid_df["工單編號"] == "1004"].iloc[0]
        assert row_1004["簡報狀態分類"] == "closed"
        assert row_1004["資安郵件"] == "是"
        assert row_1004["資料來源"] == "跨月結案/異動"

    def test_hq_tag_matching_case_insensitive(self):
        records = _sample_records()
        records[0]["標籤"] = "notified-closed, HQ@Example.com"
        valid_df, _, summary = classify_valid_service_tickets(
            records, "2026-10", hq_email="hq@example.com"
        )
        assert summary["featured_count"] == 2
        row_1001 = valid_df[valid_df["工單編號"] == "1001"].iloc[0]
        assert row_1001["總部支援"] == "是"

    def test_handles_empty_records(self):
        valid_df, all_df, summary = classify_valid_service_tickets([], "2026-10")
        assert valid_df.empty
        assert all_df.empty
        assert summary["total_valid"] == 0
        summary_df = build_summary_dataframe(summary)
        assert not summary_df.empty


class TestExcelTableExport:
    """Verify Excel workbook contains structured Excel Tables for validation."""

    def test_export_reports_creates_valid_tickets_excel_table(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        export_reports(_sample_records(), "2026-10", output_slide_data=False)

        xlsx_path = tmp_path / "Zammad_Report_2026-10.xlsx"
        assert xlsx_path.exists()

        wb = openpyxl.load_workbook(xlsx_path)
        assert wb.sheetnames[:3] == ["有效服務工單", "統計驗證摘要", "全部工單"]

        ws_valid = wb["有效服務工單"]
        assert "ValidServiceTickets" in ws_valid.tables
        assert ws_valid.tables["ValidServiceTickets"].ref.startswith("A1:")
        # Header + 4 valid rows
        assert ws_valid.max_row == 5

        ws_summary = wb["統計驗證摘要"]
        assert "AuditSummary" in ws_summary.tables

        ws_all = wb["全部工單"]
        assert "AllTickets" in ws_all.tables
        assert ws_all.max_row == 6
