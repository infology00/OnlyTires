/* ONLYTIRES — very slight smooth scrolling (Lenis)

   Kept deliberately subtle: a light lerp close to native, not the long
   floaty glide Lenis defaults to. It writes directly to the real
   window.scrollY every frame (this is Lenis's default document-scroll
   mode, not a virtual/wrapped scroll container), so nothing else on the
   site needs to change -- the 3D scroll rig already just reads scrollY
   each frame and gets the smoothed value for free.

   Skipped entirely for prefers-reduced-motion, and paused whenever the
   mobile menu's own scroll lock is active so the two don't fight. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof Lenis === 'undefined') return;   /* CDN blocked or offline: just use native scroll */

  var lenis = new Lenis({
    duration: 0.5,            /* short -- a hint of ease, not a glide */
    lerp: 0.16,                /* close to native; higher = snappier */
    wheelMultiplier: 1,
    touchMultiplier: 1,
    smoothWheel: true,
    smoothTouch: false,        /* touch already feels smooth; leave it native */
    syncTouch: false,
    autoRaf: false             /* driven by the shared loop below */
  });
  window.OT_LENIS = lenis;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  /* keep it out of the way of the full-screen mobile menu's own lock */
  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('.nav-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      if (document.body.classList.contains('menu-open')) lenis.stop();
      else lenis.start();
    });
  });
})();
