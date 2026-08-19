/* ============================================================================
   ONLYTIRES — THE TIRE WALL (brand carousel controller)

   Ported from the reference build. It owns the brand list, the copy, the
   backdrop cross-fade and the controls; the 3D wheel in the centre slot is
   driven by the site's existing scroll rig, which treats #anchor-wall as one
   of its parking anchors. Everything here still reads and still works if
   WebGL never arrives — the poster behind the canvas is the fallback.
   ========================================================================== */
(function () {
  'use strict';

  var DATA = [
    {slug:'michelin',name:'Michelin',region:'PERFORMANCE & EVERYDAY MOBILITY',url:'https://www.michelinman.com/',blurb:'A global benchmark for grip, comfort and long-mile confidence, with a broad range spanning everyday cars to performance and EV applications.'},
    {slug:'goodyear',name:'Goodyear',region:'PERFORMANCE, TOURING & SUV',url:'https://www.goodyear.com/',blurb:'Goodyear combines responsive road feel with all-season versatility, with strong coverage across passenger cars, SUVs and light trucks.'},
    {slug:'pirelli',name:'Pirelli',region:'HIGH-PERFORMANCE ROAD & TRACK',url:'https://www.pirelli.com/tires/en-us/car/homepage',blurb:'Pirelli is deeply associated with performance tires, bringing motorsport-inspired development to premium road cars, SUVs and EVs.'},
    {slug:'yokohama',name:'Yokohama',region:'PERFORMANCE & TOURING',url:'https://www.yokohamatire.com/',blurb:'Yokohama blends sporty handling with practical road manners across performance, touring, crossover and SUV applications.'},
    {slug:'dunlop',name:'Dunlop',region:'SPORT & TOURING',url:'https://www.dunloptires.com/',blurb:'Dunlop is known for a sporty character, with road tires developed around steering response, stability and controlled wet performance.'},
    {slug:'bridgestone',name:'Bridgestone',region:'TOURING, PERFORMANCE & SUV',url:'https://www.bridgestonetire.com/',blurb:'Bridgestone offers a wide portfolio engineered around wet grip, durability and controlled handling for modern road vehicles.'},
    {slug:'continental',name:'Continental',region:'SAFETY, TOURING & EV',url:'https://www.continental-tires.com/us/en/',blurb:'Continental focuses on braking, safety and efficiency, with a broad range for cars, SUVs, vans and future mobility.'},
    {slug:'kumho',name:'Kumho Tire',region:'PASSENGER, SUV & TRUCK',url:'https://www.kumhotire.com/en/index.do',blurb:'Kumho pairs practical value with modern ride and handling characteristics across passenger, SUV, commercial and specialty tires.'},
    {slug:'hankook',name:'Hankook',region:'PERFORMANCE, EV & SUV',url:'https://www.hankooktire.com/us/en/home.html',blurb:'Hankook develops high-tech tires across passenger cars, SUVs and EVs, balancing road control with comfort and efficiency.'},
    {slug:'falken',name:'Falken Tire',region:'SPORT, ALL-TERRAIN & TRUCK',url:'https://www.falkentire.com/',blurb:'Falken leans into aggressive road feel and off-road capability, with product families spanning performance cars through trucks and SUVs.'},
    {slug:'bfgoodrich',name:'BFGoodrich',region:'ALL-TERRAIN & OFF-ROAD',url:'https://www.bfgoodrichtires.com/',blurb:'BFGoodrich is strongly associated with rugged all-terrain performance, with tires designed for mixed surfaces and demanding truck/SUV use.'},
    {slug:'firestone',name:'Firestone',region:'EVERYDAY, SUV & TRUCK',url:'https://www.firestone.com/',blurb:'Firestone brings dependable road performance to everyday drivers, pickups and SUVs, with a practical mix of comfort, traction and durability.'},
    {slug:'nankang',name:'Nankang',region:'PERFORMANCE & VALUE',url:'https://www.nankang-tyre.com/en',blurb:'Nankang covers everyday replacement and performance applications, with a broad catalogue aimed at value-conscious drivers.'},
    {slug:'toyo',name:'Toyo Tires',region:'PERFORMANCE & ALL-TERRAIN',url:'https://www.toyotires.com/',blurb:'Toyo blends sporty handling with strong SUV and off-road coverage, especially for drivers who want a distinctive road or trail setup.'},
    {slug:'nitto',name:'Nitto',region:'ENTHUSIAST & TRUCK',url:'https://www.nittotire.com/',blurb:'Nitto is built around enthusiast culture, offering performance street tires alongside highly capable truck and off-road designs.'},
    {slug:'sumitomo',name:'Sumitomo',region:'VALUE & ALL-SEASON',url:'https://www.sumitomotire.com/',blurb:'Sumitomo offers practical all-season and performance-oriented choices designed to balance dependable road manners with long service life.'},
    {slug:'cooper',name:'Cooper Tires',region:'SUV, TRUCK & EVERYDAY',url:'https://www.coopertire.com/',blurb:'Cooper emphasizes rugged everyday dependability, with strong coverage for family vehicles, pickups, SUVs and roads less traveled.'},
    {slug:'milestar',name:'Milestar',region:'VALUE, PERFORMANCE & TRUCK',url:'https://www.milestartires.com/',blurb:'Milestar spans budget-friendly road tires through performance and truck applications, with an emphasis on practical fitment choices.'},
    {slug:'geostar',name:'Geostar',region:'EVERYDAY REPLACEMENT',url:'https://www.geostar-tyre.com/',blurb:'Geostar is positioned around straightforward replacement tires for daily driving, with a simple focus on fitment, value and road use.'},
    {slug:'uniroyal',name:'Uniroyal',region:'WET-WEATHER & ALL-SEASON',url:'https://www.uniroyaltires.com/',blurb:'Uniroyal has a long association with wet-weather confidence, offering practical products built around traction and everyday road use.'},
    {slug:'general',name:'General Tire',region:'TRUCK, SUV & ALL-TERRAIN',url:'https://generaltire.com/',blurb:'General Tire focuses on durable road and off-road capability, with familiar coverage for SUVs, pickups and demanding mixed surfaces.'},
    {slug:'kelly',name:'Kelly Tires',region:'EVERYDAY & VALUE',url:'https://www.kellytires.com/',blurb:'Kelly offers practical everyday tires designed to balance ride, traction and value for a wide range of passenger and light-truck vehicles.'},
    {slug:'triangle',name:'Triangle',region:'COMMERCIAL & PASSENGER',url:'https://en.triangle.com.cn/',blurb:'Triangle develops a broad global tire portfolio spanning passenger, truck, bus and specialty applications with a focus on practical performance.'}
  ];

  /* the build inlines the artwork as data URIs so every page stays standalone */
  var LOGOS = window.__OT_BRAND_LOGOS__ || {};
  var BGS   = window.__OT_BRAND_BGS__ || {};
  /* Per-brand tire photography. Drop a file at
     assets/brand-tires/<slug>.webp and it is picked up automatically at
     build time; anything missing falls back to the generic studio render,
     alternating pose so neighbouring slides never look identical. */
  var TIRES = window.__OT_BRAND_TIRES__ || {};
  var FALLBACK = window.__OT_TIRE_FALLBACK__ || {front:'', angle:''};
  /* brands whose wordmark is drawn in black and needs a white plate to stay
     legible on the dark panel — measured from the artwork at build time */
  var PLATE = window.__OT_LOGO_PLATE__ || [];
  function tireFor(i) {
    var item = DATA[i];
    return TIRES[item.slug] || FALLBACK.front;
  }

  function mod(n, m) { return (n % m + m) % m; }
  /** fewest steps from a to b around the ring, signed */
  function shortest(from, to, len) {
    var d = mod(to - from, len);
    return d > len / 2 ? d - len : d;
  }

  function init() {
    var root = document.querySelector('[data-tire-configurator]');
    if (!root) return;

    var stage    = root.querySelector('[data-tire-stage]');
    var copy     = root.querySelector('.config-copy');
    var brand    = document.getElementById('configBrand');
    var region   = document.getElementById('configRegion');
    var blurb    = document.getElementById('configBlurb');
    var learn    = document.getElementById('configLearn');
    var progress = document.getElementById('configProgress');
    var dots     = document.getElementById('configDots');
    var logoImg  = document.getElementById('configLogoImg');

    var focusImg = root.querySelector('[data-tire-focus]');
    var sidePrev = root.querySelector('[data-tire-side="prev"]');
    var sideNext = root.querySelector('[data-tire-side="next"]');
    var live     = root.querySelector('[data-tire-live]');
    var viewer   = root.querySelector('.tire-config__viewer');
    var rack     = root.querySelector('.config-rack');
    if (!stage || !brand) return;

    var layers = Array.prototype.slice.call(stage.querySelectorAll('[data-tire-bg]'));
    var index = 0, front = 0, swapTimer = 0;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var A = function () { return window.OT_AUDIO; };

    /* ---- dots ---- */
    DATA.forEach(function (item, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'config-dot' + (i === 0 ? ' is-active' : '');
      d.setAttribute('aria-label', item.name);
      d.addEventListener('click', function () { goTo(i); });
      dots.appendChild(d);
    });
    var dotEls = Array.prototype.slice.call(dots.children);

    root.querySelectorAll('[data-tire-prev]').forEach(function (b) {
      b.addEventListener('click', function () { step(-1); });
    });
    root.querySelectorAll('[data-tire-next]').forEach(function (b) {
      b.addEventListener('click', function () { step(1); });
    });

    if (viewer) {
      viewer.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      });
    }

    /* ---- drag across the stage steps the wall ---- */
    var dragging = false, lastX = 0, acc = 0;
    function px(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
    stage.addEventListener('mousedown',  function (e) { dragging = true; lastX = px(e); acc = 0; });
    stage.addEventListener('touchstart', function (e) { dragging = true; lastX = px(e); acc = 0; }, { passive: true });
    addEventListener('mouseup',  function () { dragging = false; });
    addEventListener('touchend', function () { dragging = false; });
    function onDrag(e) {
      if (!dragging) return;
      var d = px(e) - lastX; lastX = px(e); acc += d;
      if (Math.abs(acc) > 60) { step(acc > 0 ? -1 : 1); acc = 0; }
    }
    addEventListener('mousemove', onDrag);
    stage.addEventListener('touchmove', onDrag, { passive: true });

    /* ---- render ---- */
    function paintBackdrop(slug) {
      if (!layers.length) return;
      var next = layers[(front + 1) % layers.length];
      var url = BGS[slug];
      if (!url) return;
      next.style.backgroundImage = 'url("' + url + '")';
      layers.forEach(function (l) { l.classList.remove('is-active'); });
      next.classList.add('is-active');
      front = (front + 1) % layers.length;
    }

    function render() {
      var item = DATA[index];

      if (copy) copy.classList.add('is-swapping');
      if (rack) rack.classList.add('is-stepping');
      clearTimeout(swapTimer);

      if (focusImg) focusImg.classList.add('is-swapping');

      swapTimer = setTimeout(function () {
        brand.textContent = item.name;
        if (focusImg) {
          focusImg.src = tireFor(index);
          focusImg.alt = item.name + ' tire';
          focusImg.classList.remove('is-swapping');
        }
        if (sidePrev) sidePrev.src = tireFor(mod(index - 1, DATA.length));
        if (sideNext) sideNext.src = tireFor(mod(index + 1, DATA.length));
        if (region) region.textContent = item.region;
        if (blurb) blurb.textContent = item.blurb;
        if (learn) { learn.href = item.url; }
        if (logoImg && LOGOS[item.slug]) {
          logoImg.src = LOGOS[item.slug];
          logoImg.alt = item.name;
        }
        var logoBox = document.getElementById('configLogo');
        if (logoBox) logoBox.classList.toggle('on-plate', PLATE.indexOf(item.slug) !== -1);
        if (copy) copy.classList.remove('is-swapping');
        if (rack) rack.classList.remove('is-stepping');
      }, reduce ? 0 : 190);

      paintBackdrop(item.slug);

      if (progress) {
        var n = String(index + 1).padStart(2, '0');
        progress.textContent = n;
        var wrapEl = progress.parentElement;
        if (wrapEl) wrapEl.setAttribute('data-mobile', n + ' / ' + String(DATA.length).padStart(2, '0'));
      }
      dotEls.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
      if (live) live.textContent = item.name + ', brand ' + (index + 1) + ' of ' + DATA.length;
      stage.dataset.index = String(index);
    }

    function goTo(i) {
      var target = mod(i, DATA.length);
      if (target === index) return;
      index = target;
      render();
      if (A()) A().step();
    }
    function step(delta) { goTo(index + delta); }

    stage.dataset.count = String(DATA.length);
    render();

  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
