/**
 * Built-in content: everything the site shows until the custom CMS is
 * connected, and the fallback for any field an editor leaves empty.
 * Images live in /public/images.
 */
import type {
  ContactPage,
  DiningPage,
  Experience,
  EventsPage,
  ExperiencesPage,
  GalleryPage,
  GardensPage,
  HomePage,
  Img,
  Room,
  RoomsPage,
  SiteSettings,
  Testimonial,
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
    "Green Mark Lodge in Bishoftu, Ethiopia — private villas and guest rooms surrounded by botanical gardens, with garden dining, the Buna Bar and the Ethiopian coffee ceremony.",
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
    slug: "vip-villa",
    name: "VIP Villa",
    category: "villa",
    tag: "Most space",
    view: "Garden view",
    bed: "Master, twin & 2 single bedrooms",
    maxGuests: 6,
    size: "[SIZE] m²",
    priceFrom: "[RATE]",
    short: "4 bedrooms · Salon · Open-plan kitchen",
    description:
      "Experience a more spacious and private stay in our VIP Villa. Ideal for families, groups and guests looking for additional space and privacy.",
    images: [img("residence-lounge", "VIP Villa living room"), img("residence-kitchen", "VIP Villa open-plan kitchen"), img("residence-dining", "VIP Villa salon and dining area"), img("residence-bedroom", "VIP Villa bedroom")],
    amenities: ["1 master bedroom", "2 single bedrooms", "1 twin bedroom", "Living room / salon", "Open-plan kitchen"],
  },
  {
    slug: "standard-villa",
    name: "Standard Villa",
    category: "villa",
    tag: "Families",
    view: "Garden view",
    bed: "Master, twin & single bedroom",
    maxGuests: 5,
    size: "[SIZE] m²",
    priceFrom: "[RATE]",
    short: "3 bedrooms · Salon · Open-plan kitchen",
    description:
      "Enjoy a comfortable villa experience with a welcoming living space and convenient kitchen facilities. Suitable for families and small groups seeking a relaxing stay.",
    images: [img("cottage", "Standard Villa among the gardens"), img("cottage-room", "Standard Villa bedroom"), img("cottage-bath", "Standard Villa bathroom"), img("villas", "Villas and flowerbeds")],
    amenities: ["1 master bedroom", "1 twin bedroom", "1 single bedroom", "Living room / salon", "Open-plan kitchen"],
  },
  {
    slug: "single-room",
    name: "Single Room",
    category: "room",
    tag: "Solo travellers",
    view: "Garden view",
    bed: "Single bed",
    maxGuests: 1,
    size: "[SIZE] m²",
    priceFrom: "[RATE]",
    short: "Single bed · Private shower",
    description:
      "Our individual guest rooms offer a simple and comfortable accommodation option. Ideal for individual travellers and guests looking for a convenient and relaxing stay.",
    images: [img("double-room", "Single Room"), img("double-room-2", "Single Room with wardrobe"), img("double-room-3", "Morning light through the window"), img("wood-room", "Guest room with wooden floor")],
    amenities: ["Single bedroom", "Private shower"],
  },
];

export const fallbackExperiences: Experience[] = [
  {
    title: "The coffee",
    italic: "ceremony",
    text: "Green beans washed, roasted and ground by hand, poured in three rounds — abol, tona, baraka. The way Ethiopia has welcomed guests for centuries.",
    image: img("garden-event-2", "Evening gathering in the garden"),
    images: [img("garden-event", "Celebration in the garden"), img("lounge", "The lounge"), img("garden-restaurant", "Garden restaurant under the canopy")],
  },
  {
    title: "Garden",
    italic: "walks",
    text: "Wander the pathways of our botanical gardens among greenery, flowers and diverse plant life. Stop for a photograph, or simply sit and enjoy the quiet.",
    image: img("gardens", "The lodge gardens"),
    images: [img("gardens-2", "Paths through the gardens"), img("green-path", "A green path"), img("greenery", "Greenery in the gardens")],
  },
  {
    title: "Sunrise to",
    italic: "sunset",
    text: "Gentle morning light over the gardens, and in the evening the warm colours of sunset filtering through the greenery — the loveliest hours to be outdoors.",
    image: img("sunset", "Sunset over the cottages"),
    images: [img("sunset-2", "Sunset over the cottages"), img("cottage-terrace", "Cottage terrace opening onto the garden"), img("cottages", "Round thatched cottages")],
  },
  {
    title: "Explore the",
    italic: "surroundings",
    text: "Beyond the gardens, discover nearby natural attractions, lakes and interesting destinations. Ask our team about sightseeing and local experiences.",
    image: img("tree-drive", "Tree-lined drive through the grounds"),
    images: [img("garden-drive", "Drive through the gardens"), img("entrance-drive", "The entrance drive"), img("main-building-2", "The main building")],
  },
];

