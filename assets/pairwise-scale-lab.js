/* Pair matrix, selected distance rank, and paired Monte Carlo correction study. */
(function(){
 'use strict';
 const api=globalThis.CoursePairScale;
 const fmt=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:6});
 const number=x=>x!==0&&(Math.abs(x)<1e-5||Math.abs(x)>=1e6)?x.toExponential(3):fmt.format(x);
 function row(body,values,tag='td'){const tr=document.createElement('tr');for(const value of values){const td=document.createElement(tag);td.textContent=value;tr.appendChild(td);}body.appendChild(tr);}
 function svg(layer,tag,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text!==undefined)el.textContent=text;layer.appendChild(el);}
 const lab=document.querySelector('[data-pair-lab]');
 if(lab){
  const input=lab.querySelector('#pair-values'),status=lab.querySelector('[data-pair-status]');
  const presets={small:[0,1,2,10],grid:Array.from({length:9},(_,i)=>i),outlier:[0,1,2,3,4,5,6,7,1000],clusters:[0,0,0,0,10,10,10,10,20]};
  function update(){
   const values=input.value.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
   if(values.length<2||values.length>20||!values.every(Number.isFinite)){input.setAttribute('aria-invalid','true');status.textContent='Введи от 2 до 20 конечных чисел через пробел; десятичный разделитель — точка. Таблицы показывают предыдущий расчёт.';return;}
   input.setAttribute('aria-invalid','false');const data=api.measure(values);
   status.textContent='n='+data.n+', N='+data.N+' разных пар, h='+data.h+', k='+data.k+', k/N='+number(data.level)+'. Sn: внутренний ранг '+data.h+', внешний '+data.l+'. Нулевых расстояний среди разных пар: '+data.zeros+'.';
   lab.querySelector('[data-pair-comparison]').textContent='Если вместо нужного ранга взять 25%-й quantile списка расстояний по Type 7, получится '+number(data.type7Quarter)+'; raw Qn здесь '+number(data.qRaw)+'.';
   const head=lab.querySelector('[data-pair-matrix-head]');head.replaceChildren();
   row(head,['i / j',...values.map((v,i)=>(i+1)+': '+number(v)),'Внутренний high median'],'th');
   const matrix=lab.querySelector('[data-pair-matrix]');matrix.replaceChildren();
   data.matrix.forEach((line,i)=>row(matrix,[(i+1)+': '+number(values[i]),...line.map((x,j)=>number(x)+(i===j?' ∗':'')),number(data.rowRadii[i])]));
   lab.querySelector('[data-pair-radii]').textContent='Радиусы строк: ['+data.rowRadii.map(number).join('; ')+']. После сортировки: ['+data.rowRadii.slice().sort((a,b)=>a-b).map(number).join('; ')+']. Внешний low median: ранг '+data.l+', raw Sn='+number(data.sRaw)+'.';
   const summary=lab.querySelector('[data-pair-summary]');summary.replaceChildren();
   for(const [name,raw,scaled]of [['MAD',data.madRaw,data.mad],['Sn',data.sRaw,data.s],['Qn',data.qRaw,data.q]])row(summary,[name,number(raw),number(scaled)]);
   lab.querySelector('[data-pair-sd]').textContent='Sample SD с делителем n−1: '+number(data.sd)+'. Здесь сравниваются статистики одной выборки; истинная population σ не задана.';
   const pairs=lab.querySelector('[data-pair-distances]');pairs.replaceChildren();
   data.pairs.forEach((p,i)=>row(pairs,[String(i+1),p.i+'–'+p.j,number(p.d),i+1===data.k?'Выбран Qn':'—']));
   const layer=lab.querySelector('[data-pair-chart]');layer.replaceChildren();
   const left=100,width=610,top=35,bottom=250,max=Math.max(1,...data.pairs.map(p=>p.d))*1.08;
   const x=r=>left+(r-.5)/data.N*width,y=v=>bottom-v/max*(bottom-top);
   for(let i=0;i<=4;i++){const v=max*i/4;svg(layer,'line',{x1:left,x2:left+width,y1:y(v),y2:y(v),class:'gridline'});svg(layer,'text',{x:left-10,y:y(v)+4,'text-anchor':'end'},number(v));}
   const bw=width/data.N;
   data.pairs.forEach((p,i)=>svg(layer,'rect',{x:left+i*bw+.3,y:y(p.d),width:Math.max(.5,bw-.6),height:bottom-y(p.d),fill:i+1===data.k?'#aa4d2d':'#45678c'}));
   svg(layer,'line',{x1:x(data.k),x2:x(data.k),y1:top,y2:bottom,stroke:'#aa4d2d','stroke-dasharray':'4 4'});
   for(const r of [...new Set([1,data.k,data.N])])svg(layer,'text',{x:x(r),y:275,'text-anchor':'middle'},String(r));
   svg(layer,'text',{x:left,y:20},'Расстояние · выделен ранг k='+data.k);
   svg(layer,'text',{x:405,y:310,'text-anchor':'middle'},'Ранг среди N попарных расстояний, с повторениями');
  }
  input.addEventListener('input',update);
  lab.querySelectorAll('[data-pair-preset]').forEach(button=>button.addEventListener('click',()=>{input.value=presets[button.dataset.pairPreset].join(' ');update();}));
  update();
 }
 const mc=document.querySelector('[data-pair-mc]');
 if(mc){
  const n=mc.querySelector('#pair-mc-n'),scenario=mc.querySelector('#pair-mc-scenario'),seed=mc.querySelector('#pair-mc-seed');
  const status=mc.querySelector('[data-pair-mc-status]');
  const names={sd:'Sample SD',s:'Sn · асимпт. нормировка',sCorrected:'Sn · конечная поправка',q:'Qn · асимпт. нормировка',qCorrected:'Qn · конечная поправка'};
  function run(){
   if(seed.value===''||!seed.checkValidity()){seed.setAttribute('aria-invalid','true');status.textContent='Введи целый seed от 0 до 4294967295. Таблица показывает предыдущий расчёт.';return;}
   seed.setAttribute('aria-invalid','false');
   const data=api.simulate(Number(n.value),scenario.value,Number(seed.value));
   const body=mc.querySelector('[data-pair-mc-summary]');body.replaceChildren();
   for(const key of Object.keys(names))row(body,[names[key],number(data[key].mean),number(data[key].bias),number(data[key].variance),number(data[key].mse)]);
   status.textContent='2000 общих для методов выборок: n='+data.n+', seed='+data.seed+', target σ=1. Модель: '+(data.scenario==='clean'?'Normal(0,1).':'98% Normal(0,1) + 2% Normal(0,20²); target — scale чистого компонента.')+
    ' aS,n='+number(data.correction.s)+', aQ,n='+number(data.correction.q)+'. '+(data.sCorrected.mse>data.s.mse?'У Sn здесь уменьшение bias сопровождается ростом MSE.':'Сравни изменение bias и variance отдельно.');
   const layer=mc.querySelector('[data-pair-mc-chart]');layer.replaceChildren();
   const keys=Object.keys(names),short=['SD','Sn','Sn corr','Qn','Qn corr'];
   const left=95,width=610,top=35,bottom=235,max=Math.max(...keys.map(k=>data[k].mse))*1.1;
   const x=i=>left+(i+.5)/5*width,y=v=>bottom-v/max*(bottom-top);
   for(let i=0;i<=4;i++){const v=max*i/4;svg(layer,'line',{x1:left,x2:left+width,y1:y(v),y2:y(v),class:'gridline'});svg(layer,'text',{x:left-10,y:y(v)+4,'text-anchor':'end'},number(v));}
   keys.forEach((key,i)=>{svg(layer,'rect',{x:x(i)-26,y:y(data[key].mse),width:52,height:bottom-y(data[key].mse),fill:i===0?'#45678c':i%2?'#176459':'#aa4d2d'});svg(layer,'text',{x:x(i),y:262,'text-anchor':'middle'},short[i]);});
   svg(layer,'text',{x:left,y:20},'MSE относительно заданного target σ=1');
   svg(layer,'text',{x:400,y:300,'text-anchor':'middle'},'corr — конечная поправка под normal model');
  }
  [n,scenario,seed].forEach(input=>input.addEventListener('input',()=>{status.textContent='Параметры изменены. Нажми «Провести 2000 серий»; таблица пока показывает предыдущий расчёт.';}));
  mc.querySelector('[data-pair-run]').addEventListener('click',run);run();
 }
}());
