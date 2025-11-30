/* ---------- Конфиг + localStorage ---------- */
const defaultConfig = {
  ssid5: "r2d5",
  ssid24: "r2d2",
  pass: "Jgthfnbdysq1913",
  welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
  mapsUrl: "https://www.google.com/maps",
  city: "Kyiv",
  // ВСТАВЬ СВОЙ КЛЮЧ OpenWeather:
  weatherApiKey: "6530afae9a05d8f6e1c997682469a69d"
};

let CONFIG = loadConfig();

function loadConfig(){
  try{
    const saved = localStorage.getItem("wifiGuestConfig");
    if(saved){
      const obj = JSON.parse(saved);

      if(obj.mapsUrl && /maps\.app\.goo\.gl\/XXXXXXXX/i.test(obj.mapsUrl)){
        delete obj.mapsUrl;
      }
      if(obj.weatherApiKey){
        delete obj.weatherApiKey; // ключ только в коде
      }

      return Object.assign({}, defaultConfig, obj);
    }
  }catch(e){}
  return { ...defaultConfig };
}

function saveConfigToStorage(){
  try{
    const { weatherApiKey, ...rest } = CONFIG;
    localStorage.setItem("wifiGuestConfig", JSON.stringify(rest));
  }catch(e){}
}

/* ---------- DOM ---------- */
const track        = document.getElementById("track");
const carousel     = document.getElementById("carousel");
const card         = document.querySelector(".card");
const helperText   = document.getElementById("helperText");
const netStatus    = document.getElementById("netStatus");
const dots         = document.querySelectorAll(".dots span");
const welcomeEl    = document.getElementById("welcomeText");
const heroArtEl    = document.getElementById("heroArt");
const adminPanelEl = document.getElementById("adminPanel");
const weatherBgEl  = document.getElementById("weatherBg");

let slides       = Array.from(document.querySelectorAll(".slide"));
const REAL_COUNT = slides.length;

let index       = 1;
let qrObj       = null;
let slideWidth  = 0;
let isAnimating = false;
let audioCtx    = null;

const transitionValue = "transform 0.7s cubic-bezier(.22,.61,.36,1)";

/* погода-состояние */
let lastWeatherKind      = null; // "clear", "rain-light", "snow-heavy", ...
let lastWeatherIsNight   = false;
let lastWeatherTemp      = null;

/* ---------- детект устройства ---------- */
const ua        = navigator.userAgent.toLowerCase();
const isIOS     = /iphone|ipad|ipod/.test(ua);
const isAndroid = /android/.test(ua);
// const isDesktop = !isIOS && !isAndroid; // если нужно

const oldAndroid = /android\s([0-6]\.|7\.0)/i.test(ua);
const oldIOS     = /os\s(9_|10_)/i.test(ua);

/* ---------- бесконечная лента ---------- */
if(REAL_COUNT > 0){
  const firstClone = slides[0].cloneNode(true);
  const lastClone  = slides[REAL_COUNT - 1].cloneNode(true);
  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);
  slides = Array.from(document.querySelectorAll(".slide"));
}

/* ---------- helpers по сети ---------- */
function getCurrentBand(){
  const logical = (index - 1 + REAL_COUNT) % REAL_COUNT;
  return logical === 0 ? "5" : "24";
}
function getSsidForBand(band){
  return band === "5" ? CONFIG.ssid5 : CONFIG.ssid24;
}
function getCurrentSsid(){
  return getSsidForBand(getCurrentBand());
}

/* ---------- верхний арт-дроид ---------- */
const HERO_ART = {
  "5":  "icons/hero_r2d5.svg",
  "24": "icons/hero_r2d2.svg"
};

function updateHeroArt(){
  if(!heroArtEl) return;
  const band = getCurrentBand();
  const src = HERO_ART[band] || HERO_ART["5"];
  const current = heroArtEl.getAttribute("src") || "";
  if(current === src) return;

  heroArtEl.classList.add("fade-enter");
  setTimeout(()=>{
    heroArtEl.src = src;
    requestAnimationFrame(()=>{
      heroArtEl.classList.remove("fade-enter");
    });
  },200);
}

