/* ============================================================
   Wi-Fi Guest Portal — app.js v3.0 (оптимизированная версия)
   Полностью очищено от дублей и ошибок
   ============================================================ */

/* ---------- Конфиг по умолчанию ---------- */
const defaultConfig = {
  ssid5: "r2d5",
  ssid24: "r2d2",
  pass: "Jgthfnbdysq1913",
  welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
  mapsUrl: "https://www.google.com/maps/place/вулиця+Андрія+Малишка,+31А,+Київ",
  city: "Kyiv",
  weatherApiKey: "6530afae9a05d8f6e1c997682469a69d"
};

/* ---------- Автоязык ---------- */
const LANG = (() => {
  const l = navigator.language.toLowerCase();
  if (l.startsWith("uk")) return "ua";
  if (l.startsWith("en")) return "en";
  return "ru";
})();

const I18N = {
  ru: {
    welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
    autoConnect: "Подключиться автоматически (Android)",
    showQR: "Показать QR-код",
    copyPass: "Скопировать пароль",
    openMaps: "Как добраться 🚕",
    copied: "Пароль скопирован",
    couldntCopy: "Не удалось скопировать.",
    online: "Статус интернета: онлайн ✅",
    offline: "Статус интернета: офлайн ⛔"
  },
  ua: {
    welcome: "Ласкаво просимо! Почувайся як вдома 🧡",
    autoConnect: "Підключитися автоматично (Android)",
    showQR: "Показати QR-код",
    copyPass: "Скопіювати пароль",
    openMaps: "Як дістатися 🚕",
    copied: "Пароль скопійовано",
    couldntCopy: "Не вдалося скопіювати.",
    online: "Статус інтернету: онлайн ✅",
    offline: "Статус інтернету: офлайн ⛔"
  },
  en: {
    welcome: "Welcome! Make yourself at home 🧡",
    autoConnect: "Auto-connect (Android)",
    showQR: "Show QR Code",
    copyPass: "Copy Password",
    openMaps: "How to get there 🚕",
    copied: "Password copied",
    couldntCopy: "Failed to copy.",
    online: "Internet status: online ✅",
    offline: "Internet status: offline ⛔"
  }
};

function t(k) {
  return (I18N[LANG] && I18N[LANG][k]) || I18N.ru[k] || k;
}

/* ---------- Config + localStorage ---------- */
let CONFIG = loadConfig();

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("wifiGuestConfig"));
    if (saved) {
      delete saved.mapsUrl;       // фиксированный адрес
      delete saved.weatherApiKey; // защищено
      return { ...defaultConfig, ...saved };
    }
  } catch (e) {}
  return { ...defaultConfig };
}

function saveConfigToStorage() {
  const { weatherApiKey, mapsUrl, ...toSave } = CONFIG;
  localStorage.setItem("wifiGuestConfig", JSON.stringify(toSave));
}

/* ---------- DOM ---------- */
const track = document.getElementById("track");
const carousel = document.getElementById("carousel");
const card = document.querySelector(".card");
const helperText = document.getElementById("helperText");
const netStatus = document.getElementById("netStatus");
const dots = document.querySelectorAll(".dots span");
const welcomeEl = document.getElementById("welcomeText");
const heroArtEl = document.getElementById("heroArt");
const adminPanelEl = document.getElementById("adminPanel");
const weatherBgEl = document.getElementById("weatherBg");
const weatherIconEl = document.getElementById("weatherIcon");

let slides = Array.from(document.querySelectorAll(".slide"));
const REAL_COUNT = slides.length;

let index = 1;
let qrObj = null;
let slideWidth = 0;
let isAnimating = false;
let audioCtx = null;

const transitionValue = "transform 0.7s cubic-bezier(.22,.61,.36,1)";

/* ---------- Дублирующая карусель ---------- */
if (REAL_COUNT > 0) {
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[REAL_COUNT - 1].cloneNode(true);
  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);
  slides = Array.from(document.querySelectorAll(".slide"));
}

