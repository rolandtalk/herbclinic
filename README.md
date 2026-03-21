# 五運六氣查詢 — Hurb Clinic

以 Google 試算表為資料來源的查詢與管理介面。

## 功能

### 使用者介面 (User UI)
- **Google 登入**：使用 Google 帳號登入（需設定 OAuth Client ID）
- **示範登入**：未設定 Client ID 時可使用「示範登入」體驗查詢流程
- **依欄位搜尋**：選擇欄位後輸入關鍵字，即時篩選結果
- **結果以中文欄位標題顯示**：出生年份、干支年份、天干、地支、關聯臟腑、體質特點等
- **登入狀態**：顯示目前登入者名稱；登入有效期限 **4 小時**

### 管理後台 (Admin UI)
- **最近 7 天登入紀錄**：每位使用者的登入時間明細
- **每人登入次數**：同一使用者在 7 天內的登入次數統計

## 試算表設定

資料來源：[五運六氣高標表](https://docs.google.com/spreadsheets/d/1yzPnZUgVQ2zYp4PBndyHCXEK6Rj21TV-TbRq9h9GaBc/edit?gid=0#gid=0)

請將試算表權限設為 **「知道連結的使用者」可檢視**，前端才能透過 proxy 取得 CSV 資料。

## 開發

```bash
npm install
npm run dev
```

在瀏覽器開啟 **http://localhost:5173**。

- **使用者查詢**：首頁 `/`
- **管理後台**：`/admin`

### Google 登入（選用）

1. 複製 `.env.example` 為 `.env`
2. 至 [Google Cloud Console](https://console.cloud.google.com/) 建立 OAuth 2.0 用戶端 ID（應用程式類型：網頁應用程式）
3. 在「已授權的 JavaScript 來源」加入 `http://localhost:5173`
4. 將 Client ID 填入 `.env` 的 `VITE_GOOGLE_CLIENT_ID`

未設定時仍可使用「示範登入」操作介面；登入紀錄會寫入 `localStorage`，管理後台可檢視。

## 部署（GitHub + Cloudflare Pages）

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit: 五運六氣查詢"
git branch -M main
git remote add origin https://github.com/rolandtalk/herbclinic.git
git push -u origin main
```

### 2. 部署到 Cloudflare Pages

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 選擇 **rolandtalk/herbclinic**，授權 Cloudflare 存取。
3. 建置設定：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: 留空（或 `/`）
4. 點 **Save and Deploy**。完成後會得到 `https://<project>.pages.dev`。
5. **Google OAuth**：在 [Google Cloud Console](https://console.cloud.google.com/) 的 OAuth 用戶端中，將「已授權的 JavaScript 來源」加入 `https://<project>.pages.dev`，並在 Cloudflare Pages 專案 **Settings** → **Environment variables** 新增 `VITE_GOOGLE_CLIENT_ID`（Production）。

專案內含 **Cloudflare Pages Functions**（`/functions/api/`），部署後會自動提供：
- `GET /api/sheets` — 取得試算表 CSV
- `GET /api/youtube-oembed` — 取得 YouTube 影片標題（參考影片）
- `POST /api/log-login` — 將登入寫入 **KV**（全站彙總）
- `GET /api/admin-logins?secret=…` — 管理後台讀取最近 7 天登入（密碼須與後台一致）

試算表請維持「知道連結的使用者」可檢視，Production 才會正常取得資料。

### 3. 登入紀錄彙總（Cloudflare KV，建議設定）

管理後台要看到**所有使用者**的登入，需在 Pages 專案綁定 KV：

1. Cloudflare Dashboard → **Workers & Pages** → **KV** → **Create a namespace**（例如名稱 `herbclinic-login-log`）。
2. 開啟你的 **Pages 專案** → **Settings** → **Functions** → **KV namespace bindings** → **Add binding**：
   - **Variable name**：`LOGIN_LOG`（必須與程式一致）
   - **KV namespace**：選上一步建立的 namespace
3. （選用）**Settings** → **Variables and secrets** 新增 **`ADMIN_LOG_SECRET`**（Production），值與管理後台密碼相同；若不設定，後端預設與程式內建後台密碼相同（僅供測試，正式環境請自訂密碼並同步設定）。
4. **重新部署**一次 Pages。

本機 `npm run dev` 仍只會寫入 `localStorage`；正式網址上登入會同時 `POST /api/log-login` 寫入 KV。

## 技術

- **前端**：Vite + React + TypeScript、React Router、@react-oauth/google
- **資料**：Google 試算表經 `/api/sheets`（開發時 Vite proxy，Production 為 Cloudflare Pages Function）
- **登入紀錄**：`sessionStorage`（目前登入）；**Production** 另寫 **Cloudflare KV**（全站）；本機與 KV 失敗時管理後台退回 `localStorage`
