/* ===================== 資料層 ===================== */
const STORAGE_KEY = "jp-trip-journal-v3";
const OLD_STORAGE_KEY_V2 = "jp-trip-journal-v2";
const OLD_STORAGE_KEY_V1 = "jp-trip-data-v1";
const GMAPS_KEY_STORAGE = "gmaps-api-key";

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
  { key: "交通", icon: "🚗", color: "#2B4C6F" }, { key: "住宿", icon: "🏨", color: "#C1440E" }, { key: "餐飲", icon: "🍜", color: "#C9A227" },
  { key: "門票", icon: "🎫", color: "#4A7C7C" }, { key: "購物", icon: "🛍️", color: "#8B5FA3" }, { key: "其他", icon: "🧾", color: "#9C8B73" },
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
    { category: "證件與文件", items: [
      "護照（效期6個月以上）", "護照影本 x2（與正本分開放）", "簽證／入境許可證明（如適用）",
      "機票／電子機票", "住宿訂房確認單", "海外旅平險保單",
      "緊急聯絡人卡片（中英文）", "信用卡海外緊急聯絡電話抄錄",
    ]},
    { category: "3C與電子用品", items: [
      "手機＋充電線", "行動電源（隨身攜帶，勿托運）", "當地電源轉接頭", "上網 SIM卡／eSIM／WiFi分享器",
      "相機＋備用電池＋記憶卡", "備用充電線／充電頭", "藍芽耳機", "手機腳架／自拍棒（選用）",
    ]},
    { category: "藥品與健康", items: [
      "個人常備藥（腸胃藥、止痛藥）", "暈車／暈機藥", "感冒藥", "個人處方藥（附醫生證明）",
      "防蚊液", "OK繃／簡易醫藥包", "口罩",
    ]},
    { category: "盥洗與個人清潔", items: [
      "牙刷牙膏", "洗面乳／卸妝用品", "隱形眼鏡藥水＋備用隱眼", "保養品分裝瓶",
      "生理用品", "刮鬍刀", "隨身小包衛生紙／濕紙巾",
    ]},
    { category: "衣物與穿搭", items: [
      "當地氣候合適衣物", "薄外套／防風外套", "帽子／太陽眼鏡", "好走的鞋",
      "襪子＋內衣褲（依天數＋1備用）", "睡衣", "雨具／輕便雨衣",
    ]},
    { category: "金錢與支付", items: [
      `${currencyName || "當地貨幣"}現金`, "信用卡（記得開通海外交易）", "少許零錢（投幣置物櫃/廁所用）",
    ]},
    { category: "行李收納", items: [
      "行李秤", "行李箱鎖", "分裝夾鏈袋", "折疊購物袋（戰利品用）", "洗衣袋",
    ]},
    { category: "出發前確認", items: [
      "家中門窗、水電、瓦斯確認關閉", "請假／代班安排", "寵物或植物託管安排",
      "手機開通國際漫遊或確認 eSIM 已安裝", "信用卡／銀行 App 開啟國外用卡通知",
    ]},
  ];
  if (selfDrive) groups.push({ category: "自駕用品", items: [
    "國際駕照", "台灣駕照正本", "租車預約確認單", "車用手機架", "ETC卡（若租車有配）", "太陽眼鏡（開車遮陽用）",
  ]});
  return groups.map((g) => ({ category: g.category, items: g.items.map((text) => ({ id: uid(), text, done: false })) }));
}

function newTrip({ title, startDate, dayCount, countryEntry, transport }) {
  const count = Math.min(Math.max(Number(dayCount) || 1, 1), 30);
  const selfDrive = transport === "自駕" || transport === "兩者都有";
  const days = Array.from({ length: count }, (_, i) => ({
    id: uid(), label: `Day ${i + 1}`, date: startDate ? addDaysISO(startDate, i) : "", journal: "", stops: [], weatherCache: null,
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
    days: old.days && old.days.length ? old.days.map((d) => ({ journal: "", weatherCache: null, ...d, stops: (d.stops||[]).map(s=>({tags:[],lat:null,lng:null,completed:false,...s})) })) : [],
    packing: old.packing || defaultPacking("日圓", true),
    expenses: (old.expenses || []).map((e) => ({ payerId: null, splitWith: [], date: null, currency: null, ...e })),
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
            if (e.date === undefined) e.date = null;
            if (e.currency === undefined) e.currency = null;
          });
          (t.spots || []).forEach((s) => { if (!s.tags) s.tags = []; });
          (t.days || []).forEach((d) => {
            if (d.journal === undefined) d.journal = "";
            if (d.weatherCache === undefined) d.weatherCache = null;
            (d.stops || []).forEach((s) => { if (!s.tags) s.tags = []; if (s.lat === undefined) s.lat = null; if (s.lng === undefined) s.lng = null; if (s.completed === undefined) s.completed = false; });
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
    copy.days = copy.days.map((d) => ({ id: uid(), label: d.label, date: "", journal: "", stops: [], weatherCache: null }));
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

/* 數字跳動動畫：讓總支出這類重要金額更新時有動態感，而不是瞬間跳字 */
const numberAnimState = new WeakMap();
function animateNumberText(elm, prefix, targetValue) {
  if (!elm) return;
  const prev = numberAnimState.get(elm);
  const fromValue = prev != null ? prev : targetValue;
  numberAnimState.set(elm, targetValue);
  if (fromValue === targetValue) { elm.textContent = prefix + Math.round(targetValue).toLocaleString(); return; }
  const duration = 450;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = fromValue + (targetValue - fromValue) * eased;
    elm.textContent = prefix + Math.round(current).toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
    else elm.textContent = prefix + Math.round(targetValue).toLocaleString();
  }
  requestAnimationFrame(tick);
}

function mapUrlForPlace(name, placeId) {
  if (placeId) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(placeId)}`;
  return mapUrl(name);
}

/* ===================== Google Places（選用） ===================== */
function getApiKey() {
  const local = localStorage.getItem(GMAPS_KEY_STORAGE);
  if (local) return local;
  return window.GMAPS_DEFAULT_KEY || "";
}
function hasLocalOverrideKey() { return !!localStorage.getItem(GMAPS_KEY_STORAGE); }
function setApiKey(key) { if (key) localStorage.setItem(GMAPS_KEY_STORAGE, key); else localStorage.removeItem(GMAPS_KEY_STORAGE); }

let gmapsLoadPromise = null;
let gmapsAuthFailed = false;
window.gm_authFailure = function () {
  gmapsAuthFailed = true;
  gmapsLoadPromise = null;
  console.warn("Google Maps 金鑰驗證失敗，請確認金鑰是否正確，以及網站限制的網域是否跟目前網址完全一致。");
};
function loadGoogleMaps(key) {
  if (!key) return Promise.reject(new Error("no key"));
  if (window.google && window.google.maps && window.google.maps.places) return Promise.resolve();
  if (gmapsLoadPromise) return gmapsLoadPromise;
  gmapsAuthFailed = false;
  gmapsLoadPromise = new Promise((resolve, reject) => {
    const cbName = "__gmapsReady";
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      gmapsLoadPromise = null;
      reject(new Error("Google Maps 載入逾時"));
    }, 10000);
    window[cbName] = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve();
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&language=zh-TW&region=TW&callback=${cbName}`;
    script.async = true;
    script.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      gmapsLoadPromise = null;
      reject(new Error("Google Maps 載入失敗"));
    };
    document.head.appendChild(script);
  });
  return gmapsLoadPromise;
}
let placesServiceHost = null;
function attachCustomAutocomplete(input, onPlace) {
  if (!(window.google && window.google.maps && window.google.maps.places)) return;
  const acService = new window.google.maps.places.AutocompleteService();
  if (!placesServiceHost) placesServiceHost = document.createElement("div");
  const placesService = new window.google.maps.places.PlacesService(placesServiceHost);

  const box = document.createElement("div");
  box.className = "places-suggestions";
  box.hidden = true;
  input.insertAdjacentElement("afterend", box);

  let debounceTimer = null;
  function hideBox() { box.hidden = true; box.innerHTML = ""; }

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const value = input.value.trim();
    if (!value) { hideBox(); return; }
    debounceTimer = setTimeout(() => {
      acService.getPlacePredictions({ input: value, language: "zh-TW" }, (predictions, status) => {
        box.innerHTML = "";
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions || !predictions.length) { hideBox(); return; }
        predictions.slice(0, 6).forEach((p) => {
          const mainText = (p.structured_formatting && p.structured_formatting.main_text) || p.description;
          const subText = (p.structured_formatting && p.structured_formatting.secondary_text) || "";
          const item = el(`
            <button type="button" class="places-suggestion-item">
              <span class="psi-main">${escapeHtml(mainText)}</span>
              ${subText ? `<span class="psi-sub">${escapeHtml(subText)}</span>` : ""}
            </button>
          `);
          item.addEventListener("click", () => {
            placesService.getDetails({ placeId: p.place_id, fields: ["place_id", "name", "formatted_address", "geometry"] }, (place, detStatus) => {
              if (detStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                input.value = place.name || mainText;
                onPlace(place);
              }
              hideBox();
            });
          });
          box.appendChild(item);
        });
        box.hidden = false;
      });
    }, 250);
  });
  input.addEventListener("blur", () => { setTimeout(hideBox, 200); });
}

function tryAttachPlacesAutocomplete(input, onPlace, onStatus) {
  const key = getApiKey();
  if (!key || !input) return;
  loadGoogleMaps(key).then(() => {
    if (!(window.google && window.google.maps && window.google.maps.places)) return;
    try {
      attachCustomAutocomplete(input, onPlace);
    } catch (e) { /* 靜默失敗 */ }
  }).catch((err) => {
    if (onStatus) {
      if (gmapsAuthFailed) onStatus("⚠️ 地圖金鑰驗證失敗，可能是網域限制設定不符，請洽管理者確認");
      else onStatus("⚠️ 地圖服務暫時無法連線，可先手動輸入地名，稍後會自動重試");
    }
  });
}

