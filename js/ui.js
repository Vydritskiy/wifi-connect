/* =========================================
   UI.JS
   Renamed version
========================================= */

import {
  CONFIG,
  el,
  REAL_COUNT,
  applyConfigToUI
} from "./config.js";

import {
  getTimeState,
  subscribeTime
} from "./time.js";

/* =========================================
   Helpers
========================================= */

function safeTimeout(fn, ms) {
  return window.setTimeout(fn, ms);
}

function showToast(message = "") {
  const old =
    document.querySelector(".app-toast");

  if (old) old.remove();

  const toast =
    document.createElement("div");

  toast.className = "app-toast";
  toast.textContent = message;

  toast.style.cssText = `
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    z-index: 9999;
    background: rgba(20,20,20,.92);
    color: #fff;
    padding: 12px 16px;
    border-radius: 14px;
    font-size: 14px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 30px rgba(0,0,0,.22);
    opacity: 0;
    transition: .25s ease;
  `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.bottom = "34px";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.bottom = "20px";

    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 2200);
}

/* =========================================
   CAROUSEL
========================================= */

let current = 1;
let width = 0;
let busy = false;

function setupCarousel() {
  if (!el.track || !el.carousel || REAL_COUNT < 2) {
    return;
  }

  const originalSlides =
    Array.from(el.track.children);

  if (!originalSlides.length) {
    return;
  }

  el.track.innerHTML = "";

  const firstClone =
    originalSlides[0].cloneNode(true);

  const lastClone =
    originalSlides[
      originalSlides.length - 1
    ].cloneNode(true);

  el.track.appendChild(lastClone);

  originalSlides.forEach(slide => {
    el.track.appendChild(slide);
  });

  el.track.appendChild(firstClone);

  width =
    el.carousel.offsetWidth;

  jumpTo(1);
}

function jumpTo(i) {
  current = i;

  if (!el.track) return;

  el.track.classList.add("no-anim");

  el.track.style.transform =
    `translateX(${-current * width}px)`;

  void el.track.offsetWidth;

  el.track.classList.remove("no-anim");

  syncMeta();
}

function slideTo(i) {
  current = i;

  if (!el.track) return;

  el.track.style.transform =
    `translateX(${-current * width}px)`;
}

function syncMeta() {
  const logical =
    (current - 1 + REAL_COUNT) %
    REAL_COUNT;

  (el.dots || []).forEach(
    (dot, i) => {
      dot.classList.toggle(
        "active",
        i === logical
      );
    }
  );
}

export function nextSlide() {
  if (busy || REAL_COUNT < 2) return;

  busy = true;
  slideTo(current + 1);

  safeTimeout(() => {
    if (current === REAL_COUNT + 1) {
      jumpTo(1);
    }

    syncMeta();
    busy = false;
  }, 560);
}

export function prevSlide() {
  if (busy || REAL_COUNT < 2) return;

  busy = true;
  slideTo(current - 1);

  safeTimeout(() => {
    if (current === 0) {
      jumpTo(REAL_COUNT);
    }

    syncMeta();
    busy = false;
  }, 560);
}

/* =========================================
   SWIPE
========================================= */

let startX = 0;
let startY = 0;

function touchStart(e) {
  const t = e.touches?.[0];
  if (!t) return;

  startX = t.clientX;
  startY = t.clientY;
}

function touchEnd(e) {
  const t =
    e.changedTouches?.[0];

  if (!t) return;

  const dx =
    t.clientX - startX;

  const dy =
    t.clientY - startY;

  if (
    Math.abs(dx) >
      Math.abs(dy) &&
    Math.abs(dx) > 45
  ) {
    dx < 0
      ? nextSlide()
      : prevSlide();
  }
}

/* =========================================
   ACTIONS
========================================= */

export async function copyPass(e) {
  e?.preventDefault();

  const pass = CONFIG.pass;

  try {
    await navigator.clipboard.writeText(pass);
    showToast("Пароль скопирован");

  } catch {
    showToast(`Пароль: ${pass}`);
  }
}

export function openMaps(e) {
  e?.preventDefault();

  if (!CONFIG.mapsUrl) return;

  window.open(
    CONFIG.mapsUrl,
    "_blank",
    "noopener,noreferrer"
  );
}

export function autoConnect(e) {
  e?.preventDefault();

  const ssid =
    current === 1
      ? CONFIG.ssid5
      : CONFIG.ssid24;

  const pass =
    CONFIG.pass;

  if (/android/i.test(navigator.userAgent)) {
    location.href =
      `WIFI:T:WPA;S:${ssid};P:${pass};;`;

    return;
  }

  copyPass();
  showToast(`Выберите сеть ${ssid}`);
}

