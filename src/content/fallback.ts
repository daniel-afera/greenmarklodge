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

/** Client photos (WebP, made by `npm run photos` from client-assets/). */
const DIMS: Record<string, [number, number]> = {
  "bar": [1800, 2400],
  "buffet-2": [2400, 1800],
  "buffet": [2400, 1800],
  "cottage-2": [2400, 1800],
  "cottage-bath": [2400, 1800],
  "cottage-room": [1800, 2400],
  "cottage-terrace": [2400, 1800],
  "cottage": [2400, 1800],
  "cottages-2": [2400, 1800],
  "cottages": [2400, 1800],
  "double-room-2": [2400, 1800],
  "double-room-3": [1800, 2400],
  "double-room": [2400, 1800],
  "entrance-drive": [1800, 2400],
  "entrance": [2400, 1800],
  "garden-drive": [1800, 2400],
  "garden-event-2": [2400, 1800],
  "garden-event": [2400, 1800],
  "garden-restaurant": [2400, 1800],
  "gardens-2": [2400, 1800],
  "gardens": [1800, 2400],
  "green-path": [1800, 2400],
  "greenery": [2400, 1800],
  "king-bath": [2400, 1800],
  "king-room-2": [2400, 1800],
  "king-room-3": [1800, 2400],
  "king-room": [2400, 1800],
  "lounge": [1800, 2400],
  "main-building-2": [2400, 1800],
  "main-building-3": [2400, 1800],
  "main-building-4": [1800, 2400],
  "main-building": [2400, 1800],
  "residence-bedroom": [2400, 1800],
  "residence-dining": [2400, 1800],
  "residence-kitchen": [2400, 1800],
  "residence-lounge": [2400, 1800],
  "residence": [2400, 1800],
  "restaurant-tables": [2400, 1800],
  "restaurant": [2400, 1800],
  "sunset-2": [1169, 872],
  "sunset": [1169, 884],
  "tree-drive": [1800, 2400],
  "villas": [2400, 1800],
  "wood-room": [2400, 1800],
};

export const img = (name: keyof typeof DIMS, alt: string): Img => ({
  src: `/images/${name}.webp`,
  alt,
  width: DIMS[name][0],
  height: DIMS[name][1],
});

export const fallbackSettings: SiteSettings = {
  name: "Green Mark",
  tagline: "Lodge · Bishoftu",
  description:
    "A quiet luxury lodge on the rim of a crater lake in Bishoftu, Ethiopia — lakeside suites, highland dining, spa rituals and the Ethiopian coffee ceremony.",
  phone: "+251 00 000 0000",
  whatsapp: "+251 00 000 0000",
  email: "reservations@greenmarklodge.com",
  address: { line1: "Lake Bishoftu", line2: "Bishoftu, Oromia", country: "Ethiopia" },
  mapEmbed: "https://www.google.com/maps?q=Lake+Bishoftu,+Ethiopia&z=13&output=embed",
  directions: "About an hour's drive from Bole International Airport. We're happy to arrange a private transfer.",
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "TripAdvisor", href: "https://tripadvisor.com" },
  ],
  shareImage: img("main-building", "Green Mark Lodge main building"),
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
    images: [img("king-room", "Lakeside Suite bedroom"), img("king-room-2", "King bed and wardrobe"), img("king-room-3", "Bedroom window onto the garden"), img("king-bath", "Suite bathroom")],
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
    images: [img("cottage", "Garden Villa — a round thatched cottage"), img("cottage-room", "Garden Villa bedroom"), img("cottage-bath", "Garden Villa bathroom")],
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
    images: [img("double-room", "Highland Room"), img("double-room-2", "Highland Room with wardrobe"), img("double-room-3", "Morning light through the window")],
    amenities: ["Hillside balcony", "Rain shower", "Work desk", "Jebena coffee set", "Fast Wi-Fi", "Breakfast included"],
  },
  {
    slug: "green-mark-residence",
    name: "Green Mark Residence",
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
    images: [img("residence-lounge", "Green Mark Residence living room"), img("residence-kitchen", "Kitchen and dining table"), img("residence-dining", "Lounge and dining area"), img("residence-bedroom", "Residence bedroom")],
    amenities: ["Dedicated butler", "Private dining room", "Wraparound terrace", "Two en-suite bathrooms", "Airport transfer included", "Breakfast included"],
  },
];

