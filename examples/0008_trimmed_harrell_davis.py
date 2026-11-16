"""Fixed-width highest-density-interval trimmed Harrell–Davis.

python3 examples/0008_trimmed_harrell_davis.py --n 9 --p .5 --profile sqrt
python3 examples/0008_trimmed_harrell_davis.py --n 9 --p .5 --profile sqrt --m 4 --maximum 1000
python3 examples/0008_trimmed_harrell_davis.py --simulate clean
python3 examples/0008_trimmed_harrell_davis.py --simulate wide
python3 examples/0008_trimmed_harrell_davis.py --bound-example
python3 examples/0008_trimmed_harrell_davis.py --export-js > assets/thd-weights.js
"""
import argparse
from fractions import Fraction
from math import isfinite, isqrt, log, sqrt
import json
import sys
sys.dont_write_bytecode = True
from harrell_davis_helpers import mp, beta_interval, hd_weights, moments
from sampling_helpers import mulberry32, normal_generator, quantile_details


def _mp(value):
    return mp.mpf(value.numerator) / value.denominator if isinstance(value, Fraction) else mp.mpf(value)


def trimmed_weights(n, p, profile='sqrt'):
    if not isinstance(n, int) or not 1 <= n <= 200 or not isfinite(p) or not 0 < p < 1 or profile not in ('full', 'half', 'sqrt'):
        raise ValueError("Expected n=1..200, 0<p<1, profile full/half/sqrt")
    with mp.workdps(80):
        aq = (n + 1) * Fraction(str(p)); bq = (n + 1) - aq
        a, b = _mp(aq), _mp(bq)
        width_q = Fraction(1) if profile == 'full' else Fraction(1, 2) if profile == 'half' else Fraction(1, isqrt(n)) if isqrt(n)**2 == n else None
        width = _mp(width_q) if width_q is not None else 1 / mp.sqrt(n)
        low_q = high_q = None
        if width == 1:
            low_q, high_q = Fraction(0), Fraction(1)
            low, high = mp.mpf(0), mp.mpf(1)
        elif aq == bq:
            low, high = (1 - width) / 2, (1 + width) / 2
            if width_q is not None:
                low_q, high_q = (1 - width_q) / 2, (1 + width_q) / 2
        elif aq <= 1:
            low, high = mp.mpf(0), width
            if width_q is not None: low_q, high_q = Fraction(0), width_q
        elif bq <= 1:
            low, high = 1 - width, mp.mpf(1)
            if width_q is not None: low_q, high_q = 1 - width_q, Fraction(1)
        else:
            # f(L)=f(L+D); compare log densities (normalizing constants cancel).
            left, right = mp.mpf(0), 1 - width
            def logshape(u): return (a - 1) * mp.log(u) + (b - 1) * mp.log1p(-u)
            for _ in range(240):
                middle = (left + right) / 2
                if logshape(middle) < logshape(middle + width): left = middle
                else: right = middle
            low = (left + right) / 2; high = low + width
        if low_q is not None:
            low, high = _mp(low_q), _mp(high_q)
        mass = beta_interval(a, b, low, high)
        if not mass > 0: raise ArithmeticError("Empty truncation probability")
        weights=[]
        for i in range(1, n + 1):
            if low_q is not None:
                cq, dq = max(Fraction(i-1,n), low_q), min(Fraction(i,n), high_q)
                c, d = _mp(cq), _mp(dq)
                positive = cq < dq  # exact zero decisions at rational rank boundaries
            else:
                c, d = max(mp.mpf(i-1)/n, low), min(mp.mpf(i)/n, high)
                positive = c < d
            weight = beta_interval(a,b,c,d)/mass if positive else mp.mpf(0)
            if positive and weight <= 0: raise ArithmeticError("Positive interval lost numerically")
            weights.append(+weight)
        if abs(mp.fsum(weights)-1)>mp.mpf('1e-60'):raise ArithmeticError("Weights failed normalization")
        if any(w > 0 and float(w) == 0 for w in weights):
            raise ArithmeticError("A positive weight underflows binary64; this example cannot export it as a float")
        first=next(i for i,w in enumerate(weights,1) if w>0)
        last=max(i for i,w in enumerate(weights,1) if w>0)
        return dict(n=n,p=p,profile=profile,width=float(width),low=float(low),high=float(high),
                    upperMargin=float(1-high),mass=float(mass),first=first,last=last,
                    lowerBreak=first,upperBreak=n-last+1,breakdown=min(first,n-last+1)/n,
                    weights=[float(w) for w in weights])


