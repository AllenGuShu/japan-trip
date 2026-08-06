# 旅遊紀錄手冊

純前端 PWA，資料預設存在瀏覽器 localStorage；設定好 Firebase 後可選擇性開啟「共同編輯」雲端同步。

## 這次新增了什麼

### Google 地圖快速加入景點
其實這個功能之前就做了：「新增行程點」時，只要設定過 🔑 Google Maps API 金鑰，輸入地名就會跳出真實地點建議，選了會自動帶入正確地址。這次補了一個小提醒——沒設定金鑰時，表單裡會直接顯示「💡 想用 Google 地圖搜尋真實地標嗎？回首頁點右上角 🔑 設定金鑰即可啟用」，比較好發現這個功能。

### 🔄 共同編輯（跟朋友同步）
記帳＋行程現在可以跟朋友即時同步了：
- 旅遊 ⚙️設定 頁新增「開啟共同編輯」，會產生一組 6 碼代碼
- 把代碼傳給朋友，他們在首頁「🔗 加入共編旅遊」輸入代碼，就會加入同一份資料
- 之後任何一邊改行程、記帳，另一邊會自動同步更新（不用重新整理）
- 隨時可以在設定頁「停止同步」，退回純本機模式（只影響自己這台裝置，不影響其他人）

**這個功能需要你先申請一個免費的 Firebase 專案**，還沒申請之前，這功能會顯示「尚未設定」，但完全不影響其他功能正常使用。

## 🔧 共同編輯功能設定教學（一次性，大約 10 分鐘）

1. 到 [Firebase Console](https://console.firebase.google.com/) 用 Google 帳號登入
2. 點「新增專案」，取個名字（例如 `trip-journal`），一路下一步建立完成
3. 左側選單找「Firestore Database」，點「建立資料庫」
   - 位置選 `asia-east1`（台灣/亞洲）或離你近的區域
   - 模式先選「測試模式」（正式使用建議之後調整安全規則，見下方說明）
4. 左側選單「專案設定」（齒輪圖示）→ 一路往下滑到「你的應用程式」→ 點 `</>`（網頁應用程式）圖示
5. 應用程式暱稱隨便填，**不用**勾選 Firebase Hosting，點「註冊應用程式」
6. 會出現一段程式碼，裡面有 `firebaseConfig = {...}` 這個物件，把裡面六個值複製起來
7. 打開這個專案裡的 `firebase-config.js`，把對應的值貼進去，例如：
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIzaSy...",
     authDomain: "trip-journal-xxxxx.firebaseapp.com",
     projectId: "trip-journal-xxxxx",
     storageBucket: "trip-journal-xxxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:xxxxxxxx",
   };
   ```
8. 存檔、用 GitHub Desktop commit + push，Vercel 重新部署後就會自動啟用

### 關於安全性（請務必看一下）
Firestore「測試模式」規則預設**任何人都能讀寫**，而且 30 天後會自動失效（到時候同步功能會突然故障）。建議測試模式到期前，到 Firestore Database →「規則」分頁，貼上：

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

這樣規則就不會過期。但要注意：**這代表只要有人知道你的 6 碼代碼，就能讀寫那趟旅遊的資料**——代碼不會公開顯示在任何地方，只有你分享給誰、誰才知道，對朋友之間分享來說風險很低，但這不是企業級的存取控制，請不要把它當成放機密資料的地方（例如信用卡完整卡號之類的，本來就不建議存在這裡）。

## 部署步驟（GitHub Desktop + Vercel）

1. 用 GitHub Desktop 打開你原本的 repo
2. 把這次全部檔案（包含新的 `firebase-config.js`）覆蓋貼進去
3. Commit to main → Push origin
4. Vercel 會自動偵測並重新部署

## 加到手機主畫面

已經加過主畫面圖示的話直接開啟即可。如果畫面看起來還是舊版，把 App 完全關閉（滑掉）再重新打開一次。

## 資料保存與注意事項

- 沒開啟共同編輯的旅遊，資料一樣只存在該裝置的 localStorage
- 開啟共同編輯後，資料會同時存在雲端（Firestore）跟本機，停止同步後本機仍保留最後一次同步的資料，但雲端的那份不會被刪除（其他還在用的人不受影響）
- 複製旅遊、複製為範本、匯出/匯入檔案，都不會帶著同步狀態走（避免不小心跟別人共用到同一份雲端資料），需要的話要重新「開啟共同編輯」
- 目前是「後寫入覆蓋前面」的簡單同步方式，如果兩邊剛好在同一秒改同一筆資料，會以比較晚送達伺服器的那邊為準，沒有做逐欄位合併，一般旅遊規劃使用情境下這樣通常夠用
