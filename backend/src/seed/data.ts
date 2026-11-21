/**
 * Initial content loaded by `npm run seed`. Generated from frontend/src/content/seed.ts —
 * after seeding, the database (via the admin dashboard) is the source of truth.
 */

/** Stock photography placeholders until the client supplies their own photos. */
const photo = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const IMAGES = {
  portAerial: photo("photo-1494412574643-ff11b0a5c1c3", 2000),
  portCranes: photo("photo-1578575437130-527eed3abbec"),
  containerShip: photo("photo-1605745341112-85968b19335b"),
  wing: photo("photo-1436491865332-7a61a109cc05"),
  warehouse: photo("photo-1586528116311-ad8dd3c8310d"),
  warehouseAisle: photo("photo-1553413077-190dd305871c"),
  handover: photo("photo-1566576721346-d4a3b4eaeb55"),
  paperwork: photo("photo-1450101499163-c8848c66ca85"),
  roadTruck: photo("photo-1519003722824-194d4455a60c"),
  containers: photo("photo-1494961104209-3c223057bd26"),
};

export const siteSettings = {
  companyName: "Pak China Cargo",
  tagline: "Reliable freight solutions for your business",
  shortDescription:
    "Freight forwarding and customs clearance between China and Pakistan — by sea and by air, delivered to your door.",
  logoUrl: "/brand/logo.jpg",
  phones: [
    // CLIENT REVIEW: both numbers appear on the company's posts; confirm which are current.
    { label: "Main line", number: "+923038896424" },
    { label: "Bookings", number: "+923299539434" },
  ],
  whatsappNumber: "923038896424",
  whatsappMessage: "Assalam o Alaikum, I'd like a quote for shipping from China to Pakistan.",
  email: undefined,
  businessHours: undefined,
  socials: [{ platform: "facebook", url: "https://www.facebook.com/pakchinacargo", handle: "pakchinacargo" }],
  seo: {
    title: "Pak China Cargo — China to Pakistan Freight by Sea & Air",
    description:
      "Ship from China to Pakistan by sea (45–60 days) or air (10–12 days). Customs clearance and door-to-door delivery, with offices in Lahore, Islamabad and Faisalabad.",
  },
};

export const offices = [
  { order: 1, published: true, city: "Lahore", label: "Lahore Office", mapQuery: "Lahore, Pakistan" },
  { order: 2, published: true, city: "Islamabad", label: "Islamabad Office", mapQuery: "Islamabad, Pakistan" },
  { order: 3, published: true, city: "Faisalabad", label: "Faisalabad Office", mapQuery: "Faisalabad, Pakistan" },
];

export const shippingModes = [
  {
   
    order: 1,
    published: true,
    mode: "sea",
    title: "Sea Freight",
    transitTime: "45–60 days",
    summary: "The most economical way to move larger and heavier shipments from China to Pakistan.",
    bestFor: ["Bulk and heavy goods", "Full and shared containers", "Cost-sensitive orders"],
    imageUrl: IMAGES.containerShip,
  },
  {
   
    order: 2,
    published: true,
    mode: "air",
    title: "Air Freight",
    transitTime: "10–12 days",
    summary: "When time matters — fast delivery for urgent, high-value and lighter consignments.",
    bestFor: ["Urgent restocks", "Electronics and accessories", "Samples and smaller parcels"],
    imageUrl: IMAGES.wing,
  },
];

