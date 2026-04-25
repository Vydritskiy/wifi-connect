import {
  CONFIG,
  defaultConfig,
  el,
  setWeatherState
} from "./config.js";

import { getTimeState } from "./time.js";

/* =========================================
   HELPERS
========================================= */

function buildFallbackState() {
  const {
    hour,
    season,
    isDay
  } = getTimeState();

  return {
    weather: "clear",
    description: "",
    temp: 0,
    clouds: 0,
    precipitation: 0,
    isDay,
    hour,
    season
  };
}

/* =========================================
   DETECT CITY
========================================= */

export async function detectCityFromDevice() {
  try {
    const res = await fetch(
      "https://ipapi.co/json/"
    );

    const data = await res.json();

    CONFIG.city =
      data?.city ||
      defaultConfig.city;

  } catch {
    CONFIG.city =
      defaultConfig.city;
  }
}

/* =========================================
   FETCH WEATHER
========================================= */

export async function fetchWeather() {
  const city =
    (
      CONFIG.city ||
      defaultConfig.city
    ).trim();

  const apiKey =
    (
      CONFIG.weatherApiKey ||
      ""
    ).trim();

  if (!apiKey) {
    renderError(
      city,
      "Нет API key"
    );

    return buildFallbackState();
  }

  const url =
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ru`;

  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-store"
    });

    const data =
      await res.json();

    if (!res.ok) {
      renderError(
        city,
        data?.message ||
          "Ошибка API"
      );

      return buildFallbackState();
    }

    renderWeather(data);
    updateWeatherState(data);

    return buildWeatherState(data);

  } catch (error) {
    renderError(
      city,
      error.message ||
        "Ошибка сети"
    );

    return buildFallbackState();
  }
}

/* =========================================
   RENDER WEATHER UI
========================================= */

function renderWeather(data) {
  const city =
    data.name ||
    CONFIG.city;

  const temp =
    Math.round(
      data.main?.temp || 0
    );

  const feels =
    Math.round(
      data.main?.feels_like || 0
    );

  const hum =
    Math.round(
      data.main?.humidity || 0
    );

  const wind =
    Math.round(
      data.wind?.speed || 0
    );

  const pressure =
    Math.round(
      data.main?.pressure || 0
    );

  const desc =
    data.weather?.[0]
      ?.description || "—";

  const {
    formattedDate
  } = getTimeState();

  if (el.weatherCity) {
    el.weatherCity.textContent =
      city;
  }

  if (el.weatherDate) {
    el.weatherDate.textContent =
      formattedDate;
  }

  if (el.weatherTemp) {
    el.weatherTemp.textContent =
      `${temp}°C`;
  }

  if (el.weatherMeta) {
    el.weatherMeta.textContent =
      `Ощущается как ${feels}°`;
  }

  if (el.weatherCond) {
    el.weatherCond.textContent =
      desc;
  }

  if (el.weatherHumidity) {
    el.weatherHumidity.textContent =
      `Влажность ${hum}%`;
  }

  if (el.weatherWind) {
    el.weatherWind.textContent =
      `Ветер ${wind} м/с`;
  }

  if (el.weatherPressure) {
    el.weatherPressure.textContent =
      `Давление ${pressure} hPa`;
  }
}

/* =========================================
   ERROR UI
========================================= */

function renderError(city, msg) {
  if (el.weatherCity) {
    el.weatherCity.textContent =
      city;
  }

  if (el.weatherDate) {
    el.weatherDate.textContent =
      "";
  }

  if (el.weatherTemp) {
    el.weatherTemp.textContent =
      "—°C";
  }

  if (el.weatherMeta) {
    el.weatherMeta.textContent =
      msg;
  }

  if (el.weatherCond) {
    el.weatherCond.textContent =
      "нет данных";
  }

  if (el.weatherHumidity) {
    el.weatherHumidity.textContent =
      "";
  }

  if (el.weatherWind) {
    el.weatherWind.textContent =
      "";
  }

  if (el.weatherPressure) {
    el.weatherPressure.textContent =
      "";
  }
}

/* =========================================
   SHARED WEATHER STATE
========================================= */

function updateWeatherState(data) {
  const weather =
    data.weather?.[0] || {};

  const main =
    (
      weather.main || ""
    ).toLowerCase();

  const id =
    weather.id || 0;

  const temp =
    Math.round(
      data.main?.temp || 0
    );

  const { hour } =
    getTimeState();

  const isNight =
    hour >= 22 ||
    hour < 6;

  let kind = "clear";

  if (
    main.includes("clear")
  ) {
    kind = "clear";

  } else if (
    main.includes("cloud")
  ) {
    if (id === 804) {
      kind =
        "clouds-overcast";

    } else if (
      id === 802 ||
      id === 803
    ) {
      kind =
        "clouds-broken";

    } else {
      kind =
        "clouds-few";
    }

  } else if (
    main.includes("rain")
  ) {
    kind =
      id >= 500 &&
      id <= 504
        ? "rain-light"
        : "rain-heavy";

  } else if (
    main.includes("snow")
  ) {
    kind =
      id >= 600 &&
      id < 620
        ? "snow-light"
        : "snow-heavy";

  } else if (
    main.includes(
      "thunder"
    )
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
   BUILD BACKGROUND STATE
========================================= */

function buildWeatherState(data) {
  const {
    hour,
    season,
    isDay
  } = getTimeState();

  return {
    weather:
      (
        data.weather?.[0]
          ?.main || "clear"
      ).toLowerCase(),

    description:
      data.weather?.[0]
        ?.description || "",

    temp:
      Math.round(
        data.main?.temp || 0
      ),

    clouds:
      data.clouds?.all || 0,

    precipitation:
      data.rain?.["1h"] ||
      data.snow?.["1h"] ||
      0,

    isDay,
    hour,
    season
  };
}