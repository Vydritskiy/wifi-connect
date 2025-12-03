/* =========================================
   SPEEDTEST.JS — тест скорости интернет-соединения
   ========================================= */

import { el } from "./config.js";


// ==========================
// PING
// ==========================
async function measurePing() {
  let ping = 0;

  try {
    const t0 = performance.now();
    await fetch("https://cloudflare.com", { mode: "no-cors" });
    ping = Math.round(performance.now() - t0);
  } catch (e) {
    ping = 0;
  }

  el.superPing.textContent = ping + " ms";
  return ping;
}



// ==========================
// DOWNLOAD SPEED
// ==========================
async function measureDownload() {
  let down = 0;

  try {
    const size = 20000000; // 20MB тестовый файл
    const t0 = performance.now();
    await fetch(`https://speed.cloudflare.com/__down?bytes=${size}`);
    const t1 = performance.now();

    down = (size / ((t1 - t0) / 1000)) / 1024 / 1024; // MB/s
  } catch (e) {
    down = 0;
  }

  down = +down.toFixed(1);
  el.superDown.textContent = down + " МБ/с";

  return down;
}



// ==========================
// UPLOAD SPEED
// ==========================
async function measureUpload() {
  let up = 0;

  try {
    const sizeUp = 1000000; // 1MB
    const data = new Uint8Array(sizeUp);

    const t0 = performance.now();
    await fetch("https://speed.cloudflare.com/__up", {
      method: "POST",
      body: data
    });
    const t1 = performance.now();

    up = (sizeUp / ((t1 - t0) / 1000)) / 1024 / 1024;
  } catch (e) {
    up = 0;
  }

  up = +up.toFixed(1);
  el.superUp.textContent = up + " МБ/с";

  return up;
}



// ==========================
// MAIN SPEEDTEST FUNCTION
// ==========================
export async function runSpeedTest() {
  if (!el.superStatus) return;

  el.superStatus.textContent = "Измерение…";

  const ping = await measurePing();
  const down = await measureDownload();
  const up = await measureUpload();

  // ---- статус теста ----
  if (down > 80)       el.superStatus.textContent = "🐉 Максимум скорости";
  else if (down > 40) el.superStatus.textContent = "🔥 Очень быстро";
  else if (down > 20) el.superStatus.textContent = "⚡ Нормально";
  else if (down > 5)  el.superStatus.textContent = "🙂 Приемлемо";
  else                el.superStatus.textContent = "🐌 Медленно";

  return { ping, down, up };
}



// ==========================
// АВТО-ПОВТОР ТЕСТА (если нужно)
// ==========================
// Можно включить в ui.js (startup), если хочешь:
// setInterval(runSpeedTest, 30000);
