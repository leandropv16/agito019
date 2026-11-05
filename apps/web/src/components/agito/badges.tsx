import type { AgendaStatus, CommercialBadge } from "@/lib/shared";
import { AGENDA_STATUS_LABELS } from "@/lib/shared";
import { Badge } from "@/components/ui/badge";

export function FeaturedBadge({ badge }: { badge?: CommercialBadge }) {
  if (!badge) return null;
  return (
    <Badge className="bg-primary text-primary-foreground">
      {badge === "PATROCINADO" ? "PATROCINADO" : "DESTAQUE"}
    </Badge>
  );
}

export function PromotionBadge({ title }: { title: string }) {
  return <Badge className="bg-accent/20 text-accent">{title}</Badge>;
}

export function AudienceBadge({ name }: { name: string }) {
  return <Badge>{name}</Badge>;
}

export function GenreBadge({ name }: { name: string }) {
  return <Badge className="bg-secondary text-foreground">{name}</Badge>;
}

export function AgendaStatusBadge({ status }: { status?: AgendaStatus | null }) {
  if (!status) return null;
  const styles =
    status === "CONFIRMED"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
      : status === "OUTDATED"
        ? "border-amber-500/40 bg-amber-500/15 text-amber-100"
        : "border-white/20 bg-white/10 text-white/85";
  return <Badge className={styles}>{AGENDA_STATUS_LABELS[status]}</Badge>;
}
