/* =========================================
   UI.JS
   Clean stable version
========================================= */

import {
  CONFIG,
  el,
  REAL_COUNT,

  updateMeta,
  applyConfigToUI
} from "./config.js";

/* =========================================
   CAROUSEL
========================================= */

let current = 1;
let width = 0;
let busy = false;

function setupCarousel() {
  if (!el.track || REAL_COUNT < 2) return;

  const originalSlides = Array.from(el.track.children);

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

  width = el.carousel.offsetWidth;
  jumpTo(1);
}

function jumpTo(i) {
  current = i;

  el.track.classList.add("no-anim");
  el.track.style.transform =
    `translateX(${-current * width}px)`;

  void el.track.offsetWidth;

  el.track.classList.remove("no-anim");

  syncMeta();
}

function slideTo(i) {
  current = i;

  el.track.style.transform =
    `translateX(${-current * width}px)`;
}

function syncMeta() {
  const logical =
    (current - 1 + REAL_COUNT) % REAL_COUNT;

  const dots = el.dots || [];

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === logical);
  });

  if (el.netStatus) {
    const ssid =
      logical === 0
        ? CONFIG.ssid5
        : CONFIG.ssid24;

    el.netStatus.textContent =
      `Выбрана сеть: ${ssid}`;
  }
}
export function nextSlide() {
  if (busy) return;
  busy = true;

  slideTo(current + 1);

  setTimeout(() => {
    if (current === REAL_COUNT + 1) {
      jumpTo(1);
    }

    syncMeta();
    busy = false;
  }, 560);
}

export function prevSlide() {
  if (busy) return;
  busy = true;

  slideTo(current - 1);

  setTimeout(() => {
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
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
}

function touchEnd(e) {
  const t = e.changedTouches[0];

  const dx = t.clientX - startX;
  const dy = t.clientY - startY;

  if (
    Math.abs(dx) > Math.abs(dy) &&
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
    alert("Пароль скопирован");
  } catch {
    prompt("Скопируйте пароль:", pass);
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

  const pass = CONFIG.pass;

  if (/android/i.test(navigator.userAgent)) {
    location.href =
      `WIFI:T:WPA;S:${ssid};P:${pass};;`;

    return;
  }

  copyPass();
  alert(`Выберите сеть ${ssid}`);
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

  if (window.__speedDownMbps >= 8) {
    connected = true;
  }

  el.connectedBanner?.classList.toggle(
    "show",
    connected
  );

  if (el.btnAutoConnect) {
    el.btnAutoConnect.style.display =
      connected ? "none" : "";
  }
}

/* =========================================
   ADMIN
========================================= */

export function toggleAdmin() {
  el.adminPanel?.classList.toggle("open");
}

/* =========================================
   EVENTS
========================================= */

function bind(node, fn) {
  node?.addEventListener("click", fn);
}

bind(el.btnPrev, prevSlide);
bind(el.btnNext, nextSlide);

bind(el.btnCopyPass, copyPass);
bind(el.btnOpenMaps, openMaps);
bind(el.btnAutoConnect, autoConnect);

bind(el.btnAdminToggle, toggleAdmin);
bind(el.btnAdminClose, toggleAdmin);
bind(el.btnAdminBackdrop, toggleAdmin);

el.carousel?.addEventListener(
  "touchstart",
  touchStart,
  { passive:true }
);

el.carousel?.addEventListener(
  "touchend",
  touchEnd
);

window.addEventListener("resize", () => {
  width = el.carousel.offsetWidth;
  jumpTo(current);
});

/* =========================================
   INIT
========================================= */

applyConfigToUI();
setupCarousel();
checkWifiConnection();
