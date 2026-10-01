import { DecisionEngine } from './engine.js';
import { MissionAudio } from './audio.js';

const $=id=>document.getElementById(id);
const audio=new MissionAudio();
let topology,chart,busy=false,mission=1,events=0;
const logPhrases=['Normalizing salsa viscosity vectors','Quantifying the opportunity cost of lettuce','Consulting the council of hypothetical futures','Compensating for workplace microwave radiation','Integrating dignity preservation coefficients','Collapsing the lunch-wave superposition'];
function log(message,type=''){
  const line=document.createElement('div');line.className='log-line '+type;
  const time=document.createElement('span');time.className='log-time';time.textContent='['+new Date().toLocaleTimeString('en-GB',{hour12:false})+']';
  const content=document.createElement('span');content.className='log-message';content.textContent=message;
  line.append(time,content);$('logs').append(line);
  while($('logs').children.length>70)$('logs').firstChild.remove();
  $('logs').scrollTop=$('logs').scrollHeight;$('log-count').textContent=String(++events).padStart(2,'0')+' EVENTS';
}
function clock(){ $('clock').textContent=new Date().toISOString().slice(11,19)+' UTC'; }clock();setInterval(clock,1000);
function icons(){window.lucide?.createIcons();}icons();
function params(){return {a:$('option-a').value.trim(),b:$('option-b').value.trim(),context:$('context').value,chaos:Number($('chaos').value)};}
function createChart(){
  if(!window.Chart){log('Probability renderer unavailable. Numerical telemetry remains operational.','warn');return;}
  Chart.defaults.color='#7e8da4';Chart.defaults.font.family="'JetBrains Mono', monospace";
  chart=new Chart($('probability-chart'),{type:'line',data:{labels:Array.from({length:25},(_,i)=>i*4+2),datasets:[{label:'Tacos',data:Array(25).fill(0),borderColor:'#5ae6dc',backgroundColor:'#5ae6dc20',borderWidth:2,pointRadius:0,fill:true,tension:.35},{label:'Salad',data:Array(25).fill(0),borderColor:'#efa957',backgroundColor:'#efa95713',borderWidth:2,pointRadius:0,fill:true,tension:.35}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:700},interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'#121e2d',borderColor:'#35465e',borderWidth:1,titleFont:{size:11},bodyFont:{size:11},callbacks:{title:items=>`Utility ${Number(items[0].label)-2}–${Number(items[0].label)+2}`,label:item=>`${item.dataset.label}: ${item.raw.toFixed(2)}% of outcomes`}}},scales:{x:{grid:{color:'#24304040'},border:{display:false},ticks:{font:{size:9},maxTicksLimit:6}},y:{beginAtZero:true,grid:{color:'#24304080'},border:{display:false},ticks:{font:{size:9},maxTicksLimit:4,callback:v=>v+'%'}}}}});
}
function renderRisks(threats){
  $('risk-points').replaceChildren();
  const show=t=>{$('risk-detail').textContent=`${t.name} · ${t.likelihood.toFixed(1)}% likelihood · severity ${t.severity.toFixed(0)}/100 · weighted risk ${t.weight.toFixed(1)}`;};
  threats.forEach((t,i)=>{
    const point=document.createElement('button');point.type='button';point.className='risk-point';point.textContent=i+1;
    point.style.left=Math.max(5,Math.min(95,t.likelihood))+'%';point.style.bottom=Math.max(9,Math.min(91,t.severity))+'%';
    point.setAttribute('aria-label',`${t.name}, likelihood ${t.likelihood.toFixed(1)} percent, severity ${t.severity.toFixed(0)}, weighted risk ${t.weight.toFixed(1)}`);
    point.title=t.name;point.addEventListener('pointerenter',()=>show(t));point.addEventListener('focus',()=>show(t));point.addEventListener('click',()=>show(t));$('risk-points').append(point);
  });
  show(threats.reduce((a,b)=>a.weight>b.weight?a:b));
}
function render(result,input){
  if(chart){chart.data.datasets[0].label=input.a;chart.data.datasets[1].label=input.b;chart.data.datasets[0].data=result.distributionA;chart.data.datasets[1].data=result.distributionB;chart.update();}
  $('legend-a').textContent=input.a;$('legend-b').textContent=input.b;
  $('probability-chart').setAttribute('aria-label',`${input.a} mean utility ${result.a.mean.toFixed(1)}, median ${result.a.median.toFixed(1)}, standard deviation ${result.a.sd.toFixed(1)}. ${input.b} mean utility ${result.b.mean.toFixed(1)}, median ${result.b.median.toFixed(1)}, standard deviation ${result.b.sd.toFixed(1)}. 10000 paired scenarios.`);
  $('means').textContent=`${result.a.mean.toFixed(1)} / ${result.b.mean.toFixed(1)}`;
  $('means').title=`Medians: ${result.a.median.toFixed(2)} / ${result.b.median.toFixed(2)}`;
  $('deviations').textContent=`${result.a.sd.toFixed(1)} / ${result.b.sd.toFixed(1)}`;
  $('tails').textContent=`${result.a.tail.toFixed(1)}% / ${result.b.tail.toFixed(1)}%`;
  $('sample-status').textContent='10,000 SCENARIOS RESOLVED';
  const name=result.winner==='a'?input.a:input.b;
  $('winner').textContent=name;
  $('recommendation-label').textContent='RECOMMENDED ACTION: OPTION '+result.winner.toUpperCase();
  $('confidence').textContent=`${result.probability.toFixed(2)}% simulated win rate · 95% CI ${result.ci[0].toFixed(2)}–${result.ci[1].toFixed(2)}%`;
  $('directive-status').textContent='DIRECTIVE CONFIRMED';$('directive-status').classList.add('cyan');
  $('regret-value').textContent=result.regret.toFixed(1)+'% ESTIMATED GUILT';$('regret-bar').style.width=result.regret+'%';
  $('entropy').replaceChildren(document.createTextNode((.5+input.chaos*.009).toFixed(3)));const unit=document.createElement('span');unit.textContent=' H';$('entropy').append(unit);
  $('coherence').replaceChildren(document.createTextNode((100-input.chaos*.16).toFixed(1)));const percentage=document.createElement('span');percentage.textContent=' %';$('coherence').append(percentage);
  $('integrity').textContent=!topology?'2D FALLBACK':input.chaos>75?'QUESTIONABLE':'STABLE';$('threat-level').textContent=input.chaos>75?'CRITICAL':input.chaos<25?'MANAGEABLE':'ELEVATED';
  renderRisks(result.threats);
  log(`Median utility: A ${result.a.median.toFixed(2)} / B ${result.b.median.toFixed(2)}. Statistics verified.`);
  log(`Directive: ${name}. Humanity may proceed with its afternoon.`,'highlight');
}
async function run(input,preflight=false){
  if(busy)return;busy=true;$('run-button').disabled=true;
  document.body.classList.add('running');$('engine-status').textContent='COMPUTING';$('directive-status').textContent='CALCULATING';$('console-state').textContent='Analyzing the butterfly effect of your lunch';
  if(topology){topology.chaos=input.chaos;topology.running=true;}
  if(!preflight){mission++;$('mission-id').textContent='DEC-'+String(mission).padStart(4,'0');await audio.init().catch(()=>log('Audio unavailable. Silent mission authorized.','warn'));audio.processing();}
  const fields=[$('option-a'),$('option-b'),$('context'),$('chaos')];fields.forEach(x=>x.disabled=true);
  log(`${preflight?'Preflight':'Mission '+mission}: ${input.a} vs. ${input.b}. Chaos ×${input.chaos}.`,'highlight');
  let phrase=0;
  try{
    const result=await DecisionEngine.run(input,count=>{
      $('run-caption').textContent=`Iterating scenario #${count.toLocaleString()}…`;
      $('sample-status').textContent=`${count.toLocaleString()} / 10,000`;
      if(count%2000===0)log(logPhrases[phrase++]+ '… DONE');
    });
    render(result,input);if(!preflight)audio.success();
    $('engine-status').textContent='NOMINAL';$('run-caption').textContent='10,000 scenarios. One unnecessarily serious answer.';
    $('console-state').textContent='Decision resolved. Awaiting next existential crisis.';
  }catch(error){
    log('Calculation interrupted. Please run the matrix again.','warn');$('engine-status').textContent='RETRY';$('run-caption').textContent='Calculation interrupted. Run again.';console.error(error);
  }finally{
    busy=false;fields.forEach(x=>x.disabled=false);$('run-button').disabled=false;document.body.classList.remove('running');if(topology)topology.running=false;
  }
}
$('mission-form').addEventListener('submit',e=>{e.preventDefault();const input=params();if(!input.a||!input.b){log('Both choice vectors must contain a non-empty option.','warn');(!input.a?$('option-a'):$('option-b')).focus();return;}run(input);});
$('chaos').addEventListener('input',()=>{const chaos=Number($('chaos').value);$('chaos-output').firstChild.textContent=chaos;$('complexity').textContent=`${chaos>75?'UNHINGED':chaos<25?'EXCESSIVE':'ABSURD'} / ${chaos}×`;$('chaos-description').textContent=chaos>75?'Extreme chaos. Reality has requested a transfer.':chaos<25?'Low chaos. A suspiciously reasonable timeline.':'Moderate chaos. Your lunch may alter the timeline.';if(topology)topology.chaos=chaos;});
$('mute').addEventListener('change',async()=>{audio.mute($('mute').checked);if(!$('mute').checked)await audio.init().catch(()=>{});log($('mute').checked?'Acoustic drama suppressed.':'Acoustic drama authorized.');});
$('performance').addEventListener('change',()=>{topology?.setPerformance($('performance').checked);log($('performance').checked?'Particle budget reduced to 150. Dread unaffected.':'Particle budget restored to 1,200.');});
$('rotate').addEventListener('click',()=>{if(!topology)return;topology.controls.autoRotate=!topology.controls.autoRotate;const paused=!topology.controls.autoRotate;$('rotate').setAttribute('aria-label',paused?'Resume graph rotation':'Pause graph rotation');$('rotate').title=paused?'Resume rotation':'Pause rotation';$('rotate').replaceChildren();const icon=document.createElement('i');icon.dataset.lucide=paused?'play':'pause';$('rotate').append(icon);icons();});
$('reset-view').addEventListener('click',()=>{topology?.reset();log('Spatial view reset. Perspective restored.');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.suspend();else if(audio.context&&!audio.muted)audio.context.resume().catch(()=>{});});
window.addEventListener('pagehide',()=>{topology?.destroy();audio.context?.close();});
log('Decision systems online. Mundanity detected.');log('Quantum terminology loaded. Actual quantum hardware: 0.');log('Preflight calibration initiated.','highlight');
createChart();
try{const {DecisionTopology}=await import('./topology.js');topology=new DecisionTopology($('topology'));}catch(error){
  console.warn('WebGL unavailable',error);$('topology').insertAdjacentHTML('beforeend','<div class="fallback-graph">Spatial display unavailable on this device.<br>Choice instance → Nutritional entropy<br>→ Post-lunch lethargy → Financial friction<br>→ Existential satisfaction<br>All decision calculations remain operational.</div>');$('integrity').textContent='2D FALLBACK';$('rotate').disabled=true;$('reset-view').disabled=true;
}
run(params(),true);
