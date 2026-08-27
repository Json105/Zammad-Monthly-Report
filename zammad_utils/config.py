"""
Unified Zammad configuration loader.

Centralizes .env loading, validation, HTTPS safety checks, and header construction
so that every script in the project shares a single source of truth.
"""

from __future__ import annotations

import os
import sys
import logging
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


@dataclass
class ZammadConfig:
    """Validated Zammad connection configuration."""
    url: str
    token: str
    headers: dict = field(default_factory=dict, repr=False)
    allowed_domains: tuple = ()

    def __post_init__(self):
        self.headers = {"Authorization": f"Token token={self.token}"}


def load_zammad_config(*, require: bool = True) -> "ZammadConfig | None":
    """
    Load and validate Zammad connection settings from the environment.

    Parameters
    ----------
    require : bool
        If True (default), prints an error message and calls ``sys.exit(1)``
        when the configuration is missing or invalid.
        If False, returns ``None`` instead of exiting.

    Returns
    -------
    ZammadConfig | None
        A validated configuration object, or None when *require* is False
        and the configuration is incomplete.
    """
    load_dotenv()

    url = os.getenv("ZAMMAD_URL", "").strip().rstrip("/")
    token = os.getenv("ZAMMAD_API_TOKEN", "").strip()

    # --- Validation -----------------------------------------------------------
    if not url or not token or "your-zammad-instance" in url:
        if require:
            print("❌ 尚未設定有效的 Zammad 連線資訊！")
            print("💡 請依照以下步驟設定：")
            print("   1. 複製設定檔範本:  cp .env.example .env")
            print("   2. 編輯 .env 填入你的 ZAMMAD_URL 與 ZAMMAD_API_TOKEN")
            print()
            print("👉 或者你可以加上 --mock 參數先行體驗 Demo 模式：")
            print("   python generate_report.py --mock")
            sys.exit(1)
        return None

    # --- HTTPS safety warning -------------------------------------------------
    if not url.startswith("https://"):
        logger.warning(
            "⚠️  ZAMMAD_URL 使用的是非加密連線 (%s)。"
            "API Token 將以明文傳輸，建議改用 https://。",
            url,
        )

    # --- Allowed domains ------------------------------------------------------
    allowed_domains_env = os.getenv("ALLOWED_DOMAINS", "")
    allowed_domains = tuple(
        d.strip().lower() for d in allowed_domains_env.split(",") if d.strip()
    )

    return ZammadConfig(
        url=url,
        token=token,
        allowed_domains=allowed_domains,
    )
