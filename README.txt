ONLYTIRES — only.tires
v41
======================================================================

WHAT CHANGED IN v41

· WHEEL SIZE INCREASED AGAIN
  Fit raised further at every anchor: hero 0.85->0.94, services
  0.79->0.88, why 0.77->0.86, install bay 0.90->0.97 (essentially fills
  the ring now).

· DOCKING HAPPENS LATER, ON PURPOSE
  The bay's "you've arrived" threshold used the same generic pad as
  every other section, so it locked the wheel into place the moment you
  barely crossed into the section -- before its own heading had even
  finished scrolling into view. It now needs an extra 28% of one screen's
  worth of scroll on top of that before it counts as arrived, so there's
  a visibly longer travel-and-settle before it snaps in. Quantified: on a
  typical layout that is roughly 250px of extra scroll. The un-dock
  threshold (leaving the bay by scrolling back up) automatically stays
  in sync, since it reads the exact same calculation.

· FAVICON RESTORED TO THE ORIGINAL WHITE-BACKGROUND MARK
  The nav, footer, preloader and mobile menu keep the current logo with
  real transparency (from v34). The browser tab icon specifically now
  uses your original white-background artwork again, cropped to a clean
  256px square.

WHAT CHANGED IN v40

· CAROUSEL DRAG DIRECTION WAS INVERTED
  Confirmed against the UI's own established convention: the next-arrow
  button sits on the right and calls step(1); the left arrow calls
  step(-1); the right keyboard arrow also calls step(1). Dragging right
  was calling step(-1) -- backwards relative to every other control.
  Fixed and verified: dragging right now steps forward, left steps back.

· WHEEL SIZE INCREASED
  Fit raised roughly 8-9% at every anchor: hero 0.78->0.85, services
  0.72->0.79, why 0.70->0.77, the install bay 0.84->0.90.

· SMOOTHER SPIN
  Two changes. The spin velocity used to be SET directly from the raw
  per-frame mouse-move delta -- mouse events don't arrive at a constant
  rate or distance, so the wheel's speed visibly stuttered while
  dragging. It's now blended toward that value a fraction each frame
  instead of jumping to it, and the same blending replaces the idle
  spin's easing, which was fairly aggressive (a full 2% correction per
  frame) and could look slightly jerky settling after a drag. Traced
  numerically: a fast flick now ramps up over about 15 frames with no
  overshoot or oscillation, and releasing eases back down gently rather
  than snapping.

WHAT CHANGED IN v39

· CLICKING THE PAGE YOU'RE ALREADY ON — FOUND AND FIXED (explains both
  halves of the report)
  Clicking, say, "Home" while already on Home appended a #s marker and
  assigned it to location.href. But changing only the hash on the SAME
  document is a same-page navigation in every browser -- it does NOT
  reload the page. So:

    1. The cover animation started and finished rising, but no real
       navigation ever happened to reveal it again afterward -- it was
       stuck fully covering the screen, matching "gets stuck mid
       animation" (really: stuck at the end of it, permanently).
    2. The #s marker was left sitting in the address bar forever, since
       the code that strips it only runs on a genuine page load, which
       never happened. A later manual reload then found that stale #s
       still there, mistook it for an internal arrival, and skipped the
       preloader -- matching "upon reloading it just loads without the
       preloader."

  Clicking a link to the current page is now a clean no-op: no
  animation, no navigation, no hash added, and the mobile menu closes if
  it was open. As a second, independent layer, an explicit reload (F5)
  now always shows the preloader regardless of anything in the URL or
  storage -- so even a stray leftover marker from any other edge case
  can never suppress it on a reload you deliberately asked for.

  Verified by reproducing the exact failure against the previous build
  first (cover animation gets stuck permanently, reload skips the
  preloader), then confirming this build passes the identical test.
  Full regression suite re-run and still passing: preloader gate on
  first/return visits, both transition directions, the interrupted-
  navigation lock, the mobile in-bay wheel, and the desktop seated-wheel
  centring all still hold.

WHAT CHANGED IN v38

