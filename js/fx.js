/* ONLYTIRES — shared FX: nav, reveals, tilt, two-way page transitions, UI sound hooks */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var A = function(){ return window.OT_AUDIO; };

  /* ---------- always open at the top ----------
     history.scrollRestoration is set to 'manual' in the head, but browsers
     may still have applied a restored offset before this runs, so put the
     page back at the top on a fresh load. A back/forward restore from
     bfcache is left alone — returning to where you were is correct there. */
  (function () {
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var isReloadOrFresh = !nav || nav.type === 'reload' || nav.type === 'navigate';
    if (isReloadOrFresh) {
      if (scrollY !== 0) scrollTo(0, 0);
      /* some browsers restore the offset a tick after load */
      addEventListener('load', function () {
        if (scrollY !== 0) scrollTo(0, 0);
      });
    }
  })();

  /* ---------- image protection ----------
     Right-click "Save image as" and the native drag-to-desktop gesture are
     blocked on every <img>. This is a deterrent, not real DRM — anyone who
     really wants the file can still get it via dev tools — but it stops the
     casual right-click save the request is asking for. Buttons, links and
     anything explicitly opted in via data-selectable keep their normal
     context menu, so "open in new tab" style workflows are not broken. */
  document.addEventListener('contextmenu', function (e) {
    if (e.target && e.target.tagName === 'IMG' && !e.target.closest('[data-selectable]')) {
      e.preventDefault();
    }
  });
  document.addEventListener('dragstart', function (e) {
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
  });

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links  = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
      if (A()) open ? A().open() : A().close();
    });
  }

  /* close the menu on Escape */
  if (toggle && links) {
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('is-open')) toggle.click();
    });
  }

  /* ---------- reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- card tilt (subtle, follows cursor within the card only) ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.tile').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'translateY(-6px) perspective(800px) rotateX(' + (-y*4) + 'deg) rotateY(' + (x*5) + 'deg)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- marquee ---------- */
  var track = document.querySelector('.trustbar-track');
  if (track && !reduce) track.innerHTML += track.innerHTML;

  /* ---------- forms ---------- */
  document.querySelectorAll('form[data-quote-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = form.querySelector('.form-success');
      if (ok) { ok.classList.add('is-visible'); ok.scrollIntoView({ behavior: reduce?'auto':'smooth', block:'center' }); }
      if (A()) A().thunk();
      form.querySelectorAll('input,select,textarea').forEach(function (f) { if (f.type !== 'submit') f.value = ''; });
    });
    form.querySelectorAll('input,select,textarea').forEach(function (f) {
      f.addEventListener('focus', function(){ if (A()) A().focus(); });
    });
  });

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- UI sound hooks ---------- */
  if (matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('a.btn, button.btn, .nav-links a, .tile, .svc-row, .chip, .stat').forEach(function (el) {
      el.addEventListener('mouseenter', function(){ if (A()) A().tick(); });
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('a.btn, button.btn, .tile, .svc-row, .mobile-bar a');
    if (t && A()) A().click();
  }, true);

  /* ---------- TWO-WAY PAGE TRANSITIONS ----------
     The veil starts COVERED in CSS, so the page is never visible
     uncovered before the reveal begins — that was the mid-transition
     flash. We only ever animate it away, then park it idle.        */
  var veil = document.querySelector('.page-veil');
  var isHome = !!document.querySelector('.preloader');
  var revealed = false;

  /* resting state is simply "no state class": panels sit at scaleY(0) */
  function parkVeil() {
    if (!veil) return;
    veil.classList.remove('is-revealing', 'is-covering', 'is-covered');
  }

  function revealIn(silent) {
    if (!veil || revealed) return;
    revealed = true;
    if (reduce) { parkVeil(); return; }
    /* one frame so the covered state is painted, then animate away */
    requestAnimationFrame(function () {
      veil.classList.remove('is-covering');
      veil.classList.add('is-revealing');
      /* drop the no-transition starting state on the next frame so the
         retreat animates instead of snapping */
      requestAnimationFrame(function () { veil.classList.remove('is-covered'); });
      /* same whoosh as the cover — the transition sounds identical both ways */
      if (!silent && A()) A().whoosh();
      setTimeout(parkVeil, 1100);
    });
  }
  window.OT_REVEAL_IN = revealIn;

  /* Interior pages reveal immediately. Home hands off to the preloader, which
     calls OT_REVEAL_IN when you enter — but if that script is missing, slow or
     throws, this failsafe guarantees the panels never stay stuck over the page. */
  if (!isHome) revealIn();
  else setTimeout(function () { if (!revealed) revealIn(true); }, 9000);

  if (veil) {
    /* A navigation already under way owns the transition. A second click used
       to re-add `is-covering` while the panels were still mid-cover — the
       transform was already at its end value, so nothing animated and the
       screen simply went dark. Now the first animation is allowed to finish
       and the destination is just updated to whatever you clicked last. */
    var navPending = null;

    /* the filename this document was loaded as, e.g. "tires.html" */
    function currentFile() {
      var p = location.pathname.split('/').pop();
      return p || 'index.html';
    }

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank' ||
          href.indexOf('tel:') === 0 || href.indexOf('mailto:') === 0 ||
          href.indexOf('http') === 0) return;
      e.preventDefault();

      /* Clicking a link to the page you're already on (e.g. Home from the
         nav while already on Home) is a SAME-DOCUMENT navigation once #s is
         appended -- changing only the hash never reloads the page in any
         browser. That left the cover animation with nothing to ever reveal
         it again (stuck fully covered), and the #s marker permanently
         stuck in the address bar since the code that strips it only runs
         on a genuine page load -- which a later real reload would then
         misread as "arrived via internal nav" and wrongly skip the
         preloader. Simplest correct behaviour: it's already the current
         page, so there's nothing to navigate to -- just close the mobile
         menu if open and stop, with no transition and no hash added. */
      var destFile = href.split('#')[0].split('?')[0] || 'index.html';
      if (destFile === currentFile()) {
        if (links && links.classList.contains('is-open')) toggle.click();
        return;
      }

      /* A persistent utility action -- the sticky "Get a Quote" bar always
         pinned to the bottom of the screen -- should feel instant, not like
         part of the cinematic page-to-page journey. The full cover/hold/
         reveal sequence added a self-inflicted 910ms of pure waiting before
         the browser even started fetching the destination, on the site's
         single highest-value action. Anything marked data-instant skips the
         decorative wipe and navigates right away. */
      if (a.hasAttribute('data-instant')) {
        if (A()) A().whoosh();
        location.href = markInternal(href);
        return;
      }

      /* Mark this as an in-site navigation BEFORE anything else can return
         early. Carried TWO ways on purpose: a sessionStorage flag for normal
         hosting, and a short marker appended to the URL itself as the
         primary channel. sessionStorage on file:// is partitioned or
         blocked outright in a number of browsers (sometimes per file, not
         just per folder), which is exactly what made the preloader reappear
         on every return to Home when testing by double-clicking the page
         rather than through a server. A URL marker cannot be blocked by a
         storage policy — it travels with the navigation itself. */
      function markInternal(url) {
        try { sessionStorage.setItem('ot-internal-nav', '1'); } catch (err) {}
        return url + (url.indexOf('#') === -1 ? '#s' : '');
      }

      if (navPending) { navPending = href; return; }
      navPending = href;

      if (A()) A().whoosh();
      if (reduce) { location.href = markInternal(href); return; }

      /* Reset the panels to their open position with no transition, force a
         reflow, then animate. Without this a click that lands while the veil
         is still revealing would start the cover from a half-open state. */
      veil.classList.add('is-instant');
      veil.classList.remove('is-revealing', 'is-covered', 'is-covering');
      void veil.offsetWidth;
      veil.classList.remove('is-instant');
      void veil.offsetWidth;
      veil.classList.add('is-covering');

      /* 0.5s to rise (+0.21s stagger) then held fully covered for 0.2s */
      setTimeout(function () {
        location.href = markInternal(navPending || href);
      }, 910);
    });

    /* back/forward restore: page comes from bfcache fully rendered,
       so drop the veil instantly instead of replaying it */
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { revealed = true; parkVeil(); }
    });
    /* Only reset the veil if this page is actually going INTO bfcache
       (event.persisted). pagehide also fires on a completely ordinary
       forward navigation -- calling parkVeil() there stripped the
       'is-covering' class while the rise animation was still mid-flight,
       snapping the bars back to invisible for an instant before the next
       page's own baked-in covered state took over. That was the visible
       stutter: bars rising, then vanishing, then reappearing already
       fully covered. Left alone, an outgoing page's classes simply don't
       matter -- it's about to be destroyed -- so there's nothing to fix
       on a normal navigation. */
    window.addEventListener('pagehide', function (e) {
      if (e.persisted) parkVeil();
    });
  }

  /* ---------- file upload chips ---------- */
  document.querySelectorAll('.filedrop').forEach(function (drop) {
    var input = drop.querySelector('input[type=file]');
    var label = drop.querySelector('.filedrop-text b');
    var hint  = drop.querySelector('.filedrop-text small');
    if (!input) return;
    var defaultLabel = label ? label.textContent : '';
    var defaultHint  = hint ? hint.textContent : '';
    input.addEventListener('change', function () {
      if (input.files && input.files.length) {
        var f = input.files[0];
        if (label) label.textContent = f.name;
        if (hint) hint.textContent = Math.max(1, Math.round(f.size / 1024)) + ' KB · tap to change';
        drop.classList.add('has-file');
        if (A()) A().click();
      } else {
        if (label) label.textContent = defaultLabel;
        if (hint) hint.textContent = defaultHint;
        drop.classList.remove('has-file');
      }
    });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('has-file'); });
    drop.addEventListener('dragleave', function () { if (!input.files.length) drop.classList.remove('has-file'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
  });

  /* ---------- THE TIRE WALL — brand ring ---------- */
  (function () {
    var ring = document.querySelector('.wall-ring-inner');
    if (!ring) return;
    var brands = [
      { n:'Michelin',    d:'Long-wearing touring and premium all-season sets — the safe, quiet choice for daily driving.', t:['Touring','All-season','Quiet'] },
      { n:'Goodyear',    d:'Dependable all-rounders with strong wet grip, from commuters to work trucks.', t:['All-season','Wet grip','Truck'] },
      { n:'Bridgestone', d:'Balanced comfort and tread life, with strong performance and SUV options.', t:['Comfort','SUV','Long life'] },
      { n:'Continental', d:'Sharp braking and steering feel — a favourite for drivers who notice the difference.', t:['Performance','Braking','Euro fit'] },
      { n:'Pirelli',     d:'Performance-first rubber for sports sedans, coupes and staggered setups.', t:['Performance','Summer','Sport'] },
      { n:'BFGoodrich',  d:'All-terrain and off-road tread for trucks and SUVs that leave the pavement.', t:['All-terrain','Off-road','Truck'] },
      { n:'Yokohama',    d:'Great value across touring and performance lines without giving up grip.', t:['Value','Performance','Touring'] },
      { n:'Hankook',     d:'Strong budget-to-mid pricing with solid all-season manners.', t:['Value','All-season','Daily'] }
    ];
    var els = [], N = brands.length, radius = 220, idx = 0;

    brands.forEach(function (b, i) {
      var el = document.createElement('div');
      el.className = 'wall-brand';
      el.textContent = b.n;
      ring.appendChild(el);
      els.push(el);
    });

    var kicker = document.querySelector('.wall-readout .rk');
    var title  = document.querySelector('.wall-readout h3');
    var desc   = document.querySelector('.wall-readout p');
    var tags   = document.querySelector('.wall-tags');
    var count  = document.querySelector('.wall-count b');
    var total  = document.querySelector('.wall-count i');
    if (total) total.textContent = N;

    function layout() {
      var w = ring.parentElement.clientWidth;
      radius = Math.max(150, Math.min(240, w * 0.42));
      els.forEach(function (el, i) {
        var a = ((i - idx) / N) * Math.PI * 2;
        var x = Math.sin(a) * radius;
        var z = Math.cos(a) * radius - radius;
        var front = Math.cos(a);
        el.style.transform = 'translate3d(' + x + 'px,' + (-front * 8) + 'px,' + z + 'px) scale(' + (0.72 + front * 0.28) + ')';
        el.style.opacity = String(0.25 + Math.max(0, front) * 0.75);
        el.style.zIndex = String(Math.round(front * 100) + 100);
        el.classList.toggle('is-front', i === ((idx % N) + N) % N);
      });
      var b = brands[((idx % N) + N) % N];
      if (kicker) kicker.textContent = 'Brand ' + (((idx % N) + N) % N + 1);
      if (title) title.textContent = b.n;
      if (desc) desc.textContent = b.d;
      if (count) count.textContent = (((idx % N) + N) % N) + 1;
      if (tags) {
        tags.innerHTML = '';
        b.t.forEach(function (x) {
          var s = document.createElement('span'); s.className = 'wall-tag'; s.textContent = x; tags.appendChild(s);
        });
      }
    }
    function step(dir) { idx += dir; layout(); if (A()) A().step(); }

    document.querySelectorAll('[data-wall-prev]').forEach(function (b) { b.addEventListener('click', function(){ step(-1); }); });
    document.querySelectorAll('[data-wall-next]').forEach(function (b) { b.addEventListener('click', function(){ step(1); }); });

    /* drag to spin the ring */
    var dragging = false, lastX = 0, acc = 0;
    var surface = ring.parentElement;
    function px(e){ return e.touches ? e.touches[0].clientX : e.clientX; }
    surface.addEventListener('mousedown', function(e){ dragging = true; lastX = px(e); });
    surface.addEventListener('touchstart', function(e){ dragging = true; lastX = px(e); }, {passive:true});
    addEventListener('mouseup', function(){ dragging = false; });
    addEventListener('touchend', function(){ dragging = false; });
    function drag(e){
      if (!dragging) return;
      var d = px(e) - lastX; lastX = px(e);
      acc += d;
      if (Math.abs(acc) > 55) { step(acc > 0 ? -1 : 1); acc = 0; }
    }
    addEventListener('mousemove', drag);
    surface.addEventListener('touchmove', drag, {passive:true});

    addEventListener('resize', layout);
    layout();
  })();

  /* ---------- scroll progress ---------- */
  var prog = document.querySelector('.scroll-progress');
  if (prog) {
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
