import { useEffect, useRef } from "react";

const outerFrames = [
  ["/editorial/prototype-lab.webp", "center center"],
  ["/editorial/performance-stage.webp", "center center"],
  ["/editorial/projection-field.webp", "center center"],
  ["/editorial/hardware-bench.webp", "center center"],
  ["/editorial/urban-light-installation.webp", "center center"],
  ["/editorial/film-production-set.webp", "center center"],
  ["/editorial/material-object-study.webp", "center center"],
  ["/editorial/creator-studio.webp", "right center"],
  ["/editorial/creator-collective.webp", "center center"],
  ["/editorial/signal-console.webp", "center center"],
  ["/editorial/fashion-tech-portrait-v2.webp", "center center"],
  ["/editorial/found-sound-session-v2.webp", "center center"],
] as const;

const innerFrames = [
  ["/editorial/urban-model-workshop-v2.webp", "center center"],
  ["/editorial/virtual-production-stage-v2.webp", "center center"],
  ["/editorial/print-edition-workshop-v2.webp", "center center"],
  ["/editorial/product-interface.webp", "center center"],
  ["/editorial/interactive-space.webp", "center center"],
  ["/editorial/film-sound.webp", "center center"],
  ["/editorial/brand-system.webp", "center center"],
  ["/editorial/automation-sculpture.webp", "center center"],
] as const;

const coreFrames = [
  ["/editorial/robot-vision-lab-v3.webp", "center center"],
  ["/editorial/semiconductor-cleanroom-v3.webp", "center center"],
  ["/editorial/avionics-test-rig-v3.webp", "center center"],
  ["/editorial/liquid-compute-rack-v3.webp", "center center"],
  ["/editorial/autonomous-robot-fleet-v3.webp", "center center"],
  ["/editorial/haptic-keyboard-lab-v3.webp", "center center"],
  ["/editorial/photonics-calibration-v3.webp", "center center"],
  ["/editorial/drone-wind-tunnel-v3.webp", "center center"],
] as const;

export function SpiralGallery() {
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const rings = Array.from(gallery.querySelectorAll<HTMLElement>("[data-gallery-ring]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let frame = 0;
    let phase = 0;
    let previousTime = performance.now();

    const onPointerMove = (event: PointerEvent) => {
      pointer.targetX = (event.clientX / window.innerWidth - .5) * 2;
      pointer.targetY = (event.clientY / window.innerHeight - .5) * 2;
    };
    const paint = (time: number) => {
      const mobile = window.innerWidth < 700;
      const scroll = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.35);
      pointer.x += (pointer.targetX - pointer.x) * .045;
      pointer.y += (pointer.targetY - pointer.y) * .045;
      const delta = Math.min(34, Math.max(0, time - previousTime));
      previousTime = time;
      phase += reducedMotion ? 0 : delta * .000115;

      rings.forEach((ring, ringIndex) => {
        const items = Array.from(ring.querySelectorAll<HTMLElement>("figure"));
        const inner = ringIndex === 1;
        const core = ringIndex === 2;
        const direction = inner ? -1 : 1;
        const radiusX = mobile
          ? (core ? 70 : inner ? 118 : 205)
          : Math.min(window.innerWidth * (core ? .105 : inner ? .19 : .34), core ? 150 : inner ? 285 : 520);
        const radiusZ = mobile ? (core ? 80 : inner ? 105 : 185) : (core ? 150 : inner ? 220 : 360);
        const pace = core ? 2.1 : inner ? 1.48 : 1;
        const scrollPace = core ? .55 : inner ? .92 : .62;
        const ringPhase = direction * phase * pace + scroll * direction * scrollPace;
        ring.style.transform = `rotateX(${-4 - pointer.y * (core ? 8 : inner ? 6 : 4)}deg) rotateY(${pointer.x * (core ? 12 : inner ? -9 : 7)}deg)`;

        items.forEach((item, index) => {
          const angle = index * (Math.PI * 2 / items.length) - Math.PI * .72 + ringPhase;
          const x = Math.sin(angle) * radiusX;
          const z = Math.cos(angle) * radiusZ + (core ? 62 : inner ? 36 : 0);
          const depth = (z + radiusZ) / (radiusZ * 2);
          const y = Math.sin(angle * (core ? 2.7 : inner ? 2.05 : 1.45)) * (mobile ? (core ? 38 : inner ? 64 : 118) : (core ? 55 : inner ? 96 : 165)) - scroll * (mobile ? 64 : 105);
          const scale = (core ? .45 : inner ? .58 : .67) + depth * (core ? .22 : inner ? .3 : .42);
          item.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${-Math.sin(angle) * (core ? 58 : inner ? 46 : 34)}deg) rotateZ(${Math.sin(angle) * (core ? -7.5 : inner ? 5.2 : -3.2)}deg) scale(${scale})`;
          item.style.opacity = String((core ? .38 : inner ? .28 : .34) + depth * (core ? .58 : inner ? .62 : .66));
          item.style.filter = `saturate(${.7 + depth * .54}) brightness(${.54 + depth * .52})`;
          item.style.zIndex = String(Math.round(depth * 100));
        });
      });
      frame = window.requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = window.requestAnimationFrame(paint);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="cinematic-gallery" ref={galleryRef} aria-hidden="true">
      <div className="cinematic-gallery-track cinematic-gallery-ring-primary" data-gallery-ring="outer">
        {outerFrames.map(([src, position], index) => (
          <figure key={`${src}-${index}`}>
            <img src={src} alt="" draggable={false} style={{ objectPosition: position }} />
            <span>{String(index + 1).padStart(2, "0")} / SW</span>
          </figure>
        ))}
      </div>
      <div className="cinematic-gallery-track cinematic-gallery-ring-secondary" data-gallery-ring="inner">
        {innerFrames.map(([src, position], index) => (
          <figure key={`${src}-${index}`}>
            <img src={src} alt="" draggable={false} style={{ objectPosition: position }} />
            <span>{String(index + outerFrames.length + 1).padStart(2, "0")} / SW</span>
          </figure>
        ))}
      </div>
      <div className="cinematic-gallery-track cinematic-gallery-ring-core" data-gallery-ring="core">
        {coreFrames.map(([src, position], index) => (
          <figure key={`${src}-${index}`}>
            <img src={src} alt="" draggable={false} style={{ objectPosition: position }} />
            <span>{String(index + outerFrames.length + innerFrames.length + 1).padStart(2, "0")} / TECH</span>
          </figure>
        ))}
      </div>
      <div className="cinematic-gallery-count" aria-hidden="true"><strong>28</strong><span>ROTATING<br />FIELD NOTES</span></div>
    </div>
  );
}
