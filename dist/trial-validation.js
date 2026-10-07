import { normalizeOption, isPluralMatch } from './validation.js';

/** Court eligibility uses the live Matrix pair before inspecting result provenance. */
export function trialInputWarning({ a = '', b = '', matrixState = {} }) {
  a = a.trim(); b = b.trim();
  const normA = normalizeOption(a), normB = normalizeOption(b);
  if (!normA && !normB) return {
    header: '[ERR 404: VACUOUS PROSECUTION VOID]',
    message: 'MOTION TO DISMISS: The court refuses to try a case where both the accused and the alternative are non-existent entities. Return to [01 // QUANTUM MATRIX] and present two real choices.',
    target: 'option-a', actionLabel: 'GO TO MATRIX [01] TO INPUT BOTH OPTIONS'
  };
  if (!normA) return {
    header: '[ERR 409: UNILATERAL INDICTMENT DENIED]',
    message: `INSUFFICIENT DOCKET DATA: Plaintiff '${b}' stands alone without an adversary. A tribunal requires two opposing forces to prosecute irrationality. Enter Option A on [01 // QUANTUM MATRIX].`,
    target: 'option-a', actionLabel: 'GO TO MATRIX [01] TO INPUT OPTION A'
  };
  if (!normB) return {
    header: '[ERR 409: ABSENT DEFENDANT DENIED]',
    message: `INSUFFICIENT DOCKET DATA: Option '${a}' cannot be convicted of bad judgment against an imaginary rival. Enter Option B on [01 // QUANTUM MATRIX] to construct a proper trial.`,
    target: 'option-b', actionLabel: 'GO TO MATRIX [01] TO INPUT OPTION B'
  };
  if (normA === normB) return {
    header: '[ERR 422: TAUTOLOGICAL PERJURY]',
    message: `FRAUDULENT DOCKET DETECTED: Trying '${a}' against '${a}' is legal nonsense. You cannot sue yourself for choosing what you already chose. Differentiate your choices on [01 // QUANTUM MATRIX].`,
    target: 'option-b', actionLabel: 'GO TO MATRIX [01] TO DIFFERENTIATE OPTIONS'
  };
  if (isPluralMatch(normA, normB)) return {
    header: '[ERR 418: SEMANTIC SUBTERFUGE]',
    message: `LEGAL SEMANTICS REJECTED: Pretending '${a}' and '${b}' are distinct options merely by adding an 's' is contempt of court. Provide two genuinely distinct choices on [01 // QUANTUM MATRIX].`,
    target: 'option-b', actionLabel: 'GO TO MATRIX [01] TO FIX GRAMMATICAL DUPLICATE'
  };
  const { winner, loser } = matrixState;
  const coherent = winner === a && loser === b || winner === b && loser === a;
  if (matrixState.hasRun !== true || !coherent) return {
    header: '[ERR 402: UNCOMMITTED SPECULATION PROHIBITED]',
    message: "NO VERDICT TO PROSECUTE: The Tribunal cannot indict a crime that exists only in your head. Return to [01 // QUANTUM MATRIX] and click 'RUN QUANTUM DECISION MATRIX' to generate actionable evidence.",
    target: 'run-button', actionLabel: 'GO TO MATRIX [01] TO RUN SIMULATION'
  };
  return null;
}
