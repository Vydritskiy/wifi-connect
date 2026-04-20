/* =========================================
   UI.JS — полностью исправленный
   Совместим с config.js (setter state fix)
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
  setSlideWidth,

  getCurrentBand,
  getCurrentSsid,
  getSsidForBand,

  recalcWidth,
  updateMeta,
  applyConfigToUI
} from "./config.js";

/* =========================================
   Клоны для бесконечной карусели
   ========================================= */
(function initCarouselClones() {
  if (REAL_COUNT <= 0) return;

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[REAL_COUNT - 1].cloneNode(true);

  el.track.appendChild(firstClone);
  

  el.track.insertBefore(lastClone, el.track.firstChild);
})();

/* =========================================
   GO TO
   ========================================= */
export function goTo(newIndex) {
  if (isAnimating) return;

  setAnimating(true);
  setIndex(newIndex);

  el.track.style.transition =
    "transform 0.7s cubic-bezier(.22,.61,.36,1)";

  el.track.style.transform =
    `translateX(${-newIndex * slideWidth}px)`;

  // fallback если transitionend не пришёл
  clearTimeout(window.__carouselUnlock);
  window.__carouselUnlock = setTimeout(() => {
    setAnimating(false);
    updateMeta();
  }, 800);
}

/* =========================================
   NEXT / PREV
   ========================================= */
export function nextSlide() {
  goTo(index + 1);
}

export function prevSlide() {
  goTo(index - 1);
}

/* =========================================
   TRANSITION END
   ========================================= */
el.track.addEventListener("transitionend", (e) => {
  if (e.propertyName !== "transform") return;

  if (index === 0) {
    el.track.style.transition = "none";
    setIndex(REAL_COUNT);
    el.track.style.transform =
      `translateX(${-REAL_COUNT * slideWidth}px)`;
  }

  if (index === REAL_COUNT + 1) {
    el.track.style.transition = "none";
    setIndex(1);
    el.track.style.transform =
      `translateX(${-1 * slideWidth}px)`;
  }

  updateMeta();
   clearTimeout(window.__carouselUnlock);
  setAnimating(false);
});

/* =========================================
   SWIPE
   ========================================= */
let startX = null;
let startY = null;

function touchStart(e) {
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
}

function touchEnd(e) {
  if (startX == null) return;

  const t = e.changedTouches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
    if (dx < 0) nextSlide();
    else prevSlide();
  }

  startX = null;
  startY = null;
}

if (el.card) {
  el.card.addEventListener("touchstart", touchStart, { passive: true });
  el.card.addEventListener("touchend", touchEnd);
}

/* =========================================
   QR
   ========================================= */
let qrObj = null;

export function showQR() {
  if (!el.qrCanvas || !el.qrBox) return;

  const payload =
    `WIFI:T:WPA;S:${getCurrentSsid()};P:${CONFIG.pass};;`;

  if (!qrObj) {
    qrObj = new QRCode(el.qrCanvas, {
      width: 200,
      height: 200
    });
  }

  qrObj.clear();
  qrObj.makeCode(payload);

  el.qrBox.style.display = "block";
}

/* =========================================
   AUTO CONNECT
   ========================================= */
export function autoConnect() {
  showQR();
}

/* =========================================
   COPY PASS
   ========================================= */
export function copyPass() {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(CONFIG.pass).then(()=>alert("Пароль скопирован"));
  } else {
    window.prompt("Скопируйте пароль:", CONFIG.pass);
  }
}

/* =========================================
   MAPS
   ========================================= */
export function openMaps() {
  window.open(CONFIG.mapsUrl, "_blank");
}

/* =========================================
   ONLINE STATUS
   ========================================= */
export function updateOnlineStatus() {
  if (!el.netStatus) return;

  el.netStatus.textContent = navigator.onLine
    ? "Статус интернета: онлайн ✅"
    : "Статус интернета: офлайн ⛔";
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

/* =========================================
   WIFI CHECK
   Скрывает ТОЛЬКО autoConnect
   ========================================= */
export async function checkWifiConnection() {
  try {
    let connected = false;

    const conn =
      navigator.connection ||
      navigator.webkitConnection ||
      navigator.mozConnection;

    if (conn) {
      if (
        conn.type === "wifi" ||
        conn.effectiveType === "wifi"
      ) {
        connected = true;
      }
    }

    if (window.__speedDownMbps >= 8) {
      connected = true;
    }

    if (connected) {
      if (el.connectedBanner)
        el.connectedBanner.classList.add("show");

      if (el.btnAutoConnect)
        el.btnAutoConnect.style.display = "none";
    } else {
      if (el.connectedBanner)
        el.connectedBanner.classList.remove("show");

      if (el.btnAutoConnect)
        el.btnAutoConnect.style.display = "";
    }

    updateMeta();

  } catch (e) {
    console.error("WiFi check error:", e);
  }
}

/* =========================================
   ADMIN PANEL
   ========================================= */
export function toggleAdmin() {
  if (!el.adminPanel) return;
  el.adminPanel.classList.toggle("open");
}

/* =========================================
   INIT BUTTONS
   ========================================= */
(function bindButtons() {
  if (el.btnPrev) el.btnPrev.addEventListener("click", prevSlide);
  if (el.btnNext) el.btnNext.addEventListener("click", nextSlide);

  if (el.btnShowQR) el.btnShowQR.addEventListener("click", showQR);
  if (el.btnAutoConnect) el.btnAutoConnect.addEventListener("click", autoConnect);
  if (el.btnCopyPass) el.btnCopyPass.addEventListener("click", copyPass);
  if (el.btnOpenMaps) el.btnOpenMaps.addEventListener("click", openMaps);

  if (el.btnAdminToggle) el.btnAdminToggle.addEventListener("click", toggleAdmin);
  if (el.btnAdminClose) el.btnAdminClose.addEventListener("click", toggleAdmin);
  if (el.btnAdminBackdrop) el.btnAdminBackdrop.addEventListener("click", toggleAdmin);
})();