/* ---------- баннер по времени суток + погоде ---------- */
const TIME_BANNERS = [
  {
    from: 5, to: 11,
    baseTitle: "Доброе утро",
    baseSub:   "Кофе, Wi-Fi и дроид уже на посту.",
    theme: "morning"
  },
  {
    from: 11, to: 18,
    baseTitle: "Хорошего дня",
    baseSub:   "Интернет есть — можно творить чудеса.",
    theme: "day"
  },
  {
    from: 18, to: 23,
    baseTitle: "Уютный вечер",
    baseSub:   "Сериалы, игры и ламповый Wi-Fi.",
    theme: "evening"
  },
  {
    from: 23, to: 5,
    baseTitle: "Ночной режим",
    baseSub:   "Роутер не спит, даже если ты уже да.",
    theme: "night"
  }
];

function pickTimeBannerConfig(hour){
  let cfg = TIME_BANNERS[0];
  for(const b of TIME_BANNERS){
    if(b.from < b.to){
      if(hour >= b.from && hour < b.to){ cfg = b; break; }
    }else{
      if(hour >= b.from || hour < b.to){ cfg = b; break; }
    }
  }
  return cfg;
}

function baseWeatherGroup(kind){
  if (!kind) return null;
  if (kind === "storm") return "rain";
  if (kind.startsWith("rain")) return "rain";
  if (kind.startsWith("snow")) return "snow";
  if (kind.startsWith("clouds")) return "clouds";
  if (kind === "fog") return "fog";
  if (kind === "clear") return "clear";
  return null;
}

function buildBannerText(baseTitle, baseSub, weatherKind){
  const group = baseWeatherGroup(weatherKind);

  switch(group){
    case "clear":
      return { title: baseTitle + " ☀️", sub: baseSub };
    case "rain":
      return {
        title: baseTitle + " · дождь за окном 🌧",
        sub: "Главное — Wi-Fi сухой и быстрый."
      };
    case "snow":
      return {
        title: baseTitle + " · снегопад ❄️",
        sub: "Можно не выходить — здесь и тепло, и интернет."
      };
    case "clouds":
      return {
        title: baseTitle + " · пасмурно ⛅",
        sub: "Зато дома уютно и стабильный сигнал."
      };
    case "fog":
      return {
        title: baseTitle + " · туман 🌫",
        sub: "Лишний повод не выходить и посидеть в онлайне."
      };
    default:
      return { title: baseTitle, sub: baseSub };
  }
}

function getArtForBanner(theme, weatherKind){
  const group = baseWeatherGroup(weatherKind);

  if(group === "snow"){
    return "icons/hero_r2d2.svg";
  }
  if(group === "rain"){
    return "icons/hero_r2d5.svg";
  }
  if(group === "clear" || group === "clouds" || group === "fog"){
    if(theme === "night") return "icons/hero_r2d2.svg";
    return "icons/hero_r2d5.svg";
  }
  return theme === "night" ? "icons/hero_r2d2.svg" : "icons/hero_r2d5.svg";
}

function updateWeatherBackground(){
  if (!weatherBgEl) return;

  const kind = lastWeatherKind || "clear";
  const isNight = !!lastWeatherIsNight;

  let cls;
  switch (kind) {
    case "storm":           cls = "storm"; break;
    case "rain-heavy":      cls = "rain-heavy"; break;
    case "rain-light":      cls = "rain-light"; break;
    case "snow-heavy":      cls = "snow-heavy"; break;
    case "snow-light":      cls = "snow-light"; break;
    case "fog":             cls = "fog"; break;
    case "clouds-overcast": cls = "clouds-overcast"; break;
    case "clouds-broken":
    case "clouds-few":
      cls = isNight ? "clouds-night" : "clouds-day";
      break;
    case "clear":
    default:
      cls = isNight ? "clear-night" : "clear-day";
  }

  let tempMod = "";
  if (typeof lastWeatherTemp === "number") {
    if (lastWeatherTemp <= -5) tempMod = " cold";
    else if (lastWeatherTemp >= 28) tempMod = " hot";
  }

  weatherBgEl.className = "weather-bg " + cls + tempMod;
}

