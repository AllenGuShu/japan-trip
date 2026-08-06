/* ===================== 資料層 ===================== */
const STORAGE_KEY = "jp-trip-journal-v3";
const OLD_STORAGE_KEY_V2 = "jp-trip-journal-v2";
const OLD_STORAGE_KEY_V1 = "jp-trip-data-v1";
const GMAPS_KEY_STORAGE = "gmaps-api-key";
const THEME_STORAGE = "trip-journal-theme";

function uid() { return Math.random().toString(36).slice(2, 10); }

/* ---------- 國家 / 貨幣對照表 ---------- */
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
function findCountryEntry(countryName) { return COUNTRY_CURRENCY.find((c) => c.country === countryName) || null; }

const STOP_TAGS = ["美食", "購物", "自然", "文化", "歷史", "夜景", "親子", "秘境", "打卡"];
const EXPENSE_CATS = [
  { key: "交通", icon: "🚗" }, { key: "住宿", icon: "🏨" }, { key: "餐飲", icon: "🍜" },
  { key: "門票", icon: "🎫" }, { key: "購物", icon: "🛍️" }, { key: "其他", icon: "🧾" },
];
const FLIGHT_DIRECTIONS = ["去程", "回程", "轉機", "其他"];
const TRANSPORT_TYPES = ["租車", "火車", "新幹線", "公車", "捷運/地鐵", "渡輪", "計程車/叫車", "其他"];
const AIRLINE_HINTS = ["長榮","華航","中華航空","日航","JAL","全日空","ANA","國泰","Cathay","星宇","Starlux","酷航","Scoot","樂桃","Peach","捷星","Jetstar","虎航","Tigerair","華信","立榮","國泰港龍"];

function emptyBudget() {
  const byCategory = {};
  EXPENSE_CATS.forEach((c) => { byCategory[c.key] = null; });
  return { total: null, byCategory };
}

