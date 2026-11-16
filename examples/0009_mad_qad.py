"""MAD/QAD without third-party dependencies; all sample quantiles use type 7.

python3 examples/0009_mad_qad.py --values -4 -3 -2 -1 0 1 2 3 100 --tau .75
python3 examples/0009_mad_qad.py --attack spread --m 3 --maximum 1000
python3 examples/0009_mad_qad.py --attack collapse --m 4
python3 examples/0009_mad_qad.py --model laplace --tau .5
python3 examples/0009_mad_qad.py --model cauchy --tau .75
"""
import argparse
import json
from math import exp, isfinite, log1p, pi, sqrt, tan
from statistics import NormalDist, median, stdev
from sampling_helpers import quantile_details

SQAD = .6826894921370859
OQAD = .861678977787423


def normal_radius(tau):
    if not isfinite(tau) or not 0 < tau < 1:
        raise ValueError("Expected 0<tau<1")
    return NormalDist().inv_cdf((1+tau)/2)


def measure(values, tau=.75):
    if len(values) < 2 or not all(isfinite(x) for x in values):
        raise ValueError("Expected at least two finite values")
    z = normal_radius(tau)
    center = median(values)
    deviations = sorted(abs(x-center) for x in values)
    details = quantile_details(deviations, tau, 7)
    mad = median(deviations)
    return dict(n=len(values), tau=tau, center=center, sd=stdev(values),
                deviations=deviations, details=details, mad=mad,
                madNormal=mad/normal_radius(.5), qad=details['value'],
                qadNormal=details['value']/z, zeros=deviations.count(0))


def replacement(attack='equal', m=1, maximum=100, tau=.75):
    if attack not in ('equal','spread','collapse') or not isinstance(m,int) or not 0 <= m <= 8 or not isfinite(maximum) or not 4 <= maximum <= 1e8:
        raise ValueError("Expected attack equal/spread/collapse, m=0..8, maximum=4..1e8")
    before = list(range(-4,5)); after = before.copy()
    if attack == 'collapse':
        for index in [0,1,2,3,5,6,7,8][:m]: after[index] = 0
    else:
        for j in range(m): after[9-m+j] = maximum*(j+1 if attack=='spread' else 1)
    return dict(attack=attack,m=m,maximum=maximum,tau=tau,before=before,after=after,
                initial=measure(before,tau),result=measure(after,tau))


def population(model='normal',tau=.5):
    z = normal_radius(tau)
    if model=='normal': raw=z
    elif model=='laplace': raw=-log1p(-tau)/sqrt(2)
    elif model=='uniform': raw=sqrt(3)*tau
    elif model=='cauchy': raw=tan(pi*tau/2)
    else: raise ValueError("Unknown model")
    return dict(model=model,tau=tau,raw=raw,z=z,constant=1/z,
                normalCalibrated=raw/z,sd=None if model=='cauchy' else 1,
                gaussianEfficiency=z*z*exp(-z*z)/(pi*tau*(1-tau)))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tau',type=float,default=.75)
    parser.add_argument('--values',nargs='+',type=float)
    parser.add_argument('--attack',choices=('equal','spread','collapse'),default='equal')
    parser.add_argument('--m',type=int,default=1)
    parser.add_argument('--maximum',type=float,default=100)
    parser.add_argument('--model',choices=('normal','laplace','uniform','cauchy'))
    args=parser.parse_args()
    try:
        data=population(args.model,args.tau) if args.model else measure(args.values,args.tau) if args.values is not None else replacement(args.attack,args.m,args.maximum,args.tau)
        print(json.dumps(data,indent=2,allow_nan=False))
    except (ValueError,OverflowError) as error: parser.error(str(error))
