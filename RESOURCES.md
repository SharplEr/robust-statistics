# Robust & nonparametric statistics: источники

Дата первичного просмотра: 2026-11-05. Конспекты и примеры оригинальные; ссылки указывают, какие положения проверять по первоисточнику. Перед соответствующим уроком читать нужный раздел целиком и проверять актуальный API. Ниже нет утверждения, что все статьи уже разобраны полностью.

## Knowledge

- [Harrell & Davis: A new distribution-free quantile estimator (1982)](https://doi.org/10.1093/biomet/69.3.635)
  Проверены библиография и abstract: Biometrika 69(3),635–640, линейная комбинация order statistics. Полный оригинальный текст через сайт издателя не загрузился; определение проверено по NIST и статье Akinshin, вывод через интеграл изложен самостоятельно.
- [NIST Dataplot: Quantile](https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/quantile.htm)
  Проверены HD weights как разности Beta CDF и параметры A=(n+1)q,B=(n+1)(1−q). Используется для определения HD в уроке 0007; не переносить общее заявление о меньшей SE как универсальное превосходство.
- [SciPy: mstats.hdquantiles](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.mstats.hdquantiles.html)
  Проверено API weighted order statistics, prob, axis, var. Для ссылки на готовую библиотечную реализацию; SciPy не требуется для HTML или нашего Python-примера.
- [mpmath: betainc](https://mpmath.org/doc/current/functions/gamma.html)
  Official API интеграла incomplete beta с двумя границами и regularized=True. Python 0007 считает массы с 80 decimal digits и отражает верхние интервалы для снижения cancellation; для браузера экспортирована конечная сетка весов. Численные веса проверяются независимым Binomial tail при целых параметрах и точным полиномом Beta(3,3).

- [Kerman: A closed-form approximation for the median of the beta distribution (2011)](https://arxiv.org/abs/1111.0433)
  Прочитан §2, формулы (1)–(2) и специальные случаи a=1/b=1: отношение (a−1/3)/(a+b−2/3) — приближение, не точная медиана; отмена ведущего асимптотического члена при d=1/3. Для расширения урока 0006; не приписывать статье 2011 года историческое происхождение метода Hyndman–Fan 1996. Сетку проверить отдельно у крайних рангов; численные границы ошибки в статье не переносить как гарантию quantile estimator.
- [NIST DLMF: Interpolation remainder, 3.3.5](https://dlmf.nist.gov/3.3.E5)
  Остаток Lagrange interpolation при непрерывной производной соответствующего порядка. В дополнительном блоке урока 0006 — частный случай двух истинных узлов, bound M·Δp²/8; это не граница полной статистической ошибки с шумными order statistics.

- [Hyndman & Fan: Sample quantiles in statistical packages (1996)](https://robjhyndman.com/publications/quantiles/)
  Страница авторов: постановка задачи разных sample quantile definitions, рекомендация type 8 и errata. PDF доступен по https://robjhyndman.com/papers/sample_quantiles.pdf, но не имеет извлекаемого текстового слоя; подробные определения урока 0006 проверены по документации R, соавтором реализации которой является Hyndman. Свойства из исправленных таблиц статьи без необходимости не переносить.
- [R: quantile, Types](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/quantile.html)
  Прочитаны определения types 1/7/8, plotting positions, m/g, граничные значения и замечание о fuzz. Основа урока 0006; формула type 7 самостоятельно выведена из линейной интерполяции. Type 8 приблизительно median-unbiased, не универсально точен или mean-unbiased.
- [NumPy: quantile](https://numpy.org/doc/stable/reference/generated/numpy.quantile.html)
  Проверено соответствие Hyndman–Fan 1/7/8 названиям inverted_cdf/linear/median_unbiased. В уроке 0006 method задаётся явно; NumPy не обязателен для запуска Python-примера.

- [Alex Reinhart: Modern Experimental Design, §6.3, Identifiability](https://www.refsmmat.com/courses/727/lecture-notes/linear-models.html#the-general-linear-model-framework)
  Проверены Definition 6.3 и пример неоднозначного разложения суммы параметров. Для термина identifiability в обратной связи к уроку 0005; собственный пример X=θ+η=(θ+c)+(η−c) доказывает неоднозначность полного распределения наблюдений при произвольном неизвестном распределении ошибки. Не переносить на модели с известным центром ошибки или с эталоном.

- [NIST DLMF, §1.17: Dirac delta](https://dlmf.nist.gov/1.17)
  Проверены определение через действие на пробную функцию и symbolic/generalized-function interpretation. В уроке 0005 δ_z — вероятностная мера Дирака, δ(x−z) — соответствующая запись обобщённой плотности; CDF точечной массы — indicator, не Dirac delta function.

- [Larry Wasserman: CMU 36-705, Lecture 19, §3](https://stat.cmu.edu/~larry/=stat705/Lecture19.pdf#page=3)
  Прочитаны стр. 3–4: IF как производная по point contamination, mean IF, связь с асимптотической variance и quantile IF. Основное чтение урока 0005 — определение, mean и quantile; прочие примеры не используются. Собственный вывод quantile IF требует положительной непрерывной density и z≠q.
- [The Book of Statistical Proofs: MSE decomposition](https://statproofbook.github.io/P/mse-bnv.html)
  Проверены определения bias/variance/MSE и разложение при конечном втором моменте; в уроке 0005 дан собственный краткий вывод через центрирование. Monte Carlo moments вычисляются с делителем R, точная mean theory отдельно.

- [SciPy: truncate](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.truncate.html)
  Официальная документация усечения continuous distribution с перенормировкой density. Для conditional upper-tail target; конкретная формула Q_tail(u)=Q(a+(1−a)u) в рабочем кейсе самостоятельно выведена из условной вероятности. Отличать от censoring и fixed semantic query classes.

- [Chen, Gao, Ren: A General Decision Theory for Huber’s ε-Contamination Model](https://arxiv.org/abs/1511.04144)
  Прочитана introduction: mixture (1−ε)Pθ+εQ и target чистого распределения. Для distinction contamination/observed mixture в уроке 0004; результаты robust testing/minimax bounds не переносить без изучения условий.
- [Ramsay, Durocher, Leblanc: Robustness and asymptotics of the projection median](https://www.sciencedirect.com/science/article/pii/S0047259X20302591)
  Проверены §1.2 и определение минимальной разрушающей доли в доступном индексируемом тексте первоисточника; прямое открытие полного текста вернуло 403. Использовать для convention finite-sample replacement breakdown; многомерные результаты не нужны для самостоятельно изложенного одномерного proof урока 0004.

- [Oracle: Garbage-First (G1) Garbage Collector, JDK 25](https://docs.oracle.com/en/java/javase/25/gctuning/garbage-first-g1-garbage-collector1.html)
  Официальное определение pause-time goal: MaxGCPauseMillis задаёт цель, не жёсткий upper bound каждой паузы. Для проверки механистической гипотезы; не предполагать, что пользователь использует именно G1.
- [Barrett et al.: Virtual Machine Warmup Blows Hot and Cold (2017)](https://arxiv.org/abs/1602.00602)
  Первичное исследование JIT warmup и steady state на VM microbenchmarks. Прочитан abstract; использовать как основание проверять steady state, не переносить численные доли из статьи на distributed DB пользователя.
- [scikit-learn: Cross-validation and held-out evaluation](https://scikit-learn.org/stable/modules/cross_validation.html)
  Официальное объяснение независимой проверки после выбора модели. Для принципа отделения selection от evaluation; перенос на отбор ускорившихся queries является аналогией, а не прямым результатом статьи о benchmark latency.

- [Charles J. Geyer: Stat 5101 Lecture Notes, §7.4](https://www.stat.umn.edu/geyer/old/5102/n.pdf#page=213)
  Первичный университетский источник для sampling distributions порядковых статистик и quantiles; прочитаны печатные стр. 205–206, Theorem 7.27. Основа урока 0003: exact order-statistic relation и optional asymptotic SE при i.i.d., fixed p и положительной локальной density. Normal limit estimator не означает normality данных. В расширении урока 0006 также используются Uniform order statistics/Beta и сходимость соседних рангов; более слабое условие пересечения и LLN proof изложены непосредственно. Для урока 0005 также использован normal median example: V=πσ²/2, ARE median относительно mean=2/π; это сравнение при одном location target в normal model.
- [SciPy: quantile_test](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.quantile_test.html)
  Официальная документация binomial-based quantile inference и confidence intervals. Для связи quantile/order statistic/binomial count; в уроке 0003 не используется как готовая процедура production comparison.
- [SciPy: Pareto distribution](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pareto.html)
  Проверены параметризация и density для учебного DGP урока 0003: shape 1.5, scale 15, loc 0. Population quantile выведен из CDF; это заданная симуляция, не fit к сервису пользователя.

- [Akinshin: Distribution comparison via the shift and ratio functions](https://aakinshin.net/posts/shift-and-ratio-functions/)
  Авторское изложение quantile-wise difference и ratio, непосредственно соответствующее задаче пользователя. Для definitions и visual comparison; рекомендации про tail intervals и bootstrap не переносить механически на p95/p99 с dependence.
- [Akinshin: Shift function vs. shift distribution](https://aakinshin.net/posts/shift-function-vs-distribution/)
  Для различия Q_after(p) − Q_before(p) и распределения request-level differences. Использовать определения; собственные численные примеры проверять независимо.
- [SciPy: ecdf](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ecdf.html)
  Официальное определение ECDF, step function и handling right-censored observations. Для урока 0002 и будущего различения response latency/completion time.
- [NIST: Censoring](https://www.itl.nist.gov/div898/handbook/apr/section1/apr131.htm)
  Определение fixed-time right censoring. Применять к hypothetical time-to-complete только при подходящем механизме; не называть все observed response latencies censored.
- [HdrHistogram: авторская документация](https://github.com/HdrHistogram/HdrHistogram)
  Для resolution, объединения histograms и coordinated omission; параметры correction зависят от схемы генерации нагрузки. Не считать это универсальной процедурой исправления любых latency measurements.

- [NIST/SEMATECH Engineering Statistics Handbook: Measures of Location](https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm)
  Официальный инженерный справочник: определения mean/median и различия на асимметричных распределениях. Для короткого refresh; не основание удалять реальные tail events.
- [Andrey Akinshin: CV и selected publications](https://aakinshin.net/cv/)
  Навигация по исходным публикациям автора, которого назвал пользователь; методологические утверждения цитировать по конкретным работам.
- [Akinshin: Pragmastat](https://pragmastat.dev/)
  Авторское руководство и implementations. Проверена главная страница; web-раздел introduction не загрузился в исследовательском инструменте. Не считать непрочитанные разделы проверенными и не заменять canonical names авторскими aliases без пояснения.
- [Akinshin: Trimmed Harrell–Davis quantile estimator (2022)](https://arxiv.org/abs/2111.11776)
  Опубликованная работа; особенно introduction и определение estimator. Для positive tail weights у HD и trade-off при trimming. Изученные simulations не дают гарантии превосходства для всех distributions. Для урока 0007 прочитаны стр. 1–2 PDF v4: формула HD, интерпретация площадей и positive-weight breakdown; trimming пока только мотивируется. Для урока 0008 дополнительно прочитаны стр. 3–6 PDF v4: fixed-width HDI, truncated Beta CDF, частичные граничные ячейки и D=1/√n как heuristic. Состоятельность через зажатие рангов и количественная граница выведены в уроке самостоятельно; не приписывать эти доказательства статье.
- [Akinshin: Quantile absolute deviation (2022)](https://arxiv.org/abs/2208.13459)
  Исследовательское предложение QAD и сравнение с MAD. Для scale functional, tuning и robustness/efficiency; отдельно различать calibration under normality и произвольное распределение. Для урока 0009 прочитаны §1–3.5 PDF v1: raw QAD, atoms/ties, Kτ, Gaussian efficiency, SQAD/OQAD; §4 использован для мотива согласования robust центра. Не переносить lim E из статьи из одной consistency по вероятности: в уроке population target задаётся напрямую, состоятельность доказывается отдельно через Lipschitz bound для центра. Конечные примеры и контрпример H с атомом 1/2 выведены самостоятельно.
- [Akinshin: Finite-sample Rousseeuw–Croux scale estimators (2022)](https://arxiv.org/abs/2209.12268)
  Monte Carlo corrections и finite-sample efficiency для Sn/Qn. Использовать для малых samples; численные поправки не выдавать за exact theorem.
- [Akinshin: Weighted quantile estimators (2023)](https://arxiv.org/abs/2304.07265)
  Weighted extensions и quantile exponential smoothing. Для moving distributions, определения target и effective sample size.
- [SciPy: mannwhitneyu](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.mannwhitneyu.html)
  Официальная спецификация test, alternatives, ties и exact/asymptotic computation. Для проверки вызовов Python и ограничений location interpretation.
- [SciPy: permutation_test](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html)
  Официальная документация permissible permutations для independent/paired designs. Для соответствия null hypothesis и resampling scheme.
- [SciPy: bootstrap](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html)
  API percentile/basic/BCa и paired resampling. Это описание implementation; validity для конкретного estimand нужно обосновывать отдельно.
- [de Leeuw, Hornik, Mair: Isotone Optimization in R (2009)](https://www.jstatsoft.org/article/view/v032i05)
  Первичная статья о generalized PAVA и active set methods; для различий между loss functions и алгоритмами.
- [Charles J. Geyer: Isotonic Regression, lecture notes (2025)](https://www.stat.umn.edu/geyer/8054/notes/isotonic.pdf)
  Авторские университетские notes: KKT, blocks и proof of PAVA. Проверен план и начало; для урока 20 прочитать доказательство. Если адаптировать текст/рисунки, учитывать CC BY-SA; собственное изложение и вычисления писать самостоятельно.
- [SciPy: isotonic_regression](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.isotonic_regression.html)
  Официальная постановка weighted least squares под monotonicity constraints. Для Python API; отсутствие linearity assumption не означает resistance to outliers.
- [scikit-learn: PCA](https://scikit-learn.org/stable/modules/decomposition.html#pca)
  Официальные определения SVD, centering и scaling; отделять deterministic PCA optimization от probabilistic interpretation.
- [Candès, Li, Ma, Wright: Robust Principal Component Analysis?](https://arxiv.org/abs/0912.3599)
  Первичная работа о Principal Component Pursuit: low-rank + sparse decomposition при дополнительных assumptions. Не универсальная замена PCA при произвольном row contamination.
- [Minsker: Uniform bounds for robust mean estimators](https://arxiv.org/abs/1812.03523)
  Первичная теоретическая работа, связывающая median-of-means и Catoni-type constructions. Для современных non-asymptotic guarantees; перед уроком уточнить условия конкретной теоремы.

- [Hoeffding: Probability Inequalities for Sums of Bounded Random Variables (1963)](https://doi.org/10.1080/01621459.1963.10500830)
  Первичная статья; [доступный PDF](https://www.cs.rpi.edu/academics/courses/spring06/random/hoefding.pdf), Theorem 1. Для урока 0008 просмотрены формулировка и специализация на независимых Bernoulli indicators. Короткий вывод через ограничение второй производной log-MGF изложен непосредственно. Не требует конечных моментов исходных X, поскольку применяется к indicators X≤t. Граница ошибки THD получена дополнительным ранговым доводом, не взята готовой из этой статьи.

- [SciPy: median_abs_deviation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.median_abs_deviation.html)
  Официальная документация, просмотрена для урока 0009: raw MAD, scale="normal" делит на Φ⁻¹(0.75), выбор center не меняет внешнюю median на mean. Это API-уточнения, не доказательство consistency или универсальной оценки SD. Вычислительный пример курса использует stdlib и заданный type 7 без зависимости от SciPy.

## Wisdom (Communities)

Предпочтение пользователя по сообществам не выяснялось. Вступление в сообщество не является prerequisite курса. При появлении конкретного вопроса из практики подобрать профильное обсуждение с проверяемой аргументацией; ничего не публиковать от имени пользователя без его инструкции.

## Gaps

- Перед inference lessons добавить первичные источники о coverage failure bootstrap для nonsmooth/extreme targets и validity при dependence.
- Перед A/B lessons добавить источники по sequential testing, multiple comparisons и cluster randomization, соответствующие выбранному design.
- Перед PCA lesson добавить первичную работу о robust subspace estimation при rowwise contamination, отличив её от entrywise sparse corruption в Principal Component Pursuit.
- Перед tail estimation lesson выбрать источник по finite-sample uncertainty p99; не переносить результаты для median на extreme quantiles без условий.
