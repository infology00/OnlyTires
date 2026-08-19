/* ONLYTIRES — synthesized sound design (no audio files)
   Light, cool, shop-floor ambience + crisp UI feedback. */
(function () {
  'use strict';
  var ctx=null, master=null, musicGain=null, verb=null, muted=false, started=false;
  try { muted = localStorage.getItem('ot-sound') === 'off'; } catch(e){}
  /* set the moment the visitor enters with sound; every subsequent page in the
     session then brings the music up by itself instead of waiting for a click */
  var optedIn = false;
  try { optedIn = sessionStorage.getItem('ot-audio-on') === '1'; } catch(e){}

  function ensure(){
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    /* gentle plate reverb so UI sounds sit in a room, not in your ear */
    verb = ctx.createConvolver();
    var len = ctx.sampleRate * 1.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c=0;c<2;c++){
      var d = buf.getChannelData(c);
      for (var i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 3.2);
    }
    verb.buffer = buf;
    var vg = ctx.createGain(); vg.gain.value = 0.16;
    verb.connect(vg); vg.connect(master);
    musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
    return true;
  }
  function noise(sec){
    var b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate*sec)), ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    return b;
  }

  /* ---------- MUSIC: light, cool, airy — slow Fmaj9 bed + soft mallet motif ---------- */
  function startMusic(){
    if (started || !ensure()) return;
    started = true;
    var t0 = ctx.currentTime;

    /* --- warm chord bed (Fmaj9): triangle voices, softly filtered --- */
    var padFilter = ctx.createBiquadFilter();
    padFilter.type='lowpass'; padFilter.frequency.value=1100; padFilter.Q.value=.4;
    padFilter.connect(musicGain);
    [87.31, 130.81, 220.00, 329.63].forEach(function(f, i){
      var o=ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.detune.value=(i%2?6:-6);
      var g=ctx.createGain(); g.gain.value=[0.30,0.22,0.12,0.07][i];
      var lfo=ctx.createOscillator(); lfo.frequency.value=0.042+i*0.016;
      var lg=ctx.createGain(); lg.gain.value=g.gain.value*0.45;
      lfo.connect(lg); lg.connect(g.gain); lfo.start(t0);
      o.connect(g); g.connect(padFilter); o.start(t0);
    });

    /* --- slow sub pulse: a heartbeat under the room, felt not heard --- */
    var subFilter = ctx.createBiquadFilter();
    subFilter.type='lowpass'; subFilter.frequency.value=180;
    subFilter.connect(musicGain);
    var sub=ctx.createOscillator(); sub.type='sine'; sub.frequency.value=43.65; /* F1 */
    var subG=ctx.createGain(); subG.gain.value=0.0001;
    sub.connect(subG); subG.connect(subFilter); sub.start(t0);
    var pulse=ctx.createOscillator(); pulse.type='sine'; pulse.frequency.value=0.5; /* ~30 bpm swell */
    var pulseG=ctx.createGain(); pulseG.gain.value=0.06;
    pulse.connect(pulseG); pulseG.connect(subG.gain); pulse.start(t0);

    /* --- air: quiet filtered noise, like a clean workshop --- */
    var n=ctx.createBufferSource(); n.buffer=noise(4); n.loop=true;
    var bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=3400; bp.Q.value=1.1;
    var ng=ctx.createGain(); ng.gain.value=0.015;
    n.connect(bp); bp.connect(ng); ng.connect(musicGain); n.start(t0);

    /* --- sparse mallet motif over a pentatonic set --- */
    var scale=[523.25, 587.33, 698.46, 783.99, 880.00, 1046.50];
    function pluck(){
      if (!ctx || muted) return;
      if (Math.random() < 0.5){
        var t=ctx.currentTime;
        var f=scale[Math.floor(Math.random()*scale.length)];
        var o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
        var o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=f*2.005;
        var g=ctx.createGain();
        g.gain.setValueAtTime(0.0001,t);
        g.gain.exponentialRampToValueAtTime(0.045,t+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001,t+2.6);
        var g2=ctx.createGain(); g2.gain.value=0.28;
        o.connect(g); o2.connect(g2); g2.connect(g);
        g.connect(musicGain); if (verb) g.connect(verb);
        o.start(t); o2.start(t); o.stop(t+2.7); o2.stop(t+2.7);
      }
    }
    setInterval(pluck, 2400);

    /* --- soft rim tick every few bars: keeps a slow pulse without drums --- */
    function rimTick(){
      if (!ctx || muted) return;
      var t=ctx.currentTime;
      var nb=ctx.createBufferSource(); nb.buffer=noise(0.04);
      var hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=4200;
      var g=ctx.createGain();
      g.gain.setValueAtTime(0.012,t);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.04);
      nb.connect(hp); hp.connect(g); g.connect(musicGain); if (verb) g.connect(verb);
      nb.start(t);
    }
    setInterval(rimTick, 4800);

    if (!muted) musicGain.gain.setTargetAtTime(0.055, ctx.currentTime, 3);
  }

  function sfx(fn){ if (!ctx || muted) return; if (ctx.state==='suspended') ctx.resume(); fn(); }

  /* small helper: short sine blip */
  function blip(freq, dur, vol, type, glideTo){
    var t=ctx.currentTime;
    var o=ctx.createOscillator(); o.type=type||'sine'; o.frequency.setValueAtTime(freq,t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t+dur);
    var g=ctx.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(master); if (verb) g.connect(verb);
    o.start(t); o.stop(t+dur+0.05);
  }

  var api = {
    unlock:function(withMusic){
      if(!ensure())return;
      if(ctx.state==='suspended') ctx.resume();
      if(withMusic){
        try{ sessionStorage.setItem('ot-audio-on','1'); }catch(e){}
        optedIn = true;
        startMusic();
      }
    },

    /* hover: airy tick, very soft */
    tick:function(){ sfx(function(){
      var t=ctx.currentTime;
      [1760, 2640].forEach(function(f, i){
        var o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
        var g=ctx.createGain();
        g.gain.setValueAtTime(0.0001,t);
        g.gain.exponentialRampToValueAtTime(i ? 0.014 : 0.028, t+0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t+(i?0.16:0.22));
        o.connect(g); g.connect(master); if (verb) g.connect(verb);
        o.start(t); o.stop(t+0.3);
      });
    }); },

    /* click: crisp two-tone confirm */
    click:function(){ sfx(function(){ blip(880, 0.09, 0.09, 'sine', 1320); }); },

    /* focus a field */
    focus:function(){ sfx(function(){ blip(1400, 0.07, 0.045, 'sine'); }); },

    /* toggle / open */
    open:function(){ sfx(function(){ blip(660, 0.12, 0.07, 'sine', 990); }); },
    close:function(){ sfx(function(){ blip(990, 0.12, 0.06, 'sine', 620); }); },

    /* page transition: soft filtered air, not a jet engine */
    whoosh:function(){ sfx(function(){
      var t=ctx.currentTime;
      /* rising air */
      var n=ctx.createBufferSource(); n.buffer=noise(0.75);
      var bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=1.1;
      bp.frequency.setValueAtTime(420,t);
      bp.frequency.exponentialRampToValueAtTime(3600,t+0.42);
      bp.frequency.exponentialRampToValueAtTime(900,t+0.62);
      var g=ctx.createGain();
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.075,t+0.16);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.62);
      n.connect(bp); bp.connect(g); g.connect(master); if(verb) g.connect(verb);
      n.start(t);
      /* low body so the wipe lands with weight */
      var o=ctx.createOscillator(); o.type='sine';
      o.frequency.setValueAtTime(210,t); o.frequency.exponentialRampToValueAtTime(70,t+0.5);
      var og=ctx.createGain();
      og.gain.setValueAtTime(0.0001,t);
      og.gain.exponentialRampToValueAtTime(0.10,t+0.10);
      og.gain.exponentialRampToValueAtTime(0.0001,t+0.55);
      o.connect(og); og.connect(master); o.start(t); o.stop(t+0.6);
    }); },

    /* arrival sound — currently unused: the page reveal plays no sound,
       only the departure whoosh. Kept here in case it is wanted again. */
    arrive:function(){ sfx(function(){
      var t=ctx.currentTime;
      var n=ctx.createBufferSource(); n.buffer=noise(0.6);
      var bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=1.0;
      bp.frequency.setValueAtTime(2800,t); bp.frequency.exponentialRampToValueAtTime(600,t+0.45);
      var g=ctx.createGain();
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.055,t+0.1);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.5);
      n.connect(bp); bp.connect(g); g.connect(master); if(verb) g.connect(verb);
      n.start(t);
      blip(880, 0.4, 0.035, 'sine', 1174.66);
    }); },

    /* brand step on the tire wall */
    step:function(){ sfx(function(){ blip(1320, 0.1, 0.05, 'sine', 1760); }); },

    /* the wheel seating in the bay: soft rubber thud + tiny click */
    thunk:function(){ sfx(function(){
      var t=ctx.currentTime;
      var o=ctx.createOscillator(); o.type='sine';
      o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(62,t+0.22);
      var g=ctx.createGain();
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.22,t+0.015);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.3);
      var lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=420;
      o.connect(lp); lp.connect(g); g.connect(master); if(verb) g.connect(verb);
      o.start(t); o.stop(t+0.35);
      blip(1560, 0.06, 0.05, 'sine');
    }); },

    /* entering the site: gentle rising chime, no engine noise */
    enter:function(){ sfx(function(){
      var t=ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach(function(f,i){
        var o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
        var g=ctx.createGain();
        var st=t+i*0.085;
        g.gain.setValueAtTime(0.0001,st);
        g.gain.exponentialRampToValueAtTime(0.085,st+0.03);
        g.gain.exponentialRampToValueAtTime(0.0001,st+1.5);
        o.connect(g); g.connect(master); if(verb) g.connect(verb);
        o.start(st); o.stop(st+1.6);
      });
    }); },

    toggle:function(){
      muted=!muted;
      try{ localStorage.setItem('ot-sound', muted?'off':'on'); }catch(e){}
      if (ctx && musicGain) musicGain.gain.setTargetAtTime(muted?0:0.05, ctx.currentTime, 0.5);
      try{ sessionStorage.setItem('ot-audio-on', muted ? '0' : '1'); }catch(e){}
      optedIn = !muted;
      if (!muted){ api.unlock(true); api.click(); }
      return muted;
    },
    isMuted:function(){ return muted; }
  };
  window.OT_AUDIO = api;

  /* toggle button */
  var btn = document.querySelector('.sound-toggle');
  if (btn){
    if (muted) btn.classList.add('is-muted');
    btn.addEventListener('click', function(){ btn.classList.toggle('is-muted', api.toggle()); });
  }

  /* ---- keeping the sound alive across navigations ----
     A fresh page gets a fresh AudioContext, which browsers start suspended.
     If the visitor already chose sound this session we try immediately, then
     retry on literally any sign of life, so in practice the music simply
     continues instead of waiting for a deliberate click. */
  var EVENTS = ['pointerdown','pointermove','mousemove','keydown','touchstart','wheel','scroll','click'];
  function wake(){
    if (muted) return;
    api.unlock(optedIn);
    if (ctx && ctx.state === 'running' && (started || !optedIn)) {
      EVENTS.forEach(function(e){ removeEventListener(e, wake); });
    }
  }
  function tryNow(){
    if (muted || !optedIn) return;
    api.unlock(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryNow);
  else tryNow();
  addEventListener('pageshow', tryNow);
  addEventListener('focus', tryNow);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) tryNow(); });
  EVENTS.forEach(function(e){ addEventListener(e, wake, { passive:true }); });
})();
