ONLYTIRES — only.tires
v70
======================================================================

WHAT CHANGED IN v70

1. BLUE RING HATAYA + TIRE ARCH PAR SAHI BAITHAYA
   Ring us waqt banaya tha jab wahan vector car thi aur arch khud
   dikhta nahi tha. Ab asli photo hai jismein arch, brake disc aur red
   caliper saaf hain -- ring us par ek extra graphic lag raha tha, to
   hata diya (dark well aur "Install Bay" label bhi).

   Position photo se dobara measure ki. Hub 50.0% across / 54.6% down
   par hai, jabki CSS mein 57.8% tha -- isi liye tire neeche baith raha
   tha. Size bhi 36.3% se 33% kiya aur model ka fit 1.0 se 0.96, kyunki
   pehle tire arch se bahar nikal raha tha.

2. HAR NAV PAGE KE HERO MEIN BACKGROUND IMAGE
   Tires, Services, Fleet/Commercial, About (aur Contact) -- sab ko apna
   backdrop mil gaya.

   Services par ASLI photo hai: wahi car-bay wali studio image, wide
   crop karke.

   Baaki ke liye mere paas asli photos nahi thin aur network access bhi
   nahi hai, to unke liye brand ke apne tread pattern se backdrops
   generate kiye -- wahi tread jo 3D wheel peeche chhodta hai, blue mein,
   dark navy field par diagonal tracks ki tarah. Har page ka apna
   composition hai (Tires: do tracks, Fleet: teen lanes, About/Contact:
   ek halka track), to alag alag lagte hain lekin ek hi language mein.

   Text ke peeche gradient scrim hai. Contrast verify kiya: heading
   7.6:1 se 11:1 tak, eyebrow 5.1:1 se 7.4:1 -- sab WCAG AA se upar.
   Mobile par scrim horizontal se vertical ho jaata hai, kyunki wahan
   text image ke upar centre mein aata hai.

   Poora hero folder sirf 144 KB hai.

   NOTE: agar aap in 4 pages ke liye asli photos de sakein (workshop,
   truck fleet, shop front), to seedha assets/hero/ mein replace kar
   dena -- naam wahi rakhna, baaki sab automatic chalega.

WHAT CHANGED IN v69 — POORI WEBSITE KI SCROLL LAG

Ab tak main sirf 3D rig optimize kar raha tha, lekin lag poore page par
thi -- to wajah 3D se bahar bhi thi. Teen cheezein milin:

1. STICKY HEADER PAR BACKDROP-FILTER (sabse bada, 3D se bilkul alag)
   Header par blur(16px) laga tha. backdrop-filter compositor ko har
   frame par uske PEECHE ka poora area dobara blur karne par majboor
   karta hai. Header poori width par sticky hai, to har scroll frame par
   ~245,000 pixels ka gaussian blur ho raha tha -- 60 baar per second,
   chahe 3D tire screen par ho ya na ho. Yahi wajah thi ke poori site
   scroll par bhaari lagti thi.

   Ab thoda zyada opaque plain background hai (.94 alpha). Dekhne mein
   tqreeban wahi, lekin compositor ke liye zero per-frame kaam.
   Carousel arrows se bhi blur hataya.

2. MERI v67 WALI BUG -- TIRE PARK HOKE WAPAS NAHI AATA THA
   Maine loop mein early-return lagaya tha jab wheel 'is-parked' ho, taake
   off-screen kaam bache. Lekin jo code un-park karta hai wo usi loop
   mein NEECHE tha -- to ek baar park hone ke baad loop wahin ruk jaata
   tha aur wheel kabhi wapas nahi aata.
   Ab park check skip se PEHLE hota hai, usi frame ki apni measurement
   se. Saving bhi rahi aur bug bhi gaya.

3. FIXED OVERLAYS
   Do full-viewport fixed layers (aurora gradient + grain texture) scroll
   par repaint ho sakte thay. Ab apni compositor layer par hain, to ek
   baar paint hoke reuse hote hain.

Aur tread: route rebuild 30Hz par hi hai (wahi mehnga hissa tha), lekin
quads ab har frame update hote hain -- to wipe wheel ke saath smooth
chalta hai, steps mein nahi. v68 mein maine dono ko gate kar diya tha,
jo choppy lag raha tha.

WHAT CHANGED IN v68 — SCROLL CHOPPINESS

Do asal wajahen milin, dono scroll ke doran hi trigger hoti thin:

1. LAYOUT THRASHING (sabse bada)
   frame() har frame mein ~12 baar getBoundingClientRect call kar raha
   tha, AUR woh reads DOM writes ke beech mein thin (wheel ka transform,
   class toggles, CSS variables). Har read se pehle browser ko pending
   layout flush karna padta hai, to ek hi frame mein layout baar baar
   recalculate hota tha -- yahi classic scroll jank hai.

   Ab har element ek frame mein sirf EK BAAR measure hota hai aur cache
   se share hota hai. 12 reads -> 1.

2. DO ALAG rAF LOOPS, GHALAT ORDER MEIN
   Lenis window.scrollY ko smooth karta hai, aur 3D rig wahi scrollY
   parhta hai -- lekin dono apne apne rAF loop mein thay, to order
   guaranteed nahi tha. Rig aksar pichhle frame ki scroll value parh
   leta tha, jo wheel ke page se "judder" karne jaisa dikhta tha.

   Ab ek hi loop hai: rig pehle Lenis ko advance karta hai, phir taaza
   scroll parh kar render karta hai. Jin pages par rig nahi hai wahan
   smooth-scroll apna loop khud chala leta hai.

