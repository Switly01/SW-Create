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
    const images = items
      .map((item) => item.querySelector<HTMLImageElement>("img"))
      .filter((image): image is HTMLImageElement => Boolean(image));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let cancelled = false;
    let preloadTimer = 0;
    let startedAt = 0;
    const holdDuration = 520;
    const transitionDuration = 2080;
    const cycleDuration = holdDuration + transitionDuration;
    ring.style.transform = "none";

    const waitForImage = (image: HTMLImageElement) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    };

    const warmRemainingImages = () => {
      const queue = images.slice(8, Math.max(8, images.length - 7));
      let cursor = 0;
      const warmBatch = () => {
        if (cancelled || cursor >= queue.length) return;
        queue.slice(cursor, cursor + 3).forEach((image) => {
          image.loading = "eager";
          image.fetchPriority = "low";
          if (image.complete) image.decode?.().catch(() => undefined);
        });
        cursor += 3;
        preloadTimer = window.setTimeout(warmBatch, 720);
      };
      warmBatch();
    };

    const paint = (time: number) => {
      const mobile = window.innerWidth < 700;
      const largeDesktop = window.innerWidth >= 1180;
      const elapsed = reducedMotion ? 0 : Math.max(0, time - startedAt);
      const completedSteps = Math.floor(elapsed / cycleDuration);
      const phase = elapsed % cycleDuration;
      const linearShift = Math.max(0, Math.min(1, (phase - holdDuration) / transitionDuration));
      const easedShift = linearShift * linearShift * linearShift * (linearShift * (linearShift * 6 - 15) + 10);
      const progress = completedSteps + easedShift;

      // The frames travel on one continuous ellipse around the headline. The
      // lower half comes forward while the upper half recedes, keeping the
      // title as the stable visual centre of the scene.
      const orbitSlots = mobile ? 8 : 10;
      const angleStep = (Math.PI * 2) / orbitSlots;
      const verticalRadius = mobile
        ? Math.min(window.innerHeight * .22, 168)
        : largeDesktop
          ? Math.min(window.innerHeight * .31, 285)
          : Math.min(window.innerHeight * .28, 225);
      const horizontalRadius = largeDesktop
        ? Math.min(window.innerWidth * .36, 520)
        : mobile
          ? Math.min(window.innerWidth * .43, 175)
          : Math.min(window.innerWidth * .38, 370);
      const radiusZ = mobile ? 150 : largeDesktop ? 320 : 235;
      // Keep half a slot of overlap at the rear seam. The outgoing and
      // incoming frames occupy the same point there and crossfade, so the
      // orbit never exposes an empty gap between photographs.
      const renderRadius = orbitSlots / 2 + .5;

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
        const x = Math.cos(angle) * horizontalRadius;
        const y = Math.sin(angle) * verticalRadius;
        const z = Math.sin(angle) * radiusZ;
        const depth = (z + radiusZ) / (radiusZ * 2);
        const depthEase = depth * depth * (3 - 2 * depth);
        const scale = .46 + depthEase * .4;
        const edgeProgress = Math.max(0, Math.min(1, renderRadius - absoluteDistance));
        const edgeFade = Math.sin(edgeProgress * Math.PI * .5);
        const visibility = (.2 + depthEase * .8) * edgeFade;
        const orbitZ = (depth - .5) * radiusZ * 1.65;
        const yaw = Math.cos(angle) * (mobile ? -6 : -9);
        const pitch = Math.sin(angle) * (mobile ? -7 : -11);
        item.style.transform = `translate3d(${x}px, ${y}px, ${orbitZ}px) rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${scale})`;
        item.style.opacity = String(visibility);
        item.style.visibility = visibility < .015 ? "hidden" : "visible";
        item.style.filter = "none";
        item.style.zIndex = String(10 + Math.round(depthEase * 100));
      });
      frame = window.requestAnimationFrame(paint);
    };

    const initialImages = images.filter((_, index) => index < 5 || index >= images.length - 4);
    const start = async () => {
      await Promise.race([
        Promise.all(initialImages.map(waitForImage)),
        new Promise<void>((resolve) => window.setTimeout(resolve, 2600)),
      ]);
      if (cancelled) return;
      startedAt = performance.now();
      gallery.classList.add("is-ready");
      warmRemainingImages();
      frame = window.requestAnimationFrame(paint);
    };
    void start();

    return () => {
      cancelled = true;
      window.clearTimeout(preloadTimer);
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
              fetchPriority={index < 5 || index >= galleryFrames.length - 4 ? "high" : "low"}
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
