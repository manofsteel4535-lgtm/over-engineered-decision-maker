// Shared lexical routing. Original spelling is retained for valid verdicts.
export function normalizeOption(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s.,!?;:…]+$/u, '');
}

/** Plural-only matcher: normalized identity must never enter this branch. */
export function isPluralMatch(optionA, optionB) {
  const a = normalizeOption(optionA), b = normalizeOption(optionB);
  if (!a || !b || a === b) return false;
  if (a + 's' === b || b + 's' === a) return true;
  if (a + 'es' === b || b + 'es' === a) return true;
  if (a.endsWith('y') && a.slice(0, -1) + 'ies' === b) return true;
  if (b.endsWith('y') && b.slice(0, -1) + 'ies' === a) return true;
  const stemA = a.replace(/(?:es|s)$/, ''), stemB = b.replace(/(?:es|s)$/, '');
  return stemA.length > 3 && stemB.length > 3 && stemA === stemB;
}

// Keep the combined helper available for callers of the earlier validation API.
export function isSemanticDuplicate(optionA, optionB) {
  const a = normalizeOption(optionA), b = normalizeOption(optionB);
  return Boolean(a && b) && (a === b || isPluralMatch(a, b));
}

export function validateOptions(a, b) {
  const optionA = String(a ?? '').trim(), optionB = String(b ?? '').trim();
  const normA = optionA.toLowerCase(), normB = optionB.toLowerCase();
  const cleanA = normalizeOption(normA), cleanB = normalizeOption(normB);
  if (!cleanA || !cleanB) return { valid: false, code: 'blank', a: optionA, b: optionB, field: !cleanA ? 'option-a' : 'option-b' };
  // Punctuation-only differences remain identity faults, not plurality faults.
  if (normA === normB || cleanA === cleanB) return { valid: false, code: 'exact-match', a: optionA, b: optionB, field: 'option-a' };
  if (isPluralMatch(normA, normB)) return { valid: false, code: 'plural-match', a: optionA, b: optionB, field: 'option-b' };
  return { valid: true, a: optionA, b: optionB };
}

export const EXACT_MATCH_ERROR_POOL = Object.freeze([
  "CRITICAL LOGIC OVERFLOW: You entered '[Option A]' twice. A $50,000 quantum simulation is not required to tell you that [Option A] is equal to [Option A].",
  "MATRIX COLLAPSE PREVENTED: Calculating the subtle existential differences between '[Option A]' and '[Option A]' caused our simulated universe to overheat.",
  'ERROR 402 (EGO OVERLOAD): Both choices are identical. The algorithm concludes you just want validation, not a decision.',
  "INFINITE RECURSION DETECTED: Comparing '[Option A]' with itself yields a 100.000% probability of getting [Option A]. Brilliant work."
]);
export const PLURAL_MATCH_ERROR_POOL = Object.freeze([
  "LEXICAL DECEPTION DETECTED: You entered '[Option A]' vs '[Option B]'. Adding the letter 's' to the end of a noun does not constitute a distinct existential alternative. Are you asking a $50,000 quantum matrix to evaluate whether you should eat one [Option A] or enter a multi-[Option A] superposition?",
  "CRITICAL PLURALITY OVERFLOW: Our 10,000-iteration stochastic engine calculated that '[Option B]' is literally just '[Option A]' with more grammatical volume. Nice try, human.",
  "REDUNDANCY ALERT: Pluralizing your choice does not trick the matrix. Comparing '[Option A]' against '[Option B]' is like asking whether you want to suffer standard entropy or plural entropy. Enter two actual choices.",
  "SYNTACTIC CHEAT ATTEMPT: 's' is not a strategic pivot. Please provide two distinctly different inputs before our simulated processors melt from acute boredom."
]);
const BLANK_ERROR_POOL = Object.freeze([
  'VACUUM DETECTED: One or both options are blank. Even our imaginary quantum computer cannot compare something with your lack of commitment.',
  'INPUT SINGULARITY: Please supply two options. The void has declined to participate in this decision.',
  'HUMAN INDECISION NOT FOUND: Two choices are required. Staring meaningfully at an empty field does not count as data entry.'
]);

const modalStates = {
  'exact-match': {
    header: '[ERR 400: IDENTITY PARADOX DETECTED]', title: 'Identity paradox detected.',
    buttonText: 'ACKNOWLEDGE MY HUMANITY',
    log: 'Identity paradox detected. Comparing a choice with itself is not a mission.'
  },
  'plural-match': {
    header: '[WARN 409: SEMANTIC PLURALITY DETECTED]', title: 'Lexical deception detected.',
    buttonText: 'ACKNOWLEDGE & RE-INPUT',
    log: 'Semantic plurality detected. Plural entropy is still entropy. Calculation aborted.'
  },
  blank: {
    header: '[WARN 400: MISSING CHOICE VECTOR]', title: 'Decision matrix halted.',
    buttonText: 'ACKNOWLEDGE & RE-INPUT', log: 'Empty choice vector detected. Calculation aborted.'
  }
};
export function validationPresentation(validation) {
  return modalStates[validation.code];
}

export function capitalizeOption(value) {
  return String(value ?? '').trim().replace(/\S+/gu, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
export function validationMessage(validation, random = Math.random) {
  const pool = validation.code === 'exact-match' ? EXACT_MATCH_ERROR_POOL
    : validation.code === 'plural-match' ? PLURAL_MATCH_ERROR_POOL : BLANK_ERROR_POOL;
  const template = pool[Math.floor(random() * pool.length)];
  const choices = { A: capitalizeOption(validation.a), B: capitalizeOption(validation.b) };
  // Callback replacement preserves literal $ characters and replaces repeated tokens.
  return template.replace(/\[Option ([AB])\]/g, (_, option) => choices[option]);
}
