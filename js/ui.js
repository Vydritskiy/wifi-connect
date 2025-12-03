/* =========================================
   UI.JS — управление интерфейсом, каруселью,
   QR-кодом, кнопками, админкой, startup
   ========================================= */

import {
  el,
  CONFIG,
  saveConfigToStorage,
  slides,
  REAL_COUNT,
  index,
  slideWidth,
  isAnimating,
  recalcWidth,
  updateMeta,
  getCurrentSsid,
  getCurrentBand
} from "./config.js";

import { runSpeedTest } from "./speedtest.js";
import { fetchWeather, detectCityFromDevice } from "./weather.js";



// ========================================================
// КАРУСЕЛЬ
// ========================================================

let startX = null;
let startY = null;
let draggingMouse = false;

// --- перемотка ---
function goTo(newIndex) {
  if (isAnimating) return;
  isAnimating = true;

  index = newIndex;
  el.track.style.transform = `translateX(${-index * slideWidth}px)`;
}

function nextSlide() { goTo(index + 1); }
function prevSlide() { goTo(index - 1); }


// --- бесконечный цикл ---
el.track.addEventListener("transitionend", () => {
  if (index === 0) {
    el.track.style.transition = "none";
    index = REAL_COUNT;
    el.track.style.transform = `translateX(${-index * slideWidth}px)`;
    void el.track.offsetWidth;
    el.track.style.transition = "transform 0.7s cubic-bezier(.22,.61,.36,1)";
  }
  else if (index === slides.length - 1) {
    el.track.style.transition = "none";
    index = 1;
    el.track.style.transform = `translateX(${-index * slideWidth}px)`;
    void el.track.offsetWidth;
    el.track.style.transition = "transform 0.7s cubic-bezier(.22,.61,.36,1)";
  }

  updateMeta();
  isAnimating = false;
});


// ========================================================
// СВАЙПЫ
// ========================================================

function swipeStart(e) {
  const p = e.touches ? e.touches[0] : e;
  startX = p.clientX;
  startY = p.clientY;
  draggingMouse = !e.touches;
}

function swipeMove(e) {
  if (startX === null) return;

  const p = e.touches ? e.touches[0] : e;
  const dx = p.clientX - startX;
  const dy = p.clientY - startY;

  // вертикальный свайп — игнорируем
  if (Math.abs(dy) > Math.abs(dx)) return;

  e.preventDefault();
}

function swipeEnd(e) {
  if (startX === null) return;
  const p = e.changedTouches ? e.changedTouches[0] : e;

  const dx = p.clientX - startX;

  if (dx > 40) prevSlide();
  else if (dx < -40) nextSlide();

  startX = null;
  startY = null;
  draggingMouse = false;
}


// навешиваем события
el.carousel.addEventListener("touchstart", swipeStart, { passive: true });
el.carousel.addEventListener("touchmove", swipeMove, { passive: false });
el.carousel.addEventListener("touchend", swipeEnd);

el.carousel.addEventListener("mousedown", swipeStart);
document.addEventListener("mousemove", e => draggingMouse && swipeMove(e));
document.addEventListener("mouseup", swipeEnd);


// ========================================================
// QR-КОД
// ========================================================

let qrObj = null;

function showQR() {
  el.qrBox.classList.toggle("open");

  if (!qrObj) {
    qrObj = new QRCode(el.qrCanvas, {
      text: "",
      width: 220,
      height: 220
    });
  }

  const ssid = getCurrentSsid();
  const pass = CONFIG.pass;

  const wifiString = `WIFI:T:WPA;S:${ssid};P:${pass};;`;

  qrObj.makeCode(wifiString);
}


// ========================================================
// КОПИРОВАНИЕ ПАРОЛЯ
// ========================================================

function copyPass() {
  navigator.clipboard.writeText(CONFIG.pass).then(() => {
    el.netStatus.textContent = "Пароль скопирован";
    el.netStatus.classList.add("show");
    setTimeout(() => el.netStatus.classList.remove("show"), 2000);
  });
}


