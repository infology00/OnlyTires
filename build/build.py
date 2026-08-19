import base64, pathlib, re

R = pathlib.Path('.')

def minify_css(css):
    """Whitespace/comment stripping only — no rule reordering or rewriting.

    calc() is stashed before collapsing whitespace and restored afterwards:
    CSS *requires* spaces around + and - inside calc(), so stripping them
    silently invalidates the declaration."""
    import re as _re
    css = _re.sub(r'/\*.*?\*/', '', css, flags=_re.S)

    stash = []
    def _keep(m):
        stash.append(_re.sub(r'\s+', ' ', m.group(0)).strip())
        return '\x00CALC%d\x00' % (len(stash) - 1)
    # nested calc()/env()/min()/max() handled by matching balanced parens
    css = _re.sub(r'calc\((?:[^()]|\([^()]*\))*\)', _keep, css)

    css = _re.sub(r'\s+', ' ', css)
    css = _re.sub(r'\s*([{}:;,>~+])\s*', r'\1', css)
    css = _re.sub(r';}', '}', css)
    css = _re.sub(r'\s*!\s*important', '!important', css)
    css = _re.sub(r'\x00CALC(\d+)\x00', lambda m: stash[int(m.group(1))], css)
    return css.strip()

def strip_js_comments(js):
    """Remove full-line // comments and /* */ blocks that sit on their own
    lines. Deliberately conservative: nothing inside a line is touched, so
    no string or regex literal can be damaged."""
    import re as _re
    js = _re.sub(r'^[ \t]*/\*.*?\*/[ \t]*$', '', js, flags=_re.S | _re.M)
    out = []
    for line in js.split('\n'):
        st = line.strip()
        if st.startswith('//'):
            continue
        out.append(line)
    js = '\n'.join(out)
    js = _re.sub(r'\n{3,}', '\n\n', js)
    return js
logo = 'assets/logo.webp'
css   = (R/'source/css/style.css').read_text()
audio = (R/'source/js/audio.js').read_text()
fx    = (R/'source/js/fx.js').read_text()

NAV = [('index.html','Home'),('tires.html','Tires'),('services.html','Services'),
       ('fleet.html','Fleet / Commercial'),('about.html','About')]
# contact.html is still a real page (footer + the quote button reach it); it is
# just no longer duplicated as a nav link beside its own button.
ALL_PAGES = NAV + [('contact.html','Contact')]

def header(active):
    li = []
    for href, label in NAV:
        cls = ' class="is-active"' if href == active else ''
        li.append(f'      <li><a href="{href}"{cls}>{label}</a></li>')
    links = '\n'.join(li)
    return f'''<header class="site-header">
  <div class="topbar">
    <span>20926 Sheridan St, Pembroke Pines, FL</span>
    <span class="dot">◆</span>
    <a href="tel:7547554554">754-755-4554</a>
    <span class="dot">◆</span>
    <span>Mon–Fri <em>8AM – 6PM</em></span>
  </div>
  <nav class="nav" aria-label="Main">
    <a class="brand" href="index.html" aria-label="OnlyTires home">
      <img src="{logo}" alt="OnlyTires">
    </a>
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    <ul class="nav-links">
{links}
      <li class="nav-cta"><a class="btn btn--primary" href="contact.html">Get a Quote</a></li>
    </ul>
  </nav>
</header>'''

FOOTER = f'''<div class="tread" aria-hidden="true"></div>
<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <img src="{logo}" alt="OnlyTires">
      <p>Local tire shop — sales, installation, and full tire service. Tires first, service supports.</p>
    </div>
    <div>
      <h4>Pages</h4>
      <ul>
        <li><a href="tires.html">Tires</a></li>
        <li><a href="services.html">Services</a></li>
        <li><a href="fleet.html">Fleet / Commercial</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="contact.html">Contact / Get a Quote</a></li>
      </ul>
    </div>
    <div>
      <h4>Visit</h4>
      <ul>
        <li>20926 Sheridan Street</li>
        <li>Pembroke Pines, FL 33332</li>
        <li><a href="tel:7547554554">754-755-4554</a></li>
      </ul>
    </div>
    <div>
      <h4>More</h4>
      <ul>
        <li><a href="https://hoosgarage.com" target="_blank" rel="noopener">Hoos Garage — Custom &amp; Performance</a></li>
        <li><a href="privacy.html">Privacy Policy</a></li>
        <li><a href="terms.html">Terms of Use</a></li>
        <li><a href="#">Leave us a review</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-cta-line">
    <div class="footer-bottom">
      <span>© <span data-year></span> OnlyTires LLC · An Ionic Group company</span>
      <span>Custom &amp; performance builds → <a href="https://hoosgarage.com" target="_blank" rel="noopener">Hoos Garage</a> (same location)</span>
    </div>
  </div>
</footer>
<div class="mobile-bar">
  <a class="call" href="tel:7547554554">Call Now</a>
  <a class="quote" href="contact.html">Get a Quote</a>
</div>
<button class="sound-toggle" aria-label="Toggle sound"><i></i><i></i><i></i><i></i></button>'''

# is-covered = the page starts behind the panels; JS animates them away
VEIL = ('<div class="page-veil is-covered" aria-hidden="true">'
        '<i></i><i></i><i></i><i></i></div>\n'
        '<div class="scroll-progress" aria-hidden="true"></div>')

