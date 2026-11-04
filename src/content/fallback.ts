/**
 * Built-in content: everything the site shows until the custom CMS is
 * connected, and the fallback for any field an editor leaves empty.
 * Images live in /public/images.
 */
import type {
  ContactPage,
  DiningPage,
  Experience,
  ExperiencesPage,
  GalleryPage,
  HomePage,
  Img,
  Room,
  RoomsPage,
  SiteSettings,
  SpaPage,
  Testimonial,
  Treatment,
  Venue,
} from "./types";

const DIMS: Record<string, [number, number]> = {
  "alpine-lake": [2000, 1333],
  coffee: [1200, 800],
  dine: [1600, 1067],
  dine2: [1400, 933],
  food: [1200, 800],
  hero: [2200, 1467],
  highlands: [1800, 1072],
  jetty: [1800, 1352],
  pool: [1600, 1600],
  pool2: [1600, 1067],
  room1: [1400, 933],
  room2: [1400, 933],
  room3: [1400, 1050],
  room4: [1400, 933],
  spa: [1400, 933],
  spa2: [1400, 933],
  terrace: [1600, 1063],
  villa: [1600, 1067],
};

export const img = (name: keyof typeof DIMS, alt: string): Img => ({
  src: `/images/${name}.jpg`,
  alt,
  width: DIMS[name][0],
  height: DIMS[name][1],
});

export const fallbackSettings: SiteSettings = {
  name: "Aberash",
  tagline: "Lodge · Bishoftu",
  description:
    "A quiet luxury lodge on the rim of a crater lake in Bishoftu, Ethiopia — lakeside suites, highland dining, spa rituals and the Ethiopian coffee ceremony.",
  phone: "+251 00 000 0000",
  whatsapp: "+251 00 000 0000",
  email: "reservations@aberashlodge.com",
  address: { line1: "Lake Bishoftu", line2: "Bishoftu, Oromia", country: "Ethiopia" },
  mapEmbed: "https://www.google.com/maps?q=Lake+Bishoftu,+Ethiopia&z=13&output=embed",
  directions: "About an hour's drive from Bole International Airport. We're happy to arrange a private transfer.",
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "TripAdvisor", href: "https://tripadvisor.com" },
  ],
  shareImage: img("hero", "Aberash Lodge"),
};

export const fallbackRooms: Room[] = [
  {
    slug: "lakeside-suite",
    name: "Lakeside Suite",
    category: "suite",
    tag: "Signature",
    view: "Lake view",
    bed: "King bed",
    maxGuests: 2,
    size: "[SIZE] m²",
    priceFrom: "[RATE]",
    short: "King bed · Private terrace · Soaking tub",
    description:
      "Floor-to-ceiling doors open onto a private terrace above the water. A deep stone soaking tub, a reading nook and the first light of morning straight across the lake.",
    images: [img("room1", "Lakeside Suite bedroom"), img("jetty", "Jetty below the suite"), img("coffee", "Coffee on the terrace")],
    amenities: ["Private lakeside terrace", "Stone soaking tub", "Jebena coffee set", "Rain shower", "Hand-woven linens", "Breakfast included"],
  },
  {
    slug: "garden-villa",
    name: "Garden Villa",
    category: "villa",
    tag: "Families",
    view: "Garden view",
    bed: "King + twin",
    maxGuests: 4,
    size: "[SIZE] m²",
    priceFrom: "[RATE]",
    short: "King + twin · Plunge pool · Lounge",
    description:
      "A standalone villa set among jacaranda and acacia, with its own plunge pool, a lounge for long evenings and space enough for the whole family.",
    images: [img("room2", "Garden Villa bedroom"), img("pool2", "Pool among the palms"), img("villa", "Deck at the water's edge")],
    amenities: ["Private plunge pool", "Separate lounge", "Garden terrace", "Children's amenities", "Outdoor shower", "Breakfast included"],
  },
  {
    slug: "highland-room",
    name: "Highland Room",
    category: "room",
    tag: "Classic",
    view: "Hillside view",
    bed: "King or twin",
    maxGuests: 2,
    size: "[SIZE] m²",
    priceFrom: "[RATE]",
    short: "King or twin · Balcony · Rain shower",
    description: "Warm timber, woven textiles and a balcony facing the hills. A calm, generous room for a weekend away from the city.",
    images: [img("room4", "Highland Room"), img("highlands", "Mist over the highlands"), img("terrace", "Sunset terrace")],
    amenities: ["Hillside balcony", "Rain shower", "Work desk", "Jebena coffee set", "Fast Wi-Fi", "Breakfast included"],
  },
  {
    slug: "aberash-residence",
    name: "Aberash Residence",
    category: "suite",
    tag: "Two bedrooms",
    view: "Panoramic lake",
    bed: "Two king beds",
    maxGuests: 4,
    size: "[SIZE] m²",
    priceFrom: "[RATE]",
    short: "Two bedrooms · Butler · Dining room",
    description:
      "Our finest residence: two bedrooms, a private dining room and a wraparound terrace, with a dedicated butler to arrange your days.",
    images: [img("room3", "Aberash Residence living room"), img("hero", "Main pavilion and pool"), img("dine", "Private dining")],
    amenities: ["Dedicated butler", "Private dining room", "Wraparound terrace", "Two en-suite bathrooms", "Airport transfer included", "Breakfast included"],
  },
];