function updateTimeBanner(){
  const bannerEl = document.getElementById("timeBanner");
  const artEl    = document.getElementById("timeBannerArt");
  const titleEl  = document.getElementById("timeBannerTitle");
  const subEl    = document.getElementById("timeBannerSub");
  if(!bannerEl || !artEl || !titleEl || !subEl) return;

  const hour = new Date().getHours();
  const cfg = pickTimeBannerConfig(hour);
  const text = buildBannerText(cfg.baseTitle, cfg.baseSub, lastWeatherKind);

  titleEl.textContent = text.title;
  subEl.textContent   = text.sub;
  artEl.style.backgroundImage = `url(${getArtForBanner(cfg.theme, lastWeatherKind)})`;

  updateWeatherBackground();
}

/* ---------- погода (OpenWeather) ---------- */
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

function detectWeatherKind(w, data){
  const id   = w.id || 0;
  const main = (w.main || "").toLowerCase();
  const desc = (w.description || "").toLowerCase();
  const clouds = data.clouds ? data.clouds.all : 0;

  // температура
  if (data.main && typeof data.main.temp === "number") {
    lastWeatherTemp = Math.round(data.main.temp);
  } else {
    lastWeatherTemp = null;
  }

  // день/ночь по солнцу
  try{
    const tz = data.timezone || 0; // сек
    const nowUtc = Date.now() / 1000;
    const nowLocal = nowUtc + tz;
    const sunrise = data.sys && data.sys.sunrise ? data.sys.sunrise : null;
    const sunset  = data.sys && data.sys.sunset  ? data.sys.sunset  : null;

    if (sunrise != null && sunset != null) {
      lastWeatherIsNight = (nowLocal < sunrise || nowLocal > sunset);
    } else {
      const h = new Date().getHours();
      lastWeatherIsNight = (h >= 22 || h < 6);
    }
  }catch(e){
    const h = new Date().getHours();
    lastWeatherIsNight = (h >= 22 || h < 6);
  }

  // коды OpenWeather
  if (id >= 200 && id < 300) return "storm";

  if (id >= 300 && id < 400) return "rain-light";

  if (id >= 500 && id < 600){
    if (id >= 502 || desc.includes("heavy")) return "rain-heavy";
    return "rain-light";
  }

  if (id >= 600 && id < 700){
    if (id === 600 || id === 620) return "snow-light";
    if (id === 601 || id === 602 || id >= 621) return "snow-heavy";
    return "snow-light";
  }

  if (id >= 700 && id < 800) return "fog";

  if (id === 800) return "clear";

  if (id >= 801 && id <= 804){
    if (clouds >= 85) return "clouds-overcast";
    if (clouds >= 55) return "clouds-broken";
    return "clouds-few";
  }

  const all = (main + " " + desc);
  if (all.includes("snow")) return "snow-light";
  if (all.includes("rain") || all.includes("drizzle")) return "rain-light";
  if (all.includes("storm") || all.includes("thunder")) return "storm";
  if (all.includes("cloud")) return "clouds-broken";
  if (all.includes("mist") || all.includes("fog") || all.includes("haze")) return "fog";

  return "clear";
}