export const services = [
  {
   
    order: 1,
    published: true,
    slug: "sea-freight",
    title: "Sea Freight",
    icon: "ship",
    imageUrl: IMAGES.containerShip,
    summary: "Economical China-to-Pakistan ocean shipping for bulk and heavy cargo, 45–60 days.",
    description: [
      "Sea freight is the most cost-effective way to bring larger shipments from China to Pakistan. We book space, prepare the paperwork and keep you updated from the moment your goods leave the supplier until they reach you.",
      "Typical transit time is 45–60 days, depending on the departure schedule and clearance.",
    ],
    features: ["Shared and full container options", "Booking and documentation handled", "Customs clearance in Pakistan", "Onward delivery to your door"],
  },
  {
   
    order: 2,
    published: true,
    slug: "air-freight",
    title: "Air Freight",
    icon: "plane",
    imageUrl: IMAGES.wing,
    summary: "Fast air cargo from China to Pakistan for urgent and high-value goods, 10–12 days.",
    description: [
      "When your stock can't wait, air freight gets it to Pakistan in 10–12 days. It suits mobile accessories, electronics, samples and other lighter, high-value consignments.",
      "We take care of booking, documentation and clearance so your goods move without delays.",
    ],
    features: ["10–12 day transit", "Ideal for electronics and accessories", "Customs clearance handled", "Delivery across Pakistan"],
  },
  {
   
    order: 3,
    published: true,
    slug: "customs-clearance",
    title: "Customs Clearance",
    icon: "file-check",
    imageUrl: IMAGES.paperwork,
    summary: "Paperwork and clearance handled by our team so your shipment isn't held up.",
    description: [
      "Clearance is where most shipments get delayed. Our team prepares and checks your documents and handles the clearance process for you.",
      "Tell us what you are shipping and we will advise on what's needed before it leaves China.",
    ],
    features: ["Document preparation and checks", "Advice before your goods ship", "Clearance for sea and air cargo", "One point of contact"],
  },
  {
   
    order: 4,
    published: true,
    slug: "door-to-door-delivery",
    title: "Door-to-Door Delivery",
    icon: "package-check",
    imageUrl: IMAGES.handover,
    summary: "From your supplier in China to your doorstep in Pakistan — one service, one contact.",
    description: [
      "Pak China Cargo delivers from China to your door. We collect from your supplier, ship, clear customs and deliver to your shop, warehouse or home anywhere in Pakistan.",
    ],
    features: ["Collection from your supplier", "Nationwide delivery in Pakistan", "Updates along the way", "Support on WhatsApp"],
  },
  {
   
    order: 5,
    published: true,
    slug: "warehousing",
    title: "Warehousing",
    icon: "warehouse",
    imageUrl: IMAGES.warehouse,
    summary: "Storage and handling so goods from several suppliers can travel together.",
    description: [
      "Buying from more than one supplier? We receive and hold your goods, then ship them together — saving you cost and effort.",
    ],
    features: ["Receiving from multiple suppliers", "Combined shipping", "Careful handling and packing"],
  },
  {
   
    order: 6,
    published: true,
    slug: "sourcing-and-supply-chain",
    title: "Sourcing & Supply Chain",
    icon: "search-check",
    imageUrl: IMAGES.warehouseAisle,
    summary: "Help finding suppliers in China and managing the whole chain from order to delivery.",
    description: [
      "Our services include supply chain and logistics management and custom sourcing. We can help you find and coordinate with suppliers in China, then manage the shipment end to end.",
    ],
    features: ["Supplier sourcing support", "Order and shipment coordination", "End-to-end logistics management"],
  },
];

export const cargoRoutes = [
  {
   
    order: 1,
    published: true,
    origin: "China",
    originCountry: "China",
    destination: "Lahore",
    destinationCountry: "Pakistan",
    legs: [
      { mode: "sea", transitTime: "45–60 days" },
      { mode: "air", transitTime: "10–12 days" },
    ],
    description: "Delivered through our Lahore office, with onward delivery across Punjab.",
  },
  {
   
    order: 2,
    published: true,
    origin: "China",
    originCountry: "China",
    destination: "Islamabad",
    destinationCountry: "Pakistan",
    legs: [
      { mode: "sea", transitTime: "45–60 days" },
      { mode: "air", transitTime: "10–12 days" },
    ],
    description: "Served from our Islamabad office for the capital and the north.",
  },
  {
   
    order: 3,
    published: true,
    origin: "China",
    originCountry: "China",
    destination: "Faisalabad",
    destinationCountry: "Pakistan",
    legs: [
      { mode: "sea", transitTime: "45–60 days" },
      { mode: "air", transitTime: "10–12 days" },
    ],
    description: "Handled by our Faisalabad office for local businesses and traders.",
  },
];

