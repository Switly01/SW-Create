import { useEffect, useRef } from "react";

const galleryFrames = [
  ["/editorial/product-sw-create-original.png", "center center"],
  ["/editorial/product-play-streamers-original.png", "center center"],
  ["/editorial/product-play-connect-original-2x.png", "center center"],
  ["/editorial/product-play-streamers-app-original.png", "center center"],
  ["/editorial/hq2x-prototype-lab.webp", "center center"],
  ["/editorial/hq2x-performance-stage.webp", "center center"],
  ["/editorial/hq2x-projection-field.webp", "center center"],
  ["/editorial/hq2x-hardware-bench.webp", "center center"],
  ["/editorial/hq2x-urban-light-installation.webp", "center center"],
  ["/editorial/hq2x-film-production-set.webp", "center center"],
  ["/editorial/hq2x-material-object-study.webp", "center center"],
  ["/editorial/hq2x-creator-studio.webp", "right center"],
  ["/editorial/hq2x-creator-collective.webp", "center center"],
  ["/editorial/hq2x-signal-console.webp", "center center"],
  ["/editorial/hq2x-fashion-tech-portrait-v2.webp", "center center"],
  ["/editorial/hq2x-found-sound-session-v2.webp", "center center"],
  ["/editorial/hq2x-urban-model-workshop-v2.webp", "center center"],
  ["/editorial/hq2x-virtual-production-stage-v2.webp", "center center"],
  ["/editorial/hq2x-print-edition-workshop-v2.webp", "center center"],
  ["/editorial/hq2x-product-interface.webp", "center center"],
  ["/editorial/hq2x-interactive-space.webp", "center center"],
  ["/editorial/hq2x-film-sound.webp", "center center"],
  ["/editorial/hq2x-brand-system.webp", "center center"],
  ["/editorial/hq2x-automation-sculpture.webp", "center center"],
  ["/editorial/hq2x-robot-vision-lab-v3.webp", "center center"],
  ["/editorial/hq2x-semiconductor-cleanroom-v3.webp", "center center"],
  ["/editorial/hq2x-avionics-test-rig-v3.webp", "center center"],
  ["/editorial/hq2x-liquid-compute-rack-v3.webp", "center center"],
  ["/editorial/hq2x-autonomous-robot-fleet-v3.webp", "center center"],
  ["/editorial/hq2x-haptic-keyboard-lab-v3.webp", "center center"],
  ["/editorial/hq2x-photonics-calibration-v3.webp", "center center"],
  ["/editorial/hq2x-drone-wind-tunnel-v3.webp", "center center"],
] as const;

export function SpiralGallery() {
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const ring = gallery.querySelector<HTMLElement>("[data-gallery-ring]");
    if (!ring) return;
    const items = Array.from(ring.querySelectorAll<HTMLElement>("figure"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let frame = 0;
    let phase = 0;
    let previousTime = performance.now();

    const onPointerMove = (event: PointerEvent) => {
      pointer.targetX = (event.clientX / window.innerWidth - .5) * 2;
      pointer.targetY = (event.clientY / window.innerHeight - .5) * 2;
    };
    const onPointerLeave = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    };
    const paint = (time: number) => {
      const mobile = window.innerWidth < 700;
      pointer.x += (pointer.targetX - pointer.x) * .025;
      pointer.y += (pointer.targetY - pointer.y) * .025;
      const delta = Math.min(34, Math.max(0, time - previousTime));
      previousTime = time;
      phase += reducedMotion ? 0 : delta * .00009;

      const radiusX = mobile ? 250 : Math.min(window.innerWidth * .43, 620);
      const radiusY = mobile ? 118 : Math.min(window.innerHeight * .2, 188);
      const radiusZ = mobile ? 270 : 520;
      ring.style.transform = `rotateX(${pointer.y * -1.4}deg) rotateY(${pointer.x * 2.4}deg)`;

      items.forEach((item, index) => {
        const angle = index * (Math.PI * 2 / items.length) - Math.PI * .5 + phase;
        const x = Math.cos(angle) * radiusX;
        const z = Math.sin(angle) * radiusZ;
        const depth = (z + radiusZ) / (radiusZ * 2);
        const y = Math.sin(angle) * radiusY;
        const scale = .7 + depth * .34;
        const orbitVisibility = Math.max(0, Math.min(1, (depth - .8) / .2));
        const visibility = Math.pow(orbitVisibility, .68);
        let tangent = Math.atan2(radiusY * Math.cos(angle), -radiusX * Math.sin(angle)) * 180 / Math.PI;
        if (tangent > 90) tangent -= 180;
        if (tangent < -90) tangent += 180;
        item.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${Math.cos(angle) * -12}deg) rotateZ(${tangent}deg) scale(${scale})`;
        item.style.opacity = String(visibility);
        item.style.visibility = visibility < .015 ? "hidden" : "visible";
        item.style.filter = "none";
        item.style.zIndex = String(Math.round(depth * 100));
      });
      frame = window.requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    frame = window.requestAnimationFrame(paint);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="cinematic-gallery" ref={galleryRef} aria-hidden="true">
      <div className="cinematic-gallery-track cinematic-gallery-ring-primary" data-gallery-ring="outer">
        {galleryFrames.map(([src, position], index) => (
          <figure key={`${src}-${index}`}>
            <img src={src} alt="" draggable={false} style={{ objectPosition: position }} />
            <span>SW</span>
          </figure>
        ))}
      </div>
    </div>
  );
}
