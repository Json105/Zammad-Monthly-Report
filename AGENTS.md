# Workspace Engineering Rules

## 驗收與 `/goal` 執行紀律

- **嚴禁弱化或規避測試**：執行任何 `/goal` 任務或修正驗收錯誤時，絕不允許為了讓 `./scripts/check-done.sh` 或 `.agents/hooks.json` 的 `Stop` hook 通過，而刪除、跳過（如 `@pytest.mark.skip` / `xfail`）或弱化既有測試斷言。
- **遇環境缺失或外部阻礙立即回報**：若因環境缺失（例如缺少 Python 套件、Node/npm 工具、必要設定檔）或外部依賴阻礙（例如 Zammad API 無法連線或憑證失效）導致驗收或任務受阻，必須立即停止並明確回報具體阻礙原因與缺失項目，不得擅自繞過檢查或虛報通過。
- **公開展示脫敏原則**：任何納入 Git 追蹤的檔案（含程式、測試、文件與設定範本）不得包含真實公司名稱、內部網域/員工資訊、客戶工單資料或 API Token。
