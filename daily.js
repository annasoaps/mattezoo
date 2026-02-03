/* =========================================================
   Mattezoo - Daily Quests (daily.js)
   Laddas av index.html + spelsidorna.

   Använd i spel när eleven "vinner":
     mzDailyIncrement("eq",   1);   // ekvationer
     mzDailyIncrement("mult", 1);   // multiplikation
     mzDailyIncrement("frac", 1);   // bråk<->decimal (proffsläge)

   Om du vill läsa av status i spel:
     const d = mzLoadDaily();
     console.log(d);

   Nyckel i localStorage:
     "mathZooDaily"
========================================================= */

(function () {
  const KEY_DAILY = "mathZooDaily";

  function todayKey() {
    // sv-SE ger YYYY-MM-DD
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
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randInt(rnd, min, max) {
    return Math.floor(rnd() * (max - min + 1)) + min;
  }

  // Planen varierar per dag men är stabil under dagen (samma datum => samma plan)
  function generateDailyPlan(dateStr) {
    const rnd = mulberry32(seedFromString("mattezoo|" + dateStr));

    // 60%: alla tre, annars: två av tre
    const useAll = rnd() < 0.60;
    const includeFrac = useAll ? true : (rnd() < 0.50);

    const eqTarget = randInt(rnd, 2, 5);    // 2–5
    const multTarget = randInt(rnd, 2, 5);  // 2–5
    const fracTarget = includeFrac ? 1 : 0; // 1 eller 0

    let eqEnabled = true,
      multEnabled = true,
      fracEnabled = fracTarget > 0;

    if (!useAll) {
      // Om bråk är med: pausa antingen eq eller mult (men inte båda)
      if (fracEnabled) {
        if (rnd() < 0.5) eqEnabled = false;
        else multEnabled = false;
      }
      // Om bråk inte är med => eq+mult på
    }

    return {
      enabled: { eq: eqEnabled, mult: multEnabled, frac: fracEnabled },
      targets: {
        eq: eqEnabled ? eqTarget : 0,
        mult: multEnabled ? multTarget : 0,
        frac: fracEnabled ? 1 : 0,
      },
    };
  }

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  function ensureDailyExists() {
    const t = todayKey();
    let d = safeParse(localStorage.getItem(KEY_DAILY) || "null", null);

    if (!d || d.date !== t) {
      d = {
        date: t,
        plan: generateDailyPlan(t),
        counts: { eq: 0, mult: 0, frac: 0 },
        claimed: false,
      };
      localStorage.setItem(KEY_DAILY, JSON.stringify(d));
    }
    return d;
  }

  function mzLoadDaily() {
    return ensureDailyExists();
  }

  function mzSaveDaily(d) {
    localStorage.setItem(KEY_DAILY, JSON.stringify(d));
  }

  // Öka dagens räknare (nollställs automatiskt när datum byts)
  function mzDailyIncrement(type, amount = 1) {
    const d = ensureDailyExists();

    if (!d.counts || typeof d.counts !== "object") return;
    if (d.counts[type] === undefined) return;

    d.counts[type] += amount;
    mzSaveDaily(d);
  }

  // Hjälpfunktion: är dagens uppdrag klart?
  function mzDailyIsComplete() {
    const d = ensureDailyExists();
    const tg = d.plan.targets;
    const c = d.counts;

    const eqDone = Math.min(c.eq, tg.eq);
    const multDone = Math.min(c.mult, tg.mult);
    const fracDone = Math.min(c.frac, tg.frac);

    return eqDone >= tg.eq && multDone >= tg.mult && fracDone >= tg.frac;
  }

  // Exponera globalt (så både index och spel kan använda)
  window.mzDailyIncrement = mzDailyIncrement;
  window.mzLoadDaily = mzLoadDaily;
  window.mzSaveDaily = mzSaveDaily;
  window.mzDailyIsComplete = mzDailyIsComplete;
  window.mzTodayKey = todayKey;
})();
