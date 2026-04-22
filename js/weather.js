import {
  CONFIG,
  defaultConfig,
  el,
  setWeatherState
} from "./config.js";

/* =========================================
   Detect city by IP
========================================= */

export async function detectCityFromDevice() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    CONFIG.city = data?.city || defaultConfig.city;

  } catch {
    CONFIG.city = defaultConfig.city;
  }
}

/* =========================================
   Fetch weather
========================================= */

export async function fetchWeather() {
  const city =
    (CONFIG.city || defaultConfig.city).trim();

  const apiKey =
    (CONFIG.weatherApiKey || "").trim();

  if (!apiKey) {
    renderError(city, "Нет API key");
    return;
  }

  const url =
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ru`;

  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-store"
    });

    const data = await res.json();

    if (!res.ok) {
      renderError(
        city,
        data?.message || "Ошибка API"
      );
      return;
    }

    renderWeather(data);
    updateWeatherState(data);
    updateWeatherBackground();
    updateTimeBanner();

  } catch (e) {
    renderError(
      city,
      e.message || "Ошибка сети"
    );
  }
}

/* =========================================
   Render weather
========================================= */

function renderWeather(data) {
  const city =
    data.name || CONFIG.city;

  const temp =
    Math.round(data.main.temp);

  const feels =
    Math.round(data.main.feels_like);

  const hum =
    Math.round(data.main.humidity);

  const desc =
    data.weather?.[0]?.description || "—";

  if (el.superCity) {
    el.superCity.textContent = city;
  }

  if (el.superTemp) {
    el.superTemp.textContent =
      `${temp}°C`;
  }

  if (el.superCond) {
    el.superCond.textContent = desc;
  }

  if (el.superHumidity) {
    el.superHumidity.textContent =
      `влажность ${hum}%`;
  }

  if (el.superMeta) {
    el.superMeta.textContent =
      `Ощущается как ${feels}°`;
  }
}

/* =========================================
   Error state
========================================= */

function renderError(city, msg) {
  if (el.superCity) {
    el.superCity.textContent = city;
  }

  if (el.superTemp) {
    el.superTemp.textContent = "—°C";
  }

  if (el.superCond) {
    el.superCond.textContent =
      "нет данных";
  }

  if (el.superHumidity) {
    el.superHumidity.textContent = "—";
  }

  if (el.superMeta) {
    el.superMeta.textContent = msg;
  }
}

/* =========================================
   Weather type
========================================= */

function updateWeatherState(data) {
  const weather =
    data.weather?.[0] || {};

  const main =
    (weather.main || "").toLowerCase();

  const id =
    weather.id || 0;

  const temp =
    Math.round(data.main.temp);

  const hour =
    new Date().getHours();

  const isNight =
    hour >= 22 || hour < 6;

  let kind = "clear";

  if (main.includes("clear")) {
    kind = "clear";

  } else if (main.includes("cloud")) {

    if (id === 804)
      kind = "clouds-overcast";
    else if (
      id === 802 ||
      id === 803
    )
      kind = "clouds-broken";
    else
      kind = "clouds-few";

  } else if (main.includes("rain")) {

    kind =
      (id >= 500 && id <= 504)
        ? "rain-light"
        : "rain-heavy";

  } else if (main.includes("snow")) {

    kind =
      (id >= 600 && id < 620)
        ? "snow-light"
        : "snow-heavy";

  } else if (
    main.includes("thunder")
  ) {
    kind = "thunder";

  } else if (
    main.includes("mist") ||
    main.includes("fog") ||
    main.includes("haze")
  ) {
    kind = "fog";
  }

  setWeatherState(
    kind,
    isNight,
    temp
  );
}

/* =========================================
   Background
========================================= */

export function updateWeatherBackground() {
  if (!el.weatherBg) return;

  el.weatherBg.className = "weather-bg";
}

/* =========================================
   Time banner
========================================= */

export function updateTimeBanner() {
  if (!el.timeBanner) return;

  const hour =
    new Date().getHours();

  let title =
    "Добро пожаловать";

  let sub =
    "Wi-Fi готов к работе.";

  if (hour >= 6 && hour < 12) {
    title = "Доброе утро";
    sub = "Кофе и интернет уже ждут.";

  } else if (
    hour >= 12 &&
    hour < 18
  ) {
    title = "Хорошего дня";
    sub = "Интернет есть — можно творить.";

  } else if (
    hour >= 18 &&
    hour < 22
  ) {
    title = "Уютного вечера";
    sub = "Фильмы, игры и стабильный Wi-Fi.";

  } else {
    title = "Ночной режим";
    sub = "Роутер не спит.";
  }

  if (el.timeBannerTitle) {
    el.timeBannerTitle.textContent = title;
  }

  if (el.timeBannerSub) {
    el.timeBannerSub.textContent = sub;
  }

  if (el.timeBannerArt) {
    el.timeBannerArt.style.backgroundImage =
      "url(icons/hero_r2d5.svg)";
  }
}
