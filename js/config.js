/* =========================================
   CONFIG.JS
   Core config + DOM refs + shared state
========================================= */

/* -----------------------------------------
   DEFAULT CONFIG
----------------------------------------- */

export const defaultConfig = {
  ssid5: "r2d5",
  ssid24: "r2d2",
  pass: "Jgthfnbdysq1913",

  welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",

  mapsUrl:
    "https://www.google.com/maps/place/вулиця+Андрія+Малишка,+31А,+Київ",

  city: "Kyiv",
  weatherApiKey: "6530afae9a05d8f6e1c997682469a69d"
};

/* -----------------------------------------
   STORAGE
----------------------------------------- */

export function loadConfig() {
  try {
    const raw = localStorage.getItem("wifiGuestConfig");
    if (!raw) return { ...defaultConfig };

    const saved = JSON.parse(raw);

    const {
      weatherApiKey,
      ...safeData
    } = saved || {};

    return {
      ...defaultConfig,
      ...safeData
    };

  } catch {
    return { ...defaultConfig };
  }
}

export let CONFIG = loadConfig();

export function saveConfigToStorage() {
  try {
    const { weatherApiKey, ...safeData } = CONFIG;

    localStorage.setItem(
      "wifiGuestConfig",
      JSON.stringify(safeData)
    );
  } catch {}
}

/* -----------------------------------------
   DOM REFERENCES
----------------------------------------- */

export const el = {
  /* layout */
  carousel: document.getElementById("carousel"),
  track: document.getElementById("track"),
  card: document.querySelector(".card"),

  /* text */
  welcomeEl: document.getElementById("welcomeText"),

  /* dots */
  dots: Array.from(document.querySelectorAll(".dots span")),

  /* buttons */
  btnPrev: document.getElementById("btnPrev"),
  btnNext: document.getElementById("btnNext"),

  btnAutoConnect: document.getElementById("btnAutoConnect"),
  btnCopyPass: document.getElementById("copyBtn"),
  btnOpenMaps: document.getElementById("mapBtn"),

  /* connected */
  connectedBanner: document.getElementById("connectedBanner"),

  /* weather */
  weatherBg: document.getElementById("weatherBg"),
  superCity: document.getElementById("superCity"),
  superCond: document.getElementById("superCond"),
  superTemp: document.getElementById("superTemp"),
  superMeta: document.getElementById("superMeta"),
  superPing: document.getElementById("superPing"),
  superDown: document.getElementById("superDown"),
  superUp: document.getElementById("superUp"),
  superStatus: document.getElementById("superStatus"),

  /* admin */
  adminPanel: document.getElementById("adminPanel"),
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

/* -----------------------------------------
   CAROUSEL STATE
----------------------------------------- */

export let slides = Array.from(
  document.querySelectorAll(".slide")
);

export const REAL_COUNT = slides.length;

export let index = 1;
export let slideWidth = 0;
export let isAnimating = false;

/* -----------------------------------------
   DEVICE INFO
----------------------------------------- */

export const ua = navigator.userAgent.toLowerCase();

export const isAndroid = /android/.test(ua);
export const isIOS = /iphone|ipad|ipod/.test(ua);

export const oldAndroid =
  /android\s([0-6]\.|7\.0)/i.test(ua);

export const oldIOS =
  /os\s(9_|10_)/i.test(ua);

/* -----------------------------------------
   WEATHER STATE
----------------------------------------- */

export let lastWeatherKind = null;
export let lastWeatherIsNight = false;
export let lastWeatherTemp = null;

export function setWeatherState(kind, night, temp){
  lastWeatherKind = kind;
  lastWeatherIsNight = night;
  lastWeatherTemp = temp;
}

/* -----------------------------------------
   HELPERS
----------------------------------------- */

export function getCurrentBand() {
  const logical =
    (index - 1 + REAL_COUNT) % REAL_COUNT;

  return logical === 0 ? "5" : "24";
}

export function getSsidForBand(band) {
  return band === "5"
    ? CONFIG.ssid5
    : CONFIG.ssid24;
}

export function getCurrentSsid() {
  return getSsidForBand(getCurrentBand());
}

/* -----------------------------------------
   UI APPLY
----------------------------------------- */

export function applyConfigToUI() {
  if (el.welcomeEl) {
    el.welcomeEl.textContent = CONFIG.welcome;
  }

  document
    .querySelectorAll(".slide")
    .forEach(slide => {

      const band =
        slide.dataset.net === "r2d5"
          ? "5"
          : "24";

      const caption =
        slide.querySelector(".slide-caption");

      if (caption) {
        caption.textContent =
          band === "5"
            ? `${CONFIG.ssid5} · быстрее`
            : `${CONFIG.ssid24} · стабильнее`;
      }
    });

  if (el.btnOpenMaps) {
    el.btnOpenMaps.href = CONFIG.mapsUrl;
  }
}

/* -----------------------------------------
   CAROUSEL META
----------------------------------------- */

export function updateMeta() {
  const logical =
    (index - 1 + REAL_COUNT) % REAL_COUNT;

  el.dots.forEach((dot, i) => {
    dot.classList.toggle(
      "active",
      i === logical
    );
  });

  if (el.netStatus) {
    const ssid = getCurrentSsid();

    el.netStatus.textContent =
      `Выбрана сеть: ${ssid}`;
  }
}

export function recalcWidth() {
  if (!el.carousel || !el.track) return;

  slideWidth = el.carousel.offsetWidth;

  el.track.style.transition = "none";
  el.track.style.transform =
    `translateX(${-index * slideWidth}px)`;

  void el.track.offsetWidth;
}

/* -----------------------------------------
   MUTATORS
----------------------------------------- */

export function setIndex(v){
  index = v;
}

export function setAnimating(v){
  isAnimating = v;
}

export function setSlideWidth(v){
  slideWidth = v;
}

/* -----------------------------------------
   START POSITION
----------------------------------------- */

(function autoPick() {
  index =
    (oldAndroid || oldIOS)
      ? 2
      : 1;
})();
