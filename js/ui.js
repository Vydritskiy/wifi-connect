/* =========================================
   UI.JS
   Carousel + Actions + Admin + Status
========================================= */

import {
  CONFIG,
  el,
  slides,
  REAL_COUNT,
  index,
  slideWidth,
  isAnimating,

  setIndex,
  setAnimating,

  getCurrentSsid,
  updateMeta,
  recalcWidth,
  applyConfigToUI
} from "./config.js";

/* -----------------------------------------
   CLONES (infinite carousel)
----------------------------------------- */

(function createClones() {
  if (!el.track || REAL_COUNT < 2) return;

  const first = slides[0].cloneNode(true);
  const last = slides[REAL_COUNT - 1].cloneNode(true);

  el.track.appendChild(first);
  el.track.prepend(last);
})();

/* -----------------------------------------
   CAROUSEL
----------------------------------------- */

function unlock() {
  clearTimeout(window.__carouselLock);
  setAnimating(false);
}

export function goTo(nextIndex) {
  if (!el.track || isAnimating) return;

  setAnimating(true);
  setIndex(nextIndex);

  el.track.classList.remove("no-anim");
  el.track.style.transform =
    `translateX(${-nextIndex * slideWidth}px)`;

  clearTimeout(window.__carouselLock);
  window.__carouselLock =
    setTimeout(unlock, 700);
}

export function nextSlide() {
  goTo(index + 1);
}

export function prevSlide() {
  goTo(index - 1);
}

function fixLoop() {
  if (index === 0) {
    el.track.classList.add("no-anim");
    setIndex(REAL_COUNT);
    el.track.style.transform =
      `translateX(${-REAL_COUNT * slideWidth}px)`;
  }

  if (index === REAL_COUNT + 1) {
    el.track.classList.add("no-anim");
    setIndex(1);
    el.track.style.transform =
      `translateX(${-slideWidth}px)`;
  }

  updateMeta();
  unlock();
}

el.track?.addEventListener(
  "transitionend",
  fixLoop
);

/* -----------------------------------------
   SWIPE
----------------------------------------- */

let startX = 0;
let startY = 0;

function onTouchStart(e) {
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
}

function onTouchEnd(e) {
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

el.carousel?.addEventListener(
  "touchstart",
  onTouchStart,
  { passive:true }
);

el.carousel?.addEventListener(
  "touchend",
  onTouchEnd
);

/* -----------------------------------------
   ACTIONS
----------------------------------------- */

export function copyPass() {
  const pass = CONFIG.pass;

  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    navigator.clipboard
      .writeText(pass)
      .then(() => alert("Пароль скопирован"));
  } else {
    prompt("Скопируйте пароль:", pass);
  }
}

export function openMaps() {
  window.open(
    CONFIG.mapsUrl,
    "_blank",
    "noopener"
  );
}

export function autoConnect() {
  const ssid = getCurrentSsid();
  const pass = CONFIG.pass;

  const ua =
    navigator.userAgent.toLowerCase();

  if (/android/.test(ua)) {
    const payload =
      `WIFI:T:WPA;S:${ssid};P:${pass};;`;

    location.href = payload;
    return;
  }

  copyPass();

  alert(
    `Выберите сеть ${ssid} вручную`
  );
}

/* -----------------------------------------
   ONLINE STATUS
----------------------------------------- */

export function updateOnlineStatus() {
  if (!el.netStatus) return;

  const online = navigator.onLine;

  el.netStatus.textContent = online
    ? `Интернет: онлайн ✅`
    : `Интернет: офлайн ⛔`;
}

window.addEventListener(
  "online",
  updateOnlineStatus
);

window.addEventListener(
  "offline",
  updateOnlineStatus
);

/* -----------------------------------------
   CONNECTED BANNER
----------------------------------------- */

export function checkWifiConnection() {
  let connected = false;

  const conn =
    navigator.connection ||
    navigator.webkitConnection ||
    navigator.mozConnection;

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

/* -----------------------------------------
   ADMIN PANEL
----------------------------------------- */

export function toggleAdmin() {
  el.adminPanel?.classList.toggle("open");
}

/* -----------------------------------------
   EVENTS
----------------------------------------- */

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

/* -----------------------------------------
   STARTUP
----------------------------------------- */

window.addEventListener(
  "resize",
  recalcWidth
);

applyConfigToUI();
recalcWidth();
updateMeta();
updateOnlineStatus();
checkWifiConnection();