/* ---------- 日期工具 ---------- */
function addDaysISO(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function isoToSlash(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${y}/${Number(m)}/${Number(d)}`;
}
function formatDateDisplay(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", weekday: "short" });
}

/* ---------- 預設準備清單 ---------- */
function defaultPacking(currencyName, selfDrive) {
  const groups = [
    { category: "證件與文件", items: ["護照（效期6個月以上）", "護照影本 x2", "機票 / 電子機票", "住宿訂房確認單", "海外旅平險保單"] },
    { category: "3C用品", items: ["手機＋充電線", "行動電源", "當地電源轉接頭", "上網 SIM卡 / eSIM / WiFi分享器"] },
    { category: "藥品與盥洗", items: ["個人常備藥（腸胃藥、止痛藥）", "暈車/暈機藥", "防曬乳", "隨身小包衛生紙／濕紙巾"] },
    { category: "衣物", items: ["當地氣候合適衣物", "薄外套（室內冷氣強或早晚溫差）", "帽子／太陽眼鏡", "好走的鞋"] },
    { category: "金錢", items: [`${currencyName || "當地貨幣"}現金`, "信用卡（記得開通海外交易）"] },
  ];
  if (selfDrive) groups.push({ category: "自駕用品", items: ["國際駕照", "台灣駕照正本", "租車預約確認單", "車用手機架", "ETC卡（若租車有配）"] });
  return groups.map((g) => ({ category: g.category, items: g.items.map((text) => ({ id: uid(), text, done: false })) }));
}

function newTrip({ title, startDate, dayCount, countryEntry, transport }) {
  const count = Math.min(Math.max(Number(dayCount) || 1, 1), 30);
  const selfDrive = transport === "自駕" || transport === "兩者都有";
  const days = Array.from({ length: count }, (_, i) => ({
    id: uid(), label: `Day ${i + 1}`, date: startDate ? addDaysISO(startDate, i) : "", journal: "", stops: [],
  }));
  const dateRange = startDate ? `${isoToSlash(startDate)}-${isoToSlash(addDaysISO(startDate, count - 1))}` : "";
  return {
    id: uid(),
    title: title || "未命名旅遊",
    dateRange,
    dayCount: count,
    country: countryEntry.country,
    flag: countryEntry.flag,
    transport: transport || "大眾運輸",
    currency: { code: countryEntry.code, symbol: countryEntry.symbol, name: countryEntry.name },
    exRate: countryEntry.rate,
    budget: emptyBudget(),
    createdAt: Date.now(),
    spots: [],
    days,
    packing: defaultPacking(countryEntry.name, selfDrive),
    expenses: [],
    members: [],
    customPhrases: [],
    notes: [],
    flights: [],
    lodging: [],
    transportItems: [],
    weatherCity: "",
    weatherCache: null,
    syncCode: null,
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
    budget: old.budget || emptyBudget(),
    createdAt: old.createdAt || Date.now(),
    spots: (old.spots || []).map((s) => ({ tags: [], ...s })),
    days: old.days && old.days.length ? old.days.map((d) => ({ journal: "", ...d, stops: (d.stops||[]).map(s=>({tags:[],...s})) })) : [],
    packing: old.packing || defaultPacking("日圓", true),
    expenses: (old.expenses || []).map((e) => ({ payerId: null, splitWith: [], ...e })),
    members: old.members || [],
    customPhrases: old.customPhrases || [],
    notes: old.notes || [],
    flights: old.flights || [],
    lodging: old.lodging || [],
    transportItems: old.transportItems || [],
    weatherCity: old.weatherCity || "",
    weatherCache: old.weatherCache || null,
    syncCode: null,
  };
}

function loadJournal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.trips)) {
        parsed.trips.forEach((t) => {
          if (!t.budget) t.budget = emptyBudget();
          if (!t.flights) t.flights = [];
          if (!t.lodging) t.lodging = [];
          if (!t.transportItems) t.transportItems = [];
          if (t.weatherCity === undefined) t.weatherCity = "";
          if (t.weatherCache === undefined) t.weatherCache = null;
          if (!t.notes) t.notes = [];
          if (!t.members) t.members = [];
          if (t.syncCode === undefined) t.syncCode = null;
          (t.expenses || []).forEach((e) => {
            if (e.payerId === undefined) e.payerId = null;
            if (!e.splitWith) e.splitWith = [];
          });
          (t.spots || []).forEach((s) => { if (!s.tags) s.tags = []; });
          (t.days || []).forEach((d) => {
            if (d.journal === undefined) d.journal = "";
            (d.stops || []).forEach((s) => { if (!s.tags) s.tags = []; });
          });
        });
        return parsed;
      }
    }
  } catch (e) { /* ignore */ }

  try {
    const v2raw = localStorage.getItem(OLD_STORAGE_KEY_V2);
    if (v2raw) {
      const v2 = JSON.parse(v2raw);
      if (v2 && Array.isArray(v2.trips) && v2.trips.length) return { trips: v2.trips.map(migrateV2Trip) };
    }
  } catch (e) { /* ignore */ }

  try {
    const v1raw = localStorage.getItem(OLD_STORAGE_KEY_V1);
    if (v1raw) {
      const old = JSON.parse(v1raw);
      const migrated = migrateV2Trip({
        title: old.tripTitle, dateRange: old.dateRange, dayCount: (old.days || []).length,
        exRate: old.exRate, spots: old.spots, days: old.days, packing: old.packing,
        expenses: old.expenses, customPhrases: old.customPhrases, notes: old.notes,
      });
      return { trips: [migrated] };
    }
  } catch (e) { /* ignore */ }

  return { trips: [] };
}

let JOURNAL = loadJournal();
function saveJournal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(JOURNAL));
  const trip = currentTrip();
  if (trip && trip.syncCode) pushTripToCloud(trip);
}

const appState = { screen: "home", tripId: null };
function currentTrip() { return JOURNAL.trips.find((t) => t.id === appState.tripId); }

/* ---------- 深複製 + 重新產生所有巢狀 id ---------- */
function regenerateIds(trip) {
  trip.id = uid();
  const memberIdMap = new Map();
  (trip.members || []).forEach((m) => { const newId = uid(); memberIdMap.set(m.id, newId); m.id = newId; });
  (trip.spots || []).forEach((s) => { s.id = uid(); });
  (trip.days || []).forEach((d) => { d.id = uid(); (d.stops || []).forEach((st) => { st.id = uid(); }); });
  (trip.packing || []).forEach((g) => { (g.items || []).forEach((it) => { it.id = uid(); }); });
  (trip.expenses || []).forEach((e) => {
    e.id = uid();
    if (e.payerId && memberIdMap.has(e.payerId)) e.payerId = memberIdMap.get(e.payerId);
    if (Array.isArray(e.splitWith)) e.splitWith = e.splitWith.filter((id) => memberIdMap.has(id)).map((id) => memberIdMap.get(id));
  });
  (trip.customPhrases || []).forEach((p) => { p.id = uid(); });
  (trip.notes || []).forEach((n) => { n.id = uid(); });
  (trip.flights || []).forEach((f) => { f.id = uid(); });
  (trip.lodging || []).forEach((l) => { l.id = uid(); });
  (trip.transportItems || []).forEach((t) => { t.id = uid(); });
  return trip;
}

function duplicateTrip(trip, mode) {
  const copy = JSON.parse(JSON.stringify(trip));
  regenerateIds(copy);
  copy.createdAt = Date.now();
  copy.syncCode = null;
  if (mode === "template") {
    copy.title = trip.title + "（範本）";
    copy.spots = [];
    copy.days = copy.days.map((d) => ({ id: uid(), label: d.label, date: "", journal: "", stops: [] }));
    copy.dateRange = "";
    copy.expenses = [];
    copy.flights = [];
    copy.lodging = [];
    copy.transportItems = [];
    copy.weatherCache = null;
    copy.packing.forEach((g) => g.items.forEach((it) => { it.done = false; }));
  } else {
    copy.title = trip.title + "（複製）";
  }
  return copy;
}

/* ===================== 靜態會話資料（每類 8 句） ===================== */
const JP_PHRASES = [
  { cat: "加油站", jp: "満タンでお願いします。", reading: "まんたんで おねがいします。", zh: "請幫我加滿。" },
  { cat: "加油站", jp: "レギュラーを入れてください。", reading: "れぎゅらーを いれてください。", zh: "請加普通汽油。" },
  { cat: "加油站", jp: "ハイオクを入れてください。", reading: "はいおくを いれてください。", zh: "請加高級汽油。" },
  { cat: "加油站", jp: "軽油を入れてください。", reading: "けいゆを いれてください。", zh: "請加柴油。" },
  { cat: "加油站", jp: "カードで払えますか？", reading: "かーどで はらえますか？", zh: "可以刷卡嗎？" },
  { cat: "加油站", jp: "現金で払います。", reading: "げんきんで はらいます。", zh: "我要付現金。" },
  { cat: "加油站", jp: "セルフですか？", reading: "せるふですか？", zh: "這是自助加油嗎？" },
  { cat: "加油站", jp: "領収書をもらえますか？", reading: "りょうしゅうしょを もらえますか？", zh: "可以給我收據嗎？" },

  { cat: "停車場", jp: "駐車場はどこですか？", reading: "ちゅうしゃじょうは どこですか？", zh: "停車場在哪裡？" },
  { cat: "停車場", jp: "何時間まで停められますか？", reading: "なんじかんまで とめられますか？", zh: "最多可以停幾小時？" },
  { cat: "停車場", jp: "一泊いくらですか？", reading: "いっぱく いくらですか？", zh: "停一晚多少錢？" },
  { cat: "停車場", jp: "満車ですか？", reading: "まんしゃですか？", zh: "已經滿了嗎？" },
  { cat: "停車場", jp: "ここに駐車してもいいですか？", reading: "ここに ちゅうしゃしても いいですか？", zh: "可以停在這裡嗎？" },
  { cat: "停車場", jp: "出口はどこですか？", reading: "でぐちは どこですか？", zh: "出口在哪裡？" },
  { cat: "停車場", jp: "駐車券をなくしました。", reading: "ちゅうしゃけんを なくしました。", zh: "我的停車券不見了。" },
  { cat: "停車場", jp: "支払い機はどこですか？", reading: "しはらいきは どこですか？", zh: "繳費機在哪裡？" },

  { cat: "開車問路", jp: "この道で合っていますか？", reading: "このみちで あっていますか？", zh: "這條路走對了嗎？" },
  { cat: "開車問路", jp: "次の高速の入口はどこですか？", reading: "つぎの こうそくの いりぐちは どこですか？", zh: "下一個高速公路入口在哪？" },
  { cat: "開車問路", jp: "高速道路の料金はいくらですか？", reading: "こうそくどうろの りょうきんは いくらですか？", zh: "高速公路過路費多少？" },
  { cat: "開車問路", jp: "この先に道の駅はありますか？", reading: "このさきに みちのえきは ありますか？", zh: "前面有道の駅（休息站）嗎？" },
  { cat: "開車問路", jp: "近くにコンビニはありますか？", reading: "ちかくに こんびには ありますか？", zh: "附近有便利商店嗎？" },
  { cat: "開車問路", jp: "ここは一方通行ですか？", reading: "ここは いっぽうつうこうですか？", zh: "這裡是單行道嗎？" },
  { cat: "開車問路", jp: "渋滞していますか？", reading: "じゅうたいしていますか？", zh: "現在塞車嗎？" },
  { cat: "開車問路", jp: "カーナビの設定を手伝ってもらえますか？", reading: "かーなびの せっていを てつだって もらえますか？", zh: "可以幫我設定車用導航嗎？" },

  { cat: "餐廳", jp: "二名です、席はありますか？", reading: "にめいです、せきは ありますか？", zh: "兩位，有位子嗎？" },
  { cat: "餐廳", jp: "おすすめは何ですか？", reading: "おすすめは なんですか？", zh: "有什麼推薦的嗎？" },
  { cat: "餐廳", jp: "お会計をお願いします。", reading: "おかいけいを おねがいします。", zh: "請幫我結帳。" },
  { cat: "餐廳", jp: "メニューを見せてください。", reading: "めにゅーを みせてください。", zh: "請給我看菜單。" },
  { cat: "餐廳", jp: "辛くないものはありますか？", reading: "からくない ものは ありますか？", zh: "有不辣的餐點嗎？" },
  { cat: "餐廳", jp: "卵アレルギーがあります。", reading: "たまごあれるぎーが あります。", zh: "我對蛋過敏。" },
  { cat: "餐廳", jp: "お水をください。", reading: "おみずを ください。", zh: "請給我水。" },
  { cat: "餐廳", jp: "これは何ですか？", reading: "これは なんですか？", zh: "這是什麼？" },

  { cat: "緊急狀況", jp: "道に迷いました。", reading: "みちに まよいました。", zh: "我迷路了。" },
  { cat: "緊急狀況", jp: "事故にあいました。助けてください。", reading: "じこに あいました。たすけてください。", zh: "我發生事故了，請幫忙。" },
  { cat: "緊急狀況", jp: "救急車を呼んでください。", reading: "きゅうきゅうしゃを よんでください。", zh: "請叫救護車。" },
  { cat: "緊急狀況", jp: "警察を呼んでください。", reading: "けいさつを よんでください。", zh: "請叫警察。" },
  { cat: "緊急狀況", jp: "パスポートをなくしました。", reading: "ぱすぽーとを なくしました。", zh: "我的護照不見了。" },
  { cat: "緊急狀況", jp: "財布を盗まれました。", reading: "さいふを ぬすまれました。", zh: "我的錢包被偷了。" },
  { cat: "緊急狀況", jp: "具合が悪いです、病院はどこですか？", reading: "ぐあいが わるいです、びょういんは どこですか？", zh: "我不舒服，醫院在哪裡？" },
  { cat: "緊急狀況", jp: "英語を話せる人はいますか？", reading: "えいごを はなせる ひとは いますか？", zh: "有人會說英文嗎？" },
];

const EN_PHRASES = [
  { cat: "住宿", jp: "I have a reservation under my name.", reading: "", zh: "我有以我的名字訂房。" },
  { cat: "住宿", jp: "What time is check-out?", reading: "", zh: "退房時間是幾點？" },
  { cat: "住宿", jp: "Could I get an extra towel, please?", reading: "", zh: "可以再給我一條毛巾嗎？" },
  { cat: "住宿", jp: "Is breakfast included?", reading: "", zh: "有包含早餐嗎？" },
  { cat: "住宿", jp: "Can I have a late check-out?", reading: "", zh: "可以延後退房嗎？" },
  { cat: "住宿", jp: "Do you have Wi-Fi in the room?", reading: "", zh: "房間裡有 Wi-Fi 嗎？" },
  { cat: "住宿", jp: "Could you call a taxi for me, please?", reading: "", zh: "可以幫我叫計程車嗎？" },
  { cat: "住宿", jp: "Is there a safe in the room?", reading: "", zh: "房間裡有保險箱嗎？" },

  { cat: "餐廳", jp: "Could I see the menu, please?", reading: "", zh: "可以給我菜單嗎？" },
  { cat: "餐廳", jp: "Check, please.", reading: "", zh: "請幫我結帳。" },
  { cat: "餐廳", jp: "Do you have a table for two?", reading: "", zh: "有兩人的位子嗎？" },
  { cat: "餐廳", jp: "What do you recommend?", reading: "", zh: "有什麼推薦的嗎？" },
  { cat: "餐廳", jp: "Could I get this to go?", reading: "", zh: "可以外帶嗎？" },
  { cat: "餐廳", jp: "Is this dish spicy?", reading: "", zh: "這道菜辣嗎？" },
  { cat: "餐廳", jp: "Could we get some water, please?", reading: "", zh: "可以給我們一些水嗎？" },
  { cat: "餐廳", jp: "Do you have any vegetarian options?", reading: "", zh: "有素食選項嗎？" },

  { cat: "問路", jp: "How do I get to the nearest train station?", reading: "", zh: "最近的車站怎麼走？" },
  { cat: "問路", jp: "Is it within walking distance?", reading: "", zh: "用走的到得了嗎？" },
  { cat: "問路", jp: "Excuse me, could you show me on the map?", reading: "", zh: "不好意思，可以在地圖上指給我看嗎？" },
  { cat: "問路", jp: "How long does it take to get there?", reading: "", zh: "到那裡要多久？" },
  { cat: "問路", jp: "Which platform do I need for this train?", reading: "", zh: "這班車要在哪個月台搭？" },
  { cat: "問路", jp: "Is this the right way to the city center?", reading: "", zh: "這樣走去市中心對嗎？" },
  { cat: "問路", jp: "Where is the nearest restroom?", reading: "", zh: "最近的洗手間在哪裡？" },
  { cat: "問路", jp: "Excuse me, I think I'm lost.", reading: "", zh: "不好意思，我好像迷路了。" },

  { cat: "購物", jp: "How much is this?", reading: "", zh: "這個多少錢？" },
  { cat: "購物", jp: "Do you accept credit cards?", reading: "", zh: "可以刷卡嗎？" },
  { cat: "購物", jp: "Can I try this on?", reading: "", zh: "可以試穿嗎？" },
  { cat: "購物", jp: "Do you have this in a different size?", reading: "", zh: "有其他尺寸嗎？" },
  { cat: "購物", jp: "Is tax included in the price?", reading: "", zh: "價格有含稅嗎？" },
  { cat: "購物", jp: "Can I get a tax refund here?", reading: "", zh: "這裡可以退稅嗎？" },
  { cat: "購物", jp: "Could I get a bag for this?", reading: "", zh: "可以給我一個袋子嗎？" },
  { cat: "購物", jp: "Can I return this if it doesn't fit?", reading: "", zh: "如果不合適可以退換嗎？" },

  { cat: "緊急狀況", jp: "I need help, please.", reading: "", zh: "我需要幫忙。" },
  { cat: "緊急狀況", jp: "Please call an ambulance.", reading: "", zh: "請叫救護車。" },
  { cat: "緊急狀況", jp: "I lost my passport.", reading: "", zh: "我的護照遺失了。" },
  { cat: "緊急狀況", jp: "Please call the police.", reading: "", zh: "請叫警察。" },
  { cat: "緊急狀況", jp: "My wallet was stolen.", reading: "", zh: "我的錢包被偷了。" },
  { cat: "緊急狀況", jp: "I don't feel well, where's the nearest hospital?", reading: "", zh: "我不舒服，最近的醫院在哪裡？" },
  { cat: "緊急狀況", jp: "Is there anyone who speaks English?", reading: "", zh: "有人會說英文嗎？" },
  { cat: "緊急狀況", jp: "Could you help me contact my embassy?", reading: "", zh: "可以幫我聯絡大使館嗎？" },
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
function mapUrl(query) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query); }
function mapUrlForPlace(name, placeId) {
  if (placeId) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(placeId)}`;
  return mapUrl(name);
}

/* ===================== 深色模式 ===================== */
function getTheme() { return localStorage.getItem(THEME_STORAGE) || "light"; }
function applyTheme(theme) { document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light"); }
function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE, next);
  applyTheme(next);
  $all(".theme-toggle-btn").forEach((b) => { b.textContent = next === "dark" ? "☀️" : "🌙"; });
}

/* ===================== Google Places（選用） ===================== */
function getApiKey() { return localStorage.getItem(GMAPS_KEY_STORAGE) || ""; }
function setApiKey(key) { if (key) localStorage.setItem(GMAPS_KEY_STORAGE, key); else localStorage.removeItem(GMAPS_KEY_STORAGE); }

