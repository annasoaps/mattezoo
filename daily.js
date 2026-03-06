/* =========================================================
   Mattezoo - Daily Quests (daily.js)
   Stöd för:
   eq, mult, frac, percent, prefix, unit, pow10

   Regler:
   - Varje dag skapas ett nytt uppdrag
   - Några spel väljs ut slumpmässigt
   - Totalt antal uppgifter över alla spel = max 15
   - Daily Blind Bag kan öppnas när allt är klart
========================================================= */

(function () {
  const KEY_DAILY = "mathZooDaily";
  const TYPES = ["eq", "mult", "frac", "percent", "prefix", "unit", "pow10"];
  const MAX_TOTAL = 15;

  function todayKey() {
    return new Date().toLocaleDateString("sv-SE");
  }

  function seedFromString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function emptyDaily(dateStr) {
    return {
      date: dateStr,
      claimed: false,
      plan: {
        enabled: {
          eq: false,
          mult: false,
          frac: false,
          percent: false,
          prefix: false,
          unit: false,
          pow10: false
        },
        targets: {
          eq: 0,
          mult: 0,
          frac: 0,
          percent: 0,
          prefix: 0,
          unit: 0,
          pow10: 0
        }
      },
      counts: {
        eq: 0,
        mult: 0,
        frac: 0,
        percent: 0,
        prefix: 0,
        unit: 0,
        pow10: 0
      }
    };
  }

  function makePlanForToday(dateStr) {
    const rnd = mulberry32(seedFromString("daily|" + dateStr));
    const d = emptyDaily(dateStr);

    const numGames = 3 + Math.floor(rnd() * 3);
    const picked = shuffle(TYPES, rnd).slice(0, numGames);

    let remaining = MAX_TOTAL;

    picked.forEach((type, idx) => {
      d.plan.enabled[type] = true;

      const leftGames = picked.length - idx;
      const minHere = 2;
      const maxHere = Math.min(5, remaining - (leftGames - 1) * 2);

      let target;
      if (leftGames === 1) {
        target = remaining;
      } else {
        target = minHere + Math.floor(rnd() * (maxHere - minHere + 1));
      }

      d.plan.targets[type] = target;
      remaining -= target;
    });

    return d;
  }

  function normalizeDaily(d) {
    const dateStr = todayKey();
    if (!d || typeof d !== "object") return makePlanForToday(dateStr);

    if (d.date !== dateStr) return makePlanForToday(dateStr);

    d.plan = d.plan || { enabled: {}, targets: {} };
    d.plan.enabled = d.plan.enabled || {};
    d.plan.targets = d.plan.targets || {};
    d.counts = d.counts || {};

    for (const t of TYPES) {
      if (typeof d.plan.enabled[t] !== "boolean") d.plan.enabled[t] = false;
      if (typeof d.plan.targets[t] !== "number") d.plan.targets[t] = 0;
      if (typeof d.counts[t] !== "number") d.counts[t] = 0;
    }

    if (typeof d.claimed !== "boolean") d.claimed = false;
    if (typeof d.date !== "string") d.date = dateStr;

    return d;
  }

  function loadDaily() {
    const raw = localStorage.getItem(KEY_DAILY);
    let parsed = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }

    const d = normalizeDaily(parsed);
    localStorage.setItem(KEY_DAILY, JSON.stringify(d));
    return d;
  }

  function saveDaily(d) {
    localStorage.setItem(KEY_DAILY, JSON.stringify(normalizeDaily(d)));
  }

  function dailyIncrement(type, amount = 1) {
    if (!TYPES.includes(type)) return;

    const d = loadDaily();
    if (!d.plan.enabled[type]) return;

    d.counts[type] = (d.counts[type] || 0) + amount;

    const max = d.plan.targets[type] || 0;
    if (d.counts[type] > max) d.counts[type] = max;

    saveDaily(d);
  }

  window.mzLoadDaily = loadDaily;
  window.mzSaveDaily = saveDaily;
  window.mzDailyIncrement = dailyIncrement;
})();
