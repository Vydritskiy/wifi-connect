import "./config.js";
import "./ui.js";

import {
  detectCityFromDevice,
  fetchWeather
} from "./weather.js";

import {
  runSpeedTest
} from "./speedtest.js";

(async function initApp() {
  await detectCityFromDevice();
  await fetchWeather();
  await runSpeedTest();
})();