def replacement(n=9,p=.5,profile='sqrt',m=1,maximum=1000):
    detail=trimmed_weights(n,p,profile)
    if not isinstance(m,int) or not 0<=m<=n or not isfinite(maximum) or maximum<n:raise ValueError("Expected 0<=m<=n and maximum>=n")
    clean=list(range(1,n+1));after=clean[:n-m]+[maximum]*m
    full=[float(w) for w in hd_weights(n,p)]
    detail.update(m=m,maximum=maximum,clean=clean,after=after,
                  hd=sum(w*x for w,x in zip(full,after)),thd=sum(w*x for w,x in zip(detail['weights'],after)),
                  type7=quantile_details(after,p,7)['value'])
    return detail


def simulate(scenario='clean',profile='sqrt',seed=43,repetitions=2000):
    if scenario not in ('clean','wide') or not isinstance(seed,int) or not 0<=seed<=4294967295 or not 1<=repetitions<=10000:raise ValueError("Invalid simulation settings")
    full=[float(w) for w in hd_weights(5,.5)];trim=trimmed_weights(5,.5,profile)['weights']
    rng=mulberry32(seed);normal=normal_generator(rng);values={key:[] for key in ('type7','hd','thd')}
    for _ in range(repetitions):
        sample=[]
        for _ in range(5):
            rare=next(rng)<.02;z=next(normal);sample.append(z*(100 if scenario=='wide' and rare else 1))
        sample.sort();values['type7'].append(sample[2])
        values['hd'].append(sum(w*x for w,x in zip(full,sample)))
        values['thd'].append(sum(w*x for w,x in zip(trim,sample)))
    return dict(scenario=scenario,profile=profile,n=5,p=.5,target=0,seed=seed,repetitions=repetitions,
                **{key:moments(estimates,0) for key,estimates in values.items()})


def bound_example():
    # n=10000, p=.5, D=.01: exact support indices from [0.495,0.505].
    n=10000;p=.5;first=4951;last=5050;alpha=.05
    rho=max(abs(first/n-p),abs((last-1)/n-p));eta=sqrt(log(2/alpha)/(2*n))
    return dict(n=n,p=p,first=first,last=last,alpha=alpha,rho=rho,eta=eta,
                probabilityScaleRadius=rho+eta,
                explanation='Error <= (rho+eta)/c with probability >=1-alpha, if the local density lower bound c holds on the entire required interval.')


def export_js():
    table={str(n):{str(p):{profile:trimmed_weights(n,p,profile) for profile in ('full','half','sqrt')} for p in (.1,.5,.9)} for n in (5,9,19)}
    return ('/* Generated by examples/0008_trimmed_harrell_davis.py --export-js; 80 digits. */\n'
            '(function(root){"use strict";const table='+json.dumps(table,separators=(',',':'))+';'
            'Object.values(table).forEach(row=>{Object.values(row).forEach(cases=>{Object.values(cases).forEach(data=>{Object.freeze(data.weights);Object.freeze(data);});Object.freeze(cases);});Object.freeze(row);});'
            'root.CourseTHDWeights=Object.freeze(table);if(typeof module!=="undefined"&&module.exports)module.exports=root.CourseTHDWeights;'
            '}(typeof globalThis!=="undefined"?globalThis:this));\n')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--n',type=int,default=9);parser.add_argument('--p',type=float,default=.5)
    parser.add_argument('--profile',choices=('full','half','sqrt'),default='sqrt')
    parser.add_argument('--m',type=int,default=1);parser.add_argument('--maximum',type=float,default=1000)
    parser.add_argument('--simulate',choices=('clean','wide'));parser.add_argument('--seed',type=int,default=43)
    parser.add_argument('--export-js',action='store_true');parser.add_argument('--bound-example',action='store_true')
    args=parser.parse_args()
    try:
        if args.export_js:print(export_js(),end='')
        else:
            result=bound_example() if args.bound_example else simulate(args.simulate,args.profile,args.seed) if args.simulate else replacement(args.n,args.p,args.profile,args.m,args.maximum)
            print(json.dumps(result,indent=2))
    except (ValueError,ArithmeticError) as error:parser.error(str(error))
