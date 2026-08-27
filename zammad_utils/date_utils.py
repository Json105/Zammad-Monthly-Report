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
