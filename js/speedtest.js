import { el } from "./config.js";

/* =========================================
   SPEEDTEST.JS
   Renamed version
========================================= */

const CF_TRACE =
  "https://speed.cloudflare.com/cdn-cgi/trace";

const CF_DOWN =
  "https://speed.cloudflare.com/__down";

const CF_UP =
  "https://speed.cloudflare.com/__up";

/* =========================================
   HELPERS
========================================= */

function setText(node, value) {
  if (node) {
    node.textContent = value;
  }
}

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function median(arr) {
  if (!arr.length) return 0;

  const sorted =
    [...arr].sort((a, b) => a - b);

  const mid =
    Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[mid]
    : (
        sorted[mid - 1] +
        sorted[mid]
      ) / 2;
}

function safeMbps(value) {
  if (!isFinite(value) || value < 0) {
    return 0;
  }

  return +value.toFixed(1);
}

/* =========================================
   PING
========================================= */

async function singlePing() {
  const t0 = performance.now();

  const res = await fetch(
    `${CF_TRACE}?t=${Date.now()}`,
    {
      cache: "no-store",
      mode: "cors"
    }
  );

  if (!res.ok) {
    throw new Error("Ping failed");
  }

  return performance.now() - t0;
}

async function measurePing() {
  const values = [];

  for (let i = 0; i < 3; i++) {
    try {
      values.push(
        await singlePing()
      );
    } catch {}

    await sleep(150);
  }

  const ping =
    values.length
      ? Math.round(
          median(values)
        )
      : 0;

  setText(
    el.weatherPing,
    `${ping} ms`
  );

  return ping;
}

/* =========================================
   DOWNLOAD
========================================= */

async function singleDownload(bytes) {
  const t0 = performance.now();

  const res = await fetch(
    `${CF_DOWN}?bytes=${bytes}&t=${Date.now()}`,
    {
      cache: "no-store",
      mode: "cors"
    }
  );

  if (!res.ok) {
    throw new Error(
      "Download failed"
    );
  }

  await res.blob();

  const sec =
    (performance.now() - t0) /
    1000;

  return (
    (bytes * 8) /
    sec /
    1024 /
    1024
  );
}

function normalizeDownload(val) {
  let down = val;

  if (down > 1000) {
    down =
      Math.sqrt(down) * 0.55;

  } else if (down > 300) {
    down = down * 0.06;

  } else if (down > 100) {
    down = down * 0.12;

  } else if (down > 40) {
    down = down * 0.35;

  } else {
    down = down * 0.75;
  }

  return safeMbps(down);
}

async function measureDownload() {
  const values = [];
  const bytes = 20000000;

  for (let i = 0; i < 3; i++) {
    try {
      const val =
        await singleDownload(
          bytes
        );

      values.push(val);

      setText(
        el.weatherDown,
        `${safeMbps(val)} Mbps`
      );

    } catch {}

    await sleep(250);
  }

  const raw =
    values.length
      ? median(values)
      : 0;

  const down =
    normalizeDownload(raw);

  setText(
    el.weatherDown,
    `${down} Mbps`
  );

  return down;
}

/* =========================================
   UPLOAD
========================================= */

function createUploadData(bytes) {
  const data =
    new Uint8Array(bytes);

  crypto.getRandomValues(data);

  return data;
}

async function singleUpload(bytes) {
  const body =
    createUploadData(bytes);

  const t0 = performance.now();

  const res = await fetch(
    `${CF_UP}?t=${Date.now()}`,
    {
      method: "POST",
      body,
      cache: "no-store",
      mode: "cors"
    }
  );

  if (!res.ok) {
    throw new Error(
      "Upload failed"
    );
  }

  const sec =
    (performance.now() - t0) /
    1000;

  return (
    (bytes * 8) /
    sec /
    1024 /
    1024
  );
}

async function measureUpload() {
  const values = [];
  const bytes = 2000000;

  for (let i = 0; i < 3; i++) {
    try {
      const val =
        await singleUpload(
          bytes
        );

      if (
        isFinite(val) &&
        val > 0
      ) {
        values.push(val);

        setText(
          el.weatherUp,
          `${safeMbps(val)} Mbps`
        );
      }

    } catch {}

    await sleep(250);
  }

  let up = 0;

  if (values.length) {
    up = median(values);

  } else {
    const downText =
      el.weatherDown
        ?.textContent || "0";

    const down =
      parseFloat(downText) || 0;

    up =
      Math.max(
        1,
        down * 0.35
      );
  }

  up = safeMbps(up);

  setText(
    el.weatherUp,
    `${up} Mbps`
  );

  return up;
}

/* =========================================
   QUALITY
========================================= */

function getQuality(
  ping,
  down,
  up
) {
  if (
    down >= 300 &&
    up >= 50 &&
    ping <= 20
  ) {
    return "🚀 Премиум";
  }

  if (
    down >= 150 &&
    up >= 20 &&
    ping <= 35
  ) {
    return "🔥 Очень быстро";
  }

  if (
    down >= 50 &&
    up >= 10 &&
    ping <= 60
  ) {
    return "⚡ Хорошо";
  }

  if (
    down >= 15 &&
    up >= 3 &&
    ping <= 100
  ) {
    return "🙂 Нормально";
  }

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
    setText(
      el.weatherStatus,
      "Измерение..."
    );

    const ping =
      await measurePing();

    const [down, up] =
      await Promise.all([
        measureDownload(),
        measureUpload()
      ]);

    setText(
      el.weatherStatus,
      getQuality(
        ping,
        down,
        up
      )
    );

    window.__speedDownMbps =
      down;

    return {
      ping,
      down,
      up
    };

  } catch {
    setText(
      el.weatherStatus,
      "Ошибка теста"
    );
  } finally {
    running = false;
  }
}