export const fallbackExperiences: Experience[] = [
  {
    title: "The coffee",
    italic: "ceremony",
    text: "Green beans washed, roasted and ground by hand, poured in three rounds — abol, tona, baraka. The way Ethiopia has welcomed guests for centuries.",
    image: img("coffee", "Coffee ceremony"),
    cta: "Reserve a ceremony",
  },
  {
    title: "Sunrise on",
    italic: "the lake",
    text: "Glide out by canoe as the mist lifts off the crater. Pelicans, kingfishers and the sound of nothing at all.",
    image: img("jetty", "Jetty on the lake at sunrise"),
    cta: "Book at the front desk",
  },
  {
    title: "Crater rim",
    italic: "walks",
    text: "Guided walks between Bishoftu's crater lakes, past farmsteads and acacia, ending with a picnic above the water.",
    image: img("highlands", "Mist over the highlands"),
    cta: "See the routes",
  },
  {
    title: "Afternoons by",
    italic: "the pool",
    text: "A heated pool open to the highland sky, cabanas in the shade and fresh juice brought to your lounger.",
    image: img("pool2", "Pool among the palms"),
    cta: "Plan your day",
  },
];

export const fallbackTestimonials: Testimonial[] = [
  { text: "We came for two nights and stayed five. The mornings on that lake are something I will carry with me for years.", who: "[Guest name] · [Country]" },
  { text: "The coffee ceremony on our first evening set the tone — every detail felt considered, and nothing felt rushed.", who: "[Guest name] · [Country]" },
  { text: "Close enough to Addis for a weekend, far enough to forget it. Our favourite place in Ethiopia.", who: "[Guest name] · [Country]" },
];

export const fallbackVenues: Venue[] = [
  {
    name: "Lakehouse Kitchen",
    kind: "All-day dining",
    hours: "06:30 – 22:30",
    text: "Highland produce, injera from our own teff, and fish from the lake — served on the terrace as the sun goes down.",
    image: img("dine", "Dinner at Lakehouse Kitchen"),
  },
  {
    name: "Buna Bar",
    kind: "Coffee & cocktails",
    hours: "10:00 – 00:00",
    text: "Single-origin coffee by day, honey wine and Ethiopian-spiced cocktails by night, beside an open fire.",
    image: img("dine2", "Buna Bar interior"),
  },
  {
    name: "The Jetty Table",
    kind: "Private dining",
    hours: "By reservation",
    text: "A candlelit table for two at the end of the jetty, with a tasting menu composed around your evening.",
    image: img("food", "Plates from the kitchen"),
  },
];

export const fallbackTreatments: Treatment[] = [
  { name: "Buna Coffee Scrub", duration: "60 min", text: "Freshly ground coffee and shea butter to polish and awaken the skin." },
  { name: "Highland Honey Wrap", duration: "75 min", text: "Wild Ethiopian honey and herbs, followed by a slow scalp massage." },
  { name: "Lakeside Deep Tissue", duration: "90 min", text: "Firm, unhurried bodywork in a treatment room open to the water." },
  { name: "Hammam Ritual", duration: "120 min", text: "Steam, black soap, kessa scrub and a warm oil massage to close." },
];

const defaultCta = { image: img("villa", "Deck and pool at the water's edge"), eyebrow: "Reserve your stay", title: "Your stay begins at / *the water's edge*" };

export const fallbackHome: HomePage = {
  hero: { image: img("hero", "Aberash Lodge pavilion and pool overlooking the lake"), eyebrow: "Lake Bishoftu · Ethiopian Highlands", title: "Where the lake / *remembers* your name" },
  intro: {
    label: "Welcome",
    statement:
      "A quiet lodge on the rim of an ancient crater lake. Mornings arrive in mist, afternoons in highland sun, and evenings close with coffee poured three times — the Ethiopian way. Come for a night; stay for the stillness.",
    imageLarge: img("jetty", "Private jetty on the still lake at dawn"),
    imageSmall: img("coffee", "Guests sharing coffee"),
    body: "Forty-five kilometres from Addis Ababa, the city falls away and the crater lakes of Bishoftu open up. Aberash is a small lodge on the water — built from local stone and eucalyptus, run by people who grew up on these shores.",
    linkLabel: "Discover the lodge",
  },
  marquee: ["Stillness", "Crater lakes", "Highland air", "Coffee ceremony", "Slow mornings", "Lakeside dining"],
  roomsSection: { eyebrow: "Rooms & Suites", title: "Rest, *unhurried*" },
  experiencesSection: {
    eyebrow: "Experiences",
    title: "Days shaped by / *the highlands*",
    text: "Slow mornings on the water, coffee roasted over open embers, long walks along the crater rim. Each day is composed around you — or left entirely open.",
  },
  stats: [
    { value: "1920", unit: "m", label: "Above sea level" },
    { value: "45", unit: "km", label: "From Addis Ababa" },
    { value: "[00]", unit: "", label: "Lakeside residences" },
  ],
  dining: {
    href: "/dining",
    image: img("dine", "Candlelit dinner at the lakeside restaurant"),
    eyebrow: "Dining",
    title: "Lakehouse *Kitchen*",
    text: "Highland produce, injera from our own teff, and fish from the lake — served on the terrace as the sun goes down.",
    cta: "View menus",
  },
  spa: {
    href: "/spa",
    image: img("spa", "Massage treatment at the spa"),
    eyebrow: "Spa & Wellness",
    title: "The *Quiet* House",
    text: "Rituals with coffee, honey and highland herbs. A hammam, steam room and treatment suites facing the water.",
    cta: "Explore treatments",
  },
  gallerySection: { title: "Moments at *Aberash*", linkLabel: "Open the gallery" },
  cta: defaultCta,
};

