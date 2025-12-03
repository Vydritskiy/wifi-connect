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
    copied: "Пароль скопирован",
    couldntCopy: "Не удалось скопировать.",
    online: "Статус интернета: онлайн ✅",
    offline: "Статус интернета: офлайн ⛔",
    selected5: "Выбрана {ssid} (5 GHz)",
    selected24: "Выбрана {ssid} (2.4 GHz)",
    alreadyConnectedBanner: "✔ Вы уже подключены к Wi-Fi",
    alreadyConnectedTo: "Вы уже подключены к <b>{ssid}</b> ✔",
    speedTitle: "Тест скорости…",
    ping: "Пинг",
    download: "Скорость загрузки",
    upload: "Скорость отдачи",
    speedStatusGood: "Статус: Отлично ✔",
    speedStatusMid: "Статус: Нормально ⚠",
    speedStatusBad: "Статус: Плохо ⛔",
    feelsLike: "Ощущается как",
    humidity: "влажность",
    weatherError: "Ошибка погоды",
    noApiKey: "Нет API-ключа"
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
    offline: "Статус інтернету: офлайн ⛔",
    selected5: "Обрано {ssid} (5 ГГц)",
    selected24: "Обрано {ssid} (2.4 ГГц)",
    alreadyConnectedBanner: "✔ Ви вже підключені до Wi-Fi",
    alreadyConnectedTo: "Ви вже підключені до <b>{ssid}</b> ✔",
    speedTitle: "Тест швидкості…",
    ping: "Пінг",
    download: "Швидкість завантаження",
    upload: "Швидкість віддачі",
    speedStatusGood: "Статус: Чудово ✔",
    speedStatusMid: "Статус: Нормально ⚠",
    speedStatusBad: "Статус: Погано ⛔",
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
    copied: "Password copied",
    couldntCopy: "Failed to copy.",
    online: "Internet status: online ✅",
    offline: "Internet status: offline ⛔",
    selected5: "Selected {ssid} (5 GHz)",
    selected24: "Selected {ssid} (2.4 GHz)",
    alreadyConnectedBanner: "✔ You are already connected to Wi-Fi",
    alreadyConnectedTo: "You are already connected to <b>{ssid}</b> ✔",
    speedTitle: "Speed test…",
    ping: "Ping",
    download: "Download speed",
    upload: "Upload speed",
    speedStatusGood: "Status: Great ✔",
    speedStatusMid: "Status: OK ⚠",
    speedStatusBad: "Status: Poor ⛔",
    feelsLike: "Feels like",
    humidity: "humidity",
    weatherError: "Weather error",
    noApiKey: "No API key"
  }
};

function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) || I18N.ru[key] || key;
}

/* ---------- Config + localStorage ---------- */
let CONFIG = loadConfig();

function loadConfig() {
  try {
    const raw = localStorage.getItem("wifiGuestConfig");
    if (!raw) return { ...defaultConfig };
    const saved = JSON.parse(raw);
    delete saved.mapsUrl;
    delete saved.weatherApiKey;
    return { ...defaultConfig, ...saved };
  } catch (e) {
    console.error("Ошибка чтения конфигурации", e);
    return { ...defaultConfig };
  }
}

function saveConfigToStorage() {
  const { weatherApiKey, mapsUrl, ...toSave } = CONFIG;
  try {
    localStorage.setItem("wifiGuestConfig", JSON.stringify(toSave));
  } catch (e) {
    console.error("Ошибка сохранения конфигурации", e);
  }
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
const speedTitleEl = document.getElementById("speedTitle");

const slides = Array.from(document.querySelectorAll(".slide"));
let currentIndex = 0;
let slideWidth = 0;
let qrObj = null;

/* ---------- Hero art ---------- */
const HERO_ART = {
  "5": "icons/hero_r2d5.svg",
  "24": "icons/hero_r2d2.svg"
};

function getCurrentBand() {
  const slide = slides[currentIndex];
  return slide?.dataset.band || "5";
}

function getSsidForBand(band) {
  return band === "5" ? CONFIG.ssid5 : CONFIG.ssid24;
}

function getCurrentSsid() {
  return getSsidForBand(getCurrentBand());
}

function updateHeroArt() {
  if (!heroArtEl) return;
  const band = getCurrentBand();
  const src = HERO_ART[band] || HERO_ART["5"];
  if (heroArtEl.getAttribute("src") === src) return;
  heroArtEl.classList.add("fade-enter");
  setTimeout(() => {
    heroArtEl.setAttribute("src", src);
    heroArtEl.classList.remove("fade-enter");
  }, 200);
}

/* ---------- Карусель ---------- */

function recalcWidth() {
  if (!carousel || !track) return;
  slideWidth = carousel.clientWidth;
  track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
}

function updateDots() {
  dots.forEach((d, i) => d.classList.toggle("active", i === currentIndex));
}

function updateHelper() {
  if (!helperText) return;
  const band = getCurrentBand();
  const ssid = getSsidForBand(band);
  const key = band === "5" ? "selected5" : "selected24";
  helperText.innerHTML = t(key).replace("{ssid}", ssid);
}

function updateCarouselState() {
  if (!track) return;
  track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
  updateDots();
  updateHelper();
  updateHeroArt();
}

function nextSlide() {
  if (slides.length === 0) return;
  currentIndex = (currentIndex + 1) % slides.length;
  updateCarouselState();
}

function prevSlide() {
  if (slides.length === 0) return;
  currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  updateCarouselState();
}

window.nextSlide = nextSlide;
window.prevSlide = prevSlide;

/* ---------- Погода ---------- */

const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";
let lastWeatherKind = null;
let lastWeatherTemp = null;
let lastWeatherIsNight = false;

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

function updateWeatherIcon() {
  if (!weatherIconEl) return;
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
    else if (lastWeatherTemp >= 28) tempMod = " hot";
  }

  weatherBgEl.className = "weather-bg " + cls + tempMod;
  updateWeatherIcon();
}

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