Iske ilawa:
   - tread segments 56 -> 36 (20 kam draw calls per frame)
   - tread route ab 30Hz par rebuild hota hai, wheel poore 60Hz par
     chalta hai. Halke, low-opacity mark par ye farq dikhta nahi, lekin
     loop ka sabse mehnga hissa aadha ho jata hai.
   - jin frames mein route rebuild nahi hota, un mein 36 quad transforms
     bhi skip ho jate hain (pehle wahi purani values dobara likhi jaati
     thin).

Total: scroll ke doran per-frame kaam mein ~62% kami, aur layout reads
ab writes se alag hain.

WHAT CHANGED IN v67

· GOODYEAR KA DASHED BORDER HATA
  v66 mein maine ise galat samjha. Jo light pixels box ke andar milay,
  maine unhe "white outline" samajh kar restore kar diya -- woh dashed
  border hi tha. Ab box ke bahri 16px band ke saare light pixels box ke
  apne blue se paint kar diye. Baaki 0 light pixels bache, wordmark
  bilkul chhua nahi gaya (woh andar hai).

· 3D MODEL AB HAMESHA RAHEGA -- LOGO SWAP HATA DIYA
  Yeh bug ka asal sabab mil gaya. fallback() 3D wheel ko OnlyTires ke
  static logo se replace kar deta tha, aur woh sirf error par nahi chalta
  tha:
    - prefers-reduced-motion par bhi chalta tha
    - WebGL context lost hone par bhi -- jo browser normally wapas de
      deta hai, lekin humne permanently logo laga diya tha
  Isi liye wheel kabhi kabhi bina wajah logo ban jaata tha.

  Ab logo swap poori tarah nikal diya. Reduced-motion par model load
  hota hai aur dikhta hai, bas animate nahi hota. Context lost hone par
  ab restore ka intezaar hota hai aur wheel dobara ban jaata hai.

· PERFORMANCE
  Loop har frame poora rig chalata aur draw call bhejta tha, chahe wheel
  screen par ho ya na ho. Ab:
    - tab background mein ho          -> kuch bhi nahi chalta
    - install bay se neeche scroll    -> kuch bhi nahi chalta
    - wheel docked (tread hidden)     -> route rebuild nahi hota
    - phone par                       -> route rebuild nahi hota
  Pixel ratio 2x -> 1.5x (phone 1.6 -> 1.25): shading ke liye 44% kam
  pixels, aur ek tire par farq mushkil se dikhta hai. Phones par MSAA
  band, stencil buffer allocate nahi hota, aur GPU se explicitly
  high-performance maanga jaata hai.

WHAT CHANGED IN v66

· GOODYEAR KE DASHED BORDERS FIX
  Yeh CSS ka issue nahi tha -- artwork mein hi tha. v59 mein jab logos ka
  white background strip kiya tha, Goodyear par woh pass zyada aggressive
  raha:
    - blue box ke edges par anti-aliased pixels transparent ho gaye, jisse
      dashed outline ban gaya
    - box ke ANDAR ~4000 pixels ka alpha bhi zero ho gaya (wordmark ke
      aas-paas ka white outline)
    - box ke upar/neeche stray pixels bikhre reh gaye

  Repair: solid blue box ko measure karke crop kiya, jin holes ka colour
  data bacha tha unhe wapas laaya (white outline), jin 548 pixels ka
  colour bhi ud gaya tha unhe box ke blue se bhara, aur poore block ko
  fully opaque kar diya.

  Result: block ab 100% solid hai, ek bhi partial-alpha pixel nahi,
  edges bilkul saaf.

WHAT CHANGED IN v65

· TOYO KA NAYA LOGO LAGA
  Aapka bheja hua 3840x412 transparent logo install kar diya, baaki
  brands ke format mein normalise karke (520x130 canvas, art trimmed
  aur centred, alpha preserved).

  Farq:
      purana ink bbox   118 x 15 px  -> slot mein 2.0x UPSCALE, soft
      naya   ink bbox   520 x 54 px  -> slot mein 0.46x downscale, sharp
  Ab koi upscaling nahi hoti, to bilkul crisp dikhega.

  Detection ne ise apne aap transparent maana aur white chip diya --
  sahi, kyunki mark dark blue hai aur blue panel par bina chip ke dab
  jaata. Bare logos wahi 4 hain: Continental, Goodyear, Kumho, Pirelli.

WHAT CHANGED IN v64

· GOODYEAR KA WHITE BACKGROUND HATA
  v63 ka detection border-ring dekhta tha, jo Goodyear par fail hua: uska
  blue box canvas ke border tak nahi jaata, to test ne usay transparent
  samjha aur chip laga diya -- blue box ke peeche white rectangle.

  Ab test badal diya: opaque area ke bounding box ka middle 60% kitna
  bhara hai. Solid background core ko 100% bharta hai; sirf wordmark ya
  symbol 30-65% par rehta hai. Goodyear ab 100% par sahi detect hota hai.

  Ek size guard bhi lagaya: chhota dense fragment bhi core 100% de sakta
  hai bina background hue -- Toyo ka mark 117x14px hai, canvas ka ~2%,
  aur woh 92% score kar raha tha. Ab bounding box ko image ka meaningful
  hissa bhi hona chahiye. Result: 4 logos bare (Continental, Goodyear,
  Kumho, Pirelli), 19 ko chip.

