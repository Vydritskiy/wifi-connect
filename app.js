/* ============================================================
   Wi-Fi GUEST PORTAL — APP.JS (полностью переработанная версия)
   ============================================================ */

/* ---------- Конфигурация по умолчанию ---------- */
const defaultConfig = {
  ssid5: "r2d5",
  ssid24: "r2d2",
  pass: "Jgthfnbdysq1913",
  welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
  mapsUrl: "https://www.google.com/maps/place/вулиця+Андрія+Малишка,+31А,+Київ",
  city: "Kyiv",
  weatherApiKey: "6530afae9a05d8f6e1c997682469a69d"
};

/* ---------- Автоопределение языка ---------- */
const LANG = (() => {
  const l = navigator.language?.toLowerCase() || "ru";
  if (l.startsWith("uk")) return "ua";
  if (l.startsWith("en")) return "en";
  return "ru";
})();

/* ---------- Локализация ---------- */
const I18N = {
  ru: {
    welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
    autoConnect: "Подключиться автоматически (Android)",
    showQR: "Показать QR-код",
    copyPass: "Скопировать пароль",
    openMaps: "Как добраться 🚕",
    copied: "Пароль скопирован!",
    couldntCopy: "Не удалось скопировать.",
    online: "Статус интернета: онлайн ✅",
    offline: "Статус интернета: офлайн ⛔",
    selected5: "Выбрана {ssid} (5 GHz)",
    selected24: "Выбрана {ssid} (2.4 GHz)",
    alreadyConnectedBanner: "✔ Вы уже подключены к Wi-Fi",
    alreadyConnectedTo: "Вы уже подключены к <b>{ssid}</b> ✔",
    speedTitle: "Тест скорости…",
    ping: "Пинг",
    download: "Загрузка",
    upload: "Отдача",
    speedStatusGood: "Скорость отличная ✔",
    speedStatusMid: "Скорость нормальная ⚠",
    speedStatusBad: "Скорость низкая ⛔",
    feelsLike: "Ощущается как",
    humidity: "влажность",
    weatherError: "Ошибка погоды",
    noApiKey: "Нет API-ключа"
  },
  ua: {
    welcome: "Ласкаво просимо! Почувайся як вдома 🧡",
    autoConnect: "Підключитись автоматично (Android)",
    showQR: "Показати QR-код",
    copyPass: "Скопіювати пароль",
    openMaps: "Як дістатися 🚕",
    copied: "Пароль скопійовано!",
    couldntCopy: "Не вдалося скопіювати.",
    online: "Статус інтернету: онлайн ✅",
    offline: "Статус інтернету: офлайн ⛔",
    selected5: "Обрано {ssid} (5 ГГц)",
    selected24: "Обрано {ssid} (2.4 ГГц)",
    alreadyConnectedBanner: "✔ Ви вже підключені до Wi-Fi",
    alreadyConnectedTo: "Ви вже підключені до <b>{ssid}</b> ✔",
    speedTitle: "Тест швидкості…",
    ping: "Пінг",
    download: "Завантаження",
    upload: "Віддача",
    speedStatusGood: "Швидкість чудова ✔",
    speedStatusMid: "Швидкість нормальна ⚠",
    speedStatusBad: "Швидкість низька ⛔",
    feelsLike: "Відчувається як",
    humidity: "вологість",
    weatherError: "Помилка погоди",
    noApiKey: "Немає API-ключа"
  },
  en: {
    welcome: "Welcome! Make yourself at home 🧡",
    autoConnect: "Auto-connect (Android)",
    showQR: "Show QR code",
    copyPass: "Copy password",
    openMaps: "How to get there 🚕",
    copied: "Password copied!",
    couldntCopy: "Failed to copy.",
    online: "Internet status: online ✅",
    offline: "Internet status: offline ⛔",
    selected5: "Selected {ssid} (5 GHz)",
    selected24: "Selected {ssid} (2.4 GHz)",
    alreadyConnectedBanner: "✔ You are already connected to Wi-Fi",
    alreadyConnectedTo: "You are connected to <b>{ssid}</b> ✔",
    speedTitle: "Speed test…",
    ping: "Ping",
    download: "Download",
    upload: "Upload",
    speedStatusGood: "Speed: great ✔",
    speedStatusMid: "Speed: okay ⚠",
    speedStatusBad: "Speed: low ⛔",
    feelsLike: "Feels like",
    humidity: "humidity",
    weatherError: "Weather error",
    noApiKey: "No API key"
  }
};

function t(key) {
  return I18N[LANG]?.[key] || I18N["ru"][key] || key;
}

/* ---------- Config + localStorage ---------- */
let CONFIG = loadConfig();

function loadConfig() {
  try {
    const raw = localStorage.getItem("wifiGuestConfig");
    if (!raw) return { ...defaultConfig };
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return { ...defaultConfig };
  }
}

function saveConfigToStorage() {
  const { weatherApiKey, mapsUrl, ...toSave } = CONFIG;
  localStorage.setItem("wifiGuestConfig", JSON.stringify(toSave));
}

/* ---------- DOM элементы ---------- */
const welcomeEl = document.getElementById("welcomeText");
const helperText = document.getElementById("helperText");
const netStatus = document.getElementById("netStatus");
const heroArtEl = document.getElementById("heroArt");
const weatherBgEl = document.getElementById("weatherBg");
const speedTitleEl = document.getElementById("speedTitle");
const weatherIconEl = document.getElementById("weatherIcon");

/* ---------- Карусель ---------- */
let currentIndex = 0;
const slides = Array.from(document.querySelectorAll(".slide"));
const track = document.getElementById("track");
const carousel = document.getElementById("carousel");