let gmapsLoadPromise = null;
function loadGoogleMaps(key) {
  if (!key) return Promise.reject(new Error("no key"));
  if (window.google && window.google.maps && window.google.maps.places) return Promise.resolve();
  if (gmapsLoadPromise) return gmapsLoadPromise;
  gmapsLoadPromise = new Promise((resolve, reject) => {
    const cbName = "__gmapsReady";
    window[cbName] = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=${cbName}`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps 載入失敗"));
    document.head.appendChild(script);
  });
  return gmapsLoadPromise;
}
function tryAttachPlacesAutocomplete(input, onPlace) {
  const key = getApiKey();
  if (!key || !input) return;
  loadGoogleMaps(key).then(() => {
    if (!(window.google && window.google.maps && window.google.maps.places)) return;
    try {
      const ac = new window.google.maps.places.Autocomplete(input, { fields: ["place_id", "name", "formatted_address", "geometry"] });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place && place.place_id) onPlace(place);
      });
    } catch (e) { /* 靜默失敗 */ }
  }).catch(() => {});
}

function openGlobalSettings() {
  const key = getApiKey();
  openModal(`
    <h3>🔑 地點搜尋設定</h3>
    <p style="font-size:12.5px;color:var(--ink-soft);line-height:1.6;margin-top:-6px;">
      填入 Google Maps API 金鑰後，新增行程點/住宿時可以直接搜尋真實地標，自動帶入正確地址與地圖連結。
      沒有金鑰也完全不影響使用，只是要自己手動輸入地名。金鑰只會存在你這台裝置的瀏覽器裡。
    </p>
    <div class="field"><label>Google Maps API 金鑰</label><input id="f-key" value="${escapeHtml(key)}" placeholder="貼上你的 API 金鑰" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>關閉</button>
      <button class="btn btn--danger" data-clear>清除金鑰</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const v = root.querySelector("#f-key").value.trim();
      setApiKey(v);
      if (v) loadGoogleMaps(v).catch(() => {});
      closeModal();
    });
    root.querySelector("[data-clear]").addEventListener("click", () => { setApiKey(""); closeModal(); });
  });
}

/* ===================== 共同編輯（Firebase Firestore，選用） ===================== */
let syncEnabled = false;
let db = null;
let activeSyncUnsub = null;
const pushTimers = {};

function initFirebaseIfConfigured() {
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.apiKey || !window.firebase) { syncEnabled = false; return; }
  try {
    firebase.initializeApp(cfg);
    db = firebase.firestore();
    syncEnabled = true;
  } catch (e) { syncEnabled = false; }
}

function generateShareCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 避免容易看錯的字元
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function pushTripToCloud(trip) {
  if (!syncEnabled || !trip.syncCode || !db) return;
  clearTimeout(pushTimers[trip.id]);
  pushTimers[trip.id] = setTimeout(() => {
    const clean = JSON.parse(JSON.stringify(trip));
    db.collection("trips").doc(trip.syncCode).set(clean).catch((e) => console.warn("同步上傳失敗", e));
  }, 800);
}

function unsubscribeTripSync() {
  if (activeSyncUnsub) { activeSyncUnsub(); activeSyncUnsub = null; }
}

function subscribeTripSync(trip) {
  unsubscribeTripSync();
  if (!syncEnabled || !trip.syncCode || !db) return;
  activeSyncUnsub = db.collection("trips").doc(trip.syncCode).onSnapshot((snap) => {
    if (!snap.exists) return;
    const remote = snap.data();
    if (!remote) return;
    const idx = JOURNAL.trips.findIndex((t) => t.id === trip.id);
    if (idx === -1) return;
    JOURNAL.trips[idx] = remote;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(JOURNAL));
    if (appState.screen === "trip" && appState.tripId === trip.id) {
      renderTripHeader(); renderDaysView(); renderExpenses(); renderPhrases(); renderLogistics(); renderSettings();
    }
  }, (err) => { console.warn("同步監聽失敗", err); });
}

async function enableSync(trip) {
  if (!syncEnabled) { alert("尚未設定雲端同步功能，請聯絡開發者設定 Firebase（詳見 README）。"); return; }
  const code = generateShareCode();
  const clean = JSON.parse(JSON.stringify(trip));
  clean.syncCode = code;
  try {
    await db.collection("trips").doc(code).set(clean);
    trip.syncCode = code;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(JOURNAL));
    subscribeTripSync(trip);
    renderSettings();
    renderTripHeader();
  } catch (e) {
    alert("啟用共同編輯失敗，請確認網路連線或 Firebase 設定是否正確。");
  }
}

function disableSync(trip) {
  unsubscribeTripSync();
  trip.syncCode = null;
  saveJournal();
  renderSettings();
  renderTripHeader();
}

