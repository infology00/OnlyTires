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
favicon = 'assets/favicon.png'   # the original white-background mark
css   = (R/'source/css/style.css').read_text()
audio = (R/'source/js/audio.js').read_text()
fx    = (R/'source/js/fx.js').read_text()

# ---------------------------------------------------------------------------
# PRE-LAUNCH GATE
#
# While this is True the public sees one page: a coming-soon cover served at
# the site root. The finished site is still built in full and still ships --
# it is simply unreachable, so launch day is this flag flipped back to False
# and a rebuild, with nothing else to undo.
#
#   index.html   the cover (no nav, no 3D, nothing to click through)
#   home.html    the real home page, gated
#   every other page, gated
#
# "Gated" means a redirect that runs in <head>, before the body or any of the
# page's scripts, so a visitor typing /services.html directly never sees a
# frame of it and never pays for the download.
#
# The bypass exists so the site can still be reviewed while the gate is up:
# visiting any page with ?preview=1 unlocks it for that browser tab only
# (sessionStorage, so it dies with the tab and can never leak to a visitor),
# and ?preview=0 locks it again.
COMING_SOON = True

GATE = (
  '<script>'
  '(function(){'
  'var on=false;'
  'try{'
  'var q=location.search;'
  "if(q.indexOf('preview=1')>-1){sessionStorage.setItem('ot-preview','1');}"
  "else if(q.indexOf('preview=0')>-1){sessionStorage.removeItem('ot-preview');}"
  "on=sessionStorage.getItem('ot-preview')==='1';"
  '}catch(e){on=false;}'
  'var here=(location.pathname.split("/").pop()||"index.html");'
  'var cover=(here==="index.html");'
  # On the cover with preview on -> straight through to the real home.
  # On any real page with preview off -> back to the cover.
  'if(cover&&on){location.replace("home.html"+location.search);}'
  'else if(!cover&&!on){location.replace("index.html");}'
  '})();'
  '</script>')

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
  <a class="quote" href="contact.html" data-instant>Get a Quote</a>
</div>
<button class="sound-toggle" aria-label="Toggle sound"><i></i><i></i><i></i><i></i></button>'''

# is-covered = the page starts behind the panels; JS animates them away
VEIL = ('<div class="page-veil is-covered" aria-hidden="true">'
        '<i></i><i></i><i></i><i></i></div>\n'
        '<div class="scroll-progress" aria-hidden="true"></div>')

PRELOADER = f'''<div class="preloader" aria-label="Loading OnlyTires">
  <div class="preloader-inner">
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
  "/* Runs before first paint. Two independent signals mean 'this is an"
  "   in-site navigation, skip the preloader': a #s marker on the URL"
  "   (primary — survives even when sessionStorage is blocked or partitioned,"
  "   which is common on file:// and is why the preloader kept reappearing"
  "   when testing by double-clicking the page), and an 'ot-internal-nav'"
  "   sessionStorage flag as a second check for normal hosting. Either one"
  "   is enough. The #s marker is stripped from the address bar immediately"
  "   via replaceState, so a genuine reload of the resulting clean URL still"
  "   shows the preloader as expected -- it only ever fires once per visit."
  "   As a second layer, an EXPLICIT reload (F5 / the reload button) always"
  "   shows the preloader, overriding both signals -- so even a stray #s"
  "   or leftover storage flag surviving somehow can never suppress it on"
  "   a reload the visitor deliberately asked for."
  "   Scroll restoration is turned off too: reloading half way down a page"
  "   used to drop you back at that same spot, which fought the intro. */"
  "(function(){"
  "var isReload=false;"
  "try{var nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];"
  "isReload=nav?nav.type==='reload':(performance.navigation&&performance.navigation.type===1);}catch(e){}"
  "var byHash=false,byStore=false;"
  "if(!isReload){"
  "try{byHash=location.hash==='#s';}catch(e){}"
  "try{byStore=sessionStorage.getItem('ot-internal-nav')==='1';}catch(e){}"
  "}"
  "if(byHash||byStore){"
  "try{document.documentElement.className+=' ot-seen';}catch(e){}"
  "}"
  "try{sessionStorage.removeItem('ot-internal-nav');}catch(e){}"
  "if(location.hash==='#s'){"
  "try{if(history.replaceState){history.replaceState(null,'',location.pathname+location.search);}}catch(e){}"
  "}"
  "try{if('scrollRestoration' in history){history.scrollRestoration='manual';}}catch(e){}"
  "})();"
  "</script>")

