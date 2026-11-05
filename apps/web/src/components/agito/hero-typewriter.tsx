"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Descubra o melhor da região",
  "Bares, baladas e eventos no",
  "Shows e encontros no",
] as const;

const BRAND = "019";
const LONGEST = PHRASES.reduce((longest, phrase) =>
  phrase.length > longest.length ? phrase : longest,
);

const TYPE_MS = 58;
const DELETE_MS = 26;
const HOLD_MS = 1700;
const GAP_MS = 380;

function CaretSlot({ blink }: { blink: boolean }) {
  return (
    <span
      className={
        blink
          ? "agito-caret mx-px inline-block h-[0.7em] w-[2px] translate-y-[0.08em] rounded-full bg-white/75 align-middle"
          : "mx-px inline-block h-[0.7em] w-[2px] align-middle"
      }
    />
  );
}

export function HeroTypewriter() {
  const [text, setText] = useState<string>(PHRASES[0]);
  const [reduced, setReduced] = useState(false);
  const spoken = PHRASES.map((phrase) => `${phrase} ${BRAND}`).join(". ");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let alive = true;
    let timer = 0;

    const stop = () => window.clearTimeout(timer);

    const run = () => {
      stop();
      setReduced(media.matches);
      setText(PHRASES[0]);
      if (media.matches) return;

      let phraseIndex = 0;
      let charIndex = PHRASES[0].length;
      let deleting = true;

      const step = () => {
        if (!alive) return;
        const phrase = PHRASES[phraseIndex];

        if (!deleting) {
          charIndex += 1;
          setText(phrase.slice(0, charIndex));
          if (charIndex >= phrase.length) {
            deleting = true;
            timer = window.setTimeout(step, HOLD_MS);
            return;
          }
          timer = window.setTimeout(step, TYPE_MS);
          return;
        }

        charIndex -= 1;
        setText(phrase.slice(0, Math.max(charIndex, 0)));
        if (charIndex <= 0) {
          charIndex = 0;
          deleting = false;
          phraseIndex = (phraseIndex + 1) % PHRASES.length;
          timer = window.setTimeout(step, GAP_MS);
          return;
        }
        timer = window.setTimeout(step, DELETE_MS);
      };

      timer = window.setTimeout(step, HOLD_MS);
    };

    run();
    const onChange = () => run();
    media.addEventListener("change", onChange);
    return () => {
      alive = false;
      stop();
      media.removeEventListener("change", onChange);
    };
  }, []);

  const shown = reduced ? PHRASES[0] : text;

  return (
    <h1 className="relative grid w-full max-w-full font-display text-[1.65rem] font-extrabold leading-[1.15] tracking-tight text-white min-[400px]:text-3xl sm:text-5xl md:text-6xl">
      <span className="sr-only">{spoken}</span>
      <span className="invisible col-start-1 row-start-1 select-none" aria-hidden="true">
        {LONGEST}
        <CaretSlot blink={false} />{" "}
        {BRAND}
      </span>
      <span className="col-start-1 row-start-1" aria-hidden="true">
        {shown}
        {reduced ? <CaretSlot blink={false} /> : <CaretSlot blink />}{" "}
        <span className="text-[#f3e03a]">
          {BRAND}
        </span>
      </span>
    </h1>
  );
}
