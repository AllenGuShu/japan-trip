/* ===================== 資料層 ===================== */
const STORAGE_KEY = "jp-trip-journal-v3";
const OLD_STORAGE_KEY_V2 = "jp-trip-journal-v2";
const OLD_STORAGE_KEY_V1 = "jp-trip-data-v1";

function uid() { return Math.random().toString(36).slice(2, 10); }

/* ---------- 國家 / 貨幣對照表（預設匯率僅供起始參考，建議用「抓即時匯率」更新） ---------- */
const COUNTRY_CURRENCY = [
  { country: "日本", flag: "🇯🇵", code: "JPY", symbol: "¥", name: "日圓", rate: 0.21 },
  { country: "韓國", flag: "🇰🇷", code: "KRW", symbol: "₩", name: "韓元", rate: 0.023 },
  { country: "泰國", flag: "🇹🇭", code: "THB", symbol: "฿", name: "泰銖", rate: 0.88 },
  { country: "越南", flag: "🇻🇳", code: "VND", symbol: "₫", name: "越南盾", rate: 0.0013 },
  { country: "新加坡", flag: "🇸🇬", code: "SGD", symbol: "S$", name: "新加坡幣", rate: 23.5 },
  { country: "馬來西亞", flag: "🇲🇾", code: "MYR", symbol: "RM", name: "馬來幣", rate: 6.9 },
  { country: "菲律賓", flag: "🇵🇭", code: "PHP", symbol: "₱", name: "披索", rate: 0.55 },
  { country: "印尼", flag: "🇮🇩", code: "IDR", symbol: "Rp", name: "印尼盾", rate: 0.002 },
  { country: "中國", flag: "🇨🇳", code: "CNY", symbol: "¥", name: "人民幣", rate: 4.4 },
  { country: "香港", flag: "🇭🇰", code: "HKD", symbol: "HK$", name: "港幣", rate: 4.1 },
  { country: "澳門", flag: "🇲🇴", code: "MOP", symbol: "MOP$", name: "澳門幣", rate: 4.0 },
  { country: "美國", flag: "🇺🇸", code: "USD", symbol: "$", name: "美元", rate: 32 },
  { country: "加拿大", flag: "🇨🇦", code: "CAD", symbol: "C$", name: "加幣", rate: 23 },
  { country: "英國", flag: "🇬🇧", code: "GBP", symbol: "£", name: "英鎊", rate: 40 },
  { country: "歐元區（法/德/義/西等）", flag: "🇪🇺", code: "EUR", symbol: "€", name: "歐元", rate: 34 },
  { country: "澳洲", flag: "🇦🇺", code: "AUD", symbol: "A$", name: "澳幣", rate: 21 },
  { country: "紐西蘭", flag: "🇳🇿", code: "NZD", symbol: "NZ$", name: "紐幣", rate: 19 },
  { country: "印度", flag: "🇮🇳", code: "INR", symbol: "₹", name: "盧比", rate: 0.38 },
  { country: "阿聯（杜拜）", flag: "🇦🇪", code: "AED", symbol: "د.إ", name: "迪拉姆", rate: 8.7 },
  { country: "土耳其", flag: "🇹🇷", code: "TRY", symbol: "₺", name: "里拉", rate: 0.95 },
];
const CUSTOM_COUNTRY = { country: "其他（自訂）", flag: "🌍", code: "", symbol: "", name: "當地貨幣", rate: 1 };

function findCountryEntry(countryName) {
  return COUNTRY_CURRENCY.find((c) => c.country === countryName) || null;
}

/* ---------- 預設清單內容（依交通方式 / 國家條件式產生） ---------- */
function defaultPacking(currencyName, selfDrive) {
  const groups = [
    { category: "證件與文件", items: [
      "護照（效期6個月以上）", "護照影本 x2", "機票 / 電子機票", "住宿訂房確認單", "海外旅平險保單",
    ]},
    { category: "3C用品", items: [
      "手機＋充電線", "行動電源", "當地電源轉接頭", "上網 SIM卡 / eSIM / WiFi分享器",
    ]},
    { category: "藥品與盥洗", items: [
      "個人常備藥（腸胃藥、止痛藥）", "暈車/暈機藥", "防曬乳", "隨身小包衛生紙／濕紙巾",
    ]},
    { category: "衣物", items: [
      "當地氣候合適衣物", "薄外套（室內冷氣強或早晚溫差）", "帽子／太陽眼鏡", "好走的鞋",
    ]},
    { category: "金錢", items: [
      `${currencyName || "當地貨幣"}現金`, "信用卡（記得開通海外交易）",
    ]},
  ];
  if (selfDrive) {
    groups.push({ category: "自駕用品", items: [
      "國際駕照", "台灣駕照正本", "租車預約確認單", "車用手機架", "ETC卡（若租車有配）",
    ]});
  }
  return groups.map((g) => ({
    category: g.category,
    items: g.items.map((text) => ({ id: uid(), text, done: false })),
  }));
}

