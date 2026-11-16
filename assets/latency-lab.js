/* Two-point request-latency model. Exact model values and one seeded sample. */
(function () {
  "use strict";
  const lab = document.querySelector("[data-latency-lab]");
  if (!lab) return;
  const stats = window.CourseStats;
  const frequency = lab.querySelector("#frequency");
  const slow = lab.querySelector("#slow");
  const size = lab.querySelector("#sample-size");
  const seed = lab.querySelector("#seed");
  const format = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
  const precise = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 4 });
  const number = value => format.format(value);
  const percent = value => number(value * 100) + "%";
  function text(id, value) { lab.querySelector("#" + id).textContent = value; }
  function settings() {
    return { epsilon: Number(frequency.value) / 100, slow: Number(slow.value),
      n: Number(size.value), seed: Number(seed.value) >>> 0 };
  }
  function validateSeed() {
    const valid = seed.value !== "" && seed.checkValidity();
    seed.setAttribute("aria-invalid", String(!valid));
    return valid;
  }
  function update() {
    if (!validateSeed()) {
      text("lab-status", "Введи целый seed от 0 до 4294967295; таблицы пока показывают предыдущий расчёт.");
      return;
    }
    const params = settings();
    const truth = stats.model(params.epsilon, params.slow);
    const sample = stats.drawSample(params.n, params.epsilon, params.slow, params.seed);
    const observedBreach = sample.filter(x => x > 100).length / sample.length;
    const observedSlow = sample.filter(x => x === params.slow).length;
    text("frequency-output", number(params.epsilon * 100) + "%");
    text("slow-output", number(params.slow) + " ms");
    text("size-output", number(params.n));
    text("model-mean", number(truth.mean) + " ms");
    text("model-median", number(truth.median) + " ms");
    text("model-breach", percent(truth.breach));
    text("sample-mean", number(stats.mean(sample)) + " ms");
    text("sample-median", number(stats.median(sample)) + " ms");
    text("sample-breach", percent(observedBreach));
    const threshold = (10 - 9) / (params.slow - 9);
    const winner = Math.abs(truth.mean - 10) < 1e-10 ? "равны по mean" :
      truth.mean < 10 ? "B меньше по mean" : "A меньше по mean";
    text("lab-verdict", `В точной модели ${winner}; median у B меньше. ` +
      `Граница равенства mean: ε ≈ ${precise.format(threshold * 100)}%.`);
    text("lab-status", `Sample B: ${observedSlow} редких событий из ${params.n}; seed ${params.seed}. ` +
      "Тот же seed сохраняет случайные числа при смене параметров. Это одна выборка, а не confidence interval.");
    draw(params);
  }
  function draw(params) {
    const chart = lab.querySelector("svg");
    const svgNS = "http://www.w3.org/2000/svg";
    const layer = chart.querySelector("[data-chart-layer]");
    layer.replaceChildren();
    const x = ms => 80 + Math.log10(ms) / 4 * 610;
    function add(name, attrs, content) {
      const element = document.createElementNS(svgNS, name);
      Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
      if (content !== undefined) element.textContent = content;
      layer.appendChild(element);
    }
    [1, 10, 100, 1000, 10000].forEach(tick => {
      add("line", { x1: x(tick), x2: x(tick), y1: 28, y2: 175, class: "gridline" });
      add("text", { x: x(tick), y: 202, "text-anchor": "middle" }, number(tick));
    });
    [58, 140].forEach(y => add("line", { x1: 80, x2: 690, y1: y, y2: y, class: "baseline" }));
    add("text", { x: 18, y: 63 }, "A");
    add("text", { x: 18, y: 145 }, "B");
    add("circle", { cx: x(10), cy: 58, r: 17, class: "a" });
    add("text", { x: x(10) + 28, y: 63 }, "10 ms · 100%");
    add("circle", { cx: x(9), cy: 140, r: 17 * Math.sqrt(1 - params.epsilon), class: "b" });
    add("text", { x: x(9) + 25, y: 119 }, `9 ms · ${percent(1 - params.epsilon)}`);
    if (params.epsilon > 0) {
      add("circle", { cx: x(params.slow), cy: 140, r: 17 * Math.sqrt(params.epsilon), class: "b" });
      add("text", { x: x(params.slow), y: 174, "text-anchor": "end" }, `${number(params.slow)} ms · ${percent(params.epsilon)}`);
    }
    chart.querySelector("desc").textContent = `A: всегда 10 ms. B: ${percent(1 - params.epsilon)} запросов по 9 ms` +
      (params.epsilon ? `, ${percent(params.epsilon)} по ${number(params.slow)} ms.` : ". Редких задержек нет.");
  }
  [frequency, slow, size, seed].forEach(input => input.addEventListener("input", update));
  lab.querySelector("[data-new-sample]").addEventListener("click", () => {
    const previous = Number.isFinite(Number(seed.value)) ? Number(seed.value) : 43;
    seed.value = (previous + 1) >>> 0;
    update();
  });
  lab.querySelector("[data-reset-lab]").addEventListener("click", () => {
    frequency.value = "1"; slow.value = "1000"; size.value = "1000"; seed.value = "43";
    update();
  });
  update();
}());
