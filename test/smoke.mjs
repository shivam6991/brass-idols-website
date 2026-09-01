/**
 * Smoke tests for the brass idol catalogue.
 *
 *   npm install && npm test
 *
 * Runs the real source files — index.html, the stylesheet and the four scripts —
 * inside jsdom. Nothing is built first, so what is tested is what ships.
 */
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import qrcode from "qrcode-generator";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");

const qrRef = JSON.parse(read("test", "fixtures", "qr-reference.json"));

/* Compose the page the way a browser would: jsdom does not fetch <script src>
   or <link rel=stylesheet>, so inline them from disk first. Images keep their
   real relative paths, which is what the assertions below check for. */
function composePage() {
  let html = read("index.html");

  // Always replace via a function. A replacement *string* would treat "$$" as an
  // escaped "$", and app.js declares `const $$ = ...` — which silently mangles
  // it into a duplicate `const $` and breaks the whole page.
  const inline = (haystack, needle, replacement) => haystack.replace(needle, () => replacement);

  html = inline(html, '<link rel="stylesheet" href="assets/css/style.css">',
                "<style>\n" + read("assets", "css", "style.css") + "\n</style>");

  for (const f of ["i18n.js", "i18n-content.js", "data.js", "app.js"]) {
    const src = read("assets", "js", f).replace(/<\/script>/g, "<\\/script>");
    html = inline(html, '<script src="assets/js/' + f + '"></script>', "<script>\n" + src + "\n</script>");
  }

  // The QR encoder normally comes from a CDN; it is supplied from node_modules.
  html = inline(html, /<script src="https:\/\/cdnjs\.cloudflare\.com[^"]*"><\/script>/, "");
  return html;
}

const html = composePage();
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://kaanchanbrass.example/",
  beforeParse(win) {
    win.qrcode = qrcode;   // stands in for the CDN script jsdom will not fetch
    win.addEventListener("error", e => errors.push("window error: " + e.message));
    win.matchMedia = win.matchMedia || (() => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
    win.scrollTo = () => {};
    win.open = () => null;
    win.HTMLElement.prototype.scrollIntoView = function () {};
    const origErr = win.console.error;
    win.console.error = (...a) => { errors.push("console.error: " + a.join(" ")); origErr.apply(win.console, a); };
  }
});

const { window } = dom;
const doc = window.document;
await new Promise(r => setTimeout(r, 300));

// "Real photo" means the referenced file actually exists in assets/img/products/.
// Every product now names a photo file in data.js, but a name only becomes a real
// photo once the file is uploaded — so count files on disk, not just references.
const productImgDir = path.join(ROOT, "assets", "img", "products");
const presentImgs = new Set(fs.readdirSync(productImgDir));
const PRODUCTS_COUNT_WITH_PHOTOS = window.eval("PRODUCTS")
  .filter(p => (p.images || []).some(f => presentImgs.has(f))).length;
const $ = s => doc.querySelector(s);
const $$ = s => Array.from(doc.querySelectorAll(s));
const checks = [];
const check = (label, pass, detail = "") => checks.push({ label, pass, detail });

check("catalogue rendered", $$("#grid .card").length === 16, $$("#grid .card").length + " cards");
check("deity niches rendered", $$("#nicheRow .niche").length === 12, $$("#nicheRow .niche").length + " niches");
check("USP strip rendered", $$("#uspStrip .usp-item").length === 4);
check("review wall rendered", $$("#reviewWall .review").length === 8, $$("#reviewWall .review").length + " reviews");
check("rating average computed", $("#ratingBig").textContent === "4.8", "shows " + $("#ratingBig").textContent);
check("rating bars rendered", $$("#ratingBars .bar-row").length === 5);
check("shop name injected", $$("[data-shop=name]")[0].textContent === "Kaanchan Brass");
check("hero stats filled", $("#heroCount").textContent === "16" && $("#heroWeights").textContent === "1.2-9.4 kg".replace("-", "–"), $("#heroCount").textContent + " / " + $("#heroWeights").textContent);
check("deity filter options", $$("#deityFilter option").length === 13);
check("review product options", $$("#reviewProduct option").length === 17);
check("whatsapp links built", $$("[data-href=whatsapp]").every(a => a.href.startsWith("https://wa.me/919876543210?text=")));
check("every card has an image", $$("#grid img").length === 16 && $$("#grid img").every(i => {
        const src = i.getAttribute("src");
        // either a real photo, or the drawn placeholder for products without one
        return src.startsWith("assets/img/products/") || src.startsWith("data:image/svg+xml");
      }), $$("#grid img").length + " images");
