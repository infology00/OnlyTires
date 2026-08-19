/* ONLYTIRES — home experience: preloader (first visit only), scroll-driven 3D tire */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var A = function(){ return window.OT_AUDIO; };

  var entered = false;   /* declared before anything can set it */
  var pre      = document.querySelector('.preloader');
  var pctEl    = document.querySelector('.preloader-pct');
  var barEl    = document.querySelector('.preloader-bar i');
  var statusEl = document.querySelector('.preloader-status');

  /* preloader shows once per browser session only */
  /* Set by the inline <head> script before first paint. It is true only when
     you arrived here from another page on this site, so a refresh or a fresh
     visit still gets the full preloader, while Home->Tires->Home does not. */
  var seen = document.documentElement.classList.contains('ot-seen');

  var shown = 0, target = 0, finished = false;
  function setStage(p, label) {
    target = Math.max(target, p);
    if (statusEl && label) statusEl.textContent = label;
  }

  function skipPreloader() {
    if (pre) pre.classList.add('is-done');
    document.body.classList.add('is-entered');
    entered = true;
    /* the veil is covering the page — animate it away */
    if (window.OT_REVEAL_IN) window.OT_REVEAL_IN();
    buildModel();
  }

  if (seen || !pre) {
    skipPreloader();
  } else {
    (function pctLoop() {
      if (finished) return;
      shown += (target - shown) * 0.09;
      if (pctEl) pctEl.textContent = Math.round(shown) + '%';
      if (barEl) barEl.style.transform = 'scaleX(' + shown / 100 + ')';
      if (shown > 99.3 && target >= 100) {
        finished = true;
        if (pctEl) pctEl.textContent = '100%';
        if (statusEl) statusEl.textContent = 'Ready';
        pre.classList.add('is-ready');
        if (reduce) enter(false);
      } else requestAnimationFrame(pctLoop);
    })();
    setStage(8, 'Warming up');
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ setStage(24,'Loading typography'); });
    if (document.readyState === 'complete') setStage(36, 'Loading assets');
    else addEventListener('load', function(){ setStage(36, 'Loading assets'); });

    /* Watchdog. Whatever happens to the 3D model, the door opens. Nobody is
       ever left staring at a stalled percentage. */
    setTimeout(function(){ setStage(100, 'Ready'); }, 15000);
  }

  function enter(withSound) {
    if (!pre || pre.classList.contains('is-exiting')) return;
    /* The exit happens FIRST and unconditionally. Audio is best-effort and
       wrapped, because a throw in here used to stop the door from opening. */
    entered = true;
    pre.classList.add('is-exiting');
    document.body.classList.add('is-entered');
    setTimeout(function(){ pre.classList.add('is-done'); }, 1000);
    /* The four transition panels sit under the splash, still covering the
       page. Nothing used to pull them back on Home, so entering left you
       staring at them. Slide them away as the splash dissolves. */
    if (window.OT_REVEAL_IN) window.OT_REVEAL_IN(true);
    try {
      if (A()) {
        A().unlock(withSound);
        if (withSound) A().enter();
      }
    } catch (e) { /* never let sound trap the visitor on the splash */ }
    buildModel();                        /* heavy work now, hidden by the exit */
  }
  /* If anything at all goes sideways, Enter is not the only way out. */
  addEventListener('keydown', function (e) {
    if (!pre || pre.classList.contains('is-done')) return;
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') enter(false);
  });
  if (pre) pre.addEventListener('click', function (e) {
    if (!pre.classList.contains('is-ready')) return;
    if (e.target.closest('button')) return;      /* the real buttons handle it */
    enter(false);
  });

  var eSound = document.getElementById('enter-sound');
  var eQuiet = document.getElementById('enter-quiet');
  var sBtn   = document.querySelector('.sound-toggle');
  if (eSound) eSound.addEventListener('click', function () {
    if (A() && A().isMuted()) { A().toggle(); if (sBtn) sBtn.classList.remove('is-muted'); }
    enter(true);
  });
  if (eQuiet) eQuiet.addEventListener('click', function () {
    if (A() && !A().isMuted()) { A().toggle(); if (sBtn) sBtn.classList.add('is-muted'); }
    enter(false);
  });

  /* split headline letters */
  document.querySelectorAll('[data-split]').forEach(function (line) {
    var text = line.textContent;
    line.textContent = '';
    line.classList.add('split-line');
    Array.prototype.forEach.call(text, function (chr, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.style.transitionDelay = (0.028 * i) + 's';
      s.innerHTML = chr === ' ' ? '&nbsp;' : chr;
      line.appendChild(s);
    });
  });

  /* =====================================================
     SCROLL-DRIVEN 3D TIRE
     ===================================================== */
  var stageWrap = document.getElementById('gl-stage');
  var heroStage = document.getElementById('anchor-hero');
  var dockSlot  = document.getElementById('dock-slot');
  var afterDock = document.querySelector('.after-dock');

  function unlockAfterDock() {
    if (afterDock && !afterDock.classList.contains('is-unlocked')) {
      afterDock.classList.add('is-unlocked');
    }
  }
  /* on a phone the wheel starts seated, so the quote form is never gated
     behind an arrival that will not happen */
  if (matchMedia('(max-width: 760px)').matches) unlockAfterDock();

  function fallback() {
    setStage(100, 'Ready');
    if (heroStage) heroStage.innerHTML = '<img class="tire-fallback" src="__LOGO_SRC__" alt="OnlyTires performance tire">';
    if (stageWrap) stageWrap.style.display = 'none';
    unlockAfterDock();
  }

  if (reduce || !stageWrap || typeof THREE === 'undefined' ||
      typeof THREE.GLTFLoader === 'undefined') { fallback(); return; }

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true }); }
  catch (e) { fallback(); return; }
  /* phones gain nothing visible from a 3x buffer but pay for it in heat and
     frame time, so cap lower on small screens */
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.6 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  stageWrap.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var FOV = 34, CAMZ = 10;
  var camera = new THREE.PerspectiveCamera(FOV, innerWidth/innerHeight, 0.1, 100);
  camera.position.set(0, 0, CAMZ);

  scene.add(new THREE.AmbientLight(0xffffff, 0.68));
  scene.add(new THREE.HemisphereLight(0xf4f7ff, 0x30364a, 0.55));
  var key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(4,6,6); scene.add(key);
  var fill = new THREE.DirectionalLight(0xdfe8ff, 0.45); fill.position.set(-5,2,4); scene.add(fill);
  var rim1 = new THREE.PointLight(0x2b5bff, 2.2, 20); rim1.position.set(-4,-1.5,3.5); scene.add(rim1);
  var rim2 = new THREE.PointLight(0x1741d6, 1.4, 20); rim2.position.set(3.5,3,-2.5); scene.add(rim2);

  var holder = new THREE.Group(); scene.add(holder);
  var spinner = new THREE.Group(); holder.add(spinner);

  /* subtle dust */
  var pGeo = new THREE.BufferGeometry(), P = 60, pos = new Float32Array(P*3);
  for (var i=0;i<P;i++){ pos[i*3]=(Math.random()-.5)*10; pos[i*3+1]=(Math.random()-.5)*6; pos[i*3+2]=(Math.random()-.5)*4-1; }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  var pMat = new THREE.PointsMaterial({ color:0x1741d6, size:0.03, transparent:true, opacity:0.45 });
  var dust = new THREE.Points(pGeo, pMat); scene.add(dust);

  var loaded = false;
  var modelBuffer = null;

  /* ------------------------------------------------------------------
     Getting the model into memory WITHOUT freezing the tab.

     The old path did `atob()` then a 3.9-million-iteration byte loop, then
     parsed 3.7 MB of glTF — all synchronously, a moment after load. That
     locked the main thread: the percentage stalled and the Enter click was
     queued but never processed. That was the hang.

     Now: the bytes are decoded off-thread via fetch() on the data URI, and
     the expensive parse is deferred until after you press Enter, so it is
     hidden behind the exit animation and can never trap anyone.
     ------------------------------------------------------------------ */
  function decodeModel(done) {
    /* Preferred path: fetch the .glb as a real binary asset. It is 3.76 MB
       on the wire instead of 5.0 MB of base64, it is decoded off the main
       thread, and the browser caches it. */
    var url = window.__OT_TYRE_GLB_URL__ || 'assets/car_tyre.glb';

    function viaB64() {
      /* Opened straight from disk (file://), where fetch/XHR of a local file
         is blocked by the browser. Pull in the base64 copy as a plain script
         tag, which file:// does allow, so the 3D still works on a
         double-click preview exactly as before. */
      var b64 = window.TYRE_GLB_B64;
      if (b64) { window.TYRE_GLB_B64 = null; decodeChunked(b64, done); return; }
      var s = document.createElement('script');
      s.src = window.__OT_TYRE_GLB_B64_URL__ || 'assets/car_tyre.glb.js';
      s.onload = function () {
        var d = window.TYRE_GLB_B64;
        window.TYRE_GLB_B64 = null;
        if (d) decodeChunked(d, done); else done(null);
      };
      s.onerror = function () { done(null); };
      document.head.appendChild(s);
    }

    if (location.protocol === 'file:' || !window.fetch) { viaB64(); return; }

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.arrayBuffer();
      })
      .then(function (buf) { done(buf); })
      .catch(viaB64);
  }

  /* fallback: same work, sliced across frames so the UI keeps breathing */
  function decodeChunked(b64, done) {
    var str;
    try { str = atob(b64); } catch (e) { done(null); return; }
    var len = str.length, out = new Uint8Array(len), i = 0;
    (function slice() {
      var end = Math.min(i + 262144, len);
      for (; i < end; i++) out[i] = str.charCodeAt(i);
      if (i < len) {
        setStage(20 + Math.round((i / len) * 30), 'Decoding 3D tire');
        setTimeout(slice, 0);
      } else done(out.buffer);
    })();
  }

  var buildStarted = false;
  function buildModel() {
    if (buildStarted || !modelBuffer || !entered) return;
    buildStarted = true;
    /* let the exit animation take the first frames, then parse */
    setTimeout(function () {
      try {
        new THREE.GLTFLoader().parse(modelBuffer, '', function (gltf) {
          var model = gltf.scene;
          var box = new THREE.Box3().setFromObject(model);
          var size = new THREE.Vector3(); box.getSize(size);
          var center = new THREE.Vector3(); box.getCenter(center);
          model.position.sub(center);
          var axle = size.x < size.y ? (size.x < size.z ? 'x' : 'z')
                                     : (size.y < size.z ? 'y' : 'z');
          var wrap = new THREE.Group(); wrap.add(model);
          if (axle === 'x') wrap.rotation.y = Math.PI / 2;
          else if (axle === 'y') wrap.rotation.x = Math.PI / 2;
          wrap.scale.setScalar(1 / Math.max(size.x, size.y, size.z));
          /* re-measure once the axle rotation is applied and correct any
             residual offset, so the wheel is dead centre on its anchor */
          var after = new THREE.Box3().setFromObject(wrap);
          var ac = new THREE.Vector3(); after.getCenter(ac);
          wrap.position.sub(ac);
          spinner.add(wrap);
          modelBuffer = null;
          loaded = true;
        }, function () { fallback(); });
      } catch (e) { fallback(); }
    }, 260);
  }

  /* ------------------------------------------------------------------
     Everything the visitor will actually see is fetched before the door
     opens: the 3D model's bytes, and every brand tire and logo used by the
     carousel. That way nothing pops in later.
     ------------------------------------------------------------------ */
  var modelDone = false, artDone = false;
  function maybeReady() {
    if (modelDone && artDone) { setStage(100, 'Ready'); buildModel(); }
  }

  /* --- brand artwork --- */
  (function preloadBrandArt() {
    var urls = [];
    ['__OT_BRAND_TIRES__', '__OT_BRAND_LOGOS__', '__OT_BRAND_BGS__'].forEach(function (key) {
      var map = window[key];
      if (!map) return;
      for (var k in map) if (map.hasOwnProperty(k) && map[k]) urls.push(map[k]);
    });
    if (!urls.length) { artDone = true; maybeReady(); return; }

    var loaded = 0, total = urls.length;
    function tick() {
      loaded++;
      /* brand art occupies 55 -> 96 on the bar */
      setStage(55 + Math.round((loaded / total) * 41),
               'Loading brands ' + loaded + '/' + total);
      if (loaded >= total) { artDone = true; maybeReady(); }
    }
    urls.forEach(function (u) {
      var img = new Image();
      img.onload = tick;
      img.onerror = tick;          /* a missing file must not hold the door */
      img.decoding = 'async';
      img.src = u;
    });
    /* never let a stalled image trap anyone */
    setTimeout(function () {
      if (!artDone) { artDone = true; maybeReady(); }
    }, 12000);
  })();

  /* --- 3D model --- */
  setStage(20, 'Loading 3D tire');
  decodeModel(function (buf) {
    modelBuffer = buf;
    if (!buf) { fallback(); return; }
    modelDone = true;
    maybeReady();
  });

  function worldPerPx(){ return (2*Math.tan(FOV*Math.PI/360)*CAMZ)/viewSize().h; }
  function elWorld(el){
    var r = el.getBoundingClientRect(), w = worldPerPx();
    return {
      x:(r.left + r.width/2 - innerWidth/2)*w,
      y:-(r.top + r.height/2 - innerHeight/2)*w,
      w:r.width*w, h:r.height*w
    };
  }
  function docCenterY(el){ var r = el.getBoundingClientRect(); return r.top + scrollY + r.height/2; }

  /* ------------------------------------------------------------------
     Anchors are SECTION SPANS, not points.

     The previous version interpolated between anchor centre points, so the
     wheel started drifting toward the next section as soon as it passed a
     centre — which is why it left the cards early and reached the bay before
     the bay was on screen. Now each anchor owns the whole scroll range of
     its section: while the viewport centre is inside that section the wheel
     is locked to its slot and simply rides along, and it only travels during
     the handover between one section and the next.
     ------------------------------------------------------------------ */
  var KEYS = [
    { el:document.getElementById('anchor-hero'),     fit:0.78, yaw:-0.55, pitch:0.10 },
    { el:document.getElementById('anchor-services'), fit:0.72, yaw: 0.85, pitch:0.22 },
    { el:document.getElementById('anchor-why'),      fit:0.70, yaw:-1.00, pitch:-0.12 },
    { el:document.getElementById('dock-slot'),       fit:0.84, yaw: 0.0,  pitch:0.0 }
  ].filter(function(k){ return k.el; });

  /* the section each slot lives in defines that anchor's scroll range */
  KEYS.forEach(function (k) {
    /* fall back to the element itself if a slot is ever moved outside a
       <section>, so a markup change can never leave the rig with no span */
    k.section = (k.el.closest && k.el.closest('section')) || k.el.parentElement || k.el;
  });
  /* A section's LOCK range is its span minus a release zone at each edge.
     The wheel is pinned to the slot across the lock range — that is the part
     where it rides along with the content — and travels across the release
     zones, so the handover flows out of one section and into the next instead
     of snapping at the boundary. */
  function spanOf(sec, isFirst, isLast) {
    var r = sec.getBoundingClientRect();
    var top = r.top + scrollY, h = r.height;
    var pad = Math.max(Math.min(h * 0.16, innerHeight * 0.45), innerHeight * 0.16);
    if (pad > h * 0.34) pad = h * 0.34;          /* never eat a short section */
    return {
      top: top, bottom: top + h,
      lockStart: isFirst ? top - innerHeight : top + pad,
      lockEnd:   isLast  ? top + h + innerHeight : top + h - pad
    };
  }

  /* On a phone the wheel does not travel with the scroll. It is placed in
     its slot for whichever section is on screen and simply stays there —
     no gliding, no arc — while remaining fully draggable. Tablet and
     desktop keep the full scroll-driven journey. */
  /* Matches the CSS breakpoint. Read live rather than captured once, so a
     rotation or a late viewport measurement can never leave the rig in the
     wrong mode. */
  var phoneQuery = matchMedia('(max-width: 760px)');
  function isPhone(){ return phoneQuery.matches; }

  /* On a phone the wheel does not tour the page: the install bay is its only
     home and it sits there from the first frame. Everything above is hidden
     in CSS so no empty slots are left behind. */
  /* declared here so onModeChange below can never reset it before the
     declaration executes (the same hoisting trap that once hid the wheel) */
  var placed = false;
  var ALL_KEYS = KEYS;
  function activeKeys(){
    return isPhone() ? [ALL_KEYS[ALL_KEYS.length - 1]] : ALL_KEYS;
  }
  /* The canvas lives full-screen on desktop (the wheel tours the page) and
     inside the bay on a phone (the wheel belongs to that one element). */
  var inlineMode = null;
  function applyMode() {
    var wantInline = isPhone();
    if (wantInline === inlineMode) return;
    inlineMode = wantInline;
    if (wantInline && dockSlot) {
      dockSlot.appendChild(stageWrap);
      stageWrap.classList.add('is-inline');
      stageWrap.classList.remove('is-parked');
    } else {
      document.body.appendChild(stageWrap);
      stageWrap.classList.remove('is-inline');
    }
    placed = false;
    resize();
  }

  /* re-place instantly if the mode changes under us */
  function onModeChange(){ applyMode(); }
  if (phoneQuery.addEventListener) phoneQuery.addEventListener('change', onModeChange);
  else if (phoneQuery.addListener) phoneQuery.addListener(onModeChange);

  var docked = false;
  /* The smoothing state starts at its defaults, so the very first rendered
     frame used to ease from the centre of the screen into the hero — the
     wheel appeared to slide in on arrival. `placed` (declared above) makes
     it snap straight to its target the first time it is drawn. */
  var sm = { x:0, y:0, s:1, yaw:-0.55, pitch:0.1 };
  var spin = 0, spinVel = 0.006, dragging = false, lastX = 0, lastScroll = scrollY;
  var mNX = 0, mNY = 0;

  /* ---- drag to spin ----
     The hero has a dedicated drag surface. On touch devices the wheel also
     appears in the other section slots, so those become drag surfaces too —
     otherwise it would be interactive in the hero only. Vertical panning is
     preserved (touch-action:pan-y), so the page still scrolls normally. */
  var px = function(e){ return e.touches ? e.touches[0].clientX : e.clientX; };

  function makeDraggable(el) {
    if (!el || el.__otDrag) return;
    el.__otDrag = true;
    el.style.touchAction = 'pan-y';
    el.style.pointerEvents = 'auto';
    el.addEventListener('mousedown',  function(e){ dragging=true; lastX=px(e); });
    el.addEventListener('touchstart', function(e){ dragging=true; lastX=px(e); }, {passive:true});
    el.addEventListener('touchmove',  function(e){
      if (!dragging) return;
      var d = px(e)-lastX; lastX = px(e);
      spinVel = Math.max(-0.3, Math.min(0.3, d*0.0035));
    }, {passive:true});
  }

  makeDraggable(document.querySelector('.drag-zone'));
  KEYS.forEach(function (k) { makeDraggable(k.el); });

  addEventListener('mouseup', function(){ dragging=false; });
  addEventListener('touchend', function(){ dragging=false; });
  addEventListener('mousemove', function(e){
    if (!dragging) return;
    var d = px(e)-lastX; lastX = px(e);
    spinVel = Math.max(-0.3, Math.min(0.3, d*0.0035));
  });

  addEventListener('mousemove', function(e){
    mNX = e.clientX/innerWidth - 0.5;
    mNY = e.clientY/innerHeight - 0.5;
  });

  function viewSize(){
    /* measure the host element when inline; fall back to the viewport if it
       cannot be measured for any reason */
    var host = inlineMode ? (stageWrap.parentElement || dockSlot) : null;
    if (host && host.getBoundingClientRect) {
      var r = host.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
      }
    }
    return { w: innerWidth, h: innerHeight };
  }
  function resize(){
    var v = viewSize();
    renderer.setPixelRatio(Math.min(devicePixelRatio, isPhone() ? 1.6 : 2));
    renderer.setSize(v.w, v.h, false);
    camera.aspect = v.w / v.h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', function(){ applyMode(); resize(); });
  applyMode();
  resize();

  /* Coming back via bfcache restores the page mid-scroll; re-measure and make
     sure the canvas is not left parked from wherever you were standing. */
  addEventListener('pageshow', function () {
    resize();
    stageWrap.classList.remove('is-parked');
    lastScroll = scrollY;
    placed = false;              /* snap, don't glide, after a restore */
  });
  /* if the GPU drops the context, show the still instead of an empty gap */
  renderer.domElement.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); fallback();
  });
  function smoothstep(t){ return t*t*(3-2*t); }

  (function frame(){
    requestAnimationFrame(frame);
    if (!loaded) { renderer.render(scene,camera); return; }

    var scrollVel = scrollY - lastScroll; lastScroll = scrollY;

    /* Which section is the viewport looking at? */
    if (inlineMode) {
      /* centred in the bay's own canvas — no page geometry involved */
      var vh = viewSize();
      var fit = Math.min(vh.w, vh.h) * worldPerPx() * 0.82;
      if (!placed) { placed = true; sm.x = 0; sm.y = 0; sm.s = fit; sm.yaw = 0; sm.pitch = 0; }
      sm.s += (fit - sm.s) * 0.2;
      holder.position.set(0, 0, 0);
      holder.scale.setScalar(sm.s);
      holder.rotation.y = 0;
      holder.rotation.x = 0;
      if (!docked && dockSlot) { docked = true; dockSlot.classList.add('is-docked'); unlockAfterDock(); }
      spin += spinVel;
      spinVel += (0.004 - spinVel) * 0.02;
      spinner.rotation.z = -spin;
      dust.visible = false;
      renderer.render(scene, camera);
      return;
    }
    dust.visible = true;

    var probe = scrollY + innerHeight * 0.5;
    var KEYS = activeKeys();
    var last = KEYS.length - 1;
    var spans = KEYS.map(function (k, i) { return spanOf(k.section, i === 0, i === last); });

    var inside = -1, prev = -1, next = -1;
    for (var i = 0; i < spans.length; i++) {
      if (probe >= spans[i].lockStart && probe < spans[i].lockEnd) { inside = i; break; }
      if (spans[i].lockEnd <= probe) prev = i;
      else if (next === -1) next = i;
    }

    var Ak, Bk, te, travelling;
    if (isPhone()) {
      /* one anchor only: the bay. Always there, never travelling. */
      Ak = Bk = KEYS[0]; te = 0; travelling = false;
    } else if (inside >= 0) {
      /* locked: the wheel rides this section's slot for its whole length */
      Ak = Bk = KEYS[inside]; te = 0; travelling = false;
    } else if (prev === -1) {
      Ak = Bk = KEYS[0]; te = 0; travelling = false;
    } else if (next === -1) {
      Ak = Bk = KEYS[KEYS.length - 1]; te = 0; travelling = false;
    } else {
      /* handover: travel across the release zones between the two sections */
      var from = spans[prev].lockEnd, to = spans[next].lockStart;
      var raw = to > from ? (probe - from) / (to - from) : 1;
      raw = raw < 0 ? 0 : (raw > 1 ? 1 : raw);
      Ak = KEYS[prev]; Bk = KEYS[next]; te = smoothstep(raw); travelling = true;
    }

    var finalSeg = (Bk === KEYS[KEYS.length - 1]);

    var wa = elWorld(Ak.el), wb = elWorld(Bk.el);
    var fitA = Math.min(wa.w, wa.h) * Ak.fit, fitB = Math.min(wb.w, wb.h) * Bk.fit;

    var tx = wa.x + (wb.x - wa.x) * te;
    var ty = wa.y + (wb.y - wa.y) * te;
    var ts = fitA + (fitB - fitA) * te;
    var tyaw = Ak.yaw + (Bk.yaw - Ak.yaw) * te;
    var tpitch = Ak.pitch + (Bk.pitch - Ak.pitch) * te;

    if (travelling && !finalSeg) {
      /* a gentle arc so the handover reads as travel, not a slide */
      ty += Math.sin(te * Math.PI) * 0.4;
    } else if (travelling && finalSeg) {
      /* final approach into the bay: decelerate, breathe slightly wider,
         and square up as it lands */
      ts *= 1 + 0.05 * Math.sin(te * Math.PI);
      ty += Math.sin(te * Math.PI) * 0.16;
      tyaw *= (1 - te * te);
      tpitch *= (1 - te * te);
    }

    /* seated once the bay's section owns the viewport — always true on a
       phone, where the bay is the wheel's only home */
    var lockNow = isPhone() ? true : (inside === KEYS.length - 1);
    var slotW = dockSlot ? elWorld(dockSlot) : null;
    if (lockNow && slotW) {
      tx = slotW.x; ty = slotW.y;
      ts = Math.min(slotW.w, slotW.h) * KEYS[KEYS.length - 1].fit;
      tyaw = 0; tpitch = 0;
    }

    /* tell the bay how close the wheel is (0..1) so it can light up on the
       approach rather than flicking on at the moment of contact */
    if (dockSlot && dockSlot.style && dockSlot.style.setProperty) {
      var near = lockNow ? 1
               : (travelling && finalSeg ? Math.max(0, Math.min(1, (te - 0.45) / 0.5)) : 0);
      dockSlot.style.setProperty('--dock-near', near.toFixed(3));
    }

    if (lockNow) {
      if (!docked) {
        docked = true;
        if (dockSlot) dockSlot.classList.add('is-docked');
        if (A()) A().thunk();
        unlockAfterDock();          /* quote form appears only now */
      }
    } else if (docked && !lockNow) {
      docked = false;
      if (dockSlot) dockSlot.classList.remove('is-docked');
    }

    /* hide the canvas entirely once the bay has scrolled away, so the
       wheel can never overlap the quote form below it */
    if (dockSlot) {
      var r = dockSlot.getBoundingClientRect();
      stageWrap.classList.toggle('is-parked', r.bottom < innerHeight * 0.12);
    }

    /* Damping firms up as the wheel nears the bay. Once seated it is 1:1 with
       the slot — any easing there shows up as the wheel lagging a few pixels
       behind the ring while the page is moving, which looks off-centre. */
    var d = (isPhone() || docked) ? 1 : (travelling && finalSeg ? 0.085 + te * 0.1 : 0.095);
    if (!placed) {
      /* first paint: be exactly where we belong, with no entrance move */
      placed = true;
      sm.x = tx; sm.y = ty; sm.s = ts; sm.yaw = tyaw; sm.pitch = tpitch;
      d = 1;
    }
    sm.x += (tx-sm.x)*d;
    sm.y += (ty-sm.y)*d;
    sm.s += (ts-sm.s)*d;
    if (isPhone()) {
      sm.yaw = tyaw; sm.pitch = tpitch;
    } else {
      sm.yaw   += ((tyaw   + (docked?0:mNX*0.22)) - sm.yaw)*(docked?0.2:0.07);
      sm.pitch += ((tpitch + (docked?0:mNY*0.13 + Math.max(-0.2,Math.min(0.2,scrollVel*0.003)))) - sm.pitch)*(docked?0.2:0.07);
    }

    holder.position.set(sm.x, sm.y, 0);
    holder.scale.setScalar(sm.s);
    holder.rotation.y = sm.yaw;
    holder.rotation.x = sm.pitch;

    spin += spinVel;
    spinVel += ((docked?0.001:0.006) - spinVel)*0.02;
    spinner.rotation.z = (isPhone() ? 0 : -scrollY*0.005) - spin;

    dust.rotation.y += 0.0004;
    dust.position.y = scrollY*0.0012;
    pMat.opacity = Math.max(0, 0.45 - scrollY/(innerHeight*1.2)*0.45);

    renderer.render(scene, camera);
  })();
})();
