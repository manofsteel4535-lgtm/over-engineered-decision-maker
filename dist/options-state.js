/** Volatile shared choices: one instance per page, never restored or written to storage. */
import { validateOptions } from './validation.js';
const clean = value => typeof value === 'string' ? value.slice(0, 60) : '';
const noFight = { fightWinner: null, fightLoser: null, isLockedFromFighter: false };
const idleMatrix = () => Object.freeze({ hasRun: false, winner: null, loser: null, runId: null });
export class MatrixOptions {
  constructor() {
    this.listeners = new Set();
    this.simulationEpoch = 0;
    this.state = Object.freeze({ a: '', b: '', ...noFight, matrixState: idleMatrix() });
  }
  setOptions({ a = this.state.a, b = this.state.b }) {
    const next = { a: clean(a), b: clean(b) };
    if (next.a === this.state.a && next.b === this.state.b) return;
    // A changed decision pair starts a new pipeline; an old arena verdict cannot lock it.
    this.simulationEpoch++;
    this.commit({ ...next, ...noFight, matrixState: idleMatrix() });
  }
  beginSimulation() {
    const token = ++this.simulationEpoch;
    this.commit({ ...this.state, matrixState: idleMatrix() });
    return token;
  }
  recordSimulation(result, input, token) {
    // Reject stale completions, including a pair edited away and back during a run.
    if (token !== this.simulationEpoch || !validateOptions(input.a, input.b).valid ||
        input.a.trim() !== this.state.a.trim() || input.b.trim() !== this.state.b.trim()) return false;
    if (!['a', 'b'].includes(result.winner)) throw new Error('A Matrix result requires an explicit winning option.');
    const winner = input[result.winner].trim(), loser = input[result.winner === 'a' ? 'b' : 'a'].trim();
    this.commit({ ...this.state, matrixState: Object.freeze({ hasRun: true, winner, loser, runId: token }) });
    return true;
  }
  recordFight(winner, loser, choices = null) {
    const fightWinner = clean(winner).trim(), fightLoser = clean(loser).trim();
    if (!fightWinner || !fightLoser) throw new Error('A combat verdict requires both fighters.');
    // Optional choices make APPLY WINNER an atomic update of the pair and its verdict.
    const nextChoices = choices ? { a: clean(choices.a), b: clean(choices.b) } : { a: this.state.a, b: this.state.b };
    const changed = nextChoices.a !== this.state.a || nextChoices.b !== this.state.b;
    if (changed) this.simulationEpoch++;
    this.commit({ ...this.state, ...nextChoices, matrixState: changed ? idleMatrix() : this.state.matrixState, fightWinner, fightLoser, isLockedFromFighter: true });
  }
  clearFight() {
    if (this.state.isLockedFromFighter) this.commit({ ...this.state, ...noFight });
  }
  commit(next) {
    this.state = Object.freeze(next);
    for (const listener of this.listeners) listener(this.state);
  }
  subscribe(listener) {
    this.listeners.add(listener); listener(this.state);
    return () => this.listeners.delete(listener);
  }
}