· CHOPPY TRANSITION ON RETURN TO HOME — FOUND AND FIXED
  Exact bug: bars rise to cover the screen, vanish for about a second,
  then reappear already fully covered before the reveal plays normally.

  The 'pagehide' listener called parkVeil() -- which strips the covering
  class -- UNCONDITIONALLY, on every navigation. But pagehide fires on
  every ordinary navigation too, not just when a page is being stored in
  bfcache. Firing mid-rise, it stripped 'is-covering' while the bars were
  still animating, snapping them back to their resting (invisible) state
  for the brief window before the destination page's own baked-in
  covered state took over -- which is instant and opaque, matching
  "disappear then suddenly snap to fully covered." The reveal that
  follows was never touched, which is why only that part looked normal.

  parkVeil() on pagehide is now scoped to e.persisted only -- the actual
  bfcache-store case it was written for. An outgoing page's classes
  don't matter on an ordinary navigation; the document is about to be
  destroyed regardless. Verified by simulating pagehide firing mid-rise
  on a plain navigation (is-covering now survives) and confirmed the
  legitimate bfcache case still resets correctly.

· WHEEL CENTRING: DESKTOP NOW USES THE SAME MECHANISM AS MOBILE
  Not a resolution problem, and no more numerical tuning. Once the wheel
  is seated in the bay, the canvas now moves physically INSIDE #dock-slot
  and renders a wheel centred at (0,0,0) in its own small scene -- the
  exact technique already proven exact on phones -- on every device.
  This removes the full-screen coordinate math entirely for the one
  state that actually gets looked at closely: sitting still. Leaving the
  bay by scrolling back up reverses it cleanly.

  Verified end to end with a simulated scroll down a realistic page: the
  canvas stays on the full-screen fixed layer through hero/services/why,
  then is re-parented into #dock-slot the instant it seats, and moves
  back out the instant you scroll above the bay again.

WHAT CHANGED IN v37

· WHEEL CENTRING — THE PRIOR FIX WASN'T ENOUGH, NOW BASED ON A REAL RENDER
  My v31 fix balanced the SUM OF LIGHT DIRECTIONS, which is a rough
  approximation — it ignores how point lights actually fall off with
  distance and how the mesh's real geometry reflects them. This time I
  ran the actual wheel mesh (70,203 vertices, its real normals) through
  a full per-vertex Lambertian lighting simulation using the exact light
  positions in the scene, and measured where a viewer's eye would
  actually read "the middle" of the lit object — the luminance-weighted
  visual centroid, not just the silhouette.

  That simulation showed the "balanced" v31 rig still put the visual
  centroid 11px high on a 260px bay: key and fill were both angled
  steeply from above with nothing of comparable strength below, and
  balancing DIRECTION alone doesn't fix that. I grid-searched dozens of
  light configurations against this same simulation and picked one that
  keeps a believable overhead key light while reducing residual drift to
  1.3px horizontal, 4.0px vertical — below where the eye can register an
  offset.

· PRELOADER REAPPEARING ON EVERY RETURN TO HOME — ROOT CAUSE FOUND
  Your screenshots show you're testing via file:///C:/Users/..., i.e.
  double-clicking the page rather than serving it. Several browsers
  partition or block sessionStorage entirely under file://, sometimes
  per individual file, which explains why my sessionStorage-only fix
  worked in every isolated test I ran but not for you in practice.

  The primary channel is now a short #s marker carried on the URL
  itself when you click an internal link — a channel that cannot be
  blocked by any storage policy, since it travels with the navigation.
  sessionStorage remains as a secondary check for normal hosting. The
  marker is stripped from the address bar immediately via replaceState,
  so a plain reload of the resulting clean URL still shows the
  preloader as intended.

  Testing this surfaced a second, real bug: the boot script computed
  the sessionStorage check and the URL check inside ONE shared try
  block, so when sessionStorage.getItem() threw (the exact file://
  failure mode), it aborted the whole block before the URL check was
  ever reached — silently defeating the very fallback that was meant to
  save it. Each check now has its own isolated try/catch, so a blocked
  API can never take another, independent check down with it.

  Verified by simulating a browser where sessionStorage throws on every
  call: the fix now works using the URL marker alone. Also re-confirmed
  the existing suite: preloader watchdog, both transition directions,
  the tire appearing on first and return visits, and the interrupted-
  navigation lock all still pass.

WHAT CHANGED IN v36

