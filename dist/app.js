import { DecisionEngine } from './engine.js';
import { MissionAudio } from './audio.js';
import { getContext } from './contexts.js';
import { validateOptions, validationMessage, validationPresentation, normalizeOption } from './validation.js';
import { applyChartTheme } from './theme-palette.js';
import { ModuleNavigation } from './navigation.js';
import { QuantumTrial } from './trial.js';
import { OptionFighter } from './fighter.js';
import { MatrixOptions } from './options-state.js';
import { initHeaderClock } from './header-clock.js';
import { BlackBoxStore, ArchivePipeline } from './archive-engine.js';
import { ArchiveView } from './archives.js';

const $ = id => document.getElementById(id);
const audio = new MissionAudio();
const matrixOptions = new MatrixOptions();
const archiveStore = new BlackBoxStore();
const archivePipeline = new ArchivePipeline(archiveStore, matrixOptions);
matrixOptions.subscribe(state => {
  for (const side of ['a', 'b']) if ($('option-' + side).value !== state[side]) $('option-' + side).value = state[side];
});
let topology, chart, busy = false, mission = 0, events = 0, invalidField, pendingMatrixFocus;
let theme = window.DecisionTheme.theme;
const navigation = new ModuleNavigation(() => syncModuleActivity());
const archives = new ArchiveView(archiveStore, () => { navigation.select('MATRIX'); $('option-a').focus(); });
const trial = new QuantumTrial(audio, value => { audio.mute(value); $('mute').checked = value; }, matrixOptions,
  target => {
    navigation.select('MATRIX');
    if ($(target).disabled) pendingMatrixFocus = target;
    else { pendingMatrixFocus = null; $(target).focus(); }
  }, {
    onStart: () => archivePipeline.ticket('trial'),
    onComplete: (ticket, report) => archivePipeline.recordTrial(ticket, report)
  });
const fighter = new OptionFighter(audio, {
  options: matrixOptions,
  onMissingOption: side => { navigation.select('MATRIX'); $('option-' + side).focus(); },
  onProceed: () => { trial.reset(false); navigation.select('TRIAL'); trial.focus(trial.warning ? 'trial-state-cta' : 'trial-classification'); },
  onMute: value => { audio.mute(value); $('mute').checked = value; $('trial-mute').checked = value; },
  onApply: applyCombatDirective,
  onArchiveStart: names => archivePipeline.ticket('combat', names),
  onArchiveComplete: (ticket, report) => archivePipeline.recordCombat(ticket, report),
  isMatrixBusy: () => busy
});
$('trial-archive').addEventListener('click', () => {
  navigation.select('ARCHIVES');
  const id = trial.archiveTicket?.caseId;
  if (id) archives.openDossier(id);
});

function syncModuleActivity() {
  const active = navigation.activeModule === 'MATRIX' && !document.hidden;
  const trialActive = navigation.activeModule === 'TRIAL' && !document.hidden;
  const fighterActive = navigation.activeModule === 'FIGHTER' && !document.hidden;
  topology?.setActive(active);
  trial.setActive(trialActive);
  fighter.setActive(fighterActive);
  if (!active && !trialActive && !fighterActive) audio.suspend();
  else {
    if (active) chart?.resize();
    if (audio.context && !audio.muted) audio.context.resume().catch(() => {});
  }
}
// Restored navigation is applied after every module controller has mounted.
syncModuleActivity();
const logPhrases = ['Sampling hypothetical futures', 'Normalizing human preference vectors', 'Integrating opportunity-cost coefficients', 'Stress-testing dignity preservation', 'Collapsing the decision-wave superposition'];

function log(message, type = '') {
  const line = document.createElement('div'); line.className = 'log-line ' + type;
  const time = document.createElement('span'); time.className = 'log-time';
  time.textContent = '[' + new Date().toLocaleTimeString('en-GB', { hour12: false }) + ']';
  const content = document.createElement('span'); content.className = 'log-message'; content.textContent = message;
  line.append(time, content); $('logs').append(line);
  while ($('logs').children.length > 70) $('logs').firstChild.remove();
  $('logs').scrollTop = $('logs').scrollHeight; $('log-count').textContent = String(++events).padStart(2, '0') + ' EVENTS';
}
initHeaderClock();
function icons() { window.lucide?.createIcons(); }
icons();
function updateOpticalMode(next) {
  theme = next;
  window.DecisionTheme.syncToggle();
  applyChartTheme(chart, theme);
  topology?.setTheme(theme);
  fighter.setTheme(theme);

}
window.addEventListener('decision-theme-change', event => updateOpticalMode(event.detail.theme));
$('theme-toggle').addEventListener('click', () => window.DecisionTheme.toggle());
updateOpticalMode(theme);
function params() { return { a: $('option-a').value.trim(), b: $('option-b').value.trim(), context: $('context').value, chaos: Number($('chaos').value) }; }

