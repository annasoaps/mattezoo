/* =========================================================
   Mattezoo - Today Log (today.js)
   Syfte: Visa "I dag har jag gjort" på index.html

   Nyckel i localStorage:
     "mathZooToday"
========================================================= */

(function () {
  const KEY_TODAY = "mathZooToday";

  function todayKey() {
    return new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
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
        counts: { eq: 0, frac: 0, unit: 0, prefix: 0 },
        tables: {} // { "3": 6, "6": 2, ... }
      };
      localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
    }

    // Härdning + bakåtkompatibilitet
    if (!obj.counts || typeof obj.counts !== "object") obj.counts = {};
    if (!obj.tables || typeof obj.tables !== "object") obj.tables = {};

    if (typeof obj.counts.eq !== "number") obj.counts.eq = 0;
    if (typeof obj.counts.frac !== "number") obj.counts.frac = 0;
    if (typeof obj.counts.unit !== "number") obj.counts.unit = 0;
    if (typeof obj.counts.prefix !== "number") obj.counts.prefix = 0;

    return obj;
  }

  function mzLoadToday() {
    return ensureTodayExists();
  }

  function mzSaveToday(obj) {
    localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
  }

  // eq, frac, unit, prefix
  function mzTodayIncrement(type, amount = 1) {
    const obj = ensureTodayExists();
    if (!obj.counts || obj.counts[type] === undefined) return;
    obj.counts[type] += amount;
    mzSaveToday(obj);
  }

  // multiplikation per tabell
  function mzTodayAddTable(tableNumber, amount = 1) {
    const obj = ensureTodayExists();

    const n = Number(tableNumber);
    if (!Number.isFinite(n) || n <= 0) return;

    const key = String(n);
    if (typeof obj.tables[key] !== "number") obj.tables[key] = 0;
    obj.tables[key] += amount;

    mzSaveToday(obj);
  }

  function mzTodayReset() {
    const t = todayKey();
    const obj = { date: t, counts: { eq: 0, frac: 0, unit: 0, prefix: 0 }, tables: {} };
    localStorage.setItem(KEY_TODAY, JSON.stringify(obj));
    return obj;
  }

  window.mzLoadToday = mzLoadToday;
  window.mzSaveToday = mzSaveToday;
  window.mzTodayIncrement = mzTodayIncrement;
  window.mzTodayAddTable = mzTodayAddTable;
  window.mzTodayReset = mzTodayReset;
})();
