/* Shared local LaTeX renderer. Keep mathematical bounds explicit in the source. */
(function () {
  "use strict";
  renderMathInElement(document.body, {
    delimiters: [
      {left: "\\[", right: "\\]", display: true},
      {left: "\\(", right: "\\)", display: false}
    ],
    throwOnError: false,
    trust: false
  });
}());
