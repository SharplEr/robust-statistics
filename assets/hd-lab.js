/* Rank weights, a controlled replacement, and paired Monte Carlo experiments. */
(function () {
  "use strict";
  const hd = globalThis.CourseHD;
  const format = new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 6});
  const number = value => value !== 0 && (Math.abs(value) < 1e-5 || Math.abs(value) >= 1e6) ? value.toExponential(3) : format.format(value);
  const names = {type1: "Type 1", type7: "Type 7", hd: "Harrell–Davis"};
  const lab = document.querySelector("[data-hd-lab]");
  function row(body, values) {
    const tr = document.createElement("tr");
    values.forEach(value => {const td = document.createElement("td"); td.textContent = value; tr.appendChild(td);});
    body.appendChild(tr);
  }
  if (lab) {
    const nInput = lab.querySelector("#hd-n"), pInput = lab.querySelector("#hd-p");
    const exponentInput = lab.querySelector("#hd-exponent");
    function draw(data) {
      const layer = lab.querySelector("[data-hd-chart]"); layer.replaceChildren();
      const left = 105, width = 600, top = 35, bottom = 255;
      const peak = Math.max(...Object.values(data.coefficients).flat()) * 1.07;
      const x = rank => left + (rank - .5) / data.n * width;
      const y = value => bottom - value / peak * (bottom - top);
      function add(tag, attributes, text) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
        if (text !== undefined) node.textContent = text;
        layer.appendChild(node);
      }
      for (let i = 0; i <= 4; i++) {
        const value = peak * i / 4;
        add("line", {x1:left, x2:left+width, y1:y(value), y2:y(value), class:"gridline"});
        add("text", {x:left-10, y:y(value)+4, "text-anchor":"end"}, number(value));
      }
      ["type1", "type7", "hd"].forEach((key, series) => data.coefficients[key].forEach((value, i) => {
        const barWidth = width / data.n / 4;
        add("rect", {x:x(i+1)+(series-1.5)*barWidth, y:y(value), width:barWidth-.5, height:bottom-y(value),
          fill:["#45678c", "#176459", "#aa4d2d"][series]});
      }));
      for (let i = 1; i <= data.n; i++) add("text", {x:x(i), y:278, "text-anchor":"middle"}, String(i));
      add("text", {x:left, y:20}, "Вес · сумма весов каждого метода равна 1");
      add("text", {x:405, y:310, "text-anchor":"middle"}, "Ранг наблюдения i после сортировки · от 1 до n");
      lab.querySelector("desc").textContent = `Веса по рангам для n=${data.n}, p=${data.p}. HD использует все ранги. Вес максимума: ${number(data.results.hd.weightMaximum)}. Малые столбцы могут быть не видны; точные значения есть в таблице.`;
    }
    function update() {
      const data = hd.replacement(Number(nInput.value), Number(pInput.value), Number(exponentInput.value));
      lab.querySelector("output").textContent = `M=${number(data.magnitude)}`;
      const summary = lab.querySelector("[data-hd-summary]"); summary.replaceChildren();
      for (const key of Object.keys(names)) {
        const result = data.results[key];
        row(summary, [names[key], number(result.before), number(result.after), number(result.weightMaximum)]);
      }
      const detail = lab.querySelector("[data-hd-weight-table]"); detail.replaceChildren();
      data.coefficients.hd.forEach((weight, i) => row(detail,
        [String(i+1), number(data.clean[i]), number(data.replaced[i]), number(weight), number(weight * data.replaced[i])]));
      lab.querySelector("[data-hd-status]").textContent = `n=${data.n}, p=${format.format(data.p)}. Исходная выборка: 1,…,${data.n}. ` +
        (data.exponent === 0 ? "M=n: исходные значения сохранены. " : "Изменено только максимальное значение. ") +
        "Веса зависят от n и p, поэтому рост M не меняет столбцы графика.";
      draw(data);
    }
    for (const input of [nInput, pInput, exponentInput]) input.addEventListener("input", update);
    for (const button of lab.querySelectorAll("[data-hd-magnitude]")) button.addEventListener("click", () => {
      exponentInput.value = button.dataset.hdMagnitude; update();
    });
    for (const button of lab.querySelectorAll("[data-hd-value]")) button.addEventListener("click", () => {
      exponentInput.value = Math.log10(Number(button.dataset.hdValue) / Number(nInput.value)); update();
    });
    update();
  }
  const mc = document.querySelector("[data-hd-mc]");
  if (mc) {
    const scenarioInput = mc.querySelector("#hd-mc-scenario"), seedInput = mc.querySelector("#hd-mc-seed");
    const status = mc.querySelector("[data-hd-mc-status]");
    function run() {
      if (seedInput.value === "" || !seedInput.checkValidity()) {
        seedInput.setAttribute("aria-invalid", "true"); status.textContent = "Введи целый seed от 0 до 4294967295. Таблица показывает предыдущий расчёт."; return;
      }
      seedInput.setAttribute("aria-invalid", "false");
      const data = hd.simulate(scenarioInput.value, Number(seedInput.value));
      const body = mc.querySelector("[data-hd-mc-summary]"); body.replaceChildren();
      for (const key of ["type7", "hd"]) row(body, [names[key], number(data[key].bias), number(data[key].variance), number(data[key].mse)]);
      status.textContent = `2000 серий по 5 измерений, seed=${data.seed}. В этом расчёте меньше MSE у ` +
        `${data.hd.mse < data.type7.mse ? "Harrell–Davis" : "Type 7"}. MSE(HD) / MSE(Type 7) = ${number(data.hd.mse / data.type7.mse)}. Target в обоих режимах равен 0.`;
    }
    for (const input of [scenarioInput, seedInput]) input.addEventListener("input", () => {
      status.textContent = "Параметры изменены. Нажми «Провести 2000 серий»; таблица пока показывает предыдущий расчёт.";
    });
    mc.querySelector("[data-hd-run]").addEventListener("click", run);
    run();
  }
}());
