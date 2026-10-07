import { validateOptions } from './validation.js';
import { CONTEXT_GROUPS } from './contexts.js';

export const ARCHIVE_STORAGE_KEY = 'oddm_blackbox_archives';
const copy = value => structuredClone(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const contexts = new Set(CONTEXT_GROUPS.flatMap(group => group.options.map(([id]) => id)));
const stats = value => value && ['mean', 'median', 'sd', 'tail'].every(key => finite(value[key]));
const pair = value => Array.isArray(value) && value.length === 2 && value.every(finite);
const validMatrix = matrix => matrix && validateOptions(matrix.a, matrix.b).valid &&
  [matrix.a, matrix.b].includes(matrix.winner) && matrix.loser === (matrix.winner === matrix.a ? matrix.b : matrix.a) &&
  stats(matrix.utilityA) && stats(matrix.utilityB) && ['probabilityA', 'probabilityB', 'regret', 'chaos'].every(key => finite(matrix[key])) &&
  contexts.has(matrix.context) && Number.isInteger(matrix.samples) && matrix.samples > 0 &&
  Array.isArray(matrix.ci) && matrix.ci.length === 2 && matrix.ci.every(finite) && typeof matrix.complexity === 'string';

function browserStorage() { try { return globalThis.localStorage; } catch { return undefined; } }

/** Compact historical snapshots only. Loading these records never restores live app state. */
export class BlackBoxStore {
  #records = [];
  #nextCase = 1;
  #storage;
  #listeners = new Set();
  constructor(storage = browserStorage(), now = () => new Date().toISOString()) {
    this.#storage = storage; this.now = now; this.persistent = Boolean(storage); this.notice = '';
    try {
      const raw = storage?.getItem(ARCHIVE_STORAGE_KEY);
      if (!raw) return;
      const log = JSON.parse(raw);
      if (log.version !== 1 || !Array.isArray(log.records)) throw Error('Unknown log format');
      const seen = new Set();
      for (const record of log.records) {
        if (!record || !/^CASE-\d{4,}$/.test(record.id) || seen.has(record.id) || !stamp(record.createdAt) || !validMatrix(record.matrix)) continue;
        seen.add(record.id);
        // Optional stage corruption cannot erase valid Matrix evidence.
        const clean = { id: record.id, createdAt: record.createdAt, matrix: copy(record.matrix), combats: [], trials: [] };
        clean.combats = (Array.isArray(record.combats) ? record.combats : []).filter(item => validCombat(item, clean.matrix)).map(copy);
        clean.trials = (Array.isArray(record.trials) ? record.trials : []).filter(validTrial).map(copy);
        this.#records.push(clean);
      }
      this.#nextCase = Math.max(Number.isSafeInteger(log.nextCase) ? log.nextCase : 1, ...this.#records.map(record => Number(record.id.slice(5)) + 1), 1);
      if (this.#records.length !== log.records.length) this.notice = 'Some unreadable case files were excluded. Valid evidence remains available.';
    } catch { this.notice = 'Stored log could not be read. New evidence will be collected in this session.'; }
  }
  get records() { return copy(this.#records).reverse(); }
  get(id) { const record = this.#records.find(item => item.id === id); return record ? copy(record) : null; }
  subscribe(listener) { this.#listeners.add(listener); listener(); return () => this.#listeners.delete(listener); }
  save() {
    try {
      if (!this.#storage) throw Error('Storage unavailable');
      this.#storage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify({ version: 1, nextCase: this.#nextCase, records: this.#records }));
      this.persistent = true; this.notice = '';
    } catch { this.persistent = false; this.notice = 'Browser storage is unavailable or full. Evidence remains in this session; export dossiers to keep it.'; }
    for (const listener of this.#listeners) listener();
  }
  recordMatrix(input, result) {
    const winner = input[result.winner], loser = input[result.winner === 'a' ? 'b' : 'a'];
    const probabilityA = result.winner === 'a' ? result.probability : 100 - result.probability;
    const matrix = { a: input.a, b: input.b, winner, loser, probabilityA, probabilityB: 100 - probabilityA,
      utilityA: copy(result.a), utilityB: copy(result.b), regret: result.regret, chaos: input.chaos,
      samples: result.samples, ci: copy(result.ci), context: input.context,
      complexity: (input.chaos > 75 ? 'UNHINGED' : input.chaos < 25 ? 'EXCESSIVE' : 'ABSURD') + ' / ' + input.chaos + '×' };
    if (!validMatrix(matrix)) throw Error('Only completed, valid Matrix telemetry can be archived.');
    const record = { id: 'CASE-' + String(this.#nextCase++).padStart(4, '0'), createdAt: this.now(), matrix, combats: [], trials: [] };
    this.#records.push(record); this.save(); return record.id;
  }
  appendCombat(id, combat) {
    const record = this.#records.find(item => item.id === id);
    if (!record || !validCombat(combat, record.matrix) || record.combats.some(item => item.attemptId === combat.attemptId)) return false;
    record.combats.push(copy(combat)); this.save(); return true;
  }
  appendTrial(id, trial) {
    const record = this.#records.find(item => item.id === id);
    if (!record || !validTrial(trial) || record.trials.some(item => item.attemptId === trial.attemptId)) return false;
    record.trials.push(copy(trial)); this.save(); return true;
  }
  purge() {
    // Keep the sequence monotonic: a pending old stage must never attach to a reused ID.
    this.#records = []; this.save();
  }
}

function validCombat(combat, matrix) {
  return combat && combat.seriesComplete === true && typeof combat.attemptId === 'string' && stamp(combat.completedAt) &&
    combat.names?.[0] === matrix.a && combat.names?.[1] === matrix.b &&
    [0, 1].includes(combat.winner) && combat.name === combat.names[combat.winner] &&
    finite(combat.duration) && finite(combat.health) && pair(combat.damage) && pair(combat.finalHP) &&
    finite(combat.maxCombo) && finite(combat.volatility) && ['ko', 'timeout', 'tiebreak'].includes(combat.reason) &&
    Array.isArray(combat.wins) && combat.wins.length === 2 && combat.wins.every(Number.isInteger) && combat.wins.reduce((a,b) => a+b, 0) === 3 &&
    Array.isArray(combat.history) && combat.history.length === 3 && combat.history.every((round, index) => round && round.round === index + 1 &&
      [0, 1].includes(round.winner) && round.name === combat.names[round.winner] && finite(round.health) && finite(round.duration) && typeof round.reason === 'string');
}
function validTrial(trial) {
  return trial && typeof trial.attemptId === 'string' && stamp(trial.issuedAt) && typeof trial.classificationName === 'string' &&
    ['caseId', 'decision', 'tier', 'verdict', 'sentence'].every(key => typeof trial[key] === 'string') && finite(trial.outrage) && trial.outrage >= 0 && trial.outrage <= 100 &&
    Array.isArray(trial.answers) && trial.answers.length === 3 && trial.answers.every(answer => answer &&
      ['questionText', 'human_text', 'void_response', 'bot_response'].every(key => typeof answer[key] === 'string') && finite(answer.appliedDelta));
}

/** A captured ticket links late stage completions to their originating run, never to the latest feed row. */
export class ArchivePipeline {
  constructor(store, options) {
    this.store = store; this.options = options; this.links = new Map(); this.attempt = 0;
  }
  recordMatrix(result, input, runId) {
    if (this.links.has(runId)) return this.links.get(runId);
    const live = this.options.state.matrixState;
    if (!live.hasRun || live.runId !== runId) return null;
    const id = this.store.recordMatrix(input, result); this.links.set(runId, id); return id;
  }
  ticket(kind, names = [this.options.state.a.trim(), this.options.state.b.trim()]) {
    const live = this.options.state.matrixState, id = this.links.get(live.runId), record = this.store.get(id);
    if (!live.hasRun || !record || names[0] !== record.matrix.a || names[1] !== record.matrix.b) return null;
    return Object.freeze({ caseId: id, names: Object.freeze([...names]), attemptId: id + ':' + kind + ':' + (++this.attempt) });
  }
  recordCombat(ticket, report) {
    if (!ticket || !report?.seriesComplete || report.history?.length !== 3 || report.names?.some((value, index) => value !== ticket.names[index])) return false;
    return this.store.appendCombat(ticket.caseId, { ...copy(report), attemptId: ticket.attemptId, completedAt: this.store.now() });
  }
  recordTrial(ticket, report) {
    if (!ticket || report?.phase !== 'verdict') return false;
    const { caseId, issuedAt, classificationName, decision, outrage, tier, outcome, verdict, sentence, answers } = report;
    return this.store.appendTrial(ticket.caseId, { caseId, issuedAt, classificationName, decision, outrage, tier, outcome, verdict, sentence, answers: copy(answers), attemptId: ticket.attemptId });
  }
}

export const ALTERNATE_TEMPLATES = Object.freeze([
  'In the alternate timeline where [LOSER] prevailed, local wildlife briefly gained sentience solely to applaud your life choices. Society remained stable, albeit mildly confused.',
  'Had [LOSER] claimed victory, quantum calculations indicate a 98.4% chance you would have felt 12% more mysterious while walking through doorways.',
  'If [LOSER] had won, top physicists confirm your ambient room temperature would have felt exactly 0.5 degrees more sophisticated.',
  'Selecting [LOSER] in Timeline B made synchronized smoke signals the internationally celebrated unit of daily productivity.',
  'If [LOSER] had taken the crown, gravity would still function normally, but your personal aura would score significantly higher in retro-futuristic charm.',
  'Selecting [LOSER] in Timeline B resulted in a 14% increase in friendly eye contact, accompanied by faint, distant accordion music.',
  'Had [LOSER] won the trial, your internet connection speed would remain identical, but your background aura would emit a subtle, aristocratic glow.',
  'In the parallel sector where [LOSER] won, houseplants in a 3-mile radius grew 2 millimeters taller out of pure, unprompted respect.',
  'A universe governed by [LOSER] awarded you an honorary doctorate in looking thoughtfully out of windows.',
  'With [LOSER] victorious, every elevator arrival became a tasteful orchestral entrance. The doors still opened on schedule.',
  'Choosing [LOSER] in the next dimension caused your calendar to compliment your excellent use of rectangles.',
  'In the realm of [LOSER], pigeons appointed you honorary Minister of Pleasant Coincidences. Meetings were mercifully optional.',
  'Had [LOSER] prevailed, your shadow would have developed impeccable posture and a surprisingly elegant signature.',
  'The timeline favoring [LOSER] reports a 23% improvement in your ability to nod knowingly at abstract diagrams.',
  'If [LOSER] won, nearby clocks would pause for a ceremonial millisecond of applause, then continue with perfect punctuality.',
  'Under the gentle administration of [LOSER], every doorway became a portal to exactly the same room, with 8% more theatrical gravitas.',
  'In the [LOSER] branch, your reflection earned a lifetime achievement award for consistently showing up.',
  'Scientists in the [LOSER] universe confirm that your personal theme music gained one tasteful triangle solo.'
]);
export function alternateOutcome(loser, random = Math.random) {
  const index = Math.max(0, Math.min(ALTERNATE_TEMPLATES.length - 1, Math.floor(random() * ALTERNATE_TEMPLATES.length)));
  return ALTERNATE_TEMPLATES[index].replaceAll('[LOSER]', () => loser);
}
export function dossierSummary(record) {
  const combat = record.combats.at(-1), trial = record.trials.at(-1);
  const winner = combat?.name || record.matrix.winner;
  return { combat, trial, winner, loser: winner === record.matrix.a ? record.matrix.b : record.matrix.a,
    source: combat ? '3-ROUND ARENA CHAMPION' : 'QUANTUM MATRIX', status: combat && trial ? 'FULL DOSSIER' : 'PARTIAL SIMULATION',
    stages: 1 + Number(Boolean(combat)) + Number(Boolean(trial)) };
}

/** The export is the exact viewed report; its alternate outcome stays stable until reopened. */
export function dossierText(record, alternate) {
  const m = record.matrix, s = dossierSummary(record), num = n => Number(n).toFixed(2);
  const lines = ['ODDM // UNIFIED POST-MORTEM DOSSIER', record.id + ' // ' + record.createdAt, s.status + ' // ' + s.stages + '/3 STAGES',
    'FINAL DECLARED WINNER: ' + s.winner, 'DIRECTIVE SOURCE: ' + s.source, 'POST-DECISION REGRET INDEX: ' + num(m.regret) + '% (Matrix estimate)', '',
    'STAGE 01 // QUANTUM MATRIX', 'OPTIONS: ' + m.a + ' vs ' + m.b, 'MATRIX WINNER: ' + m.winner,
    'VICTORY PROBABILITIES A / B: ' + num(m.probabilityA) + '% / ' + num(m.probabilityB) + '%',
    'MEAN UTILITY A / B: ' + num(m.utilityA.mean) + ' / ' + num(m.utilityB.mean),
    'MEDIAN A / B: ' + num(m.utilityA.median) + ' / ' + num(m.utilityB.median),
    'STANDARD DEVIATION A / B: ' + num(m.utilityA.sd) + ' / ' + num(m.utilityB.sd),
    'TAIL RISK A / B: ' + num(m.utilityA.tail) + '% / ' + num(m.utilityB.tail) + '%',
    'COMPLEXITY: ' + m.complexity, 'CONTEXT: ' + m.context + ' // SAMPLES: ' + m.samples, '', 'STAGE 02 // OPTION FIGHTER'];
  if (s.combat) {
    const c = s.combat;
    lines.push('CHAMPION: ' + c.name + ' // SERIES: ' + c.wins.join('-'), 'COMBAT DURATION: ' + num(c.duration) + 's',
      'DAMAGE A / B: ' + c.damage.map(num).join(' / '), 'FINAL RESOLUTION: ' + c.reason.toUpperCase(),
      'CHAMPION HP IN LAST WIN: ' + num(c.health) + '%', 'FINAL ROUND HP A / B: ' + (c.finalHP || []).map(num).join(' / '),
      'MAX COMBO: ' + c.maxCombo + ' // VOLATILITY: ' + num(c.volatility) + '%');
    for (const r of c.history) lines.push('ROUND ' + r.round + ': ' + r.name + ' // ' + num(r.duration) + 's // ' + num(r.health) + '% HP // ' + r.reason.toUpperCase());
  } else lines.push('[ STAGE BYPASSED // COMBAT SKIPPED ]', 'No completed three-round tournament was linked to this Matrix run.');
  lines.push('', 'STAGE 03 // QUANTUM TRIBUNAL');
  if (s.trial) {
    const t = s.trial;
    lines.push('COURT FILE: ' + t.caseId + ' // ' + t.issuedAt, 'CHARGE: ' + t.classificationName, 'INDICTMENT: ' + t.decision,
      'JURY VERDICT: ' + t.verdict, 'OUTRAGE: ' + t.outrage + '% // TIER: ' + t.tier, 'MANDATORY SENTENCE: ' + t.sentence);
    for (const [i, a] of t.answers.entries()) lines.push('Q' + (i+1) + ': ' + a.questionText, 'HUMAN: ' + a.human_text, 'V.O.I.D.: ' + a.void_response, 'B.O.T.: ' + a.bot_response, 'OUTRAGE DELTA: ' + a.appliedDelta + ' points');
  } else lines.push('[ STAGE BYPASSED // COURT DOCKET UNCALLED ]', 'No completed judicial decree was linked to this Matrix run.');
  lines.push('', 'MULTIVERSE SIMULATION // ALTERNATE TIMELINE CONSEQUESTS', alternate, '',
    'FICTIONAL FORENSICS // Simulated utility, arcade combat and scripted judicial satire.',
    'Regret is the original Matrix estimate. Jury outrage is a separate metric. Archives do not restore live choices.');
  return lines.join('\n');
}
