/* Offline controls for exact zero weights, finite replacement thresholds and MSE. */
(function(){
  'use strict';
  const thd=globalThis.CourseTHD;
  const format=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:6});
  const number=x=>x!==0&&(Math.abs(x)<1e-5||Math.abs(x)>=1e6)?x.toExponential(3):format.format(x);
  const names={type7:'Type 7',hd:'Harrell–Davis',thd:'Trimmed HD'};
  const profiles={full:'D=1',half:'D=1/2',sqrt:'D=1/√n'};
  function row(body,values){const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=value;tr.appendChild(td);}body.appendChild(tr);}
  const lab=document.querySelector('[data-thd-lab]');
  if(lab){
    const n=lab.querySelector('#thd-n'),p=lab.querySelector('#thd-p'),profile=lab.querySelector('#thd-profile');
    const m=lab.querySelector('#thd-m'),exponent=lab.querySelector('#thd-exponent');
    function draw(data){
      const layer=lab.querySelector('[data-thd-chart]');layer.replaceChildren();
      const left=105,width=600,top=35,bottom=255,peak=Math.max(...Object.values(data.coefficients).flat())*1.07;
      const x=i=>left+(i-.5)/data.n*width,y=w=>bottom-w/peak*(bottom-top);
      function add(tag,attrs,text){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));if(text!==undefined)node.textContent=text;layer.appendChild(node);}
      for(let i=0;i<=4;i++){const w=peak*i/4;add('line',{x1:left,x2:left+width,y1:y(w),y2:y(w),class:'gridline'});add('text',{x:left-10,y:y(w)+4,'text-anchor':'end'},number(w));}
      ['type7','hd','thd'].forEach((key,s)=>data.coefficients[key].forEach((w,i)=>{const bw=width/data.n/4;add('rect',{x:x(i+1)+(s-1.5)*bw,y:y(w),width:bw-.5,height:bottom-y(w),fill:['#45678c','#176459','#aa4d2d'][s]});}));
      for(let i=1;i<=data.n;i++)add('text',{x:x(i),y:278,'text-anchor':'middle'},String(i));
      add('text',{x:left,y:20},'Вес · каждый метод нормирован отдельно');add('text',{x:405,y:310,'text-anchor':'middle'},'Ранг i после сортировки');
      lab.querySelector('desc').textContent=`n=${data.n}, p=${data.p}. Положительные веса THD: ранги ${data.meta.first}–${data.meta.last}. Все веса доступны в таблице.`;
    }
    function update(){
      m.max=n.value;if(Number(m.value)>Number(n.value))m.value=n.value;
      const data=thd.replacement(Number(n.value),Number(p.value),profile.value,Number(m.value),Number(exponent.value));
      lab.querySelector('[data-thd-m-output]').textContent=`m=${data.m}`;
      lab.querySelector('[data-thd-magnitude]').textContent=`M=${number(data.maximum)}`;
      const meta=data.meta,high=meta.high===1&&meta.upperMargin>0?`1 − ${number(meta.upperMargin)}`:number(meta.high);
      lab.querySelector('[data-thd-interval]').textContent=`D=${number(meta.width)}; [L,R]=[${number(meta.low)}; ${high}]; Z=${number(meta.mass)}. Положительные веса: ранги ${meta.first}–${meta.last}.`;
      const summary=lab.querySelector('[data-thd-summary]');summary.replaceChildren();
      for(const key of Object.keys(names)){const result=data.results[key];row(summary,[names[key],number(result.before),number(result.after),String(result.upperBreak),number(result.breakdown)]);}
      const detail=lab.querySelector('[data-thd-weight-table]');detail.replaceChildren();
      for(let i=0;i<data.n;i++)row(detail,[String(i+1),number(data.after[i]),number(data.coefficients.hd[i]),number(data.coefficients.thd[i]),number(data.coefficients.thd[i]*data.after[i])]);
      lab.querySelector('[data-thd-status]').textContent=`n=${data.n}, p=${number(data.p)}. Заменены ${data.m} наибольших наблюдений на M. `+
        (data.m>=meta.upperBreak?`Порог THD достигнут: при M→∞ оценка уйдёт вверх. `:`Порог THD ещё не достигнут: при этой атаке оценка остаётся ограниченной. `)+
        'Это утверждение об ограниченности, а не об отсутствии ошибки. Нули в таблице структурные; малые положительные веса показаны в научной записи.';
      draw(data);
    }
    [n,p,profile,m,exponent].forEach(input=>input.addEventListener('input',update));
    lab.querySelectorAll('[data-thd-preset]').forEach(button=>button.addEventListener('click',()=>{const meta=thd.parameters(Number(n.value),Number(p.value),profile.value);m.value=button.dataset.thdPreset==='threshold'?meta.upperBreak:meta.upperBreak-1;update();}));
    update();
  }
  const mc=document.querySelector('[data-thd-mc]');
  if(mc){
    const scenario=mc.querySelector('#thd-mc-scenario'),profile=mc.querySelector('#thd-mc-profile'),seed=mc.querySelector('#thd-mc-seed');
    const status=mc.querySelector('[data-thd-mc-status]');
    function run(){
      if(seed.value===''||!seed.checkValidity()){seed.setAttribute('aria-invalid','true');status.textContent='Введи целый seed от 0 до 4294967295. Таблица показывает предыдущий расчёт.';return;}
      seed.setAttribute('aria-invalid','false');const data=thd.simulate(scenario.value,profile.value,Number(seed.value));
      const body=mc.querySelector('[data-thd-mc-summary]');body.replaceChildren();
      for(const key of Object.keys(names))row(body,[names[key],number(data[key].bias),number(data[key].variance),number(data[key].mse)]);
      status.textContent=`2000 одинаковых для трёх методов выборок по 5 измерений; ${profiles[data.profile]}, seed=${data.seed}, модель: ${data.scenario==='clean'?'чистый шум':'2% широкого шума'}. Target=0. MSE(THD) / MSE(Type 7) = ${number(data.thd.mse/data.type7.mse)}.`;
    }
    [scenario,profile,seed].forEach(input=>input.addEventListener('input',()=>{status.textContent='Параметры изменены. Нажми «Провести 2000 серий»; таблица пока показывает предыдущий расчёт.';}));
    mc.querySelector('[data-thd-run]').addEventListener('click',run);run();
  }
}());
