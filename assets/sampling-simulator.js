/* Sampling distributions under a known Pareto model; no Gaussian assumptions. */
(function (root) {
  "use strict";
  const stats = root.CourseStats || (typeof require !== "undefined" ? require("./statistics.js") : null);
  const levels = [0.5, 0.95, 0.99];
  const minimum = 15;
  const shape = 1.5;
  function populationQuantile(p, scale = 1) {
    if (!Number.isFinite(p) || p < 0 || p >= 1 || !Number.isFinite(scale) || scale <= 0) {
      throw new RangeError("Expected 0 <= p < 1 and scale > 0");
    }
    return scale * minimum / Math.pow(1 - p, 1 / shape);
  }
  function oneRun(n, rng, scale) {
    const sample = Array.from({ length: n }, () => populationQuantile(rng(), scale));
    sample.sort((a, b) => a - b);
    return {
      p50: sample[Math.ceil(0.5 * n) - 1],
      p95: sample[Math.ceil(0.95 * n) - 1],
      p99: sample[Math.ceil(0.99 * n) - 1],
      max: sample[n - 1]
    };
  }
  function simulate(n = 200, seed = 43, improvement = 0, repeats = 200) {
    if (!Number.isInteger(n) || n < 2 || n > 100000 || !Number.isInteger(repeats) || repeats < 2 || repeats > 2000 ||
        !Number.isFinite(improvement) || improvement < 0 || improvement > 30 || !Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
      throw new RangeError("Invalid n, seed, improvement or repeats");
    }
    const rng = stats.mulberry32(seed);
    const scale = 1 - improvement / 100;
    const before = [], after = [];
    for (let i = 0; i < repeats; i++) {
      before.push(oneRun(n, rng, 1));
      after.push(oneRun(n, rng, scale));
    }
    return { n, seed, improvement, repeats, before, after,
      trueBefore: levels.map(p => populationQuantile(p)),
      trueAfter: levels.map(p => populationQuantile(p, scale)),
      positiveDifferences: before.reduce((sum, run, i) => sum + Number(after[i].p99 > run.p99), 0)
    };
  }
  root.CourseSampling = Object.freeze({ simulate, populationQuantile });
  if (typeof module !== "undefined" && module.exports) module.exports = root.CourseSampling;
  if (typeof document === "undefined") return;
  const lab = document.querySelector("[data-sampling-lab]");
  if (!lab) return;
  const nInput = lab.querySelector("#sampling-n");
  const seedInput = lab.querySelector("#sampling-seed");
  const improvementInput = lab.querySelector("#sampling-improvement");
  const runButton = lab.querySelector("[data-run-sampling]");
  const format = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
  const number = value => format.format(value);
  function renderTable(data) {
    const body = lab.querySelector("[data-sampling-summary]");
    body.replaceChildren();
    ["p50", "p95", "p99", "max"].forEach((name, i) => {
      const a = data.before.map(run => run[name]), b = data.after.map(run => run[name]);
      const interval = values => `${number(stats.empiricalQuantile(values, .05))} … ${number(stats.empiricalQuantile(values, .95))}`;
      const columns = [name, i < 3 ? number(data.trueBefore[i]) : "Зависит от n",
        interval(a), i < 3 ? number(data.trueAfter[i]) : "Зависит от n", interval(b)];
      const tr = document.createElement("tr");
      columns.forEach(text => { const td = document.createElement("td"); td.textContent = text; tr.appendChild(td); });
      body.appendChild(tr);
    });
  }
  function draw(data) {
    const a = data.before.map(run => run.p99), b = data.after.map(run => run.p99);
    const all = a.concat(b, [data.trueBefore[2], data.trueAfter[2]]);
    const low = Math.log10(Math.min(...all) / 1.05), high = Math.log10(Math.max(...all) * 1.05);
    const bins = 18;
    const bucket = values => {
      const counts = Array(bins).fill(0);
      values.forEach(value => { counts[Math.min(bins - 1, Math.max(0, Math.floor((Math.log10(value) - low) / (high - low) * bins)))]++; });
      return counts;
    };
    const countsA = bucket(a), countsB = bucket(b);
    const maximum = Math.max(...countsA, ...countsB, 1);
    const left = 68, width = 640, bottom = 250, height = 195;
    const x = value => left + (Math.log10(value) - low) / (high - low) * width;
    const layer = lab.querySelector("[data-chart-layer]");
    layer.replaceChildren();
    function add(tag, attrs, text) {
      const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      if (text !== undefined) node.textContent = text;
      layer.appendChild(node);
    }
    for (let i = 0; i <= 4; i++) {
      const count = Math.round(maximum * i / 4), y = bottom - count / maximum * height;
      add("line", { x1: left, x2: left + width, y1: y, y2: y, class: "gridline" });
      add("text", { x: left - 10, y: y + 4, "text-anchor": "end" }, count);
      const tick = Math.pow(10, low + (high - low) * i / 4);
      add("text", { x: x(tick), y: 273, "text-anchor": "middle" }, number(tick));
    }
    const binWidth = width / bins;
    [countsA, countsB].forEach((counts, group) => counts.forEach((count, i) => {
      const barHeight = count / maximum * height;
      add("rect", { x: left + binWidth * i + group * binWidth * .48, y: bottom - barHeight,
        width: binWidth * .45, height: barHeight, class: group ? "b" : "a", opacity: .8 });
    }));
    [data.trueBefore[2], data.trueAfter[2]].forEach((truth, i) => {
      add("line", { x1: x(truth), x2: x(truth), y1: 35, y2: bottom,
        stroke: i ? "#176459" : "#45678c", "stroke-width": 2, "stroke-dasharray": i ? "3 4" : "8 5" });
    });
    add("text", { x: left, y: 20 }, "Число запусков в bin (интервале гистограммы)");
    add("text", { x: 390, y: 305, "text-anchor": "middle" }, "Sample p99, ms · логарифмическая шкала · вертикальные линии: истинные p99");
    lab.querySelector("desc").textContent = `Распределения ${data.repeats} оценок p99. Истинный p99 A: ${number(data.trueBefore[2])} ms; B: ${number(data.trueAfter[2])} ms.`;
  }
  function run() {
    if (seedInput.value === "" || !seedInput.checkValidity()) {
      seedInput.setAttribute("aria-invalid", "true");
      lab.querySelector("#sampling-status").textContent = "Введи целый seed от 0 до 4294967295. Расчёт пока не обновлён.";
      return;
    }
    seedInput.setAttribute("aria-invalid", "false");
    const n = Number(nInput.value), seed = Number(seedInput.value), improvement = Number(improvementInput.value);
    runButton.disabled = true;
    lab.setAttribute("aria-busy", "true");
    lab.querySelector("#sampling-status").textContent = "Генерируем независимые выборки…";
    setTimeout(() => {
      try {
        const data = simulate(n, seed, improvement);
        lab.querySelector("output").textContent = `${improvement}%`;
        renderTable(data);
        draw(data);
        const firstA = data.before[0].p99, firstB = data.after[0].p99;
        lab.querySelector("#first-pair").textContent = `Первая пара: sample p99 A = ${number(firstA)} ms, B = ${number(firstB)} ms; ` +
          `наблюдаемая разность ${number(firstB - firstA)} ms. Истинная разность ${number(data.trueAfter[2] - data.trueBefore[2])} ms.`;
        lab.querySelector("#sampling-status").textContent = `n = ${n} запросов на запуск; ${data.repeats} независимых пар; seed ${seed}. ` +
          `Выборочный p99 B выше A в ${data.positiveDifferences} из ${data.repeats} пар (${number(100 * data.positiveDifferences / data.repeats)}%). ` +
          "Это описательная доля в симуляции, не тест значимости.";
        lab.querySelector("#sampling-tail-count").textContent = `За истинным p95 ожидается ${number(n * .05)} наблюдений; за истинным p99 — ${number(n * .01)}.`;
      } finally {
        runButton.disabled = false;
        lab.setAttribute("aria-busy", "false");
      }
    }, 0);
  }
  runButton.addEventListener("click", run);
  for (const input of [nInput, seedInput, improvementInput]) {
    input.addEventListener("input", () => {
      lab.querySelector("output").textContent = `${improvementInput.value}%`;
      lab.querySelector("#sampling-status").textContent = "Параметры изменены. Нажми «Провести 200 пар запусков»; таблица пока показывает предыдущий расчёт.";
    });
  }
  run();
}(typeof globalThis !== "undefined" ? globalThis : this));