function openJoinSyncForm() {
  if (!syncEnabled) { alert("尚未設定雲端同步功能，請聯絡開發者設定 Firebase（詳見 README）。"); return; }
  openModal(`
    <h3>🔗 加入共編旅遊</h3>
    <p style="font-size:12.5px;color:var(--ink-soft);margin-top:-6px;">輸入朋友給你的 6 碼代碼，就能加入同一趟旅遊，之後你們兩邊的行程、記帳都會即時同步。</p>
    <div class="field"><label>共編代碼</label><input id="f-code" placeholder="例如 AB3F9K" style="text-transform:uppercase;letter-spacing:2px;font-family:var(--font-mono);" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>加入</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", async () => {
      const code = root.querySelector("#f-code").value.trim().toUpperCase();
      if (!code) return;
      const btn = root.querySelector("[data-save]");
      btn.textContent = "加入中...";
      try {
        const snap = await db.collection("trips").doc(code).get();
        if (!snap.exists) { alert("找不到這個代碼，請確認是否正確。"); btn.textContent = "加入"; return; }
        const remote = snap.data();
        const existingIdx = JOURNAL.trips.findIndex((t) => t.syncCode === code);
        if (existingIdx >= 0) JOURNAL.trips[existingIdx] = remote;
        else JOURNAL.trips.push(remote);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(JOURNAL));
        closeModal();
        renderHome();
        openTrip(remote.id);
      } catch (e) {
        alert("加入失敗，請確認網路連線。");
        btn.textContent = "加入";
      }
    });
  });
}

/* ===================== 天氣（Open-Meteo，免金鑰） ===================== */
async function geocodeCity(city) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`);
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error("找不到這個城市");
  const r = data.results[0];
  return { lat: r.latitude, lon: r.longitude, label: r.name + (r.admin1 ? " " + r.admin1 : "") };
}
async function fetchWeatherForTrip() {
  const trip = currentTrip();
  const status = $("#weatherStatus");
  if (!trip.weatherCity) { if (status) status.textContent = "請先填入城市名稱。"; return; }
  if (status) status.textContent = "查詢中...";
  try {
    const loc = await geocodeCity(trip.weatherCity);
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`);
    const data = await res.json();
    const days = data.daily.time.map((date, i) => ({ date, code: data.daily.weathercode[i], tmax: data.daily.temperature_2m_max[i], tmin: data.daily.temperature_2m_min[i] }));
    trip.weatherCache = { city: loc.label, fetchedAt: Date.now(), days };
    saveJournal();
    if (status) status.textContent = `已更新（${loc.label}）`;
    renderDaysView();
  } catch (e) {
    if (status) status.textContent = "查詢失敗，請確認城市名稱或網路連線。";
  }
}
function weatherIconFor(code) {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return "🌧️";
  if ([71,73,75,77,85,86].includes(code)) return "❄️";
  if ([95,96,99].includes(code)) return "⛈️";
  return "🌡️";
}
function weatherForDate(trip, isoDate) {
  if (!isoDate || !trip.weatherCache) return null;
  return trip.weatherCache.days.find((d) => d.date === isoDate) || null;
}

/* ===================== 確認信自動辨識（best-effort） ===================== */
function parseFlightText(text) {
  const out = {};
  const airline = AIRLINE_HINTS.find((a) => text.includes(a));
  if (airline) out.airline = airline;
  const flightNo = text.match(/\b([A-Z]{2}\s?\d{2,4})\b/);
  if (flightNo) out.flightNo = flightNo[1].replace(/\s/, "");
  const airports = [...text.matchAll(/\b([A-Z]{3})\b/g)].map((m) => m[1]).filter((code) => code !== (out.flightNo||"").slice(0,3));
  if (airports[0]) out.depAirport = airports[0];
  if (airports[1]) out.arrAirport = airports[1];
  const times = [...text.matchAll(/\b(\d{1,2}:\d{2})\b/g)].map((m) => m[1]);
  if (times[0]) out.depTime = times[0];
  if (times[1]) out.arrTime = times[1];
  const dateMatch = text.match(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/);
  if (dateMatch) out.date = `${dateMatch[1]}-${String(dateMatch[2]).padStart(2,"0")}-${String(dateMatch[3]).padStart(2,"0")}`;
  const pnr = text.match(/(?:PNR|booking|confirmation|訂位代碼|預約代碼)[:\s]*([A-Z0-9]{5,8})/i);
  if (pnr) out.bookingCode = pnr[1];
  return out;
}
function parseLodgingText(text) {
  const out = {};
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const nameLine = lines.find((l) => /hotel|飯店|旅館|民宿|inn|resort/i.test(l));
  if (nameLine) out.name = nameLine.slice(0, 60);
  const dateMatches = [...text.matchAll(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/g)].map((m) => `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`);
  if (dateMatches[0]) out.checkin = dateMatches[0];
  if (dateMatches[1]) out.checkout = dateMatches[1];
  const code = text.match(/(?:confirmation|booking\s?id|訂房代碼|確認碼)[:\s]*([A-Z0-9]{5,10})/i);
  if (code) out.bookingCode = code[1];
  const phone = text.match(/(\+?\d[\d\- ]{7,14}\d)/);
  if (phone) out.phone = phone[1];
  return out;
}

/* ===================== 畫面切換（首頁 / 旅遊內頁） ===================== */
function switchScreen(name) {
  $all(".screen").forEach((s) => s.classList.remove("active"));
  $(`#screen-${name}`).classList.add("active");
}
function goHome() {
  appState.screen = "home";
  appState.tripId = null;
  unsubscribeTripSync();
  switchScreen("home");
  renderHome();
}
function openTrip(id) {
  appState.screen = "trip";
  appState.tripId = id;
  phraseFilter = "全部";
  currentDayIdx = 0;
  itineraryMode = "full";
  logisticsSubTab = "flights";
  switchScreen("trip");
  switchView("days");
  renderTripHeader();
  renderDaysView();
  renderExpenses();
  renderPhrases();
  renderLogistics();
  renderSettings();
  const trip = currentTrip();
  if (trip.weatherCity && (!trip.weatherCache || Date.now() - trip.weatherCache.fetchedAt > 6 * 3600 * 1000)) fetchWeatherForTrip();
  if (trip.syncCode) subscribeTripSync(trip);
  else unsubscribeTripSync();
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
  JOURNAL.trips.slice().sort((a, b) => b.createdAt - a.createdAt).forEach((trip) => {
    const stopCount = trip.days.reduce((s, d) => s + d.stops.length, 0);
    const card = el(`
      <div class="trip-card-wrap">
        <button class="trip-card">
          <div class="trip-card__strip"></div>
          <div class="trip-card__body">
            <p class="trip-card__title">${trip.flag || "🌍"} ${escapeHtml(trip.title)}${trip.syncCode ? ` <span class="sync-badge">🔄 共編中</span>` : ""}</p>
            <p class="trip-card__meta">${escapeHtml(trip.country || "")} · ${trip.dayCount}天${Math.max(trip.dayCount - 1, 0)}夜 · ${escapeHtml(trip.transport || "")}${trip.dateRange ? " · " + escapeHtml(trip.dateRange) : ""}</p>
            <div class="trip-card__stats"><span>🛣️ ${stopCount} 個行程點</span></div>
          </div>
        </button>
        <button class="trip-card__menu" data-menu title="更多">⋯</button>
      </div>
    `);
    card.querySelector(".trip-card").addEventListener("click", () => openTrip(trip.id));
    card.querySelector("[data-menu]").addEventListener("click", (e) => { e.stopPropagation(); openTripActionSheet(trip); });
    list.appendChild(card);
  });
}

function openTripActionSheet(trip) {
  openModal(`
    <h3>${trip.flag || ""} ${escapeHtml(trip.title)}</h3>
    <div class="stack">
      <button class="btn btn--ghost btn--block" data-act="dup-full">⧉ 複製（含所有資料）</button>
      <button class="btn btn--ghost btn--block" data-act="dup-template">📋 複製為範本（清空行程與花費）</button>
      <button class="btn btn--ghost btn--block" data-act="export">📤 匯出成檔案</button>
    </div>
    <div class="modal-actions"><button class="btn btn--ghost" data-cancel>關閉</button></div>
  `, (root) => {
    root.querySelector('[data-act="dup-full"]').addEventListener("click", () => {
      const copy = duplicateTrip(trip, "full"); JOURNAL.trips.push(copy); saveJournal(); closeModal(); openTrip(copy.id);
    });
    root.querySelector('[data-act="dup-template"]').addEventListener("click", () => {
      const copy = duplicateTrip(trip, "template"); JOURNAL.trips.push(copy); saveJournal(); closeModal(); openTrip(copy.id);
    });
    root.querySelector('[data-act="export"]').addEventListener("click", () => { exportTrip(trip); closeModal(); });
  });
}

function exportTrip(trip) {
  const blob = new Blob([JSON.stringify(trip, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${trip.title.replace(/[\\/:*?"<>|]/g, "")}.tripjson.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function importTripFile() {
  const input = document.createElement("input");
  input.type = "file"; input.accept = "application/json,.json";
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const trip = normalizeImportedTrip(JSON.parse(reader.result));
        JOURNAL.trips.push(trip); saveJournal(); renderHome();
        alert(`已匯入「${trip.title}」`);
      } catch (e) { alert("匯入失敗，檔案格式不正確。請確認是從本手冊匯出的旅遊檔案。"); }
    };
    reader.readAsText(file);
  });
  input.click();
}
function normalizeImportedTrip(data) {
  const base = migrateV2Trip(data);
  regenerateIds(base);
  base.createdAt = Date.now();
  return base;
}

function countryOptionsHtml(selected) {
  const opts = COUNTRY_CURRENCY.map((c) => `<option value="${escapeHtml(c.country)}" ${c.country===selected?"selected":""}>${c.flag} ${escapeHtml(c.country)}（${c.code}）</option>`).join("");
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
    <div class="field"><label>出發日期（選填）</label><input id="f-start-date" type="date" /></div>
    <div class="field"><label>天數</label><input id="f-days" type="number" min="1" max="30" value="6" /></div>
    <p class="field-hint" style="margin-top:-8px;">填了出發日期，每天的行程日期會自動排好，不用再逐天設定。</p>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>建立並開始規劃</button>
    </div>
  `, (root) => {
    root.querySelector("#f-country").addEventListener("change", (e) => { root.querySelector("#f-custom-wrap").style.display = e.target.value === "__custom" ? "block" : "none"; });
    root.querySelector("[data-save]").addEventListener("click", () => {
      const title = root.querySelector("#f-title").value.trim();
      if (!title) return;
      const countryVal = root.querySelector("#f-country").value;
      let countryEntry;
      if (countryVal === "__custom") countryEntry = { ...CUSTOM_COUNTRY, code: root.querySelector("#f-cur-code").value.trim() || "", symbol: root.querySelector("#f-cur-symbol").value.trim() || "" };
      else countryEntry = findCountryEntry(countryVal) || CUSTOM_COUNTRY;
      const trip = newTrip({
        title, startDate: root.querySelector("#f-start-date").value,
        dayCount: root.querySelector("#f-days").value, countryEntry,
        transport: root.querySelector('input[name="transport"]:checked').value,
      });
      JOURNAL.trips.push(trip); saveJournal(); closeModal(); openTrip(trip.id);
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
  $("#tripTitle").onblur = () => { const t = currentTrip(); t.title = $("#tripTitle").textContent.trim() || "未命名旅遊"; saveJournal(); };
  $("#tripDateRange").onblur = () => {
    const t = currentTrip();
    const v = $("#tripDateRange").textContent.trim();
    t.dateRange = v === "點此設定日期" ? "" : v;
    saveJournal(); updateCountdown();
  };
  updateCountdown();
}
function updateCountdown() {
  const trip = currentTrip();
  const cd = $("#countdown");
  const match = (trip?.dateRange || "").match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!match) { cd.textContent = "設定日期看倒數"; return; }
  const target = new Date(+match[1], +match[2] - 1, +match[3]);
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((target - now) / 86400000);
  if (diff > 0) cd.textContent = `${diff} 天後出發`;
  else if (diff === 0) cd.textContent = "今天出發！";
  else cd.textContent = "旅途愉快 🎌";
}

/* ===================== Tab 切換（旅遊內頁） ===================== */
function initTabbar() { $all(".tabbar__btn").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view))); }
function switchView(name) {
  $all(".view").forEach((v) => v.classList.remove("active"));
  $(`#view-${name}`).classList.add("active");
  $all(".tabbar__btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
}

/* ===================== 每日行程（整合航班/住宿/交通 + 拖曳排序 + 標籤）===================== */
let currentDayIdx = 0;
let daySortableInstance = null;
let itineraryMode = "full";

function renderDaysView() {
  const modeBar = $("#itineraryModeBar");
  modeBar.innerHTML = "";
  [["full", "📋 整合總覽"], ["daily", "✏️ 單日編輯"]].forEach(([mode, label]) => {
    const chip = el(`<button class="chip ${itineraryMode===mode?"active":""}">${label}</button>`);
    chip.addEventListener("click", () => { itineraryMode = mode; renderDaysView(); });
    modeBar.appendChild(chip);
  });
  if (itineraryMode === "daily") { $("#dayTabs").style.display = ""; renderSingleDay(); }
  else { $("#dayTabs").style.display = "none"; renderFullItinerary(); }
}

function renderSingleDay() {
  const trip = currentTrip();
  if (!trip) return;
  const tabWrap = $("#dayTabs");
  tabWrap.innerHTML = "";
  trip.days.forEach((d, i) => {
    const btn = el(`<button class="day-tab ${i===currentDayIdx?"active":""}">${escapeHtml(d.label)}</button>`);
    btn.addEventListener("click", () => { currentDayIdx = i; renderSingleDay(); });
    tabWrap.appendChild(btn);
  });

  const day = trip.days[currentDayIdx];
  const road = $("#dayRoad");
  if (daySortableInstance) { daySortableInstance.destroy(); daySortableInstance = null; }
  road.innerHTML = "";
  if (!day) { road.appendChild(el(`<div class="road-empty">這趟旅遊還沒有天數，請到⚙️設定新增。</div>`)); return; }

  const editRow = el(`
    <div class="day-editable-row">
      <input id="dayLabel" value="${escapeHtml(day.label)}" placeholder="Day 1" />
      <span class="day-date-badge">${day.date ? formatDateDisplay(day.date) : "未設定日期"}</span>
    </div>
  `);
  editRow.querySelector("#dayLabel").addEventListener("change", (e) => { day.label = e.target.value || day.label; saveJournal(); renderSingleDay(); });
  road.appendChild(editRow);

  const roadInner = el(`<div class="road"></div>`);
  if (!day.stops.length) {
    roadInner.classList.remove("road");
    roadInner.appendChild(el(`<div class="road-empty">這天還沒有安排行程，點下方「＋ 新增行程點」開始規劃路線 🛣️</div>`));
  } else {
    day.stops.forEach((stop, idx) => {
      if (idx > 0 && stop.drive) roadInner.appendChild(el(`<div class="drive-chip">🚗 車程約 ${escapeHtml(stop.drive)}</div>`));
      const tagPills = (stop.tags || []).map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join("");
      const card = el(`
        <div class="road-stop" data-stop-id="${stop.id}">
          <div class="card">
            <div class="stop-drag-row">
              <span class="drag-handle" title="拖曳排序">⠿</span>
              ${stop.time ? `<span class="stop-time">${escapeHtml(stop.time)}</span>` : ""}
            </div>
            <p class="stop-name">${escapeHtml(stop.name)}</p>
            ${tagPills ? `<div class="tag-pill-row">${tagPills}</div>` : ""}
            ${stop.address ? `<p class="stop-note">${escapeHtml(stop.address)}</p>` : ""}
            ${stop.note ? `<p class="stop-note">${escapeHtml(stop.note)}</p>` : ""}
            <div class="spot-card__actions" style="margin-top:8px;">
              <a class="map-link" target="_blank" rel="noopener" href="${mapUrlForPlace(stop.name, stop.placeId)}">在地圖開啟 ↗</a>
              <button class="btn btn--danger" data-del>刪除</button>
            </div>
          </div>
        </div>
      `);
      card.querySelector("[data-del]").addEventListener("click", () => { day.stops = day.stops.filter((x) => x.id !== stop.id); saveJournal(); renderSingleDay(); });
      roadInner.appendChild(card);
    });
  }
  road.appendChild(roadInner);

  if (day.stops.length > 1 && window.Sortable) {
    daySortableInstance = new window.Sortable(roadInner, { handle: ".drag-handle", animation: 150, onEnd: () => syncStopOrderFromDOM(day, roadInner) });
  }

  const addBtn = el(`<button class="btn btn--ghost">＋ 新增行程點</button>`);
  addBtn.addEventListener("click", () => openStopForm(day));
  road.appendChild(addBtn);
}

function dayEventsFor(trip, day) {
  if (!day.date) return [];
  const events = [];
  trip.flights.forEach((f) => { if (f.date === day.date) events.push({ time: f.depTime || "", html: `✈️ <b>${escapeHtml(f.direction)}</b>　${escapeHtml(f.airline||"")} ${escapeHtml(f.flightNo||"")}　${escapeHtml(f.depAirport||"")} ${escapeHtml(f.depTime||"")} → ${escapeHtml(f.arrAirport||"")} ${escapeHtml(f.arrTime||"")}` }); });
  trip.lodging.forEach((l) => {
    if (l.checkin === day.date) events.push({ time: "", html: `🏨 <b>入住</b>　${escapeHtml(l.name)}` });
    if (l.checkout === day.date) events.push({ time: "", html: `🏨 <b>退房</b>　${escapeHtml(l.name)}` });
  });
  trip.transportItems.forEach((t) => { if (t.date === day.date) events.push({ time: t.depTime || "", html: `${escapeHtml(t.type)}　${escapeHtml(t.title||"")}　${escapeHtml(t.from||"")} ${escapeHtml(t.depTime||"")} → ${escapeHtml(t.to||"")} ${escapeHtml(t.arrTime||"")}` }); });
  return events.sort((a, b) => (a.time||"").localeCompare(b.time||""));
}

function renderFullItinerary() {
  const trip = currentTrip();
  if (!trip) return;
  const road = $("#dayRoad");
  if (daySortableInstance) { daySortableInstance.destroy(); daySortableInstance = null; }
  road.innerHTML = "";

  const undatedFlights = trip.flights.filter((f) => !f.date);
  if (undatedFlights.length) {
    const box = el(`<div class="card full-flight-card"></div>`);
    undatedFlights.forEach((f) => box.appendChild(el(`<p style="margin:4px 0;">✈️ <b>${escapeHtml(f.direction)}</b>　${escapeHtml(f.airline||"")} ${escapeHtml(f.flightNo||"")}　${escapeHtml(f.depAirport||"")} ${escapeHtml(f.depTime||"")} → ${escapeHtml(f.arrAirport||"")} ${escapeHtml(f.arrTime||"")}</p>`)));
    road.appendChild(el(`<p class="full-day-header" style="margin-top:0;">未指定日期的航班</p>`));
    road.appendChild(box);
  }

  trip.days.forEach((day) => {
    const section = el(`<div class="full-day-section"></div>`);
    const weather = weatherForDate(trip, day.date);
    const weatherHtml = weather ? `<span class="weather-badge">${weatherIconFor(weather.code)} ${Math.round(weather.tmax)}°/${Math.round(weather.tmin)}°</span>` : "";
    section.appendChild(el(`<div class="full-day-header">${escapeHtml(day.label)}${day.date ? " · " + formatDateDisplay(day.date) : ""} ${weatherHtml}</div>`));

    const events = dayEventsFor(trip, day);
    if (events.length) {
      const evBox = el(`<div class="card day-events-card"></div>`);
      events.forEach((ev) => evBox.appendChild(el(`<p style="margin:4px 0;font-size:13px;">${ev.time ? `<span class="stop-time" style="margin-right:6px;">${escapeHtml(ev.time)}</span>` : ""}${ev.html}</p>`)));
      section.appendChild(evBox);
    }

    if (!day.stops.length) {
      section.appendChild(el(`<div class="empty-hint" style="padding:14px;">（尚未安排景點行程）</div>`));
    } else {
      const inner = el(`<div class="road"></div>`);
      day.stops.forEach((stop, idx) => {
        if (idx > 0 && stop.drive) inner.appendChild(el(`<div class="drive-chip">🚗 車程約 ${escapeHtml(stop.drive)}</div>`));
        const tagPills = (stop.tags || []).map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join("");
        inner.appendChild(el(`
          <div class="road-stop">
            <div class="card">
              ${stop.time ? `<span class="stop-time">${escapeHtml(stop.time)}</span>` : ""}
              <p class="stop-name">${escapeHtml(stop.name)}</p>
              ${tagPills ? `<div class="tag-pill-row">${tagPills}</div>` : ""}
              ${stop.note ? `<p class="stop-note">${escapeHtml(stop.note)}</p>` : ""}
            </div>
          </div>
        `));
      });
      section.appendChild(inner);
    }
    if (day.journal) section.appendChild(el(`<div class="card journal-recap"><p style="font-weight:700;font-size:12px;margin:0 0 4px;color:var(--ink-soft);">📝 心得</p><p style="font-size:13px;margin:0;white-space:pre-wrap;">${escapeHtml(day.journal)}</p></div>`));
    road.appendChild(section);
  });

  if (!trip.weatherCity) road.appendChild(el(`<div class="empty-hint">想在這裡看到每天的天氣預報嗎？到 ⚙️ 設定填入查詢城市即可。</div>`));
}

function syncStopOrderFromDOM(day, container) {
  const ids = $all(".road-stop", container).map((n) => n.dataset.stopId);
  const map = new Map(day.stops.map((s) => [s.id, s]));
  const reordered = ids.map((id) => map.get(id)).filter(Boolean);
  if (reordered.length === day.stops.length) { day.stops = reordered; saveJournal(); renderSingleDay(); }
}

function openStopForm(day) {
  let placeData = null;
  const tagChecks = STOP_TAGS.map((t) => `<label class="tag-check"><input type="checkbox" value="${t}" /><span>${t}</span></label>`).join("");
  openModal(`
    <h3>新增行程點 — ${escapeHtml(day.label)}</h3>
    <div class="field"><label>時間（選填，僅顯示用）</label><input id="f-time" placeholder="例如 09:30" /></div>
    <div class="field">
      <label>地點名稱</label>
      <input id="f-name" placeholder="例如：新穗高纜車" autocomplete="off" />
      <p class="field-hint" id="place-hint"></p>
    </div>
    <div class="field"><label>標籤（可複選，選填）</label><div class="tag-check-row">${tagChecks}</div></div>
    <div class="field"><label>與前一站的車程（選填）</label><input id="f-drive" placeholder="例如 45分" /></div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="營業時間、門票、注意事項..."></textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    const nameInput = root.querySelector("#f-name");
    if (getApiKey()) {
      root.querySelector("#place-hint").textContent = "輸入關鍵字可搜尋真實地標";
      tryAttachPlacesAutocomplete(nameInput, (place) => {
        placeData = { placeId: place.place_id, address: place.formatted_address || "" };
        nameInput.value = place.name || nameInput.value;
        { const ph = root.querySelector("#place-hint"); ph.textContent = "✓ 已鎖定地標：" + (place.formatted_address || ""); ph.classList.add("field-hint--ok"); }
      });
    } else {
      root.querySelector("#place-hint").textContent = "💡 想用 Google 地圖搜尋真實地標嗎？回首頁點右上角 🔑 設定金鑰即可啟用";
    }
    root.querySelector("[data-save]").addEventListener("click", () => {
      const name = nameInput.value.trim();
      if (!name) return;
      const tags = $all('.tag-check input[type="checkbox"]:checked', root).map((cb) => cb.value);
      day.stops.push({
        id: uid(), time: root.querySelector("#f-time").value.trim(), name, tags,
        drive: root.querySelector("#f-drive").value.trim(), note: root.querySelector("#f-note").value.trim(),
        placeId: placeData?.placeId || null, address: placeData?.address || "",
      });
      saveJournal(); renderDaysView(); closeModal();
    });
  });
}

/* ===================== 記帳（含預算 + 分帳結算） ===================== */
function iconFor(cat) { return (EXPENSE_CATS.find((c) => c.key === cat) || {}).icon || "🧾"; }
function budgetBarHtml(spent, budget, label) {
  if (budget == null || budget <= 0) return "";
  const pct = Math.min(spent / budget, 1);
  const over = spent > budget;
  const cls = over ? "over" : pct >= 0.8 ? "warn" : "ok";
  return `<div class="budget-row"><div class="budget-row__labels"><span>${escapeHtml(label)}</span><span class="${over?"budget-over-text":""}">${spent.toLocaleString()} / ${budget.toLocaleString()}</span></div><div class="budget-bar"><div class="budget-bar__fill ${cls}" style="width:${pct*100}%;"></div></div></div>`;
}
function memberName(trip, id) { return (trip.members.find((m) => m.id === id) || {}).name || "未指定"; }

function calculateSettlement(trip) {
  const members = trip.members;
  if (members.length < 2) return null;
  const paid = {}, owed = {};
  members.forEach((m) => { paid[m.id] = 0; owed[m.id] = 0; });
  trip.expenses.forEach((e) => {
    const amount = Number(e.amount || 0);
    if (e.payerId && paid[e.payerId] !== undefined) paid[e.payerId] += amount;
    const splitWith = (e.splitWith && e.splitWith.length ? e.splitWith : members.map((m) => m.id)).filter((id) => owed[id] !== undefined);
    if (!splitWith.length) return;
    const share = amount / splitWith.length;
    splitWith.forEach((id) => { owed[id] += share; });
  });
  const balances = members.map((m) => ({ id: m.id, name: m.name, paid: paid[m.id], owed: owed[m.id], balance: paid[m.id] - owed[m.id] }));

  const creditors = balances.filter((b) => b.balance > 0.5).map((b) => ({ ...b })).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter((b) => b.balance < -0.5).map((b) => ({ ...b, balance: -b.balance })).sort((a, b) => b.balance - a.balance);
  const transfers = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].balance, creditors[j].balance);
    if (pay > 0.5) transfers.push({ from: debtors[i].name, to: creditors[j].name, amount: Math.round(pay) });
    debtors[i].balance -= pay; creditors[j].balance -= pay;
    if (debtors[i].balance <= 0.5) i++;
    if (creditors[j].balance <= 0.5) j++;
  }
  return { balances, transfers };
}

function renderMembers() {
  const trip = currentTrip();
  if (!trip) return;
  const wrap = $("#membersSection");
  wrap.innerHTML = "";
  const card = el(`<div class="card members-card"></div>`);
  card.appendChild(el(`<p class="members-card__title">👥 分帳成員${trip.members.length ? `（${trip.members.length}人）` : ""}</p>`));
  const chipRow = el(`<div class="chip-row" style="margin-bottom:0;"></div>`);
  trip.members.forEach((m) => {
    const chip = el(`<span class="member-chip">${escapeHtml(m.name)}<button class="member-chip__del" data-del="${m.id}">✕</button></span>`);
    chip.querySelector("[data-del]").addEventListener("click", () => {
      trip.members = trip.members.filter((x) => x.id !== m.id);
      trip.expenses.forEach((e) => {
        if (e.payerId === m.id) e.payerId = null;
        if (e.splitWith) e.splitWith = e.splitWith.filter((id) => id !== m.id);
      });
      saveJournal(); renderExpenses();
    });
    chipRow.appendChild(chip);
  });
  const addChip = el(`<button class="chip">＋ 新增成員</button>`);
  addChip.addEventListener("click", openAddMemberForm);
  chipRow.appendChild(addChip);
  card.appendChild(chipRow);
  if (!trip.members.length) card.appendChild(el(`<p class="field-hint" style="margin-top:8px;">新增至少 2 位成員，就能在花費裡標記「誰付的」「算誰的」，最後自動幫你算出誰要付給誰多少錢。</p>`));
  wrap.appendChild(card);
}

function openAddMemberForm() {
  const trip = currentTrip();
  openModal(`
    <h3>新增成員</h3>
    <div class="field"><label>名稱</label><input id="f-name" placeholder="例如：小明" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>新增</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const name = root.querySelector("#f-name").value.trim();
      if (!name) return;
      trip.members.push({ id: uid(), name });
      saveJournal(); renderExpenses(); closeModal();
    });
  });
}

function renderSettlement() {
  const trip = currentTrip();
  if (!trip) return;
  const wrap = $("#settlementSection");
  wrap.innerHTML = "";
  const result = calculateSettlement(trip);
  if (!result) return;
  const symbol = trip.currency.symbol || "";
  const card = el(`<div class="card settlement-card"></div>`);
  card.appendChild(el(`<p class="members-card__title">💵 分帳結算</p>`));
  result.balances.forEach((b) => {
    const sign = b.balance > 0.5 ? "should-receive" : b.balance < -0.5 ? "should-pay" : "even";
    const text = b.balance > 0.5 ? `應收回 ${symbol}${Math.round(b.balance).toLocaleString()}` : b.balance < -0.5 ? `應付出 ${symbol}${Math.round(-b.balance).toLocaleString()}` : "已結清";
    card.appendChild(el(`
      <div class="settlement-row">
        <span class="settlement-row__name">${escapeHtml(b.name)}</span>
        <span class="settlement-row__meta">付了 ${symbol}${Math.round(b.paid).toLocaleString()}　分攤 ${symbol}${Math.round(b.owed).toLocaleString()}</span>
        <span class="settlement-row__balance ${sign}">${text}</span>
      </div>
    `));
  });
  if (result.transfers.length) {
    card.appendChild(el(`<div class="settlement-divider"></div>`));
    card.appendChild(el(`<p class="settlement-suggest-title">建議轉帳</p>`));
    result.transfers.forEach((t) => {
      card.appendChild(el(`<p class="settlement-transfer">👉 <b>${escapeHtml(t.from)}</b> 要付給 <b>${escapeHtml(t.to)}</b>　<span class="settlement-transfer__amount">${symbol}${t.amount.toLocaleString()}</span></p>`));
    });
  } else {
    card.appendChild(el(`<p class="field-hint" style="margin-top:8px;">目前帳務已平衡，不用互轉。</p>`));
  }
  wrap.appendChild(card);
}

function renderExpenses() {
  const trip = currentTrip();
  if (!trip) return;
  $("#exRate").value = trip.exRate;
  $("#rateFromCode").textContent = trip.currency.code || trip.currency.name || "當地貨幣";
  const symbol = trip.currency.symbol || "";
  const total = trip.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  $("#totalJPY").textContent = symbol + total.toLocaleString();
  $("#totalTWD").textContent = "NT$" + Math.round(total * trip.exRate).toLocaleString();

  const budgetWrap = $("#budgetSection");
  budgetWrap.innerHTML = "";
  const budget = trip.budget || emptyBudget();
  let budgetHtml = "";
  if (budget.total) budgetHtml += budgetBarHtml(total, budget.total, `總預算（${symbol}）`);
  EXPENSE_CATS.forEach((c) => {
    const limit = budget.byCategory && budget.byCategory[c.key];
    if (!limit) return;
    const spent = trip.expenses.filter((e) => e.category === c.key).reduce((s, e) => s + Number(e.amount || 0), 0);
    budgetHtml += budgetBarHtml(spent, limit, `${c.icon} ${c.key}`);
  });
  if (budgetHtml) budgetWrap.appendChild(el(`<div class="card budget-card">${budgetHtml}</div>`));
  else budgetWrap.appendChild(el(`<div class="empty-hint">還沒有設定預算，可以到 ⚙️ 設定頁設定總預算或分類預算，這裡會顯示花費進度。</div>`));

  renderMembers();
  renderSettlement();

  const byCat = $("#expenseByCategory");
  byCat.innerHTML = "";
  EXPENSE_CATS.forEach((c) => {
    const sum = trip.expenses.filter((e) => e.category === c.key).reduce((s, e) => s + Number(e.amount || 0), 0);
    if (sum > 0) byCat.appendChild(el(`<div class="chip static">${c.icon} ${c.key} ${symbol}${sum.toLocaleString()}</div>`));
  });

  const list = $("#expenseList");
  list.innerHTML = "";
  if (!trip.expenses.length) { list.appendChild(el(`<div class="empty-hint">還沒有花費紀錄，出發後隨手記一下吧！</div>`)); return; }
  trip.expenses.slice().reverse().forEach((e) => {
    const payerText = e.payerId ? `由 ${escapeHtml(memberName(trip, e.payerId))} 付款` : "";
    const splitText = e.splitWith && e.splitWith.length ? `均分：${e.splitWith.map((id) => escapeHtml(memberName(trip, id))).join("、")}` : "";
    const row = el(`
      <div class="card expense-row">
        <div class="expense-row__icon">${iconFor(e.category)}</div>
        <div class="expense-row__body">
          <div class="expense-row__title">${escapeHtml(e.title || e.category)}</div>
          <div class="expense-row__meta">${escapeHtml(e.category)}${e.note ? " · " + escapeHtml(e.note) : ""}</div>
          ${payerText || splitText ? `<div class="expense-row__split">${payerText}${payerText && splitText ? " · " : ""}${splitText}</div>` : ""}
        </div>
        <div class="expense-row__amount">${symbol}${Number(e.amount).toLocaleString()}</div>
        <button class="btn btn--danger" data-del>刪</button>
      </div>
    `);
    row.querySelector("[data-del]").addEventListener("click", () => { trip.expenses = trip.expenses.filter((x) => x.id !== e.id); saveJournal(); renderExpenses(); });
    list.appendChild(row);
  });
}
function openExpenseForm() {
  const trip = currentTrip();
  const catOpts = EXPENSE_CATS.map((c) => `<option value="${c.key}">${c.icon} ${c.key}</option>`).join("");
  const hasMembers = trip.members.length > 0;
  const payerOpts = trip.members.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
  const splitChecks = trip.members.map((m) => `<label class="tag-check"><input type="checkbox" value="${m.id}" checked /><span>${escapeHtml(m.name)}</span></label>`).join("");
  openModal(`
    <h3>新增花費</h3>
    <div class="field"><label>金額（${escapeHtml(trip.currency.name || "當地貨幣")}）</label><input id="f-amount" type="number" placeholder="0" /></div>
    <div class="field"><label>類別</label><select id="f-cat">${catOpts}</select></div>
    <div class="field"><label>項目名稱</label><input id="f-title" placeholder="例如：拉麵晚餐" /></div>
    ${hasMembers ? `
    <div class="field"><label>誰付的錢</label><select id="f-payer"><option value="">未指定</option>${payerOpts}</select></div>
    <div class="field"><label>算誰的份（可複選，預設全部）</label><div class="tag-check-row">${splitChecks}</div></div>
    ` : `<p class="field-hint">到下方「👥 分帳成員」新增旅伴，就能標記這筆是誰付的、要算誰的份。</p>`}
    <div class="field"><label>備註</label><input id="f-note" placeholder="選填" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const amount = Number(root.querySelector("#f-amount").value);
      if (!amount) return;
      const payerId = hasMembers ? (root.querySelector("#f-payer").value || null) : null;
      const splitWith = hasMembers ? $all('.tag-check input[type="checkbox"]:checked', root).map((cb) => cb.value) : [];
      trip.expenses.push({
        id: uid(), amount, category: root.querySelector("#f-cat").value, title: root.querySelector("#f-title").value.trim(),
        note: root.querySelector("#f-note").value.trim(), payerId, splitWith,
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
    saveJournal(); renderExpenses();
    status.textContent = `已更新：1 ${code} ≈ ${twd.toFixed(4)} TWD（${new Date().toLocaleDateString("zh-TW")}）`;
  } catch (err) { status.textContent = "查詢失敗，請確認網路連線，或手動輸入匯率。"; }
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
  if (!baseFiltered.length && !custom.length) { list.appendChild(el(`<div class="empty-hint">這個分類還沒有例句，點下方「＋ 新增自訂例句」加一句吧！</div>`)); return; }
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
  if (deletable) node.querySelector("[data-del]").addEventListener("click", () => { trip.customPhrases = trip.customPhrases.filter((x) => x.id !== p.id); saveJournal(); renderPhrases(); });
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
      trip.customPhrases.push({ id: uid(), cat: "我的例句", jp, reading: root.querySelector("#f-reading").value.trim(), zh: root.querySelector("#f-zh").value.trim() });
      saveJournal(); renderPhrases(); closeModal();
    });
  });
}

/* ===================== 出發前（航班／住宿／其他交通／準備） ===================== */
let logisticsSubTab = "flights";
function renderLogistics() {
  const trip = currentTrip();
  if (!trip) return;
  const subTabs = $("#logisticsSubTabs");
  subTabs.innerHTML = "";
  [["flights","✈️ 航班"], ["lodging","🏨 住宿"], ["transport","🚌 交通"], ["packing","🧳 準備"]].forEach(([key,label]) => {
    const btn = el(`<button class="day-tab ${logisticsSubTab===key?"active":""}">${label}</button>`);
    btn.addEventListener("click", () => { logisticsSubTab = key; renderLogistics(); });
    subTabs.appendChild(btn);
  });

  const content = $("#logisticsContent");
  content.innerHTML = "";

  if (logisticsSubTab === "flights") {
    if (!trip.flights.length) content.appendChild(el(`<div class="empty-hint">還沒有航班資訊，點下方新增去程／回程航班。</div>`));
    trip.flights.forEach((f) => {
      const card = el(`
        <div class="card logistics-card">
          <div class="logistics-card__head"><span class="logistics-tag">${escapeHtml(f.direction)}</span><span>${escapeHtml(f.airline||"")} ${escapeHtml(f.flightNo||"")}</span></div>
          ${f.date ? `<p class="logistics-meta">📅 ${formatDateDisplay(f.date)}</p>` : ""}
          <p class="logistics-route">${escapeHtml(f.depAirport||"?")} <span class="logistics-time">${escapeHtml(f.depTime||"")}</span> → ${escapeHtml(f.arrAirport||"?")} <span class="logistics-time">${escapeHtml(f.arrTime||"")}</span></p>
          ${f.bookingCode ? `<p class="logistics-meta">訂位代碼：${escapeHtml(f.bookingCode)}</p>` : ""}
          ${f.note ? `<p class="logistics-meta">${escapeHtml(f.note)}</p>` : ""}
          <button class="btn btn--danger" data-del>刪除</button>
        </div>
      `);
      card.querySelector("[data-del]").addEventListener("click", () => { trip.flights = trip.flights.filter((x)=>x.id!==f.id); saveJournal(); renderLogistics(); renderDaysView(); });
      content.appendChild(card);
    });
    const addBtn = el(`<button class="btn btn--ghost">＋ 新增航班</button>`);
    addBtn.addEventListener("click", openFlightForm);
    content.appendChild(addBtn);
  }

  if (logisticsSubTab === "lodging") {
    if (!trip.lodging.length) content.appendChild(el(`<div class="empty-hint">還沒有住宿資訊，點下方新增飯店/民宿。</div>`));
    trip.lodging.forEach((l) => {
      const card = el(`
        <div class="card logistics-card">
          <p class="logistics-route" style="font-weight:700;">${escapeHtml(l.name)}</p>
          ${l.address ? `<p class="logistics-meta">${escapeHtml(l.address)}</p>` : ""}
          ${l.checkin || l.checkout ? `<p class="logistics-meta">📅 ${formatDateDisplay(l.checkin)||""} → ${formatDateDisplay(l.checkout)||""}</p>` : ""}
          ${l.bookingCode ? `<p class="logistics-meta">訂房代碼：${escapeHtml(l.bookingCode)}</p>` : ""}
          ${l.phone ? `<p class="logistics-meta">☎ ${escapeHtml(l.phone)}</p>` : ""}
          ${l.note ? `<p class="logistics-meta">${escapeHtml(l.note)}</p>` : ""}
          <div class="spot-card__actions" style="margin-top:6px;">
            <a class="map-link" target="_blank" rel="noopener" href="${mapUrlForPlace(l.name, l.placeId)}">在地圖開啟 ↗</a>
            <button class="btn btn--danger" data-del>刪除</button>
          </div>
        </div>
      `);
      card.querySelector("[data-del]").addEventListener("click", () => { trip.lodging = trip.lodging.filter((x)=>x.id!==l.id); saveJournal(); renderLogistics(); renderDaysView(); });
      content.appendChild(card);
    });
    const addBtn = el(`<button class="btn btn--ghost">＋ 新增住宿</button>`);
    addBtn.addEventListener("click", openLodgingForm);
    content.appendChild(addBtn);
  }

  if (logisticsSubTab === "transport") {
    if (!trip.transportItems.length) content.appendChild(el(`<div class="empty-hint">還沒有其他交通資訊，例如租車、火車、新幹線、公車等都可以加在這裡。</div>`));
    trip.transportItems.forEach((t) => {
      const card = el(`
        <div class="card logistics-card">
          <div class="logistics-card__head"><span class="logistics-tag">${escapeHtml(t.type)}</span><span>${escapeHtml(t.title||"")}</span></div>
          ${t.date ? `<p class="logistics-meta">📅 ${formatDateDisplay(t.date)}</p>` : ""}
          ${t.from || t.to ? `<p class="logistics-route">${escapeHtml(t.from||"?")} <span class="logistics-time">${escapeHtml(t.depTime||"")}</span> → ${escapeHtml(t.to||"?")} <span class="logistics-time">${escapeHtml(t.arrTime||"")}</span></p>` : ""}
          ${t.bookingCode ? `<p class="logistics-meta">確認碼：${escapeHtml(t.bookingCode)}</p>` : ""}
          ${t.note ? `<p class="logistics-meta">${escapeHtml(t.note)}</p>` : ""}
          <button class="btn btn--danger" data-del>刪除</button>
        </div>
      `);
      card.querySelector("[data-del]").addEventListener("click", () => { trip.transportItems = trip.transportItems.filter((x)=>x.id!==t.id); saveJournal(); renderLogistics(); renderDaysView(); });
      content.appendChild(card);
    });
    const addBtn = el(`<button class="btn btn--ghost">＋ 新增交通</button>`);
    addBtn.addEventListener("click", openTransportForm);
    content.appendChild(addBtn);
  }

  if (logisticsSubTab === "packing") {
    const wrap = el(`<div></div>`);
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
        row.querySelector('input[type="checkbox"]').addEventListener("change", (e) => { item.done = e.target.checked; saveJournal(); renderLogistics(); });
        row.querySelector("[data-del]").addEventListener("click", (e) => { e.preventDefault(); group.items = group.items.filter((x) => x.id !== item.id); saveJournal(); renderLogistics(); });
        wrap.appendChild(row);
      });
    });
    content.appendChild(el(`<div class="view-head" style="margin-bottom:10px;"><span style="font-size:13px;font-weight:700;color:var(--ink-soft);">準備進度</span><span class="progress-pill">${done}/${total}</span></div>`));
    content.appendChild(wrap);
    const addBtn = el(`<button class="btn btn--ghost">＋ 新增準備項目</button>`);
    addBtn.addEventListener("click", openPackingForm);
    content.appendChild(addBtn);
  }
}

function smartPasteBlockHtml() {
  return `
    <div class="field smart-paste">
      <label>📋 貼上確認信自動辨識（測試版，請務必核對後再送出）</label>
      <textarea id="f-paste" placeholder="把訂票網站寄來的確認信內容貼在這裡..."></textarea>
      <button type="button" class="btn btn--small btn--outline" id="f-parse-btn" style="margin-top:6px;">自動帶入欄位</button>
    </div>
  `;
}

function openFlightForm() {
  const trip = currentTrip();
  const dirOpts = FLIGHT_DIRECTIONS.map((d) => `<option value="${d}">${d}</option>`).join("");
  openModal(`
    <h3>新增航班</h3>
    ${smartPasteBlockHtml()}
    <div class="field"><label>類型</label><select id="f-dir">${dirOpts}</select></div>
    <div class="field"><label>航空公司</label><input id="f-airline" placeholder="例如：長榮航空" /></div>
    <div class="field"><label>航班編號</label><input id="f-no" placeholder="例如：BR198" /></div>
    <div class="field"><label>日期</label><input id="f-date" type="date" /></div>
    <div class="settings-row">
      <div class="field"><label>出發機場</label><input id="f-dep-ap" placeholder="TPE" /></div>
      <div class="field"><label>出發時間</label><input id="f-dep-time" placeholder="07:20" /></div>
    </div>
    <div class="settings-row">
      <div class="field"><label>抵達機場</label><input id="f-arr-ap" placeholder="NRT" /></div>
      <div class="field"><label>抵達時間</label><input id="f-arr-time" placeholder="11:10" /></div>
    </div>
    <div class="field"><label>訂位代碼（選填）</label><input id="f-code" placeholder="PNR" /></div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="選填"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("#f-parse-btn").addEventListener("click", () => {
      const parsed = parseFlightText(root.querySelector("#f-paste").value);
      if (parsed.airline) root.querySelector("#f-airline").value = parsed.airline;
      if (parsed.flightNo) root.querySelector("#f-no").value = parsed.flightNo;
      if (parsed.depAirport) root.querySelector("#f-dep-ap").value = parsed.depAirport;
      if (parsed.arrAirport) root.querySelector("#f-arr-ap").value = parsed.arrAirport;
      if (parsed.depTime) root.querySelector("#f-dep-time").value = parsed.depTime;
      if (parsed.arrTime) root.querySelector("#f-arr-time").value = parsed.arrTime;
      if (parsed.date) root.querySelector("#f-date").value = parsed.date;
      if (parsed.bookingCode) root.querySelector("#f-code").value = parsed.bookingCode;
    });
    root.querySelector("[data-save]").addEventListener("click", () => {
      trip.flights.push({
        id: uid(), direction: root.querySelector("#f-dir").value, airline: root.querySelector("#f-airline").value.trim(),
        flightNo: root.querySelector("#f-no").value.trim(), date: root.querySelector("#f-date").value,
        depAirport: root.querySelector("#f-dep-ap").value.trim(), depTime: root.querySelector("#f-dep-time").value.trim(),
        arrAirport: root.querySelector("#f-arr-ap").value.trim(), arrTime: root.querySelector("#f-arr-time").value.trim(),
        bookingCode: root.querySelector("#f-code").value.trim(), note: root.querySelector("#f-note").value.trim(),
      });
      saveJournal(); renderLogistics(); renderDaysView(); closeModal();
    });
  });
}