def page(filename, active, title, desc, body, home=False, extra_head='', extra_scripts=''):
    pre = PRELOADER + '\n' if home else ''
    if home:
        extra_head = (extra_head +
          '\n<link rel="preload" href="assets/car_tyre.glb" as="fetch" crossorigin="anonymous">'
          '\n<link rel="preload" href="assets/brand-tires/michelin.webp" as="image">'
          # The sticky "Get a Quote" bar navigates straight to contact.html --
          # it is the site's primary conversion action, so its destination is
          # fetched in the background the moment Home is idle, before it is
          # ever clicked. contact.html is tiny (~14KB), so this costs nothing
          # meaningful even on a slow connection, and makes the eventual
          # navigation feel instant regardless of network speed at click time.
          '\n<link rel="prefetch" href="contact.html">')
    gl  = '<div id="gl-stage" aria-hidden="true"></div>\n' if home else ''
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
{GATE if COMING_SOON else ''}
<link rel="icon" href="{favicon}">
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

<script src="https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js" defer></script>
<script src="js/audio.js" defer></script>
<script src="js/fx.js" defer></script>
<script src="js/smooth-scroll.js" defer></script>
{extra_scripts}
</body>
</html>
'''

# ---- the pre-launch cover ----
# Deliberately standalone: its own small stylesheet inline, no nav, no
# footer, no stylesheet or script from the real site. That is the point --
# nothing here can be clicked into the site, and a visitor on a phone
# downloads a few KB instead of the full build. The shop is open, so the
# phone number is the one live action on the page.
#
# The Admin unlock is a CONVENIENCE, not a security control, and it is worth
# being plain about the difference: everything the browser needs to open the
# gate has to be shipped to the browser, so anyone determined enough to read
# the page source can get past it. Storing a hash rather than the literal
# passphrase keeps it from being found by simply searching the file, which is
# the realistic threat for a pre-launch page -- but nothing sensitive should
# ever sit behind this gate. It hides an unfinished site from casual
# visitors; that is the whole job.
ADMIN_CODE = '#$412g'

def _fnv1a32(s):
    """FNV-1a, 32-bit. Mirrors the JS on the cover exactly (Math.imul +
    >>> 0 give the same bit pattern as masking to 32 bits here)."""
    h = 2166136261
    for ch in s:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h

ADMIN_HASH = _fnv1a32(ADMIN_CODE)

COVER_CSS = '''
:root{
  --bg:#EDEFF4;--ink:#0A0F1E;--ink-soft:#414D68;
  --blue:#1741D6;--blue-hot:#2B5BFF;--blue-deep:#0E2A8C;
  --font-display:'Saira Condensed',sans-serif;--font-body:'Saira',system-ui,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
/* Centred on both axes with no thumb on the scale: the grid centres the
   card, and the card itself carries no lopsided padding that would pull the
   optical centre off. The tread strip is position:fixed so it decorates the
   foot of the screen without taking part in that centring.
   place-ITEMS rather than place-CONTENT is deliberate: it centres the card
   in the spare space, but when the card is taller than the viewport (a
   short landscape phone, say) the row simply grows and the page scrolls,
   instead of centring the overflow and putting the logo out of reach. */
body{
  font-family:var(--font-body);color:var(--ink);background:var(--bg);
  min-height:100svh;display:grid;place-items:center;
  padding:28px 24px;overflow-x:hidden;position:relative;
  -webkit-font-smoothing:antialiased;
}
body::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(46% 40% at 50% 8%, rgba(43,91,255,.16), transparent 70%),
    radial-gradient(30% 30% at 12% 78%, rgba(23,65,214,.12), transparent 74%),
    radial-gradient(30% 30% at 88% 70%, rgba(14,42,140,.10), transparent 74%);
}
.cover{
  position:relative;z-index:1;width:100%;max-width:640px;
  display:grid;justify-items:center;text-align:center;
}
.cover img{width:auto;height:56px;object-fit:contain;margin:0 0 28px}
.eyebrow{
  display:inline-flex;align-items:center;gap:10px;
  font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;
  color:var(--blue);margin-bottom:14px;
}
.eyebrow::before{content:"";width:24px;height:3px;background:var(--blue);transform:skewX(-24deg)}
h1{
  font-family:var(--font-display);font-style:italic;font-weight:800;
  text-transform:uppercase;letter-spacing:-.01em;line-height:.94;
  font-size:clamp(48px,13vw,104px);
}
/* The gradient word was losing the right-hand edge of its final N. With
   background-clip:text the gradient is painted across the element's box and
   then clipped to the glyphs -- so anything a glyph puts OUTSIDE that box
   simply never gets painted, and an 800-weight italic at this size throws
   its last letter well past the end of the line. The padding widens the
   painted box enough to cover the overhang, and the matching negative
   margin gives the space back so the word stays optically centred. */
