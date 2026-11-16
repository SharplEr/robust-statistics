# Программа: Robust & nonparametric statistics

Каждая строка — отдельный HTML-урок на 20–30 минут. Это маршрут, а не утверждение о пройденном материале. Готовы уроки 0001–0009; следующие выбираются по ответам пользователя. Основной рабочий кейс: quantile curves и time-limit hits распределённой БД; для ясности статистических концептов используются и другие предметные области.

## Основание: вопрос, распределение, устойчивость

1. **Estimand before estimator** — выбрать характеристику под инженерное решение; развести реальный tail и measurement contamination. Готов: `lessons/0001-estimand-before-estimator.html`.
2. **ECDF, quantile curves и состав success** — восстановить quantile по ECDF; определить shift function; показать, как улучшение системы повышает p99(success). Готов: `lessons/0002-quantiles-and-populations.html`.
3. **Sampling variability (выборочная изменчивость) p95/p99** — sampling distribution, точная binomial-связь с order statistics, maximum и зависимость от n; 200 пар запусков при нулевом и известном эффекте. Local density и asymptotic SE — дополнительный блок; dependence явно ограничивает вывод. Готов: `lessons/0003-sampling-variability.html`. p>0.99 не приоритет.
4. **Contamination (загрязнение) и breakdown point (точка разрушения)** — replacement model, минимальная разрушающая доля, доказательство обеих границ для нечётной median и одной замены для mean; порог роста вверх inverse-ECDF p99. Ограниченность не означает точность, реальный tail не удаляется как contamination автоматически. Готов: `lessons/0004-contamination-and-breakdown.html`.
5. **Influence function и efficiency** — bias (смещение), variance (дисперсия), MSE (среднеквадратичная ошибка), вывод IF mean/quantile и normal ARE median. Калибровка датчика: Monte Carlo на одинаковых samples при чистом, симметрично и асимметрично загрязнённом шуме; общий clean location target. Готов: `lessons/0005-influence-and-efficiency.html`.

## Quantiles и scale: центральная линия работ Akinshin

6. **Quantile estimators** — Hyndman–Fan types 1/7/8, вывод type 7 из plotting positions и type 8 через Uniform/Beta medians, условия и доказательство состоятельности, границы интерполяции и контрпример с плоской CDF. Одна выборка, разные алгоритмы; ECDF в интерполированной оценке, gap sensitivity, воспроизводимость и NumPy/R mapping. Готов: `lessons/0006-quantile-estimators.html`.
7. **Harrell–Davis** — Beta kernel как вспомогательная позиция, вывод весов интегрированием inverse ECDF, точные положительные веса и breakdown 1/n; расчёт Beta(3,3), замена максимума и парная Monte Carlo при одном target. Дополнение: consistency при ограниченном носителе. Готов: `lessons/0007-harrell-davis.html`.
8. **Trimmed Harrell–Davis** — fixed-width HDI, частичные граничные ячейки, точный finite replacement breakdown; доказательство consistency через локализацию рангов без moment assumptions, конечная граница через Bernoulli counts/Hoeffding и локальную нижнюю границу density. Парная Monte Carlo: повышение breakdown не гарантирует меньшую MSE. Готов: `lessons/0008-trimmed-harrell-davis.html`.
9. **MAD и QAD** — raw radius и normal-calibrated scale, вывод Kτ; разные пределы при одинаковом SD; Lipschitz bound для оценённого центра и точные достаточные условия consistency по F и H. Ties, explosion/implosion, конечные пороги; дополнительно Gaussian efficiency, SQAD/OQAD и контрпример на границе атома. Готов: `lessons/0009-mad-qad.html`.
10. **Sn, Qn и finite-sample corrections** — сравнить scale estimators при одинаковой цели; проверить малые samples.

## Сравнение групп и A/B testing

11. **Effect curves** — shift/ratio functions, выбранный tail interval и practical thresholds; отличить pointwise от simultaneous uncertainty, не выводить improvement всего хвоста из двух значений.
12. **Rank tests** — что проверяет Mann–Whitney U; почему это не общий test равенства medians и не omnibus detector всех различий.
13. **Paired design и query mix** — fixed workload/stratification, paired queries, randomization unit и pseudoreplication; pooled quantiles при изменении смеси, смена состава success/error. Probability of superiority как дополнительный estimand, не замена quantile curve.
14. **Permutation tests** — вывести reference distribution из допустимых перестановок; разобрать exchangeability и unequal variances.
15. **Confidence intervals** — exact quantile intervals через Binomial distribution, coverage и отличие от prediction interval.
16. **Bootstrap** — percentile, basic и BCa; зависимые данные, extreme quantiles и случаи некорректного resampling.
17. **Практический A/B разбор** — preregistered tail range, practical significance, multiple comparisons и peeking; совместно latency curves, error rate, time-limit-hit rate и quality/completeness. Уточнить mechanism; time-to-response отличать от time-to-complete и right censoring, не восстанавливать невидимый tail без assumptions.

## Аппроксимация и снижение размерности

18. **Loss и approximation** — mean/median/quantile как решения разных optimization tasks; out-of-sample error.
19. **Isotonic regression: PAVA** — monotonicity вместо прямой линии; weighted block means и пошаговое объединение нарушений.
20. **Почему PAVA работает** — convexity, block optimality и KKT; эксперимент, где linear regression даёт систематическую ошибку.
21. **Isotonic variants** — squared loss и outliers; отличие isotonic median/quantile regression; calibration и held-out validation.
22. **PCA через SVD** — centering/scaling, maximum variance и minimum reconstruction error; normality для этой оптимизации не требуется.
23. **PCA и outliers** — как один объект поворачивает компоненту; robust covariance/subspace methods и отдельная задача low-rank + sparse decomposition (Principal Component Pursuit).

## Зависимость, изменение во времени и современные гарантии

24. **Time structure и сбор latency** — autocorrelation, warmup, drift, multimodality и coordinated omission; raw events и гистограммы, корректная агрегация по машинам. Почему нельзя просто усреднять p99 машин или удалять Java pauses как «выбросы».
25. **Weighted quantiles** — exponential smoothing, effective sample size и меняющийся estimand; ограничения формул при dependence.
26. **Robust mean estimation** — median-of-means, finite variance, high-probability bound через Chebyshev и majority amplification; обзор Catoni-type estimators.
27. **Итоговая задача** — отчёт по performance или A/B sample: estimand, design, estimator, uncertainty, sensitivity analysis; краткий разбор approximation task.

## Как проверять продвижение

В конце урока — короткий quiz с объяснениями и свободный перенос на задачу. Пользователь присылает своё объяснение в чат; только подтверждённые знания попадают в learning-records/. Пропущенные prerequisites восстанавливаются точечно. Источники и открытые вопросы хранятся в RESOURCES.md.

Рабочая постановка и ещё не выясненные детали: `reference/distributed-query-tail.html`.
