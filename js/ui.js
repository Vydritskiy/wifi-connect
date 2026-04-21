/* =========================================
   UI.JS — merged final version (full original + fixes)
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

(function initCarouselClones() {
  if (REAL_COUNT <= 0) return;
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[REAL_COUNT - 1].cloneNode(true);
  el.track.appendChild(firstClone);
  el.track.insertBefore(lastClone, el.track.firstChild);
})();

function unlockCarousel(){
  clearTimeout(window.__carouselUnlock);
  setAnimating(false);
}

export function goTo(newIndex) {
  if (isAnimating) return;
  setAnimating(true);
  setIndex(newIndex);
  el.track.style.transition = "transform 0.7s cubic-bezier(.22,.61,.36,1)";
  el.track.style.transform = `translateX(${-newIndex * slideWidth}px)`;
  clearTimeout(window.__carouselUnlock);
  window.__carouselUnlock = setTimeout(() => {
    updateMeta();
    applyConfigToUI();
    unlockCarousel();
  }, 850);
}

export function nextSlide() { goTo(index + 1); }
export function prevSlide() { goTo(index - 1); }

el.track.addEventListener("transitionend", (e) => {
  if (e.propertyName !== "transform") return;

  if (index === 0) {
    el.track.style.transition = "none";
    setIndex(REAL_COUNT);
    el.track.style.transform = `translateX(${-REAL_COUNT * slideWidth}px)`;
    void el.track.offsetWidth;
  }

  if (index === REAL_COUNT + 1) {
    el.track.style.transition = "none";
    setIndex(1);
    el.track.style.transform = `translateX(${-1 * slideWidth}px)`;
    void el.track.offsetWidth;
  }

  el.track.style.transition = "transform 0.7s cubic-bezier(.22,.61,.36,1)";
  updateMeta();
  unlockCarousel();
});

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
    if (dx < 0) nextSlide(); else prevSlide();
  }
  startX = null; startY = null;
}
if (el.card) {
  el.card.addEventListener("touchstart", touchStart, { passive: true });
  el.card.addEventListener("touchend", touchEnd);
}

export function autoConnect() {
  const ua = navigator.userAgent.toLowerCase();
  if (!/android/.test(ua)) return;

  const ssid = getCurrentSsid();
  const pass = CONFIG.pass;

  const payload = `WIFI:T:WPA;S:${ssid};P:${pass};;`;

  window.location.href = payload;
}

export function copyPass() {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(CONFIG.pass).then(() => alert("Пароль скопирован"));
  } else {
    window.prompt("Скопируйте пароль:", CONFIG.pass);
  }
}
export function openMaps() { window.open(CONFIG.mapsUrl, "_blank"); }

export function updateOnlineStatus() {
  if (!el.netStatus) return;
  el.netStatus.textContent = navigator.onLine ? "Статус интернета: онлайн ✅" : "Статус интернета: офлайн ⛔";
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

export async function checkWifiConnection() {
  try {
    let connected = false;
    const conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
    if (conn && (conn.type === "wifi" || conn.effectiveType === "wifi")) connected = true;
    if (window.__speedDownMbps >= 8) connected = true;
    if (connected) {
      el.connectedBanner?.classList.add("show");
      if (el.btnAutoConnect) el.btnAutoConnect.style.display = "none";
    } else {
      el.connectedBanner?.classList.remove("show");
      if (el.btnAutoConnect) el.btnAutoConnect.style.display = "";
    }
    updateMeta();
  } catch (e) { console.error("WiFi check error:", e); }
}

export function toggleAdmin() {
  if (!el.adminPanel) return;
  el.adminPanel.classList.toggle("open");
}

function bindTap(node, fn) {
  if (!node) return;
  node.addEventListener("click", fn);
  node.addEventListener("pointerup", fn);
}

(function bindButtons() {
  bindTap(el.btnPrev, prevSlide);
  bindTap(el.btnNext, nextSlide);
  bindTap(el.btnAutoConnect, autoConnect);
  bindTap(el.btnCopyPass, copyPass);
  bindTap(el.btnOpenMaps, openMaps);
  bindTap(el.btnAdminToggle, toggleAdmin);
  bindTap(el.btnAdminClose, toggleAdmin);
  bindTap(el.btnAdminBackdrop, toggleAdmin);
})();

window.addEventListener("resize", recalcWidth);
applyConfigToUI();
recalcWidth();
updateOnlineStatus();
updateMeta();