· SLOT KA SIZE AB FIXED HAI
  Logos alag alag shapes ke hain, aur box content ke hisaab se size le
  raha tha -- isliye brand change karte hi poora panel shrink/grow karta
  tha. Ab slot fixed hai (260x64, mobile par chhota) aur har mark uske
  ANDAR object-fit:contain se fit hota hai. Verify kiya: chaudhe
  wordmarks width par rukte hain, lambe marks height par, koi bahar nahi
  jaata, aur container ka size kabhi nahi badalta.

· NOTE — TOYO
  Toyo ka artwork sirf 118x15px ka reh gaya hai (v59 mein uska white
  background strip karne ke baad). Slot mein 2x upscale hoga, to thoda
  soft dikhega. Agar aap Toyo ka behtar transparent PNG de sakein to
  seedha replace ho jayega -- baaki sab automatic hai.

WHAT CHANGED IN v63

· WHITE CHIP ONLY WHERE IT IS NEEDED
  v62 put a white chip behind every mark, which meant the three logos
  that already carry their own background (Continental yellow, Kumho red,
  Pirelli yellow) showed a white rectangle around them -- a background on
  a background.

  The chip now applies only to the transparent marks. Which is which is
  detected from the artwork at build time: if a logo's border ring is
  mostly opaque it brings its own background and is left bare; if the
  edges are transparent it gets the chip. 20 get a chip, 3 stay bare.
  Recomputed every build, so replacing a logo file updates it
  automatically -- no hand-maintained list to fall out of date.

· SQUARE CORNERS
  Chip border-radius 12px -> 0.

· One detail worth flagging: with the chip removed, Kumho's red
  background measures only 1.32:1 against the blue panel -- it reads as
  a hue difference rather than a tonal one. Rather than putting a white
  box back, the three bare logos get a soft drop shadow so they still
  lift off the panel.

WHAT CHANGED IN v62

· CAROUSEL TIRES MADE BIGGER
  The focus tire was capped at 240px, so it never filled the panel:
      desktop  240px -> 380px  (+58%)
      laptop   234px -> 360px  (+54%)
      tablet   220px -> 261px  (+19%)
      phone    170px -> 240px  (+41%)
  The neighbouring tires grew with it and the glow behind scales up too.

  Two things had to move with the size, or it would have looked broken:
    - The viewer needed more height first. It has overflow:hidden, so a
      bigger tire in the old container would simply have been cropped.
      I checked each breakpoint against real viewport heights and caught
      exactly that at 1024x768 -- a 292px tire in a 307px viewer -- and
      raised the tablet viewer from 40vh to 46vh to fix it.
    - The arrows sat midway between the old side and focus tires, so the
      wider tire would have run underneath them. They move outward to
      22% / 78% (and further on smaller screens). Verified clear of the
      tire at every breakpoint.

WHAT CHANGED IN v61

· NEW CAR PHOTO, WHEEL CENTRED
  Swapped to your higher-resolution shot (1024x559 source, much sharper
  than the first one).

  In the source the hub sat at 65% across, which is exactly why it looked
  off-centre. The photo is now cropped symmetrically around the hub, so
  the wheel sits at dead centre:
      crop        (308,143)-(1024,543) -> 716 x 400
      hub         (358, 231) = 50.0% across, 57.8% down
      arch        ~216px wide, fender ~130px above the hub
      tire        ~260px diameter = 36.3% of the image width
  The tire is noticeably larger than in v60 too -- measured from the
  actual arch rather than estimated from the brake disc, which had made
  it too small.

  Saved at 2x (1432x800) for retina, 59 KB.

WHAT CHANGED IN v60

· REAL CAR PHOTOGRAPH IN THE INSTALL BAY
  Your generated image replaces the vector entirely. Placement was
  measured from the file rather than eyeballed:
      image        646 x 361  (aspect 1.789)
      wheel hub    (354, 211) = 54.8% across, 58.5% down
      arch opening ~133px wide = ~21% of the image width
  The slot is set to exactly those percentages and the stage holds the
  photo's own 646:361 ratio, so the tire stays on the hub at every
  screen size.

  The photo is now full-bleed across the card rather than sitting inside
  padding, and the slot's own dark well was removed -- the photograph
  already provides the recess, and the well was only muddying the brake
  disc showing through behind the tire. The four steps sit on a dark
  panel beneath the image. Saved at 2x for retina, 27 KB as WebP.

WHAT CHANGED IN v59

