import type { CommercialBadge } from "./shared";
import { publicAssetUrl } from "./timezone";

export function mapMedia(
  items: Array<{
    isCover: boolean;
    sortOrder: number;
    media: {
      id: string;
      path: string;
      thumbnailPath: string | null;
      altText: string | null;
      width: number | null;
      height: number | null;
    };
  }>,
) {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.media.id,
      url: publicAssetUrl(item.media.path),
      thumbnailUrl: publicAssetUrl(item.media.thumbnailPath),
      altText: item.media.altText,
      width: item.media.width,
      height: item.media.height,
      isCover: item.isCover,
    }));
}

export function coverOf(
  items: Array<{
    isCover: boolean;
    sortOrder: number;
    media: { path: string; thumbnailPath: string | null; altText: string | null };
  }>,
) {
  const ordered = [...items].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
  const first = ordered[0];
  if (!first) {
    return null;
  }
  return {
    url: publicAssetUrl(first.media.path),
    thumbnailUrl: publicAssetUrl(first.media.thumbnailPath),
    altText: first.media.altText,
  };
}

type CampaignLike = {
  paymentStatus: string;
  startsAt: Date;
  endsAt: Date;
  plan: {
    slug: string;
    highlighted: boolean;
    priority: number;
    showPhoto?: boolean;
    showInstagram?: boolean;
    showWebsite?: boolean;
    showMap?: boolean;
    showArtist?: boolean;
    showArtistInstagram?: boolean;
  };
};

export type CardVisibility = {
  showPhoto: boolean;
  showInstagram: boolean;
  showWebsite: boolean;
  showMap: boolean;
  showArtist: boolean;
  showArtistInstagram: boolean;
};

export function activeCampaigns<T extends CampaignLike>(campaigns: T[], now = new Date()) {
  return campaigns.filter(
    (item) => item.paymentStatus === "PAID" && item.startsAt <= now && item.endsAt >= now,
  );
}

export function commercialBadge(campaigns: CampaignLike[], now = new Date()): CommercialBadge {
  const best = activeCampaigns(campaigns, now).sort((a, b) => b.plan.priority - a.plan.priority)[0];
  if (!best) {
    return null;
  }
  if (best.plan.slug === "patrocinado" || best.plan.priority >= 100) {
    return "PATROCINADO";
  }
  if (best.plan.highlighted) {
    return "DESTAQUE";
  }
  return null;
}

export function listingPriority(campaigns: CampaignLike[], now = new Date()) {
  return activeCampaigns(campaigns, now).reduce((max, item) => Math.max(max, item.plan.priority), 0);
}

export function cardVisibility(campaigns: CampaignLike[], now = new Date()): CardVisibility {
  const best = activeCampaigns(campaigns, now).sort((a, b) => b.plan.priority - a.plan.priority)[0];
  if (!best) {
    return {
      showPhoto: true,
      showInstagram: false,
      showWebsite: false,
      showMap: false,
      showArtist: true,
      showArtistInstagram: false,
    };
  }
  return {
    showPhoto: best.plan.showPhoto ?? true,
    showInstagram: best.plan.showInstagram ?? false,
    showWebsite: best.plan.showWebsite ?? false,
    showMap: best.plan.showMap ?? false,
    showArtist: best.plan.showArtist ?? true,
    showArtistInstagram: best.plan.showArtistInstagram ?? false,
  };
}