async function fetchWeather(){
  const cityEl   = document.getElementById("weatherCity");
  const mainEl   = document.getElementById("weatherMain");
  const tempEl   = document.getElementById("weatherTemp");
  const metaEl   = document.getElementById("weatherMeta");
  if(!cityEl || !tempEl) return;

  const apiKey = (CONFIG.weatherApiKey || "").trim();

  if(!CONFIG.city || !apiKey){
    cityEl.textContent = CONFIG.city || "Погода";
    mainEl.textContent = "";
    tempEl.textContent = "Нет API-ключа OpenWeather";
    metaEl.textContent = "Впиши его в defaultConfig в app.js.";
    lastWeatherKind = null;
    updateTimeBanner();
    return;
  }

  const url = `${WEATHER_API_URL}?q=${encodeURIComponent(CONFIG.city)}&appid=${apiKey}&units=metric&lang=ru`;

  try{
    tempEl.textContent = "Загружаю...";
    metaEl.textContent = "";

    const res = await fetch(url);

    if(!res.ok){
      if(res.status === 401){
        cityEl.textContent = CONFIG.city;
        mainEl.textContent = "";
        tempEl.textContent = "Неверный API-ключ OpenWeather";
        metaEl.textContent = "Проверь ключ в app.js.";
      }else if(res.status === 404){
        cityEl.textContent = CONFIG.city;
        mainEl.textContent = "";
        tempEl.textContent = "Город не найден";
        metaEl.textContent = "Например: Kyiv,UA.";
      }else{
        cityEl.textContent = CONFIG.city;
        mainEl.textContent = "";
        tempEl.textContent = "Не удалось загрузить";
        metaEl.textContent = `Код ошибки: ${res.status}`;
      }
      lastWeatherKind = null;
      updateTimeBanner();
      console.error("Weather HTTP error", res.status);
      return;
    }

    const data = await res.json();

    const name = data.name || CONFIG.city;
    const w    = (data.weather && data.weather[0]) || {};
    const main = w.description || w.main || "";

    const t  = Math.round(data.main.temp);
    const tf = Math.round(data.main.feels_like);
    const hum = Math.round(data.main.humidity);

    cityEl.textContent = name;
    mainEl.textContent = main ? (main[0].toUpperCase() + main.slice(1)) : "";
    tempEl.textContent = `${t}°C`;
    metaEl.textContent = `Ощущается как ${tf}°C · влажность ${hum}%`;

    lastWeatherKind = detectWeatherKind(w, data);
    updateTimeBanner();
  }catch(e){
    console.error("Weather fetch error", e);
    cityEl.textContent = CONFIG.city || "Погода";
    mainEl.textContent = "";
    tempEl.textContent = "Не удалось загрузить";
    metaEl.textContent = "Проверь интернет или ключ в app.js.";
    lastWeatherKind = null;
    updateTimeBanner();
  }
}

/* ---------- применяем конфиг к UI ---------- */
function applyConfigToUI(){
  if(welcomeEl) welcomeEl.textContent = CONFIG.welcome;

  document.querySelectorAll(".slide").forEach(slide=>{
    const band = slide.dataset.net === "r2d5" ? "5" : "24";
    const ssidMain = slide.querySelector(".slide-ssid-main");
    const ssidSub  = slide.querySelector(".slide-ssid-sub");
    const cap      = slide.querySelector(".slide-caption");

    if(ssidMain) ssidMain.textContent = getSsidForBand(band);
    if(ssidSub)  ssidSub.textContent  = band === "5" ? "5 GHz" : "2.4 GHz";
    if(cap){
      cap.textContent = band === "5"
        ? `${getSsidForBand("5")} · быстрее, если поддерживается`
        : `${getSsidForBand("24")} · стабильнее на расстоянии`;
    }
  });

  updateMeta();
}

/* ---------- размеры ---------- */
function recalcWidth(){
  slideWidth = carousel.offsetWidth;
  track.style.transition = "none";
  track.style.transform = `translateX(${-index * slideWidth}px)`;
  void track.offsetWidth;
  track.style.transition = transitionValue;
  updateMeta();
}

