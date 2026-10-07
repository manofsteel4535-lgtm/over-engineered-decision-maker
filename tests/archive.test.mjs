import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BlackBoxStore, ArchivePipeline, ARCHIVE_STORAGE_KEY, ALTERNATE_TEMPLATES, alternateOutcome, dossierSummary, dossierText } from '../dist/archive-engine.js';
import { MatrixOptions } from '../dist/options-state.js';
import { DecisionEngine } from '../dist/engine.js';
import { FighterEngine } from '../dist/fighter-engine.js';
import { TrialSession, generateIndictment } from '../dist/trial-engine.js';
import { MODULES } from '../dist/navigation.js';

function random(seed = 42) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function setup() {
  const data = new Map(), storage = { getItem: k => data.get(k), setItem: (k,v) => data.set(k,v) };
  const options = new MatrixOptions(), store = new BlackBoxStore(storage, () => '2026-10-07T10:00:00.000Z');
  return { data, storage, options, store, pipeline: new ArchivePipeline(store, options) };
}
async function matrix(env, a = 'Moza R5', b = 'Fanatec DD') {
  const input = { a, b, chaos: 42, context: 'workplace-lunch' };
  env.options.setOptions(input); const token = env.options.beginSimulation();
  const result = await DecisionEngine.run(input, () => {}, random(), () => Promise.resolve());
  assert.equal(env.options.recordSimulation(result, input, token), true);
  return { id: env.pipeline.recordMatrix(result, input, token), token, result, input };
}
function combat(names) {
  const engine = new FighterEngine(random(77)); engine.start(...names);
  for (let round = 1; round <= 3; round++) {
    for (let steps = 0; engine.phase !== 'result' && steps < 10000; steps++) engine.update(.05);
    assert.equal(engine.phase, 'result'); if (round < 3) engine.nextRound();
  }
  return { ...engine.seriesReport, names, finalHP: engine.fighters.map(f => f.hp), mode: engine.mode };
}
function trial(options) {
  const session = new TrialSession(random(2)); session.start(generateIndictment(options.state, random()).sentence, 'finance');
  for (let index = 0; index < 3; index++) session.answer(0, index);
  return session.certificate();
}

test('Matrix alone immediately persists a compact partial dossier with both skipped-stage badges', async () => {
  const env = setup(), { id, token, result } = await matrix(env);
  assert.equal(id, 'CASE-0001'); assert.equal(env.pipeline.recordMatrix(result, {a:'Moza R5',b:'Fanatec DD'}, token), id);
  assert.equal(env.store.records.length, 1);
  const record = env.store.get(id), summary = dossierSummary(record);
  assert.equal(summary.status, 'PARTIAL SIMULATION'); assert.equal(summary.stages, 1);
  assert.equal(record.matrix.winner, env.options.state.matrixState.winner);
  assert.equal(record.matrix.probabilityA + record.matrix.probabilityB, 100);
  const text = dossierText(record, alternateOutcome(summary.loser, () => 0));
  assert.match(text, /STAGE BYPASSED \/\/ COMBAT SKIPPED/); assert.match(text, /STAGE BYPASSED \/\/ COURT DOCKET UNCALLED/);
  assert.deepEqual([...env.data.keys()], [ARCHIVE_STORAGE_KEY]);
  assert.equal(env.data.get(ARCHIVE_STORAGE_KEY).includes('distributionA'), false);
  assert.deepEqual(new BlackBoxStore(env.storage).get(id), record);
  assert.equal(new MatrixOptions().state.a, ''); assert.equal(new MatrixOptions().state.matrixState.hasRun, false);
});

test('real Matrix, autonomous three-round combat and three-question Trial aggregate into a persistent full dossier', async () => {
  const env = setup(), { id, input } = await matrix(env);
  const combatTicket = env.pipeline.ticket('combat'), trialTicket = env.pipeline.ticket('trial');
  const arena = combat([input.a,input.b]), court = trial(env.options);
  assert.equal(env.pipeline.recordCombat(combatTicket, arena), true);
  assert.equal(env.pipeline.recordTrial(trialTicket, court), true);
  const record = env.store.get(id), summary = dossierSummary(record);
  assert.equal(summary.status, 'FULL DOSSIER'); assert.equal(summary.stages, 3); assert.equal(summary.winner, arena.name);
  assert.equal(summary.loser, arena.names[1-arena.winner]);
  assert.equal(summary.combat.duration, arena.history.reduce((sum,r) => sum+r.duration, 0));
  assert.deepEqual(summary.combat.damage, arena.damage); assert.equal(summary.trial.verdict, court.verdict);
  const alternate = alternateOutcome(summary.loser, () => .5), text = dossierText(record, alternate);
  assert.ok(text.includes(court.classificationName)); assert.ok(text.includes(court.answers[0].void_response));
  assert.ok(text.includes(court.sentence)); assert.ok(text.includes(alternate)); assert.equal(text.includes('[ STAGE BYPASSED'), false);
  assert.deepEqual(new BlackBoxStore(env.storage).get(id), record);
});

test('captured stage tickets attach to their originating run even after a newer Matrix result; repeats are idempotent', async () => {
  const env = setup(), first = await matrix(env, 'Pizza', 'Salad'), ticket = env.pipeline.ticket('combat');
  const report = combat(['Pizza','Salad']);
  const next = await matrix(env, 'MacBook', 'ThinkPad');
  assert.notEqual(first.id, next.id); assert.equal(env.pipeline.recordCombat(ticket, report), true);
  assert.equal(env.pipeline.recordCombat(ticket, report), false);
  assert.equal(env.store.get(first.id).combats.length, 1); assert.equal(env.store.get(next.id).combats.length, 0);
  assert.deepEqual(env.store.records.map(r => r.id), [next.id, first.id]);
});