· LAG AND THE TREAD OFFSET WERE THE SAME BUG
  In v58 I cached the tread route in document space to avoid rebuilding
  it every frame. That was wrong: the "what we do" anchor is
  position:sticky, so its document position changes continuously while
  you scroll through that section. The cached route drifted away from
  the wheel -- which is exactly the tread appearing to the RIGHT of the
  tire rather than under it.

  So the cache is gone and the path is rebuilt every frame again, but
  made genuinely cheap rather than merely skipped:
    - sampled 1:1 with the quad pool instead of 4x (360 -> 56 samples,
      and the corner smoothing drops from 720 ops to 112)
    - 90 tread quads -> 56 (they overlap, so the track is still
      continuous, but that is 34 fewer meshes transformed AND drawn
      every frame)
    - material colour only uploaded when it actually changes, instead
      of 90 needless GPU writes per frame

  Weighted cost per frame: v57 1561 -> v59 457, a 71% reduction, and
  correct this time. Verified the tread sits directly beneath the tire:
  0.000000 horizontal offset at every point of a handover.

· LOGO DOUBLE BACKGROUND FIXED PROPERLY
  Six logos (Dunlop, Geostar, Goodyear, Michelin, Toyo, Triangle) had a
  white box baked into the artwork, which sat inside the dark plate --
  the double background you saw.

  My earlier guard was wrong: it required 75% of a mark's ink to survive
  removal, but for "dark text on a white box" the white IS most of the
  pixels, so legitimate removals were being rejected. The correct test is
  whether a readable DARK mark remains afterwards. All six now strip
  cleanly.

  With the white boxes gone, no logo needs a dark plate. But most marks
  are dark and the copy panel is blue -- 14 of 23 measured below 1.8:1
  against it. Plating some and not others is what made it look
  accidental, so every logo now sits on one consistent white chip.

  NOTE: I have no network access, so I could not search for replacement
  transparent PNGs. The six were fixed by editing the artwork you already
  have, which was possible because the white really was a background in
  those files.

· CAR REDRAWN
  No network access means I cannot source a car photograph. The vector is
  substantially rebuilt instead: multi-stop paint with a sky reflection
  up top, a wrapped shoulder highlight and a darkened lower flank; tinted
  glass with pillars and a reflection streak; a chrome window surround
  and door handles; a proper headlight cluster; and a pressed arch lip
  (bright inner edge, dark outer) instead of a flat cut-out. The empty
  arch now shows a strut, hub, brake disc, red caliper and five lug studs.

  If you can supply a side-view car photo (front facing right, wheels
  off or croppable at the front wheel), I can drop it straight in --
  the slot is positioned in percentages so it would only need the
  arch coordinates adjusting to match the photo.

WHAT CHANGED IN v58

1. CAROUSEL RESTORED — my mistake in v57
   When I replaced the install bay, my edit used the wrong end marker and
   swallowed the entire brand carousel along with it. Recovered from your
   v55 zip and spliced back in, keeping the new car dock. Section order is
   correct again and the quote section is no longer duplicated:
   hero / trust bar / what we do / why / DOCK / TIRE WALL / quote /
   hoos / location.

2. PERFORMANCE — found the actual cause
   A scroll listener nulled the tread path on EVERY scroll event, which
   forced a full rebuild on the very next frame: 4 getBoundingClientRect
   calls, 360 path samples, then 180 resample and quad updates -- 544
   heavy operations per frame, continuously, for the whole duration of
   any scroll.

   The route is defined relative to the anchors, and scrolling doesn't
   change where those sit relative to each other, so it never needed
   rebuilding on scroll at all. The path is now cached in DOCUMENT space
   and the current scroll is applied as a single shared offset:
       544 -> 181 operations per frame (67% less)
       forced layout reflows per frame: 4 -> 0
   The reflows matter more than the raw count -- that's what makes
   scrolling stutter regardless of how fast the arithmetic is.

   Worth noting: my first pass at this had the sign inverted. A test
   comparing the cached point against a freshly measured one caught it
   (the error grew to 38 world units as you scrolled). Correct
   convention is store as (y - scroll*wpp), recover as (y + scroll*wpp),
   because world y is the negative of screen y. Now exact to 0.0000000000
   at every scroll position.

3. INSTALL BAY — ZOOMED TO ONE WHEEL
   You were right that showing the whole car left a second arch sitting
   permanently empty and looking unfinished. It's now a close-up of the
   FRONT RIGHT corner only, car facing right: bonnet and headlight to the
   right, door and sill running off to the left, one arch, with the brake
   disc and five lug bolts visible waiting for the wheel.

   Geometry recalculated for the crop: wheel centre (500,380) radius 150,
   arch radius 172 (22px clearance), ground at y=530 so the tire touches
   it exactly. Slot at 50% / 61.3%, width 30%, on a 1000x620 stage that
   holds the SVG's aspect ratio -- so it stays locked to the arch at
   every screen size.

WHAT CHANGED IN v57

1. INSTALL BAY — CAR WITH ITS WHEELS OFF
   The bay is now a side-view car up on jack stands with both arches
   empty, and the 3D tire docks into the front arch.

   No car photo existed in the project and I can't generate images, so
   it's drawn as vector SVG. That turned out better for this anyway:
   it stays sharp at any size, and the arch can be positioned to an
   exact percentage so the tire lands in it accurately.

   The geometry was worked out rather than eyeballed, because a tire
   that floats above the ground or pokes through the bodywork would
   look wrong immediately:
       wheel centre (264, 330), radius 96
       arch opening radius 110  -> 14px clearance around the tire
       ground line y = 426      -> tire touches it exactly
   The slot is placed in PERCENTAGES of the artwork (left 26.4%, top
   71.7%, width 19.2%) and the stage holds the SVG's own 1000x460
   aspect ratio, so the tire stays locked to the arch at every screen
   size. The four steps moved to a row beneath the car.

   Section now fills the viewport (100svh), stacking on mobile.

