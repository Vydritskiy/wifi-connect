/* =========================================
   CONFIG.JS
   Renamed refs for new naming system
========================================= */

/* =========================================
   DEFAULT CONFIG
========================================= */

export const defaultConfig = {
  ssid5: "r2d5",
  ssid24: "r2d2",
  pass: "Jgthfnbdysq1913",

  welcome:
    "Добро пожаловать! Чувствуй себя как дома 🧡",

  mapsUrl:
    "https://www.google.com/maps/place/вулиця+Андрія+Малишка,+31А,+Київ",

  city: "Kyiv",

  weatherApiKey:
    "6530afae9a05d8f6e1c997682469a69d"
};

/* =========================================
   STORAGE
========================================= */

export function loadConfig() {
  try {
    const raw =
      localStorage.getItem(
        "wifiGuestConfig"
      );

    if (!raw) {
      return {
        ...defaultConfig
      };
    }

    const saved =
      JSON.parse(raw) || {};

    const {
      weatherApiKey,
      ...safeData
    } = saved;

    return {
      ...defaultConfig,
      ...safeData
    };

  } catch {
    return {
      ...defaultConfig
    };
  }
}

export let CONFIG =
  loadConfig();

export function saveConfigToStorage() {
  try {
    const {
      weatherApiKey,
      ...safeData
    } = CONFIG;

    localStorage.setItem(
      "wifiGuestConfig",
      JSON.stringify(safeData)
    );

  } catch {}
}

/* =========================================
   DOM HELPERS
========================================= */

function byId(id) {
  return document.getElementById(id);
}

function qs(sel) {
  return document.querySelector(sel);
}

function qsa(sel) {
  return Array.from(
    document.querySelectorAll(sel)
  );
}

/* =========================================
   DOM REFERENCES
========================================= */

export const el = {};

export function refreshDomRefs() {
  /* layout */
  el.carousel = byId("carousel");
  el.track = byId("track");
  el.card = qs(".card");

  /* text */
  el.welcomeEl = byId("welcomeText");

  /* dots */
  el.dots = qsa(".dots span");

  /* navigation */
  el.btnPrev = byId("btn-prev");
  el.btnNext = byId("btn-next");

  /* actions */
  el.btnAutoConnect =
    byId("btn-auto-connect");

  el.btnCopyPass =
    byId("btn-copy");

  el.btnOpenMaps =
    byId("btn-map");

  /* status */
  el.statusBanner =
    byId("status-banner");

  /* weather */
  el.weatherCity =
    byId("weather-city");

  el.weatherDate =
    byId("weather-date");

  el.weatherTemp =
    byId("weather-temp");

  el.weatherMeta =
    byId("weather-meta");

  el.weatherCond =
    byId("weather-cond");

  el.weatherHumidity =
    byId("weather-humidity");

  el.weatherWind =
    byId("weather-wind");

  el.weatherPressure =
    byId("weather-pressure");

  /* clock */
  el.hourHand =
    byId("hourHand");

  el.minuteHand =
    byId("minuteHand");

  el.secondHand =
    byId("secondHand");

  /* speedtest */
  el.weatherPing =
    byId("weather-ping");

  el.weatherDown =
    byId("weather-down");

  el.weatherUp =
    byId("weather-up");

  el.weatherStatus =
    byId("weather-status");

  /* admin */
  el.adminPanel =
    byId("admin-panel");

  el.btnAdminSave =
    byId("btn-admin-save");

  el.adminWelcome =
    byId("admin-welcome");

  el.adminSsid5 =
    byId("admin-ssid-5");

  el.adminSsid24 =
    byId("admin-ssid-24");

  el.adminPass =
    byId("admin-pass");
}

refreshDomRefs();

/* =========================================
   DEVICE INFO
========================================= */

const ua =
  navigator.userAgent.toLowerCase();

export const isAndroid =
  /android/.test(ua);

export const isIOS =
  /iphone|ipad|ipod/.test(ua);

export const oldAndroid =
  /android\s([0-6]\.|7\.0)/i
    .test(ua);

export const oldIOS =
  /os\s(9_|10_)/
    .test(ua);

/* =========================================
   SLIDES META
========================================= */

export const REAL_COUNT =
  document.querySelectorAll(
    ".slide"
  ).length;

/* =========================================
   WEATHER SHARED STATE
========================================= */

export const weatherState = {
  kind: "clear",
  isNight: false,
  temp: 0
};

export function setWeatherState(
  kind,
  isNight,
  temp
) {
  weatherState.kind =
    kind || "clear";

  weatherState.isNight =
    !!isNight;

  weatherState.temp =
    Number(temp) || 0;
}

/* =========================================
   HELPERS
========================================= */

export function getCurrentBand(
  logicalIndex = 0
) {
  return logicalIndex === 0
    ? "5"
    : "24";
}

export function getSsidForBand(
  band
) {
  return band === "5"
    ? CONFIG.ssid5
    : CONFIG.ssid24;
}

export function getCurrentSsid(
  logicalIndex = 0
) {
  return getSsidForBand(
    getCurrentBand(
      logicalIndex
    )
  );
}

/* =========================================
   APPLY CONFIG TO UI
========================================= */

export function applyConfigToUI() {
  if (el.welcomeEl) {
    el.welcomeEl.textContent =
      CONFIG.welcome;
  }

  document
    .querySelectorAll(".slide")
    .forEach(slide => {
      const band =
        slide.dataset.net ===
        "r2d5"
          ? "5"
          : "24";

      const caption =
        slide.querySelector(
          ".slide-caption"
        );

      if (caption) {
        caption.textContent =
          band === "5"
            ? `${CONFIG.ssid5} · быстрее`
            : `${CONFIG.ssid24} · стабильнее`;
      }
    });

  if (el.btnOpenMaps) {
    el.btnOpenMaps.dataset.url =
      CONFIG.mapsUrl;
  }
}