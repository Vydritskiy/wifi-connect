import {
  getTimeState
} from "./time.js";

import {
  getSunPosition,
  getMoonPosition,
  getDayFactor,
  getEclipseState
} from "./astro.js";

let weatherState = {};
let engine = null;
let scene = null;
let resizeBound = false;
let booting = false;

/* =========================================
   WEATHER MERGE
========================================= */

function mergeWeather(next = {}) {
  weatherState = {
    ...weatherState,
    ...next
  };
}

/* =========================================
   HELPERS
========================================= */

function clamp(v) {
  return Math.max(0, Math.min(1, v));
}

/* =========================================
   INIT SKY
========================================= */

export function initSkyBackground(weather = {}) {
  mergeWeather(weather);

  if (engine || booting) return;

  const canvas = document.getElementById("skyCanvas");
  if (!canvas) return;

  if (!window.BABYLON) {
    booting = true;

    setTimeout(() => {
      booting = false;
      initSkyBackground(weatherState);
    }, 120);

    return;
  }

  booting = true;

  try {
    const B = window.BABYLON;

    engine = new B.Engine(canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true
    });

    window.__bgEngine = engine;

    scene = new B.Scene(engine);

    /* =========================================
       SAFE BASE (NO FLASH)
    ========================================= */

    scene.clearColor = new B.Color4(0.03, 0.05, 0.10, 1);

    /* =========================================
       CAMERA
    ========================================= */

    const camera = new B.FreeCamera(
      "cam",
      new B.Vector3(0, 0, 0),
      scene
    );

    camera.setTarget(B.Vector3.Zero());

    /* =========================================
       LIGHTS
    ========================================= */

    const ambient = new B.HemisphericLight(
      "amb",
      new B.Vector3(0, 1, 0),
      scene
    );

    const sunLight = new B.DirectionalLight(
      "sunLight",
      new B.Vector3(-1, -1, 0),
      scene
    );

    const moonLight = new B.PointLight(
      "moonLight",
      new B.Vector3(0, 0, 0),
      scene
    );

    new B.GlowLayer("glow", scene, {
      blurKernelSize: 14
    });

    /* =========================================
       SKYBOX (FIXED CORE ISSUE)
    ========================================= */

    const skybox = B.MeshBuilder.CreateBox(
      "skyBox",
      { size: 200 },
      scene
    );

    const skyMat = new B.StandardMaterial("skyMat", scene);
    skyMat.backFaceCulling = false;
    skyMat.disableLighting = true;
    skyMat.emissiveColor = new B.Color3(0.03, 0.05, 0.10);

    skybox.material = skyMat;

    /* =========================================
       SUN
    ========================================= */

    const sun = B.MeshBuilder.CreateSphere(
      "sun",
      { diameter: 4.5 },
      scene
    );

    const sunMat = new B.StandardMaterial("sunMat", scene);
    sunMat.disableLighting = true;
    sunMat.emissiveColor = new B.Color3(1, 0.82, 0.38);

    sun.material = sunMat;

    /* =========================================
       MOON
    ========================================= */

    const moon = B.MeshBuilder.CreateSphere(
      "moon",
      { diameter: 3.5 },
      scene
    );

    const moonMat = new B.StandardMaterial("moonMat", scene);
    moonMat.disableLighting = true;
    moonMat.emissiveColor = new B.Color3(0.82, 0.88, 1);

    moon.material = moonMat;

    /* =========================================
       STARS
    ========================================= */

    const stars = [];

    for (let i = 0; i < 260; i++) {
      const s = B.MeshBuilder.CreateSphere(
        "s" + i,
        { diameter: 0.05 },
        scene
      );

      const r = 60 + Math.random() * 10;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 50;

      s.position = new B.Vector3(
        Math.cos(a) * r,
        y,
        Math.sin(a) * r
      );

      const m = new B.StandardMaterial("sm" + i, scene);
      m.disableLighting = true;
      m.emissiveColor = new B.Color3(1, 1, 1);

      s.material = m;

      stars.push(s);
    }

    /* =========================================
       SINGLE RENDER LOOP (STABLE)
    ========================================= */

    engine.runRenderLoop(() => {
      if (!scene) return;

      const { phase } = getTimeState();

      const clouds = Number(weatherState.clouds) || 0;
      const precip = Number(weatherState.precipitation) || 0;

      const sunPos = getSunPosition();
      const moonPos = getMoonPosition();

      const dayFactor = getDayFactor();
      const eclipse = getEclipseState();

      sun.position.set(sunPos.x, sunPos.y, sunPos.z);
      moon.position.set(moonPos.x, moonPos.y, moonPos.z);

      const isNight = phase === "night";

      /* SKY COLOR (SAFE GRADIENT) */
      const base = isNight
        ? [0.03, 0.05, 0.10]
        : [0.30, 0.55, 0.90];

      const mix = clamp(clouds / 100) * 0.25;

      const skyColor = new B.Color3(
        base[0] * (1 - mix) + 0.45 * mix,
        base[1] * (1 - mix) + 0.55 * mix,
        base[2] * (1 - mix) + 0.65 * mix
      );

      skyMat.emissiveColor = skyColor;

      /* LIGHTING */
      sun.setEnabled(!isNight);
      moon.setEnabled(isNight);

      sunLight.direction = sun.position.scale(-1).normalize();

      sunLight.intensity = eclipse.solar
        ? 0.05
        : Math.max(0.15, dayFactor);

      moonLight.position = moon.position;

      moonLight.intensity = eclipse.lunar
        ? 0.35
        : (1 - dayFactor) * 0.25;

      ambient.intensity = isNight ? 0.08 : 0.16;

      /* STARS */
      const starsOn = isNight && clouds < 70 && precip <= 0;

      const t = performance.now() * 0.001;

      stars.forEach(s => {
        s.isVisible = starsOn;

        const tw = 0.7 + 0.3 * Math.sin(
          t * 0.5 + s.position.x
        );

        s.scaling.setAll(tw);
      });

      scene.render();
    });

    /* =========================================
       RESIZE
    ========================================= */

    if (!resizeBound) {
      resizeBound = true;
      window.addEventListener("resize", () => {
        engine?.resize();
      });
    }

  } catch (e) {
    console.error("Background error:", e);
    engine = null;
    scene = null;
  } finally {
    booting = false;
  }
};

/* =========================================
   UPDATE API
========================================= */

window.updateSkyBackground = (w = {}) => {
  mergeWeather(w);

  if (!engine) {
    initSkyBackground(weatherState);
  }
};