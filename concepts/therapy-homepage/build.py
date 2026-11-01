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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
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
        <h4>Therapy</h4>
        <ul><li><a href="individual-therapy.html">Individual</a></li><li><a href="couples-therapy.html">Couples</a></li><li><a href="eft.html">EFT</a></li></ul>
      </div>
      <div>
        <h4>Practice</h4>
        <ul><li><a href="about.html">About Helena</a></li><li><a href="resources.html">Resources</a></li><li><a href="contact.html">Contact</a></li></ul>
      </div>
      <div>
        <h4>Visit</h4>
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

<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="site.js"></script>
</body>
</html>
"""

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
    page = HEAD.format(title=html.escape(fields["title"]), desc=html.escape(fields["desc"]), nav=nav)
    page += text[meta.end():].rstrip() + "\n\n" + FOOT
    (HERE / frag.name).write_text(page)
    print("built", frag.name)
