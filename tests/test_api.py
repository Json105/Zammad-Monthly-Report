"""Tests for zammad_utils.api module."""

import pytest
from unittest.mock import patch, MagicMock
from zammad_utils.config import ZammadConfig
from zammad_utils.api import (
    fetch_ticket_states,
    fetch_groups,
    fetch_simplified_assets,
)


@pytest.fixture
def mock_config():
    return ZammadConfig(url="https://support.example.com", token="test_token")


class TestApiHelpers:
    """Test suite for shared API helper functions."""

    @patch("requests.get")
    def test_fetch_ticket_states_success(self, mock_get, mock_config):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [
            {"id": 1, "name": "new"},
            {"id": 2, "name": "open"},
            {"id": 4, "name": "closed"},
        ]
        mock_get.return_value = mock_resp

        states = fetch_ticket_states(mock_config)
        assert states == {1: "new", 2: "open", 4: "closed"}
        mock_get.assert_called_once_with(
            "https://support.example.com/api/v1/ticket_states",
            headers=mock_config.headers,
            timeout=15,
        )

    @patch("requests.get")
    def test_fetch_ticket_states_failure(self, mock_get, mock_config):
        mock_resp = MagicMock()
        mock_resp.status_code = 403
        mock_resp.text = "Forbidden"
        mock_get.return_value = mock_resp

        states = fetch_ticket_states(mock_config)
        assert states == {}

    @patch("requests.get")
    def test_fetch_groups_success(self, mock_get, mock_config):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [
            {"id": 1, "name": "Users / General"},
            {"id": 2, "name": "Software"},
        ]
        mock_get.return_value = mock_resp

        groups = fetch_groups(mock_config)
        assert groups == {"Users / General": 1, "Software": 2}

    @patch("zammad_utils.api.fetch_ticket_states")
    @patch("requests.get")
    def test_fetch_simplified_assets_success(self, mock_get, mock_fetch_states, mock_config):
        mock_fetch_states.return_value = {1: "new", 4: "closed"}

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "assets": {
                "Group": {"1": {"name": "Users"}},
                "User": {"10": {"firstname": "John", "lastname": "Doe"}},
            }
        }
        mock_get.return_value = mock_resp

        assets = fetch_simplified_assets(mock_config)
        assert assets["State"] == {"1": "new", "4": "closed"}
        assert assets["Group"] == {"1": "Users"}
        assert assets["User"] == {"10": "John Doe"}
