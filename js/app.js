import "./config.js";
import "./ui.js";
import { fetchWeather } from "./weather.js";
import { runSpeedTest } from "./speedtest.js";

function setThemeByTime() {
  const hour = new Date().getHours();
  const body = document.body;
  body.classList.remove("theme-morning","theme-day","theme-evening","theme-night");
  if (hour >= 6 && hour < 12) body.classList.add("theme-morning");
  else if (hour < 18) body.classList.add("theme-day");
  else if (hour < 22) body.classList.add("theme-evening");
  else body.classList.add("theme-night");
}

document.addEventListener('DOMContentLoaded', async () => {
 setThemeByTime();
 await fetchWeather();
 await runSpeedTest();
});
