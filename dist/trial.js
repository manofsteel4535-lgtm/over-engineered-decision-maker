import { TrialSession, CASE_CLASSES, generateIndictment, outrageLabel } from './trial-engine.js';
import { trialInputWarning } from './trial-validation.js';

const $ = id => document.getElementById(id);
const signed = n => (n > 0 ? '+' : '') + n;
const CLASSIFIED_BADGES = ['[SWORN TESTIMONY]', '[RECORDED FOR TRIBUNAL]', '[IMPACT CLASSIFIED]'];

/** Mounted once: navigating away never discards evidence or creates render loops. */
export class QuantumTrial {
  constructor(audio, onMute, options, onCorrection, { onStart, onComplete } = {}) {
    this.audio = audio;
    this.onMute = onMute;
    this.options = options;
    this.onArchiveStart = onStart; this.onArchiveComplete = onComplete;
    this.dossier = null;
    this.warning = null;
    $('trial-state-cta').addEventListener('click', () => {
      const warning = trialInputWarning(this.options.state);
      if (warning) onCorrection(warning.target);
    });
    this.session = new TrialSession();
    this.revealPredictions = false;
    $('trial-reveal-predictions').checked = false;
    $('trial-reveal-predictions').addEventListener('change', event => {
      this.revealPredictions = event.target.checked;
      this.renderPredictionBadges();
    });
    this.active = false;
    this.answering = false;
    this.generation = 0;
    this.timers = new Set();
    this.downloads = new Set();
    $('trial-form').addEventListener('submit', event => { event.preventDefault(); this.start(); });
    $('trial-appeal').addEventListener('click', () => this.reset());
    $('trial-certificate').addEventListener('click', () => this.openCertificate());
    $('trial-cert-print').addEventListener('click', () => window.print());
    $('trial-cert-download').addEventListener('click', () => {
      $('trial-cert-export-status').textContent = 'EXPORT REQUESTED // ' + $('trial-cert-download').download;
    });
    $('trial-certificate-dialog').addEventListener('close', () => this.focus('trial-certificate'));
    $('trial-mute').addEventListener('change', event => onMute(event.target.checked));
    // One source for charge labels avoids divergence between evidence and certificates.
    for (const [value, label] of Object.entries(CASE_CLASSES)) $('trial-classification').add(new Option(label, value));
    $('trial-classification').addEventListener('change', () => { this.clearError(); this.updateReadiness(); });
    $('trial-reroll').addEventListener('click', () => this.syncDossier(true));
    this.reset(false);
    this.unsubscribeOptions = options.subscribe(() => this.syncDossier());
  }

  setActive(active) {
    this.active = active;
    $('trial-mute').checked = this.audio.muted;
    if (active) this.syncDossier();
  }

  syncDossier(reroll = false) {
    const state = this.options.state;
    this.warning = trialInputWarning(state);
    // A changed pair or new run revokes the current case, including pending timers.
    if (this.session.state.phase !== 'indictment') {
      if (this.warning || this.dossier?.runId !== state.matrixState.runId) this.reset(false);
      return;
    }
    for (const side of ['a', 'b']) {
      const field = $('trial-option-' + side), value = state[side];
      if (field.value !== value) field.value = value;
      field.readOnly = true;
    }
    $('trial-choice-status').textContent = '[READ ONLY // QUANTUM MATRIX INPUT LINK]';
    // Lucide replaces the placeholder with SVG, whose visibility needs an attribute.
    $('trial-choice-lock').toggleAttribute('hidden', false);
    $('trial-choice-fields').dataset.locked = 'true';
    $('trial-standard-dossier').hidden = Boolean(this.warning);
    $('trial-state-error').hidden = !this.warning;
    if (this.warning) {
      $('trial-state-code').textContent = this.warning.header;
      $('trial-state-message').textContent = this.warning.message;
      $('trial-state-cta').textContent = this.warning.actionLabel;
      this.dossier = null;
      $('trial-decision').textContent = ''; $('trial-dossier-source').textContent = '';
      this.clearError(); this.updateReadiness();
      return;
    }
    if (!reroll && this.dossier?.runId === state.matrixState.runId) { this.updateReadiness(); return; }
    this.dossier = generateIndictment(state, Math.random, this.dossier?.index ?? -1);
    $('trial-decision').textContent = this.dossier.sentence;
    $('trial-dossier-source').textContent = 'SOURCE: QUANTUM MATRIX // SIMULATION WINNER: ' + this.dossier.winningOption + ' // ALTERNATIVE: ' + this.dossier.losingOption;
    this.clearError(); this.updateReadiness();
  }

