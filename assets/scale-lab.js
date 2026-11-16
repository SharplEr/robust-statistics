/* Two offline labs: finite replacements and population calibration. */
(function(){
  'use strict';
  const scale=globalThis.CourseScale;
  const fmt=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:6});
  const number=x=>x!==0&&(Math.abs(x)<1e-5||Math.abs(x)>=1e6)?x.toExponential(3):fmt.format(x);
  function row(body,values){const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=value;tr.appendChild(td);}body.appendChild(tr);}
  function svg(layer,tag,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text!==undefined)el.textContent=text;layer.appendChild(el);}
  const lab=document.querySelector('[data-scale-lab]');
  if(lab){
    const attack=lab.querySelector('#scale-attack'),m=lab.querySelector('#scale-m'),exponent=lab.querySelector('#scale-exponent'),tau=lab.querySelector('#scale-tau');
    function draw(data){
      const layer=lab.querySelector('[data-scale-chart]');layer.replaceChildren();
      const left=105,width=600,bottom=250,top=35;
      const max=Math.max(1,...data.result.deviations)*1.08;
      const x=i=>left+(i-.5)/9*width,y=v=>bottom-v/max*(bottom-top);
      for(let i=0;i<=4;i++){const value=max*i/4;svg(layer,'line',{x1:left,x2:left+width,y1:y(value),y2:y(value),class:'gridline'});svg(layer,'text',{x:left-10,y:y(value)+4,'text-anchor':'end'},number(value));}
      data.result.deviations.forEach((v,i)=>{svg(layer,'rect',{x:x(i+1)-15,y:y(v),width:30,height:bottom-y(v),fill:'#45678c'});svg(layer,'text',{x:x(i+1),y:275,'text-anchor':'middle'},String(i+1));});
      for(const [key,color] of [['mad','#176459'],['qad','#aa4d2d']])svg(layer,'line',{x1:left,x2:left+width,y1:y(data.result[key]),y2:y(data.result[key]),stroke:color,'stroke-width':2,'stroke-dasharray':key==='qad'?'7 4':'none'});
      svg(layer,'text',{x:left,y:20},'Абсолютное отклонение от новой median');
      svg(layer,'text',{x:405,y:310,'text-anchor':'middle'},'Ранг отклонения · значения доступны в таблице');
    }
    function update(){
      const collapse=attack.value==='collapse';exponent.disabled=collapse;
      const data=scale.replacement(attack.value,Number(m.value),4*10**Number(exponent.value),Number(tau.value));
      lab.querySelector('[data-scale-m-output]').textContent='m='+data.m;
      lab.querySelector('[data-scale-magnitude]').textContent=collapse?'Все замены на 0':'M='+number(data.maximum);
      lab.querySelector('[data-scale-values]').textContent='После замен: ['+data.after.map(number).join('; ')+']. Median='+number(data.result.center)+'. Нулевых отклонений: '+data.result.zeros+' из 9.';
      const summary=lab.querySelector('[data-scale-summary]');summary.replaceChildren();
      for(const [key,name] of [['sd','Sample SD · делитель n−1'],['mad','MAD · raw'],['madNormal','MAD / Φ⁻¹(0.75)'],['qad','QADτ · raw'],['qadNormal','QADτ / zτ']])row(summary,[name,number(data.initial[key]),number(data.result[key])]);
      const detail=lab.querySelector('[data-scale-detail]');detail.replaceChildren();
      data.result.deviations.forEach((value,i)=>row(detail,[String(i+1),number(value),i+1===data.result.details.lowerRank||i+1===data.result.details.upperRank?'Да':'—']));
      const d=data.result.details;
      lab.querySelector('[data-scale-status]').textContent='τ='+number(data.tau)+', type 7: h='+number(d.h)+', используемые ранги '+d.lowerRank+' и '+d.upperRank+'. '+
        (data.result.mad===0?'MAD=0: это не означает, что все наблюдения одинаковы. ':'')+
        'Сравниваются чувствительности статистик одной выборки; истинная σ здесь не задана.';
      draw(data);
    }
    [attack,m,exponent,tau].forEach(input=>input.addEventListener('input',update));
    lab.querySelectorAll('[data-scale-preset]').forEach(button=>button.addEventListener('click',()=>{
      const [a,count]=button.dataset.scalePreset.split(':');attack.value=a;m.value=count;tau.value='0.75';exponent.value='2';update();
    }));
    update();
  }
  const pop=document.querySelector('[data-scale-population]');
  if(pop){
    const model=pop.querySelector('#scale-model'),tau=pop.querySelector('#scale-pop-tau');
    const labels={normal:'Normal(0,1)',laplace:'Laplace(0,1/√2)',uniform:'Uniform(−√3,√3)',cauchy:'Cauchy(0,1)'};
    function update(){
      const data=scale.population(model.value,Number(tau.value));
      pop.querySelector('[data-scale-tau-output]').textContent='τ='+number(data.tau);
      const summary=pop.querySelector('[data-scale-pop-summary]');summary.replaceChildren();
      row(summary,['Модель',labels[data.model]]);row(summary,['Population SD',data.sd===null?'Не существует':'1']);
      row(summary,['Raw QADτ = dτ',number(data.raw)]);row(summary,['Normal constant Kτ = 1/zτ',number(data.constant)]);
      row(summary,['Normal-calibrated scale Sτ',number(data.normalCalibrated)]);
      const body=pop.querySelector('[data-scale-pop-compare]');body.replaceChildren();
      for(const key of Object.keys(labels)){const value=scale.population(key,data.tau);row(body,[labels[key],value.sd===null?'Не существует':'1',number(value.raw),number(value.normalCalibrated)]);}
      pop.querySelector('[data-scale-pop-status]').textContent='Это точные population formulas, численно вычисленные в браузере, без случайной выборки. Синяя кривая — raw QADτ; зелёная — после normal calibration. '+
        (data.model==='normal'?'Зелёная кривая совпадает с σ=1.':data.model==='cauchy'?'Конечный QAD существует, хотя variance не существует.':'SD=1, но normal-calibrated QAD не обязан равняться 1.');
      const layer=pop.querySelector('[data-scale-pop-chart]');layer.replaceChildren();
      const grid=Array.from({length:95},(_,i)=>(i+5)/100).map(t=>scale.population(data.model,t));
      const left=90,width=615,top=40,bottom=265,max=Math.max(1,...grid.map(d=>Math.max(d.raw,d.normalCalibrated)))*1.08;
      const x=t=>left+(t-.05)/.94*width,y=v=>bottom-v/max*(bottom-top);
      for(let i=0;i<=4;i++){const v=max*i/4;svg(layer,'line',{x1:left,x2:left+width,y1:y(v),y2:y(v),class:'gridline'});svg(layer,'text',{x:left-10,y:y(v)+4,'text-anchor':'end'},number(v));}
      for(const t of [.1,.25,.5,.75,.99])svg(layer,'text',{x:x(t),y:288,'text-anchor':'middle'},number(t));
      for(const [key,color] of [['raw','#45678c'],['normalCalibrated','#176459']])svg(layer,'path',{d:grid.map((v,i)=>(i?'L':'M')+x(v.tau)+','+y(v[key])).join(' '),fill:'none',stroke:color,'stroke-width':2});
      svg(layer,'line',{x1:x(data.tau),x2:x(data.tau),y1:top,y2:bottom,stroke:'#aa4d2d','stroke-dasharray':'5 4'});
      for(const [key,color] of [['raw','#45678c'],['normalCalibrated','#176459']])svg(layer,'circle',{cx:x(data.tau),cy:y(data[key]),r:4,fill:color});
      svg(layer,'text',{x:left,y:20},labels[data.model]+' · population scale в единицах X');
      svg(layer,'text',{x:397,y:320,'text-anchor':'middle'},'Уровень τ для распределения абсолютных отклонений');
    }
    [model,tau].forEach(input=>input.addEventListener('input',update));
    pop.querySelectorAll('[data-scale-tau]').forEach(button=>button.addEventListener('click',()=>{tau.value=button.dataset.scaleTau;update();}));
    update();
  }
}());
