/* Explicit Sn/Qn conventions; all ranks below are one-based. */
(function(root){
 'use strict';
 const stats=root.CourseStats||require('./statistics.js'),scale=root.CourseScale||require('./scale-statistics.js');
 const moments=(root.CourseEfficiency||require('./influence-efficiency.js')).moments;
 const CS=1.19259855312321,CQ=1/(Math.SQRT2*scale.normalRadius(.25));
 // Akinshin (2022), Table 3, rounded MC factors. n=2 uses the exact analytic correction.
 const rows=[[2,Math.sqrt(Math.PI)/(2*CS),Math.sqrt(Math.PI)/(2*CQ)],[3,1.8493,.9937],[4,.9550,.5132],[5,1.3487,.8440],
  [6,.9940,.6122],[7,1.1985,.8588],[8,1.0050,.6699],[9,1.1317,.8734],[10,1.0070,.7201],[11,1.0960,.8891],
  [12,1.0063,.7575],[13,1.0742,.9023],[14,1.0052,.7855],[15,1.0600,.9125],[16,1.0039,.8078],[17,1.0502,.9210],
  [18,1.0028,.8260],[19,1.0429,.9279],[20,1.0021,.8411]];
 const corrections=Object.freeze(Object.fromEntries(rows.map(([n,s,q])=>[n,Object.freeze({s,q})])));
 function measure(values,details=true){
  if(!Array.isArray(values)||values.length<2||values.length>200||!values.every(Number.isFinite))throw new RangeError('Expected 2..200 finite observations');
  const n=values.length,h=Math.floor(n/2)+1,l=Math.floor((n+1)/2),N=n*(n-1)/2,k=h*(h-1)/2;
  const matrix=values.map(x=>values.map(y=>Math.abs(x-y)));
  const rowRadii=matrix.map(row=>row.slice().sort((a,b)=>a-b)[h-1]);
  const sRaw=rowRadii.slice().sort((a,b)=>a-b)[l-1];
  const pairs=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)pairs.push({i:i+1,j:j+1,d:matrix[i][j]});
  pairs.sort((a,b)=>a.d-b.d||a.i-b.i||a.j-b.j);
  const distances=pairs.map(p=>p.d),qRaw=distances[k-1],a=corrections[n]||null;
  const center=stats.median(values),mad=stats.median(values.map(x=>Math.abs(x-center)));
  const mean=stats.mean(values),sd=Math.sqrt(values.reduce((s,x)=>s+(x-mean)**2,0)/(n-1));
  return {n,N,h,l,k,level:k/N,sRaw,qRaw,s:CS*sRaw,q:CQ*qRaw,
    sCorrected:a?a.s*CS*sRaw:null,qCorrected:a?a.q*CQ*qRaw:null,correction:a,
    madRaw:mad,mad:mad/scale.normalRadius(.5),sd,
    type7Quarter:stats.quantileDetails(distances,.25,7).value,
    zeros:pairs.filter(p=>p.d===0).length,...(details?{matrix,rowRadii,pairs}: {})};
 }
 function simulate(n=5,scenario='clean',seed=43,repetitions=2000){
  if(!Number.isInteger(n)||!corrections[n]||!['clean','wide'].includes(scenario)||
   !Number.isInteger(seed)||seed<0||seed>4294967295||!Number.isInteger(repetitions)||repetitions<1||repetitions>10000)throw new RangeError('Invalid Monte Carlo settings');
  const rng=stats.mulberry32(seed),normal=stats.normalGenerator(rng);
  const estimates={sd:[],s:[],sCorrected:[],q:[],qCorrected:[]};
  for(let r=0;r<repetitions;r++){
   const sample=Array.from({length:n},()=>{const bad=rng()<.02,z=normal();return z*(scenario==='wide'&&bad?20:1);});
   const result=measure(sample,false);
   for(const key of Object.keys(estimates))estimates[key].push(result[key]);
  }
  const summary=Object.fromEntries(Object.entries(estimates).map(([key,values])=>{const m=moments(values,1);return [key,{mean:m.bias+1,...m}]}));
  return {n,scenario,seed,repetitions,target:1,correction:corrections[n],...summary};
 }
 root.CoursePairScale=Object.freeze({CS,CQ,corrections,measure,simulate});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.CoursePairScale;
}(typeof globalThis!=='undefined'?globalThis:this));