· BAY BACKGROUND WAS ASYMMETRIC — SECOND CAUSE OF THE OFF-CENTRE LOOK
  v31 fixed a lighting bias on the WHEEL. This is a different bug in the
  same family, on the BAY behind it: the recessed disc's inset shadow
  reached 48px in from the top and only 24px from the bottom, so the
  circle's own shading was darker/deeper at the top and brighter toward
  the bottom edge. A shaded circle like that has a visual centre below
  its true centre — so even a perfectly centred wheel sitting on top of
  it reads as pulled upward, which is exactly what the screenshot showed.

  I verified the actual placement maths is exact first, independent of
  this: converting a DOM element's centre to world space and back lands
  within 0.0000px at every aspect ratio I tested (1920x1080, 1366x768,
  a 390px phone, 2560x1440). So the wheel itself was never mispositioned
  — it was the disc around it giving a false read. Both shadows now
  spread the same distance, so the bay reads as evenly lit and the wheel
  sits visually centred in it.

WHAT CHANGED IN v35

· TEXT SELECTION AND IMAGE SAVING DISABLED
  Text is no longer selectable with click-and-drag anywhere on the site.
  Form fields, textareas and dropdowns are explicitly exempted, so typing
  and picking options still works exactly as before — this only affects
  reading text, not filling in forms.

  Right-click "Save image as" and the native drag-out gesture are
  blocked on every <img>, plus the long-press "save/copy" callout on
  touch devices. Buttons, links and ordinary body text keep their normal
  right-click menu — only images are affected.

  Worth being upfront about the limits: this is a deterrent, the same
  kind every site with this feature uses, not real protection. Anyone
  who wants a file can still get it via browser dev tools, view-source,
  or a screenshot — no client-side JavaScript can prevent that. It stops
  the casual right-click save, nothing more.

  Verified: images blocked, images marked data-selectable exempted,
  buttons and paragraphs unaffected, the carousel's own drag-to-spin
  (which uses mousedown/touchstart, not native drag) still works.

WHAT CHANGED IN v32

· PRELOADER APPEARING ON EVERY RETURN TO HOME  (regression I introduced)
  The skip works by setting an 'ot-internal-nav' flag in sessionStorage
  when you leave a page via an in-site link; the head script on the next
  page reads it, skips the preloader, and clears it.

  When I rewrote the click handler in v25 to add the rapid-navigation
  lock, I dropped the line that SETS that flag. The reader was still
  there, so it silently found nothing every time and the preloader ran
  on every arrival. The reduced-motion path returned early before
  reaching it too.

  The flag is now set on every navigation path — including the
  "already navigating" branch and the reduced-motion branch — and again
  immediately before the jump. Verified end to end: in-site navigation
  skips the preloader, a reload still shows it. The previous build fails
  this test, this one passes.

WHAT CHANGED IN v31

· WHEEL OFF-CENTRE — IT WAS THE LIGHTING
  First I ruled out the obvious: all 70,203 vertices were projected
  through the exact transform the code applies, and the residual offset
  is 0.00px on both axes. The model and its placement are exact.

  The cause was the light rig. Summed by direction and intensity it was
  biased -0.46 on x and +1.14 on y — brighter to the left and top. On a
  perfectly symmetrical object that reads as displacement, because the
  lit edge blooms outward and the eye follows it. Up and to the left is
  exactly how it looked.

  The two blue rim lights are now mirrored either side of the wheel and
  the fill was rebalanced. Net bias is +0.10 x and +0.25 y — even glow,
  and the wheel reads centred in its ring.

WHAT CHANGED IN v30

· WHEEL NOW SITS DEAD CENTRE IN THE BAY
  Not a model problem — I checked the glTF and its world bounding box is
  centred at the origin. It was damping: once seated, the wheel was still
  easing toward the slot at 0.3 per frame, so while the page was moving
  it trailed the ring. Simulated at an ordinary scroll speed that is a
  steady 28px offset, which is exactly what the screenshot showed.

  A seated wheel is part of the bay, so it now tracks the slot 1:1 with
  no easing at all — 0px offset, moving or still. The model is also
  re-centred after its axle rotation, so no residual offset can survive.

· DESKTOP STEP COPY BACK TO ONE LINE
  The base rule now carries white-space:nowrap so it is guaranteed on a
  single line rather than depending on the column being wide enough.
  Tablet restores normal wrapping; phones keep the two centred lines.

WHAT CHANGED IN v27

