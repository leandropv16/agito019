import { Label as RadixLabel } from "@radix-ui/react-label";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<typeof RadixLabel>) {
  return <RadixLabel className={cn("text-sm font-medium text-muted-foreground", className)} {...props} />;
}
