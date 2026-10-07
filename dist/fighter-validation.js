import { normalizeOption, isPluralMatch } from './validation.js';

/** Validate the live Matrix pair, independently of custom arena callsigns. */
export function fighterInputWarning({ a = '', b = '' }) {
  a = a.trim(); b = b.trim();
  // Missing choices take priority over lexical conflicts.
  if (!a && !b) return {
    header: '[ERR 404: VOID COMBAT PROHIBITED]',
    status: 'VOID COMBAT PROHIBITED',
    message: 'You cannot force two non-existent entities into gladiatorial combat. Return to [01 // QUANTUM MATRIX] and input two actual choices before staging a duel.',
    missing: 'a',
    actionLabel: 'GO TO MATRIX [01] TO INPUT BOTH OPTIONS'
  };
  if (!b) return {
    header: '[ERR 409: SOLITARY SHADOWBOXING DETECTED]',
    status: 'SOLITARY SHADOWBOXING DETECTED',
    message: `SINGLE-PLAYER WARFARE DENIED: '${a}' cannot wage a high-energy plasma duel against an imaginary ghost. Enter an actual rival in Option B on [01 // QUANTUM MATRIX] unless you want '${a}' to shadowbox itself into existential crisis.`,
    missing: 'b',
    actionLabel: 'GO TO MATRIX [01] TO INPUT OPTION B'
  };
  if (!a) return {
    header: '[ERR 409: UNOPPOSED GLADIATOR DETECTED]',
    status: 'UNOPPOSED GLADIATOR DETECTED',
    message: `VACUUM DUEL PREVENTED: '${b}' is standing alone in a cyberpunk arena awaiting an opponent that does not exist. Fighting the void yields a 100.0% win rate for non-existence. Provide an Option A rival on the homepage.`,
    missing: 'a',
    actionLabel: 'GO TO MATRIX [01] TO INPUT OPTION A'
  };
  const normA = normalizeOption(a), normB = normalizeOption(b);
  // Identity must precede plurality; punctuation-only differences follow Matrix routing.
  if (a.toLowerCase() === b.toLowerCase() || normA && normA === normB) return {
    header: '[ERR 422: TAUTOLOGICAL COMBAT PARADOX]',
    status: 'TAUTOLOGICAL COMBAT PARADOX',
    message: `CLONE WARFARE DENIED: '${a}' cannot fight '${b}'. Staging a high-stakes duel between two identical entities results in 100% self-inflicted damage and zero decision clarity. Enter two distinct options on [01 // QUANTUM MATRIX] to proceed.`,
    missing: 'b',
    actionLabel: 'GO TO MATRIX [01] TO DIFFERENTIATE OPTIONS'
  };
  if (isPluralMatch(normA, normB)) return {
    header: '[ERR 418: GRAMMATICAL DUPLICATION DETECTED]',
    status: 'GRAMMATICAL DUPLICATION DETECTED',
    message: `PLURALITY ILLUSION BLOCKED: '${a}' vs '${b}' is not a decision, it is just basic grammar. Adding an 's' to your indecision does not create a competitive choice. Return to [01 // QUANTUM MATRIX] and provide two genuinely different choices.`,
    missing: 'b',
    actionLabel: 'GO TO MATRIX [01] TO FIX GRAMMATICAL DUPLICATE'
  };
  return null;
}
