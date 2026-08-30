# Working on this project

A static storefront for a brass idol business in Moradabad. Plain HTML, CSS and
JavaScript — **no build step, no framework, no dependencies at runtime**. Keep it
that way unless there is a strong reason not to; the owner edits this from a
phone through the GitHub web editor.

## Layout

```
index.html                 the whole site, one page
assets/css/style.css       all styling
assets/js/data.js          >>> the owner's edit surface: shop details, products, reviews
assets/js/i18n.js          interface text in 5 languages
assets/js/i18n-content.js  product, deity and review translations
assets/js/app.js           behaviour — rendering, filters, enquiry list, QR, language
assets/img/products/       product photos
build.py                   optional: bundles everything into site-single-file.html
```

`site-single-file.html` is generated and gitignored. Recreate with `python3 build.py`.

## The things most likely to bite you

- **`data.js` is hand-edited by a non-programmer.** A missing comma blanks the
  page. Any tooling that rewrites it must be careful; if you build automated
  editing, move products to JSON first rather than rewriting commented JS.
- **The QR code's quiet zone.** `createSvgTag`'s `margin` is in *pixels*, not
  modules. Passing `margin: 1` produced a code no camera would scan. Omit it so
  the library applies its correct default of `cellSize * 4`. There is a test for
  this — do not "simplify" it away.
- **The top bar must never wrap.** Translated promo text varies a lot in length
  (Malayalam runs much longer than Tamil), and a wrapping bar changes height
  whenever the language changes. `.announce .wrap` is `flex-wrap: nowrap`; the
  messages clip, the language switch never moves. Tests assert this.
- **Product photos are licensed stock stand-ins, not the owner's stock.** See
  `PHOTO-CREDITS.md`. Never present them as photographs of what is being sold.
- **Reviews are owner-approved by design.** Visitor reviews stay in that
  visitor's browser until copied into `REVIEWS` in `data.js`. This is deliberate
  spam protection, not an unfinished feature.

## Conventions

- **Translations fall back to English.** A product added without translations
  renders fine, just in English. Never let a missing translation blank the page.
- **Prices stay in Latin digits** (₹4,250) in every language.
- **WhatsApp messages carry the English product name in brackets** when the
  visitor is browsing in another language, so the shop owner can identify the item.
- **The English label in the language switch is pinned to a Latin face**, or the
  control changes width between languages.
- Deity names are the filter keys in English; only the display label translates.

## Decisions already made

- **Host on Cloudflare Pages.** Vercel's Hobby tier forbids commercial use, and
  their definition explicitly includes "advertising the sale of a product" —
  which this site does. Netlify is an acceptable alternative.
- **No database.** Supabase's free tier pauses projects after a week of
  inactivity, which would break a quiet shop's site. Products live in files and
  in git history.
- **No payment gateway.** Every path ends in a WhatsApp conversation. This suits
  a shop starting out — no fees, no KYC.

## Built

- **Admin dashboard** (`admin.html`). A self-contained, dependency-free editor
  the owner opens on the live site. It loads the live `data.js`, edits shop
  details / products / deities / reviews through form fields, validates (unique
  lowercase ids, numeric fields, deity must exist — so it can't emit the
  broken-comma file that blanks the page), and **regenerates a complete, valid
  `data.js`** for the owner to copy-paste into GitHub's web editor and commit.
  This kept the "no backend, no build, no secrets" constraints: it does NOT
  commit for the owner, so the earlier plan's GitHub API + Cloudflare Access auth
  was not needed, and products stayed in `data.js` rather than moving to JSON
  (which would have broken the single-file build and `file://` use). The generator
  round-trips the current data exactly — there is a check for this in the notes;
  if you change `data.js`'s shape, update `admin.html`'s `gen*()` functions to
  match. Repo/branch for the "Open GitHub" link are configurable in-page and
  stored in `localStorage`.

## Next steps discussed but not built

1. **Direct-commit upgrade for `admin.html`** — optionally let the owner paste a
   GitHub token (or use Cloudflare Access) so Save commits for them, instead of
   copy-paste. The copy-paste flow stays the zero-setup default.
2. **WhatsApp control** — a webhook that lets the owner text changes. Build the
   dashboard's operations first; the bot should call the same ones.

## Testing

```
npm install && npm test
```

86 checks in `test/smoke.mjs`, run against the **real source files** — no build
step, so what is tested is what ships. Covers rendering, filters, sorting, the
enquiry list, reviews, all five languages, the top-bar layout, and the QR
(including a module-by-module comparison against a fixture produced by an
unrelated encoder).

`jsdom` and `qrcode-generator` are devDependencies. **The site itself has no
dependencies** — do not add any runtime ones.

Two traps the harness itself hit, worth knowing before editing it:

- `String.replace` with a replacement *string* treats `$$` as an escaped `$`.
  app.js declares `const $$ = ...`, so inlining it that way silently produces a
  duplicate `const $`. `composePage()` always replaces via a function.
- `test/fixtures/qr-reference.json` is tied to the phone number in `data.js`.
  Change the number and the suite says so rather than comparing against a stale
  fixture; regenerate it with segno if that happens.