function defaultNotes(countryName, selfDrive) {
  const notes = [
    { icon: "🛂", text: "出發前確認護照效期是否符合當地入境規定（多數國家要求 6 個月以上）。" },
    { icon: "💱", text: "先兌換少量現金應急，其餘可視當地刷卡/行動支付普及程度調整比例。" },
    { icon: "🔌", text: "確認當地電壓與插座型式，需要的話帶轉接頭。" },
    { icon: "🕒", text: "留意與台灣的時差，抵達後記得調整手機/手錶時間。" },
    { icon: "📄", text: "護照、機票、保單建議另外存一份電子檔（雲端或手機相簿）以防遺失。" },
  ];
  if (selfDrive) {
    notes.push(
      { icon: "🚗", text: "出發前確認當地行駛方向（靠左或靠右），上路前先熟悉方向燈、雨刷等操作。" },
      { icon: "🪪", text: "確認國際駕照是否為當地承認的日內瓦公約駕照，部分國家需另外申請認證。" },
      { icon: "⛽", text: "了解當地加油方式（自助/有人）與付款方式，備妥現金或信用卡。" },
      { icon: "🅿️", text: "先查好目的地停車方式與費率，避免臨時找不到車位。" },
    );
  }
  if (countryName === "日本") {
    notes.push(
      { icon: "🛣️", text: "日本高速公路多為 ETC 車道，若車輛未裝 ETC 卡要走一般收費車道。" },
      { icon: "🗑️", text: "路上垃圾桶少，垃圾請自行帶回住宿或便利商店丟棄，不可亂丟。" },
    );
  }
  return notes.map((n) => ({ id: uid(), ...n }));
}

function newTrip({ title, dateRange, dayCount, countryEntry, transport }) {
  const count = Math.min(Math.max(Number(dayCount) || 1, 1), 30);
  const selfDrive = transport === "自駕" || transport === "兩者都有";
  return {
    id: uid(),
    title: title || "未命名旅遊",
    dateRange: dateRange || "",
    dayCount: count,
    country: countryEntry.country,
    flag: countryEntry.flag,
    transport: transport || "大眾運輸",
    currency: { code: countryEntry.code, symbol: countryEntry.symbol, name: countryEntry.name },
    exRate: countryEntry.rate,
    createdAt: Date.now(),
    spots: [],
    days: Array.from({ length: count }, (_, i) => ({ id: uid(), label: `Day ${i + 1}`, date: "", stops: [] })),
    packing: defaultPacking(countryEntry.name, selfDrive),
    expenses: [],
    customPhrases: [],
    notes: defaultNotes(countryEntry.country, selfDrive),
  };
}

function migrateV2Trip(old) {
  return {
    id: old.id || uid(),
    title: old.title || "未命名旅遊",
    dateRange: old.dateRange || "",
    dayCount: old.dayCount || (old.days || []).length || 6,
    country: old.country || "日本",
    flag: old.flag || "🇯🇵",
    transport: old.transport || "自駕",
    currency: old.currency || { code: "JPY", symbol: "¥", name: "日圓" },
    exRate: old.exRate ?? 0.21,
    createdAt: old.createdAt || Date.now(),
    spots: old.spots || [],
    days: old.days && old.days.length ? old.days : [],
    packing: old.packing || defaultPacking("日圓", true),
    expenses: old.expenses || [],
    customPhrases: old.customPhrases || [],
    notes: old.notes || defaultNotes("日本", true),
  };
}

function loadJournal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.trips)) return parsed;
    }
  } catch (e) { /* ignore */ }

  // 搬遷 v2（多趟旅遊，但無國家/貨幣欄位）
  try {
    const v2raw = localStorage.getItem(OLD_STORAGE_KEY_V2);
    if (v2raw) {
      const v2 = JSON.parse(v2raw);
      if (v2 && Array.isArray(v2.trips) && v2.trips.length) {
        return { trips: v2.trips.map(migrateV2Trip) };
      }
    }
  } catch (e) { /* ignore */ }

  // 搬遷 v1（單一趟舊版資料）
  try {
    const v1raw = localStorage.getItem(OLD_STORAGE_KEY_V1);
    if (v1raw) {
      const old = JSON.parse(v1raw);
      const migrated = migrateV2Trip({
        title: old.tripTitle,
        dateRange: old.dateRange,
        dayCount: (old.days || []).length,
        exRate: old.exRate,
        spots: old.spots,
        days: old.days,
        packing: old.packing,
        expenses: old.expenses,
        customPhrases: old.customPhrases,
        notes: old.notes,
      });
      return { trips: [migrated] };
    }
  } catch (e) { /* ignore */ }

  return { trips: [] };
}

let JOURNAL = loadJournal();
function saveJournal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(JOURNAL)); }

const appState = { screen: "home", tripId: null };
function currentTrip() { return JOURNAL.trips.find((t) => t.id === appState.tripId); }

