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
    const holdDuration = 520;
    const transitionDuration = 2080;
    const cycleDuration = holdDuration + transitionDuration;
    ring.style.transform = "none";

    const paint = (time: number) => {
      const mobile = window.innerWidth < 700;
      const largeDesktop = window.innerWidth >= 1180;
      const elapsed = reducedMotion ? 0 : Math.max(0, time - startedAt);
      const completedSteps = Math.floor(elapsed / cycleDuration);
      const phase = elapsed % cycleDuration;
      const linearShift = Math.max(0, Math.min(1, (phase - holdDuration) / transitionDuration));
      const easedShift = linearShift * linearShift * linearShift * (linearShift * (linearShift * 6 - 15) + 10);
      const progress = completedSteps + easedShift;

      // A restrained vertical wheel: the next horizontal frame enters from
      // above, rounds the near side of the orbit, then exits below. The rear
      // half stays visually quiet so the hero never becomes a wall of images.
      const orbitSlots = mobile ? 8 : 10;
      const angleStep = (Math.PI * 2) / orbitSlots;
      const orbitRadius = mobile
        ? Math.min(window.innerWidth * .38, 165)
        : largeDesktop
          ? Math.min(window.innerWidth * .31, window.innerHeight * .43, 360)
          : Math.min(window.innerWidth * .245, window.innerHeight * .34, 265);
      const radiusZ = mobile ? 175 : largeDesktop ? 330 : 255;
      const renderRadius = orbitSlots / 2;

      items.forEach((item, index) => {
        let distance = (progress - index + items.length / 2) % items.length;
        if (distance < 0) distance += items.length;
        distance -= items.length / 2;
        const absoluteDistance = Math.abs(distance);
        if (absoluteDistance >= renderRadius) {
          item.style.opacity = "0";
          item.style.visibility = "hidden";
          return;
        }

        const angle = distance * angleStep;
        const x = -Math.cos(angle) * orbitRadius;
        const y = Math.sin(angle) * orbitRadius;
        const z = Math.cos(angle) * radiusZ;
        const depth = (z + radiusZ) / (radiusZ * 2);
        const depthEase = depth * depth * (3 - 2 * depth);
        const scale = .4 + Math.pow(depth, 2.4) * .46;
        const fadeProgress = Math.max(0, Math.min(1, (depth - .5) / .4));
        const visibility = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
        const orbitZ = (depth - .5) * radiusZ * 1.65;
        const yaw = Math.sin(angle) * (mobile ? 6 : 9);
        const pitch = Math.sin(angle) * (mobile ? -9 : -13);
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