PRELOADER = f'''<div class="preloader" aria-label="Loading OnlyTires">
  <div class="preloader-inner">
    <div class="preloader-ring" aria-hidden="true"></div>
    <div class="preloader-brand"><img src="{logo}" alt="OnlyTires"></div>
    <div class="preloader-status">Warming up</div>
    <div class="preloader-pct">0%</div>
    <div class="preloader-bar"><i></i></div>
    <div class="preloader-enter">
      <button class="btn btn--primary btn--lg" id="enter-sound">Enter With Sound <span class="btn-arrow">→</span></button>
      <button class="preloader-quiet" id="enter-quiet">Enter quietly</button>
    </div>
  </div>
</div>'''

HEAD_BOOT = ("<script>"
  "/* Runs before first paint. 'ot-internal-nav' is set only when leaving a"
  "   page via an in-site link, so arriving that way skips the preloader while"
  "   a refresh or a fresh visit still gets it. The flag is cleared on read. */"
  "(function(){try{var n=sessionStorage.getItem('ot-internal-nav');"
  "if(n==='1'){document.documentElement.className+=' ot-seen';"
  "sessionStorage.removeItem('ot-internal-nav');}}catch(e){}})();"
  "</script>")

def page(filename, active, title, desc, body, home=False, extra_head='', extra_scripts=''):
    pre = PRELOADER + '\n' if home else ''
    if home:
        extra_head = (extra_head +
          '\n<link rel="preload" href="assets/car_tyre.glb" as="fetch" crossorigin="anonymous">'
          '\n<link rel="preload" href="assets/brand-tires/michelin.webp" as="image">')
    gl  = '<div id="gl-stage" aria-hidden="true"></div>\n' if home else ''
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="{logo}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:ital,wght@0,700;0,800;1,700;1,800&family=Saira:wght@400;500;600;700&display=swap" rel="stylesheet">
{HEAD_BOOT}
<link rel="stylesheet" href="css/style.css">
{extra_head}
</head>
<body>
{pre}{VEIL}
{gl}{header(active)}

{body}

{FOOTER}

<script src="js/audio.js" defer></script>
<script src="js/fx.js" defer></script>
{extra_scripts}
</body>
</html>
'''

# ---- interior pages ----
meta = {}
for p, _ in ALL_PAGES[1:]:
    m = (R/f'build/bodies/{p}.meta').read_text().split('\n')
    meta[p] = (m[0], m[1])
for p in ['privacy.html','terms.html']:
    m = (R/f'build/bodies/{p}.meta').read_text().split('\n')
    meta[p] = (m[0], m[1])

for p, (title, desc) in meta.items():
    body = (R/f'build/bodies/{p}.frag').read_text()
    active = p
    (R/p).write_text(page(p, active, title, desc, body))
    print('built', p)

# ---- brand artwork: real files, referenced by URL ----
# Images are served as ordinary assets so the browser caches them once and
# reuses them across pages, instead of re-parsing megabytes of base64 in
# every HTML document. Nothing about how they look or behave changes.
import json as _json

logos = {f.stem: 'assets/brands/' + f.name
         for f in sorted(pathlib.Path('assets/brands').glob('*.webp'))}
bgs   = {f.stem: 'assets/brand-bg/' + f.name
         for f in sorted(pathlib.Path('assets/brand-bg').glob('*.webp'))}
tires = {f.stem: 'assets/brand-tires/' + f.name
         for f in sorted(pathlib.Path('assets/brand-tires').glob('*.webp'))}

_first = sorted(pathlib.Path('assets/brand-tires').glob('*.webp'))
tire_front = tire_angle = ('assets/brand-tires/' + _first[0].name) if _first else ''

_plate_file = pathlib.Path('assets/logo-plate.json')
plate = _json.loads(_plate_file.read_text()) if _plate_file.exists() else []

brand_payload = ('<script>window.__OT_LOGO_PLATE__=' + _json.dumps(plate) +
                 ';window.__OT_BRAND_LOGOS__=' + _json.dumps(logos) +
                 ';window.__OT_BRAND_BGS__=' + _json.dumps(bgs) +
                 ';window.__OT_BRAND_TIRES__=' + _json.dumps(tires) +
                 ';window.__OT_TIRE_FALLBACK__=' + _json.dumps({'front':tire_front,'angle':tire_angle}) +
                 ';</script>')
print('  brand art: %d logos (%d on white plate), %d backdrops, %d tire photos (external)'
      % (len(logos), len(plate), len(bgs), len(tires)))

# ---- write shared, cacheable assets ----
(R/'css').mkdir(exist_ok=True)
(R/'js').mkdir(exist_ok=True)
(R/'css/style.css').write_text(minify_css(css))
(R/'js/audio.js').write_text(audio)
(R/'js/fx.js').write_text(fx)
(R/'js/tire-wall.js').write_text((R/'source/js/tire-wall.js').read_text())
# source/ keeps the fully commented originals; js/ is what ships

# ---- home ----
exp_src = (R/'source/js/experience.js').read_text().replace('__LOGO_SRC__', logo)
scripts = (brand_payload +
  '\n<script src="js/tire-wall.js" defer></script>'
  '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>'
  '\n<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js" defer></script>'
  '\n<script src="js/experience.js" defer></script>')
home_body = (R/'build/home_body.html').read_text()
home_body = home_body.replace('__TIRE_FRONT__', tire_front).replace('__TIRE_ANGLE__', tire_angle)
(R/'js/experience.js').write_text(exp_src)
(R/'index.html').write_text(page(
    'index.html','index.html',
    'OnlyTires — Tire Shop in Pembroke Pines, FL | New Tires, Installation &amp; Full Tire Service',
    "OnlyTires is Pembroke Pines' go-to tire shop for new tires, installation, rotation, balancing, alignment, TPMS and flat repair. Get a fast quote — 754-755-4554.",
    home_body, home=True, extra_scripts=scripts))
print('built index.html')
