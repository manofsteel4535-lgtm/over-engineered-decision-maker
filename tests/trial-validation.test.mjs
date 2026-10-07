import test from 'node:test';
import assert from 'node:assert/strict';
import { trialInputWarning } from '../dist/trial-validation.js';

test('court warnings follow all six precedence rules and route to the exact correction target', () => {
  for(const [a,b,code,target,label] of [
    [' ','','404','option-a','INPUT BOTH OPTIONS'],
    ['','pasta','409: UNILATERAL','option-a','INPUT OPTION A'],
    ['sushi',' ','409: ABSENT','option-b','INPUT OPTION B'],
    [' Sushi ','SUSHI!','422','option-b','DIFFERENTIATE OPTIONS'],
    ['sushi','sushis','418','option-b','FIX GRAMMATICAL DUPLICATE'],
    ['sushi','pasta','402','run-button','RUN SIMULATION']
  ]) {
    for(const hasRun of [false,true]) {
      const warning=trialInputWarning({a,b,matrixState:{hasRun}});
      assert.ok(warning.header.includes(code)); assert.equal(warning.target,target); assert.equal(warning.actionLabel,'GO TO MATRIX [01] TO '+label);
    }
  }
});
test('completed results must belong to the current valid pair and arena results cannot bypass the gate', () => {
  const pair={a:'sushi',b:'pasta'}, combat={fightWinner:'pasta',fightLoser:'sushi',isLockedFromFighter:true};
  assert.ok(trialInputWarning({...pair,...combat}).header.includes('402'));
  for(const winner of ['sushi','pasta']) {
    const matrixState={hasRun:true,winner,loser:winner==='sushi'?'pasta':'sushi'};
    assert.equal(trialInputWarning({...pair,matrixState}),null);
    assert.ok(trialInputWarning({...pair,matrixState:{...matrixState,loser:winner}}).header.includes('402'));
    assert.ok(trialInputWarning({...pair,matrixState:{...matrixState,winner:'stale'}}).header.includes('402'));
  }
});
test('court normalization and literal warning injection preserve Matrix validation semantics', () => {
  for(const [a,b] of [['box','boxes'],['sandwich','sandwiches'],['berry','berries'],['taco!','TACOS.']]) {
    assert.ok(trialInputWarning({a,b}).header.includes('418')); assert.ok(trialInputWarning({a:b,b:a}).header.includes('418'));
  }
  const literal="<b>pasta</b> $& [Option A]";
  assert.ok(trialInputWarning({a:'',b:literal}).message.includes(literal));
  assert.ok(trialInputWarning({a:literal,b:''}).message.includes(literal));
  assert.ok(trialInputWarning({a:'...',b:'!'}).header.includes('404'));
});
