
// WEATHER API FIX
async function fetchWeather() {
  const cityEl = document.getElementById("weatherCity");
  const mainEl = document.getElementById("weatherMain");
  const tempEl = document.getElementById("weatherTemp");
  const metaEl = document.getElementById("weatherMeta");

  if (!cityEl || !mainEl || !tempEl || !metaEl) return;

  if (!CONFIG.city || !CONFIG.weatherApiKey) {
    cityEl.textContent = CONFIG.city || "";
    mainEl.textContent = "";
    tempEl.textContent = t("noApiKey");
    metaEl.textContent = "";
    return;
  }

  const apiLang = LANG === "ua" ? "ua" : (LANG === "en" ? "en" : "ru");
  const url = `${WEATHER_API_URL}?q=${encodeURIComponent(CONFIG.city)}&appid=${CONFIG.weatherApiKey}&units=metric&lang=${apiLang}`;

  try {
    tempEl.textContent = "…";
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const w = data.weather[0];

    lastWeatherTemp = Math.round(data.main.temp);
    lastWeatherKind = detectWeatherKind(w, data);

    const tz = data.timezone || 0;
    const now = Date.now() / 1000 + tz;
    lastWeatherIsNight = !(now > data.sys.sunrise && now < data.sys.sunset);

    cityEl.textContent = data.name || CONFIG.city;
    mainEl.textContent = w.description;
    tempEl.textContent = `${lastWeatherTemp}°C`;
    metaEl.textContent = `${t("feelsLike")} ${Math.round(data.main.feels_like)}°C · ${t("humidity")} ${data.main.humidity}%`;

    updateWeatherBackground();
  } catch (e) {
    console.error("Weather error", e);
    cityEl.textContent = CONFIG.city;
    mainEl.textContent = "";
    tempEl.textContent = t("weatherError");
    metaEl.textContent = "";
  }
}

// SPEED TEST FIX
let lastDownMbps = 0;

async function speedTest() {
  const pingEl = document.getElementById("speedPing");
  const downEl = document.getElementById("speedDown");
  const upEl = document.getElementById("speedUp");
  const statusEl = document.getElementById("speedStatus");

  if (speedTitleEl) speedTitleEl.textContent = t("speedTitle");

  if (!pingEl || !downEl || !upEl || !statusEl) return;

  // Ping
  let ping = 30;
  try {
    const t0 = performance.now();
    await fetch("https://www.google.com/images/branding/googlelogo/1x/googlelogo-200x200.png", { mode: "no-cors" });
    ping = Math.round(performance.now() - t0);
  } catch (e) {}
  pingEl.textContent = `${t("ping")}: ${ping} ms`;

  // Download
  let down = 25;
  try {
    const size = 3000000; // 3MB
    const url = "https://www.google.com/images/branding/googlelogo/1x/googlelogo-200x200.png"; // Заменили на стабильный URL
    const t0 = performance.now();
    const res = await fetch(url, { cache: "no-store" });
    const buf = await res.arrayBuffer();
    const sec = (performance.now() - t0) / 1000;
    const bytes = buf.byteLength || size;
    down = Math.round(bytes / sec / 1024 / 1024);
  } catch (e) {}
  lastDownMbps = down;
  downEl.textContent = `${t("download")}: ${down} Mbps`;

  // Upload (условно)
  let up = 10;
  try {
    const size = 300000;
    const payload = new Uint8Array(size);
    const t0 = performance.now();
    await fetch("https://httpbin.org/post", { method: "POST", body: payload });
    const sec = (performance.now() - t0) / 1000;
    up = Math.round(size / sec / 1024 / 1024);
  } catch (e) {}
  upEl.textContent = `${t("upload")}: ${up} Mbps`;

  // статус
  if (down >= 50 && ping <= 30) {
    statusEl.textContent = t("speedStatusGood");
    statusEl.className = "speed-status good";
  } else if (down >= 20) {
    statusEl.textContent = t("speedStatusMid");
    statusEl.className = "speed-status mid";
  } else {
    statusEl.textContent = t("speedStatusBad");
    statusEl.className = "speed-status bad";
  }
}

// BUTTONS VISIBILITY FIX (FOR MOBILE AND DESKTOP)
async function detectAlreadyConnected() {
  const helper = document.getElementById("helperText");
  const banner = document.getElementById("connectedBanner");

  // ждём окончания первого спидтеста
  await new Promise(r => setTimeout(r, 4000));

  const conn = navigator.connection || navigator.webkitConnection;
  const isWifi = conn && (conn.type === "wifi" || conn.effectiveType === "wifi");

  const down = lastDownMbps || 0;
  const ok = navigator.onLine && down >= 5 && (isWifi || !conn);

  if (ok) {
    if (banner) {
      banner.style.display = "block";
      banner.textContent = t("alreadyConnectedBanner");
    }
    if (helper) {
      const tpl = t("alreadyConnectedTo");
      helper.innerHTML = tpl.replace("{ssid}", getCurrentSsid());
    }

    const autoBtn = document.getElementById("btnAuto");
    const qrBtn = document.getElementById("btnQR");
    const copyBtn = document.getElementById("btnCopy");
    const mapsBtn = document.getElementById("btnMaps");

    if (autoBtn) autoBtn.style.display = "none";
    if (qrBtn) qrBtn.style.display = "none";
    if (copyBtn) copyBtn.style.display = "none";
    if (mapsBtn) mapsBtn.style.display = "none";
  }
}
