# Brass idol catalogue — first draft

A complete, working website for selling handcast brass idols. No database, no
build step, no monthly software cost. It is four files plus your photos, and it
runs on free hosting.

The look borrows Indian Art Villa's warm cream-and-brass treatment (sand-coloured
ground, gold rules, a dark trust strip, struck-through pricing) and BudhShiv's
structure (browse by deity, specs on every card, a wall of customer reviews).
The weight-and-height "foundry stamp" on each card is the part neither of them
does, and it is the thing that earns trust when someone is buying metal by post.

---

## 1. Open it

Double-click `index.html`. That is it — it works straight from your hard drive.

## 2. Change your name and phone number

Open `assets/js/data.js` in any text editor. The first block is yours:

```js
const SHOP = {
  name:     "Kaanchan Brass",      <- your business name
  whatsapp: "919876543210",        <- your number: 91 + 10 digits, nothing else
  email:    "orders@kaanchanbrass.in",
  ...
};
```

`whatsapp` is the one to get right. Digits only, no `+`, no spaces, country code
first. Every Enquire button, the floating green button and the contact form all
build their link from that one value.

`Kaanchan` (कांचन, "gold") is a placeholder name — change it to yours everywhere
it appears in that block.

## 3. Add your products

Still in `assets/js/data.js`, scroll to `PRODUCTS`. Copy any block between `{ }`
and edit it. The sixteen pieces in there now are realistic examples — replace
them with yours.

```js
{
  id: "ganesha-sitting-6",          // short, lowercase, no spaces — used in the share link
  name: "Sitting Ganesha with Mushak",
  deity: "Ganesha",                 // must match a name in the DEITIES list lower down
  heightIn: 6, widthIn: 4.5, weightKg: 1.8,
  price: 4250, mrp: 5600,           // mrp: null if you do not want a crossed-out price
  finish: "Antique green patina",
  images: ["ganesha-sitting-6-a.jpg"],
  badge: "Bestseller",              // "New", "Bestseller", "Made to order", or ""
  stock: true,
  blurb: "One or two sentences...",
  details: ["Solid cast, not hollow", "Flat base"]
}
```

Keep the comma between blocks. If the page goes blank after an edit, you have
almost certainly dropped a comma or a quote mark.

## 4. Add your photos

**Seven products already show a photo, as stand-ins from Pexels.** They are
licensed for commercial use, so you can launch with them — but they are not
your stock, and a customer who receives a different idol than the one pictured
will ask for their money back. Replace them before you sell.
See `PHOTO-CREDITS.md` for the full list and for how to shoot your own.

The other nine products show a drawn brass placeholder with the deity's name in
Devanagari, which looks intentional rather than broken.

Put new photos in `assets/img/products/` and list the file names in `images`.

- **Square photos.** 1000 × 1000 px is plenty. The cards crop to a square anyway.
- **Keep each file under 300 KB** or the page will feel slow on mobile data.
  Squoosh (squoosh.app) does this free in the browser.
- Two or three angles per idol is ideal — the second and third appear as
  thumbnails in the product window.

Until a photo exists, a drawn placeholder with the deity's name in Devanagari
stands in, so nothing ever looks broken while you are still shooting.

Two site-wide images also need replacing, both currently stock:
- `assets/img/site/hero.jpg` — the big photo beside the headline (900 × 1125 px)
- `assets/img/site/workshop.jpg` — the "Our workshop" section. This is currently
  a coppersmith's bench, not your workshop. Swap it before you claim it is yours.
- `assets/img/site/share-cover.jpg` — 1200 × 630 px, the picture that shows when
  someone pastes your link into WhatsApp or Instagram

## 5. Publishing a review

Reviews a customer types on the site are saved **in that customer's own browser**
and shown only to them, marked "Saved on your device". A static site has nowhere
else to put them. After they submit, the site offers them a WhatsApp button that
sends the review to you.

To put a review on the public wall, add it to `REVIEWS` at the bottom of
`data.js` and re-upload the file:

```js
{
  name: "Anjali Deshpande", city: "Pune", rating: 5, date: "2026-08-14",
  product: "lakshmi-ganesh-pair-5",   // a product id, or "" for a general review
  text: "The weight listed on the site was exact..."
}
```

This is deliberate — it means nobody can post abuse or a competitor's link onto
your site. The star average at the top counts published reviews only.

If reviews start arriving faster than you want to paste them in, the smallest
upgrade is a free **Formspree** or **Tally** form that emails you each one; you
still paste it in, but you stop losing any. Only move to a real backend
(Supabase, Firebase) if you get past roughly ten reviews a week.