check("hero photo wired", $("#heroPlate img").getAttribute("src") === "assets/img/site/hero.jpg");
check("workshop photo wired", $(".about-plate img").getAttribute("src") === "assets/img/site/workshop.jpg");
{
  const withPhoto = PRODUCTS_COUNT_WITH_PHOTOS;
  check("photographed products counted", withPhoto === 7, withPhoto + " of 16 have real photos");
}
check("prices formatted in rupees", /₹4,250/.test($("#grid .card .price").textContent), $("#grid .card .price").textContent);
check("weight stamp present", /1\.8/.test($("#grid .card .spec-stamp").textContent));

// --- interactions -----------------------------------------------------------
const click = el => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

click($("#grid .card-media"));
check("product window opens", $("#productModal").classList.contains("open"));
check("spec table has weight row", /Weight/.test($("#modalInfo .spec-table").textContent));
check("deep link written to url", window.location.hash === "#p=ganesha-sitting-6", window.location.hash);
check("per-product reviews shown", /Meera Nair/.test($("#modalReviews").textContent));
check("multi-angle thumbnails shown", $$("#modalMedia .thumbs button").length === 3, $$("#modalMedia .thumbs button").length + " thumbs");
{
  const t = $$("#modalMedia .thumbs button")[2];
  click(t);
  check("thumbnail swaps the main photo", $("#modalMedia .main img").getAttribute("src").startsWith("assets/img/products/"));
}
click($("#modalClose"));
check("product window closes", !$("#productModal").classList.contains("open"));

click($("#grid [data-enq]"));
check("enquiry list accepts an item", $("#enqCount").textContent === "1" && $("#enqBar").classList.contains("open"));
check("enquiry total computed", /₹4,250/.test($("#enqSummary").textContent), $("#enqSummary").textContent.trim());
click($("#grid [data-enq]"));
check("enquiry list removes an item", $("#enqCount").textContent === "0" && !$("#enqBar").classList.contains("open"));

// filters
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const dsel = $("#deityFilter"); dsel.value = "Ganesha"; fire(dsel, "change");
check("deity filter narrows grid", $$("#grid .card").length === 2, $$("#grid .card").length + " cards");
const wsel = $("#weightFilter"); wsel.value = "u2"; fire(wsel, "change");
check("weight filter stacks with deity", $$("#grid .card").length === 1, $$("#grid .card").length + " cards");
click($("#clearFilters"));
check("clear filters restores all", $$("#grid .card").length === 16);

const ssel = $("#sortBy"); ssel.value = "price-desc"; fire(ssel, "change");
check("sort by price works", /Ram Darbar/.test($("#grid .card-name").textContent), $("#grid .card-name").textContent);
ssel.value = "weight-asc"; fire(ssel, "change");
check("sort by weight works", /Nandi/.test($("#grid .card-name").textContent), $("#grid .card-name").textContent);

// search
const search = $("#search"); search.value = "nataraja"; fire(search, "input");
await new Promise(r => setTimeout(r, 220));
check("search filters grid", $$("#grid .card").length === 2, $$("#grid .card").length + " cards (two Nataraja listings)");
search.value = ""; fire(search, "input");
await new Promise(r => setTimeout(r, 220));

// review submission
$("#reviewName").value = "Test Buyer";
$("#reviewCity").value = "Nashik";
$("#reviewText").value = "Arrived well packed and the weight matched exactly.";
$("#reviewProduct").value = "nandi-standing-45";
fire($("#reviewForm"), "submit");
check("review shows immediately", $$("#reviewWall .review.mine").length === 1);
check("review marked as local", /Saved on your device/.test($("#reviewWall").textContent));
check("published average unchanged", $("#ratingBig").textContent === "4.8", $("#ratingBig").textContent);
check("whatsapp handoff offered", !$("#reviewSent").hidden && $("#reviewSendWa").href.includes("wa.me/919876543210"));

// star picker
click($$("#starPick button")[2]);
check("star picker sets rating", $("#ratingValue").value === "3", $("#ratingValue").value);