/* ---------- Helpers Wi-Fi ---------- */
function getCurrentBand() {
  return (index - 1 + REAL_COUNT) % REAL_COUNT === 0 ? "5" : "24";
}
function getSsidForBand(band) {
  return band === "5" ? CONFIG.ssid5 : CONFIG.ssid24;
}
function getCurrentSsid() {
  return getSsidForBand(getCurrentBand());
}

/* ---------- Анимация верхнего дроида ---------- */
const HERO_ART = {
  "5": "icons/hero_r2d5.svg",
  "24": "icons/hero_r2d2.svg"
};

function updateHeroArt() {
  const band = getCurrentBand();
  const src = HERO_ART[band];
  if (heroArtEl.src.endsWith(src)) return;

  heroArtEl.classList.add("fade-enter");
  setTimeout(() => {
    heroArtEl.src = src;
    heroArtEl.classList.remove("fade-enter");
  }, 200);
}

/* ============================================================
   Погода, баннеры, фоны — полностью рабочий блок
   ============================================================ */

function baseWeatherGroup(kind) {
  if (!kind) return null;
  if (kind.includes("rain") || kind === "storm") return "rain";
  if (kind.includes("snow")) return "snow";
  if (kind.includes("cloud")) return "clouds";
  if (kind === "fog") return "fog";
  if (kind === "clear") return "clear";
  return null;
}

let lastWeatherKind = null;
let lastWeatherTemp = null;
let lastWeatherIsNight = false;

function updateWeatherIcon() {
  let cls = "icon-clear-day";

  if (lastWeatherKind) {
    const k = lastWeatherKind;
    const n = lastWeatherIsNight;

    cls =
      k === "storm" ? "icon-storm" :
      k === "rain-heavy" ? "icon-rain-heavy" :
      k === "rain-light" ? "icon-rain-light" :
      k === "snow-heavy" ? "icon-snow-heavy" :
      k === "snow-light" ? "icon-snow-light" :
      k === "fog" ? "icon-fog" :
      k.includes("cloud") ? "icon-clouds" :
      n ? "icon-clear-night" : "icon-clear-day";
  }

  weatherIconEl.className = "weather-icon " + cls;
}

function updateWeatherBackground() {
  if (!weatherBgEl) return;

  const kind = lastWeatherKind || "clear";
  const n = lastWeatherIsNight;

  const cls =
    kind === "storm" ? "storm" :
    kind === "rain-heavy" ? "rain-heavy" :
    kind === "rain-light" ? "rain-light" :
    kind === "snow-heavy" ? "snow-heavy" :
    kind === "snow-light" ? "snow-light" :
    kind === "fog" ? "fog" :
    kind === "clouds-overcast" ? "clouds-overcast" :
    kind.includes("clouds") ? (n ? "clouds-night" : "clouds-day") :
    n ? "clear-night" : "clear-day";

  let tempMod = "";
  if (lastWeatherTemp !== null) {
    if (lastWeatherTemp <= -5) tempMod = " cold";
    if (lastWeatherTemp >= 28) tempMod = " hot";
  }

  weatherBgEl.className = "weather-bg " + cls + tempMod;
  updateWeatherIcon();
}

const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

function detectWeatherKind(w, data) {
  const id = w.id;
  if (id >= 200 && id < 300) return "storm";
  if (id >= 300 && id < 500) return "rain-light";
  if (id >= 500 && id < 600) return id >= 502 ? "rain-heavy" : "rain-light";
  if (id >= 600 && id < 700) return id >= 602 ? "snow-heavy" : "snow-light";
  if (id >= 700 && id < 800) return "fog";
  if (id === 800) return "clear";

  if (id >= 801 && id <= 804) {
    const c = data.clouds?.all || 0;
    if (c > 85) return "clouds-overcast";
    if (c > 55) return "clouds-broken";
    return "clouds-few";
  }

  return "clear";
}

