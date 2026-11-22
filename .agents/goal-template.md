# `/goal` 任務提示詞模板（Zammad Monthly Report & Slide Generator）

複製以下模板並填入 `<...>` 佔位符，即可搭配 `/goal` 指令啟動具備自動驗收閉環（`Stop` hook + `./scripts/check-done.sh`）的自主執行任務。

---

```markdown
## Objective
- 明確描述本次要完成的功能、缺陷修復或重構目標：<例如：新增 XXX 工單統計指標 / 修復 YYY 匯出邊界問題>
- 說明預期影響的子系統：
  - 後端擷取與報表匯出（Python 3.10：`generate_report.py`、`reclassify_others.py`、`zammad_utils/`、`tests/`）
  - 或互動簡報前端（React 18 + Open-Slide + Recharts + Vite 5：`zammad-report-slide/`）
- 描述完成後的預期行為與商業/維運邏輯。

## Scope
- 允許修改的檔案或目錄：<例如：zammad_utils/report_metrics.py、tests/test_slide_metrics.py>
- 需遵守的專案技術棧與程式碼慣例：
  - Python：保留並補齊 Type Hints，重用 `zammad_utils/`（`config.py`、`date_utils.py`、`report_metrics.py`、`api.py`），維持 `openpyxl` Table 與 `pandas` 欄位規範。
  - 前端（如有涉及）：TypeScript 嚴格模式（`strict: true`），維持與 `zammad_utils/report_metrics.py` 統計口徑一致（如 `DOMAIN_MAP`、`GROUP_DISPLAY_NAME`、HQ 標記與 `merged` 排除規則）。
  - 測試：新邏輯與邊界條件須於 `tests/` 補齊對應 `pytest` 單元測試。

## Done when
- [ ] 核心驗收腳本 `./scripts/check-done.sh` 全數通過（涵蓋 `py_compile` 語法檢查、核心模組匯入檢查與 `pytest tests/` 單元測試）。
- [ ] 若本次變更包含 `zammad-report-slide/` 前端檔案，需額外執行 `./scripts/check-done.sh --with-frontend` 通過（驗證 `npm run build` 成功）。
- [ ] 若任務涉及公開提交或作品集展示，已確認 Git 追蹤與待提交檔案不含 `.env`、真實公司名稱/信箱/API Token，亦未納入生成檔（`*.xlsx`、`public/data/*.json`、`slides/report-*/`）。

## Not in this goal
- **絕不為了讓 `./scripts/check-done.sh` 通過而刪除、跳過（`skip` / `xfail`）或弱化既有測試與斷言。**
- 不修改與本次目標無關的既有檔案或重寫整體架構。
- 未經明確確認前，不新增第三方 Python（`requirements.txt`）或 npm（`zammad-report-slide/package.json`）相依套件。
- 不破壞既有 CLI 參數（`--month`、`--start`、`--end`、`--cutoff-day`、`--full-month`、`--mock`）與 Excel 工作表/Table Schema 之向後相容性。
- 絕不將真實客戶工單資料或內部機敏資訊寫入程式碼與測試範例。

## If blocked
- 若遇到**環境缺失**（缺少相依套件、工具或設定檔）或**外部依賴阻礙**（Zammad API 無法連線、憑證失效等），必須**立即停止並明確回報**阻礙原因，不得繞過或略過驗收檢查（僅在明確只需離線驗證時才於報告中註記改用 `--mock` 的邊界）。
- 若遇到統計口徑、日期邊界或 UI 呈現的規格歧義，立即停下並列出選項向使用者確認，不自行猜測假設。
- 若 `./scripts/check-done.sh` 連續兩次修復後仍失敗，附上完整錯誤輸出與根因分析並停止執行，等待進一步指示。

## Deliver
- 變更檔案清單與每個檔案的核心修改摘要（附可點擊檔案路徑連結）。
- 實測執行的驗收指令（如 `./scripts/check-done.sh` 或 `./scripts/check-done.sh --with-frontend`）與實際觀察到的輸出結果（通過測試數 / 建置狀態）。
- 任何未覆蓋的邊界情境、潛在風險或後續建議步驟（如是否需要重新執行報表生成或推送至遠端）。
```