/* ===================== 靜態會話資料 ===================== */
const JP_PHRASES = [
  { cat: "加油站", jp: "満タンでお願いします。", reading: "まんたんで おねがいします。", zh: "請幫我加滿。" },
  { cat: "加油站", jp: "レギュラーを入れてください。", reading: "れぎゅらーを いれてください。", zh: "請加普通汽油。" },
  { cat: "停車場", jp: "駐車場はどこですか？", reading: "ちゅうしゃじょうは どこですか？", zh: "停車場在哪裡？" },
  { cat: "停車場", jp: "何時間まで停められますか？", reading: "なんじかんまで とめられますか？", zh: "最多可以停幾小時？" },
  { cat: "開車問路", jp: "この道で合っていますか？", reading: "このみちで あっていますか？", zh: "這條路走對了嗎？" },
  { cat: "開車問路", jp: "次の高速の入口はどこですか？", reading: "つぎの こうそくの いりぐちは どこですか？", zh: "下一個高速公路入口在哪？" },
  { cat: "餐廳", jp: "二名です、席はありますか？", reading: "にめいです、せきは ありますか？", zh: "兩位，有位子嗎？" },
  { cat: "餐廳", jp: "おすすめは何ですか？", reading: "おすすめは なんですか？", zh: "有什麼推薦的嗎？" },
  { cat: "餐廳", jp: "お会計をお願いします。", reading: "おかいけいを おねがいします。", zh: "請幫我結帳。" },
  { cat: "緊急狀況", jp: "道に迷いました。", reading: "みちに まよいました。", zh: "我迷路了。" },
  { cat: "緊急狀況", jp: "事故にあいました。助けてください。", reading: "じこに あいました。たすけてください。", zh: "我發生事故了，請幫忙。" },
  { cat: "緊急狀況", jp: "救急車を呼んでください。", reading: "きゅうきゅうしゃを よんでください。", zh: "請叫救護車。" },
];
const EN_PHRASES = [
  { cat: "住宿", jp: "I have a reservation under my name.", reading: "", zh: "我有以我的名字訂房。" },
  { cat: "住宿", jp: "What time is check-out?", reading: "", zh: "退房時間是幾點？" },
  { cat: "餐廳", jp: "Could I see the menu, please?", reading: "", zh: "可以給我菜單嗎？" },
  { cat: "餐廳", jp: "Check, please.", reading: "", zh: "請幫我結帳。" },
  { cat: "問路", jp: "How do I get to the nearest train station?", reading: "", zh: "最近的車站怎麼走？" },
  { cat: "問路", jp: "Is it within walking distance?", reading: "", zh: "用走的到得了嗎？" },
  { cat: "購物", jp: "How much is this?", reading: "", zh: "這個多少錢？" },
  { cat: "購物", jp: "Do you accept credit cards?", reading: "", zh: "可以刷卡嗎？" },
  { cat: "緊急狀況", jp: "I need help, please.", reading: "", zh: "我需要幫忙。" },
  { cat: "緊急狀況", jp: "Please call an ambulance.", reading: "", zh: "請叫救護車。" },
  { cat: "緊急狀況", jp: "I lost my passport.", reading: "", zh: "我的護照遺失了。" },
];
function basePhrasesFor(trip) { return trip.country === "日本" ? JP_PHRASES : EN_PHRASES; }
function basePhrasesLabel(trip) { return trip.country === "日本" ? "常用日文例句" : "常用英文例句（多數地區通用）"; }

/* ===================== 共用工具 ===================== */
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return [...root.querySelectorAll(sel)]; }
function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function mapUrl(query) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
}

/* ===================== 畫面切換（首頁 / 旅遊內頁） ===================== */
function switchScreen(name) {
  $all(".screen").forEach((s) => s.classList.remove("active"));
  $(`#screen-${name}`).classList.add("active");
}

function goHome() {
  appState.screen = "home";
  appState.tripId = null;
  switchScreen("home");
  renderHome();
}

function openTrip(id) {
  appState.screen = "trip";
  appState.tripId = id;
  spotFilter = "all";
  phraseFilter = "全部";
  currentDayIdx = 0;
  switchScreen("trip");
  switchView("spots");
  renderTripHeader();
  renderSpots();
  renderDays();
  renderPacking();
  renderExpenses();
  renderPhrases();
  renderNotes();
  renderSettings();
}

/* ===================== 首頁：旅遊列表 ===================== */
function renderHome() {
  $("#tripCount").textContent = `${JOURNAL.trips.length} 趟旅程`;
  const list = $("#tripList");
  list.innerHTML = "";
  if (!JOURNAL.trips.length) {
    list.appendChild(el(`<div class="empty-hint">還沒有任何旅遊紀錄，點上方「＋ 新增一趟旅遊」開始第一本手冊吧！</div>`));
    return;
  }
  JOURNAL.trips
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((trip) => {
      const spotCount = trip.spots.length;
      const stopCount = trip.days.reduce((s, d) => s + d.stops.length, 0);
      const card = el(`
        <button class="trip-card">
          <div class="trip-card__strip"></div>
          <div class="trip-card__body">
            <p class="trip-card__title">${trip.flag || "🌍"} ${escapeHtml(trip.title)}</p>
            <p class="trip-card__meta">${escapeHtml(trip.country || "")} · ${trip.dayCount}天${Math.max(trip.dayCount - 1, 0)}夜 · ${escapeHtml(trip.transport || "")}${trip.dateRange ? " · " + escapeHtml(trip.dateRange) : ""}</p>
            <div class="trip-card__stats">
              <span>📍 ${spotCount} 個景點</span>
              <span>🛣️ ${stopCount} 個行程點</span>
            </div>
          </div>
        </button>
      `);
      card.addEventListener("click", () => openTrip(trip.id));
      list.appendChild(card);
    });
}

function countryOptionsHtml(selected) {
  const opts = COUNTRY_CURRENCY.map((c) =>
    `<option value="${escapeHtml(c.country)}" ${c.country===selected?"selected":""}>${c.flag} ${escapeHtml(c.country)}（${c.code}）</option>`
  ).join("");
  return opts + `<option value="__custom" ${selected==="__custom"?"selected":""}>🌍 其他（自訂）</option>`;
}

