"use client";

import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";

type ClickTarget = "ROUTE" | "WHATSAPP" | "PHONE" | "INSTAGRAM";
type ClickEntityType = "EVENT" | "ESTABLISHMENT" | "ARTIST";

export function TrackedLink({
  href,
  target,
  entityType,
  entityId,
  className,
  children,
  external = true,
}: {
  href: string;
  target: ClickTarget;
  entityType: ClickEntityType;
  entityId: string;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const pathname = usePathname();

  return (
    <a
      href={href}
      className={className}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={() => {
        void fetch(`${API_URL}/public/clicks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target, entityType, entityId, path: pathname }),
          keepalive: true,
        }).catch(() => undefined);
      }}
    >
      {children}
    </a>
  );
}