h1 span{
  display:inline-block;padding:0 .16em .08em;margin:0 -.16em -.08em;
  background:linear-gradient(135deg,var(--blue-hot),var(--blue-deep));
  -webkit-background-clip:text;background-clip:text;
  color:transparent;-webkit-text-fill-color:transparent;
}
.lede{margin:20px 0 0;max-width:44ch;color:var(--ink-soft);line-height:1.6;font-size:15px}
.call{
  display:inline-flex;align-items:center;gap:10px;margin-top:30px;
  font-family:var(--font-display);font-style:italic;font-weight:700;
  text-transform:uppercase;letter-spacing:.05em;font-size:17px;
  padding:15px 34px;border-radius:12px;text-decoration:none;color:#fff;
  background:linear-gradient(135deg,var(--blue-hot) 0%,var(--blue-deep) 100%);
  box-shadow:0 8px 24px -10px rgba(23,65,214,.6);
  transition:transform .3s cubic-bezier(.25,.8,.3,1),box-shadow .3s cubic-bezier(.25,.8,.3,1);
}
.call:hover{transform:translateY(-3px);box-shadow:0 16px 32px -10px rgba(23,65,214,.62)}
.call:active{transform:translateY(-1px)}
.meta{
  margin-top:26px;display:flex;flex-wrap:wrap;justify-content:center;
  align-items:center;gap:8px 18px;font-size:12.5px;color:var(--ink-soft);
}
.meta b{color:var(--ink);font-weight:600}
.meta span{display:inline-flex;align-items:center;gap:8px}
.meta span+span::before{content:"\\25C6";color:var(--blue-hot);font-size:8px}