function openTripForm() {
  openModal(`
    <h3>新增一趟旅遊</h3>
    <div class="field"><label>旅遊名稱</label><input id="f-title" placeholder="例如：2026夏 日本自駕" /></div>
    <div class="field"><label>國家 / 地區</label><select id="f-country">${countryOptionsHtml("日本")}</select></div>
    <div class="field" id="f-custom-wrap" style="display:none;">
      <div class="settings-row">
        <div><label style="display:block;font-size:12px;color:var(--ink-soft);margin-bottom:4px;font-weight:700;">貨幣代碼</label><input id="f-cur-code" placeholder="例如 USD" /></div>
        <div><label style="display:block;font-size:12px;color:var(--ink-soft);margin-bottom:4px;font-weight:700;">貨幣符號</label><input id="f-cur-symbol" placeholder="例如 $" /></div>
      </div>
    </div>
    <div class="field"><label>交通方式</label>
      <div class="radio-row">
        <label><input type="radio" name="transport" value="自駕" checked /><span>自駕</span></label>
        <label><input type="radio" name="transport" value="大眾運輸" /><span>大眾運輸</span></label>
        <label><input type="radio" name="transport" value="兩者都有" /><span>都有</span></label>
      </div>
    </div>
    <div class="field"><label>日期（選填）</label><input id="f-date" placeholder="例如：2026/08/29 - 09/03" /></div>
    <div class="field"><label>天數</label><input id="f-days" type="number" min="1" max="30" value="6" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>建立並開始規劃</button>
    </div>
  `, (root) => {
    root.querySelector("#f-country").addEventListener("change", (e) => {
      root.querySelector("#f-custom-wrap").style.display = e.target.value === "__custom" ? "block" : "none";
    });
    root.querySelector("[data-save]").addEventListener("click", () => {
      const title = root.querySelector("#f-title").value.trim();
      if (!title) return;
      const countryVal = root.querySelector("#f-country").value;
      let countryEntry;
      if (countryVal === "__custom") {
        countryEntry = {
          ...CUSTOM_COUNTRY,
          code: root.querySelector("#f-cur-code").value.trim() || "",
          symbol: root.querySelector("#f-cur-symbol").value.trim() || "",
        };
      } else {
        countryEntry = findCountryEntry(countryVal) || CUSTOM_COUNTRY;
      }
      const trip = newTrip({
        title,
        dateRange: root.querySelector("#f-date").value.trim(),
        dayCount: root.querySelector("#f-days").value,
        countryEntry,
        transport: root.querySelector('input[name="transport"]:checked').value,
      });
      JOURNAL.trips.push(trip);
      saveJournal();
      closeModal();
      openTrip(trip.id);
    });
  });
}

/* ===================== 旅遊內頁 Header ===================== */
function renderTripHeader() {
  const trip = currentTrip();
  if (!trip) return;
  $("#tripTitle").textContent = trip.title;
  $("#tripDateRange").textContent = trip.dateRange || "點此設定日期";
  $("#tripDaysLabel").textContent = `${trip.flag || ""} ${trip.country} · ${trip.dayCount}天${Math.max(trip.dayCount - 1, 0)}夜・${trip.transport}`;

  $("#tripTitle").onblur = () => {
    const t = currentTrip();
    t.title = $("#tripTitle").textContent.trim() || "未命名旅遊";
    saveJournal();
  };
  $("#tripDateRange").onblur = () => {
    const t = currentTrip();
    const v = $("#tripDateRange").textContent.trim();
    t.dateRange = v === "點此設定日期" ? "" : v;
    saveJournal();
    updateCountdown();
  };
  updateCountdown();
}

function updateCountdown() {
  const trip = currentTrip();
  const cd = $("#countdown");
  const match = (trip?.dateRange || "").match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!match) { cd.textContent = "設定日期看倒數"; return; }
  const target = new Date(+match[1], +match[2] - 1, +match[3]);
  const now = new Date();
  now.setHours(0,0,0,0);
  const diff = Math.round((target - now) / 86400000);
  if (diff > 0) cd.textContent = `${diff} 天後出發`;
  else if (diff === 0) cd.textContent = "今天出發！";
  else cd.textContent = "旅途愉快 🎌";
}