export const commodities = [
  { order: 1, published: true, title: "Mobile Accessories", titleUrdu: "موبائل اسیسریز", icon: "smartphone" },
  { order: 2, published: true, title: "Electronics", titleUrdu: "الیکٹرانکس کا سامان", icon: "cpu" },
  { order: 3, published: true, title: "Battery Items", titleUrdu: "بیٹری آئٹمز", icon: "battery-charging", note: "Subject to carrier rules — ask us first." },
  { order: 4, published: true, title: "Medical Equipment", titleUrdu: "میڈیکل آلات", icon: "stethoscope" },
];

export const processSteps = [
  { order: 1, published: true, icon: "message-square", title: "Request a quote", description: "Tell us what you're shipping, how much, and whether you prefer sea or air." },
  { order: 2, published: true, icon: "package", title: "We collect in China", description: "Your goods are collected from the supplier and prepared for shipping." },
  { order: 3, published: true, icon: "ship", title: "Shipping & clearance", description: "We ship your cargo and handle customs clearance in Pakistan." },
  { order: 4, published: true, icon: "map-pin", title: "Delivered to you", description: "Your shipment is delivered to your door, anywhere in Pakistan." },
];

export const highlights = [
  { order: 1, published: true, icon: "route", title: "Sea and air, one partner", description: "Choose the speed and cost that suits each shipment — 45–60 days by sea or 10–12 by air." },
  { order: 2, published: true, icon: "file-check", title: "Customs handled for you", description: "Documents and clearance managed by our team, so your goods aren't stuck at the port." },
  { order: 3, published: true, icon: "building-2", title: "Three offices in Pakistan", description: "Teams in Lahore, Islamabad and Faisalabad you can call or visit." },
  { order: 4, published: true, icon: "messages-square", title: "Direct WhatsApp support", description: "Quick answers and shipment updates on the app you already use." },
];

/** TEMPORARY sample review for the client demo. Delete it in Admin → Testimonials before launch. */
export const testimonials: Record<string, unknown>[] = [
  {
    order: 0,
    published: true,
    name: "Usman Tariq",
    company: "Tariq Mobile Accessories",
    city: "Lahore",
    rating: 5,
    quote:
      "We import mobile accessories from Guangzhou every month. Pak China Cargo collects from our suppliers, keeps us updated on WhatsApp and the cartons arrive at our shop without any hassle at customs.",
  },
];

export const faqs = [
  { order: 1, published: true, question: "How long does shipping from China to Pakistan take?", answer: "Sea freight usually takes 45–60 days and air freight 10–12 days. Exact times depend on departure schedules and customs clearance." },
  { order: 2, published: true, question: "What kind of goods do you ship?", answer: "We regularly ship mobile accessories, electronics, battery items and medical equipment, along with general merchandise. Tell us what you're shipping and we'll confirm before it leaves China." },
  { order: 3, published: true, question: "Do you handle customs clearance?", answer: "Yes. Our team prepares the documentation and handles clearance for both sea and air shipments." },
  { order: 4, published: true, question: "Can you deliver to my door?", answer: "Yes. We offer door-to-door service — from your supplier in China to your address in Pakistan." },
  { order: 5, published: true, question: "How do I get a price for my shipment?", answer: "Send us the type of goods, approximate weight or volume, and your city through the quote form or on WhatsApp. We'll reply with the options and rates." },
  { order: 6, published: true, question: "Where are your offices?", answer: "We have offices in Lahore, Islamabad and Faisalabad." },
];

/** TEMPORARY sample updates for the client demo. Replace them in Admin → Updates before launch. */
export const updates: Record<string, unknown>[] = [
  {
    order: 0,
    published: true,
    slug: "weekly-sea-shipments-guangzhou",
    title: "Weekly sea shipments from Guangzhou",
    excerpt: "Our consolidated sea shipments now leave Guangzhou every week, so smaller orders reach Pakistan sooner and at a lower cost per carton.",
    imageUrl: IMAGES.containerShip,
    publishedAt: "2026-11-10T00:00:00.000Z",
  },
  {
    order: 1,
    published: true,
    slug: "air-cargo-10-12-days",
    title: "Air cargo in 10–12 days for urgent orders",
    excerpt: "Need stock fast? Our air freight service brings goods from China to Lahore, Islamabad and Faisalabad in 10–12 days, with customs clearance included.",
    imageUrl: IMAGES.wing,
    publishedAt: "2026-10-28T00:00:00.000Z",
  },
];