/* ---- admin unlock ---- */
.admin{margin-top:30px;display:grid;justify-items:center;gap:12px;width:100%}
.admin__toggle{
  font:inherit;font-size:12px;font-weight:600;letter-spacing:.04em;
  color:var(--ink-soft);background:none;border:0;cursor:pointer;
  padding:7px 14px;border-radius:99px;
  transition:color .25s ease,background .25s ease;
}
.admin__toggle:hover{color:var(--blue);background:rgba(23,65,214,.07)}
.admin__panel{display:none;justify-content:center;gap:8px;width:100%;max-width:320px}
.admin.is-open .admin__panel{display:flex}
.admin.is-open .admin__toggle{color:var(--blue)}
.admin__input{
  font:inherit;font-size:14px;letter-spacing:.18em;color:var(--ink);
  flex:1 1 auto;min-width:0;padding:11px 14px;border-radius:10px;
  background:rgba(255,255,255,.86);border:1px solid rgba(16,32,74,.16);
  outline:none;transition:border-color .2s ease,box-shadow .2s ease;
}
.admin__input::placeholder{color:#8A93A8;letter-spacing:.06em}
.admin__input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(43,91,255,.16)}
.admin__go{
  font:inherit;font-size:13px;font-weight:700;color:#fff;cursor:pointer;
  padding:11px 18px;border:0;border-radius:10px;
  background:linear-gradient(135deg,var(--blue-hot),var(--blue-deep));
}
.admin__msg{font-size:12px;color:#B3261E;min-height:1em}
.admin.is-wrong .admin__panel{animation:nudge .32s ease}
@keyframes nudge{
  0%,100%{transform:translateX(0)}
  25%{transform:translateX(-6px)}
  75%{transform:translateX(6px)}
}

/* a strip of tread laid across the foot of the page, rolling slowly past --
   the one motif carried over from the site itself */
.tread{
  position:fixed;left:0;right:0;bottom:0;height:56px;z-index:0;pointer-events:none;
  opacity:.13;
  background:
    repeating-linear-gradient(74deg, var(--blue) 0 14px, transparent 14px 34px),
    repeating-linear-gradient(-74deg, var(--blue) 0 10px, transparent 10px 38px);
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 60%),
                     linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
  -webkit-mask-composite:source-in;
  mask-image:linear-gradient(180deg,transparent,#000 60%),
             linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
  mask-composite:intersect;
  animation:roll 9s linear infinite;
}
@keyframes roll{from{background-position:0 0,0 0}to{background-position:-96px 0,96px 0}}
@media (prefers-reduced-motion:reduce){
  .tread{animation:none}.call{transition:none}.admin.is-wrong .admin__panel{animation:none}
}
@media (max-width:520px){
  .cover img{height:44px;margin-bottom:22px}
  .lede{font-size:14px}
  .call{width:100%;justify-content:center}
}
'''

COVER_JS = '''
/* Two jobs, in order:
   1. a tab that has already unlocked goes straight through to the site;
   2. the Admin control, which is what does the unlocking. */
(function(){
  function unlocked(){
    try{ return sessionStorage.getItem('ot-preview')==='1'; }catch(e){ return false; }
  }
  try{
    var q=location.search;
    if(q.indexOf('preview=1')>-1){sessionStorage.setItem('ot-preview','1');}
    else if(q.indexOf('preview=0')>-1){sessionStorage.removeItem('ot-preview');}
  }catch(e){}
  if(unlocked()){ location.replace('home.html'); return; }

  /* Same FNV-1a the build used, so only the hash of the passphrase ships
     and the passphrase itself is not sitting in the source to be found by
     searching for it. This is obscurity, not security -- see build.py. */
  function hash(s){
    var v=2166136261;
    for(var i=0;i<s.length;i++){ v^=s.charCodeAt(i); v=Math.imul(v,16777619); }
    return v>>>0;
  }

  document.addEventListener('DOMContentLoaded', function(){
    var wrap=document.getElementById('admin');
    var toggle=document.getElementById('adminToggle');
    var panel=document.getElementById('adminPanel');
    var input=document.getElementById('adminInput');
    var go=document.getElementById('adminGo');
    var msg=document.getElementById('adminMsg');
    if(!wrap||!toggle||!input) return;

    function open(){
      wrap.classList.add('is-open');
      toggle.setAttribute('aria-expanded','true');
      input.value=''; msg.textContent='';
      input.focus();
    }
    function close(){
      wrap.classList.remove('is-open','is-wrong');
      toggle.setAttribute('aria-expanded','false');
      msg.textContent='';
      toggle.focus();
    }
    function submit(){
      /* trimmed: a phone keyboard will happily append a space after the
         last character, and rejecting a correct code over that would be
         baffling */
      if(hash((input.value||'').trim())===__CODE_HASH__){
        try{ sessionStorage.setItem('ot-preview','1'); }catch(e){}
        msg.style.color='#1741D6';
        msg.textContent='Unlocked — opening the site…';
        location.replace('home.html');
      }else{
        wrap.classList.remove('is-wrong');
        /* restart the nudge even on a repeated wrong entry */
        void wrap.offsetWidth;
        wrap.classList.add('is-wrong');
        msg.textContent='That code is not right.';
        input.select();
      }
    }

    toggle.addEventListener('click', function(){
      if(wrap.classList.contains('is-open')) close(); else open();
    });
    go.addEventListener('click', submit);
    input.addEventListener('keydown', function(e){
      if(e.key==='Enter'){ e.preventDefault(); submit(); }
      else if(e.key==='Escape'){ e.preventDefault(); close(); }
    });
    input.addEventListener('input', function(){
      wrap.classList.remove('is-wrong');
      msg.textContent='';
    });
  });
})();
'''


def cover_page():
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OnlyTires — Coming Soon | Tire Shop in Pembroke Pines, FL</title>
<meta name="description" content="The new OnlyTires site is on its way. We're open in Pembroke Pines for new tires, installation, rotation, balancing, alignment, TPMS and flat repair — call 754-755-4554.">
<link rel="icon" href="{favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:ital,wght@0,700;0,800;1,700;1,800&family=Saira:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{COVER_CSS}</style>
</head>
<body>
<main class="cover">
  <img src="{logo}" alt="OnlyTires">
  <p class="eyebrow">Pembroke Pines, Florida</p>
  <h1>Coming<br><span>Soon</span></h1>
  <p class="lede">Our new site is being mounted and balanced. The shop is open in the meantime — call us for tires, installation, rotation, balancing, alignment, TPMS or a flat repair.</p>
  <a class="call" href="tel:7547554554">Call 754-755-4554</a>
  <div class="meta">
    <span><b>20926 Sheridan St</b>, Pembroke Pines, FL</span>
    <span>Mon–Fri <b>8AM – 6PM</b></span>
  </div>

  <div class="admin" id="admin">
    <button class="admin__toggle" id="adminToggle" type="button"
            aria-expanded="false" aria-controls="adminPanel">Admin?</button>
    <div class="admin__panel" id="adminPanel">
      <input class="admin__input" id="adminInput" type="password"
             autocomplete="off" autocapitalize="off" autocorrect="off"
             spellcheck="false" placeholder="Access code" aria-label="Admin access code">
      <button class="admin__go" id="adminGo" type="button">Enter</button>
    </div>
    <p class="admin__msg" id="adminMsg" role="status" aria-live="polite"></p>
  </div>
</main>
<div class="tread" aria-hidden="true"></div>
<script>{COVER_JS.replace('__CODE_HASH__', str(ADMIN_HASH))}</script>
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
print('  brand art: %d logos (%d flagged pale, plate styling retired), %d backdrops, %d tire photos (external)'
      % (len(logos), len(plate), len(bgs), len(tires)))

# ---- write shared, cacheable assets ----
(R/'css').mkdir(exist_ok=True)
(R/'js').mkdir(exist_ok=True)
(R/'css/style.css').write_text(minify_css(css))
(R/'js/audio.js').write_text(audio)
(R/'js/fx.js').write_text(fx)
(R/'js/tire-wall.js').write_text((R/'source/js/tire-wall.js').read_text())
(R/'js/smooth-scroll.js').write_text((R/'source/js/smooth-scroll.js').read_text())
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

# With the gate up the real home moves to home.html and the root becomes the
# cover; with it down the home page returns to index.html and the stale
# home.html is cleaned up, so the two states can never both be live at once.
home_file = 'home.html' if COMING_SOON else 'index.html'
(R/home_file).write_text(page(
    'index.html','index.html',
    'OnlyTires — Tire Shop in Pembroke Pines, FL | New Tires, Installation &amp; Full Tire Service',
    "OnlyTires is Pembroke Pines' go-to tire shop for new tires, installation, rotation, balancing, alignment, TPMS and flat repair. Get a fast quote — 754-755-4554.",
    home_body, home=True, extra_scripts=scripts))
print('built', home_file)

if COMING_SOON:
    (R/'index.html').write_text(cover_page())
    print('built index.html  (COMING SOON cover — site gated, ?preview=1 to view)')
else:
    stale = R/'home.html'
    if stale.exists():
        stale.unlink()
        print('removed home.html  (gate down, site live at index.html)')
