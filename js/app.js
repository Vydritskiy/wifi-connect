import "./config.js";
import "./time.js";
import "./ui.js";

import { fetchWeather } from "./weather.js";
import { runSpeedTest } from "./speedtest.js";
import { initSkyBackground } from "./background.js";

/* =========================================
   STATE
========================================= */

let refreshing = false;
let booted = false;

/* =========================================
   BACKGROUND + WEATHER
========================================= */

async function refreshBackground() {
  if (refreshing) return;

  refreshing = true;

  try {
    const weather =
      await fetchWeather();

    const data =
      weather || {};

    if (
      window.updateSkyBackground
    ) {
      window.updateSkyBackground(
        data
      );

    } else {
      initSkyBackground(data);
    }

  } catch (error) {
    console.error(
      "Background refresh error:",
      error
    );

  } finally {
    refreshing = false;
  }
}

/* =========================================
   SPEED TEST
========================================= */

async function startSpeedTest() {
  try {
    await runSpeedTest();

  } catch (error) {
    console.error(
      "Speed test error:",
      error
    );
  }
}

/* =========================================
   DEFER HELPERS
========================================= */

function runIdle(task) {
  if (
    "requestIdleCallback" in window
  ) {
    requestIdleCallback(task, {
      timeout: 2000
    });

  } else {
    setTimeout(task, 600);
  }
}

/* =========================================
   INIT (TURBO)
========================================= */

function boot() {
  if (booted) return;

  booted = true;

  /* 1. UI already loaded instantly */

  /* 2. Weather first */
  setTimeout(() => {
    refreshBackground();
  }, 80);

  /* 3. Background engine later */
  runIdle(() => {
    if (!window.__bgEngine) {
      initSkyBackground({});
    }
  });

  /* 4. Speed test last */
  setTimeout(() => {
    startSpeedTest();
  }, 1800);
}

document.addEventListener(
  "DOMContentLoaded",
  boot
);

/* =========================================
   DEBUG TIME
========================================= */

window.addEventListener(
  "debug-time-change",
  () => {
    refreshBackground();
  }
);

/* =========================================
   WEATHER LOOP
========================================= */

setInterval(() => {
  if (
    window.__timeDebug &&
    window.__timeDebug.isEnabled &&
    window.__timeDebug.isEnabled()
  ) {
    return;
  }

  refreshBackground();

}, 600000);

/* =========================================
   SERVICE WORKER
========================================= */

if (
  "serviceWorker" in navigator
) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("./sw.js")
        .catch(console.error);
    }
  );
}