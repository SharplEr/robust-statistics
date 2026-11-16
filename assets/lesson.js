/* Reusable quiz feedback, optional draft storage and completion marker. */
(function () {
  "use strict";
  const namespace = "robust-course:" + document.body.dataset.lesson;
  function get(key) {
    try { return localStorage.getItem(namespace + ":" + key); } catch (_) { return null; }
  }
  function set(key, value) {
    try { localStorage.setItem(namespace + ":" + key, value); return true; } catch (_) { return false; }
  }
  const quizzes = [...document.querySelectorAll(".quiz")];
  for (const quiz of quizzes) {
    quiz.addEventListener("submit", function (event) {
      event.preventDefault();
      const selected = quiz.querySelector("input:checked");
      const feedback = quiz.querySelector(".quiz-feedback");
      feedback.hidden = false;
      if (!selected) {
        feedback.classList.add("incorrect");
        feedback.textContent = "Сначала выбери ответ. Можно ошибаться: здесь важнее разобрать причину.";
        return;
      }
      const correct = selected.value === quiz.dataset.answer;
      quiz.dataset.correct = String(correct);
      feedback.classList.toggle("incorrect", !correct);
      feedback.textContent = (correct ? "Верно. " : "Пока нет. ") +
        (quiz.dataset["explain" + selected.value] || quiz.dataset.explanation);
      updateProgress();
    });
    quiz.addEventListener("change", function () {
      delete quiz.dataset.correct;
      quiz.querySelector(".quiz-feedback").hidden = true;
      updateProgress();
    });
  }
  function updateProgress() {
    const count = quizzes.filter(quiz => quiz.dataset.correct === "true").length;
    const target = document.querySelector("[data-quiz-progress]");
    if (target) target.textContent = `Разобрано верно: ${count} из ${quizzes.length}.`;
  }
  updateProgress();
  for (const field of document.querySelectorAll("[data-draft]")) {
    field.value = get(field.dataset.draft) || "";
    field.addEventListener("input", () => {
      const stored = set(field.dataset.draft, field.value);
      const status = document.querySelector("[data-draft-status]");
      if (status) status.textContent = stored ? "Черновик сохранён в этом браузере." :
        "Хранение недоступно. Скопируй ответ перед закрытием страницы.";
    });
  }
  const completion = document.querySelector("[data-complete]");
  const completionStatus = document.querySelector("[data-completion-status]");
  function showCompleted() {
    completion.textContent = "Отметить для повторения";
    completionStatus.textContent = "Отметка завершения сохранена локально. Для проверки понимания пришли объяснение в чат.";
  }
  if (completion && completionStatus) {
    if (get("complete") === "true") showCompleted();
    completion.addEventListener("click", () => {
      if (get("complete") === "true") {
        set("complete", "false");
        completion.textContent = "Отметить урок завершённым";
        completionStatus.textContent = "Урок отмечен для повторения.";
      } else if (set("complete", "true")) showCompleted();
      else completionStatus.textContent = "Хранение недоступно. Упражнения работают; прогресс можно сообщить в чате.";
    });
  }
  for (const button of document.querySelectorAll("[data-print]")) {
    button.addEventListener("click", () => window.print());
  }
}());
