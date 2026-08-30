/* ============================================================================
   YOUR SHOP DETAILS  —  EDIT THIS BLOCK FIRST
   Everything between the quote marks can be changed. Nothing else needs to be
   touched to get the site live with your own name and phone number.
   ========================================================================== */

const SHOP = {
  name:        "Kaanchan Brass",           // your business name
  nameHindi:   "काञ्चन",                    // shown small above the logo (optional, use "" to hide)
  tagline:     "Handcast brass idols from Moradabad",
  established: "2024",

  // WhatsApp number in international format, digits only, no + or spaces.
  // 91 = India country code. Example: 919876543210
  whatsapp:    "919876543210",

  phoneDisplay: "+91 98765 43210",         // how the number appears on screen
  phoneDial:    "+919876543210",           // used by the "Call" button
  email:        "orders@kaanchanbrass.in",

  address:  "Shop 14, Peetal Nagri Market, Moradabad, Uttar Pradesh 244001",
  mapsUrl:  "https://maps.google.com/?q=Peetal+Nagri+Moradabad",
  hours:    "Mon – Sat, 10:30am – 8:00pm",

  // Big photo beside the headline. Portrait, about 900 x 1125 px.
  heroImage: "assets/img/site/hero.jpg",

  instagram: "https://instagram.com/yourhandle",
  facebook:  "https://facebook.com/yourpage",

  // The public web address, once you have hosted it. Used by the share buttons
  // so the link people receive on WhatsApp is correct.
  siteUrl: "https://kaanchanbrass.netlify.app",

  // Small promises shown in the strip under the hero.
  usps: [
    { title: "Handcast, never machine-pressed", note: "Lost-wax and sand casting by Moradabad artisans" },
    { title: "Weighed and measured honestly",   note: "Every listing shows true weight and height" },
    { title: "Free shipping across India",      note: "Safely crated, insured in transit" },
    { title: "Cash on delivery available",      note: "On orders below ₹20,000" }
  ]
};

/* ============================================================================
   PRODUCT CATALOG
   Copy any block between { } to add a new idol. Keep the commas between blocks.

   id        short unique name, lowercase, no spaces (used in the share link)
   name      what customers see
   deity     must match one of the DEITIES list further down
   heightIn  height in inches
   weightKg  weight in kilograms
   price     what you are selling it for, in rupees, digits only
   mrp       optional crossed-out price. Set to null for no discount shown.
   finish    e.g. "Antique", "Mirror polish", "Dual tone"
   images    photo file names inside assets/img/products/
             Leave the list empty [] and a placeholder is drawn automatically.
   badge     "New", "Bestseller", "Made to order" or "" for none
   stock     true if available now, false shows "Made to order"
   ========================================================================== */