2a. WHITE LOGO BACKGROUNDS — PARTLY POSSIBLE, AND WORTH READING
   Checked all 23 marks. Only ONE (Goodyear) actually had a white
   background baked behind it -- removed, by flood-filling white inward
   from the border so enclosed white inside the mark is never touched.

   Five others (Dunlop, Geostar, Michelin, Toyo, Triangle) look like
   they have white backgrounds but do NOT: they ARE white artwork.
   My first pass stripped them and gutted the logos -- Toyo dropped from
   25% ink to 2%, i.e. the mark was destroyed. I reverted that and added
   a guard: if removing the "background" costs more than 25% of a mark's
   ink, it wasn't a background and the file is left alone.

   Those five would be invisible on the light carousel panel (~1.05:1
   contrast), so they keep a dark rounded backing. That is the only way
   to show a white logo on a light surface -- there is nothing to remove.
   If you want them plain, they need re-supplying as dark versions.

2b. SLIDER BAR REPLACES THE PAGINATION DOTS
   A track with a fill and thumb, showing how far through the 23 brands
   you are. Click or drag anywhere to jump; arrow keys, Home and End all
   work; announced properly to screen readers. 23 dots was never
   realistically tappable on a phone, and a bar scales to any number of
   brands. Verified it reaches brand 1 and brand 23, clamps when dragged
   past either end, and moves monotonically.

2c. Carousel section now fills the viewport too (100svh).

WHAT CHANGED IN v56

· TREAD MARKS MADE MORE PROMINENT
  Raised well past the 10% asked for, and raised across the whole
  curve rather than just the peak:
      fresh imprint   0.38 -> 0.52   (+37%)
      faded mark ahead 0.07 -> 0.10  (+43%)
      10 segments back 0.182 -> 0.292 (+61%)
      20 segments back 0.036 -> 0.100 (+177%)

  The faded lead-in mark was lifted alongside the fresh one, otherwise
  raising only the peak would have widened the gap and lost the
  "following an existing path" read. FADE_SEGMENTS was also stretched
  26 -> 32, because decaying at the old rate from a higher peak would
  simply have made the fade look steeper instead of the track staying
  readable further back. Peak is still 0.52, under the halfway mark, so
  it stays on the premium side rather than becoming a black smear.

· MOBILE PASS
  Added as one deliberate layer at the END of the stylesheet, so it
  wins cleanly over the previously scattered breakpoints instead of
  fighting them. Covers:
    - even vertical rhythm; sections no longer bunch or gap unevenly
    - display type rescaled so headings never crowd the screen edges
    - hero CTAs full width and stacked, 52px tall
    - all multi-column blocks collapsed to one column with even gaps
    - forms single-column, inputs 48px tall and 16px text
      (16px specifically: anything smaller makes iOS zoom on focus,
      which is a classic thing that makes a site feel unfinished)
    - service rows drop the arrow rather than squeezing three columns
    - install bay, carousel, location, footer all stacked and centred
    - every link and button meets the 44px minimum touch target
    - a tighter layer for phones under 400px
    - a landscape-phone layer: short viewports no longer force
      full-height sections into a cramped sliver

  Verified: CSS braces balanced, no broken calc(), no horizontal
  overflow risk, viewport meta correct on every page, and all rules
  survived minification.

  NOTE: index.html is now a Coming Soon cover (added outside this
  session) with its own inline styles and its own mobile breakpoint --
  left untouched. home.html is the full site.

WHAT CHANGED IN v51 -- CLIENT TREAD BRIEF, IMPLEMENTED IN FULL

Four things the previous build did NOT do, each now addressed:

1. TREAD SITS AT THE CONTACT POINT
   The trail was drawn at the wheel's CENTRE, so it ran through the
   middle of the tire -- exactly the "separate graphic floating
   underneath" the brief warns against. The path is now offset down by
   one tire radius (the model is normalised to unit diameter, so radius
   = scale / 2), placing it where the rubber meets the invisible ground.
   The wipe boundary was corrected to match: it compares against the
   contact point too, otherwise the fresh/faded switch happened a full
   radius ahead of where the tire actually touches.

2. THE FRESH MARK NOW FADES AWAY
   Behind the tire the imprint held constant strength forever, so the
   track just accumulated. It now decays with distance on an eased
   curve. Verified across the full cycle:
     far ahead   0.070   faded old mark being followed
     at the tire 0.205   blend across the contact patch
     just behind 0.340   fresh imprint, ~4.9x the faded mark
     behind      0.163   fading
     far behind  0.000   gone
   Peak opacity is 0.34 -- deliberately well under half, per the
   "subtle/premium, not gimmicky" requirement.

3. CONTACT SHADOW ADDED
   A soft ellipse at the contact patch, squashed into the same ground
   plane as the tread and sized from the tire. This is what actually
   sells the invisible surface -- a trail alone still reads as floating.
   Kept very faint (0.2).

