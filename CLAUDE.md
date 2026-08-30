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

## Next steps discussed but not built

1. **Admin dashboard** (`admin.html`) so the owner can add/remove products and
   change prices without touching code. Move products to `assets/data/products.json`
   first. Save by committing to GitHub via the API; auth via Cloudflare Access.
2. **WhatsApp control** — a webhook that lets the owner text changes. Build the
   dashboard's operations first; the bot should call the same ones.

## Testing

There is a jsdom smoke suite of 86 checks covering rendering, filters, sorting,
the enquiry list, reviews, all five languages, the top-bar layout, and the QR
(including a comparison against an independent encoder). It currently lives
outside the repo. If you are asked to change behaviour, ask for it to be moved
in — `npm i jsdom` and run it against `site-single-file.html`.
