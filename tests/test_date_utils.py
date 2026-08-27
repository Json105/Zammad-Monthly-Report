"""Tests for zammad_utils.date_utils module."""

import pytest
from zammad_utils.date_utils import calculate_month_range, days_in_month


class TestDaysInMonth:
    """Test the days_in_month helper."""

    def test_january(self):
        assert days_in_month(2026, 1) == 31

    def test_february_normal(self):
        assert days_in_month(2025, 2) == 28

    def test_february_leap_year(self):
        assert days_in_month(2024, 2) == 29

    def test_february_century_non_leap(self):
        assert days_in_month(1900, 2) == 28

    def test_february_century_leap(self):
        assert days_in_month(2000, 2) == 29

    def test_april(self):
        assert days_in_month(2026, 4) == 30

    def test_december(self):
        assert days_in_month(2026, 12) == 31


class TestCalculateMonthRange:
    """Test the calculate_month_range function."""

    def test_specific_month(self):
        result = calculate_month_range("2026-07")
        assert result.year_month == "2026-07"
        assert result.start_date == "2026-07-01"
        assert result.end_date == "2026-07-31"

    def test_february_leap(self):
        result = calculate_month_range("2024-02")
        assert result.end_date == "2024-02-29"

    def test_february_non_leap(self):
        result = calculate_month_range("2025-02")
        assert result.end_date == "2025-02-28"

    def test_report_end_is_end_of_next_month(self):
        result = calculate_month_range("2026-05")
        # report_end = end of July (target + 2 months - 1 day)
        assert result.report_end == "2026-06-30"

    def test_report_end_december(self):
        result = calculate_month_range("2026-11")
        # Nov → report_end = Nov + 2 months - 1 day = Dec 31
        assert result.report_end == "2026-12-31"

    def test_default_returns_previous_month(self):
        """When no month is specified, should return the previous month."""
        result = calculate_month_range(None)
        # We can't assert exact values since it depends on 'today',
        # but we can verify the structure is valid.
        assert len(result.year_month) == 7  # "YYYY-MM"
        assert result.start_date.endswith("-01")
        assert result.year_month in result.start_date
        assert result.year_month in result.end_date

    def test_invalid_format_raises(self):
        with pytest.raises(ValueError):
            calculate_month_range("not-a-date")

    def test_invalid_month_format(self):
        with pytest.raises(ValueError):
            calculate_month_range("2026-13")

    def test_year_only_raises(self):
        with pytest.raises(ValueError):
            calculate_month_range("2026")