// ========================================================
// АВТО-КОННЕКТ (Android)
// ========================================================

function autoConnect() {
  const ssid = getCurrentSsid();
  const pass = CONFIG.pass;

  if (navigator.userAgent.toLowerCase().includes("android")) {
    window.location.href = `intent://scan/#Intent;scheme=wifi;package=com.android.settings;S.wifi_ssid=${ssid};S.wifi_password=${pass};end`;
  } else {
    el.netStatus.textContent = "Эта функция только для Android";
    el.netStatus.classList.add("show");
    setTimeout(() => el.netStatus.classList.remove("show"), 2000);
  }
}


// ========================================================
// Открытие карт
// ========================================================

function openMaps() {
  window.open(CONFIG.mapsUrl, "_blank");
}


// ========================================================
// ПРОВЕРКА ПОДКЛЮЧЕНИЯ К WI-FI
// ========================================================

async function checkWifiConnection() {
  try {
    const res = await fetch("https://www.google.com/generate_204", {
      method: "GET",
      mode: "no-cors",
      cache: "no-store"
    });

    // если запрос успешен — считаем, что интернет есть
    // Но нам нужно проверить, подключён ли человек к нашем SSID?
    // Прямой способ отсутствует — делаем фейк-фичу через heuristic.

    const ssid = getCurrentSsid();
    const connected = await heuristicWiFiCheck(ssid);

    if (connected) {
      el.connectedBanner.classList.add("show");

      // скрыть кнопки
      el.btnShowQR.style.display = "none";
      el.btnCopyPass.style.display = "none";
      el.btnAutoConnect.style.display = "none";
    }
  } catch (e) {
    // игнорируем
  }
}

// имитация проверки (на веб-страницах нет API)
async function heuristicWiFiCheck(ssid) {
  // Онлайн + страница открыта локально через NFC → почти всегда подключен
  return navigator.onLine;
}


// ========================================================
// АДМИН-ПАНЕЛЬ
// ========================================================

function toggleAdmin() {
  el.adminPanel.classList.add("open");

  el.admWelcome.value = CONFIG.welcome;
  el.admSsid5.value = CONFIG.ssid5;
  el.admSsid24.value = CONFIG.ssid24;
  el.admPass.value = CONFIG.pass;
}

function closeAdmin() {
  el.adminPanel.classList.remove("open");
}

function saveAdminSettings() {
  CONFIG.welcome = el.admWelcome.value.trim();
  CONFIG.ssid5 = el.admSsid5.value.trim();
  CONFIG.ssid24 = el.admSsid24.value.trim();
  CONFIG.pass = el.admPass.value.trim();

  saveConfigToStorage();

  location.reload(); // обновляем UI
}

function resetAdminSettings() {
  localStorage.removeItem("wifiGuestConfig");
  location.reload();
}


// ========================================================
// СТАРТ ПРИЛОЖЕНИЯ
// ========================================================

async function startup() {
  recalcWidth();
  updateMeta();

  await detectCityFromDevice();
  await fetchWeather();
  runSpeedTest();

  checkWifiConnection();
}

// пересчёт ширины при ресайзе
window.addEventListener("resize", recalcWidth);



// ========================================================
// ПРИВЯЗКА ВСЕХ КНОПОК
// ========================================================

el.btnPrev?.addEventListener("click", prevSlide);
el.btnNext?.addEventListener("click", nextSlide);

el.btnShowQR?.addEventListener("click", showQR);
el.btnCopyPass?.addEventListener("click", copyPass);
el.btnAutoConnect?.addEventListener("click", autoConnect);
el.btnOpenMaps?.addEventListener("click", openMaps);

el.btnAdminToggle?.addEventListener("click", toggleAdmin);
el.btnAdminClose?.addEventListener("click", closeAdmin);
el.btnAdminBackdrop?.addEventListener("click", closeAdmin);

el.btnAdminSave?.addEventListener("click", saveAdminSettings);
el.btnAdminReset?.addEventListener("click", resetAdminSettings);


// ========================================================
// RUN
// ========================================================

startup();
