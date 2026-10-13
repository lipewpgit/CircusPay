"use client";

import { useEffect } from "react";

export function LandingEffects() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".landing-page");
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.14 },
    );

    revealItems.forEach((item) => observer.observe(item));

    const handlePointer = (event: PointerEvent) => {
      if (!page) return;
      page.style.setProperty("--pointer-x", `${event.clientX}px`);
      page.style.setProperty("--pointer-y", `${event.clientY}px`);
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", handlePointer);
    };
  }, []);

  return null;
}