export const about = {
  title: "Connecting Pakistani businesses with China",
  intro:
    "Pak China Cargo is a logistics company specialising in seamless trade between Pakistan and China. We offer freight forwarding and customs clearance tailored to each client, with a focus on efficiency, reliability and timely delivery for businesses of every size.",
  story: [
    // CLIENT REVIEW: add founding year and company history.
    "Our services cover the complete chain — supply chain management, warehousing, custom sourcing, freight forwarding and logistics management. With an experienced team in Lahore, Islamabad and Faisalabad, we move goods from China to your doorstep.",
  ],
  // CLIENT REVIEW
  mission: "To make importing from China simple and dependable for every Pakistani business, with clear pricing, careful handling and on-time delivery.",
  // CLIENT REVIEW
  vision: "To be the most trusted logistics link between China and Pakistan.",
  imageUrl: IMAGES.portCranes,
  imageAlt: "Container ship being loaded at a port",
  values: [
    { icon: "shield-check", title: "Reliability", description: "We do what we promise and keep you informed when plans change." },
    { icon: "eye", title: "Transparency", description: "Clear quotes and honest timelines — no surprises on arrival." },
    { icon: "hand-heart", title: "Care", description: "Your goods are handled like our own, from pickup to delivery." },
    { icon: "zap", title: "Responsiveness", description: "Real people answering quickly, on the phone and on WhatsApp." },
  ],
};

export const home = {
  hero: {
    eyebrow: "China → Pakistan freight forwarding",
    title: "Your goods from China,",
    highlight: "delivered to your door.",
    subtitle:
      "Sea and air cargo with customs clearance handled — from your supplier in China to your shop, warehouse or home in Pakistan.",
    imageUrl: IMAGES.portAerial,
    imageAlt: "Aerial view of a busy container port",
    primaryCta: { label: "Get a free quote", href: "/contact#quote" },
    secondaryCta: { label: "Chat on WhatsApp", href: "whatsapp" },
  },
  intro: {
    body: [
      "Pak China Cargo is a logistics company built for one route that matters to Pakistani businesses: China to Pakistan.",
      "We combine freight forwarding, customs clearance, warehousing and delivery into one service, so you deal with one team from order to doorstep.",
    ],
    imageUrl: IMAGES.warehouse,
    imageAlt: "Organised warehouse with stacked cartons",
    points: ["Sea freight in 45–60 days", "Air freight in 10–12 days", "Customs clearance handled", "Door-to-door delivery"],
  },
  cta: {
    title: "Ready to ship from China?",
    body: "Tell us what you're shipping and we'll come back with the best sea or air option for your budget.",
  },
  sections: [
    { key: "intro", enabled: true, order: 1, eyebrow: "Who we are", title: "One team from supplier to doorstep" },
    { key: "modes", enabled: true, order: 2, eyebrow: "Shipping options", title: "Choose your speed", subtitle: "Two ways to bring your goods home — pick what suits each shipment." },
    { key: "services", enabled: true, order: 3, eyebrow: "Services", title: "Everything your shipment needs", subtitle: "From sourcing in China to delivery in Pakistan." },
    { key: "routes", enabled: true, order: 4, eyebrow: "Routes", title: "China to Pakistan, door to door", subtitle: "Shipments delivered through our offices in Lahore, Islamabad and Faisalabad." },
    { key: "commodities", enabled: true, order: 5, eyebrow: "What we ship", title: "Goods we move every week" },
    { key: "process", enabled: true, order: 6, eyebrow: "How it works", title: "Four steps to your door" },
    { key: "whyUs", enabled: true, order: 7, eyebrow: "Why Pak China Cargo", title: "A partner you can reach" },
    { key: "testimonials", enabled: true, order: 8, eyebrow: "Clients", title: "What our clients say" },
    { key: "faq", enabled: true, order: 9, eyebrow: "FAQ", title: "Questions we're often asked" },
    { key: "updates", enabled: true, order: 10, eyebrow: "Updates", title: "Latest from Pak China Cargo" },
    { key: "cta", enabled: true, order: 11, title: "Ready to ship from China?" },
  ],
};
