/* ---------- Конфиг + localStorage ---------- */
const defaultConfig = {
  ssid5: "r2d5",
  ssid24: "r2d2",
  pass: "Jgthfnbdysq1913",
  welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
  mapsUrl: "https://www.google.com/maps/place/вулиця+Андрія+Малишка,+31А,+Київ",
  city: "Kyiv",

  // OpenWeather key
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
        delete obj.weatherApiKey;
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
const track         = document.getElementById("track");
const carousel      = document.getElementById("carousel");
const card          = document.querySelector(".card");
const helperText    = document.getElementById("helperText");
const netStatus     = document.getElementById("netStatus");
const dots          = document.querySelectorAll(".dots span");
const welcomeEl     = document.getElementById("welcomeText");
const heroArtEl     = document.getElementById("heroArt");
const adminPanelEl  = document.getElementById("adminPanel");
const weatherBgEl   = document.getElementById("weatherBg");

/* SUPER CARD */
const superCity = document.getElementById("superCity");
const superCond = document.getElementById("superCond");
const superTemp = document.getElementById("superTemp");
const superMeta = document.getElementById("superMeta");

const superPing = document.getElementById("superPing");
const superDown = document.getElementById("superDown");
const superUp   = document.getElementById("superUp");
const superStatus = document.getElementById("superStatus");

let slides       = Array.from(document.querySelectorAll(".slide"));
const REAL_COUNT = slides.length;

let index       = 1;
let slideWidth  = 0;
let isAnimating = false;
let qrObj       = null;
let audioCtx    = null;

const ua        = navigator.userAgent.toLowerCase();
const isIOS     = /iphone|ipad|ipod/.test(ua);
const isAndroid = /android/.test(ua);
const oldAndroid = /android\s([0-6]\.|7\.0)/i.test(ua);
const oldIOS     = /os\s(9_|10_)/i.test(ua);

let lastWeatherKind    = null;
let lastWeatherIsNight = false;
let lastWeatherTemp    = null;

/* ---------- Clone slides for infinite carousel ---------- */
if(REAL_COUNT > 0){
  const firstClone = slides[0].cloneNode(true);
  const lastClone  = slides[REAL_COUNT - 1].cloneNode(true);
  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);
  slides = Array.from(document.querySelectorAll(".slide"));
}

/* ---------- Helpers ---------- */
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

/* ---------- Time banner ---------- */
const TIME_BANNERS = [
  { from: 5, to: 11, baseTitle:"Доброе утро",  baseSub:"Кофе, Wi-Fi и дроид уже на посту.", theme:"morning" },
  { from: 11, to: 18, baseTitle:"Хорошего дня", baseSub:"Интернет есть — можно творить чудеса.", theme:"day"},
  { from: 18, to: 23, baseTitle:"Уютный вечер", baseSub:"Сериалы, игры и ламповый Wi-Fi.", theme:"evening" },
  { from: 23, to: 5, baseTitle:"Ночной режим", baseSub:"Роутер не спит, даже если ты уже да.", theme:"night"}
];

function pickTimeBannerConfig(hour){
  let cfg = TIME_BANNERS[0];
  for(const b of TIME_BANNERS){
    if(b.from < b.to){
      if(hour >= b.from && hour < b.to){ cfg=b; break; }
    } else {
      if(hour >= b.from || hour < b.to){ cfg=b; break; }
    }
  }
  return cfg;
}

function baseWeatherGroup(kind){
  if(!kind) return null;
  if(kind==="storm") return "rain";
  if(kind.startsWith("rain")) return "rain";
  if(kind.startsWith("snow")) return "snow";
  if(kind.startsWith("cloud")) return "clouds";
  if(kind==="fog") return "fog";
  if(kind==="clear") return "clear";
  return null;
}

