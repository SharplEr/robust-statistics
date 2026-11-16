"""Reproduce Hyndman–Fan types 1, 7, 8 without third-party dependencies.

python3 examples/0006_quantile_estimators.py --p 0.9
python3 examples/0006_quantile_estimators.py --p 0.5 --values 12 14 15 18 20 23 26 80
"""
import argparse
import json
import sys
sys.dont_write_bytecode = True
from sampling_helpers import quantile_details, median_plotting_position


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--values", type=float, nargs="+", default=[12, 14, 15, 18, 20, 23, 26, 80])
    parser.add_argument("--p", type=float, default=.9)
    parser.add_argument("--positions", action="store_true", help="Compare exact beta medians with type 7/8 plotting positions; n <= 200")
    args = parser.parse_args()
    try:
        if args.positions:
            n = len(args.values)
            results = [dict(n=n, rank=k, betaMedian=median_plotting_position(n, k),
                            type7=(k - 1) / (n - 1) if n > 1 else None,
                            type8=(k - 1 / 3) / (n + 1 / 3)) for k in range(1, n + 1)]
        else:
            results = [quantile_details(args.values, args.p, method) for method in (1, 7, 8)]
    except ValueError as error:
        parser.error(str(error))
    print(json.dumps(results, ensure_ascii=False, indent=2))