function openGlobalSettings() {
  const key = getApiKey();
  const hasDefault = !!window.GMAPS_DEFAULT_KEY;
  const usingDefault = hasDefault && !hasLocalOverrideKey();
  openModal(`
    <h3>🔑 地點搜尋設定</h3>
    <p style="font-size:12.5px;color:var(--ink-soft);line-height:1.6;margin-top:-6px;">
      ${usingDefault
        ? "這個網站已經內建地點搜尋功能，一般不需要自己設定。新增行程點/住宿時輸入關鍵字就能直接搜尋真實地標。"
        : "填入 Google Maps API 金鑰後，新增行程點/住宿時可以直接搜尋真實地標，自動帶入正確地址與地圖連結。"}
      ${hasDefault ? "如果你想改用自己的金鑰（例如額度考量），可以在下面填入覆蓋；清除後會恢復使用網站內建的金鑰。" : "沒有金鑰也完全不影響使用，只是要自己手動輸入地名。"}
      金鑰只會存在你這台裝置的瀏覽器裡。
    </p>
    <div class="field"><label>${hasDefault ? "自訂 API 金鑰（選填，留空使用內建金鑰）" : "Google Maps API 金鑰"}</label><input id="f-key" value="${escapeHtml(hasLocalOverrideKey() ? key : "")}" placeholder="${hasDefault ? "留空＝使用內建金鑰" : "貼上你的 API 金鑰"}" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>關閉</button>
      <button class="btn btn--danger" data-clear>${hasDefault ? "清除（恢復內建金鑰）" : "清除金鑰"}</button>
      <button class="btn btn--primary" data-save>儲存</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const v = root.querySelector("#f-key").value.trim();
      setApiKey(v);
      if (getApiKey()) loadGoogleMaps(getApiKey()).catch(() => {});
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
let syncStatus = { state: "idle", message: "", at: null }; // state: idle | syncing | ok | error

function setSyncStatus(state, message) {
  syncStatus = { state, message, at: Date.now() };
  const el2 = $("#syncStatusLine");
  if (el2) renderSyncStatusLine(el2);
}
function friendlySyncError(err) {
  const code = (err && (err.code || err.message)) || String(err);
  if (String(code).includes("permission-denied")) return "權限被拒絕（permission-denied）—— 最常見原因是 Firestore 安全規則沒有正確發布，請到 Firebase 後台 Firestore Database →「規則」確認內容跟 README 裡的一致並按「發布」。";
  if (String(code).includes("unavailable") || String(code).includes("network")) return "連不上網路，請檢查網路連線後再試一次。";
  if (String(code).includes("not-found")) return "找不到這趟旅遊的雲端資料，可能已被刪除。";
  return `發生錯誤：${code}`;
}
function renderSyncStatusLine(elm) {
  if (syncStatus.state === "idle") { elm.textContent = ""; return; }
  const time = syncStatus.at ? new Date(syncStatus.at).toLocaleTimeString("zh-TW") : "";
  if (syncStatus.state === "syncing") { elm.textContent = "🔄 同步中..."; elm.className = "field-hint"; }
  else if (syncStatus.state === "ok") { elm.textContent = `✓ 已同步（${time}）`; elm.className = "field-hint field-hint--ok"; }
  else if (syncStatus.state === "error") { elm.textContent = `⚠️ ${syncStatus.message}`; elm.className = "field-hint field-hint--warn"; }
}

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
  setSyncStatus("syncing", "");
  pushTimers[trip.id] = setTimeout(() => {
    const clean = JSON.parse(JSON.stringify(trip));
    db.collection("trips").doc(trip.syncCode).set(clean).then(() => {
      setSyncStatus("ok", "");
    }).catch((e) => {
      console.warn("同步上傳失敗", e);
      setSyncStatus("error", friendlySyncError(e));
    });
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
    setSyncStatus("ok", "");
    if (appState.screen === "trip" && appState.tripId === trip.id) {
      renderTripHeader(); renderDaysView(); renderExpenses(); renderPhrases(); renderLogistics(); renderSettings();
    }
  }, (err) => {
    console.warn("同步監聽失敗", err);
    setSyncStatus("error", friendlySyncError(err));
  });
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
    setSyncStatus("ok", "");
    subscribeTripSync(trip);
    renderSettings();
    renderTripHeader();
  } catch (e) {
    alert("啟用共同編輯失敗：" + friendlySyncError(e));
  }
}

function disableSync(trip) {
  unsubscribeTripSync();
  trip.syncCode = null;
  saveJournal();
  renderSettings();
  renderTripHeader();
}

function buildSyncShareLink(code) {
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("join", code);
  return url.toString();
}

async function joinTripByCode(code) {
  const snap = await db.collection("trips").doc(code).get();
  if (!snap.exists) throw new Error("not-found");
  const remote = snap.data();
  const existingIdx = JOURNAL.trips.findIndex((t) => t.syncCode === code);
  if (existingIdx >= 0) JOURNAL.trips[existingIdx] = remote;
  else JOURNAL.trips.push(remote);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(JOURNAL));
  return remote;
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
        const remote = await joinTripByCode(code);
        closeModal();
        renderHome();
        openTrip(remote.id);
      } catch (e) {
        alert("找不到這個代碼，請確認是否正確，或檢查網路連線。");
        btn.textContent = "加入";
      }
    });
  });
}

async function tryAutoJoinFromUrl() {
  const params = new URLSearchParams(location.search);
  const code = params.get("join");
  if (!code) return false;
  history.replaceState(null, "", location.pathname);
  if (!syncEnabled) {
    alert("這個連結需要共同編輯功能，但網站尚未設定雲端同步（開發者需先設定 Firebase）。");
    return true;
  }
  openModal(`<h3>🔗 加入共編旅遊</h3><p style="font-size:13px;color:var(--ink-soft);">正在加入，請稍候...</p>`);
  try {
    const remote = await joinTripByCode(code.toUpperCase());
    closeModal();
    openTrip(remote.id);
  } catch (e) {
    closeModal();
    alert("這個連結已失效，請跟朋友要一組新的連結或代碼。");
  }
  return true;
}

/* ===================== 天氣（Open-Meteo，免金鑰） ===================== */
function firstLocatableStop(day) {
  return (day.stops || []).find((s) => typeof s.lat === "number" && typeof s.lng === "number") || null;
}
async function fetchWeatherForDay(day) {
  const stop = firstLocatableStop(day);
  if (!stop || !day.date) return false;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${stop.lat}&longitude=${stop.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${day.date}&end_date=${day.date}`);
    const data = await res.json();
    if (data.daily && data.daily.time && data.daily.time.length) {
      day.weatherCache = {
        lat: stop.lat, lng: stop.lng, code: data.daily.weathercode[0],
        tmax: data.daily.temperature_2m_max[0], tmin: data.daily.temperature_2m_min[0], fetchedAt: Date.now(),
      };
      return true;
    }
  } catch (e) { /* 靜默失敗，該天就先不顯示天氣 */ }
  return false;
}
async function autoFetchTripWeather(trip) {
  let changed = false;
  for (const day of trip.days) {
    if (!day.date) continue;
    const stop = firstLocatableStop(day);
    if (!stop) continue;
    const stale = !day.weatherCache || Date.now() - day.weatherCache.fetchedAt > 6 * 3600 * 1000 || day.weatherCache.lat !== stop.lat || day.weatherCache.lng !== stop.lng;
    if (!stale) continue;
    const ok = await fetchWeatherForDay(day);
    if (ok) changed = true;
  }
  if (changed) { saveJournal(); renderDaysView(); }
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
  expandedDays = new Set();
  chartsExpanded = false;
  logisticsSubTab = "flights";
  switchScreen("trip");
  switchView("days");
  if ($("#itinerarySearch")) $("#itinerarySearch").value = "";
  renderItinerarySearch("");
  renderTripHeader();
  renderDaysView();
  renderExpenses();
  renderPhrases();
  renderLogistics();
  renderSettings();
  const trip = currentTrip();
  autoFetchTripWeather(trip);
  if (trip.syncCode) subscribeTripSync(trip);
  else unsubscribeTripSync();
}

