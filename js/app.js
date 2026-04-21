import "./config.js";
import "./ui.js";

import {
  fetchWeather
} from "./weather.js";

import {
  runSpeedTest
} from "./speedtest.js";

(async function initApp() {
  await fetchWeather();
  await runSpeedTest();
})();
