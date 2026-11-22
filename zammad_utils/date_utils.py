"""
Date and month-range utilities.

Centralizes the month-interval calculation logic that was previously
duplicated across ``generate_report.py`` and ``reclassify_others.py``.
Uses ``calendar.monthrange`` to correctly handle leap years.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional
from dateutil.relativedelta import relativedelta


@dataclass
class MonthRange:
    """Represents a resolved month period used for querying tickets."""
    year_month: str        # e.g. "2026-07"
    start_date: str        # first day, e.g. "2026-07-01"
    end_date: str          # last day, e.g. "2026-07-31"
    report_end: str        # report-view cutoff (end of *next* month)


def calculate_month_range(year_month: str | None = None) -> MonthRange:
    """
    Compute the date boundaries for a given ``YYYY-MM`` string.

    Parameters
    ----------
    year_month : str or None
        Target month in ``YYYY-MM`` format.  When *None*, defaults to
        the previous calendar month relative to today.

    Returns
    -------
    MonthRange
        Resolved date boundaries.

    Raises
    ------
    ValueError
        If *year_month* is not a valid ``YYYY-MM`` string.
    """
    if year_month:
        target_date = datetime.strptime(year_month, "%Y-%m")
    else:
        today = datetime.today()
        target_date = today.replace(day=1) - relativedelta(months=1)
        year_month = target_date.strftime("%Y-%m")

    year = target_date.year
    month = target_date.month

    # calendar.monthrange correctly handles leap years
    _, days_in_month = calendar.monthrange(year, month)

    start_date = f"{year:04d}-{month:02d}-01"
    end_date = f"{year:04d}-{month:02d}-{days_in_month:02d}"

    # Report-view cutoff: end of the month *after* the target month
    report_end_dt = target_date + relativedelta(months=2) - timedelta(days=1)
    report_end = report_end_dt.strftime("%Y-%m-%d")

    return MonthRange(
        year_month=year_month,
        start_date=start_date,
        end_date=end_date,
        report_end=report_end,
    )


def days_in_month(year: int, month: int) -> int:
    """Return the number of days in the given month (leap-year aware)."""
    _, days = calendar.monthrange(year, month)
    return days


def calculate_cutoff_range(
    end_month: str | None = None,
    cutoff_day: int = 15,
    reference_date: datetime | None = None,
) -> MonthRange:
    """
    Compute a monthly cutoff-day interval (e.g. 15th to next month's 15th).

    Parameters
    ----------
    end_month : str or None
        Closing month in ``YYYY-MM`` format (e.g. ``"2026-11"`` yields
        ``2026-10-15`` through ``2026-11-15``). When *None*, picks the latest
        completed cutoff period relative to *reference_date* (or today).
    cutoff_day : int, default 15
        Anchor day of month (1-31), clamped to each month's length.
    reference_date : datetime or None
        Optional reference date for deterministic resolution when *end_month* is None.
    """
    if not 1 <= cutoff_day <= 31:
        raise ValueError(f"cutoff_day must be between 1 and 31, got {cutoff_day}")

    if end_month:
        end_anchor = datetime.strptime(end_month, "%Y-%m")
    else:
        today = reference_date or datetime.today()
        if today.day >= cutoff_day:
            end_anchor = today.replace(day=1)
        else:
            end_anchor = today.replace(day=1) - relativedelta(months=1)

    start_anchor = end_anchor - relativedelta(months=1)
    start_day = min(cutoff_day, days_in_month(start_anchor.year, start_anchor.month))
    end_day = min(cutoff_day, days_in_month(end_anchor.year, end_anchor.month))

    start_date = f"{start_anchor.year:04d}-{start_anchor.month:02d}-{start_day:02d}"
    end_date = f"{end_anchor.year:04d}-{end_anchor.month:02d}-{end_day:02d}"
    period_key = f"{start_date}_to_{end_date}"

    return MonthRange(
        year_month=period_key,
        start_date=start_date,
        end_date=end_date,
        report_end=end_date,
    )


def calculate_custom_range(start_date: str, end_date: str) -> MonthRange:
    """
    Validate and build a custom ``YYYY-MM-DD`` to ``YYYY-MM-DD`` report range.
    """
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    if start_dt > end_dt:
        raise ValueError(f"start_date ({start_date}) must not be after end_date ({end_date})")

    norm_start = start_dt.strftime("%Y-%m-%d")
    norm_end = end_dt.strftime("%Y-%m-%d")
    return MonthRange(
        year_month=f"{norm_start}_to_{norm_end}",
        start_date=norm_start,
        end_date=norm_end,
        report_end=norm_end,
    )
