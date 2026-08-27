"""Tests for zammad_utils.config module."""

import os
import pytest
from unittest.mock import patch
from zammad_utils.config import load_zammad_config, ZammadConfig


class TestZammadConfig:
    """Test the ZammadConfig dataclass."""

    def test_headers_auto_constructed(self):
        config = ZammadConfig(url="https://example.com", token="abc123")
        assert config.headers == {"Authorization": "Token token=abc123"}

    def test_default_allowed_domains(self):
        config = ZammadConfig(url="https://example.com", token="abc123")
        assert config.allowed_domains == ()


class TestLoadZammadConfig:
    """Test the load_zammad_config function."""

    @patch.dict(os.environ, {
        "ZAMMAD_URL": "https://support.example.com",
        "ZAMMAD_API_TOKEN": "test_token_123",
        "ALLOWED_DOMAINS": "@example.com,@corp.com",
    })
    def test_valid_config(self):
        config = load_zammad_config(require=False)
        assert config is not None
        assert config.url == "https://support.example.com"
        assert config.token == "test_token_123"
        assert config.allowed_domains == ("@example.com", "@corp.com")

    @patch.dict(os.environ, {
        "ZAMMAD_URL": "https://support.example.com/",
        "ZAMMAD_API_TOKEN": "test_token",
    })
    def test_trailing_slash_stripped(self):
        config = load_zammad_config(require=False)
        assert config is not None
        assert config.url == "https://support.example.com"

    @patch.dict(os.environ, {
        "ZAMMAD_URL": "",
        "ZAMMAD_API_TOKEN": "",
    })
    def test_empty_values_returns_none(self):
        config = load_zammad_config(require=False)
        assert config is None

    @patch.dict(os.environ, {
        "ZAMMAD_URL": "https://your-zammad-instance.com",
        "ZAMMAD_API_TOKEN": "some_token",
    })
    def test_placeholder_url_returns_none(self):
        config = load_zammad_config(require=False)
        assert config is None

    @patch.dict(os.environ, {
        "ZAMMAD_URL": "",
        "ZAMMAD_API_TOKEN": "",
    })
    def test_require_true_exits(self):
        with pytest.raises(SystemExit):
            load_zammad_config(require=True)

    @patch.dict(os.environ, {
        "ZAMMAD_URL": "http://insecure.example.com",
        "ZAMMAD_API_TOKEN": "test_token",
    })
    def test_http_url_logs_warning(self, caplog):
        """Non-HTTPS URL should trigger a warning."""
        import logging
        with caplog.at_level(logging.WARNING, logger="zammad_utils.config"):
            config = load_zammad_config(require=False)
        assert config is not None
        assert "非加密連線" in caplog.text

    @patch.dict(os.environ, {
        "ZAMMAD_URL": "https://example.com",
        "ZAMMAD_API_TOKEN": "token",
        "ALLOWED_DOMAINS": "",
    })
    def test_empty_allowed_domains(self):
        config = load_zammad_config(require=False)
        assert config is not None
        assert config.allowed_domains == ()

    @patch.dict(os.environ, {
        "ZAMMAD_URL": "https://example.com",
        "ZAMMAD_API_TOKEN": "token",
        "ALLOWED_DOMAINS": "  @a.com , @b.com , ",
    })
    def test_allowed_domains_trimmed(self):
        config = load_zammad_config(require=False)
        assert config is not None
        assert config.allowed_domains == ("@a.com", "@b.com")
