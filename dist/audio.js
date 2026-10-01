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
  success(){this.tone(160,35,.7,'sawtooth',0,.3);[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(f,f,.5,'sine',.18+i*.1,.2));}
  suspend(){if(this.context)this.context.suspend();}
}
