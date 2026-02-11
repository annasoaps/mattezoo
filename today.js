/* =========================================================
   Mattezoo - Today Log (today.js)
   Syfte: Visa "I dag har jag gjort" på index.html
   - Ekvationer: räknare
   - Bråk↔Decimal: räknare
   - Multiplikation: tabeller per tabell (t.ex. 3:ans tabell: 6 ggr)

   Nyckel i localStorage:
     "mathZooToday"
========================================================= */

(function () {
  const KEY_TODAY = "mathZooToday";

  function todayKey() {
    // sv-SE ger YYYY-MM-DD
    return new Date().toLocaleDateString("sv-SE");
  }

  function safeParse(json, fallback) {
    try { return JSON.parse(json); } catch { return fallback; }
  }

  function ensureTodayExists() {
    const t = todayKey();
    let obj = safeParse(localStorage.getItem(KEY_TODAY) || "null", null);

    if (!obj || obj.date !== t) {
      obj = {
        date: t,
        counts: { eq: 0, frac: 0 },
        tables: {} // { "3": 6, "6": 2, ... }
      };
      localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
    }

    // härdning om någon gammal version ligger kvar
    if (!obj.counts || typeof obj.counts !== "object") obj.counts = { eq: 0, frac: 0 };
    if (!obj.tables || typeof obj.tables !== "object") obj.tables = {};

    if (typeof obj.counts.eq !== "number") obj.counts.eq = 0;
    if (typeof obj.counts.frac !== "number") obj.counts.frac = 0;

    return obj;
  }

  function mzLoadToday() {
    return ensureTodayExists();
  }

  function mzSaveToday(obj) {
    localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
  }

  function mzTodayIncrement(type, amount = 1) {
    const obj = ensureTodayExists();
    if (!obj.counts || obj.counts[type] === undefined) return;
    obj.counts[type] += amount;
    mzSaveToday(obj);
  }

  // Viktig: logga tabell (t.ex. 3, 6, 9...)
  function mzTodayAddTable(tableNumber, amount = 1) {
    const obj = ensureTodayExists();

    const n = Number(tableNumber);
    if (!Number.isFinite(n) || n <= 0) return;

    const key = String(n);
    if (typeof obj.tables[key] !== "number") obj.tables[key] = 0;
    obj.tables[key] += amount;

    mzSaveToday(obj);
  }

  // (valfritt) om du vill kunna nolla dagens logg manuellt
  function mzTodayReset() {
    const t = todayKey();
    const obj = { date: t, counts: { eq: 0, frac: 0 }, tables: {} };
    localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
    return obj;
  }

  // Exponera globalt
  window.mzLoadToday = mzLoadToday;
  window.mzSaveToday = mzSaveToday;
  window.mzTodayIncrement = mzTodayIncrement; // eq, frac
  window.mzTodayAddTable = mzTodayAddTable;   // multiplikation per tabell
  window.mzTodayReset = mzTodayReset;
})();
