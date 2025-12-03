/* =========================================
   WEATHER.JS — логика погоды + баннер времени суток
   ========================================= */

import {
  CONFIG,
  defaultConfig,
  el,
  lastWeatherKind,
  lastWeatherIsNight,
  lastWeatherTemp
} from "./config.js";



// =========================================
// Определение города по IP
// =========================================

export async function detectCityFromDevice() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    if (data && data.city) {
      CONFIG.city = data.city;
      console.log("Город определён автоматически:", CONFIG.city);
    } else {
      CONFIG.city = defaultConfig.city;
    }
  } catch (e) {
    CONFIG.city = defaultConfig.city;
  }
}



// =========================================
// Weather API
// =========================================

export async function fetchWeather() {
  const apiKey = CONFIG.weatherApiKey?.trim();
  const city = CONFIG.city?.trim();

  if (!apiKey) {
    el.superCity.textContent = city || "Город";
    el.superTemp.textContent = "—°C";
    el.superCond.textContent = "нет данных";
    el.superMeta.textContent = "Нет API-ключа";
    return;
  }

  if (!city) {
    el.superCity.textContent = "Город";
    el.superTemp.textContent = "—°C";
    el.superCond.textContent = "не указан город";
    el.superMeta.textContent = "";
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`;

  try {
    const res = await fetch(url);

    // --- обработка ошибок API ---
    if (res.status === 401) {
      el.superCity.textContent = city;
      el.superTemp.textContent = "—°C";
      el.superCond.textContent = "ошибка ключа";
      el.superMeta.textContent = "Неверный API key";
      return;
    }

    if (res.status === 404) {
      el.superCity.textContent = city;
      el.superTemp.textContent = "—°C";
      el.superCond.textContent = "город не найден";
      el.superMeta.textContent = "";
      return;
    }

    if (res.status === 429) {
      el.superCity.textContent = city;
      el.superTemp.textContent = "—°C";
      el.superCond.textContent = "лимит API";
      el.superMeta.textContent = "Повтори позже";
      return;
    }

    if (!res.ok) {
      el.superCity.textContent = city;
      el.superTemp.textContent = "—°C";
      el.superCond.textContent = "ошибка";
      el.superMeta.textContent = "Проверь ключ/город";
      return;
    }

    // --- успешный ответ ---
    const data = await res.json();
    const w = data.weather?.[0] || {};

    const desc = w.description || "—";
    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    const hum = Math.round(data.main.humidity);

    // обновление UI
    el.superCity.textContent = data.name || city;
    el.superTemp.textContent = temp + "°C";
    el.superCond.textContent = desc;
    el.superMeta.textContent = `Ощущается как ${feels}° · влажность ${hum}%`;

    // сохраняем в глобальные состояния
    updateWeatherState(data);

    // обновить анимированный фон
    updateWeatherBackground();

  } catch (e) {
    el.superCity.textContent = city;
    el.superTemp.textContent = "—°C";
    el.superCond.textContent = "нет данных";
    el.superMeta.textContent = "Ошибка сети";
  }
}



// =========================================
// Форматирование кода погоды
// =========================================

function updateWeatherState(data) {
  const weather = data.weather?.[0];
  const main = weather?.main?.toLowerCase();
  const id = weather?.id;
  const temp = Math.round(data.main.temp);

  // сохраняем температуру
  lastWeatherTemp = temp;

  // ночь / день
  const isNight = data.dt < data.sys.sunrise || data.dt > data.sys.sunset;
  lastWeatherIsNight = isNight;

  // определяем тип погоды
  if (!main) {
    lastWeatherKind = "clear";
    return;
  }

  if (main.includes("clear")) lastWeatherKind = "clear";
  else if (main.includes("cloud")) {
    if (id === 804) lastWeatherKind = "clouds-overcast";
    else if (id === 802 || id === 803) lastWeatherKind = "clouds-broken";
    else lastWeatherKind = "clouds-few";
  }
  else if (main.includes("rain")) {
    if (id >= 500 && id <= 504) lastWeatherKind = "rain-light";
    else lastWeatherKind = "rain-heavy";
  }
  else if (main.includes("snow")) {
    if (id >= 600 && id < 620) lastWeatherKind = "snow-light";
    else lastWeatherKind = "snow-heavy";
  }
  else if (main.includes("thunder")) lastWeatherKind = "thunder";
  else if (main.includes("fog") || main.includes("mist") || main.includes("haze")) lastWeatherKind = "fog";
  else lastWeatherKind = "clear";
}



// =========================================
// Погодный фон
// =========================================

export function updateWeatherBackground() {
  if (!el.weatherBg) return;

  const kind = lastWeatherKind || "clear";
  const isNight = lastWeatherIsNight;

  let cls;

  switch (kind) {
    case "storm": cls = "thunder"; break;
    case "rain-heavy": cls = "rain"; break;
    case "rain-light": cls = "rain"; break;
    case "snow-heavy": cls = "snow"; break;
    case "snow-light": cls = "snow"; break;
    case "fog": cls = "fog"; break;
    case "clouds-overcast": cls = "clouds-day"; break;
    case "clouds-broken":
    case "clouds-few":
      cls = isNight ? "clouds-night" : "clouds-day";
      break;

    case "clear":
    default:
      cls = isNight ? "clear-night" : "clear-day";
  }

  // hot / cold модификатор
  let tempMod = "";
  if (typeof lastWeatherTemp === "number") {
    if (lastWeatherTemp <= -5) tempMod = " cold";
    else if (lastWeatherTemp >= 28) tempMod = " hot";
  }

  el.weatherBg.className = "weather-bg " + cls + tempMod;

  updateTimeBanner();
}



// =========================================
// TIME BANNER (утро / день / вечер / ночь)
// =========================================

const TIME_BANNERS = [
  {
    from: 5, to: 11,
    baseTitle: "Доброе утро",
    baseSub: "Кофе, Wi-Fi и уют уже ждут тебя."
  },
  {
    from: 11, to: 18,
    baseTitle: "Хорошего дня",
    baseSub: "Интернет есть — можно творить чудеса."
  },
  {
    from: 18, to: 23,
    baseTitle: "Уютного вечера",
    baseSub: "Сериалы, игры и ламповый вай-фай."
  },
  {
    from: 23, to: 5,
    baseTitle: "Ночной режим",
    baseSub: "Роутер не спит, даже если ты уже да."
  }
];

function pickTimeBannerConfig(hour) {
  let cfg = TIME_BANNERS[0];

  for (const b of TIME_BANNERS) {
    if (b.from < b.to) {
      if (hour >= b.from && hour < b.to) { cfg = b; break; }
    } else {
      if (hour >= b.from || hour < b.to) { cfg = b; break; }
    }
  }
  return cfg;
}

export function updateTimeBanner() {
  if (!el.timeBanner) return;

  const hour = new Date().getHours();
  const cfg = pickTimeBannerConfig(hour);

  el.timeBannerTitle.textContent = cfg.baseTitle;
  el.timeBannerSub.textContent = cfg.baseSub;

  // Арт выбираем простой (без верхнего дроида)
  el.timeBannerArt.style.backgroundImage =
    lastWeatherKind === "snow"
      ? "url(icons/hero_r2d2.svg)"
      : "url(icons/hero_r2d5.svg)";
}



// =========================================
// END OF MODULE
// =========================================
