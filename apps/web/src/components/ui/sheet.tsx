"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { MountFade } from "@/components/agito/motion";
import { Button } from "./button";

export function Sheet({
  trigger,
  title,
  children,
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border border-border bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[min(100%,380px)] md:rounded-none md:rounded-l-3xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-display text-lg">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Fechar">
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          {children ? <MountFade>{children}</MountFade> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