/* ===================== 首頁：旅遊列表 ===================== */
function daysUntilDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const target = new Date(+match[1], +match[2] - 1, +match[3]);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

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
    const daysLeft = daysUntilDate(trip.days[0]?.date);
    let countdownHtml = "";
    if (daysLeft !== null) {
      const cls = daysLeft < 0 ? "past" : daysLeft <= 3 ? "soon" : "";
      const text = daysLeft > 0 ? `${daysLeft} 天後出發` : daysLeft === 0 ? "今天出發！" : "旅途愉快 🎌";
      countdownHtml = `<span class="trip-card__countdown ${cls}">${text}</span>`;
    }
    const budget = trip.budget || emptyBudget();
    let budgetHtml = "";
    if (budget.total) {
      const spent = trip.expenses.reduce((s, e) => s + expenseInTripCurrency(trip, e), 0);
      const pct = Math.min(spent / budget.total, 1);
      const over = spent > budget.total;
      const cls = over ? "over" : pct >= 0.8 ? "warn" : "ok";
      budgetHtml = `
        <div class="trip-card__budget">
          <div class="mini-bar"><div class="mini-bar__fill ${cls}" style="width:${pct*100}%;"></div></div>
          <span class="mini-bar__text">${escapeHtml(trip.currency.symbol||"")}${Math.round(spent).toLocaleString()} / ${Math.round(budget.total).toLocaleString()}</span>
        </div>`;
    }
    const card = el(`
      <div class="trip-card-wrap">
        <button class="trip-card">
          <div class="trip-card__strip"></div>
          <div class="trip-card__body">
            <p class="trip-card__title">${trip.flag || "🌍"} ${escapeHtml(trip.title)}${trip.syncCode ? ` <span class="sync-badge">🔄 共編中</span>` : ""}</p>
            <p class="trip-card__meta">${escapeHtml(trip.country || "")} · ${trip.dayCount}天${Math.max(trip.dayCount - 1, 0)}夜 · ${escapeHtml(trip.transport || "")}${trip.dateRange ? " · " + escapeHtml(trip.dateRange) : ""}</p>
            <div class="trip-card__stats"><span>🛣️ ${stopCount} 個行程點</span>${countdownHtml}</div>
            ${budgetHtml}
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

function renderItinerarySearch(query) {
  const trip = currentTrip();
  const resultsWrap = $("#searchResults");
  const normalArea = $("#normalItineraryArea");
  if (!trip || !resultsWrap || !normalArea) return;
  const q = query.trim().toLowerCase();
  if (!q) {
    resultsWrap.hidden = true;
    normalArea.style.display = "";
    return;
  }
  normalArea.style.display = "none";
  resultsWrap.hidden = false;
  resultsWrap.innerHTML = "";
  const matches = [];
  trip.days.forEach((day, dayIdx) => {
    day.stops.forEach((stop) => {
      const haystack = [stop.name, ...(stop.tags || []), stop.note || ""].join(" ").toLowerCase();
      if (haystack.includes(q)) matches.push({ day, dayIdx, stop });
    });
  });
  if (!matches.length) {
    resultsWrap.appendChild(el(`<div class="empty-hint">找不到符合「${escapeHtml(query)}」的行程點</div>`));
    return;
  }
  matches.forEach(({ day, dayIdx, stop }) => {
    const tagText = (stop.tags || []).length ? stop.tags.join("、") : "";
    const row = el(`
      <button type="button" class="card search-result-row ${stop.completed ? "is-completed" : ""}">
        <span class="search-result-row__day">${escapeHtml(day.label)}</span>
        <span class="search-result-row__body">
          <span class="search-result-row__name">${escapeHtml(stop.name)}</span>
          <span class="search-result-row__meta">${stop.time ? escapeHtml(stop.time) + "　" : ""}${escapeHtml(tagText)}</span>
        </span>
      </button>
    `);
    row.addEventListener("click", () => {
      currentDayIdx = dayIdx;
      itineraryMode = "daily";
      $("#itinerarySearch").value = "";
      renderItinerarySearch("");
      renderDaysView();
    });
    resultsWrap.appendChild(row);
  });
}

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
        <div class="road-stop ${stop.completed ? "is-completed" : ""}" data-stop-id="${stop.id}">
          <div class="card">
            <div class="stop-drag-row">
              <span class="drag-handle" title="拖曳排序">⠿</span>
              <label class="stop-check"><input type="checkbox" ${stop.completed ? "checked" : ""} /><span>已完成</span></label>
              ${stop.time ? `<span class="stop-time">${escapeHtml(stop.time)}</span>` : ""}
            </div>
            <p class="stop-name">${escapeHtml(stop.name)}</p>
            ${tagPills ? `<div class="tag-pill-row">${tagPills}</div>` : ""}
            ${stop.address ? `<p class="stop-note">${escapeHtml(stop.address)}</p>` : ""}
            ${stop.note ? `<p class="stop-note">${escapeHtml(stop.note)}</p>` : ""}
            <div class="spot-card__actions" style="margin-top:8px;">
              <a class="map-link" target="_blank" rel="noopener" href="${mapUrlForPlace(stop.name, stop.placeId)}">在地圖開啟 ↗</a>
              <button class="btn btn--outline btn--small" data-edit>✏️ 編輯</button>
              <button class="btn btn--danger" data-del>刪除</button>
            </div>
          </div>
        </div>
      `);
      card.querySelector(".stop-check input").addEventListener("change", (e) => { stop.completed = e.target.checked; saveJournal(); renderSingleDay(); });
      card.querySelector("[data-del]").addEventListener("click", () => { deleteWithUndo(day.stops, stop, `已刪除「${stop.name}」`, renderSingleDay); });
      card.querySelector("[data-edit]").addEventListener("click", () => openStopForm(day, stop));
      roadInner.appendChild(card);
    });
  }
  road.appendChild(roadInner);

  if (day.stops.length > 1 && window.Sortable) {
    daySortableInstance = new window.Sortable(roadInner, { handle: ".drag-handle", animation: 150, onEnd: () => syncStopOrderFromDOM(day, roadInner) });
  }

  if (day.stops.length > 1) {
    const toolRow = el(`<div class="day-tools"></div>`);
    const routeBtn = el(`<button class="btn btn--outline btn--small">🗺️ 開啟今日路線圖</button>`);
    routeBtn.addEventListener("click", () => {
      const url = buildDayRouteUrl(day, trip);
      if (url) window.open(url, "_blank", "noopener");
    });
    const calcBtn = el(`<button class="btn btn--outline btn--small">🧭 自動計算車程</button>`);
    const statusP = el(`<p class="field-hint" style="margin-top:6px;"></p>`);
    calcBtn.addEventListener("click", async () => {
      calcBtn.disabled = true;
      await calcDriveTimesForDay(day, trip, statusP);
      calcBtn.disabled = false;
    });
    toolRow.appendChild(routeBtn);
    toolRow.appendChild(calcBtn);
    road.appendChild(toolRow);
    road.appendChild(statusP);
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

let expandedDays = new Set(); // 記住這次瀏覽中哪些天是展開的

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
    road.appendChild(el(`<p class="full-day-header-plain">未指定日期的航班</p>`));
    road.appendChild(box);
  }

  const toolbar = el(`
    <div class="full-toolbar">
      <button class="chip" id="expandAllDays">展開全部</button>
      <button class="chip" id="collapseAllDays">收合全部</button>
    </div>
  `);
  toolbar.querySelector("#expandAllDays").addEventListener("click", () => { trip.days.forEach((d) => expandedDays.add(d.id)); renderFullItinerary(); });
  toolbar.querySelector("#collapseAllDays").addEventListener("click", () => { expandedDays.clear(); renderFullItinerary(); });
  road.appendChild(toolbar);

  trip.days.forEach((day) => {
    const section = el(`<div class="full-day-section"></div>`);
    const weather = day.weatherCache;
    const weatherHtml = weather ? `<span class="weather-badge">${weatherIconFor(weather.code)} ${Math.round(weather.tmax)}°/${Math.round(weather.tmin)}°</span>` : "";
    const events = dayEventsFor(trip, day);
    const isOpen = expandedDays.has(day.id);
    const summaryBits = [];
    if (day.stops.length) {
      const completedCount = day.stops.filter((s) => s.completed).length;
      summaryBits.push(`🛣️ ${completedCount ? `${completedCount}/` : ""}${day.stops.length} 站`);
    }
    if (events.length) summaryBits.push(`${events.length} 項提醒`);
    if (day.journal) summaryBits.push(`📝`);

    const header = el(`
      <button class="full-day-header ${isOpen ? "is-open" : ""}" type="button">
        <span class="full-day-chevron">▸</span>
        <span class="full-day-title">${escapeHtml(day.label)}${day.date ? " · " + formatDateDisplay(day.date) : ""}</span>
        ${weatherHtml}
        <span class="full-day-summary">${summaryBits.join("　")}</span>
      </button>
    `);
    const body = el(`<div class="full-day-body ${isOpen ? "" : "is-collapsed"}"></div>`);
    header.addEventListener("click", () => {
      const willOpen = body.classList.contains("is-collapsed");
      body.classList.toggle("is-collapsed", !willOpen);
      header.classList.toggle("is-open", willOpen);
      if (willOpen) expandedDays.add(day.id); else expandedDays.delete(day.id);
    });

    if (events.length) {
      const evBox = el(`<div class="card day-events-card"></div>`);
      events.forEach((ev) => evBox.appendChild(el(`<p style="margin:4px 0;font-size:13px;">${ev.time ? `<span class="stop-time" style="margin-right:6px;">${escapeHtml(ev.time)}</span>` : ""}${ev.html}</p>`)));
      body.appendChild(evBox);
    }

    if (!day.stops.length) {
      body.appendChild(el(`<div class="empty-hint" style="padding:14px;">（尚未安排景點行程）</div>`));
    } else {
      const inner = el(`<div class="full-stop-list"></div>`);
      day.stops.forEach((stop, idx) => {
        if (idx > 0 && stop.drive) inner.appendChild(el(`<div class="drive-chip drive-chip--compact">🚗 ${escapeHtml(stop.drive)}</div>`));
        const tagText = (stop.tags || []).length ? " · " + stop.tags.join("、") : "";
        const row = el(`
          <div class="full-stop-row ${stop.completed ? "is-completed" : ""}">
            <input type="checkbox" class="full-stop-check" ${stop.completed ? "checked" : ""} />
            ${stop.time ? `<span class="stop-time">${escapeHtml(stop.time)}</span>` : `<span class="full-stop-dot">・</span>`}
            <span class="full-stop-name">${escapeHtml(stop.name)}${tagText ? `<span class="full-stop-tags">${escapeHtml(tagText)}</span>` : ""}</span>
          </div>
        `);
        row.querySelector(".full-stop-check").addEventListener("change", (e) => { stop.completed = e.target.checked; saveJournal(); renderFullItinerary(); });
        inner.appendChild(row);
      });
      body.appendChild(inner);
    }
    if (day.journal) body.appendChild(el(`<div class="card journal-recap"><p style="font-weight:700;font-size:12px;margin:0 0 4px;color:var(--ink-soft);">📝 心得</p><p style="font-size:13px;margin:0;white-space:pre-wrap;">${escapeHtml(day.journal)}</p></div>`));

    section.appendChild(header);
    section.appendChild(body);
    road.appendChild(section);
  });

  if (!trip.days.some((d) => firstLocatableStop(d))) road.appendChild(el(`<div class="empty-hint">想在這裡看到每天的天氣預報嗎？新增行程點時用 Google 地圖搜尋選一下真實地標，系統就會自動抓當地當天的天氣。</div>`));
}

