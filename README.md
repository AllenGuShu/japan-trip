# 日本自駕旅遊手帳

純前端 PWA，資料存在瀏覽器 localStorage，不需要後端、不需要資料庫。

## 部署步驟（GitHub Desktop + Vercel）

1. 開 GitHub Desktop → File → New Repository，Local Path 選這個資料夾（或建新資料夾後把這些檔案全部拖進去）。
2. Publish repository 到 GitHub（Public 或 Private 皆可）。
3. 到 [vercel.com](https://vercel.com) → Add New Project → Import 剛剛那個 repo。
4. Framework Preset 選 **Other**（純靜態網站，不需要 build command，Output Directory 留空或填 `.` 即可）。
5. Deploy，完成後會拿到一個 `xxx.vercel.app` 網址。

## 加到手機主畫面

- **iPhone (Safari)**：開網址 → 分享按鈕 → 加入主畫面
- **Android (Chrome)**：開網址 → 右上角選單 → 加到主畫面 / 安裝應用程式

加入後會以全螢幕 App 的方式開啟，且離線也能瀏覽已載入過的頁面內容。

## 之後想修改內容

- 直接跟 Claude 說要調整哪個部分（配色、功能、預設清單內容等），改完的檔案用 GitHub Desktop commit + push，Vercel 會自動重新部署。
- 所有使用者輸入的資料（景點、行程、記帳等）都存在**該台裝置瀏覽器**的 localStorage，換裝置或清瀏覽器資料會遺失，目前沒有雲端同步機制。
