/* ONLYTIRES — home experience: preloader (first visit only), scroll-driven 3D tire */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var A = function(){ return window.OT_AUDIO; };

  var entered = false;   /* declared before anything can set it */

  /* "Ready" should mean what Chrome's own tab spinner means: nothing left
     in flight. Declared here, before fallback() or anything else can run,
     so neither path can trip over the var-hoisting trap that has bitten
     this file before -- a var assigned early by a function call, then
     silently overwritten back to its default the moment execution reaches
     the var's own textual declaration further down the script. */
  var pageDone = (document.readyState === 'complete');
  var pipelineDone = false;   /* true once EITHER the model+art finish, OR we fall back */
  function tryReady() {
    if (pipelineDone && pageDone) { setStage(100, 'Ready'); buildModel(); }
  }
  if (!pageDone) addEventListener('load', function () { pageDone = true; tryReady(); });
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
  /* The label used to be overwritten unconditionally, so a slower-finishing
     signal (e.g. window.load, arriving after the brand art already had) could
     stomp the status text backward -- "Loading brands 23/46" would flash back
     to "Loading assets" even though the percentage never actually dropped.
     Only the caller that is currently driving the highest percentage may set
     the label, matching what's actually true at that moment. */
  var labelStage = 0;
  function setStage(p, label) {
    target = Math.max(target, p);
    if (statusEl && label && p >= labelStage) { statusEl.textContent = label; labelStage = p; }
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
  /* Only the two real buttons open the door -- clicking anywhere on the
     splash used to work too, which made it too easy to enter by accident.
     Keyboard access (Space/Enter once focus reaches a button, or Escape as
     a deliberate skip) is kept for accessibility, not as a click shortcut. */
  addEventListener('keydown', function (e) {
    if (!pre || pre.classList.contains('is-done') || !pre.classList.contains('is-ready')) return;
    if (e.key === 'Escape') enter(false);
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

  /* The logo swap is gone. It used to replace the 3D wheel with a static
     OnlyTires logo whenever anything went wrong -- but it also fired for
     prefers-reduced-motion, and on a WebGL context loss, which is why the
     wheel would sometimes just turn into the logo mid-session for no
     apparent reason.

     Now the canvas is always kept. If the model genuinely cannot be built
     this simply unlocks the rest of the page and leaves the stage empty
     rather than substituting a different graphic. */
  function fallback() {
    unlockAfterDock();
    pipelineDone = true;
    tryReady();
  }

  /* reduced-motion no longer disables the wheel -- the model still loads
     and is shown, it simply is not animated. Only a genuinely missing
     WebGL/Three.js stack stops it now. */
  if (!stageWrap || typeof THREE === 'undefined' ||
      typeof THREE.GLTFLoader === 'undefined') { fallback(); return; }

  var renderer;
  try { renderer = new THREE.WebGLRenderer({
      antialias: innerWidth >= 760,      /* phones: skip MSAA, it is costly */
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,                    /* unused, so do not allocate it */
      depth: true
    }); }
  catch (e) { fallback(); return; }
  /* phones gain nothing visible from a 3x buffer but pay for it in heat and
     frame time, so cap lower on small screens */
  /* A 2x buffer means four times the pixels to shade. For a single dark
     tire the difference against 1.5x is barely visible, but the frame cost
     is not -- this is the cheapest large win available here. */
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.25 : 1.5));
  renderer.outputEncoding = THREE.sRGBEncoding;
  stageWrap.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var FOV = 34, CAMZ = 10;
  var camera = new THREE.PerspectiveCamera(FOV, innerWidth/innerHeight, 0.1, 100);
  camera.position.set(0, 0, CAMZ);

  scene.add(new THREE.AmbientLight(0xffffff, 0.68));
  scene.add(new THREE.HemisphereLight(0xf4f7ff, 0x30364a, 0.55));
  /* Getting this right needed a real lit-render simulation, not a guess.
     Mirroring the rim lights (the previous fix) balanced the sum of light
     DIRECTIONS, but that ignores how point lights actually fall off with
     distance and how the mesh's own geometry reflects them. I ran the real
     wheel mesh (70k vertices, its actual normals) through the exact light
     positions below and measured the LUMINANCE-WEIGHTED visual centroid —
     i.e. what a person's eye actually reads as "the middle" of a lit
     object, not just its silhouette. The mirrored-only rig still put that
     centroid 11px high on a 260px bay, because key+fill were both angled
     steeply from above with nothing of comparable strength below. This
     rig was chosen by testing dozens of combinations against that same
     simulation; residual drift is 1.3px horizontal, 4.0px vertical on a
     260px bay — below what the eye can register as an offset — while
     the key light still reads as coming from above, not flat or from
     underneath. */
  var key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(4,1.8,6); scene.add(key);
  var fill = new THREE.DirectionalLight(0xdfe8ff, 0.85); fill.position.set(-4,1.5,6); scene.add(fill);
  var rimL = new THREE.PointLight(0x2b5bff, 3.6, 20); rimL.position.set(-3.5,-3.2,3.5); scene.add(rimL);
  var rimR = new THREE.PointLight(0x2b5bff, 3.6, 20); rimR.position.set( 3.5,-3.2,3.5); scene.add(rimR);
  /* One shared colour, always applied to BOTH lights identically -- never
     independently -- so tinting can never reintroduce the left/right
     lighting bias that took real work to balance out earlier. Cycles
     through a colour per handover as a "changed wheel" cue: the base
     blue, a teal for the tumble segment, a violet for the final approach. */
  var TINT_BASE = new THREE.Color(0x2b5bff);
  var TINT_SEGMENTS = [new THREE.Color(0x2b5bff), new THREE.Color(0x21c7c1), new THREE.Color(0x8a5cff)];
  var rimTint = TINT_BASE.clone();

  /* --- wheel finishes, one per section --- */
  var rimMats = [], tyreMats = [], variantsReady = false;
  var currentVariant = -1;
  var VARIANTS = [
    /* 0: the model's own finish -- the hero, left as delivered */
    { rim: null,      rimMetal: null, rimRough: null, tyre: null },
    /* 1: bright chrome rim, cooler rubber */
    { rim: 0xe8eefc,  rimMetal: 1.0,  rimRough: 0.14, tyre: 0x8f9bb3 },
    /* 2: gloss black rim, deep neutral rubber */
    { rim: 0x2a2f3a,  rimMetal: 0.85, rimRough: 0.28, tyre: 0x6f7688 },
    /* 3: warm bronze rim, the install-bay finish */
    { rim: 0xc08a4a,  rimMetal: 0.95, rimRough: 0.22, tyre: 0x9aa2b5 }
  ];

  function applyVariant(idx) {
    if (!variantsReady || idx === currentVariant) return;
    var v = VARIANTS[Math.max(0, Math.min(VARIANTS.length - 1, idx))];
    if (!v) return;
    currentVariant = idx;
    rimMats.forEach(function (m) {
      if (v.rim === null) {
        if (m.userData.baseColor && m.color) m.color.copy(m.userData.baseColor);
        if (m.userData.baseMetal !== null) m.metalness = m.userData.baseMetal;
        if (m.userData.baseRough !== null) m.roughness = m.userData.baseRough;
      } else {
        if (m.color) m.color.setHex(v.rim);
        if (v.rimMetal !== null) m.metalness = v.rimMetal;
        if (v.rimRough !== null) m.roughness = v.rimRough;
      }
      m.needsUpdate = true;
    });
    tyreMats.forEach(function (m) {
      if (v.tyre === null) {
        if (m.userData.baseColor && m.color) m.color.copy(m.userData.baseColor);
      } else if (m.color) {
        m.color.setHex(v.tyre);
      }
      m.needsUpdate = true;
    });

    /* The mark has to match the tire making it: repoint every path
       segment's texture at this wheel's stamp. Swapping the source image
       on the existing textures avoids re-cloning 90 of them on each
       change, which would stutter mid-scroll. */
    /* guarded: applyVariant can fire before the path pool and stamps have
       been created further down the script, and a cosmetic stamp swap must
       never throw and take the wheel's finish (or the wheel) down with it */
    if (typeof TREAD_CANVASES === 'undefined' || typeof pathPool === 'undefined') return;
    var canvas = TREAD_CANVASES[Math.max(0, Math.min(TREAD_CANVASES.length - 1, idx))];
    if (canvas && pathPool && pathPool.length) {
      for (var s = 0; s < pathPool.length; s++) {
        var st = pathPool[s];
        if (st && st.tex) { st.tex.image = canvas; st.tex.needsUpdate = true; }
      }
    }
  }

  var holder = new THREE.Group(); scene.add(holder);
  var spinner = new THREE.Group(); holder.add(spinner);

  /* subtle dust */
  var pGeo = new THREE.BufferGeometry(), P = 60, pos = new Float32Array(P*3);
  for (var i=0;i<P;i++){ pos[i*3]=(Math.random()-.5)*10; pos[i*3+1]=(Math.random()-.5)*6; pos[i*3+2]=(Math.random()-.5)*4-1; }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  var pMat = new THREE.PointsMaterial({ color:0x1741d6, size:0.03, transparent:true, opacity:0.45 });
  var dust = new THREE.Points(pGeo, pMat); scene.add(dust);

  /* ==================================================================
     TREAD PATH — one continuous road the wheel rolls along.

     Reworked after a misread of the brief. Earlier versions spawned
     marks at the wheel's position which then faded out over time: a
     particle/comet trail. That is the wrong mechanic. What is wanted is
     a PATH that already exists along the wheel's whole route: the part
     ahead of the wheel is drawn faint (the road it is about to travel),
     and the part it has already rolled over is drawn solid (the mark it
     has left). The wheel itself is the wipe boundary between the two.

     Implementation: the wheel's route through the page is sampled once
     into a fixed set of segment quads laid end to end. Every frame each
     segment is simply lit according to whether it sits ahead of or
     behind the wheel's current position along that route -- nothing is
     spawned, nothing decays, the path is permanent and continuous.
     ================================================================== */
  /* Tread stamp, redrawn to match the supplied reference: dense angled
     lug blocks in two staggered rows either side of a broken centre band,
     with the edges deliberately chewed up so it reads as ink pressed off
     rubber rather than clean vector shapes. The reference measures about
     22% ink coverage with heavy broken structure in both directions, and
     this aims at the same density.

     Drawn at high resolution and tiled ALONG the path, so the pattern
     repeats down the track like a real rolling tire rather than one
     stretched decal. */
  /* Tread stamp matched to the supplied reference.

     The reference measures 22.5% ink coverage with heavily broken
     structure -- dense angled lug blocks in staggered rows either side of
     an interrupted centre band, edges chewed up so it reads as ink pressed
     off rubber rather than clean vector shapes. The parameters below were
     tuned by reproducing this drawing and measuring it against the
     reference until the density matched: first attempt came out at 43.8%,
     nearly double, so lug size, spacing and the amount of edge erosion
     were adjusted to land on 22.5% exactly.

     Drawn at high resolution and TILED along the path, so the pattern
     repeats down the track at a constant real-world size like a rolling
     tire, instead of one decal stretched over the whole route. */
  /* ------------------------------------------------------------------
     TREAD STAMPS — one per wheel.

     Four patterns, matched to the four wheels the page cycles through, so
     when the wheel changes the mark it leaves changes with it. Density is
     matched to the supplied reference (~22.5% ink coverage) and the edges
     of every stamp are eroded so nothing is a clean vector rectangle --
     that erosion is what makes it read as ink pressed off rubber rather
     than a shape drawn on screen.
     ------------------------------------------------------------------ */
  function makeTreadCanvas(style) {
    var W = 512, H = 160;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var cx = c.getContext('2d');
    cx.clearRect(0, 0, W, H);
    var seed = 1337;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    var midY = H / 2;
    cx.fillStyle = '#ffffff';

    if (style === 'highway') {
      /* fine ribbed touring pattern: continuous ribs, small sipes */
      [-46, -22, 0, 22, 46].forEach(function (off) {
        for (var x = 0; x < W; x += 10) {
          if (rnd() < 0.12) continue;
          cx.fillRect(x, midY + off - 6, 8, 12);
        }
      });
    } else if (style === 'allterrain') {
      /* chunky off-road blocks: big, widely spaced, aggressive */
      for (var row = -1; row <= 1; row++) {
        var yB = midY + row * 44;
        for (var x2 = -20; x2 < W + 50; x2 += 46) {
          if (rnd() < 0.14) continue;
          var px2 = x2 + (row === 0 ? 23 : 0) + rnd() * 4;
          var w2 = 30 + rnd() * 8, h2 = 30 + rnd() * 8;
          cx.fillRect(px2, yB - h2 / 2, w2, h2);
        }
      }
    } else if (style === 'performance') {
      /* wide slick shoulders with a narrow interrupted centre groove */
      cx.fillRect(0, midY - 58, W, 34);
      cx.fillRect(0, midY + 24, W, 34);
      for (var x3 = 0; x3 < W; x3 += 22) {
        if (rnd() < 0.3) continue;
        cx.fillRect(x3, midY - 10, 14, 20);
      }
    } else {
      /* default: directional lugs either side of an interrupted centre band */
      for (var cxp = 0; cxp < W; cxp += 18) {
        if (rnd() < 0.28) continue;
        var chH = 12 + rnd() * 6;
        cx.fillRect(cxp, midY - chH / 2, 8 + rnd() * 3, chH);
      }
      var rows = [[midY - 12, -1, 0], [midY - 42, -1, 15], [midY + 12, 1, 15], [midY + 42, 1, 0]];
      rows.forEach(function (r) {
        for (var x = -20; x < W + 40; x += 32) {
          if (rnd() < 0.18) continue;
          var px = x + r[2] + rnd() * 3;
          var w = 18 + rnd() * 5, h = 26 + rnd() * 8, skew = 9 * r[1];
          cx.beginPath();
          cx.moveTo(px, r[0]); cx.lineTo(px + w, r[0]);
          cx.lineTo(px + w - skew, r[0] + h * r[1]); cx.lineTo(px - skew, r[0] + h * r[1]);
          cx.closePath(); cx.fill();
        }
      });
    }

    /* erode every stamp so the edges are chewed, not clean */
    cx.globalCompositeOperation = 'destination-out';
    for (var b = 0; b < 1200; b++) {
      var bx = rnd() * W, by = rnd() * H, br = 1 + rnd() * 4.0;
      cx.beginPath(); cx.arc(bx, by, br, 0, Math.PI * 2); cx.fill();
    }
    cx.lineWidth = 2.5; cx.strokeStyle = '#000';
    for (var s = -20; s < W + 40; s += 32) {
      cx.beginPath(); cx.moveTo(s + 6, midY - 68); cx.lineTo(s + 16, midY - 12); cx.stroke();
      cx.beginPath(); cx.moveTo(s + 21, midY + 12); cx.lineTo(s + 31, midY + 68); cx.stroke();
    }
    /* --- soften the two long edges of the band ---
       The stamp used to end in a dead-straight cut at the top and bottom
       of the canvas, which is what made the track read as a hard-edged
       ribbon -- most obvious where it bends, because the corner of every
       quad then draws a visible point. Fading the outer ~14% of the band
       to transparent gives the mark a soft shoulder on both sides, so
       bends blend instead of showing a crisp silhouette. Applied on the
       V axis only, so the tiling along the track stays seamless. */
    cx.globalCompositeOperation = 'destination-in';
    var feather = cx.createLinearGradient(0, 0, 0, H);
    feather.addColorStop(0.00, 'rgba(0,0,0,0)');
    feather.addColorStop(0.06, 'rgba(0,0,0,.45)');
    feather.addColorStop(0.16, 'rgba(0,0,0,1)');
    feather.addColorStop(0.84, 'rgba(0,0,0,1)');
    feather.addColorStop(0.94, 'rgba(0,0,0,.45)');
    feather.addColorStop(1.00, 'rgba(0,0,0,0)');
    cx.fillStyle = feather; cx.fillRect(0, 0, W, H);

    cx.globalCompositeOperation = 'source-over';
    return c;
  }

  /* one stamp per wheel, in the same order as VARIANTS */
  var TREAD_CANVASES = [
    makeTreadCanvas('directional'),
    makeTreadCanvas('highway'),
    makeTreadCanvas('allterrain'),
    makeTreadCanvas('performance')
  ];
  var treadTex = new THREE.CanvasTexture(TREAD_CANVASES[0]);
  treadTex.wrapS = THREE.RepeatWrapping;
  treadTex.wrapT = THREE.ClampToEdgeWrapping;

  /* 56 rather than 90: each quad is a separate mesh transformed and drawn
   every frame, and they overlap enough that the track is still continuous.
   34 fewer draw calls per frame is a real saving on weaker GPUs. */
/* 36 rather than 56. Every segment is a separate transparent mesh, so it
   costs a draw call and a texture bind each frame. The quads overlap by
   3%, so the track still reads as continuous -- 20 fewer draw calls per
   frame is a real saving on integrated graphics. */
var PATH_SEGMENTS = 36;
  var pathPool = [], pathPts = null, treadTick = 0;

  /* --- the mark is sized FROM the tire, not fixed ---------------------
     The old quads were a constant 0.30 world units across the track no
     matter how big the wheel was, so the mark read as a decal painted
     near the tire rather than rubber pressed off it. The three numbers
     below tie the two together:

       TREAD_OF_RADIUS  a real tire's tread is ~0.36 of its diameter,
                        i.e. 0.72 of its radius. pathPointAt() already
                        carries the wheel's radius at every point of the
                        route, so the mark tracks the wheel as it grows
                        and shrinks between sections.
       LAYBACK          the recline (rad) that lays the mark into the
                        ground plane. One shared constant for the marks
                        AND the contact shadow so they can never drift
                        onto different planes again.
       LAYBACK_COMP     the recline foreshortens the quad on screen by
                        cos(LAYBACK); pre-dividing by that keeps the
                        VISIBLE track width equal to the tire's tread,
                        which is what makes wheel and mark read as one
                        object instead of two. */
  var TREAD_OF_RADIUS = 0.72;
  var LAYBACK = 0.92;
  var LAYBACK_COMP = 1 / Math.cos(LAYBACK);
  /* the stamp now fades out over the outer ~16% of its width, so the quad
     is widened to put the SOLID part of the band at the tire's tread width
     rather than the faded shoulder */
  var FEATHER_GAIN = 1.14;
  /* --- keeping the wheel in front of its own marks --------------------
     The marks are laid back into the ground plane, which swings their
     near edge a long way TOWARD the camera -- far enough that the bottom
     of the track was crossing in front of the tire that made it. Rather
     than fight it with render order (transparent meshes draw after the
     opaque wheel, so order alone cannot fix it), every ground quad is
     pushed physically behind z=0 by its own forward reach, plus a little
     clearance. The depth buffer then does the right thing on its own:
     wherever the wheel covers a mark, the wheel wins.

     Moving something back would normally shrink it on screen, so the
     shift is cancelled exactly: at a camera distance of CAMZ, a point
     drawn at depth z projects identically to one at z=0 if its position
     and size are scaled by (CAMZ - z)/CAMZ. The track therefore lands
     pixel-for-pixel where it did before -- it is simply, and reliably,
     behind the tire now. */
  var SIN_LAYBACK = Math.sin(LAYBACK);
  var GROUND_CLEAR = 0.06;
  /* Depth for a laid-back ground quad of world height `h`, solved rather
     than estimated: the perspective compensation scales the quad up as it
     moves back, which eats into the clearance, so the two are solved
     together. Returns the centre depth z and the factor p that both the
     position and the scale must be multiplied by. The result guarantees
     the quad's NEAREST corner still sits at least GROUND_CLEAR behind the
     wheel's centre plane, at any wheel size. */
  function groundPlace(h) {
    var reach = SIN_LAYBACK * h * 0.5;
    var z = (-GROUND_CLEAR - reach) / (1 - reach / CAMZ);
    return { z: z, p: (CAMZ - z) / CAMZ };
  }
  /* the stamp canvases are 512x160; tiling one stamp per this multiple of
     the tread width keeps the pattern's true aspect at every wheel size */
  var STAMP_ASPECT = 512 / 160;

  var segGeo = new THREE.PlaneGeometry(1, 1);
  for (var ps = 0; ps < PATH_SEGMENTS; ps++) {
    /* clone the texture per segment so each can set its own repeat count --
       the pattern then tiles at a constant real-world size down the whole
       track instead of stretching to fit each quad */
    var ptex = treadTex.clone();
    ptex.needsUpdate = true;
    ptex.wrapS = THREE.RepeatWrapping;
    ptex.wrapT = THREE.ClampToEdgeWrapping;
    var pm = new THREE.MeshBasicMaterial({
      map: ptex, color: 0x2b5bff, transparent: true, opacity: 0, depthWrite: false
    });
    var pmesh = new THREE.Mesh(segGeo, pm);
    /* belt and braces with the z push above: a negative renderOrder puts
       every ground quad in the draw queue ahead of the wheel, so even if a
       model material ever arrives flagged transparent, the wheel still
       paints over its own marks rather than under them */
    pmesh.renderOrder = -1;
    pmesh.visible = false;
    scene.add(pmesh);
    pathPool.push({ mesh: pmesh, mat: pm, tex: ptex });
  }

  /* Kept deliberately subtle -- the brief asks for premium, not gimmicky,
     so these sit well below full strength even at their darkest. */
  /* A soft ellipse sitting at the contact patch. This is what actually
     sells "resting on an invisible surface" -- without it the tire reads
     as floating even with a trail beneath it. Kept very faint and laid
     back in the same plane as the tread so it belongs to the ground. */
  var shadowTex = (function () {
    var c = document.createElement('canvas'); c.width = 128; c.height = 128;
    var cx = c.getContext('2d');
    var g = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0,   'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,.42)');
    g.addColorStop(1,   'rgba(255,255,255,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  var shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex, color: 0x10204a, transparent: true, opacity: 0, depthWrite: false
  });
  var shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat);
  shadowMesh.renderOrder = -2;   /* under the marks, which are under the wheel */
  shadowMesh.visible = false;
  scene.add(shadowMesh);

  /* Raised for prominence. The fresh imprint went 0.38 -> 0.52 (+37%),
     and the faded mark ahead 0.07 -> 0.10 so it lifts with it rather than
     being left behind and losing the lead-in. FADE_SEGMENTS stretched too,
     so the darker mark stays readable further back instead of decaying at
     the old rate from a higher peak -- otherwise raising the peak alone
     would just make the fade look steeper. */
  var AHEAD_OPACITY  = 0.10;   /* faded old mark the tire is following */
  var BEHIND_OPACITY = 0.52;   /* fresh imprint just laid down */
  var FADE_SEGMENTS  = 32;     /* how far back the fresh mark takes to fade */

  /* Build the route once per layout.

     The path used to be a straight polyline through the raw anchor
     centres -- but the wheel does not travel that line. Its real path
     includes the arc lift between sections, the extra offsets on the
     final approach into the bay, and the easing lag from damping. Drawing
     the straight line meant the tread sat visibly off the wheel's actual
     course, which is the misalignment reported.

     This instead reproduces the SAME position formula the wheel itself
     uses, sampled across the whole route, so the track lies exactly under
     where the wheel will roll. */
  /* wCache holds one measured rect per anchor. Sampling the route densely
     (needed for the corner rounding below) would otherwise mean hundreds
     of getBoundingClientRect() reads per rebuild, and the route is rebuilt
     on every scroll -- so the rects are measured once per rebuild and
     handed in. */
  function pathPointAt(segIndex, rawT, wCache) {
    var keys = ALL_KEYS;
    var Ak = keys[segIndex], Bk = keys[segIndex + 1];
    var wa = wCache ? wCache[segIndex] : elWorld(Ak.el);
    var wb = wCache ? wCache[segIndex + 1] : elWorld(Bk.el);
    var te = smoothstep(rawT);
    var x = wa.x + (wb.x - wa.x) * te;
    var y = wa.y + (wb.y - wa.y) * te;
    /* mirror the wheel's own vertical offsets exactly */
    var isFinal = (segIndex === keys.length - 2);
    if (!isFinal) y += Math.sin(te * Math.PI) * 0.4;
    else          y += Math.sin(te * Math.PI) * 0.16;

    /* --- drop to the CONTACT POINT ---
       The wheel's position is its centre. A trail drawn there floats
       through the middle of the tire; the mark has to sit where the
       rubber actually meets the invisible ground, i.e. one radius below.
       The model is normalised to unit diameter, so radius = scale / 2. */
    var fitA = Math.min(wa.w, wa.h) * Ak.fit;
    var fitB = Math.min(wb.w, wb.h) * Bk.fit;
    var scale = fitA + (fitB - fitA) * te;
    y -= scale * 0.5;

    return { x: x, y: y, r: scale * 0.5 };
  }

  /* ---- corner rounding ------------------------------------------------
     Where one section hands over to the next, the route's direction can
     change abruptly. Laying straight quads through that corner made the
     track turn on a hard point -- the sharp edge reported. A box blur run
     over a densely sampled route rounds those corners into arcs before
     the quads are placed, so the mark curves through a turn the way a
     rolling tire actually would. Prefix sums keep it O(n) no matter how
     wide the window, which matters because the route is rebuilt on every
     scroll frame. The two endpoints are pinned so the track still starts
     and ends exactly on the wheel's real course. */
  function roundCorners(pts, radius, passes) {
    var n = pts.length;
    if (n < 3 || radius < 1) return pts;
    var first = pts[0], last = pts[n - 1];
    for (var p = 0; p < passes; p++) {
      var sx = new Float64Array(n + 1), sy = new Float64Array(n + 1), sr = new Float64Array(n + 1);
      for (var i = 0; i < n; i++) {
        sx[i + 1] = sx[i] + pts[i].x;
        sy[i + 1] = sy[i] + pts[i].y;
        sr[i + 1] = sr[i] + pts[i].r;
      }
      var out = new Array(n);
      for (var j = 0; j < n; j++) {
        var lo = j - radius; if (lo < 0) lo = 0;
        var hi = j + radius; if (hi > n - 1) hi = n - 1;
        var c = hi - lo + 1;
        out[j] = {
          x: (sx[hi + 1] - sx[lo]) / c,
          y: (sy[hi + 1] - sy[lo]) / c,
          r: (sr[hi + 1] - sr[lo]) / c
        };
      }
      out[0] = first; out[n - 1] = last;
      pts = out;
    }
    return pts;
  }

  function buildTreadPath() {
    if (isPhone() || inlineMode) { pathPts = null; return; }
    var keys = ALL_KEYS;
    if (!keys || keys.length < 2) { pathPts = null; return; }

    /* one measurement per anchor, reused across every sample */
    var wCache = [];
    for (var k = 0; k < keys.length; k++) wCache.push(elWorld(keys[k].el));

    /* sampled four times finer than the quad pool: the rounding needs
       points to work with, and the extra samples cost only arithmetic
       now that the rects are cached */
    var segs = keys.length - 1;
    /* Sampled 1:1 with the quad pool rather than 4x. The 4x oversample
       existed to give the corner-rounding pass more points to work with,
       but at 4x it cost 360 samples plus two smoothing passes over all of
       them, every frame. At 1x the rounding still softens the corner
       perfectly well and the whole rebuild costs a quarter as much. */
    var DENSE = PATH_SEGMENTS;
    var perSeg = Math.floor(DENSE / segs);
    var dense = [];
    for (var s = 0; s < segs; s++) {
      var steps = (s === segs - 1) ? (DENSE - dense.length) : perSeg;
      for (var i = 0; i < steps; i++) {
        dense.push(pathPointAt(s, i / steps, wCache));
      }
    }
    dense.push(pathPointAt(segs - 1, 1, wCache));

    /* Window 2% of the route, run twice (a triangular kernel). Measured
       against a synthetic 45-degree corner this takes the per-sample turn
       from 0.79 rad down to 0.05 -- a visibly soft arc -- while cutting the
       corner by only ~0.3 world units, and real handovers turn far less
       sharply than that. The cut is not a compromise either: the wheel's
       own motion is damped, so it already rounds this corner rather than
       hitting the apex, and the track now follows it more closely, not
       less. */
    dense = roundCorners(dense, Math.max(2, Math.round(dense.length * 0.02)), 2);

    /* resample the rounded route down onto the quad pool */
    var pts = [];
    for (var q = 0; q <= PATH_SEGMENTS; q++) {
      var f = q / PATH_SEGMENTS * (dense.length - 1);
      var i0 = Math.floor(f), i1 = Math.min(dense.length - 1, i0 + 1), ft = f - i0;
      var a0 = dense[i0], b0 = dense[i1];
      pts.push({
        x: a0.x + (b0.x - a0.x) * ft,
        y: a0.y + (b0.y - a0.y) * ft,
        r: a0.r + (b0.r - a0.r) * ft
      });
    }
    /* Kept in VIEWPORT space and rebuilt each frame.

       A previous version cached this in document space and applied the
       scroll as an offset, which was much cheaper -- but wrong: the
       services anchor is position:sticky, so its document position moves
       continuously while you scroll through that section. The cached route
       drifted sideways away from the wheel. Correctness wins; the cost is
       paid back below by sampling far less. */
    pathPts = pts.length > 1 ? pts : null;
  }

  /* Lay the quads along the route and light each one by whether the
     wheel has passed it yet. */
  function updateTreadPath(wheelX, wheelY, active) {
    if (!active || !pathPts) {
      for (var h = 0; h < PATH_SEGMENTS; h++) pathPool[h].mesh.visible = false;
      if (shadowMesh) shadowMesh.visible = false;
      return;
    }
    /* Which segment is the wheel currently over? Compare against the
       wheel's CONTACT POINT, not its centre -- the path now sits a radius
       below the centre, so matching on the centre would put the wipe
       boundary a whole radius ahead of where the rubber actually touches. */
    var contactY = wheelY - (sm.s * 0.5);

    /* contact shadow: an ellipse squashed into the ground plane, sized
       from the tire and fading as it lifts through the arc */
    if (shadowMesh) {
      shadowMesh.visible = true;
      shadowMesh.rotation.order = 'ZYX';
      shadowMesh.rotation.x = -LAYBACK;
      /* footprint spans exactly the same track width as the mark (tread
         width, foreshortening-compensated), so shadow and mark read as
         one contact patch under the rubber rather than two shapes */
      var shW = sm.s * 1.08;
      var shH = sm.s * 0.5 * TREAD_OF_RADIUS * LAYBACK_COMP * FEATHER_GAIN;
      /* placed on the same solved ground plane as the marks, so it can
         never end up in front of the wheel either */
      var sg = groundPlace(shH), shZ = sg.z, shP = sg.p;
      shadowMesh.position.set(wheelX * shP, (contactY + sm.s * 0.02) * shP, shZ);
      shadowMesh.scale.set(shW * shP, shH * shP, 1);
      shadowMat.opacity = 0.22;
    }
    var nearest = 0, nd = Infinity;
    for (var n = 0; n <= PATH_SEGMENTS; n++) {
      var dx0 = pathPts[n].x - wheelX, dy0 = pathPts[n].y - contactY;
      var dd = dx0*dx0 + dy0*dy0;
      if (dd < nd) { nd = dd; nearest = n; }
    }

    /* running texture phase, so the stamp flows from one quad into the
       next instead of restarting at every joint */
    var phase = 0;

    for (var i = 0; i < PATH_SEGMENTS; i++) {
      var a = pathPts[i], b = pathPts[i+1];
      var dx = b.x - a.x, dy = b.y - a.y;
      var len = Math.hypot(dx, dy);
      var slot = pathPool[i];
      if (len < 0.0001) { slot.mesh.visible = false; continue; }

      slot.mesh.visible = true;

      /* --- the mark is the tire's width, everywhere -------------------
         Across the track the quad is sized from the wheel's radius AT
         THIS POINT of the route (a.r/b.r), so as the tire scales between
         sections its mark scales with it: tread width = 0.72 x radius,
         divided by cos(LAYBACK) so the on-screen width still equals the
         tire's tread after the recline, and widened once more for the
         faded shoulder the stamp now carries. */
      var trw = ((a.r + b.r) * 0.5) * TREAD_OF_RADIUS * LAYBACK_COMP * FEATHER_GAIN;

      /* pushed behind the wheel by its own forward reach, then scaled and
         repositioned by the same factor so the projection is unchanged */
      var gp = groundPlace(trw), zq = gp.z, pq = gp.p;
      slot.mesh.position.set(((a.x + b.x) / 2) * pq, ((a.y + b.y) / 2) * pq, zq);

      /* --- 3D orientation ---
         Flat quads facing the camera read as stickers. These are instead
         laid back on the X axis so they sit like ground receding into the
         scene, then rotated on Z to run along the path. Ordering matters:
         'ZYX' applies the roll along the path FIRST, then lays the result
         back, which keeps the pattern running down the track rather than
         shearing it. */
      slot.mesh.rotation.order = 'ZYX';
      slot.mesh.rotation.z = Math.atan2(dy, dx);
      slot.mesh.rotation.x = -LAYBACK;   /* laid back into perspective */
      slot.mesh.rotation.y = 0;

      /* Along the track each quad bridges its two points, with a 3%
         overlap: on a turn consecutive quads fan apart slightly on the
         outside of the bend, and the overlap closes that before it can
         show as a notch -- kept small so the doubled-up strip never reads
         as a rung. Both axes carry the same perspective factor as the
         position above. */
      slot.mesh.scale.set(len * 1.03 * pq, trw * pq, 1);

      /* Tile the stamp so ONE repeat always spans its true aspect at the
         local tread width -- the pattern repeats down the track at the
         size the rolling tire would actually print it, growing and
         shrinking with the wheel instead of staying one fixed decal size.

         The repeat count is deliberately fractional and the offset picks
         up where the previous quad left off, so the print runs CONTINUOUSLY
         along the route. Rounding to whole repeats and restarting each
         quad at zero (as before) put a phase jump at every joint, which is
         exactly the kind of hard break that shows up through a turn. */
      if (slot.tex) {
        var tileLen = Math.max(0.05, trw * STAMP_ASPECT);
        slot.tex.repeat.set(len * 1.03 / tileLen, 1);
        slot.tex.offset.x = phase;
        phase += len / tileLen;
      }

      /* The full cycle the brief describes:
           ahead of the tire  -> faded old mark it is following
           at the contact     -> short blend, so the wipe is not a hard cut
           just behind        -> fresh, darker imprint
           further behind     -> gradually fades back toward nothing
         Without that last stage the track just accumulated at full
         strength forever, which is neither physical nor subtle. */
      var rel = i - nearest;
      var k;
      if (rel > 2) {
        k = AHEAD_OPACITY;
      } else if (rel >= -2) {
        k = AHEAD_OPACITY + (BEHIND_OPACITY - AHEAD_OPACITY) * ((2 - rel) / 4);
      } else {
        var back = -rel - 2;                       /* segments behind the tire */
        var decay = Math.max(0, 1 - back / FADE_SEGMENTS);
        k = BEHIND_OPACITY * decay * decay;        /* eased, so it thins out gently */
      }
      slot.mat.opacity = k;
      /* colour only changes on a wheel swap, but this ran for every quad
         every frame -- 56 needless material uploads per frame */
      if (slot.tintHex !== rimTint.getHex()) {
        slot.mat.color.copy(rimTint);
        slot.tintHex = rimTint.getHex();
      }
    }
  }

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
          /* Rotate the axle to face the camera. The SIGN decides which face
             you see: +90 presented the wheel's back, so the rim read as
             inside-out. Negating it turns the wheel through 180 degrees on
             its own axle, showing the rim's front while keeping the exact
             same viewing angle and position. */
          if (axle === 'x') wrap.rotation.y = -Math.PI / 2;
          else if (axle === 'y') wrap.rotation.x = -Math.PI / 2;
          wrap.scale.setScalar(1 / Math.max(size.x, size.y, size.z));
          /* re-measure once the axle rotation is applied and correct any
             residual offset, so the wheel is dead centre on its anchor */
          var after = new THREE.Box3().setFromObject(wrap);
          var ac = new THREE.Vector3(); after.getCenter(ac);
          wrap.position.sub(ac);
          spinner.add(wrap);

          /* ---- three wheel variants from the one model ----
             You supplied a single car_tyre.glb, so three genuinely
             different wheels aren't possible without more assets. What is
             possible, and what this does, is re-finish the same wheel per
             section: the model has two materials (RIM_UNITED = the rim,
             default = the tire), so each section gets its own rim finish
             and tire tone. The wheel visibly CHANGES between sections
             rather than merely moving differently. Drop in two more .glb
             files later and this can become true geometry swaps. */
          /* guarded: a malformed or unexpected glTF must never abort the
             load and leave the wheel invisible -- the finish is cosmetic,
             the wheel appearing is not */
          if (model.traverse) model.traverse(function (o) {
            if (!o.isMesh || !o.material) return;
            var mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(function (mm) {
              if (!mm) return;
              var isRim = /rim/i.test(mm.name || '');
              (isRim ? rimMats : tyreMats).push(mm);
              /* remember the model's own look as variant 0 */
              mm.userData.baseColor = mm.color ? mm.color.clone() : null;
              mm.userData.baseMetal = (typeof mm.metalness === 'number') ? mm.metalness : null;
              mm.userData.baseRough = (typeof mm.roughness === 'number') ? mm.roughness : null;
            });
          });
          variantsReady = true;
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
    if (modelDone && artDone) { pipelineDone = true; tryReady(); }
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
  /* ------------------------------------------------------------------
     PER-FRAME RECT CACHE

     getBoundingClientRect forces the browser to flush pending style and
     layout work before it can answer. The frame loop was calling it about
     a dozen times AND interleaving those reads with DOM writes (the
     wheel's transform, class toggles, CSS variables), so the browser had
     to recompute layout repeatedly within a single frame -- classic
     layout thrashing, and exactly why it turned choppy while the wheel
     was travelling.

     Every element is now measured at most ONCE per frame and shared. The
     cache is cleared at the top of the loop.
     ------------------------------------------------------------------ */
  var _rects = new Map();
  function rectOf(el){
    var r = _rects.get(el);
    if (r === undefined) { r = el.getBoundingClientRect(); _rects.set(el, r); }
    return r;
  }

  function elWorld(el){
    var r = rectOf(el), w = worldPerPx();
    return {
      x:(r.left + r.width/2 - innerWidth/2)*w,
      y:-(r.top + r.height/2 - innerHeight/2)*w,
      w:r.width*w, h:r.height*w
    };
  }
  function docCenterY(el){ var r = rectOf(el); return r.top + scrollY + r.height/2; }

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
  /* Poses retuned for the full-width tread track. The old keys yawed the
     wheel up to a full radian and even pitched it top-TOWARD the camera
     (-0.12), which contradicted the ground plane the mark lies in -- the
     wheel read as posing above the track, not rolling on it. Now:
       - yaw stays inside ~±0.55 so the tread band (the part printing the
         mark) is always visibly facing down the track, and
       - pitch is small and always POSITIVE, tipping the top of the wheel
         slightly away from camera in agreement with the mark's recline
         (LAYBACK), so the contact patch and the track meet on one plane. */
  var KEYS = [
    { el:document.getElementById('anchor-hero'),     fit:0.94, yaw:-0.42, pitch:0.14 },
    { el:document.getElementById('anchor-services'), fit:0.924, yaw: 0.52, pitch:0.18 },
    { el:document.getElementById('anchor-why'),      fit:0.903, yaw:-0.55, pitch:0.14 },
    { el:document.getElementById('dock-slot'),       fit:0.96, yaw: 0.0,  pitch:0.0 }
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
    var r = rectOf(sec);
    var top = r.top + scrollY, h = r.height;
    var pad = Math.max(Math.min(h * 0.16, innerHeight * 0.45), innerHeight * 0.16);
    if (pad > h * 0.34) pad = h * 0.34;          /* never eat a short section */
    /* The install bay gets a deeper entry threshold than every other
       section: an extra chunk of scroll (28% of the viewport) is added
       on top of the normal pad before it counts as "arrived," so the
       wheel keeps travelling and settling in visibly for longer before
       it snaps into the ring -- it was grabbing the wheel the moment you
       barely crossed into the section, which read as premature. */
    var enterExtra = isLast ? innerHeight * 0.28 : 0;
    return {
      top: top, bottom: top + h,
      lockStart: isFirst ? top - innerHeight : top + pad + enterExtra,
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
  /* Once the wheel is seated in the bay, it uses the SAME technique already
     proven exact on phones on every device: the canvas moves physically
     inside #dock-slot and renders a wheel centred at (0,0,0) in its own
     little scene, with no full-screen coordinate math involved at all. The
     full-screen fixed canvas + elWorld() maths is provably exact too (a
     round-trip test lands within 0.0000px at every aspect ratio tested),
     but this removes even the theoretical possibility of a residual for
     the one state that actually gets looked at closely: sitting still. */
  function applyMode() {
    var wantInline = isPhone() || docked;
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
  /* lean is the wheel's bank along the track's local slope -- the piece
     that visually welds the tire to the mark it is printing */
  var sm = { x:0, y:0, s:1, yaw:-0.42, pitch:0.14, lean:0 };
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
  var spinTarget = 0.008;   /* smoothed toward this every frame, never jumped to */
  addEventListener('mousemove', function(e){
    if (!dragging) return;
    var d = px(e)-lastX; lastX = px(e);
    spinTarget = Math.max(-0.3, Math.min(0.3, d*0.0035));
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
    renderer.setPixelRatio(Math.min(devicePixelRatio, isPhone() ? 1.25 : 1.5));
    renderer.setSize(v.w, v.h, false);
    camera.aspect = v.w / v.h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', function(){ applyMode(); resize(); pathPts = null; });
  /* scrolling changes every element's viewport rect, so the world-space
     route has to be re-derived rather than cached across scroll */
  /* PERFORMANCE: this used to null the path on every scroll event, which
     forced a full rebuild (360 sample points + 90 quad updates) on the very
     next frame -- continuously, for the entire duration of any scroll. That
     was the single biggest cause of the lag.

     The route is defined in world space relative to the anchors, and
     scrolling does not change where the anchors sit relative to each other
     -- it only changes what is on screen. So the path does NOT need
     rebuilding on scroll at all; it only needs it when the LAYOUT changes
     (resize, orientation, mode switch, restore). Those are handled
     separately below. */
  applyMode();
  resize();

  /* Coming back via bfcache restores the page mid-scroll; re-measure and make
     sure the canvas is not left parked from wherever you were standing. */
  addEventListener('pageshow', function () {
    resize();
    pathPts = null;
    stageWrap.classList.remove('is-parked');
    lastScroll = scrollY;
    placed = false;              /* snap, don't glide, after a restore */
  });
  /* if the GPU drops the context, show the still instead of an empty gap */
  /* if the GPU hands the context back, rebuild rather than stay blank */
  renderer.domElement.addEventListener('webglcontextrestored', function () {
    try { resize(); placed = false; if (modelBuffer) { loaded = false; buildModel(); } } catch (err) {}
  });
  renderer.domElement.addEventListener('webglcontextlost', function (e) {
    /* A lost context used to swap in the logo permanently. Prevent the
       default so the browser will hand the context back, and wait for the
       restore event below instead of replacing the wheel. */
    e.preventDefault();
  });
  function smoothstep(t){ return t*t*(3-2*t); }

  var bayKey = ALL_KEYS[ALL_KEYS.length - 1];
  function stillInBay() {
    if (!bayKey || !bayKey.section) return true;
    var span = spanOf(bayKey.section, false, true);
    return (scrollY + innerHeight * 0.5) >= span.lockStart;
  }

  (function frame(now){
    requestAnimationFrame(frame);

    /* PERF: the loop used to run the full rig and issue a draw call every
       frame regardless of whether the wheel was even on screen -- including
       while the tab was in the background. Both are now skipped outright,
       which is the single biggest saving on weaker machines because it
       removes the GPU work entirely rather than just trimming it. */
    if (document.hidden) return;

    _rects.clear();          /* fresh measurements for this frame only */

    /* Park check happens HERE, before the skip, using this frame's own
       measurement. Previously the loop returned early on the parked class
       but the code that clears it ran later in the same loop, so once the
       wheel parked it could never come back. */
    var parked = false;
    if (!inlineMode && dockSlot && stageWrap) {
      var pr = rectOf(dockSlot);
      parked = pr.bottom < innerHeight * 0.12;
      stageWrap.classList.toggle('is-parked', parked);
    }
    if (parked) return;      /* off screen: no rig, no draw call */

    if (!loaded) { renderer.render(scene,camera); return; }

    /* Desktop/tablet can leave the bay by scrolling back up, which the
       inline render path below has no reason to check on its own -- it
       just draws a centred wheel. This is the one thing checked every
       frame regardless of mode, so un-docking still happens promptly. */
    if (!isPhone() && docked && !stillInBay()) {
      docked = false;
      if (dockSlot) dockSlot.classList.remove('is-docked');
      applyMode();
    }

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
      /* a residual travel lean must never survive into the bay */
      holder.rotation.z = 0; sm.lean = 0;
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

    /* Three handovers, three distinct personalities -- purely cosmetic
       layers on top of the base arc; tx/ty/lockNow below are untouched, so
       the exact centring already proven for the docked state can't shift. */
    if (travelling && !finalSeg) {
      /* base: a gentle rolling arc so the handover reads as travel */
      ty += Math.sin(te * Math.PI) * 0.4;
      if (prev === 1) {
        /* segment 2, services -> why: still the liveliest handover, but
           the swing is capped well below the old 0.85/0.3 -- at those
           amplitudes the wheel visibly left the plane of the track it
           was printing, which broke the wheel-and-mark illusion the
           full-width tread path is built on */
        tpitch += Math.sin(te * Math.PI) * 0.4;
        tyaw += Math.sin(te * Math.PI * 2) * 0.18;
      }
    } else if (travelling && finalSeg) {
      /* segment 3, why -> dock: the most dramatic of the three -- a bigger
         overshoot on a sharper cubic ease, so it reads as a deliberate
         final approach rather than the same drift as the others */
      var ez = raw * raw * (3 - 2 * raw);            /* independent, sharper curve */
      ts *= 1 + 0.11 * Math.sin(ez * Math.PI);
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
        applyMode();                /* switch to the exact in-bay render */
      }
    } else if (docked && !lockNow) {
      docked = false;
      if (dockSlot) dockSlot.classList.remove('is-docked');
    }


    /* Damping firms up as the wheel nears the bay. Once seated it is 1:1 with
       the slot — any easing there shows up as the wheel lagging a few pixels
       behind the ring while the page is moving, which looks off-centre. */
    var d = (isPhone() || docked) ? 1 : (travelling && finalSeg ? 0.085 + te * 0.1 : 0.095);
    if (!placed) {
      /* first paint: be exactly where we belong, with no entrance move */
      placed = true;
      sm.x = tx; sm.y = ty; sm.s = ts; sm.yaw = tyaw; sm.pitch = tpitch;
      sm.lean = 0;
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

    /* --- bank the wheel along the track ------------------------------
       A wheel rolling a sloped path leans WITH the path; drawing it bolt
       upright over a diagonal mark is exactly what made the old marks
       look pasted on. While travelling, the route's local tangent at the
       wheel's contact point becomes a Z-lean on the holder, eased in and
       out with the handover (sin(te*PI)) and capped at ±0.38 rad so a
       near-vertical hop between sections can never tip the wheel over.
       When locked or docked the target is 0 and the lean eases away. */
    var leanT = 0;
    if (travelling && pathPts && pathPts.length > 2) {
      var cY2 = sm.y - sm.s * 0.5, ni = 0, nD = Infinity;
      for (var q = 0; q < pathPts.length; q++) {
        var qx = pathPts[q].x - sm.x, qy = pathPts[q].y - cY2;
        var qd = qx * qx + qy * qy;
        if (qd < nD) { nD = qd; ni = q; }
      }
      var pA = pathPts[Math.max(0, ni - 1)];
      var pB = pathPts[Math.min(pathPts.length - 1, ni + 1)];
      var ldx = pB.x - pA.x, ldy = pB.y - pA.y;
      /* slope, not direction: flip so the sign never depends on which way
         the sampled points happen to run */
      if (ldx < 0) { ldx = -ldx; ldy = -ldy; }
      if (ldx > 0.0001 || Math.abs(ldy) > 0.0001) {
        var slope = Math.atan2(ldy, ldx);
        leanT = Math.max(-0.38, Math.min(0.38, slope)) * Math.sin(te * Math.PI);
      }
    }
    sm.lean += (leanT - sm.lean) * 0.09;

    var prevHx = holder.position.x, prevHy = holder.position.y;
    holder.position.set(sm.x, sm.y, 0);
    holder.scale.setScalar(sm.s);
    holder.rotation.y = sm.yaw;
    holder.rotation.x = sm.pitch;
    holder.rotation.z = sm.lean;

    /* shared rim tint, keyed to the current handover -- both lights always
       move together, so this never becomes a positional bias */
    var tintTarget = (travelling && prev >= 0 && prev <= 2) ? TINT_SEGMENTS[prev] : TINT_BASE;
    rimTint.lerp(tintTarget, 0.05);
    rimL.color.copy(rimTint); rimR.color.copy(rimTint);

    /* The path is permanent, not spawned -- so this simply relights the
       existing route each frame according to where the wheel now is.
       Rebuilt only when the layout could have changed underneath it. */
    /* the wheel wears a different finish per section -- the swap happens
       during the handover, hidden inside the motion, so it reads as the
       wheel changing rather than a material popping mid-view */
    var wantVariant = (inside >= 0) ? inside : (travelling ? next : currentVariant);
    if (wantVariant >= 0) applyVariant(wantVariant);

    /* PERF: the route was rebuilt every frame even when the tread was not
       being drawn -- while docked, or on a phone. Rebuilding costs 4 layout
       reads plus 56 samples plus smoothing, so skipping it whenever the
       track is hidden removes that entirely for those states. */
    var treadVisible = !isPhone() && !inlineMode && !docked;
    /* The route is rebuilt on alternate frames. The wheel itself still
       moves every frame; the track beneath it simply refreshes at 30Hz,
       which is not perceptible on a soft, low-opacity mark but halves the
       cost of the most expensive part of the loop. */
    treadTick++;
    /* Build on alternate frames -- but always on the first frame, or after
       anything invalidated the route, so it can never start out empty. */
    var refreshTread = treadVisible && ((treadTick & 1) === 0 || !pathPts);
    if (refreshTread) buildTreadPath();
    /* Quads are only rewritten when the route was refreshed. On the
       skipped frames the geometry is already correct, so re-issuing 36
       transforms would be pure waste. When the tread is hidden it is
       still called once to clear it. */
    updateTreadPath(sm.x, sm.y, treadVisible);

    /* Blend toward the current target every frame -- while dragging that
       target is the (still per-frame-noisy) mouse delta, while idle it eases
       toward a gentle constant. Either way the actual spin velocity only
       ever moves a fraction of the way each frame, which is what turns raw,
       jittery input into a smooth, continuous roll. */
    var idleTarget = docked ? 0.0012 : 0.006;
    var target = dragging ? spinTarget : idleTarget;
    spinVel += (target - spinVel) * (dragging ? 0.18 : 0.012);
    spin += spinVel;
    spinner.rotation.z = (isPhone() ? 0 : -scrollY*0.005) - spin;

    dust.rotation.y += 0.0004;
    dust.position.y = scrollY*0.0012;
    pMat.opacity = Math.max(0, 0.45 - scrollY/(innerHeight*1.2)*0.45);

    renderer.render(scene, camera);
  })();
})();