const PRODUCTS = [
  {
    id: "ganesha-sitting-6",
    name: "Sitting Ganesha with Mushak",
    deity: "Ganesha",
    heightIn: 6, widthIn: 4.5, weightKg: 1.8,
    price: 4250, mrp: 5600,
    finish: "Antique green patina",
    images: ["ganesha-sitting-6-a.jpg", "ganesha-sitting-6-b.jpg", "ganesha-sitting-6-c.jpg"],
    badge: "Bestseller", stock: true,
    blurb: "A compact Vinayaka for a home mandir shelf, seated on a lotus pedestal with the mushak at his feet. The antique wash settles into the carving and lifts on the raised edges.",
    details: ["Solid cast, not hollow", "Flat base, sits without a stand", "Hand-finished trunk and modak"]
  },
  {
    id: "ganesha-superfine-12",
    name: "Superfine Lightweight Ganesha",
    deity: "Ganesha",
    heightIn: 12, widthIn: 8, weightKg: 3.2,
    price: 12900, mrp: 16500,
    finish: "Mirror polish with lacquer",
    images: [],
    badge: "New", stock: true,
    blurb: "Hollow-cast in the superfine style, so the piece carries a twelve-inch presence at roughly half the weight of a solid idol. Crown, jewellery and dhoti folds are chased by hand after casting.",
    details: ["Hollow superfine casting", "Lacquered to slow tarnishing", "Ideal as a wedding or housewarming gift"]
  },
  {
    id: "lakshmi-padmavati-8",
    name: "Seated Lakshmi on Lotus Pedestal",
    deity: "Lakshmi",
    heightIn: 8, widthIn: 5, weightKg: 2.4,
    price: 6800, mrp: 8900,
    finish: "Antique copper patina",
    images: ["lakshmi-padmavati-8-a.jpg"],
    badge: "", stock: true,
    blurb: "Four-armed Mahalakshmi seated in lalitasana on a lotus over a stepped plinth, upper hands holding the lotus buds and the lower two in abhaya and varada mudra. Bought most often for Diwali puja and shop openings.",
    details: ["Stepped plinth cast with the figure", "Lotus petals chased by hand", "Pairs with the Lakshmi–Ganesh set"]
  },
  {
    id: "lakshmi-ganesh-pair-5",
    name: "Lakshmi Ganesh Puja Pair",
    deity: "Divine Sets",
    heightIn: 5, widthIn: 7, weightKg: 2.1,
    price: 5400, mrp: 6900,
    finish: "Antique",
    images: [],
    badge: "Bestseller", stock: true,
    blurb: "The pair most families ask for at Diwali, cast to match in scale and finish so they sit level beside each other on the puja chowki.",
    details: ["Sold as a set of two", "Matched patina across both idols", "Combined weight 2.1 kg"]
  },
  {
    id: "krishna-bansuri-10",
    name: "Bansuri Krishna, Standing",
    deity: "Krishna",
    heightIn: 10, widthIn: 4, weightKg: 2.9,
    price: 9750, mrp: 12400,
    finish: "Dual tone",
    images: ["krishna-bansuri-10-a.jpg"],
    badge: "", stock: true,
    blurb: "Murlidhar in the classic crossed-leg stance with the flute at his lips, peacock feather cast as part of the crown rather than soldered on.",
    details: ["Single-piece casting including flute", "Dual tone: polished skin, antique dhoti", "Weighted base resists tipping"]
  },
  {
    id: "radha-krishna-14",
    name: "Radha Krishna Under the Arch",
    deity: "Divine Sets",
    heightIn: 14, widthIn: 11, weightKg: 6.5,
    price: 24500, mrp: 31000,
    finish: "Antique with polished faces",
    images: [],
    badge: "", stock: true,
    blurb: "A drawing-room piece. Radha and Krishna stand together beneath a cast prabhavali arch worked with vines, the whole group rising from one base.",
    details: ["Arch and figures cast separately, assembled", "Faces polished bright against antique body", "Needs a 12-inch deep shelf"]
  },
  {
    id: "shiva-nataraja-15",
    name: "Nataraja in the Ring of Fire",
    deity: "Shiva",
    heightIn: 15, widthIn: 12, weightKg: 7.2,
    price: 28400, mrp: 35800,
    finish: "Antique bronze wash",
    images: ["shiva-nataraja-15-a.jpg"],
    badge: "", stock: true,
    blurb: "The Ananda Tandava after the Chola drawings, with the prabha mandala cast as a continuous ring and Apasmara pinned beneath the right foot.",
    details: ["Chola-proportion reference", "Ring cast in one piece", "Our most requested office and studio piece"]
  },
  {
    id: "shiva-nataraja-polished-9",
    name: "Nataraja, Mirror Polish",
    deity: "Shiva",
    heightIn: 9, widthIn: 7, weightKg: 3.4,
    price: 11200, mrp: null,
    finish: "Mirror polish, lacquer sealed",
    images: ["shiva-nataraja-polished-9-a.jpg"],
    badge: "New", stock: true,
    blurb: "The same Ananda Tandava as our fifteen-inch piece, cast smaller and finished bright rather than antiqued, so the jata strands and the snake at the forearm catch the light.",
    details: ["Mirror polish, lacquer sealed against tarnish", "Jata and prabha strands chased by hand", "Sits on a desk or a narrow shelf"]
  },
  {
    id: "nandi-standing-45",
    name: "Standing Nandi",
    deity: "Nandi",
    heightIn: 4.5, widthIn: 6, weightKg: 1.2,
    price: 3600, mrp: 4500,
    finish: "Antique elegance",
    images: [],
    badge: "", stock: true,
    blurb: "A small Nandi to face your Shivling or Shiva idol, with the bell collar and hump detailed in the traditional South Indian manner.",
    details: ["Sized to sit before an 8–12 inch Shiva", "Solid cast", "Lightest piece in the collection"]
  },
  {
    id: "hanuman-flying-11",
    name: "Flying Hanuman with Sanjeevani",
    deity: "Hanuman",
    heightIn: 11, widthIn: 9, weightKg: 4.1,
    price: 13600, mrp: 17200,
    finish: "Antique",
    images: ["hanuman-flying-11-a.jpg"],
    badge: "Bestseller", stock: true,
    blurb: "Bajrangbali mid-flight carrying the Dronagiri hill, the whole figure cantilevered off a cloud base — the hardest pour in our workshop.",
    details: ["Cantilevered single-piece cast", "Mace and hill fully modelled", "Wall bracket available on request"]
  },
  {
    id: "durga-mahishasurmardini-12",
    name: "Durga Mahishasurmardini",
    deity: "Durga",
    heightIn: 12, widthIn: 10, weightKg: 5.8,
    price: 21900, mrp: 27500,
    finish: "Antique with gold highlights",
    images: [],
    badge: "", stock: true,
    blurb: "Eight-armed Durga astride the lion at the moment of the strike, each weapon cast and set by hand. Ordered heavily through Navratri.",
    details: ["Eight arms, each weapon separately finished", "Lion and figure on a shared base", "Order 3 weeks before Navratri"]
  },
  {
    id: "saraswati-veena-10",
    name: "Saraswati with Veena",
    deity: "Saraswati",
    heightIn: 10, widthIn: 6, weightKg: 3.1,
    price: 10400, mrp: 13000,
    finish: "Mirror polish",
    images: [],
    badge: "", stock: true,
    blurb: "Seated Sharada with the veena across her lap and the hamsa at the base, polished bright so the instrument's strings catch the light.",
    details: ["Veena strings cast in relief", "Popular for study rooms and schools", "Bright polish, lacquer sealed"]
  },
  {
    id: "buddha-blessing-17",
    name: "Blessing Buddha, Dual Tone",
    deity: "Buddha",
    heightIn: 17, widthIn: 11, weightKg: 9.4,
    price: 31300, mrp: 39500,
    finish: "Dual tone",
    images: [],
    badge: "", stock: true,
    blurb: "Standing Buddha with the right hand raised in abhaya mudra, robe folds falling in unbroken lines from shoulder to base. A hotel-lobby scale piece.",
    details: ["Tallest piece we keep in stock", "Robe polished, skin left antique", "Crated on a wooden pallet"]
  },
  {
    id: "ram-darbar-12",
    name: "Ram Darbar",
    deity: "Divine Sets",
    heightIn: 12, widthIn: 14, weightKg: 8.2,
    price: 34900, mrp: 43000,
    finish: "Antique with gold highlights",
    images: [],
    badge: "Made to order", stock: false,
    blurb: "Ram, Sita and Lakshman standing with Hanuman kneeling before them, all four on a single cast platform with a shared prabhavali behind.",
    details: ["Four figures on one base", "Made to order, 4–5 weeks", "Advance of 40% to begin casting"]
  },
  {
    id: "balaji-tirupati-9",
    name: "Tirupati Balaji",
    deity: "Vishnu",
    heightIn: 9, widthIn: 4, weightKg: 3.6,
    price: 12800, mrp: 15900,
    finish: "Antique with gold highlights",
    images: ["balaji-tirupati-9-a.jpg", "balaji-tirupati-9-b.jpg"],
    badge: "", stock: true,
    blurb: "Venkateswara in the standing darshan pose with the namam, conch and chakra, cast to the proportions families ask for from the Tirumala temple.",
    details: ["Conch and chakra cast in place", "Namam picked out in gold highlight", "Solid cast, heavy for its height"]
  },
  {
    id: "kalpavriksha-18",
    name: "Kalpavriksha Wish Tree",
    deity: "Decor",
    heightIn: 18, widthIn: 14, weightKg: 6.0,
    price: 22400, mrp: 28000,
    finish: "Antique with polished leaves",
    images: [],
    badge: "New", stock: true,
    blurb: "The wish-fulfilling tree, each leaf cast and set into the branch by hand so no two trees are identical. Sits well on a console or entrance table.",
    details: ["Roughly 90 hand-set leaves", "Every piece slightly different", "Not a puja idol — decor"]
  }
];

