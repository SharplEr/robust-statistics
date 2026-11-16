/* THD experiments on the same rank grid and random samples as lesson 07. */
(function(root){
  'use strict';
  const stats=root.CourseStats||require('./statistics.js');
  const hd=root.CourseHD||require('./harrell-davis.js');
  const table=root.CourseTHDWeights||require('./thd-weights.js');
  const moments=(root.CourseEfficiency||require('./influence-efficiency.js')).moments;
  function parameters(n,p,profile='sqrt'){
    const result=table[String(n)]?.[String(p)]?.[profile];
    if(!result)throw new RangeError('HTML presets: n=5/9/19, p=.1/.5/.9, profile=full/half/sqrt');
    return result;
  }
  function replacement(n=9,p=.5,profile='sqrt',m=1,exponent=2){
    const meta=parameters(n,p,profile);
    if(!Number.isInteger(m)||m<0||m>n||!Number.isFinite(exponent)||exponent<0||exponent>8)throw new RangeError('Expected m=0..n and exponent=0..8');
    const clean=Array.from({length:n},(_,i)=>i+1),maximum=n*10**exponent;
    const after=clean.map((x,i)=>i>=n-m?maximum:x);
    const coefficients={type7:hd.typeWeights(n,p,7),hd:hd.weights(n,p),thd:meta.weights};
    const results=Object.fromEntries(Object.entries(coefficients).map(([key,w])=>{
      const first=w.findIndex(x=>x>0)+1,last=w.length-[...w].reverse().findIndex(x=>x>0);
      return [key,{before:hd.dot(clean,w),after:hd.dot(after,w),first,last,upperBreak:n-last+1,breakdown:Math.min(first,n-last+1)/n}];
    }));
    return {n,p,profile,m,exponent,maximum,meta,clean,after,coefficients,results};
  }
  function simulate(scenario='clean',profile='sqrt',seed=43,repetitions=2000){
    if(!['clean','wide'].includes(scenario)||!Number.isInteger(seed)||seed<0||seed>4294967295||!Number.isInteger(repetitions)||repetitions<1||repetitions>10000)throw new RangeError('Invalid simulation settings');
    const w=parameters(5,.5,profile).weights,full=hd.weights(5,.5);
    const rng=stats.mulberry32(seed),normal=stats.normalGenerator(rng),estimates={type7:[],hd:[],thd:[]};
    for(let r=0;r<repetitions;r++){
      const sample=Array.from({length:5},()=>{const rare=rng()<.02,z=normal();return z*(scenario==='wide'&&rare?100:1);}).sort((a,b)=>a-b);
      estimates.type7.push(sample[2]);estimates.hd.push(hd.dot(sample,full));estimates.thd.push(hd.dot(sample,w));
    }
    return {n:5,p:.5,target:0,scenario,profile,seed,repetitions,...Object.fromEntries(Object.entries(estimates).map(([key,values])=>[key,moments(values,0)]))};
  }
  root.CourseTHD=Object.freeze({parameters,replacement,simulate});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CourseTHD;
}(typeof globalThis!=='undefined'?globalThis:this));
