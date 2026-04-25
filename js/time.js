let debug = false;
let offset = 0;
let interval = null;

function now() {
  return new Date(Date.now() + offset);
}

function formatDate(d) {
  return d.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

export function getTimeState() {
  const d = now();

  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();
  const month = d.getMonth();

  let phase;
  if (hour >= 5 && hour < 9) phase = "dawn";
  else if (hour >= 9 && hour < 17) phase = "day";
  else if (hour >= 17 && hour < 20) phase = "evening";
  else phase = "night";

  let season;
  if (month <= 1 || month === 11) season = "winter";
  else if (month <= 4) season = "spring";
  else if (month <= 8) season = "summer";
  else season = "autumn";

  const isDay = phase !== "night";
  const formattedDate = formatDate(d);

  return {
    hour,
    minute,
    second,
    month,
    phase,
    season,
    isDay,
    formattedDate
  };
}

export const __timeDebug = {
  enable() { debug = true; },
  disable() { debug = false; offset = 0; },
  set(h, m = 0, s = 0) {
    const d = new Date();
    d.setHours(h, m, s, 0);
    offset = d.getTime() - Date.now();
    debug = true;
  },
  tick(ms) {
    if (!debug) return;
    offset += ms;
  },
  isEnabled() {
    return debug;
  }
};

export function subscribeTime(cb) {
  if (interval) return () => clearInterval(interval);

  cb(getTimeState());

  interval = setInterval(() => {
    cb(getTimeState());
  }, 1000);

  return () => {
    clearInterval(interval);
    interval = null;
  };
}