test('unrun choices, custom fighters, incomplete series and invalid decisions cannot fabricate archive evidence', async () => {
  const env = setup(); env.options.setOptions({a:'Pen',b:'Pencil'});
  assert.equal(env.pipeline.ticket('combat'), null); assert.equal(env.pipeline.recordMatrix({}, {}, 99), null);
  const { id } = await matrix(env, 'Pen', 'Pencil');
  assert.equal(env.pipeline.ticket('combat', ['Custom Pen', 'Custom Pencil']), null);
  assert.equal(env.pipeline.recordCombat(env.pipeline.ticket('combat'), {seriesComplete:false}), false);
  assert.equal(env.pipeline.recordTrial(env.pipeline.ticket('trial'), {phase:'examination'}), false);
  assert.equal(dossierSummary(env.store.get(id)).stages, 1);
  assert.throws(() => env.store.recordMatrix({a:'Pen',b:'Pen',chaos:42}, {winner:'a',a:{},b:{},ci:[],probability:60}));
  assert.equal(env.store.records.length, 1);
});

test('appeals keep prior sealed verdicts and latest decree; Trial-only cases stay partial', async () => {
  const env = setup(), { id } = await matrix(env);
  const report = trial(env.options), ticket = env.pipeline.ticket('trial');
  assert.equal(env.pipeline.recordTrial(ticket, report), true); assert.equal(env.pipeline.recordTrial(ticket, report), false);
  assert.equal(env.pipeline.recordTrial(env.pipeline.ticket('trial'), {...report, verdict:'RELUCTANT ACQUITTAL UNDER DURESS'}), true);
  const record = env.store.get(id), summary = dossierSummary(record);
  assert.equal(record.trials.length, 2); assert.equal(summary.trial.verdict, 'RELUCTANT ACQUITTAL UNDER DURESS');
  assert.equal(summary.status, 'PARTIAL SIMULATION'); assert.equal(summary.stages, 2);
});

test('purge preserves monotonic case IDs and rejects late completions for deleted records', async () => {
  const env = setup(), first = await matrix(env), ticket = env.pipeline.ticket('trial'), report = trial(env.options);
  env.store.purge(); assert.equal(env.store.records.length, 0);
  const next = await matrix(env); assert.equal(next.id, 'CASE-0002');
  assert.equal(env.pipeline.recordTrial(ticket, report), false); assert.equal(env.store.get(first.id), null);
  assert.equal(new BlackBoxStore(env.storage).records.length, 1);
});

test('denied, full and malformed storage preserve session use; returned snapshots cannot mutate evidence', async () => {
  const env = setup(), { id } = await matrix(env);
  const snapshot = env.store.get(id); snapshot.matrix.winner = 'tampered';
  assert.notEqual(env.store.get(id).matrix.winner, 'tampered');
  const denied = {getItem(){throw Error('denied')},setItem(){throw Error('full')}};
  const fallback = new BlackBoxStore(denied); assert.equal(fallback.records.length, 0);
  fallback.recordMatrix({a:'A',b:'B',chaos:42,context:'workplace-lunch'}, {winner:'a',a:{mean:50,median:50,sd:4,tail:0},b:{mean:49,median:49,sd:4,tail:0},probability:61,regret:39,samples:10000,ci:[60,62]});
  assert.equal(fallback.persistent, false); assert.equal(fallback.records.length, 1); assert.match(fallback.notice, /session/);
  const malformed = new BlackBoxStore({getItem:()=>'{broken'}); assert.equal(malformed.records.length, 0); assert.match(malformed.notice, /could not be read/);
  const raw = JSON.parse(env.data.get(ARCHIVE_STORAGE_KEY)); raw.records[0].combats = [{name:'bad data'}]; raw.records.push({id:'invalid'});
  env.data.set(ARCHIVE_STORAGE_KEY, JSON.stringify(raw)); const restored = new BlackBoxStore(env.storage);
  assert.equal(restored.records.length, 1); assert.equal(restored.get(id).combats.length, 0);
  raw.records[0].matrix.context = 'invalid-context';
  assert.equal(new BlackBoxStore({getItem:()=>JSON.stringify(raw)}).records.length, 0);
});

test('every universal alternate template is reachable and inserts literal names without interpreting tokens or markup', () => {
  const loser = '$& <Pen> [LOSER]';
  assert.ok(ALTERNATE_TEMPLATES.length >= 16);
  for (let i = 0; i < ALTERNATE_TEMPLATES.length; i++) {
    const text = alternateOutcome(loser, () => (i+.1)/ALTERNATE_TEMPLATES.length);
    assert.equal(text, ALTERNATE_TEMPLATES[i].replaceAll('[LOSER]', () => loser));
    for (const item of ['Taco', 'Laptop', 'Shoes', 'Fragrance', 'Car part']) assert.ok(alternateOutcome(item,()=> (i+.1)/ALTERNATE_TEMPLATES.length).includes(item));
  }
});

test('navigation terminates at Archives 04 with exactly four tabs and matching mounted panel targets', async () => {
  assert.deepEqual(Object.keys(MODULES), ['MATRIX','FIGHTER','TRIAL','ARCHIVES']);
  assert.equal(MODULES.ARCHIVES.index, '04');
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/role="tab"/g)||[]).length, 4);
  assert.match(html, /data-module="ARCHIVES"[^>]*aria-controls="archives-view"/);
  assert.match(html, /id="archives-view"[^>]*aria-labelledby="module-archives"/);
  assert.equal(html.includes('standby-view'), false); assert.equal(html.includes('module-collider'), false);
});
