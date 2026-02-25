/* =========================================================
   Mattezoo - Daily Quests (daily.js)
   Laddas av index.html + spelsidorna.

   Använd i spel när eleven "vinner":
     mzDailyIncrement("eq",     1);   // ekvationer
     mzDailyIncrement("mult",   1);   // multiplikation
     mzDailyIncrement("frac",   1);   // bråk<->decimal (proffsläge)
     mzDailyIncrement("prefix", 1);   // prefix - para ihop
     mzDailyIncrement("unit",   1);   // enhetsomvandling

   Om du vill läsa av status i spel:
     const d = mzLoadDaily();
     console.log(d);

   Nyckel i localStorage:
     "mathZooDaily"
========================================================= */

(function () {
  const KEY_DAILY = "mathZooDaily";
  const TYPES = ["eq", "mult", "frac", "prefix", "unit"];

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

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  function normalizeDaily(d) {
    // säkerställ struktur + bakåtkompat
    if (!d || typeof d !== "object") d = {};

    if (typeof d.date !== "string") d.date = todayKey();
    if (typeof d.claimed !== "boolean") d.claimed = false;

    if (!d.plan || typeof d.plan !== "object") d.plan = {};
    if (!d.plan.enabled || typeof d.plan.enabled !== "object") d.plan.enabled = {};
    if (!d.plan.targets || typeof d.plan.targets !== "object") d.plan.targets = {};

    if (!d.counts || typeof d.counts !== "object") d.counts = {};

    for (const t of TYPES) {
      if (typeof d.plan.enabled[t] !== "boolean") d.plan.enabled[t] = false;
      if (typeof d.plan.targets[t] !== "number") d.plan.targets[t] = 0;
      if (typeof d.counts[t] !== "number") d.counts[t] = 0;
    }

    return d;
  }

  // Planen varierar per dag men är stabil under dagen (samma datum => samma plan)
  function generateDailyPlan(dateStr) {
    const rnd = mulberry32(seedFromString("mattezoo|" + dateStr));

    // Grund: eq+mult "bas", och ibland extra (frac/prefix/unit)
    // 60%: ha fler uppdrag samma dag, annars lite färre
    const useMany = rnd() < 0.60;

    // Bas-uppdrag
    const eqTarget = randInt(rnd, 2, 5);
    const multTarget = randInt(rnd, 2, 5);

    // Extra-uppdrag (binära eller små mål)
    const includeFrac = useMany ? true : (rnd() < 0.45);
    const includePrefix = useMany ? (rnd() < 0.70) : (rnd() < 0.35);
    const includeUnit = useMany ? (rnd() < 0.70) : (rnd() < 0.35);

    const fracTarget = includeFrac ? 1 : 0;                 // 1 eller 0
    const prefixTarget = includePrefix ? randInt(rnd, 3, 6) : 0; // 3–6
    const unitTarget = includeUnit ? randInt(rnd, 3, 6) : 0;     // 3-6

    // Enabled flags
    let eqEnabled = true;
    let multEnabled = true;
    let fracEnabled = fracTarget > 0;
    let prefixEnabled = prefixTarget > 0;
    let unitEnabled = unitTarget > 0;

    // Om det inte är "många", gör planen lite snällare:
    // ibland stäng av eq eller mult om flera extra är på
    if (!useMany) {
      const extrasOn = [fracEnabled, prefixEnabled, unitEnabled].filter(Boolean).length;

      if (extrasOn >= 2) {
        // pausa antingen eq eller mult så det inte blir för mycket
        if (rnd() < 0.5) eqEnabled = false;
        else multEnabled = false;
      } else if (extrasOn === 1) {
        // ibland stäng av en extra också (för variation)
        if (fracEnabled && rnd() < 0.20) fracEnabled = false;
        if (prefixEnabled && rnd() < 0.20) prefixEnabled = false;
        if (unitEnabled && rnd() < 0.20) unitEnabled = false;
      }
    }

    return {
      enabled: {
        eq: eqEnabled,
        mult: multEnabled,
        frac: fracEnabled,
        prefix: prefixEnabled,
        unit: unitEnabled,
      },
      targets: {
        eq: eqEnabled ? eqTarget : 0,
        mult: multEnabled ? multTarget : 0,
        frac: fracEnabled ? 1 : 0,
        prefix: prefixEnabled ? prefixTarget : 0,
        unit: unitEnabled ? unitTarget : 0,
      },
    };
  }

  function ensureDailyExists() {
    const t = todayKey();
    let d = safeParse(localStorage.getItem(KEY_DAILY) || "null", null);

    // ny dag eller saknas
    if (!d || d.date !== t) {
      d = {
        date: t,
        plan: generateDailyPlan(t),
        counts: { eq: 0, mult: 0, frac: 0, prefix: 0, unit: 0 },
        claimed: false,
      };
      d = normalizeDaily(d);
      localStorage.setItem(KEY_DAILY, JSON.stringify(d));
      return d;
    }

    // samma dag: patcha om något saknas
    d = normalizeDaily(d);

    // om plan saknar nycklar (t.ex. äldre sparning), regenerera INTE,
    // men se till att targets/enabled finns. (normalizeDaily fixar default 0/false)
    // Om du vill vara extra snäll kan du "adoptera" dagens plan om den var tom:
    if (!d.plan || !d.plan.enabled || !d.plan.targets) {
      d.plan = generateDailyPlan(t);
      d = normalizeDaily(d);
    }

    localStorage.setItem(KEY_DAILY, JSON.stringify(d));
    return d;
  }

  function mzLoadDaily() {
    return ensureDailyExists();
  }

  function mzSaveDaily(d) {
    d = normalizeDaily(d);
    localStorage.setItem(KEY_DAILY, JSON.stringify(d));
  }

  // Öka dagens räknare (nollställs automatiskt när datum byts)
  function mzDailyIncrement(type, amount = 1) {
    const d = ensureDailyExists();

    if (!TYPES.includes(type)) return;

    d.counts[type] += amount;
    mzSaveDaily(d);
  }

  // Hjälpfunktion: är dagens uppdrag klart?
  function mzDailyIsComplete() {
    const d = ensureDailyExists();
    const tg = d.plan.targets;
    const c = d.counts;

    for (const t of TYPES) {
      const done = Math.min(c[t], tg[t]);
      if (done < tg[t]) return false;
    }
    return true;
  }

  // Exponera globalt (så både index och spel kan använda)
  window.mzDailyIncrement = mzDailyIncrement;
  window.mzLoadDaily = mzLoadDaily;
  window.mzSaveDaily = mzSaveDaily;
  window.mzDailyIsComplete = mzDailyIsComplete;
  window.mzTodayKey = todayKey;
})();
