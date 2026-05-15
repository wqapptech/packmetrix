import type { Lang } from "@/lib/translations";

export type { Lang };

export type TReview = {
  id: string;
  name: string;
  text: string;
  rating: number; // 1–5
  avatarUrl?: string;
  createdAt?: number;
};

export type TItineraryDay = { day: number; title: string; desc: string };
export type TPricingTier  = { label: string; price: string };
export type TAirport      = { name: string; price: string; date?: string; arrivingAirport?: string; flyingTime?: string; arrivingTime?: string };

export type TPackage = {
  id: string;
  userId?: string;
  destination: string;
  price: string;
  nights?: string | number;
  title?: string;
  description: string;
  includes?: string[];
  excludes?: string[];
  advantages?: string[];
  hotelDescription?: string;
  airports?: TAirport[];
  itinerary?: TItineraryDay[];
  pricingTiers?: TPricingTier[];
  cancellation?: string;
  whatsapp?: string;
  messenger?: string;
  coverImage?: string;
  images?: string[];
  videoUrl?: string;
  language?: string;
  isActive?: boolean;
  reviews?: TReview[];
};

export type TAgency = {
  name: string;
  tagline?: string;
  logoUrl?: string;
  brandColor?: string;
  activeTemplate?: string;
  agencySlug?: string;
  enableReviews?: boolean;
  showReviews?: boolean;
};

export type TPageProps = {
  pkg: TPackage;
  agency: TAgency;
  onWhatsApp: () => void;
  onMessenger: () => void;
  lang: Lang;
};

// Lightweight type used in the packages list
export type TListPackage = {
  id: string;
  destination: string;
  price: string;
  views: number;
  whatsappClicks: number;
  messengerClicks: number;
  createdAt?: number;
  coverImage?: string;
  images?: string[];
  agencySlug?: string;
  isActive?: boolean;
};

export type TCardProps = {
  pkg: TListPackage;
  agency: TAgency;
  lang: Lang;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  nameAr: string;
  target: string;
  targetAr: string;
  Page: React.ComponentType<TPageProps>;
  Card: React.ComponentType<TCardProps>;
  previewBg: string;
  dark?: boolean;
};

// Visual tokens passed to shared section renderers
export type TemplateTokens = {
  bg: string;
  ink: string;
  muted: string;
  superMuted: string;
  border: string;
  brand: string;
  serif: string;
  dark?: boolean;
};
