import test from 'node:test';
import assert from 'node:assert/strict';
import { TrialSession, QUESTIONS, VERDICT_TIERS, CASE_CLASSES, INDICTMENT_TEMPLATES, generateIndictment, createExamination, outrageTier, generateDecree } from '../dist/trial-engine.js';
function seeded(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }
const start = (seed = 1) => { const trial = new TrialSession(seeded(seed)); trial.start('Bought a Moza R5 instead of paying rent', 'finance'); return trial; };
const matrixEvidence = (a, b, winner = b) => ({ a, b, matrixState: { hasRun: true, winner: winner.trim(), loser: (winner===b?a:b).trim(), runId: 1 } });
function findTrial(predicate) {
  for (let seed = 1; seed <= 1000; seed++) { const trial = start(seed); if (predicate(trial.state.questions)) return trial; }
  throw new Error('No matching seeded examination');
}

test('case validation leaves the initial state intact on invalid evidence', () => {
  for (const [decision,classification] of [[' ','finance'],['A'.repeat(241),'finance'],['A decision','missing'],['A decision','']]) {
    const trial=new TrialSession(); assert.throws(()=>trial.start(decision,classification),/Invalid trial/); assert.equal(trial.state.phase,'indictment'); assert.equal(trial.caseCount,0);
  }
  const trial=new TrialSession(); trial.start('  A purchase  ','upgrade'); assert.equal(trial.state.decision,'A purchase'); assert.throws(()=>trial.start('Another','ego'),/already/);
});

test('all six indictment templates inject both choices literally and fit the evidence limit', () => {
  for (let index = 0; index < INDICTMENT_TEMPLATES.length; index++) {
    const draft = generateIndictment(matrixEvidence(' Order Pizza ', ' Eat Salad '), () => (index + .1) / 6);
    assert.equal(draft.index, index); assert.ok(draft.sentence.indexOf('Eat Salad') < draft.sentence.indexOf('Order Pizza'));
    const literal = generateIndictment(matrixEvidence('$& {winningOption} <b>Choice A</b>', 'B\'s "alternative"'), () => (index + .1) / 6);
    assert.ok(literal.sentence.includes('$& {winningOption} <b>Choice A</b>')); assert.ok(literal.sentence.includes('B\'s "alternative"'));
    const longest = generateIndictment(matrixEvidence('A'.repeat(60), 'B'.repeat(60)), () => (index + .1) / 6);
    const trial = new TrialSession(); trial.start(longest.sentence, 'finance'); assert.ok(longest.sentence.length <= 240);
  }
});

test('invalid or unrun choices cannot generate a dossier and rerolls preserve the Matrix winner', () => {
  for (const options of [{ a: '', b: ' ' }, { a: 'Pizza', b: '' }, { a: '', b: 'Salad' }]) {
    assert.throws(()=>generateIndictment(options),/completed Matrix/);
  }
  assert.throws(()=>generateIndictment({a:'sushi',b:'pasta'}),/completed Matrix/);
  for (let previous = 0; previous < 6; previous++) for (let next = 0; next < 5; next++) {
    const draft = generateIndictment(matrixEvidence('A', 'B'), () => (next + .1) / 5, previous);
    assert.notEqual(draft.index, previous);
  }
});

test('every expanded charge is valid and a sealed indictment survives source changes', () => {
  assert.equal(Object.keys(CASE_CLASSES).length, 11);
  for (const classification of Object.keys(CASE_CLASSES)) {
    const options = matrixEvidence('Pizza', 'Salad'), draft = generateIndictment(options, () => 0);
    const trial = new TrialSession(); assert.equal(trial.state.classification, ''); trial.start(draft.sentence, classification);
    options.a = 'New choice'; assert.throws(()=>generateIndictment(options),/completed Matrix/);
    for (let question = 0; question < 3; question++) trial.answer(0, question);
    assert.equal(trial.certificate().decision, draft.sentence); assert.equal(trial.certificate().classificationName, CASE_CLASSES[classification]);
    trial.reset(); assert.equal(trial.state.classification, '');
  }
});

