"""Sn/Qn with explicit ranks and finite normal corrections; standard library only.

python3 examples/0010_sn_qn.py --values 0 1 2 10
python3 examples/0010_sn_qn.py --values 0 0 0 0 10 10 10 10 20
python3 examples/0010_sn_qn.py --simulate --n 5
python3 examples/0010_sn_qn.py --simulate --n 6 --scenario wide
python3 examples/0010_sn_qn.py --constants
"""
import argparse
import json
from math import isfinite, pi, sqrt
from statistics import NormalDist, mean, median, pvariance, stdev
from sampling_helpers import mulberry32, normal_generator, quantile_details

CS=1.19259855312321
CQ=1/(sqrt(2)*NormalDist().inv_cdf(.625))
# Akinshin (2022), Table 3. n=2 is replaced with its exact analytic formula.
CORRECTIONS={
 2:dict(s=sqrt(pi)/(2*CS),q=sqrt(pi)/(2*CQ)),
 3:dict(s=1.8493,q=.9937),4:dict(s=.9550,q=.5132),5:dict(s=1.3487,q=.8440),
 6:dict(s=.9940,q=.6122),7:dict(s=1.1985,q=.8588),8:dict(s=1.0050,q=.6699),
 9:dict(s=1.1317,q=.8734),10:dict(s=1.0070,q=.7201),11:dict(s=1.0960,q=.8891),
 12:dict(s=1.0063,q=.7575),13:dict(s=1.0742,q=.9023),14:dict(s=1.0052,q=.7855),
 15:dict(s=1.0600,q=.9125),16:dict(s=1.0039,q=.8078),17:dict(s=1.0502,q=.9210),
 18:dict(s=1.0028,q=.8260),19:dict(s=1.0429,q=.9279),20:dict(s=1.0021,q=.8411)
}


def measure(values,details=True):
    if not 2<=len(values)<=200 or not all(isfinite(x) for x in values):
        raise ValueError("Expected 2..200 finite observations")
    n=len(values);h=n//2+1;l=(n+1)//2;N=n*(n-1)//2;k=h*(h-1)//2
    matrix=[[abs(x-y) for y in values] for x in values]
    row_radii=[sorted(row)[h-1] for row in matrix]
    s_raw=sorted(row_radii)[l-1]
    pairs=sorted([dict(i=i+1,j=j+1,d=matrix[i][j]) for i in range(n) for j in range(i+1,n)],
                 key=lambda p:(p['d'],p['i'],p['j']))
    distances=[p['d'] for p in pairs];q_raw=distances[k-1]
    a=CORRECTIONS.get(n);center=median(values);mad=median(abs(x-center) for x in values)
    return dict(n=n,N=N,h=h,l=l,k=k,level=k/N,sRaw=s_raw,qRaw=q_raw,s=CS*s_raw,q=CQ*q_raw,
                sCorrected=a['s']*CS*s_raw if a else None,qCorrected=a['q']*CQ*q_raw if a else None,
                correction=a,madRaw=mad,mad=mad/NormalDist().inv_cdf(.75),sd=stdev(values),
                type7Quarter=quantile_details(distances,.25,7)['value'],zeros=distances.count(0),
                **(dict(matrix=matrix,rowRadii=row_radii,pairs=pairs) if details else {}))


def simulate(n=5,scenario='clean',seed=43,repetitions=2000):
    if n not in CORRECTIONS or not isinstance(n,int) or scenario not in ('clean','wide') or not isinstance(seed,int) or not 0<=seed<=4294967295 or not 1<=repetitions<=10000:
        raise ValueError("Expected n=2..20, scenario clean/wide, valid seed and 1..10000 repetitions")
    rng=mulberry32(seed);normal=normal_generator(rng)
    estimates={key:[] for key in ('sd','s','sCorrected','q','qCorrected')}
    for _ in range(repetitions):
        sample=[]
        for _ in range(n):
            bad=next(rng)<.02;z=next(normal);sample.append(z*(20 if scenario=='wide' and bad else 1))
        result=measure(sample,False)
        for key in estimates:estimates[key].append(result[key])
    summary={key:dict(mean=mean(x),bias=mean(x)-1,variance=pvariance(x),mse=mean((v-1)**2 for v in x))
             for key,x in estimates.items()}
    return dict(n=n,scenario=scenario,seed=seed,repetitions=repetitions,target=1,correction=CORRECTIONS[n],**summary)


def constants():
    normal=NormalDist();a=normal.inv_cdf(.75)
    low,high=0.,2.
    for _ in range(70):
        mid=(low+high)/2
        if normal.cdf(a+mid)-normal.cdf(a-mid)<.5:low=mid
        else:high=mid
    return dict(CS=CS,CQ=CQ,sn_constant_from_equation=1/((low+high)/2),
                corrected_n2_raw_multiplier=sqrt(pi)/2)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--values',nargs='+',type=float,default=[0,1,2,10])
    parser.add_argument('--simulate',action='store_true')
    parser.add_argument('--n',type=int,default=5)
    parser.add_argument('--scenario',choices=('clean','wide'),default='clean')
    parser.add_argument('--seed',type=int,default=43)
    parser.add_argument('--repetitions',type=int,default=2000)
    parser.add_argument('--constants',action='store_true')
    args=parser.parse_args()
    try:
        result=constants() if args.constants else simulate(args.n,args.scenario,args.seed,args.repetitions) if args.simulate else measure(args.values)
        print(json.dumps(result,indent=2,allow_nan=False))
    except (ValueError,OverflowError) as error:parser.error(str(error))
