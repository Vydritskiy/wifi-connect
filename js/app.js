import "./config.js";
import "./ui.js";

import { fetchWeather } from "./weather.js";
import { runSpeedTest } from "./speedtest.js";

function setThemeByTime() {
  const hour = new Date().getHours();
  const body = document.body;

  body.classList.remove(
    "theme-morning",
    "theme-day",
    "theme-evening",
    "theme-night"
  );

  if (hour >= 6 && hour < 12) {
    body.classList.add("theme-morning");
  } else if (hour >= 12 && hour < 18) {
    body.classList.add("theme-day");
  } else if (hour >= 18 && hour < 22) {
    body.classList.add("theme-evening");
  } else {
    body.classList.add("theme-night");
  }
}

function startClock() {
  function updateClock() {
    const now = new Date();

    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();

    const hourDeg =
      h * 30 + m * 0.5;

    const minuteDeg =
      m * 6 + s * 0.1;

    const secondDeg =
      s * 6;

    const hourHand =
      document.getElementById("hourHand");

    const minuteHand =
      document.getElementById("minuteHand");

    const secondHand =
      document.getElementById("secondHand");

    if (hourHand) {
      hourHand.style.transform =
        `translateX(-50%) rotate(${hourDeg}deg)`;
    }

    if (minuteHand) {
      minuteHand.style.transform =
        `translateX(-50%) rotate(${minuteDeg}deg)`;
    }

    if (secondHand) {
      secondHand.style.transform =
        `translateX(-50%) rotate(${secondDeg}deg)`;
    }
  }

  updateClock();
  setInterval(updateClock, 1000);
}

(async function initApp() {
  setThemeByTime();
startClock();

await fetchWeather();
await runSpeedTest();
})();