· MOBILE: THE WHEEL IS NOW *STRUCTURALLY* INSIDE THE BAY
  Previous attempts kept the wheel on the full-screen fixed canvas and
  merely told it to aim at the bay's coordinates. That is why it still
  appeared to travel: a fixed canvas draws over the whole viewport, so
  the wheel was always technically able to show up anywhere, and any
  timing or measurement hiccup put it there.

  On phones the canvas element is now physically moved INTO the install
  bay and sized to it, and the wheel is simply centred in its own little
  canvas with no page geometry involved at all. It cannot be drawn over
  another section because it is no longer on a canvas that covers them.
  Rotating back to tablet/desktop moves it out again automatically.

  Verified by simulation: on a phone the rig never measures any section,
  the canvas is re-parented into #dock-slot and carries .is-inline; on
  desktop it stays a fixed full-screen canvas touring every anchor.

· INSTALL BAY STEP COPY
  Capped to 24 characters per line on phones so each step reads as two
  tidy lines instead of one long one.

WHAT CHANGED IN v26

· MOBILE SNAPPING — HARDENED
  v25 decided phone-vs-desktop ONCE, when the script first ran, using
  innerWidth. That is fragile: a rotation, or a viewport that has not
  settled at script time, leaves the rig in the wrong mode for the rest
  of the session — which is the most likely reason you still saw the
  wheel snapping between sections.

  The mode is now read live from the same media query the CSS uses
  (max-width: 760px), re-evaluated every frame, with a change listener
  that re-places the wheel instantly on rotation. Verified by simulation:
  on a phone the wheel is only ever placed in the install bay across a
  full-page scroll; on desktop it still visits every anchor.

  (Also fixed a repeat of the earlier hoisting trap: the snap flag was
  being assigned by the rotation handler before its own `var` ran.)

· LEFTOVER SPACING REMOVED
  The slots that used to hold the wheel higher up the page are now
  removed outright on phones rather than just emptied, the grids that
  held them collapse to a single column, and those sections no longer
  reserve a full screen — so there are no tall blank gaps left behind.

WHAT CHANGED IN v25

· PHONES: THE WHEEL LIVES IN THE INSTALL BAY
  It no longer snaps between sections as you scroll. Below 760px the bay
  is its only anchor, so it is simply sitting in place from the first
  frame — and stays draggable there. The slots further up the page are
  collapsed so they leave no empty gaps, and the quote form unlocks
  immediately rather than waiting for an arrival that never happens.
  Tablet and desktop keep the full scroll-driven journey.

· INTERRUPTED PAGE TRANSITIONS
  Clicking a second link while the first transition was still running
  re-added `is-covering` to panels that were already at their end
  transform — nothing to animate, so the screen just went dark instantly
  and only the slide-out played on the next page.

  A navigation now owns the transition: further clicks do not restart it,
  they only update the destination, so you land on the last link you
  clicked with one clean animation. The panels are also snapped back to
  their open position for a frame before each cover run, so a click that
  arrives mid-reveal still animates from fully open.

  Simulated three clicks 200ms apart: 1 cover animation, destination
  = the last link clicked.

WHAT CHANGED IN v24

· RELOAD NOW STARTS AT THE TOP
  Browsers restore your scroll position on reload, which dropped you back
  mid-page and fought the intro. `history.scrollRestoration` is set to
  'manual' before first paint, and the page is put back to the top on a
  fresh load or reload. A back/forward restore from bfcache is left
  alone — returning to where you were is correct there.

· FAST CAROUSEL CLICKING SHOWS SOMETHING
  Each step faded the panel out for 190ms before writing the new brand
  in. Clicking faster than that restarted the fade every time, so the
  content never got the chance to appear — hammering the arrow showed a
  blank panel. Steps arriving within 320ms of each other now swap
  instantly and skip the fade; slower steps keep the cross-fade as
  before. Simulated at one step per 90ms: 0 blank frames out of 12.
  Backdrop and image transitions were tightened slightly so they keep up.

WHAT CHANGED IN v23

· PRELOADER NOW WAITS FOR EVERYTHING
  All 23 brand tires, all 23 logos and the brand backdrops are fetched
  during the preloader alongside the 3D model. Enter only appears once
  BOTH the model and every image are in, so nothing pops in later. The
  status line counts them ("Loading brands 31/70"). A missing or stalled
  image cannot hold the door shut — it counts as done, and a 15s
  watchdog remains as a final backstop.

· SPINNING RING REMOVED
  The loading ring above the logo is gone entirely, markup and CSS. The
  logo is slightly larger to hold the space on its own.

