"use client";

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function mobileMotion() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function canHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function duration(desktop: number) {
  if (mobileMotion()) return Math.min(0.4, desktop * 0.55);
  return desktop;
}

function playFrom(
  target: gsap.TweenTarget,
  vars: gsap.TweenVars,
) {
  if (reducedMotion()) return null;
  return gsap.from(target, {
    ease: "power3.out",
    ...vars,
    duration: duration(typeof vars.duration === "number" ? vars.duration : 0.7),
    stagger: mobileMotion()
      ? Math.min(0.05, typeof vars.stagger === "number" ? vars.stagger : 0.05)
      : vars.stagger,
  });
}

export function MotionRefresh() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    if (reducedMotion()) return;
    const id = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}

export function Intro({
  children,
  className,
  selector = "[data-intro]",
}: {
  children: ReactNode;
  className?: string;
  selector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion()) return;
    const bits = root.querySelectorAll(selector);
    if (!bits.length) return;
    const ctx = gsap.context(() => {
      playFrom(bits, { autoAlpha: 0, y: mobileMotion() ? 12 : 22, duration: 0.75, stagger: 0.09 });
    }, root);
    return () => ctx.revert();
  }, [selector]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const ctx = gsap.context(() => {
      playFrom(el, {
        autoAlpha: 0,
        y: mobileMotion() ? 12 : 28,
        duration: 0.8,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion()) return;
    const items = root.querySelectorAll(":scope > [data-stagger]");
    if (!items.length) return;
    const ctx = gsap.context(() => {
      playFrom(items, {
        autoAlpha: 0,
        y: mobileMotion() ? 10 : 22,
        duration: 0.65,
        stagger: 0.07,
        scrollTrigger: { trigger: root, start: "top 90%", once: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function MountFade({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, duration: duration(0.32), ease: "power2.out", clearProps: "transform" },
    );
    return () => {
      tween.kill();
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function HeroCue() {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const root = ref.current?.parentElement;
    if (!root || reducedMotion()) return;
    const bits = root.querySelectorAll("[data-hero]");
    const media = root.querySelector("[data-hero-media]");
    const ctx = gsap.context(() => {
      if (media) {
        gsap.fromTo(
          media,
          { scale: mobileMotion() ? 1.03 : 1.06 },
          { scale: 1, duration: duration(1.15), ease: "power2.out" },
        );
      }
      if (bits.length) {
        playFrom(bits, { autoAlpha: 0, y: mobileMotion() ? 10 : 18, duration: 0.7, stagger: 0.07 });
      }
    }, root);
    return () => ctx.revert();
  }, []);
  return <span ref={ref} className="sr-only" aria-hidden="true" />;
}

export function useRailMotion(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion()) return;
    const head = root.querySelector("[data-rail-head]");
    const cards = root.querySelectorAll("[data-rail-card]");
    const ctx = gsap.context(() => {
      if (head) playFrom(head, { autoAlpha: 0, y: 12, duration: 0.55 });
      if (cards.length) {
        playFrom(cards, {
          autoAlpha: 0,
          y: mobileMotion() ? 8 : 16,
          duration: 0.6,
          stagger: 0.06,
          scrollTrigger: { trigger: root, start: "top 90%", once: true },
        });
      }
    }, root);
    return () => ctx.revert();
  }, [ref]);
}

export function useChromeMotion(ref: RefObject<HTMLElement | null>, kind: "header" | "footer") {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion()) return;
    const bits = root.querySelectorAll("[data-chrome]");
    if (!bits.length) return;
    const ctx = gsap.context(() => {
      playFrom(bits, {
        autoAlpha: 0,
        y: kind === "header" ? -10 : 16,
        duration: kind === "header" ? 0.5 : 0.7,
        stagger: kind === "header" ? 0.05 : 0.08,
        scrollTrigger: kind === "footer" ? { trigger: root, start: "top 94%", once: true } : undefined,
      });
    }, root);
    return () => ctx.revert();
  }, [kind, ref]);
}

export function useMenuMotion(ref: RefObject<HTMLElement | null>, open: boolean) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!open || !root || reducedMotion()) return;
    const links = root.querySelectorAll("a");
    const tween = playFrom(links, { autoAlpha: 0, y: 8, duration: 0.35, stagger: 0.04 });
    return () => {
      tween?.kill();
    };
  }, [open, ref]);
}

export function useMarkMotion(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion()) return;
    const mark = root.querySelector("[data-empty-mark]");
    const copy = root.querySelector("[data-empty-copy]");
    const bits = [mark, copy].filter(Boolean);
    if (!bits.length) return;
    const tween = playFrom(bits, { autoAlpha: 0, y: 14, scale: 0.96, duration: 0.6, stagger: 0.08 });
    return () => {
      tween?.kill();
    };
  }, [ref]);
}

export function HoverZone({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion() || !canHover()) return;
    const onOver = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest?.("[data-lift]");
      if (!target || !root.contains(target)) return;
      gsap.to(target, { y: -4, duration: 0.24, ease: "power2.out", overwrite: "auto" });
    };
    const onOut = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest?.("[data-lift]");
      if (!target || !root.contains(target)) return;
      gsap.to(target, { y: 0, duration: 0.32, ease: "power2.out", overwrite: "auto" });
    };
    root.addEventListener("mouseover", onOver);
    root.addEventListener("mouseout", onOut);
    return () => {
      root.removeEventListener("mouseover", onOver);
      root.removeEventListener("mouseout", onOut);
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
