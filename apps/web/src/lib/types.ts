import type {
  AgendaStatus,
  ArtistType,
  CommercialBadge,
  EntryPriceType,
  EventFormatSlug,
  EventType,
  NamedSlug,
  Paginated,
} from "@/lib/shared";

export type Cover = { url: string | null; thumbnailUrl: string | null; altText: string | null } | null;

export type CardVisibility = {
  showPhoto: boolean;
  showInstagram: boolean;
  showWebsite: boolean;
  showMap: boolean;
  showArtist: boolean;
  showArtistInstagram: boolean;
};

export type EstablishmentCardData = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  neighborhood?: string | null;
  latitude: number;
  longitude: number;
  instagramUrl?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  googleMapsUrl?: string | null;
  city: NamedSlug;
  categories: NamedSlug[];
  audiences?: NamedSlug[];
  cover: Cover;
  badge: CommercialBadge;
  visibility?: CardVisibility;
  promotions: Array<{ id: string; title: string }>;
  nextEvent?: {
    title: string;
    slug: string;
    startAt: string;
    artists: Array<{ name: string; slug: string }>;
    genres: NamedSlug[];
  } | null;
};

export type EventCardData = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  eventType: EventType;
  format?: EventFormatSlug | null;
  startAt: string;
  endAt?: string | null;
  agendaStatus?: AgendaStatus;
  entryPriceType?: EntryPriceType | null;
  entryPriceCents?: number | null;
  cover: Cover;
  genres: NamedSlug[];
  artists: Array<{ id: string; name: string; slug: string; type: ArtistType }>;
  establishment: {
    id?: string;
    name: string;
    slug: string;
    neighborhood?: string | null;
    city: NamedSlug;
    badge?: CommercialBadge;
    latitude?: number;
    longitude?: number;
    googleMapsUrl?: string | null;
    instagramUrl?: string | null;
    whatsapp?: string | null;
    phone?: string | null;
    promotions?: Array<{ title: string }>;
  };
};

export type ArtistCardData = {
  id: string;
  name: string;
  slug: string;
  type: ArtistType;
  city?: NamedSlug | null;
  genres: NamedSlug[];
  cover: Cover;
  badge?: CommercialBadge;
  videoUrl?: string | null;
  hireUrl?: string | null;
  whatsapp?: string | null;
  instagramUrl?: string | null;
  nextEvent?: { title: string; startAt: string; establishment: string; city: string } | null;
};

export type HomePayload = {
  date: string;
  cities: NamedSlug[];
  recommendations: EventCardData[];
  featured: EstablishmentCardData[];
  liveMusic: EventCardData[];
  promotions: Array<{
    id: string;
    title: string;
    description: string | null;
    establishment: { name: string; slug: string; city: NamedSlug };
  }>;
  events: EventCardData[];
  establishments: EstablishmentCardData[];
};

export type EstablishmentList = Paginated<EstablishmentCardData>;
export type EventList = Paginated<EventCardData>;
export type ArtistList = Paginated<ArtistCardData>;

export type SeoLanding = {
  city: NamedSlug | null;
  topic: { id: string; slug: string; label: string } | null;
  when: { id: string; slug: string; label: string; date: string | null } | null;
  requestedPath: string;
  canonicalPath: string;
  isAlias: boolean;
  indexable: boolean;
  h1: string;
  title: string;
  description: string;
  intro: string;
  ogImage: string | null;
  lastmod: string;
  events: EventCardData[];
  establishments: EstablishmentCardData[];
  related: Array<{ href: string; label: string }>;
  faqs: Array<{ question: string; answer: string }>;
  breadcrumbs: Array<{ href: string; label: string }>;
};

export type SeoSitemapPayload = {
  generatedAt: string;
  entries: Array<{
    path: string;
    lastModified: string;
    changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly";
    priority: number;
  }>;
};
