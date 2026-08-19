ONLYTIRES — only.tires
v23
======================================================================

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
