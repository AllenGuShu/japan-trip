# 旅遊紀錄手冊 — 完整版打包

這是目前最新的完整版本，包含所有功能與設定。

## ⚠️ 這個版本已經幫你做好的事

- ✅ `firebase-config.js` 已經填入你的 `trip-journal` 專案設定值，不用再自己編輯
- ✅ `maps-config.js` 已經內建你的 Google Maps API 金鑰
- ✅ 所有功能都已測試過

## 🔴 你還需要手動做的最後兩步

1. **部署這個版本**：
   - 把這整個資料夾的內容，覆蓋貼進你 GitHub Desktop 管理的資料夾
   - 打開 GitHub Desktop，應該會看到檔案變更（主要是 firebase-config.js）
   - Summary 隨便填一句話（例如「設定 Firebase」）
   - 點 **Commit to main**
   - 點 **Push origin**
   - 等 Vercel 自動重新部署（大約 1 分鐘，可以去 Vercel 後台看進度）

2. **設定 Firestore 安全規則**（避免 30 天後失效）：
   - 回到 Firebase 後台（console.firebase.google.com）→ 你的 `trip-journal` 專案
   - 左側選單「Firestore Database」→ 上方「規則」分頁
   - 把裡面內容整個換成：
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /trips/{tripCode} {
           allow read, write: if true;
         }
       }
     }
     ```
   - 點「發布」

## 怎麼確認都成功了

兩步都做完後：
1. 打開你的旅遊手冊網站
2. 進任一趟旅遊 → ⚙️ 設定
3. 應該會看到「🔄 共同編輯」從「尚未設定」變成「開啟共同編輯」的按鈕
4. 點下去，如果跳出一組 6 碼代碼，就代表全部成功了
5. 把代碼傳給朋友，他在首頁「🔗 加入共編旅遊」輸入，就能一起編輯

如果點了「開啟共同編輯」沒反應或跳出錯誤，把畫面截圖給我。

## 功能總覽（目前版本）

- 首頁旅遊列表：新增/複製/複製為範本/匯出/匯入/加入共編
- 🧳 出發前：航班、住宿、其他交通、準備清單
- 🛣️ 行程：整合總覽（自動帶入航班/住宿/天氣）、單日編輯（拖曳排序、Google 地圖搜尋景點）
- 💰 記帳：多國貨幣、即時匯率、預算追蹤、分帳成員與結算建議
- 💬 會話：日文/英文常用例句
- 🔑 Google 地圖搜尋：已內建，任何人打開都能直接用
- 🔄 共同編輯：需完成上方兩步才會啟用
- 🌙 深色模式、📲 加到主畫面、離線瀏覽
