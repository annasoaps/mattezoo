/* =========================================================
   Mattezoo - Today Log (today.js)
   Syfte: Visa "I dag har jag gjort" på index.html

   Loggar:
   - Ekvationer: räknare (counts.eq)
   - Bråk↔Decimal: räknare (counts.frac)
   - Prefix – para ihop: räknare (counts.prefix)
   - Enhetsomvandling: räknare (counts.unit)
   - Multiplikation: tabeller per tabell (tables["3"] = 6)

   Nyckel i localStorage:
     "mathZooToday"
========================================================= */

(function () {
  const KEY_TODAY = "mathZooToday";
  const COUNT_TYPES = ["eq", "frac", "prefix", "unit"];

  function todayKey() {
    // sv-SE ger YYYY-MM-DD
    return new Date().toLocaleDateString("sv-SE");
  }

  function safeParse(json, fallback) {
    try { return JSON.parse(json); } catch { return fallback; }
  }

  function normalizeToday(obj) {
    if (!obj || typeof obj !== "object") obj = {};

    if (typeof obj.date !== "string") obj.date = todayKey();

    if (!obj.counts || typeof obj.counts !== "object") obj.counts = {};
    if (!obj.tables || typeof obj.tables !== "object") obj.tables = {};

    for (const t of COUNT_TYPES) {
      if (typeof obj.counts[t] !== "number") obj.counts[t] = 0;
    }

    return obj;
  }

  function ensureTodayExists() {
    const t = todayKey();
    let obj = safeParse(localStorage.getItem(KEY_TODAY) || "null", null);

    if (!obj || obj.date !== t) {
      obj = {
        date: t,
        counts: { eq: 0, frac: 0, prefix: 0, unit: 0 },
        tables: {}
      };
      obj = normalizeToday(obj);
      localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
      return obj;
    }

    // bakåtkompat + härdning
    obj = normalizeToday(obj);
    localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
    return obj;
  }

  function mzLoadToday() {
    return ensureTodayExists();
  }

  function mzSaveToday(obj) {
    obj = normalizeToday(obj);
    localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
  }

  // Räknare: eq / frac / prefix / unit
  function mzTodayIncrement(type, amount = 1) {
    const obj = ensureTodayExists();
    if (!COUNT_TYPES.includes(type)) return;

    obj.counts[type] += amount;
    mzSaveToday(obj);
  }

  // Multiplikation: logga tabell (t.ex. 3, 6, 9...)
  function mzTodayAddTable(tableNumber, amount = 1) {
    const obj = ensureTodayExists();

    const n = Number(tableNumber);
    if (!Number.isFinite(n) || n <= 0) return;

    const key = String(n);
    if (typeof obj.tables[key] !== "number") obj.tables[key] = 0;
    obj.tables[key] += amount;

    mzSaveToday(obj);
  }

  // (valfritt) nolla dagens logg manuellt
  function mzTodayReset() {
    const t = todayKey();
    const obj = {
      date: t,
      counts: { eq: 0, frac: 0, prefix: 0, unit: 0 },
      tables: {}
    };
    localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
    return obj;
  }

  // Exponera globalt
  window.mzLoadToday = mzLoadToday;
  window.mzSaveToday = mzSaveToday;
  window.mzTodayIncrement = mzTodayIncrement; // eq, frac, prefix, unit
  window.mzTodayAddTable = mzTodayAddTable;   // multiplikation per tabell
  window.mzTodayReset = mzTodayReset;
})();