export const fallbackTestimonials: Testimonial[] = [
  { text: "We came for two nights and stayed five. The mornings in those gardens are something I will carry with me for years.", who: "[Guest name] · [Country]" },
  { text: "The coffee ceremony on our first evening set the tone — every detail felt considered, and nothing felt rushed.", who: "[Guest name] · [Country]" },
  { text: "Close enough to Addis for a weekend, far enough to forget it. Our favourite place in Ethiopia.", who: "[Guest name] · [Country]" },
];

export const fallbackVenues: Venue[] = [
  {
    name: "Garden Kitchen",
    kind: "Restaurant",
    hours: "06:30 – 22:30",
    text: "Breakfast, lunch, dinner and refreshments in a relaxing garden setting — good food to share with family and friends.",
    image: img("main-building-2", "Garden Kitchen in the main building"),
  },
  {
    name: "Buna Bar",
    kind: "Coffee & cocktails",
    hours: "10:00 – 00:00",
    text: "Single-origin coffee by day, honey wine and Ethiopian-spiced cocktails by night, beside an open fire.",
    image: img("bar", "Buna Bar"),
  },
  {
    name: "The Garden Table",
    kind: "Private dining",
    hours: "By reservation",
    text: "A candlelit table for two among the gardens, with a menu composed around your evening.",
    image: img("buffet-2", "Buffet in the garden restaurant"),
  },
];

const defaultCta = { image: img("cottage-terrace", "Cottage terrace opening onto the garden"), eyebrow: "Reserve your stay", title: "Your peaceful escape, / *surrounded by nature*" };

export const fallbackHome: HomePage = {
  hero: { image: img("main-building", "Green Mark Lodge main building among the trees"), eyebrow: "Botanical gardens · Bishoftu", title: "Experience Nature. / *Discover Tranquility.*" },
  intro: {
    label: "Welcome",
    statement:
      "A peaceful escape among botanical gardens — where nature and comfort meet, from the first morning light to the last colours of sunset.",
    imageLarge: img("garden-drive", "Garden drive shaded by trees"),
    imageSmall: img("garden-restaurant", "Garden restaurant under the canopy"),
    body: "Private villas and guest rooms, garden walks and good food, close to Addis Ababa. Come for a getaway, a family holiday or a special occasion.",
    linkLabel: "Discover the gardens",
  },
  marquee: ["Botanical gardens", "Fresh air", "Coffee ceremony", "Slow mornings", "Garden dining", "Golden sunsets"],
  roomsSection: { eyebrow: "Accommodation", title: "Comfort *meets nature*" },
  experiencesSection: {
    eyebrow: "Experiences",
    title: "Days shaped by / *nature*",
    text: "Garden walks, coffee poured three times and warm sunsets through the trees. Fill each day, or leave it entirely open.",
  },
  stats: [
    { value: "1920", unit: "m", label: "Above sea level" },
    { value: "45", unit: "km", label: "From Addis Ababa" },
    { value: "3", unit: "", label: "Ways to stay" },
  ],
  dining: {
    href: "/dining",
    image: img("restaurant-tables", "Tables in the garden restaurant"),
    eyebrow: "Dining",
    title: "Good food, *beautiful setting*",
    text: "Breakfast to dinner, in a relaxed garden setting.",
    cta: "View dining",
  },
  gardens: {
    href: "/gardens",
    image: img("gardens-2", "Quiet corner of the gardens"),
    eyebrow: "The Gardens",
    title: "Botanical *gardens*",
    text: "Pathways, flowers and greenery — lovely from sunrise to sunset.",
    cta: "Explore the gardens",
  },
  gallerySection: { title: "Moments at *Green Mark*", linkLabel: "Open the gallery" },
  cta: defaultCta,
};

export const fallbackRoomsPage: RoomsPage = {
  hero: {
    image: img("cottages", "Thatched cottages among the gardens"),
    eyebrow: "Accommodation",
    title: "Comfort / *meets nature*",
    text: "Private villas and guest rooms surrounded by botanical gardens at Green Mark Lodge.",
  },
  comfortsEyebrow: "In every residence",
  comfortsTitle: "Small comforts, *carefully chosen*",
  comforts: [
    { title: "Ethiopian coffee", text: "Single-origin beans and a jebena in every room." },
    { title: "Hand-woven linens", text: "Cotton gabi and netela from local weavers." },
    { title: "Airport transfer", text: "Private car from Bole International on request." },
    { title: "Fast Wi-Fi", text: "Throughout the lodge — and easy to switch off." },
  ],
  cta: { image: img("cottage-terrace", "Cottage terrace"), eyebrow: "We're happy to help", title: "Discover your / *perfect stay*" },
};