/* ---------- SpeedTest ---------- */

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
  const url = "https://www.google.com/images/branding/googlelogo/1x/googlelogo-200x200.png";
  const t0 = performance.now();
  const res = await fetch(url, { cache: "no-store" });
  const buf = await res.arrayBuffer();
  const sec = (performance.now() - t0) / 1000;
  const bytes = buf.byteLength || 200000;
  down = Math.round(bytes / sec / 1024 / 1024);
} catch (e) {
  down = 0;
  console.error("Ошибка при загрузке файла для теста скорости", e);
}
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

/* ---------- Уже подключены ---------- */

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
      document.body.classList.add("connected");

    }

    const autoBtn = document.getElementById("btnAuto");
    const qrBtn = document.getElementById("btnQR");
    const copyBtn = document.getElementById("btnCopy");
    if (autoBtn) autoBtn.style.display = "none";
    if (qrBtn) qrBtn.style.display = "none";
    if (copyBtn) copyBtn.style.display = "none";
  }
}

/* ---------- Online/offline ---------- */

function updateOnlineStatus() {
  if (!netStatus) return;
  netStatus.textContent = navigator.onLine ? t("online") : t("offline");
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

/* ---------- Применение UI-конфига ---------- */

function applyConfigToUI() {
  // приветствие
  if (welcomeEl) {
    if (CONFIG.welcome === defaultConfig.welcome) {
      welcomeEl.textContent = t("welcome");
    } else {
      welcomeEl.textContent = CONFIG.welcome;
    }
  }

  // слайды
  slides.forEach(slide => {
    const band = slide.dataset.band === "24" ? "24" : "5";
    const ssid = getSsidForBand(band);
    const mainEl = slide.querySelector(".slide-ssid-main");
    const capEl = slide.querySelector(".slide-caption");
    if (mainEl) mainEl.textContent = ssid;
    if (capEl) {
      if (band === "5") {
        capEl.textContent = `${ssid} · быстрее, если поддерживается`;
      } else {
        capEl.textContent = `${ssid} · стабильнее на расстоянии`;
      }
    }
  });

  // кнопки
  const autoBtn = document.getElementById("btnAuto");
  const qrBtn = document.getElementById("btnQR");
  const copyBtn = document.getElementById("btnCopy");
  const mapBtn = document.getElementById("btnMaps");
  if (autoBtn) autoBtn.textContent = t("autoConnect");
  if (qrBtn) qrBtn.textContent = t("showQR");
  if (copyBtn) copyBtn.textContent = t("copyPass");
  if (mapBtn) mapBtn.textContent = t("openMaps");

  updateCarouselState();
  fillAdminInputs();
}

/* ---------- QR / авто-подключение / копирование ---------- */

function showQR() {
  const ssid = getCurrentSsid();
  const payload = `WIFI:T:WPA;S:${ssid};P:${CONFIG.pass};;`;
  const box = document.getElementById("qrBox");
  const canvasEl = document.getElementById("qrCanvas");
  if (!box || !canvasEl) return;
  if (!qrObj) {
    qrObj = new QRCode(canvasEl, {
      width: 200,
      height: 200
    });
  }
  qrObj.clear();
  qrObj.makeCode(payload);
  box.style.display = "block";
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

function openMaps() {
  window.open(defaultConfig.mapsUrl, "_blank");
}

window.showQR = showQR;
window.autoConnect = autoConnect;
window.copyPass = copyPass;
window.openMaps = openMaps;

/* ---------- Админка ---------- */

function fillAdminInputs() {
  const w = document.getElementById("admWelcome");
  const s5 = document.getElementById("admSsid5");
  const s24 = document.getElementById("admSsid24");
  const pw = document.getElementById("admPass");
  const city = document.getElementById("admCity");

  if (w) w.value = CONFIG.welcome;
  if (s5) s5.value = CONFIG.ssid5;
  if (s24) s24.value = CONFIG.ssid24;
  if (pw) pw.value = CONFIG.pass;
  if (city) city.value = CONFIG.city;
}

function toggleAdmin() {
  if (!adminPanelEl) return;
  adminPanelEl.classList.toggle("open");
}
window.toggleAdmin = toggleAdmin;

function resetConfig() {
  CONFIG = { ...defaultConfig };
  saveConfigToStorage();
  applyConfigToUI();
  fillAdminInputs();
}
window.resetConfig = resetConfig;

function saveConfig() {
  const w = document.getElementById("admWelcome");
  const s5 = document.getElementById("admSsid5");
  const s24 = document.getElementById("admSsid24");
  const pw = document.getElementById("admPass");
  const city = document.getElementById("admCity");

  if (w) CONFIG.welcome = w.value.trim() || defaultConfig.welcome;
  if (s5) CONFIG.ssid5 = s5.value.trim() || defaultConfig.ssid5;
  if (s24) CONFIG.ssid24 = s24.value.trim() || defaultConfig.ssid24;
  if (pw) CONFIG.pass = pw.value.trim() || defaultConfig.pass;
  if (city) CONFIG.city = city.value.trim() || defaultConfig.city;

  saveConfigToStorage();
  applyConfigToUI();
}
window.saveConfig = saveConfig;

/* ---------- INIT ---------- */

window.addEventListener("load", () => {
  recalcWidth();
  applyConfigToUI();
  updateOnlineStatus();
  updateHeroArt();
  fetchWeather();
  speedTest();
  detectAlreadyConnected();
});

window.addEventListener("resize", recalcWidth);