function applyCombatDirective(report) {
  if (busy) return;
  $('option-a').value = report.names[0]; $('option-b').value = report.names[1];
  matrixOptions.recordFight(report.name, report.names[1 - report.winner], { a: report.names[0], b: report.names[1] });
  $('option-a').removeAttribute('aria-invalid'); $('option-b').removeAttribute('aria-invalid');
  $('winner').textContent = report.name;
  $('recommendation-label').textContent = 'RECOMMENDED ACTION: OPTION ' + (report.winner === 0 ? 'A' : 'B') + ' // ARCADE VERDICT';
  $('directive-status').textContent = 'COMBAT DIRECTIVE APPLIED';
  $('confidence').hidden = false; $('directive-metrics').hidden = true;
  $('confidence').textContent = '3-round champion · series ' + report.wins.join('-') + ' · ' + report.health.toFixed(1) + '% integrity in its last round win. No statistical confidence interval was calculated.';
  $('regret-value').textContent = 'NOT MODELED'; $('regret-bar').style.width = '0%'; $('regret-bar').setAttribute('aria-valuenow', '0');
  $('matrix-directive-source').hidden = false;
  $('matrix-directive-source').textContent = 'DIRECTIVE SOURCE: OPTION FIGHTER II // Analytics retain the last Matrix simulation. Run the Matrix to calculate fresh probabilities for these choices.';
  document.querySelector('.executive').dataset.state = 'resolved';
  log('Arcade directive: ' + report.name + '. Tournament score ' + report.wins.join('-') + ' / last win integrity ' + report.health.toFixed(1) + '%. Combat is not a probability estimate.', 'highlight');
  navigation.select('MATRIX'); revealDirective();
}

function revealDirective() {
  if (navigation.activeModule !== 'MATRIX') return;
  const directive = document.querySelector('.executive');
  const bounds = directive.getBoundingClientRect();
  // A mobile Run click can occur below the banner; bring the live verdict into view.
  if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
    directive.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
}

function createChart() {
  if (!window.Chart) { log('Probability renderer unavailable. Numerical telemetry remains operational.', 'warn'); return; }
  Chart.defaults.color = '#7e8da4'; Chart.defaults.font.family = "'JetBrains Mono', monospace";
  chart = new Chart($('probability-chart'), {
    type: 'line',
    data: {
      labels: Array.from({ length: 26 }, (_, i) => i * 4),
      datasets: [
        { label: 'Option A', data: [], borderColor: '#5ae6dc', backgroundColor: '#5ae6dc20', borderWidth: 2, pointRadius: 0, fill: true, tension: .35 },
        { label: 'Option B', data: [], borderColor: '#efa957', backgroundColor: '#efa95713', borderWidth: 2, pointRadius: 0, fill: true, tension: .35 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#121e2d', borderColor: '#35465e', borderWidth: 1, titleFont: { size: 11 }, bodyFont: { size: 11 },
          callbacks: {
            title: items => { const center = Number(items[0].label), half = (chart.binWidth || 4) / 2; return 'Utility ' + (center - half).toFixed(1) + '–' + (center + half).toFixed(1); },
            label: item => item.dataset.label + ': ' + Number(item.raw).toFixed(2) + '% of outcomes'
          }
        }
      },
      scales: {
        x: { grid: { color: '#24304040' }, border: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 6 } },
        y: { beginAtZero: true, suggestedMax: 10, grid: { color: '#24304080' }, border: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 4, callback: value => value + '%' } }
      }
    }
  });
  applyChartTheme(chart, theme);
}