function openLodgingForm() {
  const trip = currentTrip();
  let placeData = null;
  openModal(`
    <h3>新增住宿</h3>
    ${smartPasteBlockHtml()}
    <div class="field">
      <label>名稱</label>
      <input id="f-name" placeholder="例如：大阪希爾頓飯店" autocomplete="off" />
      <p class="field-hint" id="place-hint"></p>
    </div>
    <div class="field"><label>地址（選填，若用搜尋會自動帶入）</label><input id="f-addr" placeholder="地址" /></div>
    <div class="field"><label>入住日期</label><input id="f-in" type="date" /></div>
    <div class="field"><label>退房日期</label><input id="f-out" type="date" /></div>
    <div class="field"><label>訂房代碼（選填）</label><input id="f-code" placeholder="訂房確認碼" /></div>
    <div class="field"><label>電話（選填）</label><input id="f-phone" placeholder="選填" /></div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="選填"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    const nameInput = root.querySelector("#f-name");
    const addrInput = root.querySelector("#f-addr");
    if (getApiKey()) {
      root.querySelector("#place-hint").textContent = "輸入關鍵字可搜尋真實地標";
      tryAttachPlacesAutocomplete(nameInput, (place) => {
        placeData = { placeId: place.place_id, address: place.formatted_address || "" };
        nameInput.value = place.name || nameInput.value;
        addrInput.value = place.formatted_address || addrInput.value;
        { const ph = root.querySelector("#place-hint"); ph.textContent = "✓ 已鎖定地標"; ph.classList.add("field-hint--ok"); }
      });
    }
    root.querySelector("#f-parse-btn").addEventListener("click", () => {
      const parsed = parseLodgingText(root.querySelector("#f-paste").value);
      if (parsed.name) nameInput.value = parsed.name;
      if (parsed.checkin) root.querySelector("#f-in").value = parsed.checkin;
      if (parsed.checkout) root.querySelector("#f-out").value = parsed.checkout;
      if (parsed.bookingCode) root.querySelector("#f-code").value = parsed.bookingCode;
      if (parsed.phone) root.querySelector("#f-phone").value = parsed.phone;
    });
    root.querySelector("[data-save]").addEventListener("click", () => {
      const name = nameInput.value.trim();
      if (!name) return;
      trip.lodging.push({
        id: uid(), name, address: addrInput.value.trim() || placeData?.address || "", placeId: placeData?.placeId || null,
        checkin: root.querySelector("#f-in").value, checkout: root.querySelector("#f-out").value,
        bookingCode: root.querySelector("#f-code").value.trim(), phone: root.querySelector("#f-phone").value.trim(),
        note: root.querySelector("#f-note").value.trim(),
      });
      saveJournal(); renderLogistics(); renderDaysView(); closeModal();
    });
  });
}

function openTransportForm() {
  const trip = currentTrip();
  const typeOpts = TRANSPORT_TYPES.map((t) => `<option value="${t}">${t}</option>`).join("");
  openModal(`
    <h3>新增交通資訊</h3>
    <div class="field"><label>類型</label><select id="f-type">${typeOpts}</select></div>
    <div class="field"><label>名稱／班次（選填）</label><input id="f-title" placeholder="例如：Nagoya Rent-a-Car / 新幹線 のぞみ 123 號" /></div>
    <div class="field"><label>日期（選填，填了會顯示在整合行程表當天）</label><input id="f-date" type="date" /></div>
    <div class="settings-row">
      <div class="field"><label>出發地</label><input id="f-from" placeholder="例如：名古屋站" autocomplete="off" /></div>
      <div class="field"><label>出發時間</label><input id="f-dep-time" placeholder="09:00" /></div>
    </div>
    <div class="settings-row">
      <div class="field"><label>抵達地</label><input id="f-to" placeholder="例如：高山站" autocomplete="off" /></div>
      <div class="field"><label>抵達時間</label><input id="f-arr-time" placeholder="11:30" /></div>
    </div>
    <div class="field"><label>確認碼（選填）</label><input id="f-code" placeholder="訂位/租車確認碼" /></div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="選填"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    const fromInput = root.querySelector("#f-from");
    const toInput = root.querySelector("#f-to");
    if (getApiKey()) {
      tryAttachPlacesAutocomplete(fromInput, (place) => { fromInput.value = place.name || place.formatted_address || fromInput.value; });
      tryAttachPlacesAutocomplete(toInput, (place) => { toInput.value = place.name || place.formatted_address || toInput.value; });
    }
    root.querySelector("[data-save]").addEventListener("click", () => {
      trip.transportItems.push({
        id: uid(), type: root.querySelector("#f-type").value, title: root.querySelector("#f-title").value.trim(),
        date: root.querySelector("#f-date").value, from: fromInput.value.trim(), to: toInput.value.trim(),
        depTime: root.querySelector("#f-dep-time").value.trim(), arrTime: root.querySelector("#f-arr-time").value.trim(),
        bookingCode: root.querySelector("#f-code").value.trim(), note: root.querySelector("#f-note").value.trim(),
      });
      saveJournal(); renderLogistics(); renderDaysView(); closeModal();
    });
  });
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
    root.querySelector("#f-cat").addEventListener("change", (e) => { root.querySelector("#f-newcat-wrap").style.display = e.target.value === "__new" ? "block" : "none"; });
    root.querySelector("[data-save]").addEventListener("click", () => {
      const text = root.querySelector("#f-text").value.trim();
      if (!text) return;
      let catVal = root.querySelector("#f-cat").value;
      if (catVal === "__new") {
        catVal = root.querySelector("#f-newcat").value.trim() || "其他";
        if (!trip.packing.find((g) => g.category === catVal)) trip.packing.push({ category: catVal, items: [] });
      }
      const group = trip.packing.find((g) => g.category === catVal);
      group.items.push({ id: uid(), text, done: false });
      saveJournal(); renderLogistics(); closeModal();
    });
  });
}