function buildBannerText(baseTitle, baseSub, weatherKind){
  const group = baseWeatherGroup(weatherKind);

  switch(group){
    case "clear": return { title:baseTitle+" ☀️", sub:baseSub };
    case "rain":  return { title:baseTitle+" · дождь 🌧", sub:"Главное — Wi-Fi сухой и быстрый." };
    case "snow":  return { title:baseTitle+" · снег ❄️", sub:"Можно не выходить — здесь тепло и интернет." };
    case "clouds":return { title:baseTitle+" · пасмурно ⛅", sub:"Зато дома уютно и стабильный сигнал." };
    case "fog":   return { title:baseTitle+" · туман 🌫", sub:"Самое время остаться онлайн." };
    default:      return { title:baseTitle, sub:baseSub };
  }
}

function updateWeatherBackground(){
  if(!weatherBgEl) return;

  const kind = lastWeatherKind || "clear";
  const isNight = lastWeatherIsNight;
  let cls;

  switch(kind){
    case "storm": cls="storm"; break;
    case "rain-heavy": cls="rain-heavy"; break;
    case "rain-light": cls="rain-light"; break;
    case "snow-heavy": cls="snow-heavy"; break;
    case "snow-light": cls="snow-light"; break;
    case "fog": cls="fog"; break;
    case "clouds-overcast": cls="clouds-overcast"; break;
    case "clouds-broken": 
    case "clouds-few": cls=isNight ? "clouds-night" : "clouds-day"; break;
    case "clear":
    default: cls=isNight ? "clear-night" : "clear-day";
  }

  let tempMod = "";
  if (typeof lastWeatherTemp === "number") {
    if(lastWeatherTemp <= -5) tempMod=" cold";
    else if(lastWeatherTemp >= 28) tempMod=" hot";
  }

  weatherBgEl.className = "weather-bg " + cls + tempMod;
}

function updateTimeBanner(){
  const bannerEl = document.getElementById("timeBanner");
  if(!bannerEl) return;

  const titleEl = document.getElementById("timeBannerTitle");
  const subEl   = document.getElementById("timeBannerSub");
  const artEl   = document.getElementById("timeBannerArt");

  const hour = new Date().getHours();
  const cfg = pickTimeBannerConfig(hour);
  const txt = buildBannerText(cfg.baseTitle, cfg.baseSub, lastWeatherKind);

  titleEl.textContent = txt.title;
  subEl.textContent = txt.sub;
  artEl.style.backgroundImage = "url("+(lastWeatherKind==="snow"?"icons/hero_r2d2.svg":"icons/hero_r2d5.svg")+")";

  updateWeatherBackground();
}

