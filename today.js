/* =========================================================
   Mattezoo - Today log (today.js)
   Sparar vad eleven gjort idag.
========================================================= */

(function () {
  const KEY_TODAY = "mathZooToday";
  const TYPES = ["eq", "frac", "percent", "prefix", "unit", "pow10"];

  function todayKey() {
    return new Date().toLocaleDateString("sv-SE");
  }

  function emptyToday(dateStr) {
    return {
      date: dateStr,
      counts: {
        eq: 0,
        frac: 0,
        percent: 0,
        prefix: 0,
        unit: 0,
        pow10: 0
      },
      tables: {}
    };
  }

  function normalizeToday(t) {
    const dateStr = todayKey();
    if (!t || typeof t !== "object") return emptyToday(dateStr);
    if (t.date !== dateStr) return emptyToday(dateStr);

    t.counts = t.counts || {};
    for (const type of TYPES) {
      if (typeof t.counts[type] !== "number") t.counts[type] = 0;
    }

    if (!t.tables || typeof t.tables !== "object") t.tables = {};
    if (typeof t.date !== "string") t.date = dateStr;

    return t;
  }

  function loadToday() {
    const raw = localStorage.getItem(KEY_TODAY);
    let parsed = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }

    const t = normalizeToday(parsed);
    localStorage.setItem(KEY_TODAY, JSON.stringify(t));
    return t;
  }

  function saveToday(t) {
    localStorage.setItem(KEY_TODAY, JSON.stringify(normalizeToday(t)));
  }

  function todayIncrement(type, amount = 1, table = null) {
    const t = loadToday();

    if (type === "mult") {
      const key = String(table ?? "");
      if (key) {
        t.tables[key] = (t.tables[key] || 0) + amount;
      }
      saveToday(t);
      return;
    }

    if (!TYPES.includes(type)) return;

    t.counts[type] = (t.counts[type] || 0) + amount;
    saveToday(t);
  }

  window.mzLoadToday = loadToday;
  window.mzSaveToday = saveToday;
  window.mzTodayIncrement = todayIncrement;
})();