export const fallbackRoomsPage: RoomsPage = {
  hero: {
    image: img("terrace", "Terrace loungers facing the highlands at sunset"),
    eyebrow: "Rooms & Suites",
    title: "A room with / *a horizon*",
    text: "Every residence faces the water or the hills. Natural stone, hand-woven textiles by local artisans, and nothing to break the view.",
  },
  comfortsEyebrow: "In every residence",
  comfortsTitle: "Small comforts, *carefully chosen*",
  comforts: [
    { title: "Ethiopian coffee", text: "Single-origin beans and a jebena in every room." },
    { title: "Hand-woven linens", text: "Cotton gabi and netela from local weavers." },
    { title: "Airport transfer", text: "Private car from Bole International on request." },
    { title: "Fast Wi-Fi", text: "Throughout the lodge — and easy to switch off." },
  ],
  cta: { image: img("jetty", "Jetty on the lake"), eyebrow: "We're happy to help", title: "Not sure which to *choose?*" },
};

export const fallbackDiningPage: DiningPage = {
  hero: {
    image: img("dine", "Candlelit dinner"),
    eyebrow: "Dining",
    title: "From the lake, / *the field, the fire*",
    text: "Three places to eat and drink, each with a view of the water. Ingredients come from our garden, our neighbours and the lake itself.",
  },
  statement:
    "Our kitchen cooks the way Ethiopian families do — slowly, generously, and with spice blended by hand. Berbere from the market in Bishoftu, teff from the highlands, coffee from Sidamo and Yirgacheffe.",
  cta: { image: img("food", "Plates from the kitchen"), eyebrow: "Stay & dine", title: "Dinner is better / *when you stay the night*" },
};

export const fallbackSpaPage: SpaPage = {
  hero: {
    image: img("spa", "Spa treatment"),
    eyebrow: "Spa & Wellness",
    title: "The Quiet / *House*",
    text: "A hammam, steam room and four treatment suites facing the water. Rituals built on Ethiopian coffee, wild honey and highland herbs.",
  },
  philosophyEyebrow: "Philosophy",
  philosophyTitle: "Slow down / *to the pace of the lake*",
  philosophyText:
    "Every treatment begins with a cup of buna and ends in the relaxation room above the water. Our therapists trained in Addis Ababa and abroad, and use products made with Ethiopian ingredients wherever we can.",
  philosophyImage: img("spa2", "Spa amenities"),
  menuEyebrow: "Signature rituals",
  menuTitle: "Treatments *menu*",
  cta: { image: img("pool2", "Pool among the palms"), eyebrow: "Wellness stays", title: "Three nights to *reset*" },
};

export const fallbackExperiencesPage: ExperiencesPage = {
  hero: {
    image: img("highlands", "Mist over the highlands"),
    eyebrow: "Experiences",
    title: "Days shaped by / *the highlands*",
    text: "Arrange any of these with reception before you arrive or on the day. Most are included in your stay; some are private by request.",
  },
  cta: { ...defaultCta, image: img("jetty", "Jetty on the lake") },
};

export const fallbackGalleryPage: GalleryPage = {
  hero: { image: img("villa", "Deck at the water's edge"), eyebrow: "Gallery", title: "Moments at / *Aberash*" },
  images: [
    img("hero", "Main pavilion and pool"),
    img("jetty", "Jetty on the lake at dawn"),
    img("room1", "Lakeside Suite bedroom"),
    img("coffee", "Coffee shared between friends"),
    img("highlands", "Mist over the highlands"),
    img("spa", "Spa treatment"),
    img("food", "Plates from the kitchen"),
    img("villa", "Deck and pool at the water's edge"),
    img("room3", "Aberash Residence"),
    img("dine", "Dinner at Lakehouse Kitchen"),
    img("pool2", "Pool among the palms"),
    img("terrace", "Sunset terrace"),
    img("room2", "Garden Villa"),
    img("pool", "Pool at dusk"),
    img("spa2", "Spa amenities"),
    img("dine2", "Buna Bar interior"),
    img("room4", "Highland Room"),
  ],
};

export const fallbackContactPage: ContactPage = {
  hero: { image: img("terrace", "Sunset terrace"), eyebrow: "Contact", title: "We'd love to / *hear from you*" },
  formTitle: "Send us *a message*",
};