test('every dossier uses the explicit Matrix winner even when combat selects the opposite option', () => {
  for (const winner of ['sushi','pasta']) for(let index=0;index<6;index++) {
    const state = { ...matrixEvidence('sushi','pasta',winner), fightWinner: winner==='sushi'?'pasta':'sushi', fightLoser:winner, isLockedFromFighter:true };
    const draft = generateIndictment(state, () => (index+.1)/6);
    assert.equal(draft.winningOption,winner); assert.equal(draft.losingOption,winner==='sushi'?'pasta':'sushi');
    assert.ok(draft.sentence.indexOf(draft.winningOption)<draft.sentence.indexOf(draft.losingOption));
  }
  const corrected = generateIndictment(matrixEvidence('sushi','pasta'),()=>3.1/6);
  assert.equal(corrected.sentence,'Subject surrendered to primitive dopamine cravings by picking pasta over sushi.');
});
test('all 27 answer paths across 100 sampled examinations use exact testimony and tier weights', () => {
  const scores = new Set();
  for (let seed = 1; seed <= 100; seed++) for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++) {
    const trial=start(seed); let expected=0;
    for(const [question,option] of [a,b,c].entries()) {
      const source = trial.state.questions[question], response = source.options[option], previous = expected;
      expected=Math.max(0,Math.min(100,expected+response.outrage_delta));
      const result=trial.answer(option,question,()=>0);
      assert.equal(result.outrage,expected); assert.equal(result.answers.length,question+1); assert.equal(result.phase,question===2?'verdict':'examination');
      const evidence = result.answers[question];
      for (const key of ['human_text', 'void_response', 'bot_response', 'outrage_delta']) assert.equal(evidence[key], response[key]);
      assert.equal(evidence.questionId, source.id); assert.equal(evidence.questionText, source.text); assert.equal(evidence.appliedDelta, expected - previous);
    }
    const tier = outrageTier(expected); scores.add(expected);
    assert.equal(trial.state.tier, tier.id); assert.equal(trial.state.verdict,tier.headlines[0]); assert.equal(trial.state.sentence,tier.sentences[0]);
    assert.equal(trial.state.outcome,expected<=25?'pardoned':'guilty');
  }
  assert.ok(scores.has(15)); assert.ok(scores.has(100));
});
test('honesty reduces outrage and a capped final increase records the applied delta', () => {
  const lenient=findTrial(questions=>questions[0].options.some(option=>option.outrage_delta<0));
  const negative = lenient.state.questions[0].options.findIndex(option=>option.outrage_delta<0);
  const lowered = lenient.answer(negative,0); assert.equal(lowered.outrage,0); assert.equal(lowered.answers[0].appliedDelta,0); assert.ok(lowered.answers[0].outrage_delta<0);
  const maximum=findTrial(questions=>questions.reduce((sum,q)=>sum+Math.max(...q.options.map(o=>o.outrage_delta)),0)>100);
  for (let question=0;question<3;question++) {
    const options=maximum.state.questions[question].options;
    maximum.answer(options.findIndex(o=>o.outrage_delta===Math.max(...options.map(o=>o.outrage_delta))),question);
  }
  assert.equal(maximum.state.outrage,100); assert.ok(maximum.state.answers[2].appliedDelta<maximum.state.answers[2].outrage_delta);
});
test('stale, invalid and post-verdict testimony cannot advance or overwrite a case', () => {
  const trial=start();trial.answer(0,0);const state=trial.state;
  for(const [option,question]of [[0,0],[3,1],[-1,1],[1.5,1]]) {assert.throws(()=>trial.answer(option,question));assert.equal(trial.state,state);}
  trial.answer(0,1);trial.answer(0,2);const verdict=trial.state;assert.throws(()=>trial.answer(0,3));assert.equal(trial.state,verdict);
});
test('certificate evidence preserves sampled questions and appeal resets remain isolated', () => {
  const trial=start();assert.throws(()=>trial.certificate(),/No judicial/);trial.answer(0,0);trial.answer(0,1);trial.answer(0,2);
  const certificate=trial.certificate(); certificate.answers[0].human_text='Changed snapshot'; assert.notEqual(trial.state.answers[0].human_text,certificate.answers[0].human_text);
  const originalQuestions = trial.state.questions;
  assert.equal(certificate.answers[0].questionText, originalQuestions[0].text);
  trial.reset();assert.equal(trial.state.outrage,0);assert.deepEqual(trial.state.answers,[]);assert.deepEqual(trial.state.questions,[]);assert.equal(trial.state.verdict,null);assert.equal(trial.state.decision,'');assert.throws(()=>trial.certificate());trial.start('A new choice','ego');assert.equal(trial.state.caseId,'QTR-0002');
  assert.notDeepEqual(trial.state.questions, originalQuestions); assert.ok(outrageTier(certificate.outrage).headlines.includes(certificate.verdict));
});

test('ten-question bank samples unique questions and responses without modifying the repository', () => {
  assert.deepEqual(QUESTIONS.map(q=>q.id),[1,2,3,4,5,6,7,8,9,10]);
  assert.deepEqual(QUESTIONS.map(q=>q.options.map(o=>o.outrage_delta)),[[30,15,40,20],[25,-10,35],[20,30,-10],[35,25,10],[30,20,40],[35,10,25],[20,-5,30],[35,15,40],[25,30,-15],[35,20,15]]);
  const original=JSON.stringify(QUESTIONS), seenQuestions=new Set(), seenResponses=new Set(), orders=new Set(), researchSubsets=new Set();
  for(let seed=1;seed<=500;seed++) {
    const exam=createExamination(seeded(seed)); assert.equal(exam.length,3); assert.equal(new Set(exam.map(q=>q.id)).size,3);
    orders.add(exam.map(q=>q.id).join(','));
    for(const q of exam) {
      seenQuestions.add(q.id); assert.equal(q.options.length,3); assert.equal(new Set(q.options.map(o=>o.human_text)).size,3);
      for(const option of q.options) { seenResponses.add(option.human_text); assert.ok(QUESTIONS[q.id-1].options.includes(option)); }
      if(q.id===1) researchSubsets.add(q.options.map(o=>o.human_text).sort().join('|'));
    }
    assert.throws(()=>{exam[0].options[0].outrage_delta=999;});
  }
  assert.equal(seenQuestions.size,10); assert.equal(seenResponses.size,31); assert.equal(researchSubsets.size,4); assert.ok(orders.size>100); assert.equal(JSON.stringify(QUESTIONS),original);
});

test('decree thresholds and all independent headline/sentence combinations stay inside their tier', () => {
  for(const [score,tierIndex] of [[0,0],[15,0],[25,0],[26,1],[50,1],[65,1],[66,2],[100,2]]) {
    const tier=VERDICT_TIERS[tierIndex]; assert.equal(outrageTier(score),tier);
    for(let h=0;h<3;h++)for(let s=0;s<4;s++) {
      const draws=[(h+.1)/3,(s+.1)/4]; const decree=generateDecree(score,()=>draws.shift());
      assert.equal(decree.verdict,tier.headlines[h]); assert.equal(decree.sentence,tier.sentences[s]); assert.equal(decree.tier,tier.id); assert.equal(draws.length,0);
    }
  }
});
