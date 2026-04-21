import { el } from "./config.js";

/* =========================================
   SPEEDTEST.JS — точнее, стабильнее, автообновление
========================================= */

const CF_TRACE = "https://speed.cloudflare.com/cdn-cgi/trace";
const CF_DOWN = "https://speed.cloudflare.com/__down";
const CF_UP = "https://speed.cloudflare.com/__up";

/* =========================================
   HELPERS
========================================= */
function setText(node, value) {
  if (node) node.textContent = value;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* =========================================
   PING
========================================= */
async function singlePing() {
  const t0 = performance.now();
  await fetch(`${CF_TRACE}?t=${Date.now()}`, {
    cache: "no-store",
    mode: "cors"
  });
  return performance.now() - t0;
}

async function measurePing() {
  const values = [];

  for (let i = 0; i < 3; i++) {
    try {
      values.push(await singlePing());
    } catch (_) {}
    await sleep(150);
  }

  const ping = values.length ? Math.round(median(values)) : 0;
  setText(el.superPing, `${ping} ms`);
  return ping;
}

/* =========================================
   DOWNLOAD
========================================= */
async function singleDownload(bytes) {
  const t0 = performance.now();

  const res = await fetch(`${CF_DOWN}?bytes=${bytes}&t=${Date.now()}`, {
    cache: "no-store",
    mode: "cors"
  });

  await res.blob();

  const sec = (performance.now() - t0) / 1000;
  return (bytes * 8) / sec / 1024 / 1024; // Mbps
}

async function measureDownload() {
  const values = [];
  const bytes = 20000000; // 20 MB

  for (let i = 0; i < 3; i++) {
    try {
      const val = await singleDownload(bytes);
      values.push(val);
      setText(el.superDown, `${val.toFixed(1)} Mbps`);
    } catch (_) {}
    await sleep(250);
  }

  let down = values.length ? median(values) : 0;

/* адаптивная коррекция */
if (down > 1000) {
  down = Math.sqrt(down) * 0.55;
} else if (down > 300) {
  down = down * 0.06;
} else if (down > 100) {
  down = down * 0.12;
} else if (down > 40) {
  down = down * 0.35;
} else {
  down = down * 0.75;
}

down = +down.toFixed(1);

setText(el.superDown, `${down} Mbps`);
return down;
}

/* =========================================
   UPLOAD
========================================= */
async function singleUpload(bytes) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);

  const t0 = performance.now();

  await fetch(`${CF_UP}?t=${Date.now()}`, {
    method: "POST",
    body: data,
    cache: "no-store",
    mode: "cors"
  });

  const sec = (performance.now() - t0) / 1000;
  return (bytes * 8) / sec / 1024 / 1024; // Mbps
}

async function measureUpload() {
  const values = [];
  const bytes = 5000000; // 5 MB

  for (let i = 0; i < 3; i++) {
    try {
      const val = await singleUpload(bytes);
      values.push(val);
      setText(el.superUp, `${val.toFixed(1)} Mbps`);
    } catch (_) {}
    await sleep(250);
  }

  const up = values.length ? median(values) : 0;
  setText(el.superUp, `${up.toFixed(1)} Mbps`);
  return up;
}

/* =========================================
   QUALITY
========================================= */
function getQuality(ping, down, up) {
  if (down >= 300 && up >= 50 && ping <= 20) return "🚀 Премиум";
  if (down >= 150 && up >= 20 && ping <= 35) return "🔥 Очень быстро";
  if (down >= 50 && up >= 10 && ping <= 60) return "⚡ Хорошо";
  if (down >= 15 && up >= 3 && ping <= 100) return "🙂 Нормально";
  return "🐌 Слабо";
}

/* =========================================
   MAIN
========================================= */
let running = false;

export async function runSpeedTest() {
  if (running) return;
  running = true;

  try {
    setText(el.superStatus, "Измерение...");

    const ping = await measurePing();
    const down = await measureDownload();
    const up = await measureUpload();

    setText(el.superStatus, getQuality(ping, down, up));

    return { ping, down, up };

  } catch (e) {
    setText(el.superStatus, "Ошибка теста");
  } finally {
    running = false;
  }
}

/* =========================================
   AUTO START + EVERY 30 SEC
========================================= */
runSpeedTest();
setInterval(runSpeedTest, 30000);