function getCurrentBand() {
  return slides[currentIndex]?.dataset.band || "5";
}
function recalcWidth() {
  track.style.transform = `translateX(-${currentIndex * carousel.clientWidth}px)`;
}

/* ---------- Иконка (дроид) ---------- */
const HERO_ART = {
  "5": "icons/hero_r2d5.svg",
  "24": "icons/hero_r2d2.svg"
};

function updateHeroArt() {
  const src = HERO_ART[getCurrentBand()];
  heroArtEl.src = src;
}

/* ---------- Погода ---------- */
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

let lastWeatherKind = null;
let lastWeatherTemp = null;
let lastWeatherIsNight = false;

function detectWeatherKind(w, data) {
  const id = w.id;
  if (id >= 200 && id < 300) return "storm";
  if (id >= 300 && id < 500) return "rain-light";
  if (id >= 500 && id < 600) return "rain-heavy";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "fog";
  if (id === 800) return "clear";
  return "clouds";
}

async function fetchWeather() {
  const c = CONFIG.city;
  const key = CONFIG.weatherApiKey;

  if (!key) return;

  const url = `${WEATHER_API_URL}?q=${c}&units=metric&appid=${key}&lang=${LANG}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw 0;

    const j = await res.json();
    const w = j.weather[0];

    lastWeatherKind = detectWeatherKind(w, j);
    lastWeatherTemp = Math.round(j.main.temp);

    weatherIconEl.className = "weather-icon icon-" + lastWeatherKind;

    document.getElementById("weatherCity").textContent = j.name;
    document.getElementById("weatherMain").textContent = w.description;
    document.getElementById("weatherTemp").textContent = `${lastWeatherTemp}°C`;
    document.getElementById("weatherMeta").textContent =
      `${t("feelsLike")} ${Math.round(j.main.feels_like)}°C · ${t("humidity")} ${j.main.humidity}%`;

  } catch (e) {
    document.getElementById("weatherTemp").textContent = t("weatherError");
  }
}

/* ---------- Тест скорости ---------- */
let lastDownMbps = 0;

async function speedTest() {
  const pingEl = document.getElementById("speedPing");
  const downEl = document.getElementById("speedDown");
  const upEl = document.getElementById("speedUp");
  const statusEl = document.getElementById("speedStatus");

  if (speedTitleEl) speedTitleEl.textContent = t("speedTitle");

  /* PING */
  let ping = 0;
  try {
    const t0 = performance.now();
    await fetch("https://www.google.com/favicon.ico", { mode: "no-cors" });
    ping = Math.round(performance.now() - t0);
  } catch {}

  pingEl.textContent = `${t("ping")}: ${ping} ms`;

  /* DOWNLOAD */
  let down = 0;
  try {
    const t0 = performance.now();
    const r = await fetch("https://www.google.com/favicon.ico");
    const b = await r.arrayBuffer();
    const sec = (performance.now() - t0) / 1000;
    down = Math.round(b.byteLength / sec / 1024 / 1024);
  } catch {}

  lastDownMbps = down;
  downEl.textContent = `${t("download")}: ${down} Mbps`;

  /* UPLOAD (фиктивно) */
  let up = Math.round(down * 0.4);
  upEl.textContent = `${t("upload")}: ${up} Mbps`;

  /* Статус скорости */
  if (down >= 50) {
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

/* ---------- Логика: уже подключены ---------- */
async function detectAlreadyConnected() {
  await new Promise(r => setTimeout(r, 3500));

  const ok = navigator.onLine && lastDownMbps >= 5;

  if (!ok) return;

  const banner = document.getElementById("connectedBanner");
  const ssid = getCurrentBand() === "5" ? CONFIG.ssid5 : CONFIG.ssid24;

  banner.style.display = "block";
  banner.innerHTML = t("alreadyConnectedBanner");

  helperText.innerHTML = t("alreadyConnectedTo").replace("{ssid}", ssid);

  /* скрываем кнопки на ВСЕХ устройствах */
  [
    "btnAuto", "btnQR", "btnCopy", "btnMaps"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

/* ---------- QR ---------- */
function showQR() {
  const qrBox = document.getElementById("qrBox");
  qrBox.style.display = "block";

  const ssid = getCurrentBand() === "5" ? CONFIG.ssid5 : CONFIG.ssid24;

  new QRCode(document.getElementById("qrCanvas"), {
    text: `WIFI:T:WPA;S:${ssid};P:${CONFIG.pass};;`,
    width: 180,
    height: 180
  });
}

/* ---------- Копирование ---------- */
async function copyPass() {
  try {
    await navigator.clipboard.writeText(CONFIG.pass);
    alert(t("copied"));
  } catch {
    alert(t("couldntCopy"));
  }
}

/* ---------- Карты ---------- */
function openMaps() {
  window.open(CONFIG.mapsUrl, "_blank");
}

/* ---------- Автоподключение (Android) ---------- */
function autoConnect() {
  const ssid = getCurrentBand() === "5" ? CONFIG.ssid5 : CONFIG.ssid24;
  const url = `intent://#Intent;scheme=wifi;S.ssid=${ssid};S.pass=${CONFIG.pass};end`;
  location.href = url;
}

/* ---------- Инициализация ---------- */
window.addEventListener("load", () => {
  welcomeEl.textContent = CONFIG.welcome;

  recalcWidth();
  updateHeroArt();
  fetchWeather();
  speedTest().then(detectAlreadyConnected);

  window.addEventListener("resize", recalcWidth);
});