  updateReadiness() {
    const blocked = Boolean(this.warning) || !this.dossier;
    const ready = !blocked && Object.hasOwn(CASE_CLASSES, $('trial-classification').value);
    $('trial-classification').disabled = blocked;
    $('trial-surrender').hidden = blocked;
    $('trial-surrender').disabled = !ready;
    $('trial-entry-status').textContent = blocked ? 'PROSECUTION BLOCKED // MATRIX EVIDENCE REQUIRED' : ready ? 'CHARGE SELECTED // READY FOR PROSECUTION' : 'SELECT A LEGAL CHARGE TO AUTHORIZE PROSECUTION';
  }

  later(callback, delay) {
    const generation = this.generation;
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (generation === this.generation) callback();
    }, delay);
    this.timers.add(timer);
  }

  sound(final = false) {
    if (!this.active || this.audio.muted) return;
    this.audio.init().then(() => {
      if (!this.active || this.audio.muted) return;
      this.audio.gavel();
      if (final) this.audio.alarm();
    }).catch(() => {});
  }

  strike(final = false) {
    const view = $('trial-view');
    view.classList.remove('court-impact');
    // Restart the finite impact animation for each gavel strike.
    void view.offsetWidth;
    view.classList.add('court-impact');
    this.later(() => view.classList.remove('court-impact'), 850);
    this.sound(final);
  }

  clearError() {
    $('trial-input-error').hidden = true;
    $('trial-input-error').textContent = '';
    $('trial-classification').removeAttribute('aria-invalid');
  }

  start() {
    if (this.session.state.phase !== 'indictment') return;
    this.syncDossier();
    if (this.warning || !this.dossier) { this.focus('trial-state-cta'); return; }
    const classification = $('trial-classification').value;
    if (!Object.hasOwn(CASE_CLASSES, classification)) {
      $('trial-input-error').textContent = 'LEGAL CHARGE MISSING: Select a case classification. The prosecution refuses to invent your paperwork.';
      $('trial-input-error').hidden = false;
      $('trial-classification').setAttribute('aria-invalid', 'true');
      this.focus('trial-classification');
      if (!this.audio.muted) this.audio.init().then(() => this.audio.alarm()).catch(() => {});
      return;
    }
    this.clearError();
    const state = this.session.start(this.dossier.sentence, classification);
    this.archiveTicket = this.onArchiveStart?.();
    $('trial-case-id').textContent = state.caseId;
    $('trial-subject').textContent = state.decision;
    $('trial-class-label').textContent = CASE_CLASSES[state.classification];
    this.phase(2);
    this.updateOutrage(0);
    this.log('CLERK', state.caseId + ' opened. Exhibit A: ' + state.decision);
    this.log('V.O.I.D.', CASE_CLASSES[state.classification] + '. The prosecution is already disappointed.');
    this.log('B.O.T.', 'I am prepared to defend my client. As soon as someone explains the case.');
    this.renderQuestion();
    this.strike();
  }

  phase(number) {
    $('trial-phase-1').hidden = number !== 1;
    $('trial-phase-2').hidden = number !== 2;
    $('trial-phase-3').hidden = number !== 3;
    for (const id of ['trial-case-banner', 'trial-judges', 'trial-proceedings']) $(id).hidden = number === 1;
    $('trial-evidence-panel').hidden = number !== 3;
    for (let i = 1; i <= 3; i++) {
      const step = $('trial-step-' + i);
      step.dataset.state = i === number ? 'current' : i < number ? 'complete' : 'pending';
      if (i === number) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    }
    $('trial-status').textContent = ['AWAITING CONFESSION', 'EXAMINATION IN PROGRESS', 'CASE ADJUDICATED'][number - 1];
  }

  renderQuestion() {
    const index = this.session.state.question;
    const question = this.session.state.questions[index];
    this.answering = false;
    $('trial-question-number').textContent = 'QUESTION ' + String(index + 1).padStart(2, '0') + ' / 03';
    $('trial-question-text').textContent = question.text;
    $('trial-answer-status').textContent = 'SELECT ONE SWORN RESPONSE. THE JURY IS LISTENING.';
    $('trial-answers').replaceChildren();
    question.options.forEach((answer, option) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'trial-answer'; button.dataset.answer = option; button.dataset.question = index;
      button.setAttribute('aria-pressed', 'false');
      const letter = document.createElement('span'); letter.className = 'answer-letter'; letter.textContent = String.fromCharCode(65 + option);
      const text = document.createElement('span'); text.textContent = answer.human_text;
      const delta = document.createElement('span'); delta.className = 'answer-delta';
      button.append(letter, text, delta);
      button.addEventListener('click', () => this.answer(option, index, button));
      $('trial-answers').append(button);
    });
    this.renderPredictionBadges();
    this.focus('trial-question-text');
  }

  renderPredictionBadges() {
    // Update only badge text, preserving keyboard focus, pressed state and locks.
    for (const button of $('trial-answers').children) {
      const option = Number(button.dataset.answer), badge = button.querySelector('.answer-delta');
      // Between questions the displayed choices still belong to the previous one.
      const displayed = this.session.state.questions[Number(button.dataset.question)]?.options[option];
      if (!displayed) continue;
      badge.textContent = this.revealPredictions ? signed(displayed.outrage_delta) + '% OUTRAGE' : CLASSIFIED_BADGES[option];
      badge.dataset.classified = String(!this.revealPredictions);
    }
  }

  answer(option, questionIndex, button) {
    if (this.answering || this.session.state.phase !== 'examination' || this.session.state.question !== questionIndex) return;
    if (trialInputWarning(this.options.state) || this.dossier?.runId !== this.options.state.matrixState.runId) { this.syncDossier(); return; }
    this.answering = true;
    const answer = this.session.state.questions[questionIndex].options[option];
    const previous = this.session.state.outrage;
    const state = this.session.answer(option, questionIndex);
    for (const choice of $('trial-answers').children) choice.disabled = true;
    button.setAttribute('aria-pressed', 'true');
    this.updateOutrage(state.outrage);
    this.log('HUMAN', answer.human_text);
    this.log('V.O.I.D.', answer.void_response);
    this.log('B.O.T.', answer.bot_response);
    const applied = state.outrage - previous;
    this.log('JURY', previous + '% → ' + state.outrage + '% (designated ' + signed(answer.outrage_delta) + ' points; applied ' + signed(applied) + (applied !== answer.outrage_delta ? '; clamped to 0–100%' : '') + ').');
    $('trial-answer-status').textContent = 'TESTIMONY ENTERED. JURY RECALIBRATING.';
    if (state.phase === 'verdict') {
      this.onArchiveComplete?.(this.archiveTicket, this.session.certificate());
      $('trial-status').textContent = 'GAVEL DROP // SENTENCE INBOUND';
      this.strike(true);
      this.later(() => this.renderVerdict(), 650);
    } else this.later(() => this.renderQuestion(), 650);
  }

  updateOutrage(value) {
    const label = outrageLabel(value);
    $('trial-outrage').textContent = value + '%';
    $('trial-outrage-label').textContent = label;
    $('trial-final-outrage').textContent = value + '%';
    $('trial-final-label').textContent = value >= 80 ? 'CATASTROPHIC OUTRAGE' : label;
    for (const id of ['trial-outrage-bar', 'trial-final-bar']) {
      $(id).style.width = value + '%';
      $(id).setAttribute('aria-valuenow', String(value));
      $(id).setAttribute('aria-valuetext', value + '% ' + label);
    }
    $('trial-view').dataset.severity = value >= 66 ? 'high' : 'low';
  }

  renderVerdict() {
    const state = this.session.state;
    $('trial-phase-3').dataset.outcome = state.outcome;
    $('trial-decree-tier').textContent = 'TIER ' + (state.tier === 'LOW' ? '1 // LOW' : state.tier === 'MODERATE' ? '2 // MODERATE' : '3 // EXTREME') + ' OUTRAGE';
    $('trial-verdict').textContent = state.verdict;
    $('trial-sentence').textContent = state.sentence;
    $('trial-pardon-note').hidden = state.outcome !== 'pardoned';
    $('trial-certificate').lastChild.textContent = state.outcome === 'pardoned' ? 'GENERATE CERTIFICATE OF ACQUITTAL' : 'GENERATE CERTIFICATE OF CONVICTION';
    this.log('CLERK', state.verdict + '. Final public outrage: ' + state.outrage + '%.');
    this.log('CLERK', state.sentence);
    $('trial-transcript-state').textContent = 'CASE CLOSED // EVIDENCE SEALED';
    $('trial-evidence-list').replaceChildren();
    for (const answer of state.answers) {
      const item = document.createElement('li');
      item.textContent = 'Q' + (answer.question + 1) + ' // ' + answer.human_text + ' [' + signed(answer.appliedDelta) + ' points]';
      $('trial-evidence-list').append(item);
    }
    this.phase(3);
    this.answering = false;
    this.focus('trial-verdict');
  }

  log(speaker, message) {
    const line = document.createElement('div');
    line.className = 'court-line'; line.dataset.speaker = speaker;
    const heading = document.createElement('div'); heading.className = 'court-line-heading';
    const name = document.createElement('strong'); name.textContent = speaker;
    const time = document.createElement('span'); time.textContent = new Date().toISOString().slice(11, 19) + ' UTC';
    heading.append(name, time);
    const text = document.createElement('p'); text.textContent = message;
    line.append(heading, text); $('trial-transcript').append(line);
    $('trial-transcript-count').textContent = String($('trial-transcript').children.length).padStart(2, '0') + ' ENTRIES';
    $('trial-transcript').scrollTop = $('trial-transcript').scrollHeight;
  }

  focus(id) {
    if (!this.active) return;
    const node = $(id);
    node.focus({ preventScroll: true });
    const bounds = node.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > window.innerHeight) node.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  reset(focus = true) {
    this.generation++;
    this.timers.forEach(clearTimeout); this.timers.clear();
    this.session.reset(); this.answering = false;
    this.archiveTicket = null;
    this.dossier = null;
    this.downloads.forEach(url => URL.revokeObjectURL(url)); this.downloads.clear();
    $('trial-cert-download').removeAttribute('href');
    $('trial-cert-export-status').textContent = '';
    if ($('trial-certificate-dialog').open) $('trial-certificate-dialog').close();
    $('trial-form').reset(); this.clearError();
    this.syncDossier(true);
    $('trial-mute').checked = this.audio.muted;
    $('trial-view').classList.remove('court-impact');
    this.phase(1); this.updateOutrage(0);
    $('trial-case-id').textContent = 'QTR-NEW';
    $('trial-transcript').replaceChildren(); $('trial-answers').replaceChildren(); $('trial-evidence-list').replaceChildren();
    $('trial-transcript-count').textContent = '00 ENTRIES';
    $('trial-transcript-state').textContent = 'RECORDING SWORN NONSENSE';
    for (const id of ['trial-subject', 'trial-class-label', 'trial-question-text', 'trial-answer-status', 'trial-verdict', 'trial-sentence', 'trial-decree-tier']) $(id).textContent = '';
    for (const node of $('trial-cert-card').querySelectorAll('[id]')) if (node.id !== 'trial-cert-title' && node.id !== 'trial-cert-seal') node.replaceChildren();
    if (focus) this.focus('trial-classification');
  }

  openCertificate() {
    if (trialInputWarning(this.options.state) || this.dossier?.runId !== this.options.state.matrixState.runId) { this.syncDossier(); return; }
    const report = this.session.certificate();
    $('trial-cert-title').textContent = report.outcome === 'guilty' ? 'Certificate of Conviction' : 'Certificate of Tribunal Acquittal';
    $('trial-cert-seal').textContent = report.outcome === 'guilty' ? 'GUILTY // FICTIONAL SEAL' : 'PARDONED // FICTIONAL SEAL';
    const fields = { case: report.caseId, issued: report.issuedAt.replace('T', ' ').replace('Z', ' UTC'), class: report.classificationName, outrage: report.outrage + '% — ' + report.tier + ' TIER', decision: report.decision, verdict: report.verdict, sentence: report.sentence };
    for (const [name, value] of Object.entries(fields)) $('trial-cert-' + name).textContent = value;
    $('trial-cert-answers').replaceChildren();
    report.answers.forEach(answer => {
      const item = document.createElement('li');
      const question = document.createElement('strong'); question.textContent = answer.questionText;
      const response = document.createElement('p'); response.textContent = answer.human_text + ' [' + signed(answer.appliedDelta) + ' outrage points; meter ' + answer.outrage + '%]';
      item.append(question, response); $('trial-cert-answers').append(item);
    });
    $('trial-certificate-dialog').showModal();
    this.prepareCertificateDownload();
    $('trial-cert-close').focus();
  }

  prepareCertificateDownload() {
    // User strings entered via textContent are escaped by DOM serialization.
    this.downloads.forEach(url => URL.revokeObjectURL(url)); this.downloads.clear();
    $('trial-cert-export-status').textContent = '';
    const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Quantum Tribunal — ' + this.session.state.caseId + '</title><style>' + CERTIFICATE_STYLES + '</style><body>' + $('trial-cert-card').outerHTML + '</body></html>';
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    this.downloads.add(url);
    const link = $('trial-cert-download');
    link.href = url; link.download = this.session.state.caseId + '-tribunal-certificate.html';
  }

  destroy() {
    this.active = false; this.generation++;
    this.unsubscribeOptions?.();
    this.timers.forEach(clearTimeout); this.timers.clear();
    this.downloads.forEach(url => URL.revokeObjectURL(url)); this.downloads.clear();
  }
}

