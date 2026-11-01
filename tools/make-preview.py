"""Package dist/ as a single-page preview (inline CSS/JS, Google Fonts) in preview/."""
import re, shutil, pathlib
dist, out = pathlib.Path('dist'), pathlib.Path('preview')
html = (dist / 'index.html').read_text()
title = re.search(r'<title>(.*?)</title>', html, re.S).group(1)
css = ''.join((dist / h).read_text() for h in re.findall(r'<link rel="stylesheet" href="\.?/?([^"]+\.css)"', html))
css = re.sub(r'@font-face\s*\{[^}]*\}', '', css)
js = ''.join((dist / s).read_text() for s in re.findall(r'<script type="module" src="\.?/?([^"]+\.js)"', html))
js = js.replace('</script', '<\\/script')
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
body = re.sub(r'<script type="module" src="[^"]+"></script>', '', body)
page = f'''<title>{title}</title>
<meta name="description" content="A wordless museum: a camera searches through each painting.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap">
<style>{css}</style>
{body}
<script type="module">{js}</script>
'''
if out.exists(): shutil.rmtree(out)
shutil.copytree(dist / 'pieces', out / 'pieces')
(out / 'index.html').write_text(page)
print(title, len(page) // 1024, 'KB')