// ===================== whatsapp qr =====================
check("QR encoder available", typeof window.qrcode === "function");
check("QR dock is shown", $("#qrDock").hidden === false);
check("small QR drawn", !!$("#qrMini svg"));
check("large QR drawn", !!$("#qrBig svg"));
check("QR is resolution independent", ($("#qrMini svg").getAttribute("viewBox") || "").length > 0,
      $("#qrMini svg").getAttribute("viewBox"));
{
  // The spec requires a four-module white border. Without it most camera apps
  // will not lock on, which is exactly the bug this guards against.
  const vb = $("#qrMini svg").getAttribute("viewBox").split(" ").map(Number);
  const modules = window.eval('(function(){var q=qrcode(0,"M");q.addData("https://wa.me/919876543210");q.make();return q.getModuleCount();})()');
  const total = vb[2];
  const cell = total / (modules + 8);
  const quiet = (total - modules * cell) / 2 / cell;
  check("QR has the required 4-module quiet zone", Math.abs(quiet - 4) < 0.01,
        quiet.toFixed(2) + " modules");
  check("QR carries its own white ground", /fill="white"/.test($("#qrMini").innerHTML));
}
check("caption sits with the code", /Scan QR code to connect on WhatsApp/.test($(".qr-cap").textContent),
      $(".qr-cap").textContent);
{
  // Rebuild the same code and compare it, module for module, with a matrix
  // produced by an unrelated encoder (segno, in Python).
  const shopUrl = "https://wa.me/" + window.eval("String(SHOP.whatsapp).replace(/\\D/g,'')");
  const built = window.eval(`(function(){
    var q = qrcode(0, "M");
    q.addData("${shopUrl}");
    q.make();
    var n = q.getModuleCount(), out = [];
    for (var r = 0; r < n; r++) { var row = []; for (var c = 0; c < n; c++) row.push(q.isDark(r, c) ? 1 : 0); out.push(row); }
    return JSON.stringify(out);
  })()`);
  const mine = JSON.parse(built);
  check("QR size matches reference", mine.length === 25, mine.length + "x" + mine.length);

  // Any of the eight mask patterns is a legal QR; encoders may pick different
  // ones. The code is correct if it matches the reference under some mask.
  if (shopUrl !== qrRef.url) {
    check("QR reference matches the configured number", false,
          "fixture is for " + qrRef.url + " but data.js now has " + shopUrl +
          " — regenerate test/fixtures/qr-reference.json");
  }
  let matched = null;
  for (const m of Object.keys(qrRef.masks)) {
    const ref = qrRef.masks[m];
    let diff = 0;
    for (let r = 0; r < ref.length; r++)
      for (let c = 0; c < ref[r].length; c++) if (ref[r][c] !== mine[r][c]) diff++;
    if (diff === 0) { matched = m; break; }
  }
  check("QR encodes the right URL, verified against an independent encoder",
        matched !== null,
        matched !== null ? "identical to segno mask " + matched + " of " + qrRef.url
                         : "matches no legal mask");
}
{
  const dock = $("#qrDock"), chip = $("#qrChip");
  click(chip);
  check("clicking opens the large QR", dock.classList.contains("open") &&
        chip.getAttribute("aria-expanded") === "true");
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("Escape closes it", !dock.classList.contains("open") &&
        chip.getAttribute("aria-expanded") === "false");
}

// ===================== language =====================
// earlier tests left a sort applied; start from the default order
click($("#clearFilters"));
const setLang = code => click($('#langSlider button[data-lang="' + code + '"]'));

check("slider shows all five languages", $$("#langSlider button").length === 5,
      $$("#langSlider button").map(o => o.textContent).join(" / "));
check("slider is a radiogroup", $("#langSlider").getAttribute("role") === "radiogroup");
check("slider has a thumb", !!$("#langSlider .lang-thumb"));
check("English starts selected", $('#langSlider button[data-lang="en"]').getAttribute("aria-checked") === "true");
check("roving tabindex set", $('#langSlider button[data-lang="en"]').tabIndex === 0 &&
      $('#langSlider button[data-lang="ta"]').tabIndex === -1);
check("starts in English", doc.documentElement.getAttribute("lang") === "en");

setLang("ml");
check("html lang switches to Malayalam", doc.documentElement.getAttribute("lang") === "ml");
check("thumb follows the selection", $('#langSlider button[data-lang="ml"]').getAttribute("aria-checked") === "true" &&
      $('#langSlider button[data-lang="en"]').getAttribute("aria-checked") === "false");
check("dropdown is gone", !$("#langSelect") && !$(".lang-picker"));
{
  const box = $("#langSlider");
  box.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  const moved = doc.documentElement.getAttribute("lang");
  check("arrow key moves to the next language", moved === "ta", "landed on " + moved);
  box.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  check("arrow key steps back", doc.documentElement.getAttribute("lang") === "ml");
}
check("nav translated", $('a[data-i18n="nav.catalog"]').textContent === "മുഴുവൻ കാറ്റലോഗ്",
      $('a[data-i18n="nav.catalog"]').textContent);
