"""Wrap each body fragment in pages/ with the shared head, header and footer.

Run from this folder:  python3 build.py
Each fragment starts with a comment:  <!-- title: … | desc: … | nav: <key> -->
"""
import pathlib, re, html

HERE = pathlib.Path(__file__).parent
NAV = [
    ("about", "about.html", "About"),
    ("individual", "individual-therapy.html", "Individual Therapy"),
    ("couples", "couples-therapy.html", "Couples Therapy"),
    ("eft", "eft.html", "EFT"),
    ("resources", "resources.html", "Resources"),
    ("contact", "contact.html", "Contact"),
]

HEAD = """<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="{desc}">
<link rel="preload" href="fonts/cormorant-garamond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/jost-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="styles.css">
</head>
<body class="no-js">

<header class="site" id="site-header">
  <div class="concept">Design concept · fictional practice and practitioner · AI-generated photography</div>
  <div class="wrap nav">
    <a class="brand" href="index.html" aria-label="Kindred Room Psychotherapy, home">
      <b>Kindred Room</b>
      <span>Psychotherapy · Surry Hills</span>
    </a>
    <nav class="primary" id="primary-nav" aria-label="Primary">
      <ul>
{nav}
      </ul>
    </nav>
    <a class="btn" href="contact.html#book">Book a consultation</a>
    <button class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="primary-nav">Menu</button>
  </div>
</header>

<main id="top">
"""

FOOT = """</main>

<footer class="site">
  <div class="wrap">
    <div class="top">
      <div>
        <a class="brand" href="index.html"><b>Kindred Room</b><span>Psychotherapy · Surry Hills</span></a>
        <p style="margin-top:22px;max-width:22em">Relationship- and attachment-focused psychotherapy for couples and individuals.</p>
      </div>
      <div>
        <h2 class="fh">Therapy</h2>
        <ul><li><a href="individual-therapy.html">Individual</a></li><li><a href="couples-therapy.html">Couples</a></li><li><a href="eft.html">EFT</a></li></ul>
      </div>
      <div>
        <h2 class="fh">Practice</h2>
        <ul><li><a href="about.html">About Helena</a></li><li><a href="resources.html">Resources</a></li><li><a href="contact.html">Contact</a></li></ul>
      </div>
      <div>
        <h2 class="fh">Visit</h2>
        <ul><li>Suite 3, 112 Crown Street</li><li>Surry Hills NSW 2010</li><li>(02) 5550 1247</li><li>hello@kindredroom.com.au</li></ul>
      </div>
    </div>
    <p class="crisis">Kindred Room is not a crisis service. If you need urgent support, call Lifeline on 13 11 14, or 000 in an emergency.</p>
    <div class="base">
      <span>© 2026 Kindred Room Psychotherapy · design concept</span>
      <span>Kindred Room acknowledges the Gadigal people of the Eora Nation, the Traditional Custodians of the land on which we work.</span>
    </div>
  </div>
</footer>

<div class="cursor" aria-hidden="true"></div>

<script src="lenis.min.js" defer></script>
<script src="site.js" defer></script>
</body>
</html>
"""

# Full width of each photo in images/, plus the smaller copies made from it.
WIDTHS = {
    "hero": 2400, "coast": 2400, "beach": 2400, "shelf": 1600, "stilllife": 1400, "hands": 1300,
    "portrait": 1200, "writing": 1200, "door": 1200, "individual": 1100, "couples": 1100,
}
FULL_BLEED = {"hero", "coast", "beach"}


def srcset(name):
    full = WIDTHS[name]
    parts = [f"images/{name}-{w}.webp {w}w" for w in (640, 1200) if w < full]
    return ", ".join(parts + [f"images/{name}.webp {full}w"])


def responsive(match):
    name, rest = match.group(1), match.group(2)
    sizes = "100vw" if name in FULL_BLEED else "(max-width: 900px) 92vw, 46vw"
    return f'<img src="images/{name}.webp" srcset="{srcset(name)}" sizes="{sizes}"{rest}'


for frag in sorted((HERE / "pages").glob("*.html")):
    text = frag.read_text()
    meta = re.match(r"<!--(.*?)-->\n", text, re.S)
    fields = dict(part.split(":", 1) for part in meta.group(1).split("|"))
    fields = {k.strip(): v.strip() for k, v in fields.items()}
    current = ' aria-current="page"'
    nav = "\n".join(
        f'        <li><a href="{href}"{current if key == fields.get("nav") else ""}>{label}</a></li>'
        for key, href, label in NAV
    )
    body = re.sub(r'<img src="images/(\w+)\.webp"([^>]*>)', responsive, text[meta.end():])
    # Preload the first photo so phones start fetching it before the stylesheet arrives.
    first = re.search(r'<img src="images/(\w+)\.webp"[^>]*fetchpriority="high"', body)
    preload = ""
    if first:
        name = first.group(1)
        sizes = "100vw" if name in FULL_BLEED else "(max-width: 900px) 92vw, 46vw"
        preload = f'<link rel="preload" as="image" href="images/{name}.webp" imagesrcset="{srcset(name)}" imagesizes="{sizes}" fetchpriority="high">\n'
    page = HEAD.format(title=html.escape(fields["title"]), desc=html.escape(fields["desc"]), nav=nav)
    page = page.replace('<link rel="preload" href="fonts/', preload + '<link rel="preload" href="fonts/', 1)
    page += body.rstrip() + "\n\n" + FOOT
    (HERE / frag.name).write_text(page)
    print("built", frag.name)