export const fallbackExperiences: Experience[] = [
  {
    title: "The coffee",
    italic: "ceremony",
    text: "Green beans washed, roasted and ground by hand, poured in three rounds — abol, tona, baraka. The way Ethiopia has welcomed guests for centuries.",
    image: img("garden-event-2", "Evening gathering in the garden"),
    cta: "Reserve a ceremony",
  },
  {
    title: "Sunrise on",
    italic: "the lake",
    text: "Glide out by canoe as the mist lifts off the crater. Pelicans, kingfishers and the sound of nothing at all.",
    image: img("sunset", "Sunset over the cottages"),
    cta: "Book at the front desk",
  },
  {
    title: "Crater rim",
    italic: "walks",
    text: "Guided walks between Bishoftu's crater lakes, past farmsteads and acacia, ending with a picnic above the water.",
    image: img("tree-drive", "Tree-lined drive through the grounds"),
    cta: "See the routes",
  },
  {
    title: "Afternoons by",
    italic: "the pool",
    text: "A heated pool open to the highland sky, cabanas in the shade and fresh juice brought to your lounger.",
    image: img("gardens", "The lodge gardens"),
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
    image: img("main-building-2", "Lakehouse Kitchen in the main building"),
  },
  {
    name: "Buna Bar",
    kind: "Coffee & cocktails",
    hours: "10:00 – 00:00",
    text: "Single-origin coffee by day, honey wine and Ethiopian-spiced cocktails by night, beside an open fire.",
    image: img("bar", "Buna Bar"),
  },
  {
    name: "The Jetty Table",
    kind: "Private dining",
    hours: "By reservation",
    text: "A candlelit table for two at the end of the jetty, with a tasting menu composed around your evening.",
    image: img("buffet-2", "Buffet in the garden restaurant"),
  },
];

export const fallbackTreatments: Treatment[] = [
  { name: "Buna Coffee Scrub", duration: "60 min", text: "Freshly ground coffee and shea butter to polish and awaken the skin." },
  { name: "Highland Honey Wrap", duration: "75 min", text: "Wild Ethiopian honey and herbs, followed by a slow scalp massage." },
  { name: "Lakeside Deep Tissue", duration: "90 min", text: "Firm, unhurried bodywork in a treatment room open to the water." },
  { name: "Hammam Ritual", duration: "120 min", text: "Steam, black soap, kessa scrub and a warm oil massage to close." },
];

const defaultCta = { image: img("cottage-terrace", "Cottage terrace opening onto the garden"), eyebrow: "Reserve your stay", title: "Your stay begins at / *the water's edge*" };

export const fallbackHome: HomePage = {
  hero: { image: img("main-building", "Green Mark Lodge main building among the trees"), eyebrow: "Lake Bishoftu · Ethiopian Highlands", title: "Where the lake / *remembers* your name" },
  intro: {
    label: "Welcome",
    statement:
      "A quiet lodge on the rim of an ancient crater lake. Mornings arrive in mist, afternoons in highland sun, and evenings close with coffee poured three times — the Ethiopian way. Come for a night; stay for the stillness.",
    imageLarge: img("garden-drive", "Garden drive shaded by trees"),
    imageSmall: img("garden-restaurant", "Garden restaurant under the canopy"),
    body: "Forty-five kilometres from Addis Ababa, the city falls away and the crater lakes of Bishoftu open up. Green Mark is a small lodge on the water — built from local stone and eucalyptus, run by people who grew up on these shores.",
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
    image: img("restaurant-tables", "Tables in the garden restaurant"),
    eyebrow: "Dining",
    title: "Lakehouse *Kitchen*",
    text: "Highland produce, injera from our own teff, and fish from the lake — served on the terrace as the sun goes down.",
    cta: "View menus",
  },
  spa: {
    href: "/spa",
    image: img("gardens-2", "Quiet corner of the gardens"),
    eyebrow: "Spa & Wellness",
    title: "The *Quiet* House",
    text: "Rituals with coffee, honey and highland herbs. A hammam, steam room and treatment suites facing the water.",
    cta: "Explore treatments",
  },
  gallerySection: { title: "Moments at *Green Mark*", linkLabel: "Open the gallery" },
  cta: defaultCta,
};

