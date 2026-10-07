/** A scripted, satirical tribunal. Scoring is exactly the published answer weights. */
import { createExamination, generateDecree } from './trial-bank.js';
import { trialInputWarning } from './trial-validation.js';
export { QUESTIONS, VERDICT_TIERS, createExamination, outrageTier, generateDecree } from './trial-bank.js';
export const CASE_CLASSES = Object.freeze({
  finance: "Financial Recklessness Masked as 'Self-Care'",
  impulse: 'Impulse Buying Under the Influence of 2 AM Delusion',
  overengineered: 'Over-Engineered Solution to a Completely Non-Existent Problem',
  bank: 'Gross Negligence of Bank Account Integrity',
  upgrade: 'Unwarranted Tech Upgrade Driven Purely by Ego',
  craving: 'Biological Craving Overriding Basic Human Logic',
  thermodynamics: 'Defiance of Thermodynamic & Economic Common Sense',
  dopamine: 'Severe Dopamine Deficiency Exploitation',
  future: "Premeditated Disregard for Future Self's Well-being",
  paralysis: 'Acute Paralysis of the Executive Function Core',
  ego: 'Sub-Optimal Life Directives Executed with High Confidence'
});
export const INDICTMENT_TEMPLATES = Object.freeze([
  'Subject recklessly chose {winningOption} over {losingOption} without adult supervision.',
  'Subject committed financial and psychological capital to {winningOption} instead of the rational alternative {losingOption}.',
  'In a moment of questionable cognitive function, Subject selected {winningOption} while completely ignoring {losingOption}.',
  'Subject surrendered to primitive dopamine cravings by picking {winningOption} over {losingOption}.',
  'Subject executed a high-risk maneuver by committing to {winningOption} and casting {losingOption} into the void.',
  'The quantum core detected a severe logic deficit when Subject preferred {winningOption} over {losingOption}.'
]);

/** Single-pass token injection preserves literal user text, including other tokens. */
export function generateIndictment(options, random = Math.random, previousIndex = -1) {
  if (trialInputWarning(options)) throw new Error('A valid completed Matrix simulation is required for indictment.');
  const { winner: winningOption, loser: losingOption, runId } = options.matrixState;
  const templates = INDICTMENT_TEMPLATES;
  const exclude = Number.isInteger(previousIndex) && previousIndex >= 0 && previousIndex < templates.length;
  const size = templates.length - Number(exclude);
  let index = Math.max(0, Math.min(size - 1, Math.floor(random() * size)));
  if (exclude && index >= previousIndex) index++;
  const choices = { '{winningOption}': winningOption, '{losingOption}': losingOption };
  return { winningOption, losingOption, runId, index, sentence: templates[index].replace(/\{(?:winningOption|losingOption)\}/g, token => choices[token]) };
}
export const outrageLabel = value => value >= 80 ? 'RIOTS IN THE STREETS' : value > 50 ? 'HOSTILE AUDIENCE' : value > 20 ? 'RESTLESS PUBLIC' : 'PASSIVE';


export class TrialSession {
  constructor(random = Math.random) { this.random = random; this.caseCount = 0; this.reset(); }
  reset() {
    this.state = { phase: 'indictment', decision: '', classification: '', question: 0, questions: [], outrage: 0, answers: [], verdict: null, sentence: null, tier: null, caseId: null, issuedAt: null };
    return this.state;
  }
  start(decision, classification, now = new Date().toISOString()) {
    const subject = String(decision || '').trim();
    if (this.state.phase !== 'indictment') throw new Error('Trial already in progress');
    if (!subject || subject.length > 240 || !Object.hasOwn(CASE_CLASSES, classification)) throw new Error('Invalid trial evidence');
    this.state = { ...this.state, phase: 'examination', decision: subject, classification, questions: createExamination(this.random), caseId: 'QTR-' + String(++this.caseCount).padStart(4, '0'), openedAt: now };
    return this.state;
  }
  answer(optionIndex, expectedQuestion, random = this.random, now = new Date().toISOString()) {
    const state = this.state;
    // Captured question IDs reject stale button events and duplicate testimony.
    if (state.phase !== 'examination' || expectedQuestion !== state.question) throw new Error('Testimony out of sequence');
    const question = state.questions[state.question];
    const answer = question?.options[optionIndex];
    if (!Number.isInteger(optionIndex) || !answer) throw new Error('Invalid testimony');
    const outrage = Math.max(0, Math.min(100, state.outrage + answer.outrage_delta));
    const evidence = Object.freeze({ question: state.question, questionId: question.id, questionText: question.text, option: optionIndex, ...answer, appliedDelta: outrage - state.outrage, outrage });
    const next = { ...state, outrage, question: state.question + 1, answers: [...state.answers, evidence] };
    if (next.question === state.questions.length) {
      next.phase = 'verdict'; Object.assign(next, generateDecree(outrage, random)); next.issuedAt = now;
    }
    this.state = next;
    return next;
  }
  certificate() {
    if (this.state.phase !== 'verdict') throw new Error('No judicial decree issued');
    return { ...this.state, classificationName: CASE_CLASSES[this.state.classification], answers: this.state.answers.map(answer => ({ ...answer })) };
  }
}