· PHONES: THE WHEEL IS PLACED, NOT SCROLLED
  Below 760px the wheel no longer travels with the scroll. It is simply
  in position for whichever section is on screen, with no gliding, no
  arc and no scroll-driven rotation. Tablet and desktop keep the full
  scroll-driven journey exactly as before.

  It stays interactive: every anchor slot is now a drag surface, so you
  can spin the wheel with a finger anywhere it appears, not just in the
  hero. Vertical panning still scrolls the page normally
  (touch-action: pan-y).

WHAT CHANGED IN v19

· THE WHITE SQUARE IN THE MENU
  My fault: I had applied `brightness(0) invert(1)` to the logo to make
  it white on the blue panel. That image is a solid-white-background
  WebP with no transparency, so inverting it could only ever produce a
  plain white rectangle. It is now presented as a rounded white logo
  chip on the blue instead — the same treatment the footer uses.

· MENU SIDE PADDING
  Raised to 40px, with safe-area insets on the left and right so
  landscape notches do not clip the rows.

· MINIFIER BUG THAT BROKE calc()  (found while fixing the above)
  The CSS minifier added in v14 collapsed whitespace around `+`, but
  CSS *requires* spaces around + and - inside calc(). So any
  declaration like `calc(16px + 8px)` was being emitted as
  `calc(16px+8px)`, which browsers treat as invalid and drop entirely.

  Affected since v14: the install-bay glow ring's opacity ramp, the
  sound toggle's offset above the sticky bar, and the new safe-area
  paddings. calc() is now protected during minification and all 20
  expressions in the stylesheet are valid.

WHAT CHANGED IN v18

· TRANSITION SOUND
  The whoosh now plays in BOTH directions — as the bars rise to cover
  the screen, and again as they slide away on the next page. The rising
  chime that used to play on arrival is gone.

· MOBILE MENU WAS CLIPPED  (real CSS bug)
  The header carried `backdrop-filter` for its frosted look. An element
  with a filter becomes the CONTAINING BLOCK for any position:fixed
  descendant — so the menu's `inset:0` resolved to the header's own box
  instead of the viewport, which is why it only ever covered a strip at
  the top and scrolled internally.

  The blur now lives on a `::before` pseudo-element, so the bar looks
  identical but the header no longer traps fixed children. The menu
  covers the true viewport: full width, full height (100dvh so mobile
  browser chrome does not cut it), sliding in from the right over the
  header strip as well. The logo and close button ride above the panel,
  the logo inverts to white against the blue, rows stagger in and out,
  page scroll locks, and Escape closes it.

WHAT CHANGED IN v16

· THE WHEEL'S POSITIONING LOGIC WAS REWRITTEN  (root cause)
  Every positioning complaint so far came from the same design flaw: the
  rig interpolated between anchor CENTRE POINTS. That meant the moment
  you scrolled past a section's midpoint the wheel began drifting toward
  the next one — so it left the cards early, and it reached the install
  bay long before the bay was on screen, then appeared to jump back.
  Raising the "hold" values only masked it.

  Anchors are now SECTION SPANS. While the viewport centre is inside a
  section, the wheel is locked to that section's slot and simply rides
  along with the content. It only travels during a release zone at the
  section edges, so the handover flows out of one section and into the
  next instead of snapping.

  Simulated across the whole page scroll, the result is:
    hero      locked, then travels
    services  LOCKED for the entire section — past all four cards
    why       LOCKED for the entire section
    dock      seats only once the bay's own section owns the viewport,
              and stays seated
  Two assertions verified: the wheel stays on the cards for the whole
  services section, and it never seats in the bay early.

· TABLET & MOBILE REFINEMENT
  Sections no longer force a full screen each on narrow widths, so
  content is not squeezed. Hero buttons go full width, the wheel gets a
  sensible size at each breakpoint, the carousel keeps a comfortable tap
  target on its arrows and drops the flanking tires below 420px, the
  install bay stacks cleanly, and the sticky call bar and sound toggle
  respect the phone's safe area. Render buffer is capped lower on phones
  — invisible, but easier on frame time and battery.

WHAT CHANGED IN v15

· THE WHEEL NOW FOLLOWS THE WHOLE SECTION
  Both rail slots were pinned near the top of their section, so the
  wheel sat beside card 01 while the other three cards scrolled past it.
  They are now pinned to the middle of the viewport and the rail
  stretches to the full column height, so the wheel rides down past
  every card. Holds were raised (0.62 / 0.60) so it stays parked on the
  slot for the whole section and only moves on at the very end.

  The Why OnlyTires section got the same treatment: the wheel travels
  with you from the top of the section to the bottom, then continues
  into the bay.

