export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginatedMeta;
};

export type CommercialBadge = "DESTAQUE" | "PATROCINADO" | null;

export type MediaPublic = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  isCover: boolean;
};

export type NamedSlug = {
  id: string;
  name: string;
  slug: string;
};
