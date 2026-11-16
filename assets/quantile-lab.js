/* Compare exact sample-quantile conventions; no Monte Carlo or fitted distribution. */
(function (root) {
  "use strict";
  const stats = root.CourseStats || require("./statistics.js");
  const presets = Object.freeze({wide: [12, 14, 15, 18, 20, 23, 26, 80],
    compact: [12, 14, 15, 18, 20, 23, 26, 28], ties: [10, 10, 10, 10, 10, 10, 10, 80], singleton: [42]});
  function compare(values, p) {
    return [1, 7, 8].map(type => {
      const result = stats.quantileDetails(values, p, type);
      return {...result, ecdf: values.filter(value => value <= result.value).length / values.length};
    });
  }
  root.CourseQuantiles = Object.freeze({compare, presets});
  if (typeof module !== "undefined" && module.exports) module.exports = root.CourseQuantiles;
  if (typeof document === "undefined") return;
  const lab = document.querySelector("[data-quantile-lab]");
  if (!lab) return;
  const sampleInput = lab.querySelector("#quantile-sample"), pInput = lab.querySelector("#quantile-probability");
  const presetInput = lab.querySelector("#quantile-preset"), status = lab.querySelector("[data-quantile-status]");
  const format = new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 6});
  const number = x => Math.abs(x) >= 100000 ? x.toExponential(2) : format.format(x);
  function sample() {
    const tokens = sampleInput.value.trim().split(/\s+/);
    if (!sampleInput.value.trim() || tokens.length > 200 || tokens.some(token => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token))) {
      throw new RangeError("Введи от 1 до 200 чисел через пробел; десятичный разделитель — точка.");
    }
    const values = tokens.map(Number);
    if (values.some(value => !Number.isFinite(value) || Math.abs(value) > 1e9)) {
      throw new RangeError("Для графика нужны конечные числа с модулем не больше 10^9.");
    }
    return values.sort((a, b) => a - b);
  }
  function draw(values, p, results) {
    const minimum = values[0], maximum = values[values.length - 1];
    const padding = Math.max(1, (maximum - minimum) * .06), low = minimum - padding, high = maximum + padding;
    const left = 105, width = 600, top = 35, bottom = 265;
    const x = probability => left + probability * width;
    const y = value => bottom - (value - low) / (high - low) * (bottom - top);
    const layer = lab.querySelector("[data-quantile-chart]"); layer.replaceChildren();
    function add(tag, attributes, text) {
      const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
      if (text !== undefined) node.textContent = text;
      layer.appendChild(node);
    }
    for (let i = 0; i <= 4; i++) {
      const value = low + (high - low) * i / 4;
      add("line", {x1: left, x2: left + width, y1: y(value), y2: y(value), class: "gridline"});
      add("text", {x: left - 10, y: y(value) + 4, "text-anchor": "end"}, number(value));
      add("text", {x: x(i / 4), y: 290, "text-anchor": "middle"}, number(i / 4));
    }
    let step = `M${x(0)} ${y(minimum)}`;
    for (let i = 1; i < values.length; i++) step += ` H${x(i / values.length)} V${y(values[i])}`;
    step += ` H${x(1)}`;
    add("path", {d: step, fill: "none", stroke: "#45678c", "stroke-width": 3});
    [[7, "#176459"], [8, "#aa4d2d"]].forEach(([type, color]) => {
      const vertices = [[0, minimum]];
      if (values.length > 1) values.forEach((value, i) => {
        const probability = type === 7 ? i / (values.length - 1) : (i + 1 - 1 / 3) / (values.length + 1 / 3);
        vertices.push([probability, value]);
      });
      vertices.push([1, maximum]);
      add("path", {d: vertices.map(([probability, value], i) => `${i ? "L" : "M"}${x(probability)} ${y(value)}`).join(" "),
        fill: "none", stroke: color, "stroke-width": 3, "stroke-dasharray": type === 8 ? "6 4" : "none"});
    });
    add("line", {x1: x(p), x2: x(p), y1: top, y2: bottom, stroke: "#596564", "stroke-dasharray": "3 4"});
    results.forEach((result, i) => add("circle", {cx: x(p), cy: y(result.value), r: 4 + i, fill: "none", stroke: ["#45678c", "#176459", "#aa4d2d"][i], "stroke-width": 2}));
    add("text", {x: left, y: 20}, "Полученное значение quantile · условные единицы");
    add("text", {x: 405, y: 320, "text-anchor": "middle"}, "Уровень p · вертикальный пунктир — выбранный уровень");
    lab.querySelector("desc").textContent = `Одна фиксированная выборка n=${values.length}. Показаны inverse ECDF type 1 и интерполирующие type 7/8. При p=${p} оценки: ${results.map(result => `type ${result.type}: ${number(result.value)}`).join("; ")}.`;
  }
  function update() {
    let values;
    try { values = sample(); } catch (error) {
      sampleInput.setAttribute("aria-invalid", "true");
      status.textContent = error.message + " График и таблица пока показывают предыдущие данные.";
      return;
    }
    sampleInput.setAttribute("aria-invalid", "false");
    const p = Number(pInput.value) / 100, results = compare(values, p);
    lab.querySelector("output").textContent = `p=${number(p)} · ${number(p * 100)}%`;
    lab.querySelector("[data-sorted-sample]").textContent = values.map(number).join("; ");
    const body = lab.querySelector("[data-quantile-summary]"); body.replaceChildren();
    results.forEach(result => {
      const tr = document.createElement("tr");
      [`Type ${result.type}`, `${result.type === 1 ? "np" : "h"}=${number(result.h)}`,
        result.lowerRank === result.upperRank ? `${result.lowerRank}` : `${result.lowerRank} и ${result.upperRank}`,
        number(result.weightUpper), number(result.value), number(result.ecdf)]
        .forEach(text => {const td = document.createElement("td"); td.textContent = text; tr.appendChild(td);});
      body.appendChild(tr);
    });
    status.textContent = `n=${values.length}, p=${number(p)}. Данные фиксированы: между методами меняется только правило оценки. В таблице вес верхнего ранга равен нулю, если используется одно наблюдение. Числа округлены до 6 знаков.`;
    draw(values, p, results);
  }
  sampleInput.addEventListener("input", update);
  pInput.addEventListener("input", update);
  presetInput.addEventListener("change", () => { sampleInput.value = presets[presetInput.value].join(" "); update(); });
  for (const button of lab.querySelectorAll("[data-quantile-probability]")) button.addEventListener("click", () => {
    pInput.value = Number(button.dataset.quantileProbability) * 100; update();
  });
  update();
}(typeof globalThis !== "undefined" ? globalThis : this));