· CAROUSEL ARROWS
  Re-derived from the rack geometry rather than guessed offsets. A side
  tire's centre always sits at 6% of the stage and the focus tire's at
  50%, so the visual middle is (6+50)/2 = 28% — independent of tire
  size, viewport height or scale. Arrows now sit at 28% and 72%,
  centred on the tire axis. The old rule mixed `right:` with vh units
  and drifted badly at some sizes.

· TRANSITION SEAMS ON TABLET / MOBILE
  The four panels are flex fractions, which land on sub-pixel boundaries
  at many widths and showed as thin light lines between them. Panels now
  overlap by 1px each side, with the container clipping the overflow.

· MOBILE / TABLET MENU
  Slides in from the right and covers the full screen, on an accent-blue
  gradient. Each row animates in on a stagger and back out on close, the
  burger turns into a cross, the logo inverts for legibility, page
  scroll locks while open, and Escape closes it.

· THE BAY LANDING IS SMOOTHER AND MORE DELIBERATE
  The bay now reacts to the wheel's approach through a --dock-near
  variable (0 to 1): the ring brightens, its glow grows and the label
  fades as the wheel closes in, rather than snapping on at contact. The
  wheel decelerates into the slot, breathes fractionally wider mid-
  flight, and squares up its yaw and pitch as it lands, then seats with
  a solid ring and a deeper recess.
======================================================================

Nothing about the design, layout, copy, animation, sound or behaviour
changed in this version. The only difference is how the bytes are
delivered. Verified with the same headless-DOM tests used previously
(preloader, both transition directions, and the tire appearing on both
first and return visits — all pass), plus a structural diff of the
rendered markup: the only element difference from the last build is the
intentional `is-covered` class on the transition veil.

WHAT THE OPTIMIZATION DID
  Previously every page inlined the stylesheet, all the JavaScript, the
  3.76 MB model and 70 brand images as base64. That made a file work by
  double-clicking, but it meant nothing could ever be cached and every
  page re-sent everything — with base64 adding 33% on top.

  Now CSS, JS and images are ordinary files the browser caches once.

  HOME PAGE, first visit
    before   7.33 MB   all inline, nothing cacheable
    after      46 KB   shell (html + css + js + logo, gzipped)
             3.76 MB   model, loaded lazily, then cached
              136 KB   only the visible brand and its two neighbours
    -> the page is usable after 46 KB instead of 7.3 MB

  EVERY SUBSEQUENT PAGE
    before    198 KB   full CSS + JS re-sent each time
    after       4 KB   HTML only; everything else from cache
    -> 52x less per page

  Also: the logo went from a 502 KB PNG to a 12 KB WebP, CSS is
  minified (whitespace and comments only — no rules rewritten), and the
  carousel loads brand images on demand rather than all 70 up front.

HOW TO PREVIEW
  Best:   python3 preview.py     -> opens http://localhost:8000
  Or:     double-click index.html
          This still works. Browsers block reading a local .glb file, so
          the 3D tire falls back to assets/car_tyre.glb.js, a base64
          copy loaded via a script tag. Same result, just heavier — it
          is never used when the site is hosted.

DEPLOYING
  Upload everything except source/ and build/ (those are the editable
  originals and the build script). Once hosted you may also delete
  assets/car_tyre.glb.js — it exists only for the double-click preview.

  _headers    cache rules for Netlify / Cloudflare Pages
  .htaccess   compression + caching + .glb MIME type for Apache/cPanel
              (many shared hosts do not serve .glb without this)

  Make sure gzip or brotli is enabled — the figures above assume it.

FILES
  index.html · tires.html · services.html · fleet.html
  about.html · contact.html · privacy.html · terms.html
  css/style.css              minified stylesheet (shipped)
  js/*.js                    audio, fx, tire-wall, experience (shipped)
  assets/brand-tires/        23 normalised tire images
  assets/brands/             23 normalised logos
  assets/brand-bg/           brand backdrops
  assets/car_tyre.glb        3.76 MB hero model
  assets/car_tyre.glb.js     base64 copy, only for file:// preview
  source/css, source/js      commented originals — EDIT THESE
  build/build.py             rebuilds every page

  After editing anything in source/ or build/, run:
      python3 build/build.py

BRANDS
  All 23 confirmed as stocked.

STILL TO DO (agreed for later)
  Form delivery · Google reviews · pricing signal · SEO/schema
