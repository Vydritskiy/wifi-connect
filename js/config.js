/* =========================================
   CONFIG.JS — базовая конфигурация и UI основа
   ========================================= */

// ---------- Конфиг + localStorage ----------
export const defaultConfig = {
  ssid5: "r2d5",
  ssid24: "r2d2",
  pass: "Jgthfnbdysq1913",
  welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
  mapsUrl: "https://www.google.com/maps/place/вулиця+Андрія+Малишка,+31А,+Київ",
  weatherApiKey: "a6bfa1313f42de95ed0d1c270d242040"
};

export let CONFIG = loadConfig();

export function loadConfig() {
  try {
    const saved = localStorage.getItem("wifiGuestConfig");
    if (saved) {
      const obj = JSON.parse(saved);

      // чистка некорректных значений
      if (obj.mapsUrl && /maps\.app\.goo\.gl\/XXXXXXXX/i.test(obj.mapsUrl)) {
        delete obj.mapsUrl;
      }
      if (obj.weatherApiKey) {
        delete obj.weatherApiKey;
      }

      return Object.assign({}, defaultConfig, obj);
    }
  } catch (e) {}

  return { ...defaultConfig };
}

export function saveConfigToStorage() {
  try {
    const { weatherApiKey, ...rest } = CONFIG;
    localStorage.setItem("wifiGuestConfig", JSON.stringify(rest));
  } catch (e) {}
}



// =========================================
// DOM-элементы (глобальные ссылки)
// =========================================

export const el = {
  track: document.getElementById("track"),
  carousel: document.getElementById("carousel"),
  card: document.querySelector(".card"),
  helperText: document.getElementById("helperText"),
  netStatus: document.getElementById("netStatus"),
  dots: document.querySelectorAll(".dots span"),
  welcomeEl: document.getElementById("welcomeText"),
  adminPanel: document.getElementById("adminPanel"),
  weatherBg: document.getElementById("weatherBg"),

  // TIME BANNER
  timeBanner: document.getElementById("timeBanner"),
  timeBannerTitle: document.getElementById("timeBannerTitle"),
  timeBannerSub: document.getElementById("timeBannerSub"),
  timeBannerArt: document.getElementById("timeBannerArt"),

  // SUPER WEATHER CARD
  superCity: document.getElementById("superCity"),
  superCond: document.getElementById("superCond"),
  superTemp: document.getElementById("superTemp"),
  superMeta: document.getElementById("superMeta"),
  superPing: document.getElementById("superPing"),
  superDown: document.getElementById("superDown"),
  superUp: document.getElementById("superUp"),
  superStatus: document.getElementById("superStatus"),

  // QR
  qrBox: document.getElementById("qrBox"),
  qrCanvas: document.getElementById("qrCanvas"),

  // CONNECTED BANNER
  connectedBanner: document.getElementById("connectedBanner"),

  // BUTTONS
  btnAutoConnect: document.getElementById("btnAutoConnect"),
  btnShowQR: document.getElementById("btnShowQR"),
  btnCopyPass: document.getElementById("btnCopyPass"),
  btnOpenMaps: document.getElementById("btnOpenMaps"),
  btnPrev: document.getElementById("btnPrev"),
  btnNext: document.getElementById("btnNext"),

  // ADMIN
  btnAdminToggle: document.getElementById("btnAdminToggle"),
  btnAdminClose: document.getElementById("btnAdminClose"),
  btnAdminBackdrop: document.getElementById("btnAdminBackdrop"),
  btnAdminSave: document.getElementById("btnAdminSave"),
  btnAdminReset: document.getElementById("btnAdminReset"),

  admWelcome: document.getElementById("admWelcome"),
  admSsid5: document.getElementById("admSsid5"),
  admSsid24: document.getElementById("admSsid24"),
  admPass: document.getElementById("admPass")
};



// =========================================
// Глобальные переменные состояния
// =========================================

export let slides = Array.from(document.querySelectorAll(".slide"));
export const REAL_COUNT = slides.length;

export let index = 1;
export let slideWidth = 0;
export let isAnimating = false;

export const ua = navigator.userAgent.toLowerCase();
export const isIOS = /iphone|ipad|ipod/.test(ua);
export const isAndroid = /android/.test(ua);
export const oldAndroid = /android\s([0-6]\.|7\.0)/i.test(ua);
export const oldIOS = /os\s(9_|10_)/i.test(ua);

export let lastWeatherKind = null;
export let lastWeatherIsNight = false;
export let lastWeatherTemp = null;



// =========================================
// Helpers — выбор сети
// =========================================

export function getCurrentBand() {
  const logical = (index - 1 + REAL_COUNT) % REAL_COUNT;
  return logical === 0 ? "5" : "24";
}

export function getSsidForBand(band) {
  return band === "5" ? CONFIG.ssid5 : CONFIG.ssid24;
}

export function getCurrentSsid() {
  return getSsidForBand(getCurrentBand());
}



// =========================================
// Применение конфигурации к UI
// =========================================

export function applyConfigToUI() {
  if (el.welcomeEl) el.welcomeEl.textContent = CONFIG.welcome;

  document.querySelectorAll(".slide").forEach(slide => {
    const band = slide.dataset.net === "r2d5" ? "5" : "24";
    const ssidMain = slide.querySelector(".slide-ssid-main");
    const ssidSub = slide.querySelector(".slide-ssid-sub");
    const cap = slide.querySelector(".slide-caption");

    if (ssidMain) ssidMain.textContent = getSsidForBand(band);
    if (ssidSub) ssidSub.textContent = band === "5" ? "5 GHz" : "2.4 GHz";

    if (cap) {
      cap.textContent = band === "5"
        ? `${getSsidForBand("5")} · быстрее, если поддерживается`
        : `${getSsidForBand("24")} · стабильнее на расстоянии`;
    }
  });

  updateMeta();
}



// =========================================
// Пересчёт ширины слайдов
// =========================================

export function recalcWidth() {
  slideWidth = el.carousel.offsetWidth;
  el.track.style.transition = "none";
  el.track.style.transform = `translateX(${-index * slideWidth}px)`;
  void el.track.offsetWidth;
  el.track.style.transition = "transform 0.7s cubic-bezier(.22,.61,.36,1)";
  updateMeta();
}



// =========================================
// Обновление метаданных хелпера и точек
// =========================================

export function updateMeta() {
  const logical = (index - 1 + REAL_COUNT) % REAL_COUNT;

  el.dots.forEach((d, i) => d.classList.toggle("active", i === logical));

  const band = logical === 0 ? "5" : "24";
  const ssid = getSsidForBand(band);

  let base =
    band === "5"
      ? `Выбрана ${ssid} (5 GHz) — быстрее, если устройство поддерживает 5 GHz.`
      : `Выбрана ${ssid} (2.4 GHz) — стабильнее на расстоянии.`;

  if (isIOS) base += " Если страница открыта на iPhone — зайди в настройки Wi-Fi.";
  else if (isAndroid) base += " На Android можно нажать «Подключиться автоматически».";
  else base += " На ноутбуке удобно отсканировать QR.";

  el.helperText.textContent = base;
}



// =========================================
// Сервисный код — стартовая корректировка выбора слайда
// =========================================

// старые устройства начинают со второго слайда (2.4 GHz)
(function autoPick() {
  index = (oldAndroid || oldIOS) ? 2 : 1;
})();