/* ===================== Tab 切換（旅遊內頁） ===================== */
function initTabbar() {
  $all(".tabbar__btn").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });
}
function switchView(name) {
  $all(".view").forEach((v) => v.classList.remove("active"));
  $(`#view-${name}`).classList.add("active");
  $all(".tabbar__btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
}

/* ===================== 景點 ===================== */
let spotFilter = "all";
function renderSpots() {
  const trip = currentTrip();
  if (!trip) return;
  const dayOptions = ["all", "備選", ...trip.days.map((d) => d.label)];
  const filterBar = $("#spotFilters");
  filterBar.innerHTML = "";
  dayOptions.forEach((opt) => {
    const chip = el(`<button class="chip ${spotFilter===opt?"active":""}">${opt==="all"?"全部":opt}</button>`);
    chip.addEventListener("click", () => { spotFilter = opt; renderSpots(); });
    filterBar.appendChild(chip);
  });

  const list = $("#spotList");
  list.innerHTML = "";
  const filtered = trip.spots.filter((s) => spotFilter === "all" || s.day === spotFilter);
  if (!filtered.length) {
    list.appendChild(el(`<div class="empty-hint">還沒有景點，先點上方「＋ 新增景點」加入你想去的地方吧！</div>`));
    return;
  }
  filtered.forEach((s) => {
    const card = el(`
      <div class="card spot-card">
        <div class="spot-card__badge ${s.priority === "必去" ? "must" : "maybe"}">${s.priority}</div>
        <div class="spot-card__body">
          <p class="spot-card__name">${escapeHtml(s.name)}</p>
          <p class="spot-card__meta">${escapeHtml(s.day || "尚未排定")}</p>
          ${s.note ? `<p class="spot-card__note">${escapeHtml(s.note)}</p>` : ""}
          <div class="spot-card__actions">
            <a class="map-link" target="_blank" rel="noopener" href="${mapUrl(s.name)}">在地圖開啟 ↗</a>
            <button class="btn btn--danger" data-del>刪除</button>
          </div>
        </div>
      </div>
    `);
    card.querySelector("[data-del]").addEventListener("click", () => {
      trip.spots = trip.spots.filter((x) => x.id !== s.id);
      saveJournal(); renderSpots();
    });
    list.appendChild(card);
  });
}

function openSpotForm() {
  const trip = currentTrip();
  const dayOpts = trip.days.map((d) => `<option value="${d.label}">${d.label}</option>`).join("");
  openModal(`
    <h3>新增景點</h3>
    <div class="field"><label>名稱</label><input id="f-name" placeholder="例如：白川鄉合掌村" /></div>
    <div class="field"><label>優先度</label>
      <div class="radio-row">
        <label><input type="radio" name="pri" value="必去" checked /><span>必去</span></label>
        <label><input type="radio" name="pri" value="備選" /><span>備選</span></label>
      </div>
    </div>
    <div class="field"><label>安排在</label>
      <select id="f-day"><option value="">尚未排定</option>${dayOpts}<option value="備選">備選清單</option></select>
    </div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="營業時間、門票、小提醒..."></textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const name = root.querySelector("#f-name").value.trim();
      if (!name) return;
      trip.spots.push({
        id: uid(),
        name,
        priority: root.querySelector('input[name="pri"]:checked').value,
        day: root.querySelector("#f-day").value,
        note: root.querySelector("#f-note").value.trim(),
      });
      saveJournal(); renderSpots(); closeModal();
    });
  });
}

/* ===================== 每日行程（Road timeline）===================== */
let currentDayIdx = 0;
function renderDays() {
  const trip = currentTrip();
  if (!trip) return;
  const tabWrap = $("#dayTabs");
  tabWrap.innerHTML = "";
  trip.days.forEach((d, i) => {
    const btn = el(`<button class="day-tab ${i===currentDayIdx?"active":""}">${escapeHtml(d.label)}</button>`);
    btn.addEventListener("click", () => { currentDayIdx = i; renderDays(); });
    tabWrap.appendChild(btn);
  });

  const day = trip.days[currentDayIdx];
  const road = $("#dayRoad");
  road.innerHTML = "";
  if (!day) { road.appendChild(el(`<div class="road-empty">這趟旅遊還沒有天數，請到⚙️設定新增。</div>`)); return; }

  const editRow = el(`
    <div class="day-editable-row">
      <input id="dayLabel" value="${escapeHtml(day.label)}" placeholder="Day 1" />
      <input id="dayDate" value="${escapeHtml(day.date)}" placeholder="8/29 (六)" />
    </div>
  `);
  editRow.querySelector("#dayLabel").addEventListener("change", (e) => { day.label = e.target.value || day.label; saveJournal(); renderDays(); });
  editRow.querySelector("#dayDate").addEventListener("change", (e) => { day.date = e.target.value; saveJournal(); });
  road.appendChild(editRow);

  const roadInner = el(`<div class="road"></div>`);
  if (!day.stops.length) {
    roadInner.classList.remove("road");
    roadInner.appendChild(el(`<div class="road-empty">這天還沒有安排行程，點下方「＋ 新增行程點」開始規劃路線 🛣️</div>`));
  } else {
    day.stops
      .slice()
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
      .forEach((stop, idx) => {
        if (idx > 0 && stop.drive) {
          roadInner.appendChild(el(`<div class="drive-chip">🚗 車程約 ${escapeHtml(stop.drive)}</div>`));
        }
        const card = el(`
          <div class="road-stop">
            <div class="card">
              ${stop.time ? `<span class="stop-time">${escapeHtml(stop.time)}</span>` : ""}
              <p class="stop-name">${escapeHtml(stop.name)}</p>
              ${stop.note ? `<p class="stop-note">${escapeHtml(stop.note)}</p>` : ""}
              <div class="spot-card__actions" style="margin-top:8px;">
                <a class="map-link" target="_blank" rel="noopener" href="${mapUrl(stop.name)}">在地圖開啟 ↗</a>
                <button class="btn btn--danger" data-del>刪除</button>
              </div>
            </div>
          </div>
        `);
        card.querySelector("[data-del]").addEventListener("click", () => {
          day.stops = day.stops.filter((x) => x.id !== stop.id);
          saveJournal(); renderDays();
        });
        roadInner.appendChild(card);
      });
  }
  road.appendChild(roadInner);

  const addBtn = el(`<button class="btn btn--ghost">＋ 新增行程點</button>`);
  addBtn.addEventListener("click", () => openStopForm(day));
  road.appendChild(addBtn);
}

function openStopForm(day) {
  openModal(`
    <h3>新增行程點 — ${escapeHtml(day.label)}</h3>
    <div class="field"><label>時間</label><input id="f-time" placeholder="例如 09:30" /></div>
    <div class="field"><label>地點名稱</label><input id="f-name" placeholder="例如：新穗高纜車" /></div>
    <div class="field"><label>與前一站的車程（選填）</label><input id="f-drive" placeholder="例如 45分" /></div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="停留時間、注意事項..."></textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const name = root.querySelector("#f-name").value.trim();
      if (!name) return;
      day.stops.push({
        id: uid(),
        time: root.querySelector("#f-time").value.trim(),
        name,
        drive: root.querySelector("#f-drive").value.trim(),
        note: root.querySelector("#f-note").value.trim(),
      });
      saveJournal(); renderDays(); closeModal();
    });
  });
}

