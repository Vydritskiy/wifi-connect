/* ============================================================
   Wi-Fi Guest Portal — app.js v3.0 (оптимизированная версия)
   ============================================================ */

// Конфиг по умолчанию
const defaultConfig = {
  ssid5: "r2d5",
  ssid24: "r2d2",
  pass: "Jgthfnbdysq1913",
  welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
  mapsUrl: "https://www.google.com/maps/place/вулиця+Андрія+Малишка,+31А,+Київ",
  city: "Kyiv",
  weatherApiKey: "6530afae9a05d8f6e1c997682469a69d"
};

// Автоязык
const LANG = (() => {
  const l = navigator.language.toLowerCase();
  if (l.startsWith("uk")) return "ua";
  if (l.startsWith("en")) return "en";
  return "ru";
})();

const I18N = {
  ru: {
    welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
    autoConnect: "Подключиться автоматически (Android)",
    showQR: "Показать QR-код",
    copyPass: "Скопировать пароль",
    openMaps: "Как добраться 🚕",
    copied: "Пароль скопирован",
    couldntCopy: "Не удалось скопировать.",
    online: "Статус интернета: онлайн ✅",
    offline: "Статус интернета: офлайн ⛔"
  },
  ua: {
    welcome: "Ласкаво просимо! Почувайся як вдома 🧡",
    autoConnect: "Підключитися автоматично (Android)",
    showQR: "Показати QR-код",
    copyPass: "Скопіювати пароль",
    openMaps: "Як дістатися 🚕",
    copied: "Пароль скопійовано",
    couldntCopy: "Не вдалося скопіювати.",
    online: "Статус інтернету: онлайн ✅",
    offline: "Статус інтернету: офлайн ⛔"
  },
  en: {
    welcome: "Welcome! Make yourself at home 🧡",
    autoConnect: "Auto-connect (Android)",
    showQR: "Show QR Code",
    copyPass: "Copy Password",
    openMaps: "How to get there 🚕",
    copied: "Password copied",
    couldntCopy: "Failed to copy.",
    online: "Internet status: online ✅",
    offline: "Internet status: offline ⛔"
  }
};

function t(k) {
  return (I18N[LANG] && I18N[LANG][k]) || I18N.ru[k] || k;
}

/* ---------- Config + localStorage ---------- */
let CONFIG = loadConfig();

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("wifiGuestConfig"));
    if (saved) {
      delete saved.mapsUrl;       // фиксированный адрес
      delete saved.weatherApiKey; // защищено
      return { ...defaultConfig, ...saved };
    }
  } catch (e) {
    console.error("Ошибка при загрузке конфигурации из localStorage:", e);
  }
  return { ...defaultConfig };
}

function saveConfigToStorage() {
  const { weatherApiKey, mapsUrl, ...toSave } = CONFIG;
  localStorage.setItem("wifiGuestConfig", JSON.stringify(toSave));
}

/* ---------- Обновление состояния сети ---------- */
async function detectAlreadyConnected() {
  const helper = document.getElementById("helperText");
  const banner = document.getElementById("connectedBanner");

  let fastTTFB = false;
  try {
    const t = performance.timing;
    const ttfb = t.responseStart - t.requestStart;
    if (ttfb > 0 && ttfb < 200) fastTTFB = true;
  } catch (e) {}

  await new Promise(r => setTimeout(r, 3000));
  const down = window.__speedDownMbps || 0;

  const conn = navigator.connection || navigator.webkitConnection;
  let isWifi = conn && (conn.type === "wifi" || conn.effectiveType === "wifi");

  const local = await checkLocalPing();

  const connected = fastTTFB || down >= 8 || isWifi || local;

  if (connected) {
    if (banner) banner.style.display = "block";
    helper.innerHTML = `Вы уже подключены к <b>${getCurrentSsid()}</b> ✔`;

    document.querySelector('button[onclick="autoConnect()"]').style.display = "none";
    document.querySelector('button[onclick="showQR()"]').style.display = "none";
    document.querySelector('button[onclick="copyPass()"]').style.display = "none";
  }
}

