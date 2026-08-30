# 📊 Zammad Monthly Report & Slide Generator

<div align="center">

🌐 **[English](README.md)** | **[繁體中文 (Traditional Chinese)](README.zh-TW.md)**

<br />

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Open-Slide](https://img.shields.io/badge/Open--Slide-1.17+-38BDF8.svg)](https://open-slide.dev/)
[![CI](https://github.com/Json105/Zammad-Monthly-Report/actions/workflows/ci.yml/badge.svg)](https://github.com/Json105/Zammad-Monthly-Report/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**自動從 Zammad 工單系統擷取月度數據，產出分頁 Excel 報表與現代化互動式簡報。**

[🎯 背景與效益](#-專案背景與效益) •
[✨ 快速體驗](#-1-分鐘快速體驗-mock-demo-模式) •
[🚀 正式安裝](#-正式使用-連線-zammad) •
[📖 參數指南](#-cli-指令與參數說明)

</div>

---

## 🎯 專案背景與效益

### 📌 痛點與開發背景
在企業 IT 運維與客服支援的日常工作中，每逢月度結算常面臨以下挑戰：
- **繁瑣耗時的人工作業**：每月需手動從 Zammad 匯出資料、清洗工單欄位、在 Excel 中依狀態逐一篩選分頁，耗費數小時重複性勞動。
- **簡報製作成本高**：向主管或跨部門報告時，需重新手動繪製圖表並貼入 PPT，既費時又缺乏互動性與現代感。
- **工單分類失真**：進線工單常因未明確指派而堆積在 `Others`（未分類）群組，影響統計指標與團隊績效評估。

### 🚀 導入效益與核心價值
- ⏱️ **省時 90% 以上**：原本耗時數小時的資料整理與 PPT 製作，縮短至 **一鍵 10 秒內** 自動產出 Excel 與簡報。
- 📊 **數據精準可視化**：自動彙整工單狀態、部門分佈、SOP 流程追蹤與下月目標，輔助管理層迅速掌握運維全貌。
- 🎞️ **現代化互動簡報**：以 [Open-Slide](https://open-slide.dev/) 取代傳統靜態投影片，支援互動圖表與即時重點工單穿透展示。
- 🤖 **智慧工單重分類**：內建智慧規則推薦，自動將 `Others` 工單精準歸類至所屬系統與部門。
- 🎲 **開箱即用與低門檻**：內建 Mock 資料模式，無需 Zammad Token 即可秒級體驗全套報表與簡報流程。

---

## ✨ 核心特色

- 🔄 **自動化月報匯出**：透過 Zammad REST API 批次撈取工單、狀態、群組與處理人。
- 📑 **智慧 Excel 分頁**：產出包含「全部工單」總表，並依狀態（如 `closed`, `open`, `pending` 等）自動拆分 Sheet。
- 🎞️ **現代化互動簡報**：採用 [Open-Slide](https://open-slide.dev/) ([GitHub](https://github.com/1weiho/open-slide)) 引擎打造，支援：
  - 🍩 工單狀態佔比圓餅圖 (Status Pie Chart)
  - 📊 各部門 / 群組工單分佈柱狀圖 (Group Bar Chart)
  - 🏷️ 重點標籤工單 (Featured & Tagged Tickets)
  - 📝 SOP 流程與知識庫工單追蹤
  - 🎯 下月任務規劃與展望
- 🎲 **內建 Mock 模式**：沒有 Zammad API 帳號也能 1 秒產生模擬資料，快速體驗完整功能！

---

## ⚡ 1 分鐘快速體驗 (Mock Demo 模式)

想先看看產出的報表與簡報長什麼樣子？使用內建的 `--mock` 參數即可直接體驗：

```bash
# 1. 複製專案
git clone https://github.com/Json105/Zammad-Monthly-Report.git
cd Zammad-Monthly-Report

# 2. 建立 Python 虛擬環境並安裝依賴
python -m venv venv
source venv/bin/activate  # Windows 請用: venv\Scripts\activate
pip install -r requirements.txt

# 3. 產生模擬資料 (產生 Excel 報表 + 簡報資料)
python generate_report.py --mock

# 4. 啟動簡報
cd zammad-report-slide
npm install
npm run dev
```

瀏覽器打開 `http://localhost:5174/` 即可看到模擬的簡報圖表！

---

## 🚀 正式使用 (連線 Zammad)

### 步驟 1：設定環境變數

複製環境變數範本並填入你的 Zammad 連線資訊：

```bash
cp .env.example .env
```

編輯 `.env`：

```env
ZAMMAD_URL=https://support.your-company.com
ZAMMAD_API_TOKEN=your_actual_zammad_api_token_here
```

> 💡 **Token 取得方式**：登入 Zammad ➜ 點選個人頭像 ➜ **Profile (個人資料)** ➜ **Token Access** ➜ 建立一個擁有 `ticket.agent` 或相關讀取權限的 Personal Access Token。

### 步驟 2：執行月報產生

```bash
# 預設抓取「上個月」全部工單
python generate_report.py

# 或是指定特定月份 (格式: YYYY-MM)
python generate_report.py --month 2026-07
```

執行後會產出：
1. `Zammad_Report_YYYY-MM.xlsx`：依狀態分頁整理的完整 Excel 報表。
2. `zammad-report-slide/public/data/tickets.json`：供簡報讀取的結構化 JSON。

### 步驟 3：開啟互動式簡報

```bash
cd zammad-report-slide
npm run dev
```

---

## 📖 CLI 指令與參數說明

| 參數 | 說明 | 範例 |
| :--- | :--- | :--- |
| *(無參數)* | 自動抓取**上一個月份**的真實工單並匯出 | `python generate_report.py` |
| `--month YYYY-MM` | 指定特定月份抓取 | `python generate_report.py --month 2026-06` |
| `--mock` | 使用模擬資料模式 (免連線 Zammad) | `python generate_report.py --mock` |
| `--mock-count N` | 自訂模擬工單筆數 (預設: 60) | `python generate_report.py --mock --mock-count 100` |
| `-h`, `--help` | 查看說明訊息 | `python generate_report.py -h` |

---

## 🛠️ 其他輔助工具

- **查詢 Zammad 系統狀態列表**：
  ```bash
  python get_states.py
  ```
- **擷取目前 Zammad 系統全部使用者、群組與狀態對照表**：
  ```bash
  python export_zammad_data.py
  ```
- **「Others」未分類工單智慧重分類**：
  ```bash
  # 預覽上個月的建議重分類結果 (不實際寫入)
  python reclassify_others.py --dry-run

  # 套用特定月份的重分類
  python reclassify_others.py --month 2026-07
  ```

---

## 🧪 執行單元測試

使用 `pytest` 執行完整的自動化測試套件：

```bash
pytest
# 或是
python -m pytest tests/ -v
```

---

## 📁 專案目錄結構

```text
zammad-monthly-report/
├── .env.example            # 環境變數設定範本 (請複製為 .env)
├── .gitignore              # Git 排除規則
├── pyproject.toml          # Python 專案描述與工具設定
├── requirements.txt        # Python 依賴套件清單
├── README.md               # 英文專案說明文件
├── README.zh-TW.md         # 繁體中文專案說明文件
├── generate_report.py      # 🌟 主程式：產出 Excel 報表與簡報資料
├── reclassify_others.py    # 輔助：工單智慧重分類工具
├── export_zammad_data.py   # 輔助：匯出對照字典
├── get_states.py           # 輔助：查詢工單狀態代碼
├── zammad_utils/           # 📦 共用 Python 模組
│   ├── config.py           #    統一環境設定載入、驗證與 HTTPS 檢查
│   ├── api.py              #    共用 Zammad API 呼叫
│   └── date_utils.py       #    月份區間計算（支援閏年）
├── tests/                  # 🧪 單元測試 (pytest)
│   ├── test_config.py
│   ├── test_date_utils.py
│   └── test_reclassify.py
└── zammad-report-slide/    # 🌟 Open-Slide 簡報專案
    ├── package.json
    ├── open-slide.config.ts
    ├── public/data/
    │   └── tickets.json    # 報表程式產出的工單資料來源
    └── slides/
        └── monthly-report/
            └── index.tsx   # 投影片設計與 Recharts 圖表邏輯
```

---

## 📄 授權條款 (License)

MIT © [Jason Liao](https://github.com/Json105)
