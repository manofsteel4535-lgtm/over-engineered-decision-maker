/** Scripted testimony and dispositions. These are entertainment, not AI/legal advice. */
const response = (human_text, outrage_delta, void_response, bot_response) => Object.freeze({ human_text, outrage_delta, void_response, bot_response });
const question = (id, text, options) => Object.freeze({ id, text, options: Object.freeze(options) });

export const QUESTIONS = Object.freeze([
  question(1, 'On a scale of 0 to 10, how many minutes of genuine research did you conduct before surrendering your financial credentials?', [
    response('0 minutes. Pure vibes.', 30, 'Vibes are not an accepted financial instrument.', "My client's intuition operates on high-frequency quantum guesswork."),
    response('Over 4 hours of YouTube unboxing videos.', 15, 'Watching someone else open a box does not constitute due diligence.', 'It was audiovisual field research, Your Honor!'),
    response('I asked ChatGPT and ignored its advice.', 40, 'The defendant consulted a machine, then selected the option it explicitly discouraged.', 'We request that the chat history be marked as creative writing.'),
    response('I created a 12-tab spreadsheet that I immediately abandoned.', 20, 'A ceremonial grid of columns used solely to delay the inevitable.', 'The formulas were mathematically pristine before my client deleted them.')
  ]),
  question(2, 'When confirming this decision, was your human brain operating under nominal logic, or did your right index finger act as an autonomous rogue entity?', [
    response('My index finger had a mind of its own.', 25, 'Motor control mutiny is not an affirmative legal defense.', "We move to subpoena the defendant's right hand as a hostile witness."),
    response('I executed calculated reasoning based on zero available evidence.', -10, 'Unexpected honesty detected. We reluctantly recommend ten points of leniency.', 'Finally, a defense strategy I can execute without reading anything.'),
    response('I was possessed by targeted social media ads.', 35, 'Surrendering free will to ad trackers confirms total operational collapse.', 'The algorithm was simply too persuasive!')
  ]),
  question(3, 'If forced to defend this choice in front of a panel of sensible adults, what would be your primary defense?', [
    response('It increases my existential productivity by 1.2%.', 20, 'A statistical rounding error masquerading as a life strategy.', '1.2% compound growth over 80 years is technically non-zero!'),
    response('Life is short and entropy is inevitable.', 30, 'The heat death of the universe is not a discount code.', 'Your Honor, technically everything will depreciate. Including this courtroom.'),
    response('I have no defense. Sentence me.', -10, 'Plea of total defeat logged. The prosecution feels strangely unfulfilled.', 'A bold tactical surrender! We await cosmic mercy.')
  ]),
  question(4, 'Did you consult your future self regarding the long-term consequences of this selection?', [
    response('Future Me is a resilient individual who can handle the fallout.', 35, 'Textbook temporal negligence. Sacrificing Future Me for present gratification.', 'Future Me has better coping mechanisms anyway.'),
    response("Future Me doesn't exist yet, so legally they have no standing.", 25, 'An appalling loophole exploit in temporal jurisprudence.', "Statute of limitations applies to events that haven't happened!"),
    response('I left a hasty apology note in my calendar.', 10, 'Calendar reminders do not offset economic catastrophe.', 'At least my client communicates across timelines!')
  ]),
  question(5, 'What role did midnight boredom or caffeine overconsumption play in this choice?', [
    response('It was 2 AM and my inhibition circuits were fully offline.', 30, 'Circadian rhythm failure is the leading cause of tragic checkout button presses.', 'Biological downtime should legally nullify all transactions.'),
    response('I was fueled by three espresso shots and an unearned burst of confidence.', 20, 'Chemically induced optimism remains a misdemeanor.', 'Coffee is standard judicial fuel. We request solidarity from the bench.'),
    response('Neither. I made this terrible decision in broad daylight.', 40, 'Premeditated daylight foolishness! Aggravated circumstances applied.', 'We withdraw the temporary insanity plea...')
  ]),
  question(6, 'If an impartial AI were to audit your decision history, what score would it award your consistency?', [
    response('ERR 500: Division by zero.', 35, "The defendant's logic matrix actively crashes benchmark engines.", 'Unpredictability is a recognized form of artistic expression!'),
    response('A solid 4/10 with generous curve grading.', 10, 'Self-awarded passing marks do not pass judicial scrutiny.', '40% accuracy is standard for meteorologists and CEOs!'),
    response('Consistency is the hobgoblin of small minds.', 25, 'Quoting Emerson will not clear your record.', 'I second the motion to cite classical literature!')
  ]),
  question(7, 'How do you address allegations that you staged an arena deathmatch in Module 02 just to procrastinate?', [
    response('The gladiator combat was critical to my decision methodology.', 20, 'Simulated violence between fast food items is not scientific rigor.', 'It provided high-resolution empirical entertainment!'),
    response('Guilty. I was actively avoiding an uncomfortable task.', -5, 'Confession noted. Delay tactics remain highly irritating.', 'Procrastination is merely serialized prioritization.'),
    response('I thought the robots were actually making the choice for me.', 30, 'Offloading moral accountability to 2D sprites is forbidden.', 'The sprites looked extremely authoritative.')
  ]),
  question(8, 'What percentage of this decision was driven by sheer Sunk Cost Fallacy?', [
    response("At least 85%. I've come too far to turn back now.", 35, 'Doubling down on a bad path is the hallmark of human stubbornness.', 'It shows commitment and resilience!'),
    response('0%. I make fresh bad decisions every single day.', 15, 'Innovative foolishness is still foolishness.', 'My client evaluates every mistake on its own merits.'),
    response('What is Sunk Cost? Is that a nautical term?', 40, 'Economic illiteracy added to the charge sheet.', 'Objection! My client is a nautical enthusiast!')
  ]),
  question(9, 'If this choice fails catastrophically, who do you plan to hold accountable?', [
    response('This application and its sarcastic interface.', 25, 'Blaming the mirror for the reflection is a classic human artifact.', 'We reserve the right to sue the software developers.'),
    response('Solar flares and planetary misalignment.', 30, 'Astrological deflection denied.', 'Mercury was demonstrably in retrograde during click execution.'),
    response('I will accept full responsibility and suffer in quiet silence.', -15, 'Stoicism detected. Public outrage suppressed by 15 points.', 'A dignified defense. I shall now rest my case.')
  ]),
  question(10, 'What is the probability that you will reverse this exact choice within 48 hours?', [
    response('100%. Returns and cancellations are my specialty.', 35, 'Wasting system bandwidth on temporary decisions is treason.', 'It keeps the logistics economy thriving!'),
    response('50/50. It depends on my mood tomorrow morning.', 20, 'Flip-flopping registered in the permanent record.', 'Flexibility is a virtue in modern volatile markets.'),
    response('0%. Once I commit, I ride the ship straight to the ocean floor.', 15, 'Stubborn persistence identified.', 'A captain always stays with the ship!')
  ])
]);