/* ---------- Погода ---------- */
async function fetchWeather() {
  const cityEl = document.getElementById("weatherCity");
  const mainEl = document.getElementById("weatherMain");
  const tempEl = document.getElementById("weatherTemp");
  const metaEl = document.getElementById("weatherMeta");

  if (!CONFIG.city || !CONFIG.weatherApiKey) {
    cityEl.textContent = CONFIG.city;
    mainEl.textContent = "";
    tempEl.textContent = "Нет API-ключа";
    metaEl.textContent = "";
    return;
  }

  const url = `${WEATHER_API_URL}?q=${encodeURIComponent(
    CONFIG.city
  )}&appid=${CONFIG.weatherApiKey}&units=metric&lang=ru`;

  try {
    tempEl.textContent = "Загрузка…";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Ошибка загрузки погодных данных");

    const data = await res.json();
    if (!data.weather || !data.main) throw new Error("Ошибка данных о погоде");

    const w = data.weather[0];
    lastWeatherTemp = Math.round(data.main.temp);
    lastWeatherKind = detectWeatherKind(w, data);
    const tz = data.timezone;
    const now = Date.now() / 1000 + tz;
    lastWeatherIsNight = !(now > data.sys.sunrise && now < data.sys.sunset);

    cityEl.textContent = data.name;
    mainEl.textContent = w.description;
    tempEl.textContent = `${lastWeatherTemp}°C`;
    metaEl.textContent = `Ощущается как ${Math.round(
      data.main.feels_like
    )}°C · влажность ${data.main.humidity}%`;

    updateWeatherBackground();
  } catch (e) {
    console.error("Ошибка при получении погодных данных:", e);
    cityEl.textContent = CONFIG.city;
    mainEl.textContent = "Ошибка";
    tempEl.textContent = "Не удалось загрузить погоду";
    metaEl.textContent = "";
  }
}

/* ---------- Инициализация изображений ---------- */
function loadImage(imageElement, src) {
  const img = new Image();
  img.onload = () => { imageElement.src = src; };
  img.onerror = () => { imageElement.src = 'icons/default_hero.svg'; }; // Запасное изображение
  img.src = src;
}

/* ---------- Главное автоподключение для мобильных ---------- */
function autoConnect() {
  const ssid = getCurrentSsid();
  if (navigator.userAgent.match(/(iPhone|iPad|iPod)/)) {
    alert("Для iPhone используйте QR-код или подключитесь вручную.");
  } else {
    location.href = `WIFI:T:WPA;S:${ssid};P:${CONFIG.pass};;`;
  }
}

/* ---------- Главная функция для инициализации UI ---------- */
window.addEventListener("load", () => {
  recalcWidth();
  applyConfigToUI();
  updateOnlineStatus();
  updateHeroArt();
  fetchWeather();
  detectAlreadyConnected();
  speedTest();
});

window.addEventListener("resize", recalcWidth);

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(function(registration) {
      console.log('Service Worker зарегистрирован с областью:', registration.scope);
    })
    .catch(function(error) {
      console.log('Ошибка регистрации Service Worker:', error);
    });
}


document.addEventListener('DOMContentLoaded', function() {
    // Button elements
    const copyPasswordButton = document.querySelector('#copyPassword');
    const showQRCodeButton = document.querySelector('#showQRCode');
    const connectAutomaticallyButton = document.querySelector('#connectAutomatically');

    // Action for copying the Wi-Fi password
    copyPasswordButton.addEventListener('click', function() {
        const password = 'Jgthfnbdysq1913';  // Use your actual Wi-Fi password here
        navigator.clipboard.writeText(password).then(function() {
            alert('Пароль скопирован в буфер обмена!');
        });
    });

    // Action for showing the QR code
    showQRCodeButton.addEventListener('click', function() {
        // Show the QR code here (you could use a QR code library like QRCode.js)
        alert('QR-код для подключения показан!');
    });

    // Action for automatically connecting (for Android users)
    connectAutomaticallyButton.addEventListener('click', function() {
        alert('Автоматическое подключение (только Android)!');
    });
});
