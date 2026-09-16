import { useEffect, useRef } from "react";

const galleryFrames: ReadonlyArray<readonly [string, string]> = [
  ["/editorial/gallery-native-prototype.webp", "center center"],
  ["/editorial/gallery-native-stage.webp", "center center"],
  ["/editorial/gallery-native-hardware.webp", "center center"],
  ["/editorial/gallery-native-film.webp", "center center"],
  ["/editorial/gallery-native-infrastructure.webp", "center center"],
  ["/editorial/gallery-native-light-space.webp", "center center"],
  ["/editorial/gallery-native-sound.webp", "center center"],
  ["/editorial/gallery-native-studio-team.webp", "center center"],
  ["/editorial/gallery-native-robotics.webp", "center center"],
  ["/editorial/gallery-native-optics.webp", "center center"],
  ["/editorial/gallery-native-materials.webp", "center center"],
  ["/editorial/gallery-native-virtual-production.webp", "center center"],
  ["/editorial/gallery-native-print.webp", "center center"],
  ["/editorial/gallery-native-wind-tunnel.webp", "center center"],
  ["/editorial/gallery-native-computer-vision.webp", "center center"],
  ["/editorial/gallery-native-projection.webp", "center center"],
  ...Array.from({ length: 84 }, (_, index) => [
    `/editorial/gallery-orbit-${String(index + 17).padStart(3, "0")}.webp`,
    "center center",
  ] as const),
];

export function SpiralGallery() {
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const ring = gallery.querySelector<HTMLElement>("[data-gallery-ring]");
    if (!ring) return;
    const items = Array.from(ring.querySelectorAll<HTMLElement>("figure"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const startedAt = performance.now();
    const holdDuration = 2200;
    const transitionDuration = 1400;
    const cycleDuration = holdDuration + transitionDuration;
    ring.style.transform = "none";

    const paint = (time: number) => {
      const elapsed = reducedMotion ? 0 : Math.max(0, time - startedAt);
      const currentIndex = Math.floor(elapsed / cycleDuration) % items.length;
      const nextIndex = (currentIndex + 1) % items.length;
      const phase = elapsed % cycleDuration;
      const linearBlend = Math.max(0, Math.min(1, (phase - holdDuration) / transitionDuration));
      const blend = linearBlend * linearBlend * linearBlend * (linearBlend * (linearBlend * 6 - 15) + 10);

      items.forEach((item, index) => {
        if (index !== currentIndex && index !== nextIndex) {
          item.style.opacity = "0";
          item.style.visibility = "hidden";
          return;
        }

        const incoming = index === nextIndex;
        const opacity = incoming ? blend : 1 - blend;
        const translateX = incoming ? (1 - blend) * 18 : blend * -14;
        const translateY = incoming ? (1 - blend) * 8 : blend * -5;
        const scale = incoming ? .985 + blend * .015 : 1 - blend * .018;
        item.style.transform = `translate3d(${translateX}px, ${translateY}px, ${incoming ? 8 : 0}px) scale(${scale})`;
        item.style.opacity = String(opacity);
        item.style.visibility = opacity < .004 ? "hidden" : "visible";
        item.style.filter = "none";
        item.style.zIndex = incoming ? "2" : "1";
      });
      frame = window.requestAnimationFrame(paint);
    };

    frame = window.requestAnimationFrame(paint);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="cinematic-gallery" ref={galleryRef} aria-hidden="true">
      <div className="cinematic-gallery-track cinematic-gallery-ring-primary" data-gallery-ring="outer">
        {galleryFrames.map(([src, position], index) => (
          <figure key={`${src}-${index}`}>
            <img
              src={src}
              alt=""
              draggable={false}
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              style={{ objectPosition: position }}
            />
            <span>SW</span>
          </figure>
        ))}
      </div>
    </div>
  );
}
