/**
 * Maddie Journey original generative soundscape.
 *
 * No audio files, streaming, external libraries or copyrighted melodies.
 * The user must explicitly press "Enable ambient sound" or "Sound off"
 * before an AudioContext is created. Everything runs locally in Web Audio.
 */
export function createSoundscape(){
  let ctx=null,master=null,windNode=null,windFilter=null,voices=[],musicTimer=null;
  let enabled=false,ready=false,step=0,lastHover=0;
  const AudioCtor=()=>window.AudioContext||window.webkitAudioContext;
  const note=(midi)=>440*Math.pow(2,(midi-69)/12);
  const chords=[
    [48,52,55,59,62], // Cmaj9
    [45,48,52,55,60], // Am7/add9
    [41,45,48,52,55], // Fmaj9
    [43,48,50,55,57]  // Gsus2/add9
  ];
  let chordIndex=0;
  const easeGain=(gain,value,seconds=.4)=>{
    if(!ctx)return;
    const t=ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(value,t,seconds/3);
  };
  function init(){
    if(ready)return;
    const Constructor=AudioCtor();
    if(!Constructor)throw new Error('Web Audio unsupported');
    ctx=new Constructor();
    master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
    const padBus=ctx.createGain();padBus.gain.value=.15;padBus.connect(master);
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;filter.Q.value=.34;
    filter.connect(padBus);
    voices=chords[0].map((midi,i)=>{
      const oscillator=ctx.createOscillator();oscillator.type=i%2?'sine':'triangle';
      oscillator.frequency.value=note(midi);
      oscillator.detune.value=i%2?-4:5;
      const amp=ctx.createGain();amp.gain.value=i===0?.095:i===4?.014:.032;
      oscillator.connect(amp);amp.connect(filter);oscillator.start();
      return {oscillator,amp};
    });
    // 3s original filtered-noise bed: quiet wind, leaves and sea air.
    const sample=ctx.sampleRate;
    const buffer=ctx.createBuffer(1,sample*3,sample);
    const channel=buffer.getChannelData(0);
    let smoothed=0;
    for(let i=0;i<channel.length;i++){
      smoothed=smoothed*.91+(Math.random()*2-1)*.09;
      channel[i]=smoothed;
    }
    windNode=ctx.createBufferSource();windNode.buffer=buffer;windNode.loop=true;
    windFilter=ctx.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=480;
    const windGain=ctx.createGain();windGain.gain.value=.18;
    windNode.connect(windFilter);windFilter.connect(windGain);windGain.connect(master);
    windNode.start();
    ready=true;
  }
  function softTone(frequency,time=.18,gain=.03,type='sine',attack=.018){
    if(!enabled||!ctx)return;
    const now=ctx.currentTime;
    const os=ctx.createOscillator(),amp=ctx.createGain();
    os.type=type;os.frequency.setValueAtTime(frequency,now);
    amp.gain.setValueAtTime(0.0001,now);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),now+attack);
    amp.gain.exponentialRampToValueAtTime(.0001,now+time);
    os.connect(amp);amp.connect(master);os.start(now);os.stop(now+time+.05);
    os.onended=()=>{os.disconnect();amp.disconnect();};
  }
  function airySweep(from,to,duration,volume=.05){
    if(!enabled||!ctx)return;
    const now=ctx.currentTime,osc=ctx.createOscillator(),amp=ctx.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(from,now);
    osc.frequency.exponentialRampToValueAtTime(to,now+duration);
    amp.gain.setValueAtTime(.0001,now);
    amp.gain.exponentialRampToValueAtTime(volume,now+.08);
    amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(amp);amp.connect(master);osc.start(now);osc.stop(now+duration+.04);
    osc.onended=()=>{osc.disconnect();amp.disconnect();};
  }
  function nextPhrase(){
    if(!enabled||!ctx||ctx.state!=='running')return;
    step++;
    if(step%4===0){
      chordIndex=(chordIndex+1)%chords.length;
      voices.forEach((voice,i)=>{
        voice.oscillator.frequency.cancelScheduledValues(ctx.currentTime);
        voice.oscillator.frequency.setTargetAtTime(note(chords[chordIndex][i]),ctx.currentTime,2.0);
      });
    }
    const tones=chords[chordIndex];
    const idx=[2,4,3,1,4,2,0,3][step%8];
    const pitch=note(tones[idx]+12);
    softTone(pitch,1.65,.023,'sine',.14);
    if(step%5===0){
      // Small invented birdlike chirp as an occasional nature accent.
      airySweep(1280,1760,.19,.008);
      softTone(1930,.14,.006,'sine',.025);
    }
  }
  async function enable(){
    if(enabled)return true;
    try{
      init();
      await ctx.resume();
      enabled=true;
      easeGain(master,.31,1.8);
      nextPhrase();
      if(!musicTimer)musicTimer=setInterval(nextPhrase,2900);
      return true;
    }catch(error){
      console.warn('Maddie Journey audio could not start',error);
      enabled=false;return false;
    }
  }
  function disable(){
    enabled=false;
    if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
    if(master&&ctx)master.gain.setTargetAtTime(.00001,ctx.currentTime,.16);
  }
  function toggle(){return enabled?Promise.resolve((disable(),false)):enable();}
  function select(){
    if(!enabled)return;
    airySweep(330,720,.38,.038);
    softTone(note(76),.42,.04,'sine');
    softTone(note(83),.65,.025,'triangle');
  }
  function hover(){
    if(!enabled||Date.now()-lastHover<230)return;
    lastHover=Date.now();softTone(note(79),.14,.011);
  }
  function tap(){if(enabled)softTone(note(72),.24,.023,'sine');}
  function reveal(){
    if(!enabled)return;
    airySweep(145,500,2.15,.052);
    softTone(note(72),1.8,.026,'sine',.25);
    softTone(note(79),2.7,.02,'sine',.4);
  }
  function setWorld(isWorld){
    if(!master||!enabled)return;
    easeGain(master,isWorld?.31:.095,1.3);
  }
  function dispose(){
    disable();
    for(const v of voices){try{v.oscillator.stop();}catch{}}
    if(windNode)try{windNode.stop();}catch{}
    if(ctx)ctx.close();
    voices=[];ready=false;ctx=null;master=null;
  }
  document.addEventListener('visibilitychange',()=>{
    if(!master||!ctx||!enabled)return;
    easeGain(master,document.hidden?.00001:.31,.4);
  });
  return {enable,disable,toggle,select,hover,tap,reveal,setWorld,dispose,get enabled(){return enabled;},get supported(){return Boolean(AudioCtor());}};
}
