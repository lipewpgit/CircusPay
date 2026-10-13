"use client";

import { useEffect } from "react";

export function LandingEffects() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".landing-page");
    const header = document.querySelector<HTMLElement>(".landing-header");
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const tiltItems = document.querySelectorAll<HTMLElement>(".landing-feature-grid article, .award-grid article");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

    let pointerFrame = 0;
    let scrollFrame = 0;
    const handlePointer = (event: PointerEvent) => {
      if (!page) return;
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        page.style.setProperty("--pointer-x", `${event.clientX}px`);
        page.style.setProperty("--pointer-y", `${event.clientY}px`);
        page.style.setProperty("--parallax-x", `${(event.clientX / window.innerWidth - .5) * 16}px`);
        page.style.setProperty("--parallax-y", `${(event.clientY / window.innerHeight - .5) * 12}px`);
      });
    };

    const handleScroll = () => {
      if (!page) return;
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        const maximum = document.documentElement.scrollHeight - window.innerHeight;
        page.style.setProperty("--scroll-progress", `${maximum > 0 ? window.scrollY / maximum : 0}`);
        header?.classList.toggle("is-scrolled", window.scrollY > 28);
      });
    };

    const cleanups: Array<() => void> = [];
    if (!reducedMotion) {
      tiltItems.forEach((item) => {
        const move = (event: PointerEvent) => {
          const rect = item.getBoundingClientRect();
          item.style.setProperty("--tilt-x", `${((event.clientY - rect.top) / rect.height - .5) * -7}deg`);
          item.style.setProperty("--tilt-y", `${((event.clientX - rect.left) / rect.width - .5) * 7}deg`);
          item.style.setProperty("--spot-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
          item.style.setProperty("--spot-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
        };
        const leave = () => {
          item.style.setProperty("--tilt-x", "0deg");
          item.style.setProperty("--tilt-y", "0deg");
        };
        item.addEventListener("pointermove", move);
        item.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          item.removeEventListener("pointermove", move);
          item.removeEventListener("pointerleave", leave);
        });
      });
    }

    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(pointerFrame);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <>
      <div className="landing-scroll-progress" aria-hidden="true" />
      <div className="landing-film-grain" aria-hidden="true" />
    </>
  );
}
