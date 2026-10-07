import { FighterEngine } from './fighter-engine.js';
import { FighterRenderer } from './fighter-renderer.js';
import { fighterInputWarning } from './fighter-validation.js';
import { stageForRound } from './fighter-stages.js';

const $ = id => document.getElementById(id);
const LIVE = new Set(['splash', 'beam', 'call', 'fighting', 'slowmo']);
const ATTACK_KEYS = { KeyJ: 'light', KeyZ: 'light', KeyK: 'heavy', KeyX: 'heavy', KeyL: 'special', KeyC: 'special' };
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];

/** One owned RAF loop, fixed 120 Hz simulation, and at most ten HUD updates/second. */
export class OptionFighter {
  constructor(audio, { onMute, onApply, isMatrixBusy, options, onProceed, onMissingOption, onArchiveStart, onArchiveComplete }) {
    this.audio = audio; this.onMute = onMute; this.onApply = onApply; this.isMatrixBusy = isMatrixBusy;
    this.options = options; this.onProceed = onProceed;
    this.onArchiveStart = onArchiveStart; this.onArchiveComplete = onArchiveComplete;
    $('fighter-warning-matrix').addEventListener('click', () => {
      const warning = fighterInputWarning(this.options.state);
      if (warning) onMissingOption(warning.missing);
    });
    this.engine = new FighterEngine(); this.renderer = new FighterRenderer($('fighter-canvas'), this.engine);
    this.active = false; this.paused = false; this.frame = null; this.keys = new Set(); this.touch = new Set();
    this.accumulator = 0; this.lastFrame = 0; this.hudClock = 0; this.fpsClock = 0; this.frames = 0; this.comboUntil = 0;
    this.observer = new ResizeObserver(() => { this.renderer.resize(); if (!this.active || this.paused) this.renderer.draw(0, $('fighter-hitboxes').checked); });
    this.observer.observe($('fighter-stage'));
    this.keydown = event => this.onKey(event, true); this.keyup = event => this.onKey(event, false);
    // Clear held keys on any focus loss; autonomous fights need no operator focus.
    this.blur = () => { this.clearInput(); if (this.active && this.engine.mode === 'player' && LIVE.has(this.engine.phase)) this.togglePause(true); };
    window.addEventListener('keydown', this.keydown); window.addEventListener('keyup', this.keyup); window.addEventListener('blur', this.blur);
    $('fighter-form').addEventListener('submit', event => { event.preventDefault(); this.start(); });
    $('fighter-import').addEventListener('click', () => this.importOptions());
    $('fighter-pause').addEventListener('click', () => this.togglePause());
    $('fighter-mute').addEventListener('change', event => { onMute(event.target.checked); if (event.target.checked) this.cancelVoice(); });
    $('fighter-mode').addEventListener('change', () => this.syncHud());
    $('fighter-rematch').addEventListener('click', () => this.rematch());
    $('fighter-new').addEventListener('click', () => this.newChallengers());
    $('fighter-apply').addEventListener('click', () => {
      if (this.engine.phase !== 'result' || !this.engine.seriesReport || this.isMatrixBusy()) return;
      onApply({ ...this.engine.seriesReport, names: this.engine.fighters.map(f => f.name) });
    });
    for (const input of [$('fighter-name-a'), $('fighter-name-b')]) input.addEventListener('input', () => { this.error(''); this.syncHud(); });
    for (const id of ['fighter-proceed', 'fighter-trial-result']) $(id).addEventListener('click', () => {
      if (this.engine.phase !== 'result') return;
      if (!this.engine.seriesReport) this.rematch();
      else { this.publishVerdict(); this.onProceed(); }
    });
    if (!('speechSynthesis' in window)) { $('fighter-voice').disabled = true; $('fighter-voice').title = 'Speech synthesis is unavailable; text callouts remain active.'; }
    $('fighter-voice').addEventListener('change', () => { if (!$('fighter-voice').checked) this.cancelVoice(); });
    document.querySelectorAll('[data-fighter-hold]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        if (button.disabled) return; event.preventDefault(); button.setPointerCapture(event.pointerId);
        this.touch.add(button.dataset.fighterHold); button.setAttribute('aria-pressed', 'true');
        $('fighter-canvas').focus({ preventScroll: true });
      });
      const release = () => { this.touch.delete(button.dataset.fighterHold); button.setAttribute('aria-pressed', 'false'); };
      button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
    });
    document.querySelectorAll('[data-fighter-action]').forEach(button => button.addEventListener('click', () => {
      this.action(button.dataset.fighterAction); $('fighter-canvas').focus({ preventScroll: true });
    }));
    this.unsubscribeOptions = options.subscribe(() => {
      if (this.engine.phase === 'idle' || this.engine.seriesReport) this.loadMatrixOptions();
      this.syncHud();
    });
    this.overlay();
  }
  error(message) {
    $('fighter-error').textContent = message; $('fighter-error').hidden = !message;
    for (const suffix of ['a', 'b']) $('fighter-name-' + suffix).removeAttribute('aria-invalid');
  }
  importOptions() {
    if (LIVE.has(this.engine.phase)) return;
    this.loadMatrixOptions(); this.syncHud();
  }
  loadMatrixOptions() {
    const { a, b } = this.options.state;
    $('fighter-name-a').value = a; $('fighter-name-b').value = b; this.error('');
    $('fighter-setup-status').textContent = 'MATRIX OPTIONS LOADED';
  }
  hasMatrixChoices() { return !fighterInputWarning(this.options.state); }
  publishVerdict() {
    const report = this.engine.seriesReport;
    if (report) this.options.recordFight(report.name, this.engine.fighters[1 - report.winner].name);
  }
  start() {
    if (LIVE.has(this.engine.phase)) return;
    if (this.engine.phase === 'result' && !this.engine.seriesReport) return;
    if (!this.hasMatrixChoices()) { this.syncHud(); return; }
    const a = $('fighter-name-a').value.trim(), b = $('fighter-name-b').value.trim();
    try { this.engine.start(a, b, $('fighter-mode').value); }
    catch (error) {
      this.error(error.message);
      const missing = !a || a.length > 60 ? 'fighter-name-a' : 'fighter-name-b';
      $(missing).setAttribute('aria-invalid', 'true'); $(missing).focus(); return;
    }
    this.archiveTicket = this.onArchiveStart?.([a, b]);
    this.options.clearFight();
    this.error(''); this.paused = false; this.clearInput(); this.renderer.particles = [];
    $('fighter-result').hidden = true; $('fighter-combo').hidden = true;
    $('fighter-vs-a').textContent = a; $('fighter-vs-b').textContent = b;
    this.audio.init().catch(() => {}); this.events(); this.syncHud(); this.overlay();
    $('fighter-canvas').focus({ preventScroll: true });
    const bounds = $('fighter-stage').getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > innerHeight) $('fighter-stage').scrollIntoView({ block: 'center', behavior: this.renderer.reduced ? 'instant' : 'smooth' });
    this.schedule();
  }
  setActive(active) {
    this.active = active; this.clearInput(); $('fighter-mute').checked = this.audio.muted;
    if (!active) { this.stop(); this.cancelVoice(); }
    else { this.renderer.resize(); this.overlay(); this.syncHud(); this.renderer.draw(0); this.schedule(); }
  }
  // Immediate repaint also covers paused matches; preserve diagnostics and the owned RAF.
  setTheme(theme) { this.renderer.setTheme(theme); if (this.active) this.renderer.draw(0, $('fighter-hitboxes').checked); }
  schedule() {
    if (!this.active || this.paused || this.frame !== null) return;
    $('fighter-canvas').dataset.renderState = 'active';
    this.lastFrame = 0; this.frame = requestAnimationFrame(time => this.tick(time));
  }
  stop() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null; this.lastFrame = 0; this.accumulator = 0;
    $('fighter-canvas').dataset.renderState = 'paused'; $('fighter-fps').textContent = 'PAUSED';
  }
  tick(time) {
    this.frame = null;
    if (!this.active || this.paused) return;
    const dt = this.lastFrame ? Math.min((time - this.lastFrame) / 1000, .1) : 0; this.lastFrame = time;
    this.accumulator += dt;
    const input = { move: Number(this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.touch.has('right')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.touch.has('left')), block: this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.touch.has('block') };
    for (let step = 0; this.accumulator >= 1 / 120 && step < 12; step++) {
      this.engine.update(1 / 120, input); this.accumulator -= 1 / 120; this.events();
    }
    this.renderer.draw(dt, $('fighter-hitboxes').checked);
    this.hudClock += dt; this.fpsClock += dt; this.frames++;
    if (this.hudClock >= .1) { this.hudClock = 0; this.syncHud(); }
    if (this.fpsClock >= .75) { $('fighter-fps').textContent = Math.round(this.frames / this.fpsClock) + ' FPS'; this.fpsClock = 0; this.frames = 0; }
    if (time > this.comboUntil) $('fighter-combo').hidden = true;
    this.frame = requestAnimationFrame(next => this.tick(next));
  }
  clearInput() {
    this.keys.clear(); this.touch.clear();
    document.querySelectorAll('[data-fighter-hold]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  }
  onKey(event, down) {
    if (!down) { this.keys.delete(event.code); return; }
    if (!this.active || event.target.closest('input, textarea, select, nav, dialog')) return;
    if (event.code === 'KeyP' && !event.repeat) { event.preventDefault(); this.togglePause(); return; }
    if (this.engine.mode !== 'player' || this.engine.phase !== 'fighting' || this.paused) return;
    if (!MOVE_KEYS.includes(event.code) && !ATTACK_KEYS[event.code]) return;
    event.preventDefault(); this.keys.add(event.code);
    if (event.repeat) return;
    if (event.code === 'KeyW' || event.code === 'ArrowUp') this.action('jump');
    else if (ATTACK_KEYS[event.code]) this.action(ATTACK_KEYS[event.code]);
  }
  action(type) {
    if (!this.active || this.paused || this.engine.mode !== 'player') return;
    if (type === 'jump') this.engine.jump(0); else this.engine.request(0, type);
    this.events(); this.syncHud();
  }
  togglePause(force) {
    if (!LIVE.has(this.engine.phase)) return;
    this.paused = force === undefined ? !this.paused : force;
    this.clearInput(); if (this.paused) { this.stop(); this.cancelVoice(); } else this.schedule();
    this.overlay(); this.syncHud();
  }
  events() {
    for (const event of this.engine.drainEvents()) {
      this.renderer.event(event);
      if (['splash', 'beam', 'call', 'fighting', 'round', 'ko', 'result'].includes(event.type)) { this.overlay(); this.syncHud(); }
      if (event.type === 'call' || event.type === 'round') { this.audio.fightCue?.('start'); this.speak('Round ' + this.engine.round + '. Execute combat!'); }
      if (event.type === 'hit') {
        if (this.active && !this.audio.muted) this.audio.fightCue?.(event.blocked ? 'block' : event.heavy ? 'heavy' : 'hit');
        if (event.combo >= 2) this.combo(event.combo + '-HIT LOGIC COMBO!', event.index);
        else if (event.heavy && !event.blocked) this.combo(event.baseDamage === 40 ? 'CATASTROPHIC STRIKE!' : 'FINANCIAL GUILT TRIP DROPKICK', event.index);
      }
      if (event.type === 'special') { this.combo(event.text, event.index, 1500); if (this.active && !this.audio.muted) this.audio.fightCue?.('special'); }
      if (event.type === 'empty-meter') $('fighter-live-status').textContent = 'SUPER DENIED // Your Overthink meter requires 100% charge.';
      if (event.type === 'ko') {
        this.publishVerdict();
        if (this.engine.seriesReport) this.onArchiveComplete?.(this.archiveTicket, {
          ...this.engine.seriesReport, names: this.engine.fighters.map(f => f.name), finalHP: this.engine.fighters.map(f => f.hp), mode: this.engine.mode
        });
        if (this.active && !this.audio.muted) this.audio.fightCue?.('ko'); this.speak(event.reason === 'ko' ? 'Knock out. Decision resolved!' : 'Time out. Decision resolved!');
      }
      if (event.type === 'result') this.result(event.report);
    }
  }
  combo(text, index, duration = 1050) {
    $('fighter-combo').textContent = text; $('fighter-combo').dataset.side = index === 0 ? 'a' : 'b';
    $('fighter-combo').hidden = false; this.comboUntil = performance.now() + duration;
  }
  overlay() {
    const phase = this.engine.phase, overlay = $('fighter-stage-overlay');
    $('fighter-canvas').dataset.phase = phase;
    $('fighter-stage').dataset.phase = phase;
    $('fighter-stage').dataset.paused = String(this.paused);
    $('fighter-proceed').hidden = phase !== 'result';
    const complete = Boolean(this.engine.seriesReport);
    const advanceLabel = complete ? 'PROCEED TO QUANTUM TRIAL [03]' : 'PROCEED TO ROUND ' + String(this.engine.round + 1).padStart(2, '0') + ' // 03';
    $('fighter-proceed').textContent = advanceLabel;
    $('fighter-trial-result').textContent = advanceLabel;
    $('fighter-splash').hidden = phase !== 'splash' || this.paused;
    overlay.hidden = (phase === 'fighting' || phase === 'splash' || phase === 'beam') && !this.paused;
    const text = this.paused ? ['COMBAT SUSPENDED', 'PAUSED', 'Press P or Resume to continue the exact same match.'] : {
      idle: ['NEURAL DUEL SYSTEM // ONLINE', 'AWAITING COMBAT', 'Enter your choices. Outsource your judgment to plasma blades.'],
      call: ['ROUND ' + this.engine.round, 'EXECUTE COMBAT!', 'THE COURT OF COMMON SENSE HAS LEFT THE BUILDING.'],
      slowmo: ['ROUND ' + this.engine.round + ' // IMPACT RECORDED', this.engine.report?.reason === 'ko' ? 'K.O.' : 'TIME UP', 'DECISION RESOLVED'],
      result: [complete ? 'SERIES CHAMPION // OPTION ' + (this.engine.seriesReport.winner === 0 ? 'A' : 'B') : 'ROUND ' + this.engine.round + ' WINNER // OPTION ' + (this.engine.winner === 0 ? 'A' : 'B'), (this.engine.seriesReport || this.engine.report)?.name || '', complete ? this.engine.seriesReport.status : 'ROUND SEALED // THE TOURNAMENT CONTINUES'],
      splash: ['', '', ''], beam: ['', '', ''], fighting: ['', '', '']
    }[phase];
    $('fighter-stage-eyebrow').textContent = text[0]; $('fighter-stage-callout').textContent = text[1]; $('fighter-stage-subtitle').textContent = text[2];
    $('fighter-live-status').textContent = this.paused ? 'PAUSED // No time, damage or AI advances.' : { idle: 'STANDBY // Fighters require names before violence can be justified.', splash: 'MATCHUP CONFIRMED // Preparing questionable protagonists.', beam: 'TELEPORTING // Materializing human indecision.', call: 'ROUND ' + this.engine.round + ' // Combat authorization granted.', fighting: this.engine.mode === 'player' ? 'PLAYER A ONLINE // Keyboard or touch controls. S / ↓ blocks 75% of damage.' : 'AUTONOMOUS DUEL // Both options are thinking with their fists.', slowmo: '0.2× IMPACT REPLAY // Victim dignity dissolving.', result: complete ? 'TOURNAMENT RESOLVED // Apply the champion or proceed to Trial.' : 'ROUND SEALED // Continue to the next arena. Trial awaits Round 3.' }[phase];
    $('fighter-phase-label').textContent = this.paused ? 'PAUSED' : phase.toUpperCase();
  }
  syncHud() {
    const engine = this.engine, running = LIVE.has(engine.phase), idle = engine.phase === 'idle';
    for (const f of engine.fighters) {
      const side = f.index ? 'b' : 'a';
      $('fighter-hud-' + side).textContent = idle ? f.index ? 'NEO-RONIN' : 'CYBER-GLADIATOR' : f.name;
      $('fighter-hp-' + side).textContent = (Number.isInteger(f.hp) ? f.hp : f.hp.toFixed(1)) + ' HP';
      $('fighter-charge-' + side).textContent = Math.floor(f.meter) + '%';
      for (const [prefix, value] of [['health', f.hp], ['meter', f.meter]]) {
        const bar = $('fighter-' + prefix + '-' + side); bar.style.width = value + '%'; bar.setAttribute('aria-valuenow', value.toFixed(1));
      }
      $('fighter-health-' + side).parentElement.classList.toggle('taking-damage', f.flash > 0);
      $('fighter-meter-' + side).parentElement.classList.toggle('super-ready', f.meter >= 100);
      const pips = $('fighter-score-' + side);
      pips.setAttribute('aria-label', 'Option ' + side.toUpperCase() + ': ' + engine.wins[f.index] + ' round wins out of 3');
      [...pips.children].forEach((pip, i) => { pip.dataset.won = String(i < engine.wins[f.index]); });
    }
    $('fighter-timer').textContent = String(Math.ceil(engine.remaining)).padStart(2, '0');
    $('fighter-round').textContent = 'ROUND ' + String(engine.round).padStart(2, '0');
    $('fighter-series-score').textContent = engine.wins.join('–');
    const stage = stageForRound(engine.currentRound);
    $('fighter-arena-title').textContent = stage.roundName + ' // ' + stage.subtitle;
    $('fighter-canvas').dataset.round = String(engine.currentRound);
    const mode = idle ? $('fighter-mode').value : engine.mode;
    $('fighter-control-label').textContent = mode === 'player' ? 'PLAYER A // MANUAL OVERRIDE' : 'AI VS AI // FULL AUTONOMY';
    const intermission = engine.phase === 'result' && !engine.seriesReport;
    for (const id of ['fighter-name-a', 'fighter-name-b', 'fighter-mode', 'fighter-import']) $(id).disabled = running || intermission;
    const warning = fighterInputWarning(this.options.state), voidChoices = Boolean(warning);
    $('fighter-void-warning').hidden = !warning;
    if (warning) {
      // Literal text insertion keeps punctuation and markup-like callsigns harmless.
      $('fighter-warning-header').textContent = warning.header;
      $('fighter-warning-message').textContent = warning.message;
      $('fighter-warning-matrix').textContent = warning.actionLabel;
    }
    $('fighter-start').disabled = running || intermission || voidChoices || !$('fighter-name-a').value.trim() || !$('fighter-name-b').value.trim();
    $('fighter-proceed').disabled = voidChoices;
    $('fighter-trial-result').disabled = voidChoices;
    $('fighter-rematch').disabled = voidChoices;
    $('fighter-setup-status').textContent = running ? 'CHALLENGERS LOCKED // ROUND ' + engine.round : warning ? warning.status : idle ? 'MATRIX CHOICES LOADED' : 'ROUND RESOLVED';
    $('fighter-pause').disabled = !running; $('fighter-pause').setAttribute('aria-pressed', String(this.paused));
    $('fighter-pause').setAttribute('aria-label', this.paused ? 'Resume combat' : 'Pause combat');
    $('fighter-pause').lastElementChild.textContent = this.paused ? 'RESUME [P]' : 'PAUSE [P]';
    document.querySelectorAll('[data-fighter-hold], [data-fighter-action]').forEach(button => {
      button.disabled = mode !== 'player' || engine.phase !== 'fighting' || this.paused || button.dataset.fighterAction === 'special' && engine.fighters[0].meter < 100;
    });
    $('fighter-apply').hidden = !engine.seriesReport;
    $('fighter-rematch').hidden = !engine.seriesReport;
    $('fighter-apply').disabled = !engine.seriesReport || this.isMatrixBusy();
    $('fighter-apply').title = this.isMatrixBusy() ? 'Wait for the current Matrix calculation to finish.' : 'Set an arcade-sourced executive directive.';
    $('fighter-canvas').setAttribute('aria-label', (idle ? 'Standby arena.' : 'Round ' + engine.round + '. ' + engine.fighters.map(f => f.name + ': ' + f.hp.toFixed(1) + ' health, ' + Math.floor(f.meter) + '% Overthink').join('. ')) + ' ' + (this.paused ? 'Paused.' : mode === 'player' ? 'Player A: WASD and J, K, L. P to pause.' : 'Both fighters controlled by AI.'));
  }
  result(report) {
    const complete = Boolean(this.engine.seriesReport), telemetry = this.engine.seriesReport || report;
    $('fighter-result').hidden = false;
    $('fighter-result-title').textContent = telemetry.name;
    $('fighter-victory-copy').textContent = complete ? telemetry.headline : 'ROUND ' + report.round + ' WON BY OPTION ' + (report.winner === 0 ? 'A' : 'B') + ' // NEXT ARENA AWAITS';
    $('fighter-result-reason').textContent = complete ? telemetry.status : report.reason === 'ko' ? 'K.O. // ROUND RESOLVED' : report.reason === 'tiebreak' ? 'QUANTUM TIEBREAK // ROUND RESOLVED' : 'TIMEOUT // ROUND RESOLVED';
    $('fighter-series-status').textContent = 'ROUND ' + report.round + ' // SERIES ' + report.wins[0] + '-' + report.wins[1];
    $('fighter-integrity-metric').textContent = complete ? 'CHAMPION LAST WIN INTEGRITY' : 'REMAINING INTEGRITY';
    $('fighter-result-health').textContent = telemetry.health.toFixed(1) + '%';
    $('fighter-result-combo').textContent = telemetry.maxCombo + '-HIT';
    $('fighter-result-damage').textContent = telemetry.damage.map(value => value.toFixed(1)).join(' / ');
    $('fighter-result-volatility').textContent = telemetry.volatility.toFixed(1) + '%';
    $('fighter-rematch').title = 'Restart all three rounds with the same challengers.';
    $('fighter-result-note').textContent = complete ? 'Series telemetry aggregates all three rounds. Integrity is the champion’s most recent round win; Round 3 may have a different winner. Combat is fictional.' : 'Telemetry covers this round. All three rounds must be completed; series scores survive the next arena.';
    const history = $('fighter-round-history'); history.replaceChildren();
    for (const round of this.engine.roundHistory) {
      const row = document.createElement('li'); row.dataset.winner = String(round.winner);
      row.textContent = 'R' + round.round + ' // ' + round.name + ' // ' + round.health.toFixed(1) + '% HP // ' + round.duration.toFixed(1) + 's'; history.append(row);
    }
    if (this.active) {
      $('fighter-result-title').focus({ preventScroll: true });
      $('fighter-result').scrollIntoView({ block: 'nearest', behavior: this.renderer.reduced ? 'instant' : 'smooth' });
    }
  }
  rematch() {
    if (this.engine.phase !== 'result' || !this.hasMatrixChoices()) return;
    if (this.engine.seriesReport) {
      this.engine.start(...this.engine.fighters.map(f => f.name), this.engine.mode);
      this.archiveTicket = this.onArchiveStart?.(this.engine.fighters.map(f => f.name));
    }
    else this.engine.nextRound();
    this.options.clearFight(); this.paused = false; this.clearInput(); this.renderer.particles = [];
    $('fighter-result').hidden = true; $('fighter-combo').hidden = true;
    this.events(); this.syncHud(); this.overlay(); this.schedule();
    $('fighter-canvas').focus({ preventScroll: true }); $('fighter-stage').scrollIntoView({ block: 'center', behavior: this.renderer.reduced ? 'instant' : 'smooth' });
  }
  newChallengers() {
    if (this.engine.phase !== 'result') return;
    this.engine.reset(); this.paused = false; this.clearInput(); this.renderer.particles = [];
    this.options.clearFight(); this.loadMatrixOptions();
    $('fighter-result').hidden = true; $('fighter-combo').hidden = true; this.syncHud(); this.overlay();
    $('fighter-name-a').focus();
  }
  speak(text) {
    if (!this.active || this.audio.muted || !$('fighter-voice').checked || !window.speechSynthesis) return;
    this.cancelVoice(); this.utterance = new SpeechSynthesisUtterance(text); this.utterance.rate = .92; this.utterance.pitch = .65; window.speechSynthesis.speak(this.utterance);
  }
  cancelVoice() { if (this.utterance && window.speechSynthesis) { window.speechSynthesis.cancel(); this.utterance = null; } }
  destroy() { this.active = false; this.stop(); this.cancelVoice(); this.unsubscribeOptions?.(); this.observer.disconnect(); window.removeEventListener('keydown', this.keydown); window.removeEventListener('keyup', this.keyup); window.removeEventListener('blur', this.blur); }
}