function renderRisks(threats) {
  $('risk-points').replaceChildren(); $('risk-count').textContent = threats.length + ' POTENTIAL THREATS';
  const show = threat => { $('risk-detail').textContent = threat.name + ' · ' + threat.likelihood.toFixed(1) + '% likelihood · severity ' + threat.severity.toFixed(0) + '/100 · weighted risk ' + threat.weight.toFixed(1); };
  threats.forEach((threat, i) => {
    const point = document.createElement('button'); point.type = 'button'; point.className = 'risk-point';
    // Static SVG target; the accessible threat label below carries the data.
    point.innerHTML = '<span class="risk-number" aria-hidden="true">' + (i + 1) + '</span><svg class="risk-target" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="6"/><path d="M12 1v7m0 8v7M1 12h7m8 0h7"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>';
    point.style.left = Math.max(5, Math.min(95, threat.likelihood)) + '%';
    point.style.bottom = Math.max(9, Math.min(91, threat.severity)) + '%';
    point.setAttribute('aria-label', threat.name + ', likelihood ' + threat.likelihood.toFixed(1) + ' percent, severity ' + threat.severity.toFixed(0) + ', weighted risk ' + threat.weight.toFixed(1));
    point.title = threat.name;
    ['pointerenter', 'focus', 'click'].forEach(event => point.addEventListener(event, () => show(threat)));
    $('risk-points').append(point);
  });
  show(threats.reduce((a, b) => a.weight > b.weight ? a : b));
}
function render(result, input) {
  if (chart) {
    chart.data.labels = result.labels; chart.binWidth = result.binWidth;
    chart.data.datasets[0].label = input.a; chart.data.datasets[1].label = input.b;
    chart.data.datasets[0].data = result.distributionA; chart.data.datasets[1].data = result.distributionB; chart.update();
  }
  $('chart-standby').hidden = true;
  $('legend-a').textContent = input.a; $('legend-b').textContent = input.b;
  $('probability-chart').setAttribute('aria-label', input.a + ' mean utility ' + result.a.mean.toFixed(1) + ', median ' + result.a.median.toFixed(1) + ', standard deviation ' + result.a.sd.toFixed(1) + '. ' + input.b + ' mean utility ' + result.b.mean.toFixed(1) + ', median ' + result.b.median.toFixed(1) + ', standard deviation ' + result.b.sd.toFixed(1) + '. 10000 paired scenarios.');
  $('means').textContent = result.a.mean.toFixed(1) + ' / ' + result.b.mean.toFixed(1);
  $('means').title = 'Medians: ' + result.a.median.toFixed(2) + ' / ' + result.b.median.toFixed(2);
  $('deviations').textContent = result.a.sd.toFixed(1) + ' / ' + result.b.sd.toFixed(1);
  $('tails').textContent = result.a.tail.toFixed(1) + '% / ' + result.b.tail.toFixed(1) + '%';
  $('sample-status').textContent = '10,000 SCENARIOS RESOLVED';
  const name = result.winner === 'a' ? input.a : input.b;
  $('winner').textContent = name;
  $('recommendation-label').textContent = 'RECOMMENDED ACTION: OPTION ' + result.winner.toUpperCase();
  $('confidence').textContent = result.probability.toFixed(2) + '% simulated win rate · 95% CI ' + result.ci[0].toFixed(2) + '–' + result.ci[1].toFixed(2) + '%';
  $('confidence').hidden = true; $('directive-metrics').hidden = false;
  $('win-rate').textContent = result.probability.toFixed(2) + '%';
  $('win-interval').textContent = result.ci[0].toFixed(2) + '–' + result.ci[1].toFixed(2) + '%';
  $('directive-status').textContent = 'DIRECTIVE CONFIRMED';
  document.querySelector('.executive').dataset.state = 'resolved';
  $('regret-value').textContent = result.regret.toFixed(1) + '% ESTIMATED GUILT'; $('regret-bar').style.width = result.regret + '%';
  $('regret-bar').setAttribute('aria-valuenow', result.regret.toFixed(1));
  $('entropy').textContent = (result.nodeWeights[0] / 100).toFixed(3) + ' H';
  $('coherence').textContent = result.probability.toFixed(1) + ' %';
  $('integrity').textContent = !topology ? '2D FALLBACK' : input.chaos > 75 ? 'QUESTIONABLE' : 'STABLE';
  $('threat-level').textContent = input.chaos > 75 ? 'CRITICAL' : input.chaos < 25 ? 'MANAGEABLE' : 'ELEVATED';
  topology?.update(result, getContext(input.context));
  $('topology-status').textContent = topology ? 'LIVE MODEL' : '2D FALLBACK';
  renderRisks(result.threats);
  log('Median utility: A ' + result.a.median.toFixed(2) + ' / B ' + result.b.median.toFixed(2) + '. Statistics verified.');
  log('Directive: ' + name + '. Humanity may proceed with its day.', 'highlight');
}

