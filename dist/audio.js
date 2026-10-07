/** Procedural mission audio, initialized only from a user gesture. */
export class MissionAudio {
  constructor(){this.muted=false;this.context=null;}
  async init(){
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    if(!this.context){
      this.context=new Audio();this.master=this.context.createGain();
      this.master.gain.value=this.muted?0:.18;this.master.connect(this.context.destination);
      this.hum=this.context.createOscillator();this.hum.frequency.value=48;
      const gain=this.context.createGain();gain.gain.value=.045;
      this.hum.connect(gain).connect(this.master);this.hum.start();
    }
    await this.context.resume();
  }
  mute(value){this.muted=value;if(this.context)this.master.gain.setTargetAtTime(value?0:.18,this.context.currentTime,.05);}
  tone(from,to,duration,type='sine',delay=0,volume=.25){
    if(!this.context)return;
    const t=this.context.currentTime+delay,osc=this.context.createOscillator(),gain=this.context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(from,t);osc.frequency.exponentialRampToValueAtTime(to,t+duration);
    gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.02);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    osc.connect(gain).connect(this.master);osc.start(t);osc.stop(t+duration+.03);
  }
  processing(){for(let i=0;i<12;i++)this.tone(120+i*45,160+i*60,.08,'sawtooth',i*.11,.07);}
  // Short wooden crack over a low synth impact; each oscillator stops itself.
  gavel(){this.tone(190,38,.28,'triangle',0,.7);this.tone(950,110,.09,'square',0,.14);this.tone(95,40,.22,'sawtooth',.035,.18);}
  fightCue(type){
    if(this.muted)return;
    if(type==='hit')this.tone(190,60,.09,'triangle',0,.28);
    if(type==='heavy'){this.tone(140,30,.18,'sawtooth',0,.32);this.tone(700,95,.06,'square',0,.08);}
    if(type==='block')this.tone(900,580,.08,'sine',0,.16);
    if(type==='special'){this.tone(110,920,.35,'sawtooth',0,.2);this.tone(70,40,.55,'triangle',.18,.4);}
    if(type==='start')[330,440,660].forEach((f,i)=>this.tone(f,f,.13,'square',i*.13,.08));
    if(type==='ko'){this.tone(130,25,.8,'sawtooth',0,.4);[440,330,220].forEach((f,i)=>this.tone(f,f,.2,'square',i*.2,.09));}
  }
  alarm(){[0,.18,.36].forEach(delay=>this.tone(340,180,.14,'square',delay,.12));}
  success(){this.tone(160,35,.7,'sawtooth',0,.3);[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(f,f,.5,'sine',.18+i*.1,.2));}
  suspend(){if(this.context)this.context.suspend();}
}
