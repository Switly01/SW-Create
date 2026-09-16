import { useEffect, useRef } from "react";

const galleryFrames: ReadonlyArray<readonly [string, string]> = ([
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
] as ReadonlyArray<readonly [string, string]>).map(([src, position]) => [
  src.replace("/editorial/", "/editorial/optimized/720/"),
  position,
] as const);

const DESKTOP_SLOTS = 10;
const MOBILE_SLOTS = 8;
const PRELOAD_AHEAD = 4;

function frameAt(index: number) {
  return galleryFrames[((index % galleryFrames.length) + galleryFrames.length) % galleryFrames.length];
}

export function SpiralGallery() {
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gallery = galleryRef.current;
    const ring = gallery?.querySelector<HTMLElement>("[data-gallery-ring]");
    if (!gallery || !ring) return;

    const items = Array.from(ring.querySelectorAll<HTMLElement>("figure"));
    const images = items.map((item) => item.querySelector<HTMLImageElement>("img")).filter((image): image is HTMLImageElement => Boolean(image));
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let startedAt = 0;
    let visible = true;
    let cancelled = false;
    let slotCount = window.innerWidth < 700 ? MOBILE_SLOTS : DESKTOP_SLOTS;
    let logicalIndexes = items.map((_, index) => index);
    const warmed = new Set<string>();
    const holdDuration = 620;
    const transitionDuration = 2380;
    const cycleDuration = holdDuration + transitionDuration;

    const warmFrame = (logicalIndex: number) => {
      const [src] = frameAt(logicalIndex);
      if (warmed.has(src)) return;
      warmed.add(src);
      const image = new window.Image();
      image.decoding = "async";
      image.src = src;
      image.decode?.().catch(() => undefined);
    };

    const assignFrame = (slot: number, logicalIndex: number) => {
      const image = images[slot];
      const [src, position] = frameAt(logicalIndex);
      if (image.src.endsWith(src)) return;
      image.src = src;
      image.style.objectPosition = position;
      image.decode?.().catch(() => undefined);
    };

    const refreshSlots = (progress: number) => {
      const half = slotCount / 2;
      for (let slot = 0; slot < slotCount; slot += 1) {
        while (logicalIndexes[slot] < progress - half - .08) {
          logicalIndexes[slot] += slotCount;
          assignFrame(slot, logicalIndexes[slot]);
          for (let ahead = 1; ahead <= PRELOAD_AHEAD; ahead += 1) warmFrame(logicalIndexes[slot] + ahead * slotCount);
        }
      }
    };

    const paint = (time: number) => {
      if (cancelled) return;
      if (!visible || document.hidden) {
        frame = 0;
        return;
      }

      const mobile = window.innerWidth < 700;
      const largeDesktop = window.innerWidth >= 1180;
      const elapsed = motionPreference.matches ? 0 : Math.max(0, time - startedAt);
      const completedSteps = Math.floor(elapsed / cycleDuration);
      const phase = elapsed % cycleDuration;
      const linearShift = Math.max(0, Math.min(1, (phase - holdDuration) / transitionDuration));
      const easedShift = linearShift * linearShift * linearShift * (linearShift * (linearShift * 6 - 15) + 10);
      const progress = (slotCount - 1) / 2 + completedSteps + easedShift;
      refreshSlots(progress);

      const angleStep = (Math.PI * 2) / slotCount;
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
      const renderRadius = slotCount / 2 + .08;

      items.forEach((item, slot) => {
        if (slot >= slotCount) {
          item.style.display = "none";
          return;
        }
        item.style.display = "block";
        const distance = logicalIndexes[slot] - progress;
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
        const edgeProgress = Math.max(0, Math.min(1, (renderRadius - absoluteDistance) * 2.4));
        const edgeFade = edgeProgress * edgeProgress * (3 - 2 * edgeProgress);
        const opacity = (.2 + depthEase * .8) * edgeFade;
        const orbitZ = (depth - .5) * radiusZ * 1.65;
        const yaw = Math.cos(angle) * (mobile ? -6 : -9);
        const pitch = Math.sin(angle) * (mobile ? -7 : -11);
        item.style.transform = `translate3d(${x}px, ${y}px, ${orbitZ}px) rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${scale})`;
        item.style.opacity = String(opacity);
        item.style.visibility = opacity < .01 ? "hidden" : "visible";
        item.style.zIndex = String(10 + Math.round(depthEase * 100));
      });

      if (!motionPreference.matches) frame = window.requestAnimationFrame(paint);
    };

    const restart = () => {
      if (cancelled || !visible || document.hidden || motionPreference.matches || frame) return;
      startedAt = performance.now();
      frame = window.requestAnimationFrame(paint);
    };

    const handleVisibility = () => {
      if (document.hidden && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else restart();
    };

    const handleResize = () => {
      const nextSlotCount = window.innerWidth < 700 ? MOBILE_SLOTS : DESKTOP_SLOTS;
      if (nextSlotCount !== slotCount) {
        slotCount = nextSlotCount;
        logicalIndexes = items.map((_, index) => index);
        items.forEach((_, index) => assignFrame(index, index));
        startedAt = performance.now();
      }
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else restart();
    }, { rootMargin: "180px" });

    const initialImages = images.slice(0, slotCount);
    Promise.race([
      Promise.all(initialImages.map((image) => image.decode?.().catch(() => undefined) ?? Promise.resolve())),
      new Promise<void>((resolve) => window.setTimeout(resolve, 1800)),
    ]).then(() => {
      if (cancelled) return;
      for (let index = slotCount; index < slotCount + PRELOAD_AHEAD; index += 1) warmFrame(index);
      gallery.classList.add("is-ready");
      startedAt = performance.now();
      frame = window.requestAnimationFrame(paint);
    });

    observer.observe(gallery);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", handleResize, { passive: true });
    motionPreference.addEventListener("change", handleResize);

    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
      motionPreference.removeEventListener("change", handleResize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="cinematic-gallery" ref={galleryRef} aria-hidden="true">
      <div className="cinematic-gallery-track cinematic-gallery-ring-primary" data-gallery-ring="outer">
        {Array.from({ length: DESKTOP_SLOTS }, (_, index) => {
          const [src, position] = frameAt(index);
          return (
            <figure key={`orbit-slot-${index}`}>
              <img
                src={src}
                alt=""
                draggable={false}
                loading={index < 5 ? "eager" : "lazy"}
                fetchPriority={index < 3 ? "high" : "low"}
                decoding="async"
                style={{ objectPosition: position }}
              />
              <span>SW</span>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
