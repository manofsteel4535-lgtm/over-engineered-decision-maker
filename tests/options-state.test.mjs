import test from 'node:test';
import assert from 'node:assert/strict';
import { MatrixOptions } from '../dist/options-state.js';

const choices = (a = '', b = '') => ({ a, b, fightWinner: null, fightLoser: null, isLockedFromFighter: false, matrixState: { hasRun: false, winner: null, loser: null, runId: null } });

test('live Matrix choices notify every module immediately and preserve immutable snapshots', () => {
  const options = new MatrixOptions(), updates = [];
  assert.deepEqual(options.state, choices());
  const unsubscribe = options.subscribe(state => updates.push(state));
  options.setOptions({ a: 'Order Pizza', b: 'Eat Salad' });
  assert.equal(updates.length, 2); assert.deepEqual(updates[0], choices());
  assert.equal(Object.isFrozen(updates[1]), true);
  assert.deepEqual(updates[1], choices('Order Pizza', 'Eat Salad'));
  options.setOptions({ a: 'Order Pizza' }); assert.equal(updates.length, 2);
  options.setOptions({ b: 'Cook Noodles' }); assert.equal(updates.length, 3); assert.equal(options.state.a, 'Order Pizza');
  unsubscribe(); options.setOptions({ a: '', b: '' }); assert.equal(updates.length, 3);
  assert.deepEqual(new MatrixOptions().state, choices());
});

test('fresh page instances start blank and unlocked regardless of another live session', () => {
  const existing = new MatrixOptions(); existing.setOptions({ a: 'Burger', b: 'Pizza' }); existing.recordFight('Pizza', 'Burger');
  const reloaded = new MatrixOptions(), newTab = new MatrixOptions();
  assert.deepEqual(reloaded.state, choices()); assert.deepEqual(newTab.state, choices());
  reloaded.setOptions({ a: 'Salad', b: 'Tacos' });
  assert.deepEqual(newTab.state, choices());
  assert.equal(existing.state.fightWinner, 'Pizza'); assert.equal(existing.state.isLockedFromFighter, true);
});

test('KO verdicts notify every live module with the actual winner and loser in either position', () => {
  const options = new MatrixOptions(), snapshots = [];
  options.setOptions({ a: 'Moza R5', b: 'Fanatec DD' }); options.subscribe(state => snapshots.push(state));
  options.recordFight('Fanatec DD', 'Moza R5');
  assert.equal(options.state.fightWinner, 'Fanatec DD'); assert.equal(options.state.fightLoser, 'Moza R5'); assert.equal(options.state.isLockedFromFighter, true);
  assert.equal(snapshots[0].isLockedFromFighter, false); assert.equal(snapshots[1].isLockedFromFighter, true);
  const sealed = options.state; assert.throws(() => options.recordFight('', 'Moza R5')); assert.equal(options.state, sealed);
});

test('new choices or a fresh bout clear old locks; applying a verdict updates choices atomically', () => {
  const options = new MatrixOptions(); options.setOptions({ a: 'A', b: 'B' }); options.recordFight('B', 'A');
  options.setOptions({ a: 'A', b: 'B' }); assert.equal(options.state.isLockedFromFighter, true);
  options.setOptions({ a: 'Different A' }); assert.equal(options.state.isLockedFromFighter, false); assert.equal(options.state.fightWinner, null);
  const updates = []; options.subscribe(state => updates.push(state));
  options.recordFight('Custom B', 'Custom A', { a: 'Custom A', b: 'Custom B' });
  assert.equal(updates.length, 2); assert.equal(updates[1].a, 'Custom A'); assert.equal(updates[1].fightWinner, 'Custom B'); assert.equal(updates[1].isLockedFromFighter, true);
  options.clearFight(); assert.equal(options.state.isLockedFromFighter, false); assert.equal(options.state.a, 'Custom A');
});

test('legacy storage providers are never accessed, even when passed by an old caller', () => {
  let accesses = 0;
  const legacyProvider = new Proxy({}, { get() { accesses++; throw Error('Decision storage is forbidden'); } });
  const options = new MatrixOptions(legacyProvider);
  assert.deepEqual(options.state, choices());
  options.setOptions({ a: 'Burger', b: 'Pizza' }); options.recordFight('Pizza', 'Burger'); options.clearFight();
  assert.equal(accesses, 0); assert.deepEqual(options.state, choices('Burger', 'Pizza'));
});

test('live choices and combat names respect the Matrix sixty-character input boundary', () => {
  const options = new MatrixOptions();
  options.setOptions({ a: 'A'.repeat(65), b: 'B'.repeat(61) });
  assert.equal(options.state.a.length, 60); assert.equal(options.state.b.length, 60);
  options.recordFight('B'.repeat(61), 'A'.repeat(65));
  assert.equal(options.state.fightWinner.length, 60); assert.equal(options.state.fightLoser.length, 60);
  options.setOptions({ a: null, b: {} }); assert.deepEqual(options.state, choices());
});

test('completed Matrix runs publish explicit A/B winners independently of combat verdicts', () => {
  const options = new MatrixOptions(), input = { a: 'sushi', b: 'pasta' };
  options.setOptions(input);
  for (const side of ['a','b']) {
    const token = options.beginSimulation(); assert.equal(options.state.matrixState.hasRun, false);
    assert.equal(options.recordSimulation({ winner: side }, input, token), true);
    const evidence = options.state.matrixState;
    assert.equal(evidence.winner, input[side]); assert.equal(evidence.loser, input[side==='a'?'b':'a']);
    assert.equal(evidence.hasRun, true); assert.ok(Object.isFrozen(evidence));
    options.recordFight(input[side==='a'?'b':'a'],input[side]); assert.equal(options.state.matrixState,evidence);
    options.clearFight(); assert.equal(options.state.matrixState,evidence);
  }
  options.recordFight('Custom winner','Custom rival',{a:'Custom winner',b:'Custom rival'});
  assert.equal(options.state.matrixState.hasRun,false);
  assert.deepEqual(new MatrixOptions().state.matrixState, choices().matrixState);
});

test('edited choices, new runs and stale completions cannot authorize old Matrix evidence', () => {
  const options = new MatrixOptions(), input = { a: 'sushi', b: 'pasta' };
  options.setOptions(input); const first = options.beginSimulation();
  options.setOptions({b:'pizza'}); options.setOptions(input);
  assert.equal(options.recordSimulation({winner:'b'},input,first),false);
  const current = options.beginSimulation();
  assert.equal(options.recordSimulation({winner:'b'},input,current),true);
  const later = options.beginSimulation(); assert.equal(options.state.matrixState.hasRun,false);
  assert.equal(options.recordSimulation({winner:'a'},input,current),false);
  assert.throws(()=>options.recordSimulation({winner:'invalid'},input,later));
  assert.equal(options.state.matrixState.hasRun,false);
  assert.equal(options.recordSimulation({winner:'a'},{a:'wrong',b:'pasta'},later),false);
  assert.equal(options.recordSimulation({winner:'a'},{a:'sushi',b:'sushi'},later),false);
  assert.equal(options.recordSimulation({winner:'a'},input,later),true);
  options.setOptions({a:'Sushi'}); assert.equal(options.state.matrixState.hasRun,false);
});
