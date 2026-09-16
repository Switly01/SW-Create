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
    let progress = 0;
    let previousTime = performance.now();
    ring.style.transform = "none";

    const paint = (time: number) => {
      const mobile = window.innerWidth < 700;
      const delta = Math.min(34, Math.max(0, time - previousTime));
      previousTime = time;
      progress += reducedMotion ? 0 : delta * .00032;

      const radiusX = mobile ? 250 : Math.min(window.innerWidth * .43, 620);
      const radiusZ = mobile ? 145 : 220;
      items.forEach((item, index) => {
        let distance = (index - progress + items.length / 2) % items.length;
        if (distance < 0) distance += items.length;
        distance -= items.length / 2;
        const visibleRadius = mobile ? 3.4 : 5.4;
        const absoluteDistance = Math.abs(distance);
        if (absoluteDistance > visibleRadius + 1) {
          item.style.opacity = "0";
          item.style.visibility = "hidden";
          return;
        }

        const position = distance / visibleRadius;
        const angle = position * 1.18;
        const x = Math.sin(angle) * radiusX;
        const depth = Math.max(0, Math.cos(angle));
        const depthEase = depth * depth * (3 - 2 * depth);
        const y = -30 + depthEase * (mobile ? 66 : 92);
        // Keep every card on a generously sized render surface and only scale
        // it down. Upscaling a small GPU layer during the orbit made otherwise
        // high-resolution artwork look visibly pixelated.
        const scale = .34 + depthEase * .14;
        const edgeFade = Math.max(0, Math.min(1, visibleRadius + 1 - absoluteDistance));
        const smoothEdge = edgeFade * edgeFade * (3 - 2 * edgeFade);
        const visibility = smoothEdge * (.36 + depthEase * .64);
        const orbitZ = (depthEase - .5) * radiusZ * 1.65;
        const yaw = position * (mobile ? -10 : -16);
        const pitch = -6 + depthEase * 3;
        item.style.transform = `translate3d(${x}px, ${y}px, ${orbitZ}px) rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${scale})`;
        item.style.opacity = String(visibility);
        item.style.visibility = visibility < .015 ? "hidden" : "visible";
        item.style.filter = "none";
        item.style.zIndex = String(10 + Math.round(depthEase * 100));
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
              loading={index < 8 || index >= galleryFrames.length - 7 ? "eager" : "lazy"}
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