export const fallbackRoomsPage: RoomsPage = {
  hero: {
    image: img("cottages", "Round thatched cottages"),
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
  cta: { image: img("cottage-terrace", "Cottage terrace"), eyebrow: "We're happy to help", title: "Not sure which to *choose?*" },
};

export const fallbackDiningPage: DiningPage = {
  hero: {
    image: img("restaurant", "The garden restaurant"),
    eyebrow: "Dining",
    title: "From the lake, / *the field, the fire*",
    text: "Three places to eat and drink, each with a view of the water. Ingredients come from our garden, our neighbours and the lake itself.",
  },
  statement:
    "Our kitchen cooks the way Ethiopian families do — slowly, generously, and with spice blended by hand. Berbere from the market in Bishoftu, teff from the highlands, coffee from Sidamo and Yirgacheffe.",
  cta: { image: img("buffet", "Buffet at the garden restaurant"), eyebrow: "Stay & dine", title: "Dinner is better / *when you stay the night*" },
};

export const fallbackSpaPage: SpaPage = {
  hero: {
    image: img("greenery", "Lush greenery in the gardens"),
    eyebrow: "Spa & Wellness",
    title: "The Quiet / *House*",
    text: "A hammam, steam room and four treatment suites facing the water. Rituals built on Ethiopian coffee, wild honey and highland herbs.",
  },
  philosophyEyebrow: "Philosophy",
  philosophyTitle: "Slow down / *to the pace of the lake*",
  philosophyText:
    "Every treatment begins with a cup of buna and ends in the relaxation room above the water. Our therapists trained in Addis Ababa and abroad, and use products made with Ethiopian ingredients wherever we can.",
  philosophyImage: img("green-path", "Green path through the grounds"),
  menuEyebrow: "Signature rituals",
  menuTitle: "Treatments *menu*",
  cta: { image: img("sunset-2", "Sunset over the cottages"), eyebrow: "Wellness stays", title: "Three nights to *reset*" },
};

export const fallbackExperiencesPage: ExperiencesPage = {
  hero: {
    image: img("garden-event", "Celebration in the garden"),
    eyebrow: "Experiences",
    title: "Days shaped by / *the highlands*",
    text: "Arrange any of these with reception before you arrive or on the day. Most are included in your stay; some are private by request.",
  },
  cta: { ...defaultCta, image: img("sunset-2", "Sunset over the cottages") },
};

export const fallbackGalleryPage: GalleryPage = {
  hero: { image: img("entrance", "Entrance to the main building"), eyebrow: "Gallery", title: "Moments at / *Green Mark*" },
  images: [
    img("main-building", "Green Mark Lodge main building"),
    img("cottages", "Round thatched cottages"),
    img("garden-restaurant", "Garden restaurant under the canopy"),
    img("king-room", "King bedroom"),
    img("sunset", "Sunset over the cottages"),
    img("residence-lounge", "Residence living room"),
    img("main-building-3", "Main building entrance"),
    img("garden-event", "Celebration in the garden"),
    img("cottage", "Thatched cottage"),
    img("restaurant", "The garden restaurant"),
    img("tree-drive", "Tree-lined drive"),
    img("bar", "Buna Bar"),
    img("wood-room", "Bedroom with wooden floor"),
    img("villas", "Villas and flowerbeds"),
    img("lounge", "Lounge in the main building"),
    img("buffet", "Buffet at the garden restaurant"),
    img("main-building-4", "Main building through the trees"),
    img("residence", "Residence living space"),
    img("cottages-2", "Cottages along the drive"),
    img("gardens", "The lodge gardens"),
    img("cottage-2", "Cottage terrace"),
    img("double-room", "Highland Room"),
  ],
};

export const fallbackContactPage: ContactPage = {
  hero: { image: img("entrance-drive", "Garden entrance drive"), eyebrow: "Contact", title: "We'd love to / *hear from you*" },
  formTitle: "Send us *a message*",
};
