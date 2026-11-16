/* Robust scale: definitions, controlled replacements, and analytic population examples. */
(function(root){
  'use strict';
  const stats=root.CourseStats||require('./statistics.js');
  const SQAD=.6826894921370859,OQAD=.861678977787423;
  const cache=new Map();
  function normalCdf(x){
    if(!Number.isFinite(x)||Math.abs(x)>3.5)throw new RangeError('Teaching CDF domain: |x|<=3.5');
    const z=x/Math.SQRT2;
    let power=z,sum=z;
    for(let k=1;k<90;k++){
      power*=-z*z/k;
      const term=power/(2*k+1);sum+=term;
      if(Math.abs(term)<1e-18)break;
    }
    return .5+sum/Math.sqrt(Math.PI);
  }
  function normalRadius(tau){
    if(!Number.isFinite(tau)||tau<.01||tau>.99)throw new RangeError('Teaching calibration domain: .01<=tau<=.99');
    if(cache.has(tau))return cache.get(tau);
    let low=0,high=3;
    for(let i=0;i<60;i++){const middle=(low+high)/2;if(normalCdf(middle)<(1+tau)/2)low=middle;else high=middle;}
    const value=(low+high)/2;cache.set(tau,value);return value;
  }
  function measure(values,tau=.75){
    if(!Array.isArray(values)||values.length<2||!values.every(Number.isFinite))throw new RangeError('Expected at least two finite values');
    normalRadius(tau);
    const center=stats.median(values),deviations=values.map(x=>Math.abs(x-center)).sort((a,b)=>a-b);
    const details=stats.quantileDetails(deviations,tau,7),mad=stats.median(deviations);
    const mean=stats.mean(values),sd=Math.sqrt(values.reduce((sum,x)=>sum+(x-mean)**2,0)/(values.length-1));
    return {n:values.length,tau,center,sd,deviations,details,mad,madNormal:mad/normalRadius(.5),
      qad:details.value,qadNormal:details.value/normalRadius(tau),zeros:deviations.filter(x=>x===0).length};
  }
  function replacement(attack='equal',m=1,maximum=100,tau=.75){
    if(!['equal','spread','collapse'].includes(attack)||!Number.isInteger(m)||m<0||m>8||
       !Number.isFinite(maximum)||maximum<4||maximum>1e8)throw new RangeError('Invalid replacement settings');
    const before=Array.from({length:9},(_,i)=>i-4),after=before.slice();
    if(attack==='collapse'){
      [0,1,2,3,5,6,7,8].slice(0,m).forEach(i=>{after[i]=0;});
    }else for(let j=0;j<m;j++)after[9-m+j]=maximum*(attack==='spread'?j+1:1);
    return {attack,m,maximum,tau,before,after,initial:measure(before,tau),result:measure(after,tau)};
  }
  function population(model='normal',tau=.5){
    const z=normalRadius(tau);
    const raw=model==='normal'?z:model==='laplace'?-Math.log1p(-tau)/Math.SQRT2:
      model==='uniform'?Math.sqrt(3)*tau:model==='cauchy'?Math.tan(Math.PI*tau/2):NaN;
    if(!Number.isFinite(raw))throw new RangeError('Unknown model');
    return {model,tau,raw,z,constant:1/z,normalCalibrated:raw/z,sd:model==='cauchy'?null:1,
      gaussianEfficiency: z*z*Math.exp(-z*z)/(Math.PI*tau*(1-tau))};
  }
  root.CourseScale=Object.freeze({SQAD,OQAD,normalCdf,normalRadius,measure,replacement,population});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CourseScale;
}(typeof globalThis!=='undefined'?globalThis:this));