4. EACH WHEEL HAS ITS OWN TREAD PATTERN
   Four stamps, one per wheel, swapping in step with the wheel change:
     directional  angled lugs, interrupted centre band
     highway      fine continuous ribs
     allterrain   chunky widely-spaced blocks
     performance  slick shoulders, narrow centre groove
   Verified distinct: the closest pair still differs across 17% of
   pixels, and each has its own structural signature. The swap
   repoints the existing textures rather than re-cloning 90 of them,
   which would stutter mid-scroll.

WHAT CHANGED IN v50

· WHEEL NOW SHOWS THE RIM'S FRONT FACE
  The model's axle sits on X, so it was rotated +90 degrees to face the
  camera -- which presents the wheel's BACK, making the rim read
  inside-out. Negating that to -90 turns the wheel 180 degrees on its own
  axle: the rim front now faces you, at the identical viewing angle and
  position as before. One character, correct cause.

· TREAD MARKS MATCHED TO YOUR REFERENCE IMAGE
  Measured the supplied reference rather than eyeballing it: 22.5% ink
  coverage with heavily broken structure. The stamp is now drawn to match
  -- dense angled lug blocks in staggered rows either side of an
  interrupted centre band, with the edges eroded by ~1200 small bites so
  nothing is a clean vector rectangle and it reads as ink pressed off
  rubber.

  Tuned by measurement, not guesswork: the first attempt came out at
  43.8% coverage, nearly double the reference. Lug size, spacing and
  erosion were adjusted until it landed on 22.5% -- an exact match,
  verified by reproducing the shipped drawing code and comparing against
  the reference file.

· MARKS NOW READ AS 3D, DRAWN AS THE TIRE ROLLS
  Two changes:
  - Each segment is laid BACK on the X axis (-0.92 rad) instead of facing
    the camera flat, so the track sits like ground receding into the
    scene rather than stickers pasted on the screen. Rotation order is
    set to ZYX so the roll along the path applies before the lay-back,
    which keeps the pattern running down the track instead of shearing.
  - Each segment carries its own cloned texture with its own repeat
    count, so the stamp tiles at a constant real-world size down the
    whole route -- like a tire laying repeated impressions -- instead of
    one decal stretched over the length of each quad.

WHAT CHANGED IN v49