/* ============================================================================
   DEITY CATEGORIES
   The order here is the order of the tiles and the filter chips.
   "hi" is the Devanagari name shown on the tile.
   ========================================================================== */

const DEITIES = [
  { name: "Ganesha",     hi: "गणेश"    },
  { name: "Lakshmi",     hi: "लक्ष्मी"   },
  { name: "Krishna",     hi: "कृष्ण"    },
  { name: "Shiva",       hi: "शिव"     },
  { name: "Hanuman",     hi: "हनुमान"   },
  { name: "Durga",       hi: "दुर्गा"    },
  { name: "Saraswati",   hi: "सरस्वती"  },
  { name: "Vishnu",      hi: "विष्णु"    },
  { name: "Buddha",      hi: "बुद्ध"    },
  { name: "Nandi",       hi: "नंदी"     },
  { name: "Divine Sets", hi: "युगल"     },
  { name: "Decor",       hi: "सजावट"    }
];

/* ============================================================================
   CUSTOMER REVIEWS
   To publish a review permanently, add a block here and re-upload this file.
   Reviews customers type on the site are held in their own browser until you
   add them here — see README.md, "Publishing a review".

   product  the id of a product above, or "" for a general review
   date     YYYY-MM-DD
   ========================================================================== */

const REVIEWS = [
  {
    id: "r1", name: "Anjali Deshpande", city: "Pune", rating: 5, date: "2026-08-14",
    product: "lakshmi-ganesh-pair-5",
    text: "Ordered the Lakshmi Ganesh pair for our new flat. The weight listed on the site was exact, which is what made me trust the shop in the first place. Packing was excellent, thermocol and then a wooden frame."
  },
  {
    id: "r2", name: "Ramesh Iyer", city: "Chennai", rating: 5, date: "2026-08-02",
    product: "shiva-nataraja-15",
    text: "The Nataraja is genuinely close to the Chola proportions. I had asked for photos of the actual piece before shipping and they sent six from every angle on WhatsApp the same evening."
  },
  {
    id: "r3", name: "Farah Qureshi", city: "Bengaluru", rating: 4, date: "2026-07-27",
    product: "kalpavriksha-18",
    text: "Beautiful tree and the leaves really are all slightly different. Took ten days rather than the week I expected, but they kept me updated. Would buy again."
  },
  {
    id: "r4", name: "Sandeep Grover", city: "Delhi", rating: 5, date: "2026-07-19",
    product: "hanuman-flying-11",
    text: "Bought the flying Hanuman for my father's birthday. It is heavier and more solid than it looks in the photos. He has put it in the office reception and everyone asks about it."
  },
  {
    id: "r5", name: "Meera Nair", city: "Kochi", rating: 5, date: "2026-07-05",
    product: "ganesha-sitting-6",
    text: "Small Ganesha, perfect for our mandir shelf. The antique finish is not overdone. Shipped within two days of the payment."
  },
  {
    id: "r6", name: "Vikram Chauhan", city: "Jaipur", rating: 4, date: "2026-06-22",
    product: "",
    text: "Visited the Moradabad shop while travelling. Good to see the pieces in person and the prices matched the website exactly, no tourist markup."
  },
  {
    id: "r7", name: "Priya Sundaram", city: "Hyderabad", rating: 5, date: "2026-06-10",
    product: "saraswati-veena-10",
    text: "Gifted to my daughter when she started her music degree. The veena detailing is very fine. One small mark on the base which they offered to replace, but I kept it."
  },
  {
    id: "r8", name: "Imran Shaikh", city: "Mumbai", rating: 5, date: "2026-05-30",
    product: "buddha-blessing-17",
    text: "We ordered two of the 17 inch Buddha for our restaurant. Both arrived identical in tone, which mattered a lot to us. Invoice with GST came by email the same day."
  }
];