---

## Editing from your phone

The repository is set up so the whole loop — edit, commit, live site — can
happen from a phone, without a laptop.

**Connect the repo to your host once.** Cloudflare Pages and Netlify both offer
"deploy from GitHub": point them at this repo and every push republishes the site
automatically. After that you never touch the host again.

**Then edit from the phone, easiest first:**

1. **GitHub's web editor** — open the repo in your mobile browser and change
   `github.com` to `github.dev` in the address bar. A full editor opens, no app
   and no clone needed. Edit `assets/js/data.js`, press the source-control icon,
   type a message, commit. Your host rebuilds within a minute.
2. **The GitHub mobile app** — fine for a quick price change; tap a file, then
   the pencil.
3. **A real clone** — Working Copy on iOS, or Termux with `git` on Android, if
   you want the files locally.

**What you will usually be editing** is one file, `assets/js/data.js`: prices,
weights, a new product block, or a review to publish. Photos can be uploaded
straight into `assets/img/products/` through the GitHub web interface.

One caution: if you break a comma or a quote mark in `data.js`, the page goes
blank. GitHub keeps every version, so revert the commit and you are back.

---

## The WhatsApp QR code

A QR sits at the right of the sticky header, so it stays on screen the whole way
down the page. Hovering or clicking it opens a larger one with your number
underneath.

**It is drawn from `SHOP.whatsapp` every time the page loads**, not saved as a
picture. Change the number in `data.js` and the QR changes with it — the two can
never drift apart, and there is no image to re-export.

It encodes `https://wa.me/<your number>` and nothing else. A short URL means a
small, low-density code with large squares, which is what lets it scan at all at
this size. Adding a pre-filled greeting would lengthen the URL, pack the code
tighter and make it harder to scan, so it is deliberately left plain.

**Why the size is what it is.** The code renders about 2.2 cm across in the
header, which a phone reads from roughly arm's length. Clicking opens a 5 cm
version for anyone standing further back. Every QR also needs a white border of
four modules around it — the "quiet zone" — or most camera apps will not lock on;
that border is a quarter of the total footprint, which is why the card is bigger
than the code inside it looks.

**It only appears on screens 1180px and wider.** Below that the header has no
room for the card without pushing the navigation out, and on a phone a QR is
useless anyway — a device cannot photograph its own screen. The green WhatsApp
button is the path on those sizes.

The encoder is one pinned script from cdnjs. If it is ever unreachable the QR
simply does not appear — nothing else on the page is affected. If you would
rather have a QR to print for the shop counter or a flyer, say so and I will add
a downloadable one.

---

## Languages

The site reads in **English, Malayalam, Tamil, Telugu and Kannada**. Visitors
pick from the control in the top bar; the choice is remembered on their device.

Everything switches — navigation, headings, buttons, form labels, product names
and descriptions, spec labels, deity names, the sample reviews, error messages,
and the WhatsApp message templates. Prices stay in Latin digits (₹4,250) because
that is how they are read across all five.

**A shared link keeps its language.** Switching adds `?lang=ta` to the address,
so a Tamil customer who forwards the page hands the next person a Tamil page.
Combine it with a product link: `yourshop.in/?lang=ml#p=shiva-nataraja-15`.

**WhatsApp messages carry both.** When a customer writes in Malayalam, the
message you receive names the product in Malayalam *and* in English in brackets,
so you can always tell which piece it is.

### Where the words live

| File | Holds |
|---|---|
| `assets/js/i18n.js` | Every interface word — buttons, labels, headings, notices |
| `assets/js/i18n-content.js` | Product names and descriptions, deity names, review text |

Both are plain lists. To fix a wording, find the line and edit it:

```js
"card.enquire": {
  en: "Enquire", ml: "അന്വേഷിക്കൂ", ta: "விசாரிக்க",
  te: "విచారించండి", kn: "ವಿಚಾರಿಸಿ"
},
```

**Anything missing falls back to English.** A product you add to `data.js`
without a translation still appears correctly, just in English — nothing breaks
and no blank spaces appear. Add translations later, at your own pace, by copying
a block in `i18n-content.js` and keying it to the product's `id`.

### Please get these proofread

The translations were written to be natural rather than literal, but they have
**not been checked by a native speaker**, and this is a shop where a wrong word
about weight, price or returns costs you a sale or an argument. Before you
advertise in a language, have someone who speaks it read the catalogue page
once. Craft vocabulary is where machine translation is weakest — terms like
lost-wax casting, patina and prabhavali.