/* ===================== 準備清單 ===================== */
function renderPacking() {
  const trip = currentTrip();
  if (!trip) return;
  const wrap = $("#packingList");
  wrap.innerHTML = "";
  let total = 0, done = 0;
  trip.packing.forEach((group) => {
    wrap.appendChild(el(`<div class="pack-group__title">${escapeHtml(group.category)}</div>`));
    group.items.forEach((item) => {
      total++; if (item.done) done++;
      const row = el(`
        <label class="card pack-item ${item.done ? "done" : ""}">
          <input type="checkbox" ${item.done ? "checked" : ""} />
          <span>${escapeHtml(item.text)}</span>
          <button class="btn btn--danger" data-del>刪除</button>
        </label>
      `);
      row.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
        item.done = e.target.checked; saveJournal(); renderPacking();
      });
      row.querySelector("[data-del]").addEventListener("click", (e) => {
        e.preventDefault();
        group.items = group.items.filter((x) => x.id !== item.id);
        saveJournal(); renderPacking();
      });
      wrap.appendChild(row);
    });
  });
  $("#packingProgress").textContent = `${done}/${total}`;
}

function openPackingForm() {
  const trip = currentTrip();
  const catOpts = trip.packing.map((g) => `<option value="${escapeHtml(g.category)}">${escapeHtml(g.category)}</option>`).join("");
  openModal(`
    <h3>新增準備項目</h3>
    <div class="field"><label>項目內容</label><input id="f-text" placeholder="例如：轉接頭" /></div>
    <div class="field"><label>分類</label><select id="f-cat">${catOpts}<option value="__new">＋ 建立新分類</option></select></div>
    <div class="field" id="f-newcat-wrap" style="display:none;"><label>新分類名稱</label><input id="f-newcat" placeholder="例如：其他" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("#f-cat").addEventListener("change", (e) => {
      root.querySelector("#f-newcat-wrap").style.display = e.target.value === "__new" ? "block" : "none";
    });
    root.querySelector("[data-save]").addEventListener("click", () => {
      const text = root.querySelector("#f-text").value.trim();
      if (!text) return;
      let catVal = root.querySelector("#f-cat").value;
      if (catVal === "__new") {
        catVal = root.querySelector("#f-newcat").value.trim() || "其他";
        if (!trip.packing.find((g) => g.category === catVal)) {
          trip.packing.push({ category: catVal, items: [] });
        }
      }
      const group = trip.packing.find((g) => g.category === catVal);
      group.items.push({ id: uid(), text, done: false });
      saveJournal(); renderPacking(); closeModal();
    });
  });
}

/* ===================== 記帳 ===================== */
const EXPENSE_CATS = [
  { key: "交通", icon: "🚗" },
  { key: "住宿", icon: "🏨" },
  { key: "餐飲", icon: "🍜" },
  { key: "門票", icon: "🎫" },
  { key: "購物", icon: "🛍️" },
  { key: "其他", icon: "🧾" },
];
function iconFor(cat) { return (EXPENSE_CATS.find((c) => c.key === cat) || {}).icon || "🧾"; }

function renderExpenses() {
  const trip = currentTrip();
  if (!trip) return;
  $("#exRate").value = trip.exRate;
  $("#rateFromCode").textContent = trip.currency.code || trip.currency.name || "當地貨幣";
  const symbol = trip.currency.symbol || "";
  const total = trip.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  $("#totalJPY").textContent = symbol + total.toLocaleString();
  $("#totalTWD").textContent = "NT$" + Math.round(total * trip.exRate).toLocaleString();

  const byCat = $("#expenseByCategory");
  byCat.innerHTML = "";
  EXPENSE_CATS.forEach((c) => {
    const sum = trip.expenses.filter((e) => e.category === c.key).reduce((s, e) => s + Number(e.amount || 0), 0);
    if (sum > 0) byCat.appendChild(el(`<div class="chip static">${c.icon} ${c.key} ${symbol}${sum.toLocaleString()}</div>`));
  });

  const list = $("#expenseList");
  list.innerHTML = "";
  if (!trip.expenses.length) {
    list.appendChild(el(`<div class="empty-hint">還沒有花費紀錄，出發後隨手記一下吧！</div>`));
    return;
  }
  trip.expenses.slice().reverse().forEach((e) => {
    const row = el(`
      <div class="card expense-row">
        <div class="expense-row__icon">${iconFor(e.category)}</div>
        <div class="expense-row__body">
          <div class="expense-row__title">${escapeHtml(e.title || e.category)}</div>
          <div class="expense-row__meta">${escapeHtml(e.category)}${e.note ? " · " + escapeHtml(e.note) : ""}</div>
        </div>
        <div class="expense-row__amount">${symbol}${Number(e.amount).toLocaleString()}</div>
        <button class="btn btn--danger" data-del>刪</button>
      </div>
    `);
    row.querySelector("[data-del]").addEventListener("click", () => {
      trip.expenses = trip.expenses.filter((x) => x.id !== e.id);
      saveJournal(); renderExpenses();
    });
    list.appendChild(row);
  });
}

function openExpenseForm() {
  const trip = currentTrip();
  const catOpts = EXPENSE_CATS.map((c) => `<option value="${c.key}">${c.icon} ${c.key}</option>`).join("");
  openModal(`
    <h3>新增花費</h3>
    <div class="field"><label>金額（${escapeHtml(trip.currency.name || "當地貨幣")}）</label><input id="f-amount" type="number" placeholder="0" /></div>
    <div class="field"><label>類別</label><select id="f-cat">${catOpts}</select></div>
    <div class="field"><label>項目名稱</label><input id="f-title" placeholder="例如：拉麵晚餐" /></div>
    <div class="field"><label>備註</label><input id="f-note" placeholder="選填" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const amount = Number(root.querySelector("#f-amount").value);
      if (!amount) return;
      trip.expenses.push({
        id: uid(),
        amount,
        category: root.querySelector("#f-cat").value,
        title: root.querySelector("#f-title").value.trim(),
        note: root.querySelector("#f-note").value.trim(),
      });
      saveJournal(); renderExpenses(); closeModal();
    });
  });
  $("#exRate").oninput = (e) => { trip.exRate = Number(e.target.value) || 0; saveJournal(); renderExpenses(); };
}