/* ---------- подписи / точки ---------- */
function updateMeta(){
  const logical = (index - 1 + REAL_COUNT) % REAL_COUNT;
  dots.forEach((d,i)=>d.classList.toggle("active", i === logical));

  const band = logical === 0 ? "5" : "24";
  const ssid = getSsidForBand(band);

  let base =
    band === "5"
      ? `Выбрана ${ssid} (5 GHz) — быстрее, если устройство поддерживает 5 GHz.`
      : `Выбрана ${ssid} (2.4 GHz) — стабильнее на расстоянии.`;

  if(isIOS){
    base += " Если смотришь эту страницу на другом устройстве — наведи Камеру iPhone на QR. Если страница открыта на самом iPhone, зайди в «Настройки → Wi-Fi» и выбери сеть вручную.";
  }else if(isAndroid){
    base += " Если эта страница открыта на самом Android — можно нажать «Подключиться автоматически» или ввести сеть в настройках Wi-Fi. Если страница на другом устройстве — отсканируй QR-код с Android.";
  }else{
    base += " На ноутбуке удобнее всего отсканировать QR с телефона или скопировать пароль.";
  }

  helperText.textContent = base;
  document.getElementById("qrBox").style.display = "none";

  updateHeroArt();
}

/* ---------- навигация карусели ---------- */
function goTo(newIndex){
  if(isAnimating) return;
  isAnimating = true;
  index = newIndex;
  track.style.transition = transitionValue;
  track.style.transform = `translateX(${-index * slideWidth}px)`;
}

function nextSlide(){ goTo(index + 1); }
function prevSlide(){ goTo(index - 1); }

track.addEventListener("transitionend", e=>{
  if(e.propertyName !== "transform") return;

  if(index === 0){
    track.style.transition = "none";
    index = REAL_COUNT;
    track.style.transform = `translateX(${-index * slideWidth}px)`;
    void track.offsetWidth;
    track.style.transition = transitionValue;
  }else if(index === slides.length - 1){
    track.style.transition = "none";
    index = 1;
    track.style.transform = `translateX(${-index * slideWidth}px)`;
    void track.offsetWidth;
    track.style.transition = transitionValue;
  }

  updateMeta();
  isAnimating = false;
});

/* ---------- свайп ---------- */
let startX = null;
let startY = null;
let draggingMouse = false;

function swipeStart(e){
  const target = e.target;
  if (target.closest('button') || target.closest('.nav-arrow') || target.closest('a') || target.closest('.admin-inner')) {
    return;
  }
  const p = e.touches ? e.touches[0] : e;
  startX = p.clientX;
  startY = p.clientY;
  draggingMouse = !e.touches;
}

function swipeMove(e){
  if(startX === null) return;
  const p = e.touches ? e.touches[0] : e;
  const dx = p.clientX - startX;
  const dy = p.clientY - startY;

  if(Math.abs(dx) > Math.abs(dy) + 10){
    e.preventDefault();
  }
}

function swipeEnd(e){
  if(startX === null) return;
  const p = e.changedTouches ? e.changedTouches[0] : e;
  const dx = p.clientX - startX;

  if(Math.abs(dx) > 40){
    if(dx < 0) nextSlide();
    else       prevSlide();
  }

  startX = startY = null;
  draggingMouse = false;
}

card.addEventListener("touchstart", swipeStart, {passive:true});
card.addEventListener("touchmove",  swipeMove,  {passive:false});
card.addEventListener("touchend",   swipeEnd);
card.addEventListener("mousedown",  swipeStart);
card.addEventListener("mousemove",  e=>{ if(draggingMouse) swipeMove(e); });
card.addEventListener("mouseup",    swipeEnd);
card.addEventListener("mouseleave", e=>{ if(draggingMouse) swipeEnd(e); });

/* ---------- QR / авто / копия ---------- */
function showQR(){
  const ssid = getCurrentSsid();
  const payload = `WIFI:T:WPA;S:${ssid};P:${CONFIG.pass};;`;

  if(!qrObj){
    qrObj = new QRCode(document.getElementById("qrCanvas"), {
      width:200,height:200
    });
  }
  qrObj.clear();
  qrObj.makeCode(payload);
  document.getElementById("qrBox").style.display = "block";
  playClickSound();
}

function autoConnect(){
  const ssid = getCurrentSsid();
  playClickSound();
  location.href = `WIFI:T:WPA;S:${ssid};P:${CONFIG.pass};;`;
}