export const fallbackDiningPage: DiningPage = {
  hero: {
    image: img("restaurant", "The garden restaurant"),
    eyebrow: "Dining",
    title: "Good food in / *a beautiful setting*",
    text: "Breakfast, lunch and dinner in a relaxed garden setting — for guests, families and visitors.",
  },
  statement: "Breakfast, lunch, dinner or a quiet coffee — good food in a relaxing garden setting, for our guests and anyone who'd like a special meal.",
  cta: { image: img("buffet", "Buffet at the garden restaurant"), eyebrow: "Stay & dine", title: "Dinner is better / *when you stay the night*" },
};

export const fallbackGardensPage: GardensPage = {
  hero: {
    image: img("greenery", "Lush greenery in the gardens"),
    eyebrow: "The Gardens",
    title: "Discover the beauty / *of nature*",
    text: "Walk the botanical gardens at Green Mark Lodge — pathways, flowers and greenery, beautiful from sunrise to sunset.",
  },
  intro: {
    eyebrow: "Botanical gardens",
    statement: "Greenery, flowers and quiet pathways — gardens made for slow walks, photographs and fresh air.",
    image: img("green-path", "Garden path through the trees"),
    highlights: ["Botanical surroundings", "Walking pathways", "Greenery and natural scenery", "Golden mornings and evenings", "Space to relax and take photos"],
  },
  moments: {
    image: img("sunset", "Sunset over the cottages"),
    title: "Sunrise *to sunset*",
    text: "Soft morning light over the gardens, and warm evening colours through the trees — the loveliest hours to be outside.",
  },
  surroundings: {
    image: img("tree-drive", "Tree-lined drive through the grounds"),
    title: "Beyond *the gardens*",
    text: "Nearby lakes, natural attractions and local sights are easy to reach. Our team is happy to help you plan.",
  },
  cta: { image: img("gardens", "The lodge gardens"), eyebrow: "Stay in the gardens", title: "Wake up / *in the gardens*" },
};

export const fallbackEventsPage: EventsPage = {
  hero: {
    image: img("garden-event", "Celebration in the garden"),
    eyebrow: "Events",
    title: "Celebrate / *in the gardens*",
    text: "Weddings, christenings, birthdays and meetings at Green Mark Lodge in Bishoftu — garden venues and a meeting hall, arranged by our team.",
  },
  intro: {
    eyebrow: "Gatherings",
    statement: "From a wedding under the trees to a quiet meeting in our hall — we host the days that matter, with food, flowers and space to gather.",
  },
  celebrations: {
    eyebrow: "Celebrations",
    title: "Your day, / *our gardens*",
    items: [
      { image: img("garden-event", "Celebration in the garden"), title: "Weddings", local: "ሰርግ", text: "Ceremony and reception among the gardens, with catering and space for family and friends." },
      { image: img("garden-event-2", "Evening gathering in the garden"), title: "Christenings", local: "ክርስትና", text: "A calm, green setting to welcome a new member of the family, with food and coffee for your guests." },
      { image: img("garden-restaurant", "Garden restaurant under the canopy"), title: "Birthdays", local: "ልደት", text: "Birthdays and anniversaries in the garden or restaurant — tell us the occasion and we'll prepare it." },
    ],
  },
  meetings: {
    eyebrow: "Meeting hall",
    title: "Meet / *among the trees*",
    text: "Our meeting hall is available to book for meetings, workshops and training days, with refreshments and lunch from our kitchen.",
    image: img("main-building-3", "The main building"),
    highlights: ["Meetings and workshops", "Training and team days", "Coffee breaks and lunch", "Rooms for overnight guests"],
    linkLabel: "Book the meeting hall",
  },
  cta: { image: img("gardens-2", "The lodge gardens"), eyebrow: "Plan your event", title: "Tell us about / *your occasion*" },
};

export const fallbackExperiencesPage: ExperiencesPage = {
  hero: {
    image: img("garden-event", "Celebration in the garden"),
    eyebrow: "Experiences",
    title: "Days shaped by / *nature*",
    text: "Coffee ceremonies, garden walks and sunsets at Green Mark Lodge — arrange any of them with reception.",
  },
  slides: [img("gardens", "The lodge gardens"), img("sunset", "Sunset over the cottages"), img("garden-event-2", "Evening gathering in the garden"), img("green-path", "A green path")],
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
