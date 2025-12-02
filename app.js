
const defaultConfig = {
  ssid5: "r2d5",
  ssid24: "r2d2",
  pass: "Jgthfnbdysq1913",
  welcome: "Добро пожаловать! Чувствуй себя как дома 🧡",
  mapsUrl: "https://www.google.com/maps/place/вулиця+Андрія+Малишка,+31А,+Київ",
  city: "Kyiv",
  weatherApiKey: "6530afae9a05d8f6e1c997682469a69d"
};

// Load configuration from localStorage
let CONFIG = loadConfig();
function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("wifiGuestConfig"));
    if (saved) {
      delete saved.mapsUrl;
      delete saved.weatherApiKey;
      return { ...defaultConfig, ...saved };
    }
  } catch (e) {}
  return { ...defaultConfig };
}

// Weather and speed test functions, including fetchWeather

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

  const url = `${WEATHER_API_URL}?q=${encodeURIComponent(CONFIG.city)}&appid=${CONFIG.weatherApiKey}&units=metric&lang=ru`;

  try {
    tempEl.textContent = "Загрузка…";

    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const w = data.weather[0];

    lastWeatherTemp = Math.round(data.main.temp);
    lastWeatherKind = detectWeatherKind(w, data);
    const tz = data.timezone;
    const now = Date.now() / 1000 + tz;
    lastWeatherIsNight = !(now > data.sys.sunrise && now < data.sys.sunset);

    cityEl.textContent = data.name;
    mainEl.textContent = w.description;
    tempEl.textContent = `${lastWeatherTemp}°C`;
    metaEl.textContent = `Ощущается как ${Math.round(data.main.feels_like)}°C · влажность ${data.main.humidity}%`;

    updateWeatherBackground();
  } catch (e) {
    cityEl.textContent = CONFIG.city;
    mainEl.textContent = "";
    tempEl.textContent = "Ошибка погоды";
    metaEl.textContent = "";
  }
}