/* ===================== 旅遊設定 ===================== */
function renderSettings() {
  const trip = currentTrip();
  if (!trip) return;
  const wrap = $("#settingsFields");
  wrap.innerHTML = "";
  const budget = trip.budget || emptyBudget();
  const firstDayDate = trip.days[0]?.date || "";

  const catBudgetFields = EXPENSE_CATS.map((c) => `
    <div>
      <label style="font-size:11.5px;color:var(--ink-soft);font-weight:700;">${c.icon} ${c.key}</label>
      <input type="number" class="s-cat-budget" data-cat="${c.key}" value="${budget.byCategory && budget.byCategory[c.key] != null ? budget.byCategory[c.key] : ""}" placeholder="不限" />
    </div>
  `).join("");

  const form = el(`
    <div>
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
        <label>出發日期（套用後會依序排到每一天，目前 ${trip.days.length} 天）</label>
        <input id="s-start-date" type="date" value="${escapeHtml(firstDayDate)}" />
        <button class="btn btn--ghost" id="s-apply-dates" style="margin-top:6px;">套用日期到每一天</button>
        <button class="btn btn--ghost" id="s-add-day" style="margin-top:6px;">＋ 新增一天</button>
      </div>
      <div class="settings-field">
        <label>天氣查詢城市（選填，用於整合行程表的每日天氣預報）</label>
        <input id="s-weather-city" value="${escapeHtml(trip.weatherCity||"")}" placeholder="例如：Tokyo、Osaka、Okinawa" />
        <button class="btn btn--ghost" id="s-weather-fetch" style="margin-top:6px;">🔄 更新天氣預報</button>
        <p class="field-hint" id="weatherStatus">${trip.weatherCache ? `上次更新：${escapeHtml(trip.weatherCache.city)}（${new Date(trip.weatherCache.fetchedAt).toLocaleString("zh-TW")}）` : "尚未查詢"}</p>
      </div>
      <div class="settings-field">
        <label>總預算（${escapeHtml(trip.currency.name||"當地貨幣")}，不填代表不限制）</label>
        <input type="number" id="s-total-budget" value="${budget.total != null ? budget.total : ""}" placeholder="例如 30000" />
      </div>
      <div class="settings-field">
        <label>分類預算（選填）</label>
        <div class="settings-row settings-row--wrap">${catBudgetFields}</div>
      </div>
      <button class="btn btn--primary btn--block" id="s-save">儲存設定</button>
      <p style="font-size:11.5px;color:var(--ink-soft);margin-top:8px;">變更國家/貨幣不會刪除已建立的行程與花費，但預設清單只會在新增旅遊時套用一次，之後可自行增刪。</p>
    </div>
    <div class="card" style="margin-top:16px;">
      <p class="members-card__title">🔄 共同編輯</p>
      ${!syncEnabled ? `
        <p class="field-hint">尚未設定雲端同步功能（需要開發者設定 Firebase），目前僅能用「匯出/匯入檔案」的方式分享，見下方。</p>
      ` : trip.syncCode ? `
        <p class="field-hint">把這組代碼分享給朋友，他們到首頁「🔗 加入共編旅遊」輸入即可一起即時編輯行程與記帳：</p>
        <p class="sync-code">${trip.syncCode}</p>
        <button class="btn btn--ghost" id="s-copy-code">📋 複製代碼</button>
        <button class="btn btn--danger" id="s-stop-sync" style="margin-top:8px;">停止同步（僅此裝置退出，其他人不受影響）</button>
      ` : `
        <p class="field-hint">開啟後會產生一組代碼，分享給朋友，大家就能同時編輯這趟旅遊的行程和記帳，改動即時同步。</p>
        <button class="btn btn--primary btn--block" id="s-start-sync">開啟共同編輯</button>
      `}
    </div>
    <div class="card" style="margin-top:16px;">
      <button class="btn btn--ghost btn--block" id="s-export">📤 匯出這趟旅遊（存成檔案分享給別人）</button>
    </div>
    </div>
  `);

  if (syncEnabled && !trip.syncCode) {
    form.querySelector("#s-start-sync").addEventListener("click", () => enableSync(currentTrip()));
  }
  if (syncEnabled && trip.syncCode) {
    form.querySelector("#s-copy-code").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(trip.syncCode); } catch (e) { /* ignore */ }
      const btn = form.querySelector("#s-copy-code");
      btn.textContent = "已複製 ✓";
      setTimeout(() => { btn.textContent = "📋 複製代碼"; }, 1500);
    });
    form.querySelector("#s-stop-sync").addEventListener("click", () => {
      if (confirm("確定要停止同步嗎？此裝置之後的變更就不會再跟其他人同步。")) disableSync(currentTrip());
    });
  }

  form.querySelector("#s-country").addEventListener("change", (e) => { form.querySelector("#s-custom-wrap").style.display = e.target.value === "__custom" ? "block" : "none"; });

  form.querySelector("#s-apply-dates").addEventListener("click", () => {
    const t = currentTrip();
    const start = form.querySelector("#s-start-date").value;
    if (!start) return;
    t.days.forEach((d, i) => { d.date = addDaysISO(start, i); });
    t.dateRange = `${isoToSlash(start)}-${isoToSlash(addDaysISO(start, t.days.length - 1))}`;
    saveJournal(); renderSettings(); renderDaysView(); renderTripHeader();
  });

  form.querySelector("#s-add-day").addEventListener("click", () => {
    const t = currentTrip();
    const last = t.days[t.days.length - 1];
    const nextDate = last && last.date ? addDaysISO(last.date, 1) : "";
    t.days.push({ id: uid(), label: `Day ${t.days.length + 1}`, date: nextDate, journal: "", stops: [] });
    t.dayCount = t.days.length;
    saveJournal(); renderSettings(); renderDaysView(); renderTripHeader();
  });

  form.querySelector("#s-weather-fetch").addEventListener("click", () => {
    const t = currentTrip();
    t.weatherCity = form.querySelector("#s-weather-city").value.trim();
    saveJournal();
    fetchWeatherForTrip();
  });

  form.querySelector("#s-export").addEventListener("click", () => exportTrip(currentTrip()));

  form.querySelector("#s-save").addEventListener("click", () => {
    const t = currentTrip();
    const countryVal = form.querySelector("#s-country").value;
    if (countryVal === "__custom") {
      t.country = "其他（自訂）"; t.flag = "🌍";
      t.currency = { code: form.querySelector("#s-cur-code").value.trim(), symbol: form.querySelector("#s-cur-symbol").value.trim(), name: t.currency.name || "當地貨幣" };
    } else {
      const entry = findCountryEntry(countryVal);
      if (entry) { t.country = entry.country; t.flag = entry.flag; t.currency = { code: entry.code, symbol: entry.symbol, name: entry.name }; }
    }
    t.transport = form.querySelector("#s-transport").value;
    t.weatherCity = form.querySelector("#s-weather-city").value.trim();

    const totalVal = form.querySelector("#s-total-budget").value;
    if (!t.budget) t.budget = emptyBudget();
    t.budget.total = totalVal === "" ? null : Number(totalVal);
    $all(".s-cat-budget", form).forEach((input) => { const v = input.value; t.budget.byCategory[input.dataset.cat] = v === "" ? null : Number(v); });

    saveJournal();
    renderTripHeader(); renderExpenses(); renderPhrases(); renderDaysView();
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
    if (type === "expense-form") openExpenseForm();
    if (type === "phrase-form") openPhraseForm();
  });
}

