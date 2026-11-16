/* Deterministic replacement model. A finite slider illustrates a limit, not infinity. */
(function (root) {
  "use strict";
  const stats = root.CourseStats || (typeof require !== "undefined" ? require("./statistics.js") : null);
  function cleanSample(n) {
    if (!Number.isInteger(n) || n < 3 || n > 1001 || n % 2 === 0) throw new RangeError("n must be odd, 3..1001");
    return Array.from({length: n}, (_, i) => 20 + 380 * Math.pow(i / (n - 1), 4));
  }
  function summarize(values) {
    return { mean: stats.mean(values), median: stats.median(values),
      p95: stats.empiricalQuantile(values, .95), p99: stats.empiricalQuantile(values, .99) };
  }
  function thresholds(n) {
    cleanSample(n);
    return { mean: 1, median: (n + 1) / 2,
      p95: n - Math.ceil(.95 * n) + 1, p99: n - Math.ceil(.99 * n) + 1 };
  }
  function replace(n = 101, m = 1, exponent = 6) {
    const clean = cleanSample(n);
    if (!Number.isInteger(m) || m < 0 || m > n || !Number.isFinite(exponent) || exponent < 3 || exponent > 12) {
      throw new RangeError("Expected integer 0 <= m <= n and exponent 3..12");
    }
    const magnitude = Math.pow(10, exponent);
    // Replacing the smallest observations gives the upper envelope for rank estimators when M > max(clean).
    const corrupted = clean.map((value, i) => i < m ? magnitude : value);
    return { n, m, exponent, magnitude, clean, corrupted,
      before: summarize(clean), after: summarize(corrupted), thresholds: thresholds(n) };
  }
  root.CourseContamination = Object.freeze({ cleanSample, thresholds, replace });
  if (typeof module !== "undefined" && module.exports) module.exports = root.CourseContamination;
  if (typeof document === "undefined") return;
  const lab = document.querySelector("[data-contamination-lab]");
  if (!lab) return;
  const nInput = lab.querySelector("#replacement-n"), mInput = lab.querySelector("#replacement-m");
  const exponentInput = lab.querySelector("#replacement-exponent");
  const format = new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 2});
  const number = value => Math.abs(value) >= 1e6 ? value.toExponential(2) : format.format(value);
  function draw(n, m) {
    const points = Array.from({length: 19}, (_, i) => replace(n, m, 3 + i / 2));
    const all = points.flatMap(point => [point.after.mean, point.after.median]);
    const low = Math.floor(Math.log10(Math.min(...all))), high = Math.max(low + 1, Math.ceil(Math.log10(Math.max(...all))));
    const left = 105, top = 35, width = 600, height = 220, bottom = top + height;
    const x = power => left + (power - 3) / 9 * width;
    const y = value => bottom - (Math.log10(value) - low) / (high - low) * height;
    const layer = lab.querySelector("[data-chart-layer]"); layer.replaceChildren();
    function add(tag, attrs, text) {
      const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      if (text !== undefined) node.textContent = text;
      layer.appendChild(node);
    }
    const ticks = Math.min(high - low, 5);
    for (let i = 0; i <= ticks; i++) {
      const exponent = low + (high - low) * i / ticks, value = Math.pow(10, exponent);
      add("line", {x1:left, x2:left+width, y1:y(value), y2:y(value), class:"gridline"});
      add("text", {x:left-9, y:y(value)+4, "text-anchor":"end"}, number(value));
    }
    [3, 6, 9, 12].forEach(exponent => add("text", {x:x(exponent), y:278, "text-anchor":"middle"}, "10^"+exponent));
    [["mean", "#45678c"], ["median", "#176459"]].forEach(([name, color]) => {
      const path = points.map((point, i) => (i ? "L" : "M") + x(point.exponent) + " " + y(point.after[name])).join(" ");
      add("path", {d:path, fill:"none", stroke:color, "stroke-width":3});
    });
    add("line", {x1:x(Number(exponentInput.value)), x2:x(Number(exponentInput.value)), y1:top, y2:bottom,
      stroke:"#aa4d2d", "stroke-dasharray":"4 4"});
    add("text", {x:left, y:20}, "Значение оценки, ms · логарифмическая шкала");
    add("text", {x:385, y:309, "text-anchor":"middle"}, "Величина замены M, ms · логарифмическая шкала; n и m фиксированы");
    lab.querySelector("desc").textContent = `n=${n}, m=${m}. Mean ${m ? "неограниченно растёт" : "не меняется"} при росте M. ` +
      `Median ${m >= (n+1)/2 ? "можно увести в бесконечность" : "ограничена исходным диапазоном"}.`;
  }
  function update() {
    if (mInput.value === "" || !mInput.checkValidity()) {
      mInput.setAttribute("aria-invalid", "true");
      lab.querySelector("#replacement-status").textContent = `Введи целое m от 0 до ${nInput.value}. Таблица пока показывает предыдущий расчёт.`;
      return;
    }
    mInput.setAttribute("aria-invalid", "false");
    const data = replace(Number(nInput.value), Number(mInput.value), Number(exponentInput.value));
    lab.querySelector("output").textContent = number(data.magnitude) + " ms";
    const body = lab.querySelector("[data-replacement-summary]"); body.replaceChildren();
    const names = {mean:"Sample mean", median:"Sample median", p95:"p95 · inverse ECDF", p99:"p99 · inverse ECDF"};
    Object.keys(names).forEach(key => {
      const tr = document.createElement("tr");
      [names[key], number(data.before[key]), number(data.after[key]),
        `${data.thresholds[key]} из ${data.n}`, data.m >= data.thresholds[key] ? "Растёт при M → ∞" : "Ограничено при M → ∞"]
        .forEach(text => {const td = document.createElement("td"); td.textContent = text; tr.appendChild(td);});
      body.appendChild(tr);
    });
    lab.querySelector("#replacement-status").textContent =
      `Заменены ${data.m} из ${data.n} значений (${format.format(100 * data.m / data.n)}%). ` +
      "Здесь заменяются наименьшие исходные значения: это одна явная атака вверх. Гарантия для любых допустимых замен доказывается в тексте урока.";
    draw(data.n, data.m);
  }
  nInput.addEventListener("change", () => {
    mInput.max = nInput.value;
    if (Number(mInput.value) > Number(nInput.value)) mInput.value = nInput.value;
    update();
  });
  mInput.addEventListener("input", update);
  exponentInput.addEventListener("input", update);
  for (const button of lab.querySelectorAll("[data-replacement-preset]")) {
    button.addEventListener("click", () => {
      const n = Number(nInput.value), limits = thresholds(n);
      const preset = button.dataset.replacementPreset;
      mInput.value = preset === "one" ? 1 : preset === "median-safe" ? limits.median - 1 : limits[preset];
      update();
    });
  }
  update();
}(typeof globalThis !== "undefined" ? globalThis : this));