const CERTIFICATE_STYLES = `body{margin:0;background:#edf2f7;color:#0f172a;font:12px/1.5 ui-monospace,monospace}article{max-width:760px;margin:32px auto;padding:38px;background:white;border:2px solid #0284c7}h2{font-size:32px;line-height:1.1;margin:15px 0}h3{font-size:12px;margin-top:25px}.trial-cert-kicker,.trial-cert-signature,.trial-cert-facts span{font-size:9px;letter-spacing:.08em}.trial-cert-seal{display:flex;align-items:center;gap:12px;color:#991b1b;border:2px double;padding:12px;margin:20px 0;width:fit-content}.trial-cert-seal svg{width:32px;height:32px}.trial-cert-facts{display:grid;grid-template-columns:1fr 1fr;gap:18px}.trial-cert-facts span,.trial-cert-facts strong{display:block}.trial-cert-subject,.trial-cert-sentence{background:#f0f9ff;padding:14px;overflow-wrap:anywhere}.trial-cert-verdict{font-size:20px;font-weight:bold;border-block:2px solid #0f172a;padding:12px 0}li{margin:12px 0}li strong{font-size:10px}li p{margin:4px 0}.trial-cert-signature{border-top:1px solid #cbd5e1;padding-top:18px}.court-caption{font-size:10px;color:#475569}@page{size:A4;margin:14mm}@media print{body{background:white}article{margin:0;max-width:none;padding:16px}h2{font-size:27px}li,.trial-cert-sentence{break-inside:avoid}}`;