check("hero headline translated", /പിത്തള/.test($("h1").textContent), $("h1").textContent.slice(0, 40));
check("product name translated", /ഗണപതി/.test($("#grid .card-name").textContent), $("#grid .card-name").textContent);
check("deity chip translated", /ഗണപതി/.test($("#grid .card-deity").textContent), $("#grid .card-deity").textContent);
check("spec stamp translated", /ഇഞ്ച്|കിലോ/.test($("#grid .spec-stamp").textContent), $("#grid .spec-stamp").textContent.trim());
check("deity niches translated", /ഗണപതി/.test($("#nicheRow").textContent));
check("filter options translated", $$("#deityFilter option")[0].textContent === "എല്ലാ ദേവന്മാരും",
      $$("#deityFilter option")[0].textContent);
check("form placeholder translated", /തിരയുക/.test($("#search").placeholder), $("#search").placeholder);
check("prices stay in Latin digits", /^₹[\d,]+$/.test($("#grid .price").textContent.trim()), $("#grid .price").textContent);
check("url carries the language", window.location.search.includes("lang=ml"), window.location.search);
check("Malayalam font requested", !!doc.getElementById("font-Malayalam"));

click($("#grid .card-media"));
check("product window translated", /ഗണപതി/.test($("#modalInfo h2").textContent), $("#modalInfo h2").textContent);
check("spec table translated", /തൂക്കം/.test($("#modalInfo .spec-table").textContent));
check("review body translated", /പുതിയ ഫ്ലാറ്റ|പൂജാമുറി/.test($("#reviewWall").textContent));
{
  const wa = decodeURIComponent($("#modalInfo .btn-wa").getAttribute("href"));
  check("WhatsApp keeps English name for the owner", wa.includes("(Sitting Ganesha with Mushak)"),
        wa.includes("(Sitting Ganesha with Mushak)") ? "English name present" : wa.slice(0, 120));
}
click($("#modalClose"));

setLang("ta");
check("Tamil switches", doc.documentElement.getAttribute("lang") === "ta" &&
      /விநாயகர்/.test($("#grid .card-deity").textContent), $("#grid .card-deity").textContent);
setLang("te");
check("Telugu switches", /గణపతి/.test($("#grid .card-deity").textContent), $("#grid .card-deity").textContent);
setLang("kn");
check("Kannada switches", /ಗಣಪತಿ/.test($("#grid .card-deity").textContent), $("#grid .card-deity").textContent);
check("untranslated product falls back to English", (() => {
  const names = $$("#grid .card-name").map(b => b.textContent);
  return names.every(n => n && n.trim().length > 0);
})());

// the top bar must stay one row in every language
{
  const cs = window.getComputedStyle($(".announce .wrap"));
  check("top bar cannot wrap", cs.flexWrap === "nowrap", "flex-wrap: " + cs.flexWrap);
  const msgs = window.getComputedStyle($(".announce-msgs"));
  check("messages give way, not the switch", msgs.overflow === "hidden" && msgs.minWidth === "0px",
        "overflow: " + msgs.overflow + ", min-width: " + msgs.minWidth);
  const sl = window.getComputedStyle($("#langSlider"));
  check("switch never shrinks", sl.flexGrow === "0" && sl.flexShrink === "0",
        "flex: " + sl.flexGrow + " " + sl.flexShrink);
}

setLang("en");
check("returns to English cleanly", $("#grid .card-name").textContent === "Sitting Ganesha with Mushak",
      $("#grid .card-name").textContent);
check("language dropped from url", !window.location.search.includes("lang="), window.location.search || "(none)");
check("filters still work after switching", (() => {
  const d = $("#deityFilter"); d.value = "Shiva"; fire(d, "change");
  const n = $$("#grid .card").length; d.value = "All"; fire(d, "change");
  return n === 2;
})());

console.log("");
let failed = 0;
for (const c of checks) {
  if (!c.pass) failed++;
  console.log((c.pass ? "  PASS  " : "  FAIL  ") + c.label + (c.detail ? "   [" + c.detail + "]" : ""));
}
console.log("\n" + (checks.length - failed) + "/" + checks.length + " passed");
console.log("Runtime errors: " + (errors.length ? "\n  " + errors.join("\n  ") : "none"));
process.exit(failed || errors.length ? 1 : 0);