/* ===================== 安裝提示（讓 App 感更完整） ===================== */
const INSTALL_DISMISS_KEY = "install-banner-dismissed";
let deferredInstallPrompt = null;
function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream; }
function maybeShowInstallBanner() {
  if (isStandalone()) return;
  if (localStorage.getItem(INSTALL_DISMISS_KEY)) return;
  const banner = $("#installBanner");
  if (!banner) return;
  if (deferredInstallPrompt) {
    $("#installBannerSub").textContent = "像 App 一樣全螢幕使用，離線也能查看";
    $("#installBannerAction").hidden = false;
  } else if (isIOS()) {
    $("#installBannerSub").textContent = "點下方分享按鈕 → 加入主畫面";
    $("#installBannerAction").hidden = true;
  } else { return; }
  banner.hidden = false;
}
function initInstallBanner() {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstallPrompt = e; maybeShowInstallBanner(); });
  window.addEventListener("appinstalled", () => { $("#installBanner").hidden = true; });
  $("#installBannerClose").addEventListener("click", () => { localStorage.setItem(INSTALL_DISMISS_KEY, "1"); $("#installBanner").hidden = true; });
  $("#installBannerAction").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $("#installBanner").hidden = true;
  });
  setTimeout(maybeShowInstallBanner, 1200);
}

