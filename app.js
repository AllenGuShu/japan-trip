/* ===================== 資料層 ===================== */
const STORAGE_KEY = "jp-trip-journal-v2";
const OLD_STORAGE_KEY = "jp-trip-data-v1";

function uid() { return Math.random().toString(36).slice(2, 10); }

function defaultPacking() {
  return [
    { category: "證件與行車", items: [
      { id: uid(), text: "護照（效期6個月以上）", done: false },
      { id: uid(), text: "護照影本 x2", done: false },
      { id: uid(), text: "國際駕照", done: false },
      { id: uid(), text: "台灣駕照正本", done: false },
      { id: uid(), text: "租車預約確認單", done: false },
      { id: uid(), text: "機票 / 電子機票", done: false },
      { id: uid(), text: "住宿訂房確認單", done: false },
      { id: uid(), text: "海外旅平險保單", done: false },
    ]},
    { category: "3C與行車用品", items: [
      { id: uid(), text: "手機＋車用手機架", done: false },
      { id: uid(), text: "行動電源", done: false },
      { id: uid(), text: "充電線 x2", done: false },
      { id: uid(), text: "日本電源轉接頭", done: false },
      { id: uid(), text: "上網 SIM卡 / eSIM / WiFi分享器", done: false },
      { id: uid(), text: "ETC卡（若租車有配）", done: false },
    ]},
    { category: "藥品與盥洗", items: [
      { id: uid(), text: "個人常備藥（腸胃藥、止痛藥）", done: false },
      { id: uid(), text: "暈車藥", done: false },
      { id: uid(), text: "防曬乳", done: false },
      { id: uid(), text: "隨身小包衛生紙／濕紙巾", done: false },
    ]},
    { category: "衣物", items: [
      { id: uid(), text: "透氣排汗衣物", done: false },
      { id: uid(), text: "薄外套（室內冷氣強）", done: false },
      { id: uid(), text: "帽子／太陽眼鏡", done: false },
      { id: uid(), text: "好走的鞋", done: false },
    ]},
    { category: "金錢", items: [
      { id: uid(), text: "日幣現金", done: false },
      { id: uid(), text: "信用卡（記得開通海外交易）", done: false },
    ]},
  ];
}

function defaultNotes() {
  return [
    { id: uid(), icon: "🚗", text: "日本靠左行駛，方向燈與雨刷開關與台灣左右相反，上路前先熟悉。" },
    { id: uid(), icon: "🛣️", text: "高速公路上多為 ETC 車道，若車輛未裝 ETC 卡要走一般收費車道，備妥現金或信用卡。" },
    { id: uid(), icon: "⛽", text: "加油站分「セルフ」自助（較便宜）與有人服務，自助加油機多為日文介面，可先查好操作步驟。" },
    { id: uid(), icon: "🅿️", text: "市區停車費偏高，善用 Times、コインパーキング等付費停車 App／看板確認每小時／每日上限。" },
    { id: uid(), icon: "🗑️", text: "路上垃圾桶少，垃圾請自行帶回住宿或便利商店丟棄，不可亂丟。" },
    { id: uid(), icon: "🚻", text: "便利商店借廁所前建議禮貌詢問或消費，維持良好觀感。" },
  ];
}