function syncStopOrderFromDOM(day, container) {
  const ids = $all(".road-stop", container).map((n) => n.dataset.stopId);
  const map = new Map(day.stops.map((s) => [s.id, s]));
  const reordered = ids.map((id) => map.get(id)).filter(Boolean);
  if (reordered.length === day.stops.length) { day.stops = reordered; saveJournal(); renderSingleDay(); }
}

function openStopForm(day, existingStop = null) {
  const isEdit = !!existingStop;
  let placeData = isEdit ? { placeId: existingStop.placeId, address: existingStop.address, lat: existingStop.lat, lng: existingStop.lng } : null;
  const tagChecks = STOP_TAGS.map((t) => {
    const checked = isEdit && (existingStop.tags || []).includes(t) ? "checked" : "";
    return `<label class="tag-check"><input type="checkbox" value="${t}" ${checked} /><span>${t}</span></label>`;
  }).join("");
  openModal(`
    <h3>${isEdit ? "編輯行程點" : "新增行程點"} — ${escapeHtml(day.label)}</h3>
    <div class="field"><label>時間（選填，僅顯示用）</label><input id="f-time" placeholder="例如 09:30" value="${escapeHtml(existingStop?.time || "")}" /></div>
    <div class="field">
      <label>地點名稱</label>
      <input id="f-name" placeholder="例如：新穗高纜車" autocomplete="off" value="${escapeHtml(existingStop?.name || "")}" />
      <p class="field-hint" id="place-hint">${isEdit && existingStop.address ? "✓ 已鎖定地標：" + escapeHtml(existingStop.address) : ""}</p>
    </div>
    <div class="field"><label>標籤（可複選，選填）</label><div class="tag-check-row">${tagChecks}</div></div>
    <div class="field"><label>與前一站的車程（選填，也可以全部新增完後在行程頁一鍵自動計算）</label><input id="f-drive" placeholder="留空之後可自動計算" value="${escapeHtml(existingStop?.drive || "")}" /></div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="營業時間、門票、注意事項...">${escapeHtml(existingStop?.note || "")}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>${isEdit ? "儲存修改" : "儲存"}</button>
    </div>
  `, (root) => {
    const nameInput = root.querySelector("#f-name");
    const hint = root.querySelector("#place-hint");
    if (isEdit && existingStop.address) hint.classList.add("field-hint--ok");
    if (getApiKey()) {
      if (!hint.textContent) hint.textContent = "輸入關鍵字可搜尋真實地標";
      tryAttachPlacesAutocomplete(nameInput, (place) => {
        const loc = place.geometry && place.geometry.location;
        placeData = { placeId: place.place_id, address: place.formatted_address || "", lat: loc ? loc.lat() : null, lng: loc ? loc.lng() : null };
        nameInput.value = place.name || nameInput.value;
        hint.textContent = "✓ 已鎖定地標：" + (place.formatted_address || "");
        hint.classList.remove("field-hint--warn");
        hint.classList.add("field-hint--ok");
      }, (msg) => { hint.textContent = msg; hint.classList.add("field-hint--warn"); });
    } else if (!hint.textContent) {
      hint.textContent = "💡 想用 Google 地圖搜尋真實地標嗎？回首頁點右上角 🔑 設定金鑰即可啟用";
    }
    root.querySelector("[data-save]").addEventListener("click", () => {
      const name = nameInput.value.trim();
      if (!name) return;
      const tags = $all('.tag-check input[type="checkbox"]:checked', root).map((cb) => cb.value);
      const values = {
        time: root.querySelector("#f-time").value.trim(), name, tags,
        drive: root.querySelector("#f-drive").value.trim(), note: root.querySelector("#f-note").value.trim(),
        placeId: placeData?.placeId || null, address: placeData?.address || "",
        lat: placeData?.lat ?? null, lng: placeData?.lng ?? null,
      };
      if (isEdit) {
        Object.assign(existingStop, values);
      } else {
        day.stops.push({ id: uid(), completed: false, ...values });
      }
      saveJournal(); renderDaysView(); closeModal();
    });
  });
}

function travelModeForTrip(trip) { return trip.transport === "大眾運輸" ? "TRANSIT" : "DRIVING"; }

function buildDayRouteUrl(day, trip) {
  if (day.stops.length < 2) return null;
  const first = day.stops[0], last = day.stops[day.stops.length - 1];
  const mid = day.stops.slice(1, -1);
  const params = new URLSearchParams();
  params.set("api", "1");
  params.set("origin", first.name);
  if (first.placeId) params.set("origin_place_id", first.placeId);
  params.set("destination", last.name);
  if (last.placeId) params.set("destination_place_id", last.placeId);
  if (mid.length) params.set("waypoints", mid.map((s) => s.name).join("|"));
  params.set("travelmode", travelModeForTrip(trip).toLowerCase());
  return "https://www.google.com/maps/dir/?" + params.toString();
}

async function calcDriveTimesForDay(day, trip, statusEl) {
  if (!(window.google && window.google.maps)) {
    if (statusEl) statusEl.textContent = "地圖服務尚未載入，請稍候幾秒再試一次（需要先設定好 Google Maps 金鑰）。";
    return;
  }
  if (day.stops.length < 2) return;
  if (statusEl) statusEl.textContent = "計算中...";
  const service = new window.google.maps.DirectionsService();
  const mode = window.google.maps.TravelMode[travelModeForTrip(trip)];
  let okCount = 0, failCount = 0;
  for (let i = 1; i < day.stops.length; i++) {
    const origin = day.stops[i - 1];
    const dest = day.stops[i];
    try {
      const result = await new Promise((resolve, reject) => {
        service.route({
          origin: origin.placeId ? { placeId: origin.placeId } : origin.name,
          destination: dest.placeId ? { placeId: dest.placeId } : dest.name,
          travelMode: mode,
        }, (res, status) => { if (status === "OK") resolve(res); else reject(status); });
      });
      const leg = result.routes[0].legs[0];
      dest.drive = leg.duration.text;
      okCount++;
    } catch (e) { failCount++; }
  }
  saveJournal();
  renderSingleDay();
  if (statusEl) statusEl.textContent = failCount ? `已計算 ${okCount} 段，${failCount} 段查詢失敗（可能是地點名稱不夠精確，建議用地圖搜尋選過的地點會更準）。` : `已自動計算 ${okCount} 段車程時間。`;
}

