/** Fictional utility model: paired outcomes, real statistics, no claim of real-world certainty. */
export class DecisionEngine {
  static threats = {
    physical: ['Tongue Burn', 'Carb Coma', 'Spill on Keyboard'],
    psychological: ['Grass-is-Greener Syndrome', 'Waiter Judgment', 'Food Envy'],
    cosmic: ['Localized Solar Flare', 'Temporal Anomaly']
  };
  static hash(text) { return [...text.toLowerCase()].reduce((h,c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7); }
  static normal(random) { return Math.sqrt(-2 * Math.log(Math.max(random(), 1e-12))) * Math.cos(2 * Math.PI * random()); }
  static profile(option, context) {
    let score = 50 + (this.hash(option) % 17) - 8;
    const food = option.toLowerCase();
    if (/taco|pizza|burger|pasta/.test(food)) score += context === 'Late Night Craving' ? 15 : 6;
    if (/salad|fruit|soup|vegetable/.test(food)) score += context === 'Workplace Lunch' ? 7 : -4;
    if (context === 'First Date') score += (this.hash(option + context) % 13) - 6;
    return score;
  }
  static summarize(values) {
    const sorted = [...values].sort((a,b) => a-b);
    const mean = values.reduce((a,b) => a+b,0) / values.length;
    const sd = Math.sqrt(values.reduce((s,x) => s + (x-mean)**2,0) / values.length);
    return { mean, median: (sorted[4999]+sorted[5000])/2, sd, tail: values.filter(x=>x<25).length/values.length*100 };
  }
  static histogram(values) {
    const bins = Array(25).fill(0);
    values.forEach(x => bins[Math.min(24, Math.max(0, Math.floor(x/4)))]++);
    return bins.map(x=>x/values.length*100);
  }
  static generateThreats(a,b,chaos,random) {
    const text = (a+' '+b).toLowerCase();
    const specific = /taco|salsa/.test(text) ? ['Sodium Coma','Salsa Stain on White Shirt'] : /coffee|tea/.test(text) ? ['Caffeine Singularity','Mug-related Incident'] : /salad/.test(text) ? ['Lettuce Betrayal','Dressing Spill'] : ['Unexpected Buyer’s Remorse','Minor Dignity Loss'];
    const names = [specific[0],specific[1],this.threats.physical[Math.floor(random()*3)],this.threats.psychological[Math.floor(random()*3)],this.threats.cosmic[Math.floor(random()*2)]];
    return names.map((name,i) => {
      const likelihood = i===4 ? 5+random()*chaos*.35 : 15+random()*70;
      const severity = i===4 ? 85+random()*15 : 10+random()*65;
      return {name,likelihood,severity,weight:likelihood*severity/100,category:i===4?'Cosmic':i===3?'Psychological':'Physical'};
    });
  }
  static async run({a,b,context,chaos},onProgress=()=>{},random=Math.random) {
    const av=[],bv=[];
    let wins=0;
    const volatility=7+chaos*.26, pa=this.profile(a,context),pb=this.profile(b,context);
    // Yield each batch so the live counter, audio, and 3D renderer remain responsive.
    for(let batch=0;batch<20;batch++) {
      for(let i=0;i<500;i++) {
        const shock = random()<chaos/700 ? this.normal(random)*chaos*.3 : 0;
        const x = Math.max(0,Math.min(100,pa+this.normal(random)*volatility+shock));
        const y = Math.max(0,Math.min(100,pb+this.normal(random)*volatility-shock));
        av.push(x);bv.push(y);wins += x>y ? 1 : x===y ? .5 : 0;
      }
      onProgress((batch+1)*500);
      await new Promise(resolve=>setTimeout(resolve,65));
    }
    const p=wins/10000;
    // Wilson interval describes simulation win probability, not certainty about dinner.
    const z=1.96,den=1+z*z/10000,center=(p+z*z/20000)/den,margin=z*Math.sqrt(p*(1-p)/10000+z*z/400000000)/den;
    const winner=p>=.5?'a':'b';
    const ci=winner==='a'?[center-margin,center+margin]:[1-center-margin,1-center+margin];
    const sa=this.summarize(av),sb=this.summarize(bv);
    return {a:sa,b:sb,distributionA:this.histogram(av),distributionB:this.histogram(bv),samples:10000,winner,probability:Math.max(p,1-p)*100,ci:ci.map(x=>x*100),regret:(1-Math.max(p,1-p))*100,threats:this.generateThreats(a,b,chaos,random)};
  }
}
