/* ==========================================================================
   Kaanchan Brass — site behaviour
   No frameworks, no build step. Everything runs from the three files in
   assets/. Product data lives in data.js; you should not need to touch this.
   ========================================================================== */

/* ---------- small helpers ------------------------------------------------- */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const rupees = n => "₹" + new Intl.NumberFormat("en-IN").format(n);

const escapeHtml = str => String(str).replace(/[&<>"']/g, c => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

const deityHindi = name => (DEITIES.find(d => d.name === name) || {}).hi || "ॐ";

/* ==========================================================================
   Language
   English is the source. Anything a language is missing falls back to English,
   so a product added without a translation still reads correctly.
   ========================================================================== */

const LANG_KEY = "kb_lang";
let LANG = "en";

function t(key) {
  const entry = UI[key];
  if (!entry) return key;
  return entry[LANG] || entry.en || key;
}

/* Product text: translated name / blurb / finish / details, else the English. */
function px(product, field) {
  if (LANG !== "en") {
    const tr = PRODUCT_TEXT[product.id];
    if (tr && tr[LANG] && tr[LANG][field] != null) return tr[LANG][field];
  }
  return product[field];
}

function deityLabel(name) {
  if (LANG !== "en") {
    const tr = DEITY_TEXT[name];
    if (tr && tr[LANG]) return tr[LANG];
  }
  return name;
}

function reviewBody(review) {
  if (LANG !== "en" && review.id) {
    const tr = REVIEW_TEXT[review.id];
    if (tr && tr[LANG]) return tr[LANG];
  }
  return review.text;
}

/* In a WhatsApp message the shop owner has to be able to read the item, so a
   translated name carries the English name alongside it. */
function waName(product) {
  const local = px(product, "name");
  return (LANG === "en" || local === product.name) ? product.name : local + " (" + product.name + ")";
}

/* Indic scripts need their own faces; they are fetched only when chosen. */
function ensureFont(code) {
  const lang = LANGUAGES.find(l => l.code === code);
  if (!lang || !lang.font) return;
  const id = "font-" + lang.font;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+" + lang.font +
              ":wght@300;400;500&family=Noto+Serif+" + lang.font + ":wght@400;600&display=swap";
  document.head.appendChild(link);
}

/* Swap every piece of fixed text in the markup. */
function applyStaticText() {
  $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  $$("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
}

/* ==========================================================================
   WhatsApp QR

   Drawn from SHOP.whatsapp at run time rather than baked in, so changing the
   number in data.js changes the code with it and the two can never disagree.
   ========================================================================== */

function renderQR() {
  const dock = $("#qrDock");
  if (!dock) return;
  if (typeof qrcode === "undefined") return;   // encoder unreachable: stay hidden

  const digits = String(SHOP.whatsapp || "").replace(/\D/g, "");
  if (!digits) return;

  let svg;
  try {
    const qr = qrcode(0, "M");          // 0 = smallest version that fits
    qr.addData("https://wa.me/" + digits);
    qr.make();
    // margin is in PIXELS here, not modules. The spec wants a quiet zone of
    // four modules all round; without it most camera apps will not lock on.
    // Omitting it lets the library apply its correct default of cellSize * 4.
    svg = qr.createSvgTag({ cellSize: 8, scalable: true });
  } catch (e) {
    return;                             // never show a half-drawn code
  }

  $("#qrMini").innerHTML = svg;
  $("#qrBig").innerHTML = svg;
  dock.hidden = false;
}

function wireQR() {
  const dock = $("#qrDock"), chip = $("#qrChip");
  if (!dock || !chip) return;

  chip.addEventListener("click", () => {
    const open = dock.classList.toggle("open");
    chip.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", e => {
    if (!dock.contains(e.target)) {
      dock.classList.remove("open");
      chip.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && dock.classList.contains("open")) {
      dock.classList.remove("open");
      chip.setAttribute("aria-expanded", "false");
      chip.focus();
    }
  });
}

/* ==========================================================================
   Language slider

   A segmented control rather than a dropdown: every language is visible at
   once, each written in its own script, and the brass thumb slides to the
   chosen one. Built as a radiogroup so arrow keys work.
   ========================================================================== */

function buildLangSlider() {
  const box = $("#langSlider");
  if (!box) return;

  box.innerHTML = '<span class="lang-thumb" aria-hidden="true"></span>' +
    LANGUAGES.map(l =>
      '<button type="button" role="radio" data-lang="' + l.code + '"' +
      ' aria-checked="' + (l.code === LANG) + '"' +
      ' tabindex="' + (l.code === LANG ? "0" : "-1") + '"' +
      ' title="' + escapeHtml(l.label) + '">' + escapeHtml(l.native) + '</button>'
    ).join("");

  box.addEventListener("click", e => {
    const btn = e.target.closest("button[data-lang]");
    if (btn) setLanguage(btn.dataset.lang);
  });

  /* Left and right walk the group, the way a radio group is expected to. */
  box.addEventListener("keydown", e => {
    const keys = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const at = LANGUAGES.findIndex(l => l.code === LANG);
    const next = LANGUAGES[(at + keys[e.key] + LANGUAGES.length) % LANGUAGES.length];
    setLanguage(next.code);
    const btn = box.querySelector('button[data-lang="' + next.code + '"]');
    if (btn) btn.focus();
  });

  syncLangSlider();

  /* Label widths shift when each Noto face arrives, and again on resize. */
  window.addEventListener("resize", moveLangThumb);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(moveLangThumb).catch(() => {});
  }
}

function moveLangThumb(attempt) {
  const box = $("#langSlider");
  if (!box) return;
  const thumb = $(".lang-thumb", box);
  const active = box.querySelector('button[aria-checked="true"]');
  if (!thumb || !active) return;

  const w = active.offsetWidth;
  if (!w) {
    /* Nothing has been laid out yet — the bar can still be hidden on first
       paint, or a webfont may not have settled. Try again shortly rather than
       painting a zero-width thumb. */
    if ((attempt || 0) < 10) requestAnimationFrame(() => moveLangThumb((attempt || 0) + 1));
    return;
  }
  thumb.style.width = w + "px";
  thumb.style.transform = "translateX(" + active.offsetLeft + "px)";
  box.classList.add("ready");
}

function syncLangSlider() {
  const box = $("#langSlider");
  if (!box) return;
  $$("button[data-lang]", box).forEach(b => {
    const on = b.dataset.lang === LANG;
    b.setAttribute("aria-checked", on ? "true" : "false");
    b.tabIndex = on ? 0 : -1;
  });
  moveLangThumb();
  /* On a narrow screen the control scrolls; keep the choice in view. */
  const active = box.querySelector('button[aria-checked="true"]');
  if (active && box.scrollWidth > box.clientWidth && box.scrollTo) {
    const target = active.offsetLeft - (box.clientWidth - active.offsetWidth) / 2;
    try { box.scrollTo({ left: Math.max(0, target), behavior: "smooth" }); }
    catch (e) { box.scrollLeft = Math.max(0, target); }
  }
}

function setLanguage(code, redraw = true) {
  if (!LANGUAGES.some(l => l.code === code)) code = "en";
  LANG = code;
  ensureFont(code);
  document.documentElement.setAttribute("lang", code);
  try { localStorage.setItem(LANG_KEY, code); } catch (e) { /* private browsing */ }

  const url = new URL(location.href);
  if (code === "en") url.searchParams.delete("lang");
  else url.searchParams.set("lang", code);
  history.replaceState(null, "", url.toString());

  syncLangSlider();

  if (!redraw) return;
  applyStaticText();
  moveLangThumb();
  renderShopDetails();
  renderCatalog();
  renderReviews();
  renderEnquiry();
  if (modalProduct) openProduct(modalProduct.id, false);
}

const productById = id => PRODUCTS.find(p => p.id === id);

/* The public address for a product, used by every share button. Uses the real
   address when the site is served over http(s), and falls back to the address
   configured in data.js when opened straight from the file system. */
function productUrl(id) {
  if (location.protocol === "http:" || location.protocol === "https:") {
    return location.origin + location.pathname + "#p=" + id;
  }
  return SHOP.siteUrl.replace(/\/$/, "") + "/#p=" + id;
}
function siteUrl() {
  if (location.protocol === "http:" || location.protocol === "https:") {
    return location.origin + location.pathname;
  }
  return SHOP.siteUrl;
}

function waLink(message) {
  return "https://wa.me/" + SHOP.whatsapp + "?text=" + encodeURIComponent(message);
}

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ---------- image handling ------------------------------------------------
   Photos live in assets/img/products/. Until a photo is dropped in, a drawn
   placeholder stands in, so the catalog never shows a broken image.          */

function placeholderSrc(hi) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<defs>' +
        '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#F7ECD6"/><stop offset="1" stop-color="#E2D0AF"/>' +
        '</linearGradient>' +
        '<radialGradient id="r" cx="50%" cy="36%" r="48%">' +
          '<stop offset="0" stop-color="#D8AB53" stop-opacity=".8"/>' +
          '<stop offset="1" stop-color="#D8AB53" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<rect width="400" height="400" fill="url(#g)"/>' +
      '<rect width="400" height="400" fill="url(#r)"/>' +
      '<path d="M126 312V186a74 74 0 0 1 148 0v126" fill="none" stroke="#A9762A" stroke-width="1.6" opacity=".5"/>' +
      '<path d="M112 312h176" stroke="#A9762A" stroke-width="1.6" opacity=".5"/>' +
      '<text x="200" y="232" text-anchor="middle" font-family="Tiro Devanagari Hindi, Noto Sans Devanagari, serif" font-size="62" fill="#A9762A" opacity=".85">' + hi + '</text>' +
      '<text x="200" y="352" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="2.4" fill="#8C7A64">PHOTO COMING SOON</text>' +
    '</svg>';
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function assetUrl(path) {
  if (typeof BUNDLED_IMAGES !== "undefined" && BUNDLED_IMAGES[path]) return BUNDLED_IMAGES[path];
  return path;
}

function imgTag(product, index, cls) {
  const file = product.images && product.images[index];
  const ph   = placeholderSrc(deityHindi(product.deity));
  const src  = file ? assetUrl("assets/img/products/" + file) : ph;
  return '<img class="' + (cls || "") + '" src="' + src + '" alt="' +
         escapeHtml(product.name) + '" loading="lazy" data-ph="' + ph + '">';
}

/* Attach a fallback to any image that fails to load, without inline handlers. */
function hydrateImages(root) {
  $$("img[data-ph]", root).forEach(img => {
    if (img.dataset.bound) return;
    img.dataset.bound = "1";
    img.addEventListener("error", () => { img.src = img.dataset.ph; }, { once: true });
  });
}

/* ---------- stars --------------------------------------------------------- */

const STAR_PATH = "M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95z";

function starsHtml(rating) {
  let out = '<span class="stars" aria-label="' + rating + ' out of 5">';
  for (let i = 1; i <= 5; i++) {
    out += '<svg viewBox="0 0 24 24" fill="currentColor" class="' + (i <= rating ? "" : "off-star") +
           '" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg>';
  }
  return out + "</span>";
}

/* ==========================================================================
   Reviews — published ones come from data.js, ones typed on the site are
   kept in the visitor's own browser until you publish them. See README.
   ========================================================================== */

const LOCAL_REVIEWS_KEY = "kb_local_reviews";

function localReviews() {
  try { return JSON.parse(localStorage.getItem(LOCAL_REVIEWS_KEY) || "[]"); }
  catch (e) { return []; }
}
function saveLocalReview(review) {
  try {
    const all = localReviews();
    all.unshift(review);
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(all.slice(0, 25)));
  } catch (e) { /* private browsing — the review still shows for this visit */ }
}

/* The headline rating counts published reviews only, so it cannot be moved by
   anything typed into the form on one person's machine. */
function ratingStats() {
  const counts = [0, 0, 0, 0, 0];
  REVIEWS.forEach(r => { counts[r.rating - 1]++; });
  const total = REVIEWS.length;
  const sum = REVIEWS.reduce((a, r) => a + r.rating, 0);
  return { total, average: total ? sum / total : 0, counts };
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function reviewCard(r, isLocal) {
  const product = r.product ? productById(r.product) : null;
  return '<article class="review' + (isLocal ? " mine" : "") + '">' +
    '<div class="review-top">' +
      '<div class="review-who"><b>' + escapeHtml(r.name) + '</b>' +
      '<small>' + escapeHtml(r.city || "") + (r.city && r.date ? " · " : "") + (r.date ? formatDate(r.date) : "") + '</small></div>' +
      starsHtml(r.rating) +
    '</div>' +
    (isLocal ? '<span class="pending-tag">' + escapeHtml(t("rev.savedLocal")) + '</span>' : "") +
    '<p>' + escapeHtml(isLocal ? r.text : reviewBody(r)) + '</p>' +
    (product ? '<button class="review-on" data-open="' + product.id + '">' +
      escapeHtml(t("rev.on") + " " + px(product, "name")) + '</button>' : "") +
  '</article>';
}

function renderReviews() {
  const stats = ratingStats();

  $("#ratingBig").textContent = stats.average.toFixed(1);
  $("#ratingStars").innerHTML = starsHtml(Math.round(stats.average));
  $("#ratingCount").textContent = stats.total + " " + t("rev.published");

  $("#ratingBars").innerHTML = [5, 4, 3, 2, 1].map(star => {
    const n = stats.counts[star - 1];
    const pct = stats.total ? (n / stats.total) * 100 : 0;
    return '<div class="bar-row"><span>' + star + ' ★</span>' +
           '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
           '<span>' + n + '</span></div>';
  }).join("");

  const mine = localReviews();
  const wall = $("#reviewWall");
  wall.innerHTML = mine.map(r => reviewCard(r, true)).join("") +
                   REVIEWS.map(r => reviewCard(r, false)).join("");
}

/* ==========================================================================
   Enquiry list — the WhatsApp-first stand-in for a shopping cart
   ========================================================================== */

const ENQ_KEY = "kb_enquiry";
let enquiry = [];

function loadEnquiry() {
  try { enquiry = JSON.parse(localStorage.getItem(ENQ_KEY) || "[]").filter(productById); }
  catch (e) { enquiry = []; }
}
function persistEnquiry() {
  try { localStorage.setItem(ENQ_KEY, JSON.stringify(enquiry)); } catch (e) { /* ignore */ }
}

function toggleEnquiry(id) {
  const at = enquiry.indexOf(id);
  if (at > -1) {
    enquiry.splice(at, 1);
    toast(t("toast.removed"));
  } else {
    enquiry.push(id);
    toast(px(productById(id), "name") + " " + t("toast.added"));
  }
  persistEnquiry();
  renderEnquiry();
  renderCatalog();
}

function renderEnquiry() {
  const bar   = $("#enqBar");
  const count = $("#enqCount");

  count.textContent = enquiry.length;
  count.classList.toggle("on", enquiry.length > 0);
  bar.classList.toggle("open", enquiry.length > 0);
  $("#fab").classList.toggle("lifted", enquiry.length > 0);

  const items  = enquiry.map(productById);
  const total  = items.reduce((a, p) => a + p.price, 0);
  const weight = items.reduce((a, p) => a + p.weightKg, 0);

  $("#enqSummary").innerHTML =
    "<b>" + enquiry.length + " " + escapeHtml(t(enquiry.length === 1 ? "enq.idol" : "enq.idols")) +
    " · " + rupees(total) + "</b>" +
    "<span>" + weight.toFixed(1) + " " + escapeHtml(t("enq.totalNote")) + "</span>";

  $("#enqItems").innerHTML = items.map(p =>
    '<div class="enq-line">' + imgTag(p, 0, "") +
      '<div class="en"><b>' + escapeHtml(px(p, "name")) + '</b>' +
      '<span>' + p.heightIn + ' in · ' + p.weightKg + ' kg</span></div>' +
      '<span class="ep">' + rupees(p.price) + '</span>' +
      '<button aria-label="' + escapeHtml(t("enq.clear") + " " + px(p, "name")) + '" data-remove="' + p.id + '">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
      '</button>' +
    '</div>').join("");

  hydrateImages($("#enqItems"));
}

function enquiryMessage() {
  const items = enquiry.map(productById);
  const total = items.reduce((a, p) => a + p.price, 0);
  let msg = t("wa.greeting") + " " + SHOP.name + ", " + t("wa.enquireList") + "\n\n";
  items.forEach((p, i) => {
    msg += (i + 1) + ". " + waName(p) + "\n";
    msg += "   " + p.heightIn + " in · " + p.weightKg + " kg · " + rupees(p.price) + "\n";
    msg += "   " + productUrl(p.id) + "\n\n";
  });
  msg += t("wa.total") + ": " + rupees(total) + "\n\n" + t("wa.availability");
  return msg;
}

/* ==========================================================================
   Catalog — filtering, sorting, rendering
   ========================================================================== */

const filters = { deity: "All", query: "", price: "all", weight: "all", sort: "featured" };

const PRICE_BANDS = {
  "u5000":       p => p.price < 5000,
  "5000-15000":  p => p.price >= 5000 && p.price < 15000,
  "15000-30000": p => p.price >= 15000 && p.price < 30000,
  "o30000":      p => p.price >= 30000
};
const WEIGHT_BANDS = {
  "u2":    p => p.weightKg < 2,
  "2-5":   p => p.weightKg >= 2 && p.weightKg < 5,
  "5-10":  p => p.weightKg >= 5 && p.weightKg < 10,
  "o10":   p => p.weightKg >= 10
};

function visibleProducts() {
  const q = filters.query.trim().toLowerCase();
  let list = PRODUCTS.filter(p => {
    if (filters.deity !== "All" && p.deity !== filters.deity) return false;
    if (filters.price !== "all" && !PRICE_BANDS[filters.price](p)) return false;
    if (filters.weight !== "all" && !WEIGHT_BANDS[filters.weight](p)) return false;
    if (q) {
      const hay = (p.name + " " + p.deity + " " + p.finish + " " + p.blurb).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorters = {
    "price-asc":  (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "weight-asc": (a, b) => a.weightKg - b.weightKg,
    "weight-desc":(a, b) => b.weightKg - a.weightKg,
    "height-desc":(a, b) => b.heightIn - a.heightIn
  };
  if (sorters[filters.sort]) list = list.slice().sort(sorters[filters.sort]);
  return list;
}

const BADGE_KEY = { "New": "badge.new", "Bestseller": "badge.best", "Made to order": "badge.made" };
const badgeLabel = b => (BADGE_KEY[b] ? t(BADGE_KEY[b]) : b);

function productEnquiryMessage(p) {
  return t("wa.greeting") + " " + SHOP.name + ", " + t("wa.interested") + ": " + waName(p) +
         " (" + p.heightIn + " in, " + p.weightKg + " kg, " + rupees(p.price) + ").\n" + productUrl(p.id);
}

function productCard(p) {
  const inList  = enquiry.includes(p.id);
  const discount = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const name = px(p, "name");

  return '<article class="card">' +
    '<button class="card-media" data-open="' + p.id + '" aria-label="' + escapeHtml(name) + '">' +
      imgTag(p, 0) +
      (p.badge ? '<span class="badge' + (p.badge === "Made to order" ? " made" : "") + '">' + escapeHtml(badgeLabel(p.badge)) + '</span>' : "") +
      (discount > 0 ? '<span class="badge sale">' + discount + '% ' + escapeHtml(t("card.off")) + '</span>' : "") +
    '</button>' +
    '<div class="card-body">' +
      '<span class="card-deity">' + escapeHtml(deityLabel(p.deity)) + '</span>' +
      '<button class="card-name" data-open="' + p.id + '">' + escapeHtml(name) + '</button>' +
      '<div class="spec-stamp">' +
        '<span><b>' + p.heightIn + '</b> ' + escapeHtml(t("card.tall")) + '</span>' +
        '<span><b>' + p.weightKg + '</b> ' + escapeHtml(t("card.kg")) + '</span>' +
      '</div>' +
      '<div class="price-row">' +
        '<span class="price">' + rupees(p.price) + '</span>' +
        (p.mrp ? '<span class="mrp">' + rupees(p.mrp) + '</span>' : "") +
      '</div>' +
    '</div>' +
    '<div class="card-foot">' +
      '<a class="btn btn-wa btn-sm" href="' + waLink(productEnquiryMessage(p)) +
        '" target="_blank" rel="noopener">' + escapeHtml(t("card.enquire")) + '</a>' +
      '<button class="icon-btn' + (inList ? " added" : "") + '" data-enq="' + p.id + '" ' +
        'aria-label="' + escapeHtml(inList ? t("card.inEnquiry") : t("card.addEnquiry")) + '" title="' +
        escapeHtml(inList ? t("card.inEnquiry") : t("card.addEnquiry")) + '">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">' +
          (inList ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M12 5v14M5 12h14"/>') +
        '</svg>' +
      '</button>' +
    '</div>' +
  '</article>';
}

function renderCatalog() {
  const list = visibleProducts();
  const grid = $("#grid");

  grid.innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty"><h3>' + escapeHtml(t("cat.emptyTitle")) + '</h3>' +
      '<p>' + escapeHtml(t("cat.emptyBody")) + '</p></div>';

  hydrateImages(grid);

  const active = filters.deity !== "All" || filters.query || filters.price !== "all" || filters.weight !== "all";
  $("#resultCount").textContent = list.length + " " + t(list.length === 1 ? "cat.piece" : "cat.pieces") +
    (filters.deity !== "All" ? " · " + deityLabel(filters.deity) : "");
  $("#clearFilters").hidden = !active;

  $$(".niche").forEach(n => n.classList.toggle("active", n.dataset.deity === filters.deity));
}

/* ==========================================================================
   Product modal
   ========================================================================== */

let modalProduct = null;

function openProduct(id, updateHash = true) {
  const p = productById(id);
  if (!p) return;
  modalProduct = p;

  const discount = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const inList   = enquiry.includes(p.id);
  const shots    = (p.images && p.images.length) ? p.images : [null];
  const mine     = localReviews().filter(r => r.product === p.id);
  const theirs   = REVIEWS.filter(r => r.product === p.id);

  $("#modalMedia").innerHTML =
    '<div class="main">' + imgTag(p, 0) + '</div>' +
    (shots.length > 1
      ? '<div class="thumbs">' + shots.map((_, i) =>
          '<button class="' + (i === 0 ? "on" : "") + '" data-shot="' + i + '" aria-label="Photo ' + (i + 1) + '">' +
          imgTag(p, i) + '</button>').join("") + '</div>'
      : "");

  $("#modalInfo").innerHTML =
    '<span class="card-deity">' + escapeHtml(deityLabel(p.deity)) + ' · ' + escapeHtml(px(p, "finish")) + '</span>' +
    '<h2 id="modalTitle">' + escapeHtml(px(p, "name")) + '</h2>' +
    '<p class="blurb">' + escapeHtml(px(p, "blurb")) + '</p>' +
    '<div class="modal-price">' +
      '<span class="price">' + rupees(p.price) + '</span>' +
      (p.mrp ? '<span class="mrp">' + rupees(p.mrp) + '</span>' : "") +
      (discount > 0 ? '<span class="off">' + escapeHtml(t("modal.save")) + ' ' + discount + '%</span>' : "") +
    '</div>' +
    '<table class="spec-table"><tbody>' +
      '<tr><th scope="row">' + escapeHtml(t("modal.weight")) + '</th><td>' + p.weightKg + ' ' + escapeHtml(t("card.kg")) + '</td></tr>' +
      '<tr><th scope="row">' + escapeHtml(t("modal.height")) + '</th><td>' + p.heightIn + ' ' + escapeHtml(t("modal.inches")) + '</td></tr>' +
      '<tr><th scope="row">' + escapeHtml(t("modal.width")) + '</th><td>' + p.widthIn + ' ' + escapeHtml(t("modal.inches")) + '</td></tr>' +
      '<tr><th scope="row">' + escapeHtml(t("modal.material")) + '</th><td>' + escapeHtml(t("modal.solidBrass")) + '</td></tr>' +
      '<tr><th scope="row">' + escapeHtml(t("modal.finish")) + '</th><td>' + escapeHtml(px(p, "finish")) + '</td></tr>' +
      '<tr><th scope="row">' + escapeHtml(t("modal.availability")) + '</th><td>' + escapeHtml(t(p.stock ? "modal.inStock" : "modal.toOrder")) + '</td></tr>' +
    '</tbody></table>' +
    ((px(p, "details") || []).length
      ? '<ul class="detail-list">' + px(p, "details").map(d => '<li>' + escapeHtml(d) + '</li>').join("") + '</ul>'
      : "") +
    '<div class="modal-actions">' +
      '<a class="btn btn-wa" href="' + waLink(productEnquiryMessage(p)) +
        '" target="_blank" rel="noopener">' + escapeHtml(t("modal.enquireWa")) + '</a>' +
      '<button class="btn btn-ghost" data-enq="' + p.id + '">' +
        escapeHtml(inList ? t("card.inEnquiry") : t("card.addEnquiry")) + '</button>' +
    '</div>' +
    '<div class="share-row">' +
      '<span class="lbl">' + escapeHtml(t("modal.share")) + '</span>' +
      '<button class="share-btn" data-share="whatsapp" aria-label="Share on WhatsApp" title="WhatsApp">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37s-1.04 1.01-1.04 2.47 1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.02a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5.01c0-5.18 4.22-9.4 9.42-9.4a9.36 9.36 0 0 1 9.4 9.41c0 5.18-4.22 9.4-9.4 9.41zM20.52 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.15 1.6 5.95L.06 24l6.3-1.65a11.87 11.87 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.49-8.42z"/></svg>' +
      '</button>' +
      '<button class="share-btn" data-share="facebook" aria-label="Share on Facebook" title="Facebook">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.79 8.44-4.93 8.44-9.94z"/></svg>' +
      '</button>' +
      '<button class="share-btn" data-share="copy" aria-label="Copy link" title="Copy link">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>' +
      '</button>' +
      '<button class="share-btn" data-share="native" aria-label="Share" title="Share">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>' +
      '</button>' +
    '</div>';

  const revBox = $("#modalReviews");
  if (mine.length || theirs.length) {
    revBox.hidden = false;
    revBox.innerHTML = '<h4>' + escapeHtml(t("modal.buyersSaid")) + '</h4><div class="review-wall">' +
      mine.map(r => reviewCard(r, true)).join("") +
      theirs.map(r => reviewCard(r, false)).join("") + '</div>';
  } else {
    revBox.hidden = false;
    revBox.innerHTML = '<h4>' + escapeHtml(t("nav.reviews")) + '</h4><p style="color:var(--ink-soft);font-size:.9rem;margin:0">' +
      escapeHtml(t("modal.noReviews")) + ' <button class="link-btn" data-goto-review="' + p.id + '">' +
      escapeHtml(t("modal.beFirst")) + '</button></p>';
  }

  hydrateImages($("#productModal"));
  $("#productModal").classList.add("open");
  document.body.classList.add("locked");
  $("#modalClose").focus();

  if (updateHash) history.replaceState(null, "", "#p=" + p.id);
}

function closeProduct() {
  $("#productModal").classList.remove("open");
  document.body.classList.remove("locked");
  modalProduct = null;
  if (location.hash.startsWith("#p=")) history.replaceState(null, "", location.pathname + location.search);
}

/* ---------- sharing ------------------------------------------------------- */

async function shareProduct(kind) {
  if (!modalProduct) return;
  const p = modalProduct;
  const url = productUrl(p.id);
  const text = px(p, "name") + " — " + p.heightIn + " in, " + p.weightKg + " kg, " + rupees(p.price) + " · " + SHOP.name;

  if (kind === "whatsapp") {
    window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url), "_blank", "noopener");
  } else if (kind === "facebook") {
    window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "_blank", "noopener");
  } else if (kind === "copy") {
    try {
      await navigator.clipboard.writeText(url);
      toast(t("toast.copied"));
    } catch (e) {
      toast(url);
    }
  } else if (kind === "native") {
    if (navigator.share) {
      try { await navigator.share({ title: px(p, "name"), text: text, url: url }); } catch (e) { /* dismissed */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast(t("toast.copiedShort"));
      } catch (e) { toast(url); }
    }
  }
}

/* ==========================================================================
   Static content built from SHOP in data.js
   ========================================================================== */

function renderShopDetails() {
  document.title = SHOP.name + " — Brass Idols of Indian Gods";

  $$("[data-shop=name]").forEach(el => { el.textContent = SHOP.name; });
  $$("[data-shop=nameHindi]").forEach(el => {
    el.textContent = SHOP.nameHindi;
    if (!SHOP.nameHindi) el.hidden = true;
  });
  $$("[data-shop=mark]").forEach(el => { el.textContent = (SHOP.nameHindi || SHOP.name).charAt(0); });
  $$("[data-shop=tagline]").forEach(el => { el.textContent = SHOP.tagline; });
  $$("[data-shop=phone]").forEach(el => { el.textContent = SHOP.phoneDisplay; });
  $$("[data-shop=email]").forEach(el => { el.textContent = SHOP.email; });
  $$("[data-shop=address]").forEach(el => { el.textContent = SHOP.address; });
  $$("[data-shop=hours]").forEach(el => { el.textContent = SHOP.hours; });
  $$("[data-shop=year]").forEach(el => { el.textContent = new Date().getFullYear(); });
  $$("[data-shop=established]").forEach(el => { el.textContent = SHOP.established; });

  $$("[data-href=tel]").forEach(el => { el.href = "tel:" + SHOP.phoneDial; });
  $$("[data-href=mail]").forEach(el => { el.href = "mailto:" + SHOP.email; });
  $$("[data-href=maps]").forEach(el => { el.href = SHOP.mapsUrl; });
  $$("[data-href=instagram]").forEach(el => { el.href = SHOP.instagram; });
  $$("[data-href=facebook]").forEach(el => { el.href = SHOP.facebook; });
  $$("[data-href=whatsapp]").forEach(el => {
    el.href = waLink(t("wa.greeting") + " " + SHOP.name + ", " + t("wa.generalMsg"));
  });

  $("#uspStrip").innerHTML = SHOP.usps.map(u =>
    '<div class="usp-item"><b>' + escapeHtml(u.title) + '</b><span>' + escapeHtml(u.note) + '</span></div>'
  ).join("");

  $("#heroCount").textContent = PRODUCTS.length;
  const lightest = PRODUCTS.reduce((a, p) => Math.min(a, p.weightKg), Infinity);
  const heaviest = PRODUCTS.reduce((a, p) => Math.max(a, p.weightKg), 0);
  $("#heroWeights").textContent = lightest + "–" + heaviest + " kg";
  $("#heroRating").textContent = ratingStats().average.toFixed(1) + " / 5";

  const feature = PRODUCTS.find(p => p.id === "shiva-nataraja-15") || PRODUCTS[0];
  const featureName = px(feature, "name");
  const heroImg = SHOP.heroImage
    ? '<img src="' + assetUrl(SHOP.heroImage) + '" alt="' + escapeHtml(featureName) +
      '" data-ph="' + placeholderSrc(deityHindi(feature.deity)) + '">'
    : imgTag(feature, 0);
  $("#heroPlate").innerHTML = '<div class="frame">' + heroImg + '</div>' +
    '<div class="hero-tag"><b>' + escapeHtml(featureName) + '</b>' +
    '<span>' + feature.heightIn + ' in · ' + feature.weightKg + ' kg · ' + rupees(feature.price) + '</span></div>';
  hydrateImages($("#heroPlate"));

  $("#nicheRow").innerHTML = DEITIES.map(d => {
    const n = PRODUCTS.filter(p => p.deity === d.name).length;
    return '<button class="niche" data-deity="' + escapeHtml(d.name) + '">' +
      '<span class="niche-arch"><span>' + d.hi + '</span></span>' +
      '<small>' + escapeHtml(deityLabel(d.name)) + ' (' + n + ')</small></button>';
  }).join("");

  const keepDeity = $("#deityFilter").value || "All";
  $("#deityFilter").innerHTML = '<option value="All">' + escapeHtml(t("cat.allDeities")) + '</option>' +
    DEITIES.map(d => '<option value="' + escapeHtml(d.name) + '">' + escapeHtml(deityLabel(d.name)) + '</option>').join("");
  $("#deityFilter").value = keepDeity;

  const keepProduct = $("#reviewProduct").value || "";
  $("#reviewProduct").innerHTML = '<option value="">' + escapeHtml(t("rev.general")) + '</option>' +
    PRODUCTS.map(p => '<option value="' + p.id + '">' + escapeHtml(px(p, "name")) + '</option>').join("");
  $("#reviewProduct").value = keepProduct;
}

/* ==========================================================================
   Wiring
   ========================================================================== */

function setFilter(key, value) {
  filters[key] = value;
  renderCatalog();
}

function scrollToCatalog() {
  $("#catalog").scrollIntoView({ behavior: "smooth", block: "start" });
}

function init() {
  /* A shared link wins, so a Tamil link opens in Tamil; then the saved choice. */
  let start = new URLSearchParams(location.search).get("lang");
  if (!start) { try { start = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ } }
  setLanguage(start || "en", false);
  buildLangSlider();
  applyStaticText();
  renderQR();
  wireQR();

  loadEnquiry();
  renderShopDetails();
  renderCatalog();
  renderReviews();
  renderEnquiry();
  hydrateImages(document);

  /* --- one delegated click handler for everything the grid renders --- */
  document.addEventListener("click", e => {
    const open = e.target.closest("[data-open]");
    if (open) { openProduct(open.dataset.open); return; }

    const enq = e.target.closest("[data-enq]");
    if (enq) {
      const id = enq.dataset.enq;
      toggleEnquiry(id);
      if (modalProduct && modalProduct.id === id) openProduct(id, false);
      return;
    }

    const remove = e.target.closest("[data-remove]");
    if (remove) { toggleEnquiry(remove.dataset.remove); return; }

    const niche = e.target.closest(".niche");
    if (niche) {
      setFilter("deity", filters.deity === niche.dataset.deity ? "All" : niche.dataset.deity);
      $("#deityFilter").value = filters.deity;
      scrollToCatalog();
      return;
    }

    const share = e.target.closest("[data-share]");
    if (share) { shareProduct(share.dataset.share); return; }

    const shot = e.target.closest("[data-shot]");
    if (shot && modalProduct) {
      const i = Number(shot.dataset.shot);
      $("#modalMedia .main").innerHTML = imgTag(modalProduct, i);
      hydrateImages($("#modalMedia"));
      $$("#modalMedia .thumbs button").forEach(b => b.classList.toggle("on", b === shot));
      return;
    }

    const goto = e.target.closest("[data-goto-review]");
    if (goto) {
      closeProduct();
      $("#reviewProduct").value = goto.dataset.gotoReview;
      $("#reviewForm").scrollIntoView({ behavior: "smooth", block: "center" });
      $("#reviewName").focus({ preventScroll: true });
      return;
    }
  });

  /* --- catalog toolbar --- */
  let searchTimer;
  $("#search").addEventListener("input", e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => setFilter("query", e.target.value), 140);
  });
  $("#deityFilter").addEventListener("change", e => setFilter("deity", e.target.value));
  $("#priceFilter").addEventListener("change", e => setFilter("price", e.target.value));
  $("#weightFilter").addEventListener("change", e => setFilter("weight", e.target.value));
  $("#sortBy").addEventListener("change", e => setFilter("sort", e.target.value));

  $("#clearFilters").addEventListener("click", () => {
    Object.assign(filters, { deity: "All", query: "", price: "all", weight: "all", sort: "featured" });
    $("#search").value = "";
    $("#deityFilter").value = "All";
    $("#priceFilter").value = "all";
    $("#weightFilter").value = "all";
    $("#sortBy").value = "featured";
    renderCatalog();
  });

  /* --- modal --- */
  $("#modalClose").addEventListener("click", closeProduct);
  $("#productModal").addEventListener("click", e => {
    if (e.target === $("#productModal")) closeProduct();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if ($("#productModal").classList.contains("open")) closeProduct();
      $("#siteNav").classList.remove("open");
    }
  });

  /* --- mobile nav --- */
  $("#navToggle").addEventListener("click", () => $("#siteNav").classList.toggle("open"));
  $$("#siteNav a").forEach(a => a.addEventListener("click", () => $("#siteNav").classList.remove("open")));

  /* --- enquiry bar --- */
  $("#enqHeaderBtn").addEventListener("click", () => {
    if (!enquiry.length) {
      toast(t("toast.empty"));
      scrollToCatalog();
      return;
    }
    $("#enqItems").classList.add("show");
    $("#enqExpand").textContent = t("enq.hide");
    $("#enqBar").scrollIntoView({ behavior: "smooth", block: "end" });
  });

  $("#enqExpand").addEventListener("click", () => {
    const items = $("#enqItems");
    const open = items.classList.toggle("show");
    $("#enqExpand").textContent = t(open ? "enq.hide" : "enq.view");
  });
  $("#enqSend").addEventListener("click", () => {
    if (!enquiry.length) return;
    window.open(waLink(enquiryMessage()), "_blank", "noopener");
  });
  $("#enqClear").addEventListener("click", () => {
    enquiry = [];
    persistEnquiry();
    renderEnquiry();
    renderCatalog();
    toast(t("toast.cleared"));
  });

  /* --- star picker --- */
  let picked = 5;
  const stars = $$("#starPick button");
  const paint = n => stars.forEach((b, i) => b.classList.toggle("lit", i < n));
  stars.forEach((b, i) => {
    b.addEventListener("click", () => { picked = i + 1; paint(picked); $("#ratingValue").value = picked; });
    b.addEventListener("mouseenter", () => paint(i + 1));
  });
  $("#starPick").addEventListener("mouseleave", () => paint(picked));
  paint(picked);

  /* --- review form --- */
  $("#reviewForm").addEventListener("submit", e => {
    e.preventDefault();
    const review = {
      name: $("#reviewName").value.trim(),
      city: $("#reviewCity").value.trim(),
      rating: Number($("#ratingValue").value) || 5,
      product: $("#reviewProduct").value,
      text: $("#reviewText").value.trim(),
      date: new Date().toISOString().slice(0, 10)
    };
    if (!review.name || !review.text) return;

    saveLocalReview(review);
    renderReviews();
    e.target.reset();
    picked = 5; paint(5); $("#ratingValue").value = 5;

    const p = review.product ? productById(review.product) : null;
    const message =
      t("wa.newReview") + " " + SHOP.name + "\n\n" +
      t("wa.name") + ": " + review.name + (review.city ? " (" + review.city + ")" : "") + "\n" +
      t("wa.rating") + ": " + review.rating + "/5\n" +
      (p ? t("wa.product") + ": " + waName(p) + "\n" : "") +
      "\n" + review.text;

    $("#reviewSent").hidden = false;
    $("#reviewSendWa").href = waLink(message);
    $("#reviewSent").scrollIntoView({ behavior: "smooth", block: "center" });
    toast(t("toast.reviewThanks"));
  });

  /* --- contact enquiry form, sent straight to WhatsApp --- */
  $("#contactForm").addEventListener("submit", e => {
    e.preventDefault();
    const message =
      t("wa.greeting") + " " + SHOP.name + ",\n\n" +
      t("wa.name") + ": " + $("#cName").value.trim() + "\n" +
      t("wa.city") + ": " + $("#cCity").value.trim() + "\n\n" +
      $("#cMessage").value.trim();
    window.open(waLink(message), "_blank", "noopener");
  });

  /* --- share the whole catalog --- */
  $$("[data-share-site]").forEach(btn => btn.addEventListener("click", async () => {
    const text = SHOP.name + " — " + t("wa.catalogPitch");
    const url = siteUrl();
    if (navigator.share) {
      try { await navigator.share({ title: SHOP.name, text: text, url: url }); return; } catch (err) { /* dismissed */ }
    }
    try {
      await navigator.clipboard.writeText(text + " " + url);
      toast(t("toast.catCopied"));
    } catch (err) {
      window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), "_blank", "noopener");
    }
  }));

  /* --- deep link: someone opened a shared product link --- */
  const match = location.hash.match(/^#p=(.+)$/);
  if (match) {
    const id = decodeURIComponent(match[1]);
    if (productById(id)) setTimeout(() => openProduct(id, false), 60);
  }
  window.addEventListener("hashchange", () => {
    const m = location.hash.match(/^#p=(.+)$/);
    if (m && productById(decodeURIComponent(m[1]))) openProduct(decodeURIComponent(m[1]), false);
  });
}

document.addEventListener("DOMContentLoaded", init);
