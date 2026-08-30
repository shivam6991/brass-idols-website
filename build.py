#!/usr/bin/env python3
"""
Bundles the site into one self-contained HTML file.

    python3 build.py

Writes site-single-file.html — the whole site, CSS and JavaScript included,
in a single file you can drag onto any host or email to someone.

The normal index.html plus the assets/ folder stays the better option for
day-to-day work, because product edits are one small file. Use the bundle
when a host only accepts a single file, or to send a preview to someone.
"""

import base64, io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))

def read(*parts):
    return io.open(os.path.join(HERE, *parts), encoding="utf-8").read()

def inline_images(max_px=800, quality=78):
    """Every picture under assets/img/, shrunk and encoded for the bundle."""
    try:
        from PIL import Image
    except ImportError:
        print("  (Pillow not installed - the bundle will link to images instead of "
              "carrying them. Install with: pip3 install pillow)")
        return {}
    out = {}
    for folder in ("products", "site"):
        d = os.path.join(HERE, "assets", "img", folder)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if not name.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            im = Image.open(os.path.join(d, name)).convert("RGB")
            im.thumbnail((max_px, max_px), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=quality, optimize=True)
            key = "assets/img/%s/%s" % (folder, name)
            out[key] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    return out


def json_str(text):
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


def build(body_only=False):
    html = read("index.html")
    css  = read("assets", "css", "style.css")
    i18n = read("assets", "js", "i18n.js")
    i18nc = read("assets", "js", "i18n-content.js")
    data = read("assets", "js", "data.js")
    app  = read("assets", "js", "app.js")

    # A closing script tag inside a JS string would end the block early.
    guard = lambda js: js.replace("</script>", "<\\/script>")

    html = html.replace(
        '<link rel="stylesheet" href="assets/css/style.css">',
        "<style>\n" + css + "\n</style>"
    )
    pics = inline_images()
    table = "var BUNDLED_IMAGES = {\n" + ",\n".join(
        '  %s: "%s"' % (json_str(k), v) for k, v in sorted(pics.items())) + "\n};\n"

    html = html.replace(
        '<script src="assets/js/i18n.js"></script>\n<script src="assets/js/i18n-content.js"></script>\n'
        '<script src="assets/js/data.js"></script>\n<script src="assets/js/app.js"></script>',
        "<script>\n" + table + guard(i18n) + "\n" + guard(i18nc) + "\n" +
        guard(data) + "\n" + guard(app) + "\n</script>"
    )

    # Pictures written straight into the markup get swapped for their data URI.
    for key, uri in pics.items():
        html = html.replace('src="%s"' % key, 'src="%s"' % uri)

    if pics:
        print("  inlined %d images" % len(pics))

    if not body_only:
        return html

    # Artifact form: the host supplies <!doctype>, <head> and <body>, so hand
    # back just the title, the font link, the styles and the page content.
    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
    fonts = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', html).group(0)
    inner = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    styles = re.search(r"<style>.*?</style>", html, re.S).group(0)
    return "<title>%s</title>\n%s\n%s\n%s" % (title, fonts, styles, inner)

if __name__ == "__main__":
    body_only = "--body-only" in sys.argv
    out = sys.argv[sys.argv.index("-o") + 1] if "-o" in sys.argv else \
          os.path.join(HERE, "site-single-file.html")
    io.open(out, "w", encoding="utf-8").write(build(body_only))
    print("Wrote %s (%.0f KB)" % (out, os.path.getsize(out) / 1024.0))
