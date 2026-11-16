/* A fixed request population with an outcome-dependent success subset. */
(function (root) {
  "use strict";
  const levels = [0.5, 0.75, 0.9, 0.95, 0.99];
  function selectionCase(recovered) {
    if (!Number.isInteger(recovered) || recovered < 0 || recovered > 50) {
      throw new RangeError("recovered must be an integer in [0, 50]");
    }
    const fast = Array(900).fill(30);
    const medium = Array(50).fill(200);
    const baselineSuccess = fast.concat(medium);
    const afterSuccess = baselineSuccess.concat(Array(recovered).fill(900));
    return {
      baselineSuccess,
      afterSuccess,
      baselineAll: baselineSuccess.concat(Array(50).fill(1000)),
      afterAll: afterSuccess.concat(Array(50 - recovered).fill(1000)),
      beforeErrorRate: 0.05,
      afterErrorRate: (50 - recovered) / 1000
    };
  }
  root.CourseSelection = Object.freeze({ selectionCase, levels });
  if (typeof module !== "undefined" && module.exports) module.exports = root.CourseSelection;
  if (typeof document === "undefined") return;
  const lab = document.querySelector("[data-selection-lab]");
  if (!lab) return;
  const stats = root.CourseStats;
  const input = lab.querySelector("#recovered");
  const format = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
  const row = lab.querySelector("tbody");
  const svgNS = "http://www.w3.org/2000/svg";
  function draw(before, after) {
    const layer = lab.querySelector("[data-chart-layer]");
    layer.replaceChildren();
    function add(tag, attrs, text) {
      const node = document.createElementNS(svgNS, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      if (text !== undefined) node.textContent = text;
      layer.appendChild(node);
    }
    const y = ms => 260 - ms / 1000 * 220;
    [0, 200, 400, 600, 800, 1000].forEach(ms => {
      add("line", {x1: 70, x2: 700, y1: y(ms), y2: y(ms), class: "gridline"});
      add("text", {x: 58, y: y(ms) + 4, "text-anchor": "end"}, String(ms));
    });
    levels.forEach((p, i) => {
      const x = 100 + 140 * i;
      add("text", {x, y: 290, "text-anchor": "middle"}, "p" + Math.round(p * 100));
      add("line", {x1: x - 8, x2: x + 8, y1: y(before[i]), y2: y(after[i]), class: "baseline"});
      add("circle", {cx: x - 8, cy: y(before[i]), r: 5, class: "a"});
      add("circle", {cx: x + 8, cy: y(after[i]), r: 5, class: "b"});
    });
    add("text", {x: 70, y: 20}, "Quantile latency, ms · только successful requests");
    lab.querySelector("desc").textContent = levels.map((p, i) =>
      `p${Math.round(p * 100)}: до ${before[i]}, после ${after[i]} ms`).join("; ");
  }
  function update() {
    const recovered = Number(input.value);
    const data = selectionCase(recovered);
    const before = levels.map(p => stats.empiricalQuantile(data.baselineSuccess, p));
    const after = levels.map(p => stats.empiricalQuantile(data.afterSuccess, p));
    lab.querySelector("output").textContent = recovered + " из 50";
    row.replaceChildren();
    levels.forEach((p, i) => {
      const tr = document.createElement("tr");
      const cells = ["p" + Math.round(p * 100), before[i], after[i],
        after[i] - before[i], stats.empiricalQuantile(data.afterAll, p)];
      cells.forEach(value => {const cell = document.createElement("td"); cell.textContent = String(value); tr.appendChild(cell);});
      row.appendChild(tr);
    });
    const errors = format.format(data.afterErrorRate * 100);
    lab.querySelector("#selection-status").textContent =
      `Success: 950 → ${950 + recovered} из 1000. Error rate: 5% → ${errors}%. ` +
      `p99(success): ${before[4]} → ${after[4]} ms. p99(all responses): 1000 → ` +
      `${stats.empiricalQuantile(data.afterAll, 0.99)} ms. Ни один request ID не стал медленнее.`;
    draw(before, after);
  }
  input.addEventListener("input", update);
  lab.querySelector("[data-reset-selection]").addEventListener("click", () => {input.value = "50"; update();});
  update();
}(typeof globalThis !== "undefined" ? globalThis : this));