async function fetchLiveRate() {
  const trip = currentTrip();
  const code = trip.currency.code;
  const status = $("#rateStatus");
  if (!code) { status.textContent = "此貨幣未設定代碼，無法自動查詢，請手動輸入匯率。"; return; }
  status.textContent = "查詢中...";
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(code)}`);
    const data = await res.json();
    const twd = data && data.rates && data.rates.TWD;
    if (!twd) throw new Error("no TWD rate");
    trip.exRate = twd;
    saveJournal();
    renderExpenses();
    status.textContent = `已更新：1 ${code} ≈ ${twd.toFixed(4)} TWD（${new Date().toLocaleDateString("zh-TW")}）`;
  } catch (err) {
    status.textContent = "查詢失敗，請確認網路連線，或手動輸入匯率。";
  }
}

/* ===================== 會話小抄 ===================== */
let phraseFilter = "全部";
function renderPhrases() {
  const trip = currentTrip();
  if (!trip) return;
  const base = basePhrasesFor(trip);
  $(".view-head h2", $("#view-phrases")).textContent = basePhrasesLabel(trip);
  const cats = ["全部", ...new Set(base.map((p) => p.cat)), ...(trip.customPhrases.length ? ["我的例句"] : [])];
  const bar = $("#phraseFilters");
  bar.innerHTML = "";
  cats.forEach((c) => {
    const chip = el(`<button class="chip ${phraseFilter===c?"active":""}">${c}</button>`);
    chip.addEventListener("click", () => { phraseFilter = c; renderPhrases(); });
    bar.appendChild(chip);
  });

  const list = $("#phraseList");
  list.innerHTML = "";
  const baseFiltered = phraseFilter === "我的例句" ? [] : base.filter((p) => phraseFilter === "全部" || p.cat === phraseFilter);
  const custom = (phraseFilter === "全部" || phraseFilter === "我的例句") ? trip.customPhrases : [];

  if (!baseFiltered.length && !custom.length) {
    list.appendChild(el(`<div class="empty-hint">這個分類還沒有例句，點下方「＋ 新增自訂例句」加一句吧！</div>`));
    return;
  }
  baseFiltered.forEach((p) => list.appendChild(phraseCard(p)));
  custom.forEach((p) => list.appendChild(phraseCard(p, true, trip)));
}
function phraseCard(p, deletable = false, trip = null) {
  const node = el(`
    <div class="card">
      <p class="phrase-card__jp">${escapeHtml(p.jp)}</p>
      ${p.reading ? `<p class="phrase-card__reading">${escapeHtml(p.reading)}</p>` : ""}
      <p class="phrase-card__zh">${escapeHtml(p.zh)}</p>
      ${deletable ? `<div style="margin-top:8px;"><button class="btn btn--danger" data-del>刪除</button></div>` : ""}
    </div>
  `);
  if (deletable) {
    node.querySelector("[data-del]").addEventListener("click", () => {
      trip.customPhrases = trip.customPhrases.filter((x) => x.id !== p.id);
      saveJournal(); renderPhrases();
    });
  }
  return node;
}

function openPhraseForm() {
  const trip = currentTrip();
  openModal(`
    <h3>新增自訂例句</h3>
    <div class="field"><label>當地語言</label><input id="f-jp" placeholder="例如：Where is the...?" /></div>
    <div class="field"><label>讀音（選填）</label><input id="f-reading" placeholder="選填" /></div>
    <div class="field"><label>中文意思</label><input id="f-zh" placeholder="選填" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const jp = root.querySelector("#f-jp").value.trim();
      if (!jp) return;
      trip.customPhrases.push({
        id: uid(), cat: "我的例句",
        jp, reading: root.querySelector("#f-reading").value.trim(),
        zh: root.querySelector("#f-zh").value.trim(),
      });
      saveJournal(); renderPhrases(); closeModal();
    });
  });
}