function copyPass(){
  navigator.clipboard.writeText(CONFIG.pass).then(()=>{
    alert("Пароль скопирован");
    playClickSound();
  }).catch(()=>{
    alert("Не удалось скопировать. Попробуй вручную.");
  });
}

/* ---------- ссылка на карту ---------- */
function openMaps(){
  const url = CONFIG.mapsUrl || defaultConfig.mapsUrl;
  const finalUrl = /^https?:\/\//i.test(url) ? url : ("https://" + url);
  window.open(finalUrl, "_blank");
}

/* ---------- звук ---------- */
function playClickSound(){
  try{
    if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.16);
  }catch(e){}
}

/* ---------- тема ---------- */
function toggleTheme(){
  const body = document.body;
  const isLight = body.classList.contains("light");

  body.classList.toggle("light", !isLight);
  body.classList.toggle("neon", isLight);

  localStorage.theme = body.classList.contains("light") ? "light" : "dark";
  document.querySelector(".theme-toggle").textContent =
    body.classList.contains("light") ? "🌙" : "☀️";

  updateHeroArt();
  updateTimeBanner();
}

(function initTheme(){
  const stored = localStorage.theme;
  const prefersDark = window.matchMedia &&
                      window.matchMedia("(prefers-color-scheme: dark)").matches;

  if(stored === "light"){
    document.body.classList.add("light");
  }else if(stored === "dark" || (!stored && prefersDark)){
    document.body.classList.add("neon");
  }else{
    document.body.classList.add("light");
  }

  document.querySelector(".theme-toggle").textContent =
    document.body.classList.contains("light") ? "🌙" : "☀️";
})();

/* ---------- статус интернета ---------- */
function updateOnlineStatus(){
  if(!netStatus) return;
  if(navigator.onLine){
    netStatus.textContent = "Статус интернета: онлайн ✅";
  }else{
    netStatus.textContent = "Статус интернета: офлайн ⛔ (проверьте роутер или кабель)";
  }
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

/* ---------- авто-выбор сети для старых устройств ---------- */
(function autoPick(){
  const logicalIndex = (oldAndroid || oldIOS) ? 1 : 0; // 0 = 5GHz, 1 = 2.4GHz
  index = logicalIndex + 1;
})();

/* ---------- админка ---------- */
function toggleAdmin(){
  adminPanelEl.classList.toggle("open");
  if(adminPanelEl.classList.contains("open")){
    fillAdminForm();
  }
}

function fillAdminForm(){
  document.getElementById("admWelcome").value = CONFIG.welcome;
  document.getElementById("admSsid5").value   = CONFIG.ssid5;
  document.getElementById("admSsid24").value  = CONFIG.ssid24;
  document.getElementById("admPass").value    = CONFIG.pass;
  document.getElementById("admMaps").value    = CONFIG.mapsUrl || "";
  document.getElementById("admCity").value    = CONFIG.city || "";
}

function saveConfig(){
  CONFIG.welcome = document.getElementById("admWelcome").value || defaultConfig.welcome;
  CONFIG.ssid5   = document.getElementById("admSsid5").value   || defaultConfig.ssid5;
  CONFIG.ssid24  = document.getElementById("admSsid24").value  || defaultConfig.ssid24;
  CONFIG.pass    = document.getElementById("admPass").value    || defaultConfig.pass;
  CONFIG.mapsUrl = document.getElementById("admMaps").value    || defaultConfig.mapsUrl;
  CONFIG.city    = document.getElementById("admCity").value    || defaultConfig.city;

  saveConfigToStorage();
  applyConfigToUI();
  updateTimeBanner();
  fetchWeather();
  toggleAdmin();
}

function resetConfig(){
  CONFIG = { ...defaultConfig };
  saveConfigToStorage();
  applyConfigToUI();
  updateTimeBanner();
  fetchWeather();
  toggleAdmin();
}

/* ---------- старт ---------- */
window.addEventListener("load", ()=>{
  recalcWidth();
  applyConfigToUI();
  updateOnlineStatus();
  updateHeroArt();
  updateTimeBanner();
  fetchWeather();
});
window.addEventListener("resize", recalcWidth);