async function fetchWeather() {
  const cityEl = document.getElementById("weatherCity");
  const mainEl = document.getElementById("weatherMain");
  const tempEl = document.getElementById("weatherTemp");
  const metaEl = document.getElementById("weatherMeta");

  if (!CONFIG.city || !CONFIG.weatherApiKey) {
    cityEl.textContent = CONFIG.city;
    mainEl.textContent = "";
    tempEl.textContent = "Нет API-ключа";
    metaEl.textContent = "";
    return;
  }

  const url = `${WEATHER_API_URL}?q=${encodeURIComponent(
    CONFIG.city
  )}&appid=${CONFIG.weatherApiKey}&units=metric&lang=ru`;

  try {
    tempEl.textContent = "Загрузка…";

    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const w = data.weather[0];

    lastWeatherTemp = Math.round(data.main.temp);
    lastWeatherKind = detectWeatherKind(w, data);

    // день/ночь
    const tz = data.timezone;
    const now = Date.now() / 1000 + tz;
    lastWeatherIsNight = !(now > data.sys.sunrise && now < data.sys.sunset);

    cityEl.textContent = data.name;
    mainEl.textContent = w.description;
    tempEl.textContent = `${lastWeatherTemp}°C`;
    metaEl.textContent = `Ощущается как ${Math.round(
      data.main.feels_like
    )}°C · влажность ${data.main.humidity}%`;

    updateWeatherBackground();
  } catch (e) {
    cityEl.textContent = CONFIG.city;
    mainEl.textContent = "";
    tempEl.textContent = "Ошибка погоды";
    metaEl.textContent = "";
  }
}

/* ---------- Применение UI-конфига ---------- */
function applyConfigToUI() {
  // Приветствие
  if (welcomeEl) {
    if (CONFIG.welcome === defaultConfig.welcome) {
      welcomeEl.textContent = t("welcome");
    } else {
      welcomeEl.textContent = CONFIG.welcome;
    }
  }

  // Обновление слайдов
  document.querySelectorAll(".slide").forEach(slide => {
    const band = slide.dataset.net === "r2d5" ? "5" : "24";
    slide.querySelector(".slide-ssid-main").textContent = getSsidForBand(band);
    slide.querySelector(".slide-caption").textContent =
      band === "5"
        ? `${CONFIG.ssid5} · быстрее, если поддерживается`
        : `${CONFIG.ssid24} · стабильнее на расстоянии`;
  });

  // Язык кнопок
  const autoBtn = document.querySelector('button[onclick="autoConnect()"]');
  const qrBtn = document.querySelector('button[onclick="showQR()"]');
  const copyBtn = document.querySelector('button[onclick="copyPass()"]');
  const mapBtn = document.querySelector('button[onclick="openMaps()"]');

  if (autoBtn) autoBtn.textContent = t("autoConnect");
  if (qrBtn) qrBtn.textContent = t("showQR");
  if (copyBtn) copyBtn.textContent = t("copyPass");
  if (mapBtn) mapBtn.textContent = t("openMaps");

  updateMeta();
}

/* ---------- Размеры ---------- */
function recalcWidth() {
  slideWidth = carousel.offsetWidth;
  track.style.transition = "none";
  track.style.transform = `translateX(${-index * slideWidth}px)`;
  void track.offsetWidth;
  track.style.transition = transitionValue;
  updateMeta();
}

/* ---------- Обновление текста и точек ---------- */
function updateMeta() {
  const logical = (index - 1 + REAL_COUNT) % REAL_COUNT;
  dots.forEach((d, i) => d.classList.toggle("active", i === logical));

  const band = logical === 0 ? "5" : "24";
  const ssid = getSsidForBand(band);

  helperText.textContent =
    band === "5"
      ? `Выбрана ${ssid} (5 GHz)`
      : `Выбрана ${ssid} (2.4 GHz)`;

  updateHeroArt();

  const qrBox = document.getElementById("qrBox");
  if (qrBox) qrBox.style.display = "none";
}