async function showValidation(validation) {
  invalidField = validation.field;
  const presentation = validationPresentation(validation);
  const duplicate = validation.code === 'exact-match' || validation.code === 'plural-match';
  $('option-a').setAttribute('aria-invalid', String(duplicate || !normalizeOption(validation.a)));
  $('option-b').setAttribute('aria-invalid', String(duplicate || !normalizeOption(validation.b)));
  // Replace the complete modal state on every fault so branches cannot bleed.
  $('validation-dialog').dataset.kind = validation.code;
  $('validation-code').textContent = presentation.header;
  $('validation-title').textContent = presentation.title;
  $('validation-dismiss').textContent = presentation.buttonText;
  $('validation-message').textContent = validationMessage(validation);
  $('validation-dialog').showModal();
  log(presentation.log, 'warn');
  await audio.init().catch(() => {}); audio.alarm();
}
$('validation-dialog').addEventListener('close', () => { if (invalidField) $(invalidField).focus(); });
for (const id of ['option-a', 'option-b']) $(id).addEventListener('input', () => {
  $(id).removeAttribute('aria-invalid');
  matrixOptions.setOptions({ a: $('option-a').value, b: $('option-b').value });
});

async function run(input) {
  if (busy) return;
  busy = true; mission++; $('mission-id').textContent = 'DEC-' + String(mission).padStart(4, '0');
  const simulationToken = matrixOptions.beginSimulation();
  $('matrix-directive-source').hidden = true;
  document.querySelector('.executive').dataset.state = 'processing';
  const fields = [$('option-a'), $('option-b'), $('context'), $('chaos')];
  fields.forEach(field => field.disabled = true); $('run-button').disabled = true;
  document.body.classList.add('running');
  $('engine-status').textContent = 'COMPUTING'; $('directive-status').textContent = 'CALCULATING';
  $('winner').textContent = 'SIMULATING…'; $('recommendation-label').textContent = 'FRESH SCENARIOS IN PROGRESS';
  $('confidence').textContent = 'Consulting 10,000 equally unreasonable hypothetical futures.';
  $('confidence').hidden = false; $('directive-metrics').hidden = true;
  $('regret-value').textContent = '—'; $('regret-bar').style.width = '0%';
  $('regret-bar').setAttribute('aria-valuenow', '0');
  ['means', 'deviations', 'tails'].forEach(id => $(id).textContent = '— / —');
  $('console-state').textContent = 'Analyzing the butterfly effect of your choice';
  $('chart-standby').hidden = false; $('chart-standby').textContent = 'ITERATING SCENARIOS…';
  $('sample-status').textContent = '0 / 10,000'; $('risk-points').replaceChildren();
  $('risk-count').textContent = 'ASSESSING THREATS'; $('risk-detail').textContent = 'New catastrophes are being considered.';
  if (chart) { chart.data.datasets.forEach(dataset => dataset.data = []); chart.update('none'); }
  topology?.beginRun(input.chaos, getContext(input.context)); $('topology-status').textContent = 'PROCESSING';
  log('Mission ' + mission + ': ' + input.a + ' vs. ' + input.b + '. Chaos ×' + input.chaos + '.', 'highlight');
  log('Context: ' + getContext(input.context).title + '. Symmetric option priors initialized.');
  revealDirective();
  let phrase = 0;
  try {
    await audio.init().catch(() => log('Audio unavailable. Silent mission authorized.', 'warn')); audio.processing();
    const result = await DecisionEngine.run(input, count => {
      $('run-caption').textContent = 'Iterating scenario #' + count.toLocaleString() + '…';
      $('sample-status').textContent = count.toLocaleString() + ' / 10,000';
      if (count % 2000 === 0) log(logPhrases[phrase++] + '… DONE');
    });
    render(result, input);
    if (matrixOptions.recordSimulation(result, input, simulationToken)) archivePipeline.recordMatrix(result, input, simulationToken);
    audio.success();
    $('engine-status').textContent = 'NOMINAL'; $('run-caption').textContent = '10,000 scenarios. One unnecessarily serious answer.';
    $('console-state').textContent = 'Decision resolved. Awaiting next existential crisis.';
  } catch (error) {
    log('Calculation interrupted. Please run the matrix again.', 'warn');
    $('engine-status').textContent = 'RETRY'; $('winner').textContent = 'MATRIX INTERRUPTED'; $('directive-status').textContent = 'RETRY REQUIRED';
    document.querySelector('.executive').dataset.state = 'error';
    $('confidence').textContent = 'No directive issued. Please run again.';
    $('chart-standby').textContent = 'CALCULATION INTERRUPTED'; $('run-caption').textContent = 'Calculation interrupted. Run again.';
    console.error(error);
  } finally {
    busy = false; fields.forEach(field => field.disabled = false); $('run-button').disabled = false;
    if (pendingMatrixFocus && navigation.activeModule === 'MATRIX') $(pendingMatrixFocus).focus();
    pendingMatrixFocus = null;
    document.body.classList.remove('running'); if (topology) topology.running = false;
  }
}
$('mission-form').addEventListener('submit', event => {
  event.preventDefault(); if (busy) return;
  const input = params(), validation = validateOptions(input.a, input.b);
  if (!validation.valid) { showValidation(validation); return; }
  $('option-a').removeAttribute('aria-invalid'); $('option-b').removeAttribute('aria-invalid');
  run({ ...input, a: validation.a, b: validation.b });
});
$('chaos').addEventListener('input', () => {
  const chaos = Number($('chaos').value); $('chaos-output').firstChild.textContent = chaos;
  $('complexity').textContent = (chaos > 75 ? 'UNHINGED' : chaos < 25 ? 'EXCESSIVE' : 'ABSURD') + ' / ' + chaos + '×';
  $('chaos-description').textContent = chaos > 75 ? 'Extreme chaos. Reality has requested a transfer.' : chaos < 25 ? 'Low chaos. A suspiciously reasonable timeline.' : 'Moderate chaos. Your choice may alter the timeline.';
});
$('mute').addEventListener('change', async () => {
  audio.mute($('mute').checked); if (!$('mute').checked) await audio.init().catch(() => {});
  log($('mute').checked ? 'Acoustic drama suppressed.' : 'Acoustic drama authorized.');
});
$('performance').addEventListener('change', () => {
  topology?.setPerformance($('performance').checked); log($('performance').checked ? 'Particle budget reduced to 150. Dread unaffected.' : 'Particle budget restored to 1,200.');
});
$('rotate').addEventListener('click', () => {
  if (!topology) return;
  topology.controls.autoRotate = !topology.controls.autoRotate;
  const paused = !topology.controls.autoRotate;
  $('rotate').setAttribute('aria-label', paused ? 'Resume graph rotation' : 'Pause graph rotation');
  $('rotate').title = paused ? 'Resume rotation' : 'Pause rotation'; $('rotate').replaceChildren();
  const icon = document.createElement('i'); icon.dataset.lucide = paused ? 'play' : 'pause'; $('rotate').append(icon); icons();
});
$('reset-view').addEventListener('click', () => { topology?.reset(); log('Spatial view reset. Perspective restored.'); });
document.addEventListener('visibilitychange', syncModuleActivity);
window.addEventListener('pageshow', syncModuleActivity);
window.addEventListener('pagehide', event => { if (!event.persisted) { topology?.destroy(); trial.destroy(); fighter.destroy(); archives.destroy(); audio.context?.close(); } });
log('Decision systems online. Mundanity detected.');
log('Quantum terminology loaded. Actual quantum hardware: 0.');
log('Awaiting Human Indecision. Matrix idle. No simulations started.', 'highlight');
createChart();
// Controllers, empty-state validation, theme and archive feed are now initialized.
// Do not wait for optional Three.js imports to reveal the restored page.
document.documentElement.classList.add('app-ready');
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.documentElement.classList.remove('preload');
}));
try {
  const { DecisionTopology } = await import('./topology.js');
  topology = new DecisionTopology($('topology'), theme);
  syncModuleActivity();
} catch (error) {
  console.warn('WebGL unavailable', error);
  $('topology').insertAdjacentHTML('beforeend', '<div class="fallback-graph">Spatial display unavailable on this device.<br>All decision calculations remain operational.</div>');
  $('integrity').textContent = '2D FALLBACK'; $('rotate').disabled = true; $('reset-view').disabled = true;
}
// Standby is intentional: no preflight simulation and no recommendation on page load.