/* ===================== 初始化 ===================== */
function init() {
  applyTheme(getTheme());
  $all(".theme-toggle-btn").forEach((b) => { b.textContent = getTheme() === "dark" ? "☀️" : "🌙"; });
  $all(".theme-toggle-btn").forEach((b) => b.addEventListener("click", toggleTheme));

  initFirebaseIfConfigured();
  initTabbar();
  initFormTriggers();
  initInstallBanner();
  renderHome();

  const params = new URLSearchParams(location.search);
  if (params.get("action") === "new") { openTripForm(); history.replaceState(null, "", "./"); }

  $("#backHome").addEventListener("click", goHome);
  $("#openSettings").addEventListener("click", () => switchView("settings"));
  $("#fetchRateBtn").addEventListener("click", fetchLiveRate);
  $("#importTripBtn").addEventListener("click", importTripFile);
  $("#joinSyncBtn").addEventListener("click", openJoinSyncForm);
  $("#openGlobalSettings").addEventListener("click", openGlobalSettings);
  $("#deleteTripBtn").addEventListener("click", () => {
    const trip = currentTrip();
    if (!trip) return;
    if (confirm(`確定要刪除「${trip.title}」這趟旅遊嗎？此動作無法復原。`)) {
      unsubscribeTripSync();
      JOURNAL.trips = JOURNAL.trips.filter((t) => t.id !== trip.id);
      saveJournal(); goHome();
    }
  });

  if (getApiKey()) loadGoogleMaps(getApiKey()).catch(() => {});
  if ("serviceWorker" in navigator) window.addEventListener("load", () => { navigator.serviceWorker.register("./sw.js").catch(() => {}); });
}
document.addEventListener("DOMContentLoaded", init);
