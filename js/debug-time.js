
(function () {

  let state = "off"; // "off" | "on"

  let base = Date.now();
  let offset = 0;

  let timer = null;

  /* =========================================
     INTERNAL TIME
  ========================================= */

  function now() {
    if (state !== "on") {
      return new Date(Date.now());
    }

    return new Date(base + offset);
  }

  function emit() {
    if (state !== "on") return;

    window.dispatchEvent(
      new Event("debug-time-change")
    );
  }

  /* =========================================
     CORE API
  ========================================= */

  window.__timeDebug = {

    enable() {
      if (state === "on") return;

      state = "on";

      if (!timer) {
        timer = setInterval(() => {
          offset += 1000;
          emit();
        }, 1000);
      }

      emit();
    },

    disable() {
      state = "off";

      offset = 0;

      if (timer) {
        clearInterval(timer);
        timer = null;
      }

      // ❗ важно: НЕ emit
      // система должна забыть о debug
    },

    set(h = 0, m = 0, s = 0) {
      if (state !== "on") return;

      const d = new Date();
      d.setHours(h, m, s, 0);

      base = d.getTime();
      offset = 0;

      emit();
    },

    tick(ms = 1000) {
      if (state !== "on") return;

      offset += ms;
      emit();
    },

    isEnabled() {
      return state === "on";
    },

    getState() {
      return state;
    }
  };

  /* =========================================
     UI
  ========================================= */

  function createPanel() {

    const panel = document.createElement("div");

    panel.style.cssText = `
      position:fixed;
      right:10px;
      bottom:10px;
      z-index:9999;
      background:rgba(17,17,17,.82);
      color:#fff;
      padding:10px;
      border-radius:10px;
      font:12px sans-serif;
      backdrop-filter:blur(6px);
      width:240px;
    `;

    panel.innerHTML = `
      <label style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
        <input type="checkbox" id="dbgEn">
        Debug time
      </label>

      <input
        id="dbgRange"
        type="range"
        min="0"
        max="86399"
        step="1"
        style="width:100%;margin-bottom:8px;"
      >

      <div id="dbgTxt"></div>
    `;

    document.body.appendChild(panel);

    const check = panel.querySelector("#dbgEn");
    const range = panel.querySelector("#dbgRange");
    const text = panel.querySelector("#dbgTxt");

    function render() {
      const cur = now();

      const sec =
        cur.getHours() * 3600 +
        cur.getMinutes() * 60 +
        cur.getSeconds();

      check.checked = state === "on";
      range.value = sec;

      text.textContent = cur.toLocaleTimeString();
    }

    check.addEventListener("change", () => {
      if (check.checked) {
        window.__timeDebug.enable();
      } else {
        window.__timeDebug.disable();
      }

      render();
    });

    range.addEventListener("input", () => {
      const v = +range.value;

      const h = (v / 3600) | 0;
      const m = ((v % 3600) / 60) | 0;
      const s = v % 60;

      window.__timeDebug.set(h, m, s);
      render();
    });

    setInterval(render, 1000);
  }

  document.addEventListener(
    "DOMContentLoaded",
    createPanel
  );

})();