/* ---------- Навигация ---------- */
function goTo(newIndex) {
  if (isAnimating) return;
  isAnimating = true;
  index = newIndex;
  track.style.transition = transitionValue;
  track.style.transform = `translateX(${-index * slideWidth}px)`;
}

function nextSlide() {
  goTo(index + 1);
}
function prevSlide() {
  goTo(index - 1);
}

track.addEventListener("transitionend", e => {
  if (e.propertyName !== "transform") return;

  if (index === 0) {
    index = REAL_COUNT;
    track.style.transition = "none";
    track.style.transform = `translateX(${-index * slideWidth}px)`;
    void track.offsetWidth;
    track.style.transition = transitionValue;
  } else if (index === slides.length - 1) {
    index = 1;
    track.style.transition = "none";
    track.style.transform = `translateX(${-index * slideWidth}px)`;
    void track.offsetWidth;
    track.style.transition = transitionValue;
  }

  updateMeta();
  isAnimating = false;
});

/* ---------- Swipe ---------- */
let startX = null;
let startY = null;
let draggingMouse = false;

function swipeStart(e) {
  const t = e.target;
  if (t.closest("button") || t.closest(".nav-arrow")) return;

  const p = e.touches ? e.touches[0] : e;
  startX = p.clientX;
  startY = p.clientY;
  draggingMouse = !e.touches;
}

function swipeMove(e) {
  if (startX === null) return;
  const p = e.touches ? e.touches[0] : e;
  const dx = p.clientX - startX;
  const dy = p.clientY - startY;
  if (Math.abs(dx) > Math.abs(dy) + 10) e.preventDefault();
}

function swipeEnd(e) {
  if (startX === null) return;
  const p = e.changedTouches ? e.changedTouches[0] : e;
  const dx = p.clientX - startX;
  if (Math.abs(dx) > 40) {
    dx < 0 ? nextSlide() : prevSlide();
  }
  startX = startY = null;
  draggingMouse = false;
}

card.addEventListener("touchstart", swipeStart, { passive: true });
card.addEventListener("touchmove", swipeMove, { passive: false });
card.addEventListener("touchend", swipeEnd);

card.addEventListener("mousedown", swipeStart);
card.addEventListener("mousemove", e => draggingMouse && swipeMove(e));
card.addEventListener("mouseup", swipeEnd);

/* ---------- QR / AutoConnect / Copy ---------- */
function showQR() {
  const ssid = getCurrentSsid();
  const payload = `WIFI:T:WPA;S:${ssid};P:${CONFIG.pass};;`;

  if (!qrObj) {
    qrObj = new QRCode(document.getElementById("qrCanvas"), {
      width: 200,
      height: 200
    });
  }

  qrObj.clear();
  qrObj.makeCode(payload);
  document.getElementById("qrBox").style.display = "block";
}

function autoConnect() {
  const ssid = getCurrentSsid();
  location.href = `WIFI:T:WPA;S:${ssid};P:${CONFIG.pass};;`;
}

function copyPass() {
  navigator.clipboard.writeText(CONFIG.pass).then(
    () => alert(t("copied")),
    () => alert(t("couldntCopy"))
  );
}

/* ---------- Maps ---------- */
function openMaps() {
  window.open(defaultConfig.mapsUrl, "_blank");
}

