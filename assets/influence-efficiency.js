/* Paired Monte Carlo comparison at a fixed clean location target. */
(function (root) {
  "use strict";
  const stats = root.CourseStats || require("./statistics.js");
  const scenarios = Object.freeze({
    clean: {epsilon: 0, shift: 0, scale: 1},
    symmetric: {epsilon: .02, shift: 0, scale: 20},
    asymmetric: {epsilon: .02, shift: 20, scale: 1}
  });
  function moments(estimates, theta) {
    const average = stats.mean(estimates), bias = average - theta;
    const variance = stats.mean(estimates.map(value => (value - average) ** 2));
    const mse = stats.mean(estimates.map(value => (value - theta) ** 2));
    return {bias, variance, mse};
  }
  function simulate(n = 51, scenario = "clean", seed = 43, repetitions = 1000) {
    if (![11, 51, 201].includes(n) || !Object.hasOwn(scenarios, scenario) ||
        !Number.isInteger(seed) || seed < 0 || seed > 4294967295 ||
        !Number.isInteger(repetitions) || repetitions < 1 || repetitions > 10000) {
      throw new RangeError("Invalid simulation settings");
    }
    const {epsilon, shift, scale} = scenarios[scenario], theta = 10;
    const rng = stats.mulberry32(seed), normal = stats.normalGenerator(rng);
    const estimates = {mean: [], median: []};
    for (let r = 0; r < repetitions; r++) {
      const sample = Array.from({length: n}, () => {
        const bad = rng() < epsilon, z = normal();
        return theta + (bad ? shift + scale * z : z);
      });
      estimates.mean.push(stats.mean(sample));
      estimates.median.push(stats.median(sample));
    }
    const exactBias = epsilon * shift;
    const exactVariance = ((1 - epsilon) + epsilon * scale ** 2 + epsilon * (1 - epsilon) * shift ** 2) / n;
    return {n, scenario, seed, repetitions, theta, estimates,
      mean: moments(estimates.mean, theta), median: moments(estimates.median, theta),
      exactMean: {bias: exactBias, variance: exactVariance, mse: exactVariance + exactBias ** 2}};
  }
  root.CourseEfficiency = Object.freeze({simulate, moments});
  if (typeof module !== "undefined" && module.exports) module.exports = root.CourseEfficiency;
  if (typeof document === "undefined") return;
  const lab = document.querySelector("[data-efficiency-lab]");
  if (!lab) return;
  const n = lab.querySelector("#efficiency-n"), scenario = lab.querySelector("#efficiency-scenario");
  const seed = lab.querySelector("#efficiency-seed"), status = lab.querySelector("[data-simulation-status]");
  const format = new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 4});
  function draw(data) {
    const errors = Object.fromEntries(Object.entries(data.estimates).map(([key, values]) => [key, values.map(value => value - data.theta)]));
    const combined = [...errors.mean, ...errors.median, 0];
    const minimum = Math.min(...combined), maximum = Math.max(...combined);
    const padding = Math.max(.01, (maximum - minimum) * .05), low = minimum - padding, high = maximum + padding;
    const bins = 32, counts = {};
    for (const key of ["mean", "median"]) {
      counts[key] = Array(bins).fill(0);
      errors[key].forEach(value => counts[key][Math.min(bins - 1, Math.floor((value - low) / (high - low) * bins))]++);
    }
    const peak = Math.max(...counts.mean, ...counts.median), left = 105, width = 600, top = 35, bottom = 255;
    const x = value => left + (value - low) / (high - low) * width;
    const y = count => bottom - count / peak * (bottom - top);
    const layer = lab.querySelector("[data-chart-layer]"); layer.replaceChildren();
    function add(tag, attributes, text) {
      const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
      if (text !== undefined) node.textContent = text;
      layer.appendChild(node);
    }
    for (let i = 0; i <= 4; i++) {
      const count = peak * i / 4;
      add("line", {x1: left, x2: left + width, y1: y(count), y2: y(count), class: "gridline"});
      add("text", {x: left - 10, y: y(count) + 4, "text-anchor": "end"}, Math.round(count));
    }
    for (let i = 0; i <= 4; i++) {
      const value = low + (high - low) * i / 4;
      add("text", {x: x(value), y: 278, "text-anchor": "middle"}, format.format(value));
    }
    ["mean", "median"].forEach((key, series) => counts[key].forEach((count, i) => {
      add("rect", {x: left + (i + series / 2) * width / bins, y: y(count),
        width: width / bins / 2 - .5, height: bottom - y(count), class: series ? "b" : "a"});
    }));
    add("line", {x1: x(0), x2: x(0), y1: top, y2: bottom, stroke: "#aa4d2d", "stroke-dasharray": "4 4"});
    add("text", {x: left, y: 20}, "Число оценок в интервале · по 1000 оценок каждого вида");
    add("text", {x: 405, y: 311, "text-anchor": "middle"}, "Ошибка оценки θ̂ − θ, µm · пунктир: нулевая ошибка");
    lab.querySelector("desc").textContent = `Распределения ошибок mean и median по ${data.repetitions} сериям, n=${data.n}. Сценарий ${data.scenario}. Численные характеристики — в таблице ниже.`;
  }
  function run() {
    if (seed.value === "" || !seed.checkValidity()) {
      seed.setAttribute("aria-invalid", "true");
      status.textContent = "Seed должен быть целым от 0 до 4294967295. Ниже остаётся предыдущий расчёт.";
      return;
    }
    seed.setAttribute("aria-invalid", "false");
    const data = simulate(Number(n.value), scenario.value, Number(seed.value));
    const body = lab.querySelector("[data-efficiency-summary]"); body.replaceChildren();
    for (const key of ["mean", "median"]) {
      const result = data[key], tr = document.createElement("tr");
      [key, result.bias, result.bias ** 2, result.variance, result.mse].forEach(value => {
        const td = document.createElement("td"); td.textContent = typeof value === "string" ? value : format.format(value); tr.appendChild(td);
      });
      body.appendChild(tr);
    }
    const winner = data.mean.mse < data.median.mse ? "mean" : "median";
    status.textContent = `Готово: ${data.repetitions} серий, n=${data.n}, seed=${data.seed}. В этом расчёте меньше MSE у ${winner}. MSE(mean) / MSE(median) = ${format.format(data.mean.mse / data.median.mse)}. Это результат симуляции при выбранной модели.`;
    lab.querySelector("[data-exact-mean]").textContent = `Точная теория для mean: Bias = ${format.format(data.exactMean.bias)} µm; Var = ${format.format(data.exactMean.variance)} µm²; MSE = ${format.format(data.exactMean.mse)} µm². Симуляционные значения колеблются около теоретических.`;
    draw(data);
  }
  for (const input of [n, scenario, seed]) input.addEventListener("input", () => {
    status.textContent = "Параметры изменены. Нажми «Провести 1000 серий»; график и таблица пока показывают предыдущий расчёт.";
  });
  lab.querySelector("[data-run-simulation]").addEventListener("click", run);
  run();
}(typeof globalThis !== "undefined" ? globalThis : this));
