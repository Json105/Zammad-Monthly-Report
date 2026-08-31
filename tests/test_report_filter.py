"""Tests for stale closed ticket filtering in generate_report module."""

import pandas as pd
import pytest
from generate_report import filter_stale_closed_tickets


class TestFilterStaleClosedTickets:
    """Test suite for filter_stale_closed_tickets."""

    def test_filter_removes_old_closed_tickets(self):
        """Tickets created and closed before the target start_date must be removed."""
        df = pd.DataFrame([
            {
                "工單編號": "564682",
                "主旨": "FW: Old Invoice",
                "狀態": "closed",
                "建立時間": "2025-12-10",
                "最後更新時間": "2025-12-10",
            },
            {
                "工單編號": "565001",
                "主旨": "Current Month Ticket",
                "狀態": "closed",
                "建立時間": "2026-07-05",
                "最後更新時間": "2026-07-10",
            },
        ])
        result = filter_stale_closed_tickets(df, "2026-07-01")
        assert len(result) == 1
        assert result.iloc[0]["工單編號"] == "565001"

    def test_filter_keeps_cross_month_updated_tickets(self):
        """Tickets created earlier but updated/closed in current month must be kept."""
        df = pd.DataFrame([
            {
                "工單編號": "564700",
                "主旨": "Cross-month closed",
                "狀態": "closed",
                "建立時間": "2026-06-15",
                "最後更新時間": "2026-07-03",
            }
        ])
        result = filter_stale_closed_tickets(df, "2026-07-01")
        assert len(result) == 1
        assert result.iloc[0]["工單編號"] == "564700"

    def test_filter_keeps_historical_open_tickets(self):
        """Historical tickets that are still open/pending must be kept."""
        df = pd.DataFrame([
            {
                "工單編號": "564701",
                "主旨": "Still open from June",
                "狀態": "open",
                "建立時間": "2026-06-01",
                "最後更新時間": "2026-06-20",
            },
            {
                "工單編號": "564702",
                "主旨": "Pending reminder from May",
                "狀態": "pending reminder",
                "建立時間": "2026-05-10",
                "最後更新時間": "2026-05-15",
            },
        ])
        result = filter_stale_closed_tickets(df, "2026-07-01")
        assert len(result) == 2

    def test_filter_handles_empty_or_invalid_df(self):
        """Empty or malformed DataFrame should return without error."""
        empty_df = pd.DataFrame()
        assert filter_stale_closed_tickets(empty_df, "2026-07-01").empty

        malformed_df = pd.DataFrame([{"col1": "val1"}])
        assert len(filter_stale_closed_tickets(malformed_df, "2026-07-01")) == 1