/* =========================================
   CLOCK
========================================= */

function initClock() {
  const face =
    document.querySelector(
      ".clock-face"
    );

  if (!face) return;

  face
    .querySelectorAll(".tick")
    .forEach(node =>
      node.remove()
    );

  for (let i = 0; i < 60; i++) {
    const tick =
      document.createElement("div");

    tick.className =
      i % 5 === 0
        ? "tick big"
        : "tick";

    tick.style.transform =
      `translateX(-50%) rotate(${i * 6}deg)`;

    face.appendChild(tick);
  }
}

function updateClock(state = getTimeState()) {
  const {
    hour,
    minute,
    second
  } = state;

  const h = hour % 12;

  if (el.hourHand) {
    el.hourHand.style.transform =
      `translateX(-50%) rotate(${h * 30 + minute * 0.5}deg)`;
  }

  if (el.minuteHand) {
    el.minuteHand.style.transform =
      `translateX(-50%) rotate(${minute * 6 + second * 0.1}deg)`;
  }

  if (el.secondHand) {
    el.secondHand.style.transform =
      `translateX(-50%) rotate(${second * 6}deg)`;
  }
}

function buildClockMarks() {
  const svg = document.getElementById("clockSvg");
  if (!svg) return;

  svg.innerHTML =
    `<circle cx="50" cy="50" r="48" class="clock-ring"></circle>`;

  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;

    const line =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

    line.setAttribute("x1", "50");
    line.setAttribute("y1", "4");
    line.setAttribute("x2", "50");
    line.setAttribute(
      "y2",
      big ? "14" : "7"
    );

    line.setAttribute(
      "transform",
      `rotate(${i * 6} 50 50)`
    );

    line.setAttribute(
      "class",
      big ? "mark-big" : "mark-small"
    );

    svg.appendChild(line);
  }
}

function startClock() {
  buildClockMarks();
  initClock();
  updateClock();
  subscribeTime(updateClock);
}

/* =========================================
   RESPONSIVE CARD
========================================= */

function fitWeatherCard() {
  const card =
    document.getElementById(
      "weather-card"
    );

  const parent =
    card?.parentElement;

  if (!card || !parent) return;

  const w =
    parent.clientWidth;

  const design = 1600;

  let scale =
    Math.min(w / design, 1);

  scale =
    Math.max(scale, 0.55);

  card.style.setProperty(
    "--scale",
    scale
  );
}

function initResizeWatchers() {
  fitWeatherCard();

  window.addEventListener(
    "resize",
    fitWeatherCard
  );

  const target =
    document.querySelector(
      ".bottom-section"
    );

  if (
    target &&
    window.ResizeObserver
  ) {
    new ResizeObserver(
      fitWeatherCard
    ).observe(target);
  }
}

/* =========================================
   STATUS
========================================= */

export function checkWifiConnection() {
  let connected = false;

  const conn =
    navigator.connection ||
    navigator.webkitConnection;

  if (
    conn &&
    (
      conn.type === "wifi" ||
      conn.effectiveType === "wifi"
    )
  ) {
    connected = true;
  }

  if (
    window.__speedDownMbps >= 8
  ) {
    connected = true;
  }

  el.statusBanner
    ?.classList.toggle(
      "show",
      connected
    );

  if (el.btnAutoConnect) {
    el.btnAutoConnect.style.display =
      connected
        ? "none"
        : "";
  }
}

/* =========================================
   ADMIN
========================================= */

export function toggleAdmin() {
  el.adminPanel
    ?.classList.toggle("open");
}

/* =========================================
   EVENTS
========================================= */

function bind(node, fn) {
  node?.addEventListener(
    "click",
    fn
  );
}

function bindEvents() {
  bind(el.btnPrev, prevSlide);
  bind(el.btnNext, nextSlide);
  bind(el.btnCopyPass, copyPass);
  bind(el.btnOpenMaps, openMaps);
  bind(el.btnAutoConnect, autoConnect);

  el.carousel?.addEventListener(
    "touchstart",
    touchStart,
    { passive: true }
  );

  el.carousel?.addEventListener(
    "touchend",
    touchEnd
  );

  window.addEventListener(
    "resize",
    () => {
      if (!el.carousel) return;

      width =
        el.carousel.offsetWidth;

      jumpTo(current);
    }
  );
}

/* =========================================
   INIT
========================================= */

function initUI() {
  applyConfigToUI();
  setupCarousel();
  bindEvents();
  startClock();
  initResizeWatchers();
  checkWifiConnection();
}

document.addEventListener(
  "DOMContentLoaded",
  initUI
);