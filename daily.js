(function(){
  const KEY_DAILY = "mathZooDaily";

  function todayKey(){
    return new Date().toLocaleDateString("sv-SE");
  }

  function makeDaily(){
    return {
      date: todayKey(),
      claimed: false,
      plan: {
        enabled: {
          eq: true,
          mult: true,
          frac: true,
          percent: true,
          prefix: true,
          unit: true,
          pow10: true,
          stats: true
        },
        targets: {
          eq: 2,
          mult: 3,
          frac: 2,
          percent: 2,
          prefix: 2,
          unit: 2,
          pow10: 1,
          stats: 1
        }
      },
      counts: {
        eq: 0,
        mult: 0,
        frac: 0,
        percent: 0,
        prefix: 0,
        unit: 0,
        pow10: 0,
        stats: 0
      }
    };
  }

  window.mzLoadDaily = function(){
    let d = null;

    try {
      d = JSON.parse(localStorage.getItem(KEY_DAILY) || "null");
    } catch {
      d = null;
    }

    if(!d || d.date !== todayKey()){
      d = makeDaily();
      localStorage.setItem(KEY_DAILY, JSON.stringify(d));
    }

    return d;
  };

  window.mzSaveDaily = function(d){
    localStorage.setItem(KEY_DAILY, JSON.stringify(d));
  };

  window.mzDailyIncrement = function(type, amount){
    const d = window.mzLoadDaily();
    amount = amount || 1;

    if(!d.counts) d.counts = {};
    if(typeof d.counts[type] !== "number") d.counts[type] = 0;

    d.counts[type] += amount;
    window.mzSaveDaily(d);
  };
})();