· CAROUSEL PANEL IS NOW LIGHT
  Inverted from the dark navy panel to a light surface in the same family
  as the page (#E7EBF4 -> #CFD8E9), sitting about 24 luminance points
  below the page background -- enough to read as its own panel rather
  than dissolving into the page. The dark brand photography behind the
  tire is lifted and desaturated so it sits as a soft tonal backdrop
  instead of punching a dark hole through the surface.

  Inverting a panel means every colour on it has to be re-derived, and
  two things did NOT survive automatically:

  - Text: the muted greys that worked on dark failed WCAG AA once the
    panel went light (the blurb dropped to 2.79:1, the progress label to
    1.66:1). Both were re-picked and verified -- blurb now 5.23:1,
    kicker 3.26:1, progress 9.36:1, progress-faint 3.23:1. All pass.

  - Brand logos: 15 marks previously got a WHITE plate because they were
    too dark for the dark panel. On a light panel the risk inverts --
    checking all 23 marks found 6 PALE ones (Michelin, Toyo, Geostar,
    Dunlop, Triangle, Pirelli) that would now wash out instead. The
    plate is now dark, and the build flags pale marks rather than dark
    ones, recomputed from the artwork so swapping a logo updates it.

· TREAD PATH ALIGNMENT -- REAL CAUSE FOUND
  The path was drawn as a straight polyline between anchor centres, but
  the wheel does not travel that line: its real course includes the arc
  lift between sections and the extra offsets on the final approach into
  the bay. So the tread sat off the wheel's actual course -- worst at
  mid-handover, exactly where the arc lifts the wheel highest.

  The path now reproduces the same position formula the wheel itself
  uses, sampled across the route. Measured: the old straight path was
  0.324 world units off course at its worst point; the new one is 0.000.

WHAT CHANGED IN v48

· TREAD PATH -- REBUILT AROUND THE RIGHT MECHANIC
  I had been building the wrong thing. Every previous version spawned
  marks at the wheel's current position which then faded out over time:
  a particle/comet trail. The brief describes something different -- a
  path that ALREADY EXISTS along the wheel's whole route, drawn faint
  ahead of the wheel (the road it is about to travel) and solid behind
  it (the mark it has left), with the wheel as the moving boundary
  between the two.

  The wheel's route through the page is now sampled once into 90
  segments laid end to end as one continuous track. Nothing spawns and
  nothing decays -- each frame simply lights every segment according to
  whether the wheel has passed it yet. Verified: a segment 20 ahead of
  the wheel sits at 0.13 opacity, 20 behind at 0.66, and the SAME
  segment transitions from 0.13 to 0.66 as the wheel rolls over it.

· THREE WHEEL FINISHES, ONE PER SECTION
  The model has two materials (RIM_UNITED = rim, default = tire), so
  each section now re-finishes the wheel rather than only moving it
  differently:
    hero      the model's own delivered finish
    services  bright chrome rim, cooler rubber
    why       gloss black rim, deep neutral rubber
    bay       warm bronze rim
  The swap happens during the handover, hidden inside the motion.
  Measured: the closest two finishes differ by 93 luminance points, so
  each reads as clearly a different wheel.

  NOTE: with one .glb these are material variants, not different
  geometry -- three genuinely different wheels needs two more model
  files. Drop them in and this becomes true geometry swaps; the
  per-section hook is already in place.

  Also made the finish code defensive: it is cosmetic, so a malformed
  glTF can no longer abort the load and leave the wheel invisible (a
  real failure mode caught by the test suite during this change).

WHAT CHANGED IN v47

· NO TREAD WHILE SCROLLING THROUGH A SECTION -- REAL BUG, FIXED
  You were right that nothing appeared in the Services section. The
  trail was gated on the `travelling` flag, which is ONLY true during
  the brief handover between two sections. While you scroll through a
  section the wheel is locked to its sticky slot and rides up the
  screen -- unmistakably moving, but `travelling` is false, so not a
  single mark was laid.

  It is now driven by actual measured movement instead. Verified with a
  direct simulation of scrolling through a section: the old logic laid
  marks on 0 of 60 frames, the new logic on 60 of 60 -- while a parked,
  idle wheel still correctly lays nothing (small-jitter threshold).

· A REAL TREAD PATTERN, NOT A GLOW
  The previous version was a soft radial blob, which is why it still
  read as plain. This draws actual tread anatomy to a canvas: a solid
  centre rib along the direction of travel, angled shoulder lugs either
  side staggered front-to-back so it reads as directional rather than a
  symmetrical ladder, and narrow sipes cut through each lug -- the
  detail that makes tread look like rubber instead of a row of bricks.
  Both ends fade so consecutive prints join into one continuous track.
  Verified by reproducing the exact drawing operations: 54.6% ink
  coverage with 7 distinct lug blocks and genuine gaps, i.e. a real
  repeating pattern rather than a solid slab.

  Also switched from additive to normal blending. Additive was washing
  the gaps BETWEEN the lugs up to the same brightness as the lugs
  themselves -- which is precisely what flattened the pattern into a
  featureless glow. The gaps are what make it read as tread at all.
  Prints now overlap slightly, last longer, hold near full strength
  before fading, and taper only across their width so the pattern keeps
  its proportions instead of shrinking to a dot.

  (Fixed more test-mock gaps found while verifying -- the canvas stub
  needed the full 2D path API. Full ten-test suite passes clean.)

WHAT CHANGED IN v46

· TREAD TRAIL REBUILT — diagnosed why it looked wrong, not just tweaked
  Two real causes, both fixed:

  1. The marks were near-black, hard-edged, fully opaque rectangles
     floating over the site's LIGHT background. On a light page that
     reads as dark smudges, not a glow -- there was nothing "premium" a
     flat dark sticker could look like here. Rebuilt as a soft radial
     glow (blurred edges, additive blending) in the SAME shared blue the
     rim lights and install-bay ring already use, so it reads as an
     extension of the light already established in the scene rather than
     a foreign element. It now also picks up the same per-segment tint
     from the "3 transitions" work (blue / teal / violet), so the trail
     visibly belongs to whichever personality is currently playing.

  2. Each mark's rotation was set from the RAW per-frame travel delta,
     and during the arc/tumble motion the instantaneous direction swings
     hard even though the overall path is smooth. Measured directly: up
     to a 74-degree change in a SINGLE frame during the tumble segment
     -- which is exactly what made marks scatter at visibly wrong,
     inconsistent angles instead of laying along a coherent path. The
     direction is now smoothed with an exponential average before it's
     used for orientation; the same test scenario now shows a 7-degree
     maximum frame-to-frame change.

  Also: fewer, closer-spaced marks that shrink as they fade (a tapering
  "comet tail" rather than a fixed-size fade), and the front preview is
  a single soft glow riding just ahead rather than a literal print.

  Fixed several more test-mock gaps found while verifying this
  (createRadialGradient, Mesh.scale) -- same pattern as before: the
  mocks hadn't been exercised by this code path until now. Full ten-test
  suite passes clean.

WHAT CHANGED IN v45

· TREAD TRAIL
  The wheel now leaves a real trail as it travels between sections: a
  series of tread-print marks dropped behind it in world space (each
  fading out over about a second), plus one faint print always riding
  just ahead, oriented to whichever way it's currently moving. Only
  active while actually rolling between anchors -- never while parked
  reading a section, never while docked.

· THREE DISTINCT TRANSITIONS
  The site has one 3D tire model (car_tyre.glb), not three separate
  ones, so "3 different wheels" is delivered as three genuinely
  different MOTION personalities across the three handovers, reinforced
  by a colour cue -- not three different geometries, which would need
  additional 3D assets that weren't provided:
    1. Hero -> Services: the original rolling arc (unchanged baseline)
    2. Services -> Why: a livelier tumble -- extra pitch swing and a
       wobble mid-flight, still landing exactly on the target pose
    3. Why -> the install bay: the most dramatic of the three -- a
       bigger scale overshoot on its own sharper cubic ease
  Each segment also tints the wheel's rim lighting toward a different
  hue (blue / teal / violet) as a "changed wheel" cue. Both rim lights
  ALWAYS receive the identical colour, enforced in code -- this can
  never reintroduce the left/right lighting bias that took real
  simulation work to balance out earlier; only the shared hue moves.

  All of this is layered on TOP of the existing position/lock logic,
  which is untouched -- the proven-exact centring in the docked state
  can't be affected, since the hard-lock override there replaces
  position/scale outright regardless of what came before it.

· CAROUSEL CONTRAST
  Found two darkening layers stacked on an already-dark panel: the
  backdrop photo was dimmed to 46% brightness, then a second dark
  overlay gradient sat on top of that. Backdrop brightness raised to
  66%, the overlay softened, and the panel's own base gradient lifted
  from near-black to a proper navy. A fixed scrim was added specifically
  behind the text areas (not relying on where the diagonal gradient
  happens to land) and the blurb colour lightened slightly, so contrast
  is guaranteed to clear WCAG AA even against the single brightest point
  in the panel's gradient -- verified at 4.63:1 for body text and
  3.63:1 for the category label (both exceed the AA minimums).

  While testing this round, found several long-standing gaps in the
  test mocks themselves (THREE.Mesh, THREE.Color, PointLight.color, a
  working canvas stub) that had never been exercised until this feature
  touched them -- fixed those so the full suite runs clean rather than
  masking real bugs behind mock failures.

WHAT CHANGED IN v44

· STICKY "GET A QUOTE" NOW NAVIGATES INSTANTLY
  Checked first rather than guessed: contact.html itself is tiny
  (~14KB) and its map is already loading="lazy", so it wasn't the
  destination page that was slow. The real cost was self-inflicted --
  every internal link, including this one, waited a fixed 910ms
  (the decorative cover/hold animation) before the browser even started
  fetching the destination.

  That 910ms delay sits on the site's single highest-value action: the
  persistent bar pinned to the bottom of every screen on mobile. It is
  now marked as an instant utility link -- it skips the cinematic wipe
  entirely and navigates right away, keeping just the whoosh sound.
  Every other internal link (main nav, in-page CTAs) keeps the full
  transition as before; this is specifically for the always-on quote
  shortcut, which should feel like a fast utility action rather than a
  chapter change.

  Also added: contact.html is now prefetched in Home's <head>, so its
  HTML is already sitting in the browser cache by the time anyone
  actually clicks -- the eventual navigation is close to instant
  regardless of connection speed at click time.

  Measured directly: a normal internal link still takes ~913ms before
  navigating (unchanged, as intended); the instant-marked quote link
  now navigates in under 1ms.

WHAT CHANGED IN v43

· TIRE 5% BIGGER IN "WHAT WE DO" AND "WHY ONLYTIRES" ONLY
  services (What We Do): fit 0.88 -> 0.924
  why (Why OnlyTires):   fit 0.86 -> 0.903
  Hero and the install bay left untouched.

WHAT CHANGED IN v42

· PRELOADER: ONLY THE TWO BUTTONS OPEN THE DOOR
  Clicking anywhere on the splash used to enter too -- a leftover
  escape hatch from an earlier bug hunt that made it too easy to enter
  by accident. Only "Enter With Sound" / "Enter quietly" work now.
  Escape still works once ready, for keyboard accessibility.

· CHROME'S TAB SPINNER VS. "READY" -- REAL MISMATCH, FIXED
  Confirmed: our progress bar only ever tracked our OWN fetches (the 3D
  model + brand art). It never checked whether the browser itself had
  actually finished loading -- the Three.js CDN scripts, Google Fonts,
  or anything else the page references. So it was genuinely possible
  for the bar to say 100% while Chrome's tab still spun, because real
  network activity was still in flight underneath us.

  "Ready" now also requires window.load (readyState === 'complete') --
  the exact same signal the tab spinner itself waits on. This closes
  the gap for any subresource, not just the ones we already tracked. The
  new gate was placed at the very top of the script specifically to
  avoid the var-hoisting trap that has bitten this file before, and the
  fallback path (reduced-motion / no-WebGL) now goes through the same
  shared check instead of claiming 100% unconditionally.

  Fixed a smaller bug found while testing this: the status label could
  flicker backward -- "Loading brands 23/46" briefly reverting to
  "Loading assets" if a slower signal's label arrived after a faster
  one's. Only the caller currently driving the highest percentage may
  set the label now.

  Verified with a real end-to-end simulation: our pipeline finishing
  alone does NOT show "Ready" while the page is still loading; it only
  appears once window.load actually fires, matching the tab spinner.

· VERY SLIGHT SMOOTH SCROLLING (Lenis)
  Added site-wide, tuned deliberately subtle (duration 0.5, lerp 0.16 --
  a hint of ease, close to native, not a long floaty glide). Lenis
  writes directly to the real window.scrollY every frame in its default
  document-scroll mode, so the 3D scroll rig needed no changes at all --
  it already just reads scrollY each frame and gets the smoothed value
  for free. Touch is left native (touch already feels smooth; smoothing
  it further tends to feel laggy). Skipped entirely under
  prefers-reduced-motion, paused whenever the mobile menu's own scroll
  lock is active, and the page-load "reset to top" logic now routes
  through Lenis when it's present so the two never fight over position.

  NOTE: this sandbox has no network access, so the CDN URL
  (jsdelivr, lenis@1) could not be fetched to confirm here. It resolves
  to whatever the current 1.x release is, and the script fails
  gracefully (site just uses native scroll) if the CDN is ever
  unreachable -- but do check it loads once this is actually hosted.

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
