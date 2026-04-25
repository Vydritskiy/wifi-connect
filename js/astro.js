
import { getTimeState } from "./time.js";

/* =========================================
   CONFIG
========================================= */

const SUN_RADIUS_X = 60;
const SUN_ARC_HEIGHT = 22;

const MOON_RADIUS_X = 60;
const MOON_ARC_HEIGHT = 20;

const MOON_OFFSET = 0.52; // ~180°

/* =========================================
   TIME NORMALIZATION
========================================= */

function getT() {
  const { hour, minute, second } = getTimeState();

  return (
    hour +
    minute / 60 +
    second / 3600
  ) / 24;
}

/* =========================================
   SUN POSITION (FULL ORBIT)
========================================= */

export function getSunPosition() {
  const t = getT();

  const angle = t * Math.PI * 2;

  return {
    x: Math.cos(angle) * SUN_RADIUS_X,
    y: Math.sin(angle) * SUN_ARC_HEIGHT,
    z: 18
  };
}

/* =========================================
   MOON POSITION
========================================= */

export function getMoonPosition() {
  const t = getT();

  const angle = (t + MOON_OFFSET) * Math.PI * 2;

  return {
    x: Math.cos(angle) * MOON_RADIUS_X,
    y: Math.sin(angle) * MOON_ARC_HEIGHT,
    z: 16
  };
}

/* =========================================
   DAY FACTOR (REAL SMOOTH CURVE)
========================================= */

export function getDayFactor() {
  const t = getT();

  // smooth daylight curve (0..1..0)
  const v = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;

  return Math.max(0, Math.min(1, v));
}

/* =========================================
   MOON PHASE (REAL CYCLE MODEL)
========================================= */

export function getMoonPhase() {
  const t = getT();

  const cycle = (t * 29.5) % 1;

  return {
    phase: cycle,
    waxing: cycle < 0.5
  };
}

/* =========================================
   ECLIPSE (GEOMETRIC)
========================================= */

export function getEclipseState() {
  const sun = getSunPosition();
  const moon = getMoonPosition();

  const dx = sun.x - moon.x;
  const dy = sun.y - moon.y;

  const dist = Math.sqrt(dx * dx + dy * dy);

  return {
    solar: dist < 6,
    lunar: dist < 8
  };
}