const tier = (id, headlines, sentences) => Object.freeze({ id, headlines: Object.freeze(headlines), sentences: Object.freeze(sentences) });
export const VERDICT_TIERS = Object.freeze([
  tier('LOW', ['PARDONED BY COSMIC ANOMALY', 'RELUCTANT ACQUITTAL UNDER DURESS', 'DISMISSED WITH ABSOLUTE CONTEMPT'], [
    'Sentenced to write a 500-word apology essay to your bank account.',
    'Sentenced to stare at a loading bar stuck at 99% for 12 uninterrupted minutes.',
    'Sentenced to manually read the terms & conditions of a minor browser extension.',
    'Sentenced to pay a 50-cent fine in uncalibrated cryptocurrency.'
  ]),
  tier('MODERATE', ['GUILTY OF DECISIONAL SLOTH', 'CONVICTED OF UNPROVOKED OVERTHINKING', 'FOUND GUILTY OF MID-LEVEL ILLOGIC'], [
    'Sentenced to manually clean every mechanical keyboard switch in a 10-mile radius.',
    'Sentenced to explain cryptocurrency to an entirely uninterested relative.',
    'Sentenced to untangle three miles of tangled USB-A cables.',
    'Sentenced to draft a formal apology letter to your future self and mail it via post.'
  ]),
  tier('EXTREME', ['GUILTY OF TACTICAL FOOLISHNESS', 'MAXIMUM JURY CONDEMNATION ACHIEVED', 'CONVICTED OF TERMINAL INTELLECTUAL BANKRUPTCY'], [
    'Sentenced to assemble IKEA furniture with missing hex keys in complete darkness.',
    'Sentenced to walk across a room covered entirely in loose Lego bricks barefoot.',
    'Sentenced to spend 72 hours using a trackball mouse with inverted Y-axis.',
    'Sentenced to listen to a 10-hour loop of dial-up internet connection sounds.'
  ])
]);

/** Fisher–Yates on copies: three unique questions, three unique shuffled responses each. */
function shuffle(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function createExamination(random = Math.random) {
  return Object.freeze(shuffle(QUESTIONS, random).slice(0, 3).map(q => question(q.id, q.text, shuffle(q.options, random).slice(0, 3))));
}
export const outrageTier = outrage => VERDICT_TIERS[outrage <= 25 ? 0 : outrage <= 65 ? 1 : 2];
export function generateDecree(outrage, random = Math.random) {
  const bank = outrageTier(outrage);
  const pick = items => items[Math.floor(random() * items.length)];
  return { tier: bank.id, verdict: pick(bank.headlines), sentence: pick(bank.sentences), outcome: bank.id === 'LOW' ? 'pardoned' : 'guilty' };
}