/* ===================== 注意事項 ===================== */
function renderNotes() {
  const trip = currentTrip();
  if (!trip) return;
  const list = $("#noteList");
  list.innerHTML = "";
  trip.notes.forEach((n) => {
    const card = el(`
      <div class="card note-card">
        <span class="note-card__icon">${n.icon || "📌"}</span>
        <span class="note-card__text">${escapeHtml(n.text)}</span>
        <button class="btn btn--danger" data-del>刪</button>
      </div>
    `);
    card.querySelector("[data-del]").addEventListener("click", () => {
      trip.notes = trip.notes.filter((x) => x.id !== n.id);
      saveJournal(); renderNotes();
    });
    list.appendChild(card);
  });
}
function openNoteForm() {
  const trip = currentTrip();
  openModal(`
    <h3>新增提醒</h3>
    <div class="field"><label>內容</label><textarea id="f-text" placeholder="輸入注意事項..."></textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const text = root.querySelector("#f-text").value.trim();
      if (!text) return;
      trip.notes.push({ id: uid(), icon: "📌", text });
      saveJournal(); renderNotes(); closeModal();
    });
  });
}

/* ===================== 旅遊設定 ===================== */
function renderSettings() {
  const trip = currentTrip();
  if (!trip) return;
  const wrap = $("#settingsFields");
  wrap.innerHTML = "";

  const form = el(`
    <div class="card">
      <div class="settings-field">
        <label>國家 / 地區</label>
        <select id="s-country">${countryOptionsHtml(trip.country)}</select>
      </div>
      <div class="settings-field" id="s-custom-wrap" style="display:${COUNTRY_CURRENCY.find(c=>c.country===trip.country) ? "none" : "block"};">
        <div class="settings-row">
          <div><label style="font-size:12px;color:var(--ink-soft);font-weight:700;">貨幣代碼</label><input id="s-cur-code" value="${escapeHtml(trip.currency.code||"")}" /></div>
          <div><label style="font-size:12px;color:var(--ink-soft);font-weight:700;">貨幣符號</label><input id="s-cur-symbol" value="${escapeHtml(trip.currency.symbol||"")}" /></div>
        </div>
      </div>
      <div class="settings-field">
        <label>交通方式</label>
        <select id="s-transport">
          <option value="自駕" ${trip.transport==="自駕"?"selected":""}>自駕</option>
          <option value="大眾運輸" ${trip.transport==="大眾運輸"?"selected":""}>大眾運輸</option>
          <option value="兩者都有" ${trip.transport==="兩者都有"?"selected":""}>兩者都有</option>
        </select>
      </div>
      <div class="settings-field">
        <label>目前天數：${trip.days.length} 天</label>
        <button class="btn btn--ghost" id="s-add-day" style="margin-top:0;">＋ 新增一天</button>
      </div>
      <button class="btn btn--primary btn--block" id="s-save">儲存設定</button>
      <p style="font-size:11.5px;color:var(--ink-soft);margin-top:8px;">變更國家/貨幣不會刪除已建立的景點與行程，但預設清單與例句只會在新增旅遊時套用一次，之後可自行增刪。</p>
    </div>
  `);

  form.querySelector("#s-country").addEventListener("change", (e) => {
    form.querySelector("#s-custom-wrap").style.display = e.target.value === "__custom" ? "block" : "none";
  });

  form.querySelector("#s-add-day").addEventListener("click", () => {
    const t = currentTrip();
    t.days.push({ id: uid(), label: `Day ${t.days.length + 1}`, date: "", stops: [] });
    t.dayCount = t.days.length;
    saveJournal();
    renderSettings();
    renderDays();
    renderTripHeader();
  });

  form.querySelector("#s-save").addEventListener("click", () => {
    const t = currentTrip();
    const countryVal = form.querySelector("#s-country").value;
    if (countryVal === "__custom") {
      t.country = "其他（自訂）";
      t.flag = "🌍";
      t.currency = {
        code: form.querySelector("#s-cur-code").value.trim(),
        symbol: form.querySelector("#s-cur-symbol").value.trim(),
        name: t.currency.name || "當地貨幣",
      };
    } else {
      const entry = findCountryEntry(countryVal);
      if (entry) {
        t.country = entry.country;
        t.flag = entry.flag;
        t.currency = { code: entry.code, symbol: entry.symbol, name: entry.name };
      }
    }
    t.transport = form.querySelector("#s-transport").value;
    saveJournal();
    renderTripHeader();
    renderExpenses();
    renderPhrases();
    const btn = form.querySelector("#s-save");
    btn.textContent = "已儲存 ✓";
    setTimeout(() => { btn.textContent = "儲存設定"; }, 1500);
  });

  wrap.appendChild(form);
}

/* ===================== Modal 系統 ===================== */
function openModal(innerHtml, onMount) {
  const root = $("#modalRoot");
  root.innerHTML = "";
  const backdrop = el(`<div class="modal-backdrop"><div class="modal-sheet"><button class="modal-close">✕</button>${innerHtml}</div></div>`);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
  backdrop.querySelector(".modal-close").addEventListener("click", closeModal);
  root.appendChild(backdrop);
  const cancelBtn = backdrop.querySelector("[data-cancel]");
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (onMount) onMount(backdrop);
}
function closeModal() { $("#modalRoot").innerHTML = ""; }

function initFormTriggers() {
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open]");
    if (!btn) return;
    const type = btn.dataset.open;
    if (type === "trip-form") openTripForm();
    if (type === "spot-form") openSpotForm();
    if (type === "packing-form") openPackingForm();
    if (type === "expense-form") openExpenseForm();
    if (type === "phrase-form") openPhraseForm();
    if (type === "note-form") openNoteForm();
  });
}

/* ===================== 初始化 ===================== */
function init() {
  initTabbar();
  initFormTriggers();
  renderHome();

  $("#backHome").addEventListener("click", goHome);
  $("#openSettings").addEventListener("click", () => switchView("settings"));
  $("#fetchRateBtn").addEventListener("click", fetchLiveRate);
  $("#deleteTripBtn").addEventListener("click", () => {
    const trip = currentTrip();
    if (!trip) return;
    if (confirm(`確定要刪除「${trip.title}」這趟旅遊嗎？此動作無法復原。`)) {
      JOURNAL.trips = JOURNAL.trips.filter((t) => t.id !== trip.id);
      saveJournal();
      goHome();
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
}
document.addEventListener("DOMContentLoaded", init);
