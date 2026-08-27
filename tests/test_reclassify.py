"""Tests for the determine_new_group classification function."""

import pytest
from reclassify_others import determine_new_group


class TestOnOffboarding:
    """Test On/Offboarding classification rules."""

    def test_english_onboarding(self):
        assert determine_new_group("New employee onboarding request") == "On/Offboarding"

    def test_english_offboarding(self):
        assert determine_new_group("Employee off-boarding checklist") == "On/Offboarding"

    def test_chinese_new_hire(self):
        assert determine_new_group("新人報到 NB 配發") == "On/Offboarding"

    def test_chinese_resign(self):
        assert determine_new_group("離職員工帳號停用") == "On/Offboarding"

    def test_chinese_handover(self):
        assert determine_new_group("交接清單確認") == "On/Offboarding"

    def test_chinese_deploy(self):
        assert determine_new_group("新進同仁設備配發") == "On/Offboarding"


class TestEmailSecurity:
    """Test Email Security classification rules."""

    def test_phishing(self):
        assert determine_new_group("Received phishing email") == "Email Security"

    def test_spam(self):
        assert determine_new_group("spam filter not working") == "Email Security"

    def test_chinese_phishing(self):
        assert determine_new_group("收到釣魚信件，請確認") == "Email Security"

    def test_chinese_spam(self):
        assert determine_new_group("垃圾信太多無法正常收信") == "Email Security"

    def test_mail_release(self):
        assert determine_new_group("mail release request for quarantine") == "Email Security"


class TestAccountAccess:
    """Test Account & Access classification rules."""

    def test_password_reset(self):
        assert determine_new_group("Password reset request") == "Account & Access"

    def test_vpn(self):
        assert determine_new_group("VPN connection issue") == "Account & Access"

    def test_chinese_password(self):
        assert determine_new_group("重設密碼申請") == "Account & Access"

    def test_chinese_permission(self):
        assert determine_new_group("ERP 權限開通") == "Account & Access"

    def test_chinese_account(self):
        assert determine_new_group("帳號被鎖定") == "Account & Access"

    def test_license(self):
        assert determine_new_group("Software license activation") == "Account & Access"


class TestPeripherals:
    """Test Peripherals & Printing classification rules."""

    def test_printer(self):
        assert determine_new_group("Printer not working") == "Peripherals & Printing"

    def test_scanner(self):
        assert determine_new_group("scanner driver issue") == "Peripherals & Printing"

    def test_chinese_printer(self):
        assert determine_new_group("印表機驅動程式重新設定") == "Peripherals & Printing"

    def test_chinese_toner(self):
        assert determine_new_group("碳粉匣需要更換") == "Peripherals & Printing"


class TestHardware:
    """Test Hardware classification rules."""

    def test_monitor(self):
        assert determine_new_group("Monitor flickering issue") == "Hardware"

    def test_laptop(self):
        assert determine_new_group("laptop keyboard broken") == "Hardware"

    def test_chinese_screen(self):
        assert determine_new_group("螢幕閃爍問題排查") == "Hardware"

    def test_chinese_blackscreen(self):
        assert determine_new_group("筆電黑屏無法開機") == "Hardware"

    def test_chinese_return(self):
        assert determine_new_group("舊設備歸還") == "Hardware"


class TestSoftware:
    """Test Software classification rules."""

    def test_excel(self):
        assert determine_new_group("Excel file corrupted") == "Software"

    def test_teams(self):
        # "Teams" matches Software, but "login" matches Account & Access first (higher priority)
        assert determine_new_group("Teams app crashing") == "Software"

    def test_chinese_software(self):
        # "授權" matches Account & Access first; use a title without access keywords
        assert determine_new_group("軟體安裝需求") == "Software"

    def test_chinese_file_missing(self):
        assert determine_new_group("檔案消失需要復原") == "Software"


class TestITRequest:
    """Test IT Request & Project classification rules."""

    def test_sop(self):
        assert determine_new_group("SOP - backup procedure") == "IT Request & Project"

    def test_project(self):
        assert determine_new_group("New project infrastructure setup") == "IT Request & Project"

    def test_chinese_procurement(self):
        assert determine_new_group("採購新設備評估") == "IT Request & Project"

    def test_chinese_construction(self):
        assert determine_new_group("新辦公室網路建置") == "IT Request & Project"


class TestNoMatch:
    """Test cases that should remain in Others (return None)."""

    def test_empty_string(self):
        assert determine_new_group("") is None

    def test_generic_text(self):
        assert determine_new_group("Hello world") is None

    def test_unrelated_chinese(self):
        assert determine_new_group("今天天氣很好") is None

    def test_case_insensitive(self):
        # Should still match despite mixed case
        assert determine_new_group("ONBOARDING request") == "On/Offboarding"
        assert determine_new_group("PHISHING alert") == "Email Security"