/* ---------- Weather API ---------- */
async function fetchWeather(){
  const apiKey = CONFIG.weatherApiKey.trim();
  if(!apiKey || !CONFIG.city){
    superCity.textContent = CONFIG.city || "Город";
    superCond.textContent = "нет данных";
    superTemp.textContent = "—°C";
    superMeta.textContent = "Нет API-ключа";
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city}&appid=${apiKey}&units=metric&lang=ru`;

  try {
    const res = await fetch(url);
    if(!res.ok){
      superCity.textContent = CONFIG.city;
      superCond.textContent = "ошибка";
      superTemp.textContent = "—°C";
      superMeta.textContent = "Проверь город или ключ";
      return;
    }

    const data = await res.json();
    const w = (data.weather && data.weather[0]) || {};
    const desc = w.description || "";
    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    const hum = Math.round(data.main.humidity);

    superCity.textContent = data.name || CONFIG.city;
    superCond.textContent = desc;
    superTemp.textContent = temp + "°C";
    superMeta.textContent = `Ощущается как ${feels}° · влажность ${hum}%`;

    lastWeatherTemp = temp;

    /* detect weather kind */
    lastWeatherKind = detectWeatherKind(w, data);

    /* detect night/day */
    try {
      const tz = data.timezone || 0;
      const nowUtc = Date.now()/1000;
      const nowLocal = nowUtc + tz;
      lastWeatherIsNight = (nowLocal < data.sys.sunrise || nowLocal > data.sys.sunset);
    } catch { lastWeatherIsNight=false; }

    updateTimeBanner();
  } catch(e){
    superCond.textContent="нет данных";
    superTemp.textContent="—°C";
    superMeta.textContent="Ошибка сети";
  }
}

/* ---------- Speed Test ---------- */
async function runSpeedTest(){
  if(!superPing || !superDown || !superUp) return;

  superStatus.textContent = "Измерение…";

  /* PING */
  let ping = 0;
  try{
    const t0 = performance.now();
    await fetch("https://cors.eu.org/", { mode:"no-cors" });
    ping = Math.round(performance.now() - t0);
  }catch{}
  superPing.textContent = ping + " ms";

  /* DOWNLOAD */
  let down=0;
  try{
    const size=1000000;
    const t0=performance.now();
    await fetch("https://speed.hetzner.de/1MB.bin");
    const t1=performance.now();
    down = Math.round((size/((t1-t0)/1000))/1024/1024);
  }catch{}
  superDown.textContent = down + " МБ/с";

  /* UPLOAD */
  let up=0;
  try{
    const data=new Uint8Array(200000);
    const t0=performance.now();
    await fetch("https://httpbin.org/post",{ method:"POST", body:data });
    const t1=performance.now();
    up = Math.round((200000/((t1-t0)/1000))/1024/1024);
  }catch{}
  superUp.textContent = up + " МБ/с";

  if(down>40) superStatus.textContent="Отлично 👍";
  else if(down>15) superStatus.textContent="Хорошо 🙂";
  else if(down>5) superStatus.textContent="Средне 😐";
  else superStatus.textContent="Плохо 😢";
}

/* ---------- UI config ---------- */
function applyConfigToUI(){
  if(welcomeEl) welcomeEl.textContent = CONFIG.welcome;

  document.querySelectorAll(".slide").forEach(slide=>{
    const band = slide.dataset.net==="r2d5"?"5":"24";
    const ssidMain = slide.querySelector(".slide-ssid-main");
    const ssidSub  = slide.querySelector(".slide-ssid-sub");
    const cap      = slide.querySelector(".slide-caption");

    if(ssidMain) ssidMain.textContent = getSsidForBand(band);
    if(ssidSub)  ssidSub.textContent  = band==="5"?"5 GHz":"2.4 GHz";
    if(cap){
      cap.textContent = band==="5"
        ? `${getSsidForBand("5")} · быстрее, если поддерживается`
        : `${getSsidForBand("24")} · стабильнее на расстоянии`;
    }
  });

  updateMeta();
}

function recalcWidth(){
  slideWidth = carousel.offsetWidth;
  track.style.transition="none";
  track.style.transform=`translateX(${-index*slideWidth}px)`;
  void track.offsetWidth;
  track.style.transition="transform 0.7s cubic-bezier(.22,.61,.36,1)";
  updateMeta();
}

function updateMeta(){
  const logical = (index-1+REAL_COUNT)%REAL_COUNT;
  dots.forEach((d,i)=>d.classList.toggle("active",i===logical));

  const band = logical===0 ? "5":"24";
  const ssid = getSsidForBand(band);

  let base =
    band==="5"
    ? `Выбрана ${ssid} (5 GHz) — быстрее, если устройство поддерживает 5 GHz.`
    : `Выбрана ${ssid} (2.4 GHz) — стабильнее на расстоянии.`;

  if(isIOS){
    base += " Если страница открыта на iPhone — зайди в настройки Wi-Fi.";
  } else if(isAndroid){
    base += " На Android можно нажать «Подключиться автоматически».";
  } else {
    base += " На ноутбуке удобно отсканировать QR.";
  }

  helperText.textContent = base;
}

function goTo(newIndex){
  if(isAnimating) return;
  isAnimating=true;
  index=newIndex;
  track.style.transform=`translateX(${-index*slideWidth}px)`;
}

function nextSlide(){ goTo(index+1); }
function prevSlide(){ goTo(index-1); }

track.addEventListener("transitionend", e=>{
  if(index===0){
    track.style.transition="none";
    index=REAL_COUNT;
    track.style.transform=`translateX(${-index*slideWidth}px)`;
    void track.offsetWidth;
    track.style.transition="transform 0.7s cubic-bezier(.22,.61,.36,1)";
  } else if(index===slides.length-1){
    track.style.transition="none";
    index=1;
    track.style.transform=`translateX(${-index*slideWidth}px)`;
    void track.offsetWidth;
    track.style.transition="transform 0.7s cubic-bezier(.22,.61,.36,1)";
  }
  updateMeta();
  isAnimating=false;
});

/* ---------- Swipe ---------- */
let startX=null, startY=null, draggingMouse=false;

function swipeStart(e){
  const p = e.touches?e.touches[0]:e;
  startX=p.clientX; startY=p.clientY;
  draggingMouse=!e.touches;
}
function swipeMove(e){
  if(startX===null) return;
  const p=e.touches?e.touches[0]:e;
  if(Math.abs(p.clientX-startX)>Math.abs(p.clientY-startY)+10){
    e.preventDefault();
  }
}
function swipeEnd(e){
  if(startX===null) return;
  const p=e.changedTouches?e.changedTouches[0]:e;
  const dx=p.clientX-startX;

  if(Math.abs(dx)>40){
    if(dx<0) nextSlide(); else prevSlide();
  }
  startX=startY=null;
  draggingMouse=false;
}

card.addEventListener("touchstart", swipeStart,{passive:true});
card.addEventListener("touchmove", swipeMove,{passive:false});
card.addEventListener("touchend", swipeEnd);

/* ---------- QR + Buttons ---------- */
function showQR(){
  const ssid=getCurrentSsid();
  const payload=`WIFI:T:WPA;S:${ssid};P:${CONFIG.pass};;`;

  if(!qrObj){
    qrObj=new QRCode(document.getElementById("qrCanvas"),{width:200,height:200});
  }
  qrObj.clear();
  qrObj.makeCode(payload);
  document.getElementById("qrBox").style.display="block";
}

function autoConnect(){
  const ssid=getCurrentSsid();
  location.href=`WIFI:T:WPA;S:${ssid};P:${CONFIG.pass};;`;
}

function copyPass(){
  navigator.clipboard.writeText(CONFIG.pass).then(()=>{
    alert("Пароль скопирован");
  }).catch(()=>{
    alert("Не удалось скопировать");
  });
}

function openMaps(){
  const url=CONFIG.mapsUrl||defaultConfig.mapsUrl;
  window.open(/^https?:\/\//i.test(url)?url:"https://"+url,"_blank");
}

/* ---------- Admin ---------- */
function toggleAdmin(){
  adminPanelEl.classList.toggle("open");
  if(adminPanelEl.classList.contains("open")) fillAdminForm();
}
function fillAdminForm(){
  document.getElementById("admWelcome").value = CONFIG.welcome;
  document.getElementById("admSsid5").value   = CONFIG.ssid5;
  document.getElementById("admSsid24").value  = CONFIG.ssid24;
  document.getElementById("admPass").value    = CONFIG.pass;
  document.getElementById("admCity").value    = CONFIG.city;
}
function saveConfig(){
  CONFIG.welcome=document.getElementById("admWelcome").value||defaultConfig.welcome;
  CONFIG.ssid5=document.getElementById("admSsid5").value||defaultConfig.ssid5;
  CONFIG.ssid24=document.getElementById("admSsid24").value||defaultConfig.ssid24;
  CONFIG.pass=document.getElementById("admPass").value||defaultConfig.pass;
  CONFIG.city=document.getElementById("admCity").value||defaultConfig.city;

  saveConfigToStorage();
  applyConfigToUI();
  updateTimeBanner();
  fetchWeather();
  toggleAdmin();
}
function resetConfig(){
  CONFIG={...defaultConfig};
  saveConfigToStorage();
  applyConfigToUI();
  updateTimeBanner();
  fetchWeather();
  toggleAdmin();
}

/* ---------- Startup ---------- */

(function autoPick(){
  index = (oldAndroid || oldIOS) ? 2 : 1;
})();

window.addEventListener("load", ()=>{
  recalcWidth();
  applyConfigToUI();
  updateHeroArt();
  updateTimeBanner();
  fetchWeather();
  runSpeedTest();
});

window.addEventListener("resize", recalcWidth);

setInterval(runSpeedTest, 3000);