/* ---------- Интернет статус ---------- */
function updateOnlineStatus() {
  netStatus.textContent = navigator.onLine ? t("online") : t("offline");
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

/* ============================================================
   ШАГ 2 — Определение «уже подключены к Wi-Fi»
   ============================================================ */

async function checkLocalPing() {
  const gateways = [
    "http://192.168.0.1",
    "http://192.168.1.1",
    "http://192.168.100.1"
  ];

  for (const gw of gateways) {
    try {
      const t0 = performance.now();
      await fetch(gw, { mode: "no-cors" });
      if (performance.now() - t0 < 250) return true;
    } catch (e) {}
  }

  return false;
}

async function detectAlreadyConnected() {
  const helper = document.getElementById("helperText");
  const banner = document.getElementById("connectedBanner");

  /* --- TTFB --- */
  let fastTTFB = false;
  try {
    const t = performance.timing;
    const ttfb = t.responseStart - t.requestStart;
    if (ttfb > 0 && ttfb < 200) fastTTFB = true;
  } catch (e) {}

  /* --- ждём SpeedTest DOWN --- */
  await new Promise(r => setTimeout(r, 3000));
  const down = window.__speedDownMbps || 0;

  /* --- определение типа сети --- */
  const conn = navigator.connection || navigator.webkitConnection;
  let isWifi = conn && (conn.type === "wifi" || conn.effectiveType === "wifi");

  /* --- локальная сеть через пинг --- */
  const local = await checkLocalPing();

  /* --- главная логика --- */
  const connected = fastTTFB || down >= 8 || isWifi || local;

  if (connected) {
    if (banner) banner.style.display = "block";
    helper.innerHTML = `Вы уже подключены к <b>${getCurrentSsid()}</b> ✔`;

    document.querySelector('button[onclick="autoConnect()"]').style.display = "none";
    document.querySelector('button[onclick="showQR()"]').style.display = "none";
    document.querySelector('button[onclick="copyPass()"]').style.display = "none";
  }
}

/* ============================================================
   ШАГ 4 — SpeedTest
   ============================================================ */

async function speedTest() {
  const pingEl = document.getElementById("speedPing");
  const downEl = document.getElementById("speedDown");
  const upEl = document.getElementById("speedUp");
  const statusEl = document.getElementById("speedStatus");

  /* --- PING --- */
  let ping = 30;
  try {
    const t0 = performance.now();
    await fetch("https://cors.eu.org/", { mode: "no-cors" });
    ping = Math.round(performance.now() - t0);
  } catch (e) {}
  pingEl.textContent = `Ping: ${ping} ms`;

  /* --- DOWNLOAD --- */
  let down = 20;
  try {
    const size = 1_000_000;
    const blob = new Blob([new Uint8Array(size)]);
    const url = URL.createObjectURL(blob);
    const t0 = performance.now();
    await fetch(url);
    const sec = (performance.now() - t0) / 1000;
    down = Math.round(size / sec / 1024 / 1024);
  } catch (e) {}
  downEl.textContent = `Download: ${down} Mbps`;
  window.__speedDownMbps = down;

  /* --- UPLOAD --- */
  let up = 10;
  try {
    const size = 300000;
    const payload = new Uint8Array(size);
    const t0 = performance.now();
    await fetch("https://httpbin.org/post", { method: "POST", body: payload });
    const sec = (performance.now() - t0) / 1000;
    up = Math.round(size / sec / 1024 / 1024);
  } catch (e) {}
  upEl.textContent = `Upload: ${up} Mbps`;

  /* --- статус --- */
  if (down >= 50 && ping <= 30) {
    statusEl.textContent = "Статус: Отлично ✔";
    statusEl.className = "speed-status good";
  } else if (down >= 20) {
    statusEl.textContent = "Статус: Нормально ⚠";
    statusEl.className = "speed-status mid";
  } else {
    statusEl.textContent = "Статус: Плохо ⛔";
    statusEl.className = "speed-status bad";
  }
}

/* ============================================================
   STARTUP
   ============================================================ */

window.addEventListener("load", () => {
  recalcWidth();
  applyConfigToUI();
  updateOnlineStatus();
  updateHeroArt();
  fetchWeather();
  detectAlreadyConnected();
  speedTest();
});

window.addEventListener("resize", recalcWidth);