function newTrip({ title, dateRange, dayCount }) {
  const count = Math.min(Math.max(Number(dayCount) || 6, 1), 30);
  return {
    id: uid(),
    title: title || "未命名旅遊",
    dateRange: dateRange || "",
    dayCount: count,
    exRate: 0.21,
    createdAt: Date.now(),
    spots: [],
    days: Array.from({ length: count }, (_, i) => ({ id: uid(), label: `Day ${i + 1}`, date: "", stops: [] })),
    packing: defaultPacking(),
    expenses: [],
    customPhrases: [],
    notes: defaultNotes(),
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

  // 從舊版單一旅遊資料自動搬遷
  try {
    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      const migrated = {
        id: uid(),
        title: old.tripTitle || "日本自駕旅遊",
        dateRange: old.dateRange || "",
        dayCount: (old.days || []).length || 6,
        exRate: old.exRate ?? 0.21,
        createdAt: Date.now(),
        spots: old.spots || [],
        days: old.days && old.days.length ? old.days : newTrip({ dayCount: 6 }).days,
        packing: old.packing || defaultPacking(),
        expenses: old.expenses || [],
        customPhrases: old.customPhrases || [],
        notes: old.notes || defaultNotes(),
      };
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
const PHRASES = [
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
            <p class="trip-card__title">${escapeHtml(trip.title)}</p>
            <p class="trip-card__meta">${trip.dayCount}天${Math.max(trip.dayCount - 1, 0)}夜${trip.dateRange ? " · " + escapeHtml(trip.dateRange) : ""}</p>
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

function openTripForm() {
  openModal(`
    <h3>新增一趟旅遊</h3>
    <div class="field"><label>旅遊名稱</label><input id="f-title" placeholder="例如：2026夏 日本自駕" /></div>
    <div class="field"><label>日期（選填）</label><input id="f-date" placeholder="例如：2026/08/29 - 09/03" /></div>
    <div class="field"><label>天數</label><input id="f-days" type="number" min="1" max="30" value="6" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>建立並開始規劃</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const title = root.querySelector("#f-title").value.trim();
      if (!title) return;
      const trip = newTrip({
        title,
        dateRange: root.querySelector("#f-date").value.trim(),
        dayCount: root.querySelector("#f-days").value,
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
  $("#tripDaysLabel").textContent = `${trip.dayCount}天${Math.max(trip.dayCount - 1, 0)}夜・自駕`;

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
  const total = trip.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  $("#totalJPY").textContent = "¥" + total.toLocaleString();
  $("#totalTWD").textContent = "NT$" + Math.round(total * trip.exRate).toLocaleString();

  const byCat = $("#expenseByCategory");
  byCat.innerHTML = "";
  EXPENSE_CATS.forEach((c) => {
    const sum = trip.expenses.filter((e) => e.category === c.key).reduce((s, e) => s + Number(e.amount || 0), 0);
    if (sum > 0) byCat.appendChild(el(`<div class="chip static">${c.icon} ${c.key} ¥${sum.toLocaleString()}</div>`));
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
        <div class="expense-row__amount">¥${Number(e.amount).toLocaleString()}</div>
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
    <div class="field"><label>金額（日幣）</label><input id="f-amount" type="number" placeholder="0" /></div>
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

/* ===================== 會話小抄 ===================== */
let phraseFilter = "全部";
function renderPhrases() {
  const trip = currentTrip();
  if (!trip) return;
  const cats = ["全部", ...new Set(PHRASES.map((p) => p.cat)), ...(trip.customPhrases.length ? ["我的例句"] : [])];
  const bar = $("#phraseFilters");
  bar.innerHTML = "";
  cats.forEach((c) => {
    const chip = el(`<button class="chip ${phraseFilter===c?"active":""}">${c}</button>`);
    chip.addEventListener("click", () => { phraseFilter = c; renderPhrases(); });
    bar.appendChild(chip);
  });

  const list = $("#phraseList");
  list.innerHTML = "";
  const base = phraseFilter === "我的例句" ? [] : PHRASES.filter((p) => phraseFilter === "全部" || p.cat === phraseFilter);
  const custom = (phraseFilter === "全部" || phraseFilter === "我的例句") ? trip.customPhrases : [];

  base.forEach((p) => list.appendChild(phraseCard(p)));
  custom.forEach((p) => list.appendChild(phraseCard(p, true, trip)));
}
function phraseCard(p, deletable = false, trip = null) {
  const node = el(`
    <div class="card">
      <p class="phrase-card__jp">${escapeHtml(p.jp)}</p>
      <p class="phrase-card__reading">${escapeHtml(p.reading || "")}</p>
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
    <div class="field"><label>日文</label><input id="f-jp" placeholder="日本語" /></div>
    <div class="field"><label>讀音（假名/羅馬拼音）</label><input id="f-reading" placeholder="選填" /></div>
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