On the sample reviews: a real customer's words are their testimony, and the
honest thing is to leave a review in the language it was written in. The
translations in `i18n-content.js` are for the sample reviews only.

---

## Where to host it

You need two things: hosting for the files, and a domain name. Hosting can be
free. A domain is the only bill you cannot avoid.

### Recommended: Cloudflare Pages — free

Best speed inside India of the free options, and the free tier has no bandwidth
cap, which matters if an Instagram reel does well.

1. Sign up at `pages.cloudflare.com`
2. Create a project → "Upload assets" → drag this whole folder in
3. You get `yourname.pages.dev` immediately, with HTTPS
4. Custom domain: one field in the dashboard, no extra charge

To update: drag the folder in again.

### Also good: Netlify — free

`app.netlify.com/drop` — literally drag the folder onto the page, no account
needed to try it. Free tier includes 100 GB/month, HTTPS and a custom domain.
Slightly simpler than Cloudflare, slightly slower in India.

### Also free

| Host | Good for | Watch out for |
|---|---|---|
| **Vercel** | Same drag-and-drop simplicity | Free tier is for non-commercial use — read their terms before selling from it |
| **GitHub Pages** | Free forever, version history | You need a GitHub account and to learn `git` basics |
| **Firebase Hosting** | Google's CDN, generous free tier | More setup than the others |

### If you want email on your domain too

**Hostinger** shared hosting runs about ₹69–₹149/month on a long plan, includes a
free domain for the first year and gives you `orders@yourshop.in` mailboxes.
Slower than a CDN, but it is one bill for everything. **Cloudflare Email Routing**
is a free alternative that forwards `orders@yourshop.in` to your Gmail — pair it
with Cloudflare Pages and you keep the whole thing free except the domain.

### The domain

- `.in` — roughly ₹700–900 per year
- `.com` — roughly ₹1,100–1,400 per year
- **Cloudflare Registrar** sells at cost with no renewal markup, which is the
  cheapest over several years. Namecheap and GoDaddy are fine too, but check the
  *renewal* price, not the first-year offer.

**Realistic total: about ₹900 a year**, all of it the domain.

---

## Selling on Instagram and WhatsApp

The site is built for this, not for search engines.

**Every product has its own link.** Open any idol and press the copy button —
you get something like `yourshop.in/#p=shiva-nataraja-15`. That link opens the
site with that exact idol showing. Put it in a story sticker, a bio link, or
paste it into a customer chat.

**The enquiry list is your order form.** A customer taps `+` on several pieces,
then "Send on WhatsApp", and you receive a tidy message listing each item with
its weight, price and link, plus the total. No cart, no payment gateway, no
transaction fee — the conversation just starts with you already knowing what
they want.

**The contact form opens WhatsApp** with their message pre-typed. Nothing is
emailed anywhere, so there is no inbox to check and nothing to go missing.

**Before your first campaign**, set `siteUrl` in `data.js` and the two
`og:` URLs in `index.html` to your real address, and add `share-cover.jpg`.
Those three edits are what make a proper picture-and-title card appear when the
link is pasted into WhatsApp, instead of a bare URL.

---

## Files

```
index.html                  the page
assets/css/style.css        all styling
assets/js/data.js           >>> your shop details, products and reviews <<<
assets/js/i18n.js           interface words in the five languages
assets/js/i18n-content.js   product, deity and review translations
assets/js/app.js            behaviour — you should not need to open this
assets/img/products/        your product photos
assets/img/site/            workshop photo, share cover
build.py                    optional: bundles everything into one file
site-single-file.html       that bundle, rebuild with: python3 build.py
PHOTO-CREDITS.md            where the current photos came from, and how to
                            shoot replacements
```

The bundle carries the photos inside it as encoded data, so `site-single-file.html`
works on its own with no assets folder. It is about 1.8 MB — fine to email or drop
on a host, but the normal `index.html` plus `assets/` loads faster for visitors.

## What this draft does not do

Worth knowing before you promise anything to a customer:

- **No online payment.** Every path ends in a WhatsApp conversation. For a shop
  starting out this is usually right — no gateway fees, no KYC, and you can
  negotiate. Razorpay payment links are the easy next step when you want them.
- **No stock counting.** `stock: true/false` is a label you set by hand.
- **Reviews need your approval**, as described above.
- **Prices are visible to everyone**, including competitors. That is the trade
  for the trust you get by publishing weights and prices honestly.
