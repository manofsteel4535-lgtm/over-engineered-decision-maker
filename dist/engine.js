import { getContext } from './contexts.js';
import { validateOptions } from './validation.js';

/** Symmetric fictional utility model. Fresh Math.random draws on every run. */
export class DecisionEngine {
  static samples = 10_000;
  static normal(random) {
    return Math.sqrt(-2 * Math.log(Math.max(random(), 1e-12))) * Math.cos(2 * Math.PI * random());
  }
  static summarize(values) {
    const sorted = [...values].sort((a, b) => a - b), n = values.length;
    const mean = values.reduce((sum, value) => sum + value, 0) / n;
    const middle = Math.floor(n / 2);
    return {
      mean, median: n % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
      sd: Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n),
      tail: values.filter(value => value < 25).length / n * 100,
      min: sorted[0], max: sorted[n - 1]
    };
  }
  static histogram(values, start, width, count = 40) {
    const bins = Array(count).fill(0);
    for (const value of values) bins[Math.max(0, Math.min(count - 1, Math.floor((value - start) / width)))]++;
    return bins.map(count => count / values.length * 100);
  }
  static generateThreats(context, chaos, random) {
    const pool = [...context.threats], names = [];
    for (let i = 0; i < 4; i++) names.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    names.push(random() < .5 ? 'Localized Solar Flare' : 'Temporal Anomaly');
    return names.map((name, index) => {
      const likelihood = index === 4 ? 1 + random() * chaos * .45 : 5 + random() * (25 + chaos * .65);
      const severity = index === 4 ? 85 + random() * 15 : 5 + random() * (35 + chaos * .5);
      return { name, likelihood, severity, weight: likelihood * severity / 100, category: index === 4 ? 'Cosmic' : context.label };
    });
  }
  static async run(input, onProgress = () => {}, random = Math.random, yieldControl = () => new Promise(resolve => setTimeout(resolve, 65))) {
    const validation = validateOptions(input.a, input.b);
    if (!validation.valid) throw new TypeError('Invalid decision options: ' + validation.code);
    const context = getContext(input.context), chaos = Number(input.chaos);
    if (!Number.isFinite(chaos) || chaos < 1 || chaos > 100) throw new RangeError('Chaos must be between 1 and 100.');
    const av = [], bv = [];
    let wins = 0;
    const volatility = 2 + chaos * .28;
    const shockProbability = (chaos / 100) ** 2 * .24;
    // Independent, identically distributed run means: no name/position advantage.
    const drift = 1.5 + chaos * .1;
    const meanA = 50 + (random() - .5) * 2 * drift;
    const meanB = 50 + (random() - .5) * 2 * drift;
    for (let batch = 0; batch < 20; batch++) {
      for (let i = 0; i < 500; i++) {
        // Separate symmetric heavy-tail shocks; scores deliberately remain unclipped.
        const shockA = random() < shockProbability ? this.normal(random) * volatility * 2.5 : 0;
        const shockB = random() < shockProbability ? this.normal(random) * volatility * 2.5 : 0;
        const a = meanA + this.normal(random) * volatility + shockA;
        const b = meanB + this.normal(random) * volatility + shockB;
        av.push(a); bv.push(b); wins += a > b ? 1 : a === b ? .5 : 0;
      }
      onProgress((batch + 1) * 500);
      await yieldControl(); // Keep the counter, graph and audio responsive.
    }
    const n = this.samples, p = wins / n, z = 1.96, denominator = 1 + z * z / n;
    const center = (p + z * z / (2 * n)) / denominator;
    const margin = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denominator;
    // A numerical tie gets a fair tie-break rather than a fixed preference for A.
    const winner = p === .5 ? (random() < .5 ? 'a' : 'b') : p > .5 ? 'a' : 'b';
    const ci = winner === 'a' ? [center - margin, center + margin] : [1 - center - margin, 1 - center + margin];
    const a = this.summarize(av), b = this.summarize(bv);
    const start = Math.floor(Math.min(a.min, b.min) / 10) * 10;
    const end = Math.ceil(Math.max(a.max, b.max) / 10) * 10;
    const binWidth = Math.max(1, (end - start) / 40);
    const threats = this.generateThreats(context, chaos, random);
    const probability = Math.max(p, 1 - p) * 100;
    const nodeWeights = [
      Math.min(100, (a.sd + b.sd) / 2 * 2), (a.tail + b.tail) / 2,
      threats.reduce((sum, threat) => sum + threat.weight, 0) / threats.length, probability
    ];
    return {
      a, b, distributionA: this.histogram(av, start, binWidth), distributionB: this.histogram(bv, start, binWidth),
      labels: Array.from({ length: 40 }, (_, i) => Number((start + (i + .5) * binWidth).toFixed(1))), binWidth,
      samples: n, winner, probability, ci: ci.map(value => value * 100), regret: 100 - probability,
      threats, nodeWeights, shockProbability, volatility
    };
  }
}