/* ===================== 記帳（含預算 + 分帳結算） ===================== */
function iconFor(cat) { return (EXPENSE_CATS.find((c) => c.key === cat) || {}).icon || "🧾"; }
/* ---------- 輕量圖表工具（純 SVG/CSS，不依賴外部套件） ---------- */
function buildDonutSVG(segments, size) {
  size = size || 108;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const radius = size / 2 - 9;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  if (!total) {
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(--line)" stroke-width="14" /></svg>`;
  }
  let offset = 0;
  let circles = "";
  segments.forEach((seg) => {
    if (seg.value <= 0) return;
    const frac = seg.value / total;
    const dash = frac * circumference;
    circles += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${seg.color}" stroke-width="14" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
    offset += dash;
  });
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${circles}</svg>`;
}
function buildProgressRing(done, total, size) {
  size = size || 40;
  const pct = total ? done / total : 0;
  const radius = size / 2 - 4;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = pct * circumference;
  return `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="progress-ring">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(--line)" stroke-width="4" />
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(--green)" stroke-width="4"
        stroke-dasharray="${dash} ${circumference - dash}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})" />
    </svg>
  `;
}
function buildBarChartHtml(items) {
  // items: [{label, value}]
  const max = Math.max(...items.map((d) => d.value), 1);
  return `<div class="bar-chart">${items.map((d) => `
    <div class="bar-chart__col">
      <div class="bar-chart__val">${Math.round(d.value).toLocaleString()}</div>
      <div class="bar-chart__track"><div class="bar-chart__bar" style="height:${Math.max(6, Math.round(d.value / max * 88))}px;"></div></div>
      <div class="bar-chart__label">${escapeHtml(d.label)}</div>
    </div>
  `).join("")}</div>`;
}

function budgetBarHtml(spent, budget, label) {
  if (budget == null || budget <= 0) return "";
  const pct = Math.min(spent / budget, 1);
  const over = spent > budget;
  const cls = over ? "over" : pct >= 0.8 ? "warn" : "ok";
  return `<div class="budget-row"><div class="budget-row__labels"><span>${escapeHtml(label)}</span><span class="${over?"budget-over-text":""}">${spent.toLocaleString()} / ${budget.toLocaleString()}</span></div><div class="budget-bar"><div class="budget-bar__fill ${cls}" style="width:${pct*100}%;"></div></div></div>`;
}
function memberName(trip, id) { return (trip.members.find((m) => m.id === id) || {}).name || "未指定"; }

/* ---------- 多幣別花費：每筆花費可選擇跟旅遊主要貨幣不同的幣別 ---------- */
function expenseCurrency(trip, e) { return e.currency || trip.currency; }
function expenseRate(trip, e) { return (e.currency && e.currency.rate) || trip.exRate; }
function expenseTWD(trip, e) { return Number(e.amount || 0) * expenseRate(trip, e); }
function expenseInTripCurrency(trip, e) {
  if (!e.currency) return Number(e.amount || 0);
  return trip.exRate ? expenseTWD(trip, e) / trip.exRate : Number(e.amount || 0);
}

function calculateSettlement(trip) {
  const members = trip.members;
  if (members.length < 2) return null;
  const paidTWD = {}, owedTWD = {};
  members.forEach((m) => { paidTWD[m.id] = 0; owedTWD[m.id] = 0; });
  trip.expenses.forEach((e) => {
    const amountTWD = expenseTWD(trip, e);
    if (e.payerId && paidTWD[e.payerId] !== undefined) paidTWD[e.payerId] += amountTWD;
    const splitWith = (e.splitWith && e.splitWith.length ? e.splitWith : members.map((m) => m.id)).filter((id) => owedTWD[id] !== undefined);
    if (!splitWith.length) return;
    const share = amountTWD / splitWith.length;
    splitWith.forEach((id) => { owedTWD[id] += share; });
  });
  const rate = trip.exRate || 1;
  const balances = members.map((m) => ({
    id: m.id, name: m.name,
    paid: paidTWD[m.id] / rate, owed: owedTWD[m.id] / rate, balance: (paidTWD[m.id] - owedTWD[m.id]) / rate,
  }));

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

function renderSplitCard() {
  const trip = currentTrip();
  if (!trip) return;
  const wrap = $("#splitCard");
  wrap.innerHTML = "";
  const symbol = trip.currency.symbol || "";
  const card = el(`<div class="card split-card"></div>`);
  card.appendChild(el(`<p class="members-card__title">👥 分帳${trip.members.length ? `（${trip.members.length}人）` : ""}</p>`));

  const chipRow = el(`<div class="chip-row" style="margin-bottom:0;"></div>`);
  trip.members.forEach((m) => {
    const chip = el(`<span class="member-chip">${escapeHtml(m.name)}<button class="member-chip__del" data-del="${m.id}">✕</button></span>`);
    chip.querySelector("[data-del]").addEventListener("click", () => {
      if (!confirm(`確定要移除成員「${m.name}」嗎？他在各筆花費裡的付款/分攤紀錄也會一併清除。`)) return;
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

  const result = calculateSettlement(trip);
  if (!trip.members.length) {
    card.appendChild(el(`<p class="field-hint" style="margin-top:8px;">跟朋友一起去？新增旅伴，就能標記每筆花費是誰付的、算誰的份，自動算出誰要付給誰多少錢。</p>`));
  } else if (result) {
    card.appendChild(el(`<div class="settlement-divider" style="margin-top:10px;"></div>`));
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
      card.appendChild(el(`<p class="settlement-suggest-title">建議轉帳</p>`));
      result.transfers.forEach((t) => {
        card.appendChild(el(`<p class="settlement-transfer">👉 <b>${escapeHtml(t.from)}</b> 要付給 <b>${escapeHtml(t.to)}</b>　<span class="settlement-transfer__amount">${symbol}${t.amount.toLocaleString()}</span></p>`));
      });
    } else {
      card.appendChild(el(`<p class="field-hint" style="margin-top:6px;">目前帳務已平衡，不用互轉。</p>`));
    }
  }
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

function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function exportExpensesCSV(trip) {
  const curLabel = trip.currency.code || trip.currency.name || "當地貨幣";
  const rows = [["日期", "類別", "項目", "幣別", `金額`, "換算TWD", "付款人", "分攤對象", "備註"]];
  trip.expenses.forEach((e) => {
    const cur = expenseCurrency(trip, e);
    rows.push([
      e.date ? formatDateDisplay(e.date) : "",
      e.category,
      e.title || "",
      cur.code || cur.name || curLabel,
      e.amount,
      Math.round(expenseTWD(trip, e)),
      e.payerId ? memberName(trip, e.payerId) : "",
      (e.splitWith || []).map((id) => memberName(trip, id)).join("、"),
      e.note || "",
    ]);
  });
  const totalTWD = trip.expenses.reduce((s, e) => s + expenseTWD(trip, e), 0);
  rows.push([]);
  rows.push(["總計", "", "", "", "", Math.round(totalTWD), "", "", ""]);
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${trip.title.replace(/[\\/:*?"<>|]/g, "")}_記帳明細.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function shortDateLabel(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

let chartsExpanded = false;
function renderExpenseCharts(trip, catSums, symbol) {
  const wrap = $("#chartsSection");
  if (!wrap) return;
  wrap.innerHTML = "";
  if (!trip.expenses.length) return;

  const card = el(`<div class="card charts-card"></div>`);
  const header = el(`<button type="button" class="charts-toggle ${chartsExpanded ? "is-open" : ""}"><span class="full-day-chevron">▸</span><span>📊 花費圖表</span></button>`);
  const body = el(`<div class="charts-body ${chartsExpanded ? "" : "is-collapsed"}"></div>`);
  header.addEventListener("click", () => {
    chartsExpanded = body.classList.contains("is-collapsed");
    body.classList.toggle("is-collapsed", !chartsExpanded);
    header.classList.toggle("is-open", chartsExpanded);
  });

  const segments = EXPENSE_CATS.map((c) => ({ value: catSums[c.key] || 0, color: c.color, label: c.key, icon: c.icon }));
  const totalSum = segments.reduce((s, x) => s + x.value, 0);
  const legendHtml = segments.filter((s) => s.value > 0).map((s) => `
    <div class="donut-legend__row">
      <span class="donut-legend__dot" style="background:${s.color}"></span>
      <span class="donut-legend__label">${s.icon} ${s.label}</span>
      <span class="donut-legend__val">${symbol}${Math.round(s.value).toLocaleString()}（${totalSum ? Math.round(s.value / totalSum * 100) : 0}%）</span>
    </div>
  `).join("");
  body.appendChild(el(`
    <div>
    <p class="charts-subtitle">分類佔比</p>
    <div class="donut-block">
      <div class="donut-block__chart">${buildDonutSVG(segments)}</div>
      <div class="donut-block__legend">${legendHtml}</div>
    </div>
    </div>
  `));

  const byDate = {};
  trip.expenses.forEach((e) => { if (e.date) byDate[e.date] = (byDate[e.date] || 0) + expenseInTripCurrency(trip, e); });
  const dateKeys = Object.keys(byDate).sort();
  if (dateKeys.length) {
    const items = dateKeys.map((k) => ({ label: shortDateLabel(k), value: byDate[k] }));
    body.appendChild(el(`<div><p class="charts-subtitle" style="margin-top:16px;">每日花費</p>${buildBarChartHtml(items)}</div>`));
  }

  card.appendChild(header);
  card.appendChild(body);
  wrap.appendChild(card);
}

function renderExpenses() {
  const trip = currentTrip();
  if (!trip) return;
  $("#exRate").value = trip.exRate;
  $("#rateFromCode").textContent = trip.currency.code || trip.currency.name || "當地貨幣";
  const symbol = trip.currency.symbol || "";
  const total = trip.expenses.reduce((s, e) => s + expenseInTripCurrency(trip, e), 0);
  const totalTWD = trip.expenses.reduce((s, e) => s + expenseTWD(trip, e), 0);
  animateNumberText($("#totalJPY"), symbol, total);
  animateNumberText($("#totalTWD"), "NT$", totalTWD);
  const usedCurrencies = new Set(trip.expenses.map((e) => (e.currency ? e.currency.code : trip.currency.code)));
  const currencyNote = $("#multiCurrencyNote");
  if (currencyNote) currencyNote.textContent = usedCurrencies.size > 1 ? `（使用了 ${usedCurrencies.size} 種貨幣，已換算成 ${symbol} 顯示總額）` : "";

  const heroBudgetWrap = $("#heroBudgetBar");
  heroBudgetWrap.innerHTML = "";
  const budget = trip.budget || emptyBudget();
  let budgetHtml = "";
  if (budget.total) budgetHtml += budgetBarHtml(total, budget.total, `總預算（${symbol}）`);
  EXPENSE_CATS.forEach((c) => {
    const limit = budget.byCategory && budget.byCategory[c.key];
    if (!limit) return;
    const spent = trip.expenses.filter((e) => e.category === c.key).reduce((s, e) => s + expenseInTripCurrency(trip, e), 0);
    budgetHtml += budgetBarHtml(spent, limit, `${c.icon} ${c.key}`);
  });
  if (budgetHtml) heroBudgetWrap.appendChild(el(`<div class="hero-budget">${budgetHtml}</div>`));

  renderSplitCard();

  const catSums = {};
  EXPENSE_CATS.forEach((c) => { catSums[c.key] = trip.expenses.filter((e) => e.category === c.key).reduce((s, e) => s + expenseInTripCurrency(trip, e), 0); });
  renderExpenseCharts(trip, catSums, symbol);

  const byCat = $("#expenseByCategory");
  byCat.innerHTML = "";
  EXPENSE_CATS.forEach((c) => {
    const sum = catSums[c.key];
    if (sum > 0) byCat.appendChild(el(`<div class="chip static">${c.icon} ${c.key} ${symbol}${Math.round(sum).toLocaleString()}</div>`));
  });

  const list = $("#expenseList");
  list.innerHTML = "";
  if (!trip.expenses.length) { list.appendChild(el(`<div class="empty-hint">還沒有花費紀錄，點右下角 ＋ 隨手記一筆吧！</div>`)); return; }
  trip.expenses.slice().reverse().forEach((e) => {
    const cur = expenseCurrency(trip, e);
    const isForeign = !!e.currency;
    const payerText = e.payerId ? `由 ${escapeHtml(memberName(trip, e.payerId))} 付款` : "";
    const splitText = e.splitWith && e.splitWith.length ? `均分：${e.splitWith.map((id) => escapeHtml(memberName(trip, id))).join("、")}` : "";
    const row = el(`
      <div class="card expense-row">
        <div class="expense-row__icon">${iconFor(e.category)}</div>
        <div class="expense-row__body">
          <div class="expense-row__title">${escapeHtml(e.title || e.category)}${isForeign ? `<span class="currency-tag">${escapeHtml(cur.code || cur.name)}</span>` : ""}</div>
          <div class="expense-row__meta">${escapeHtml(e.category)}${e.date ? " · " + formatDateDisplay(e.date) : ""}${e.note ? " · " + escapeHtml(e.note) : ""}</div>
          ${payerText || splitText ? `<div class="expense-row__split">${payerText}${payerText && splitText ? " · " : ""}${splitText}</div>` : ""}
        </div>
        <div class="expense-row__amount">${escapeHtml(cur.symbol || "")}${Number(e.amount).toLocaleString()}</div>
        <button class="btn btn--outline btn--small" data-edit>✏️</button>
        <button class="btn btn--danger" data-del>刪</button>
      </div>
    `);
    row.querySelector("[data-del]").addEventListener("click", () => { deleteWithUndo(trip.expenses, e, `已刪除「${e.title||e.category}」`, renderExpenses); });
    row.querySelector("[data-edit]").addEventListener("click", () => openExpenseForm(e));
    list.appendChild(row);
  });
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function openExpenseForm(existingExpense = null) {
  const isEdit = !!existingExpense;
  const trip = currentTrip();
  const catOpts = EXPENSE_CATS.map((c) => `<option value="${c.key}" ${isEdit && existingExpense.category===c.key?"selected":""}>${c.icon} ${c.key}</option>`).join("");
  const hasMembers = trip.members.length > 0;
  const payerOpts = trip.members.map((m) => `<option value="${m.id}" ${isEdit && existingExpense.payerId===m.id?"selected":""}>${escapeHtml(m.name)}</option>`).join("");
  const splitWithSet = isEdit ? new Set(existingExpense.splitWith || []) : null;
  const splitChecks = trip.members.map((m) => {
    const checked = isEdit ? (splitWithSet.has(m.id) ? "checked" : "") : "checked";
    return `<label class="tag-check"><input type="checkbox" value="${m.id}" ${checked} /><span>${escapeHtml(m.name)}</span></label>`;
  }).join("");
  const existingForeign = isEdit ? existingExpense.currency : null;
  const currencySelectedValue = existingForeign
    ? (existingForeign.code === "TWD" ? "TWD" : (COUNTRY_CURRENCY.some((c) => c.code === existingForeign.code) ? existingForeign.code : "__custom"))
    : "__trip";
  const currencyOpts = `<option value="__trip">與旅遊相同（${escapeHtml(trip.currency.code || trip.currency.name)}）</option>`
    + `<option value="TWD" ${currencySelectedValue==="TWD"?"selected":""}>🇹🇼 新台幣（TWD）</option>`
    + COUNTRY_CURRENCY.map((c) => `<option value="${c.code}" ${currencySelectedValue===c.code?"selected":""}>${c.flag} ${c.country}（${c.code}）</option>`).join("")
    + `<option value="__custom" ${currencySelectedValue==="__custom"?"selected":""}>🌍 其他（自訂）</option>`;
  openModal(`
    <h3>${isEdit ? "編輯花費" : "新增花費"}</h3>
    <div class="field"><label>日期（選填）</label><input id="f-date" type="date" value="${escapeHtml(existingExpense?.date || todayISO())}" /></div>
    <div class="field"><label>貨幣</label><select id="f-currency">${currencyOpts}</select></div>
    <div id="foreignCurrencyFields" class="settings-row" style="display:none;">
      <div><label style="font-size:12px;color:var(--ink-soft);font-weight:700;">幣別代碼</label><input id="f-cur-code" value="${escapeHtml(existingForeign?.code || "")}" /></div>
      <div><label style="font-size:12px;color:var(--ink-soft);font-weight:700;">符號</label><input id="f-cur-symbol" value="${escapeHtml(existingForeign?.symbol || "")}" /></div>
      <div><label style="font-size:12px;color:var(--ink-soft);font-weight:700;">匯率(→TWD)</label><input id="f-cur-rate" type="number" step="0.0001" value="${existingForeign?.rate ?? ""}" /></div>
    </div>
    <div class="field"><label>金額（<span id="amountCurLabel">${escapeHtml(trip.currency.name || "當地貨幣")}</span>）</label><input id="f-amount" type="number" placeholder="0" value="${isEdit ? existingExpense.amount : ""}" /></div>
    <div class="field"><label>類別</label><select id="f-cat">${catOpts}</select></div>
    <div class="field"><label>項目名稱</label><input id="f-title" placeholder="例如：拉麵晚餐" value="${escapeHtml(existingExpense?.title || "")}" /></div>
    ${hasMembers ? `
    <div class="field"><label>誰付的錢</label><select id="f-payer"><option value="">未指定</option>${payerOpts}</select></div>
    <div class="field"><label>算誰的份（可複選，預設全部）</label><div class="tag-check-row">${splitChecks}</div></div>
    ` : `<p class="field-hint">到下方「👥 分帳」新增旅伴，就能標記這筆是誰付的、要算誰的份。</p>`}
    <div class="field"><label>備註</label><input id="f-note" placeholder="選填" value="${escapeHtml(existingExpense?.note || "")}" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>${isEdit ? "儲存修改" : "儲存"}</button>
    </div>
  `, (root) => {
    const currencySelect = root.querySelector("#f-currency");
    const foreignWrap = root.querySelector("#foreignCurrencyFields");
    const amountLabel = root.querySelector("#amountCurLabel");
    function syncCurrencyUI() {
      const val = currencySelect.value;
      if (val === "__trip") {
        foreignWrap.style.display = "none";
        amountLabel.textContent = trip.currency.name || "當地貨幣";
      } else if (val === "__custom") {
        foreignWrap.style.display = "flex";
        amountLabel.textContent = root.querySelector("#f-cur-code").value || "自訂幣別";
      } else {
        const entry = findCountryEntry2(val);
        foreignWrap.style.display = "flex";
        if (entry) {
          root.querySelector("#f-cur-code").value = entry.code;
          root.querySelector("#f-cur-symbol").value = entry.symbol;
          root.querySelector("#f-cur-rate").value = entry.rate;
          amountLabel.textContent = entry.name;
        }
      }
    }
    function findCountryEntry2(code) {
      if (code === "TWD") return { country: "台灣", flag: "🇹🇼", code: "TWD", symbol: "NT$", name: "新台幣", rate: 1 };
      return COUNTRY_CURRENCY.find((c) => c.code === code);
    }
    currencySelect.addEventListener("change", syncCurrencyUI);
    root.querySelector("#f-cur-code").addEventListener("input", (e) => { if (currencySelect.value === "__custom") amountLabel.textContent = e.target.value || "自訂幣別"; });
    if (currencySelectedValue !== "__trip") { foreignWrap.style.display = "flex"; amountLabel.textContent = existingForeign?.name || existingForeign?.code || "自訂幣別"; }

    root.querySelector("[data-save]").addEventListener("click", () => {
      const amount = Number(root.querySelector("#f-amount").value);
      if (!amount) return;
      const payerId = hasMembers ? (root.querySelector("#f-payer").value || null) : null;
      const splitWith = hasMembers ? $all('.tag-check input[type="checkbox"]:checked', root).map((cb) => cb.value) : [];
      let currency = null;
      const curVal = currencySelect.value;
      if (curVal !== "__trip") {
        const code = root.querySelector("#f-cur-code").value.trim();
        const symbol = root.querySelector("#f-cur-symbol").value.trim();
        const rate = Number(root.querySelector("#f-cur-rate").value) || 0;
        const entry = findCountryEntry2(curVal);
        currency = { code, symbol, name: entry?.name || code || "自訂幣別", rate };
      }
      const values = {
        amount, category: root.querySelector("#f-cat").value, title: root.querySelector("#f-title").value.trim(),
        note: root.querySelector("#f-note").value.trim(), payerId, splitWith,
        date: root.querySelector("#f-date").value, currency,
      };
      if (isEdit) {
        Object.assign(existingExpense, values);
      } else {
        trip.expenses.push({ id: uid(), ...values });
      }
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
  if (deletable) node.querySelector("[data-del]").addEventListener("click", () => { deleteWithUndo(trip.customPhrases, p, "已刪除自訂例句", renderPhrases); });
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
  const packDone = trip.packing.reduce((s, g) => s + g.items.filter((it) => it.done).length, 0);
  const packTotal = trip.packing.reduce((s, g) => s + g.items.length, 0);
  const subTabs = $("#logisticsSubTabs");
  subTabs.innerHTML = "";
  [
    ["flights", "✈️ 航班", trip.flights.length],
    ["lodging", "🏨 住宿", trip.lodging.length],
    ["transport", "🚌 交通", trip.transportItems.length],
    ["packing", "🧳 準備", `${packDone}/${packTotal}`],
  ].forEach(([key, label, count]) => {
    const btn = el(`<button class="day-tab ${logisticsSubTab===key?"active":""}">${label}${count !== 0 ? `<span class="day-tab__count">${count}</span>` : ""}</button>`);
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
          <div class="spot-card__actions" style="margin-top:6px;">
            <button class="btn btn--outline btn--small" data-edit>✏️ 編輯</button>
            <button class="btn btn--danger" data-del>刪除</button>
          </div>
        </div>
      `);
      card.querySelector("[data-del]").addEventListener("click", () => { deleteWithUndo(trip.flights, f, "已刪除航班", () => { renderLogistics(); renderDaysView(); }); });
      card.querySelector("[data-edit]").addEventListener("click", () => openFlightForm(f));
      content.appendChild(card);
    });
    const addBtn = el(`<button class="btn btn--ghost">＋ 新增航班</button>`);
    addBtn.addEventListener("click", () => openFlightForm());
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
            <button class="btn btn--outline btn--small" data-edit>✏️ 編輯</button>
            <button class="btn btn--danger" data-del>刪除</button>
          </div>
        </div>
      `);
      card.querySelector("[data-del]").addEventListener("click", () => { deleteWithUndo(trip.lodging, l, `已刪除「${l.name}」`, () => { renderLogistics(); renderDaysView(); }); });
      card.querySelector("[data-edit]").addEventListener("click", () => openLodgingForm(l));
      content.appendChild(card);
    });
    const addBtn = el(`<button class="btn btn--ghost">＋ 新增住宿</button>`);
    addBtn.addEventListener("click", () => openLodgingForm());
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
          <div class="spot-card__actions" style="margin-top:6px;">
            <button class="btn btn--outline btn--small" data-edit>✏️ 編輯</button>
            <button class="btn btn--danger" data-del>刪除</button>
          </div>
        </div>
      `);
      card.querySelector("[data-del]").addEventListener("click", () => { deleteWithUndo(trip.transportItems, t, "已刪除交通資訊", () => { renderLogistics(); renderDaysView(); }); });
      card.querySelector("[data-edit]").addEventListener("click", () => openTransportForm(t));
      content.appendChild(card);
    });
    const addBtn = el(`<button class="btn btn--ghost">＋ 新增交通</button>`);
    addBtn.addEventListener("click", () => openTransportForm());
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
          <div class="card pack-item ${item.done ? "done" : ""}">
            <input type="checkbox" ${item.done ? "checked" : ""} />
            <span>${escapeHtml(item.text)}</span>
            <button class="btn btn--outline btn--small" data-edit>✏️</button>
            <button class="btn btn--danger" data-del>刪除</button>
          </div>
        `);
        row.querySelector('input[type="checkbox"]').addEventListener("change", (e) => { item.done = e.target.checked; saveJournal(); renderLogistics(); });
        row.querySelector("[data-edit]").addEventListener("click", () => openPackingItemEditForm(item));
        row.querySelector("[data-del]").addEventListener("click", () => { deleteWithUndo(group.items, item, `已刪除「${item.text}」`, renderLogistics); });
        wrap.appendChild(row);
      });
    });
    content.appendChild(el(`
      <div class="view-head" style="margin-bottom:10px;align-items:center;">
        <span style="font-size:13px;font-weight:700;color:var(--ink-soft);">準備進度</span>
        <span class="progress-ring-wrap">${buildProgressRing(done, total, 40)}<span class="progress-ring-text">${done}/${total}</span></span>
      </div>
    `));
    content.appendChild(wrap);
    const addBtn = el(`<button class="btn btn--ghost">＋ 新增準備項目</button>`);
    addBtn.addEventListener("click", openPackingForm);
    content.appendChild(addBtn);
  }
}

function openPackingItemEditForm(item) {
  openModal(`
    <h3>編輯項目</h3>
    <div class="field"><label>項目內容</label><input id="f-text" value="${escapeHtml(item.text)}" /></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>儲存修改</button>
    </div>
  `, (root) => {
    root.querySelector("[data-save]").addEventListener("click", () => {
      const text = root.querySelector("#f-text").value.trim();
      if (!text) return;
      item.text = text;
      saveJournal(); renderLogistics(); closeModal();
    });
  });
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

function openFlightForm(existingFlight = null) {
  const isEdit = !!existingFlight;
  const trip = currentTrip();
  const dirOpts = FLIGHT_DIRECTIONS.map((d) => `<option value="${d}" ${isEdit && existingFlight.direction===d?"selected":""}>${d}</option>`).join("");
  openModal(`
    <h3>${isEdit ? "編輯航班" : "新增航班"}</h3>
    ${isEdit ? "" : smartPasteBlockHtml()}
    <div class="field"><label>類型</label><select id="f-dir">${dirOpts}</select></div>
    <div class="field"><label>航空公司</label><input id="f-airline" placeholder="例如：長榮航空" value="${escapeHtml(existingFlight?.airline || "")}" /></div>
    <div class="field"><label>航班編號</label><input id="f-no" placeholder="例如：BR198" value="${escapeHtml(existingFlight?.flightNo || "")}" /></div>
    <div class="field"><label>日期</label><input id="f-date" type="date" value="${escapeHtml(existingFlight?.date || "")}" /></div>
    <div class="settings-row">
      <div class="field"><label>出發機場</label><input id="f-dep-ap" placeholder="TPE" value="${escapeHtml(existingFlight?.depAirport || "")}" /></div>
      <div class="field"><label>出發時間</label><input id="f-dep-time" placeholder="07:20" value="${escapeHtml(existingFlight?.depTime || "")}" /></div>
    </div>
    <div class="settings-row">
      <div class="field"><label>抵達機場</label><input id="f-arr-ap" placeholder="NRT" value="${escapeHtml(existingFlight?.arrAirport || "")}" /></div>
      <div class="field"><label>抵達時間</label><input id="f-arr-time" placeholder="11:10" value="${escapeHtml(existingFlight?.arrTime || "")}" /></div>
    </div>
    <div class="field"><label>訂位代碼（選填）</label><input id="f-code" placeholder="PNR" value="${escapeHtml(existingFlight?.bookingCode || "")}" /></div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="選填">${escapeHtml(existingFlight?.note || "")}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>${isEdit ? "儲存修改" : "儲存"}</button>
    </div>
  `, (root) => {
    if (!isEdit) {
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
    }
    root.querySelector("[data-save]").addEventListener("click", () => {
      const values = {
        direction: root.querySelector("#f-dir").value, airline: root.querySelector("#f-airline").value.trim(),
        flightNo: root.querySelector("#f-no").value.trim(), date: root.querySelector("#f-date").value,
        depAirport: root.querySelector("#f-dep-ap").value.trim(), depTime: root.querySelector("#f-dep-time").value.trim(),
        arrAirport: root.querySelector("#f-arr-ap").value.trim(), arrTime: root.querySelector("#f-arr-time").value.trim(),
        bookingCode: root.querySelector("#f-code").value.trim(), note: root.querySelector("#f-note").value.trim(),
      };
      if (isEdit) Object.assign(existingFlight, values);
      else trip.flights.push({ id: uid(), ...values });
      saveJournal(); renderLogistics(); renderDaysView(); closeModal();
    });
  });
}

function openLodgingForm(existingLodging = null) {
  const isEdit = !!existingLodging;
  const trip = currentTrip();
  let placeData = isEdit ? { placeId: existingLodging.placeId, address: existingLodging.address } : null;
  openModal(`
    <h3>${isEdit ? "編輯住宿" : "新增住宿"}</h3>
    ${isEdit ? "" : smartPasteBlockHtml()}
    <div class="field">
      <label>名稱</label>
      <input id="f-name" placeholder="例如：大阪希爾頓飯店" autocomplete="off" value="${escapeHtml(existingLodging?.name || "")}" />
      <p class="field-hint" id="place-hint">${isEdit && existingLodging.address ? "✓ 已鎖定地標" : ""}</p>
    </div>
    <div class="field"><label>地址（選填，若用搜尋會自動帶入）</label><input id="f-addr" placeholder="地址" value="${escapeHtml(existingLodging?.address || "")}" /></div>
    <div class="field"><label>入住日期</label><input id="f-in" type="date" value="${escapeHtml(existingLodging?.checkin || "")}" /></div>
    <div class="field"><label>退房日期</label><input id="f-out" type="date" value="${escapeHtml(existingLodging?.checkout || "")}" /></div>
    <div class="field"><label>訂房代碼（選填）</label><input id="f-code" placeholder="訂房確認碼" value="${escapeHtml(existingLodging?.bookingCode || "")}" /></div>
    <div class="field"><label>電話（選填）</label><input id="f-phone" placeholder="選填" value="${escapeHtml(existingLodging?.phone || "")}" /></div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="選填">${escapeHtml(existingLodging?.note || "")}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>${isEdit ? "儲存修改" : "儲存"}</button>
    </div>
  `, (root) => {
    const nameInput = root.querySelector("#f-name");
    const addrInput = root.querySelector("#f-addr");
    if (isEdit && existingLodging.address) root.querySelector("#place-hint").classList.add("field-hint--ok");
    if (getApiKey()) {
      if (!root.querySelector("#place-hint").textContent) root.querySelector("#place-hint").textContent = "輸入關鍵字可搜尋真實地標";
      tryAttachPlacesAutocomplete(nameInput, (place) => {
        placeData = { placeId: place.place_id, address: place.formatted_address || "" };
        nameInput.value = place.name || nameInput.value;
        addrInput.value = place.formatted_address || addrInput.value;
        { const ph = root.querySelector("#place-hint"); ph.textContent = "✓ 已鎖定地標"; ph.classList.add("field-hint--ok"); }
      });
    }
    if (!isEdit) {
      root.querySelector("#f-parse-btn").addEventListener("click", () => {
        const parsed = parseLodgingText(root.querySelector("#f-paste").value);
        if (parsed.name) nameInput.value = parsed.name;
        if (parsed.checkin) root.querySelector("#f-in").value = parsed.checkin;
        if (parsed.checkout) root.querySelector("#f-out").value = parsed.checkout;
        if (parsed.bookingCode) root.querySelector("#f-code").value = parsed.bookingCode;
        if (parsed.phone) root.querySelector("#f-phone").value = parsed.phone;
      });
    }
    root.querySelector("[data-save]").addEventListener("click", () => {
      const name = nameInput.value.trim();
      if (!name) return;
      const values = {
        name, address: addrInput.value.trim() || placeData?.address || "", placeId: placeData?.placeId || null,
        checkin: root.querySelector("#f-in").value, checkout: root.querySelector("#f-out").value,
        bookingCode: root.querySelector("#f-code").value.trim(), phone: root.querySelector("#f-phone").value.trim(),
        note: root.querySelector("#f-note").value.trim(),
      };
      if (isEdit) Object.assign(existingLodging, values);
      else trip.lodging.push({ id: uid(), ...values });
      saveJournal(); renderLogistics(); renderDaysView(); closeModal();
    });
  });
}

const TRANSPORT_FIELD_CONFIG = {
  "租車": { titleLabel: "租車公司／車型（選填）", titlePh: "例如：Toyota Rent a Car・Yaris", fromLabel: "取車地點", fromPh: "例如：小松機場租車櫃檯", toLabel: "還車地點", toPh: "例如：小松機場租車櫃檯", depLabel: "取車時間", arrLabel: "還車時間", showArr: true },
  "計程車/叫車": { titleLabel: "叫車平台（選填）", titlePh: "例如：GO・Uber", fromLabel: "上車地點", fromPh: "例如：飯店門口", toLabel: "下車地點", toPh: "例如：機場第二航廈", depLabel: "預估時間（選填）", arrLabel: "", showArr: false },
};
const DEFAULT_TRANSPORT_CONFIG = { titleLabel: "名稱／班次（選填）", titlePh: "例如：新幹線 のぞみ 123 號", fromLabel: "出發地", fromPh: "例如：名古屋站", toLabel: "抵達地", toPh: "例如：高山站", depLabel: "出發時間", arrLabel: "抵達時間", showArr: true };
function getTransportConfig(type) { return TRANSPORT_FIELD_CONFIG[type] || DEFAULT_TRANSPORT_CONFIG; }

function transportFieldsHtml(type) {
  const c = getTransportConfig(type);
  return `
    <div class="field"><label>${c.titleLabel}</label><input id="f-title" placeholder="${c.titlePh}" /></div>
    <div class="field"><label>${c.fromLabel}</label><input id="f-from" placeholder="${c.fromPh}" autocomplete="off" /></div>
    <div class="field"><label>${c.depLabel}</label><input id="f-dep-time" placeholder="09:00" /></div>
    ${c.showArr ? `<div class="field"><label>${c.toLabel}</label><input id="f-to" placeholder="${c.toPh}" autocomplete="off" /></div>
    <div class="field"><label>${c.arrLabel}</label><input id="f-arr-time" placeholder="11:30" /></div>` : `<div class="field"><label>${c.toLabel}</label><input id="f-to" placeholder="${c.toPh}" autocomplete="off" /></div>`}
  `;
}

function openTransportForm(existingItem = null) {
  const isEdit = !!existingItem;
  const trip = currentTrip();
  const typeOpts = TRANSPORT_TYPES.map((t) => `<option value="${t}" ${isEdit && existingItem.type===t?"selected":""}>${t}</option>`).join("");
  openModal(`
    <h3>${isEdit ? "編輯交通資訊" : "新增交通資訊"}</h3>
    <div class="field"><label>類型</label><select id="f-type">${typeOpts}</select></div>
    <div id="transportFields"></div>
    <div class="field"><label>日期（選填，填了會顯示在整合行程表當天）</label><input id="f-date" type="date" value="${escapeHtml(existingItem?.date || "")}" /></div>
    <div class="field"><label>確認碼（選填）</label><input id="f-code" placeholder="訂位/租車確認碼" value="${escapeHtml(existingItem?.bookingCode || "")}" /></div>
    <div class="field"><label>備註</label><textarea id="f-note" placeholder="選填">${escapeHtml(existingItem?.note || "")}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn--ghost" data-cancel>取消</button>
      <button class="btn btn--primary" data-save>${isEdit ? "儲存修改" : "儲存"}</button>
    </div>
  `, (root) => {
    const fieldsWrap = root.querySelector("#transportFields");
    let seed = isEdit ? { title: existingItem.title, from: existingItem.from, to: existingItem.to, dep: existingItem.depTime, arr: existingItem.arrTime } : null;
    function attachAutocomplete() {
      const fromInput = root.querySelector("#f-from");
      const toInput = root.querySelector("#f-to");
      if (getApiKey()) {
        if (fromInput) tryAttachPlacesAutocomplete(fromInput, (place) => { fromInput.value = place.name || place.formatted_address || fromInput.value; });
        if (toInput) tryAttachPlacesAutocomplete(toInput, (place) => { toInput.value = place.name || place.formatted_address || toInput.value; });
      }
    }
    function renderFields(type) {
      const prevValues = seed || { title: root.querySelector("#f-title")?.value, from: root.querySelector("#f-from")?.value, to: root.querySelector("#f-to")?.value, dep: root.querySelector("#f-dep-time")?.value, arr: root.querySelector("#f-arr-time")?.value };
      seed = null;
      fieldsWrap.innerHTML = transportFieldsHtml(type);
      if (prevValues.title && root.querySelector("#f-title")) root.querySelector("#f-title").value = prevValues.title;
      if (prevValues.from && root.querySelector("#f-from")) root.querySelector("#f-from").value = prevValues.from;
      if (prevValues.to && root.querySelector("#f-to")) root.querySelector("#f-to").value = prevValues.to;
      if (prevValues.dep && root.querySelector("#f-dep-time")) root.querySelector("#f-dep-time").value = prevValues.dep;
      if (prevValues.arr && root.querySelector("#f-arr-time")) root.querySelector("#f-arr-time").value = prevValues.arr;
      attachAutocomplete();
    }
    renderFields(root.querySelector("#f-type").value);
    root.querySelector("#f-type").addEventListener("change", (e) => renderFields(e.target.value));

    root.querySelector("[data-save]").addEventListener("click", () => {
      const fromInput = root.querySelector("#f-from");
      const toInput = root.querySelector("#f-to");
      const arrInput = root.querySelector("#f-arr-time");
      const values = {
        type: root.querySelector("#f-type").value, title: (root.querySelector("#f-title")?.value || "").trim(),
        date: root.querySelector("#f-date").value, from: (fromInput?.value || "").trim(), to: (toInput?.value || "").trim(),
        depTime: (root.querySelector("#f-dep-time")?.value || "").trim(), arrTime: (arrInput?.value || "").trim(),
        bookingCode: root.querySelector("#f-code").value.trim(), note: root.querySelector("#f-note").value.trim(),
      };
      if (isEdit) Object.assign(existingItem, values);
      else trip.transportItems.push({ id: uid(), ...values });
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
        <p class="field-hint">把連結傳給朋友，他們點開就會自動加入這趟旅遊，不用輸入任何東西：</p>
        <button class="btn btn--primary btn--block" id="s-share-link">🔗 分享連結給朋友</button>
        <p class="field-hint" style="margin-top:10px;">或者也可以只給代碼，讓對方自己到首頁「加入共編旅遊」輸入：</p>
        <p class="sync-code">${trip.syncCode}</p>
        <button class="btn btn--ghost" id="s-copy-code">📋 複製代碼</button>
        <p class="field-hint" id="syncStatusLine"></p>
        <button class="btn btn--ghost" id="s-force-sync" style="margin-top:8px;">🔄 立即重新連線並同步一次</button>
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
    form.querySelector("#s-share-link").addEventListener("click", async () => {
      const link = buildSyncShareLink(trip.syncCode);
      const btn = form.querySelector("#s-share-link");
      if (navigator.share) {
        try {
          await navigator.share({ title: `一起編輯「${trip.title}」`, text: "點這個連結加入我們的旅遊行程，一起編輯行程和記帳：", url: link });
          return;
        } catch (e) { /* 使用者取消分享，或裝置不支援，改用複製 */ }
      }
      try { await navigator.clipboard.writeText(link); btn.textContent = "已複製連結 ✓"; } catch (e) { btn.textContent = "複製失敗，請手動複製"; }
      setTimeout(() => { btn.textContent = "🔗 分享連結給朋友"; }, 1800);
    });
    form.querySelector("#s-copy-code").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(trip.syncCode); } catch (e) { /* ignore */ }
      const btn = form.querySelector("#s-copy-code");
      btn.textContent = "已複製 ✓";
      setTimeout(() => { btn.textContent = "📋 複製代碼"; }, 1500);
    });
    form.querySelector("#s-force-sync").addEventListener("click", () => {
      setSyncStatus("syncing", "");
      subscribeTripSync(trip);
      pushTripToCloud(trip);
    });
    form.querySelector("#s-stop-sync").addEventListener("click", () => {
      if (confirm("確定要停止同步嗎？此裝置之後的變更就不會再跟其他人同步。")) disableSync(currentTrip());
    });
    const statusLine = form.querySelector("#syncStatusLine");
    if (statusLine) renderSyncStatusLine(statusLine);
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
    t.days.push({ id: uid(), label: `Day ${t.days.length + 1}`, date: nextDate, journal: "", stops: [], weatherCache: null });
    t.dayCount = t.days.length;
    saveJournal(); renderSettings(); renderDaysView(); renderTripHeader();
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
/* ===================== 刪除保護（可復原） ===================== */
let undoTimeoutId = null;
function showUndoToast(message, restoreFn) {
  clearTimeout(undoTimeoutId);
  const toast = $("#undoToast");
  if (!toast) return;
  toast.innerHTML = `<span class="undo-toast__msg">${escapeHtml(message)}</span><button class="undo-toast__btn" id="undoBtn">復原</button>`;
  toast.hidden = false;
  const btn = toast.querySelector("#undoBtn");
  btn.onclick = () => {
    clearTimeout(undoTimeoutId);
    toast.hidden = true;
    restoreFn();
  };
  undoTimeoutId = setTimeout(() => { toast.hidden = true; }, 5000);
}
function deleteWithUndo(array, item, message, onChange) {
  const idx = array.indexOf(item);
  if (idx === -1) return;
  array.splice(idx, 1);
  saveJournal();
  onChange();
  showUndoToast(message, () => {
    array.splice(idx, 0, item);
    saveJournal();
    onChange();
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
  initFirebaseIfConfigured();
  initTabbar();
  initFormTriggers();
  initInstallBanner();
  renderHome();

  const params = new URLSearchParams(location.search);
  if (params.get("join")) {
    tryAutoJoinFromUrl();
  } else if (params.get("action") === "new") {
    openTripForm(); history.replaceState(null, "", "./");
  }

  $("#backHome").addEventListener("click", goHome);
  $("#openSettings").addEventListener("click", () => switchView("settings"));
  $("#fetchRateBtn").addEventListener("click", fetchLiveRate);
  $("#exportCsvBtn").addEventListener("click", () => { const trip = currentTrip(); if (trip) exportExpensesCSV(trip); });
  $("#itinerarySearch").addEventListener("input", (e) => renderItinerarySearch(e.target.value));
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
