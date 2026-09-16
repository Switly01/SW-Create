import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../src/api";
import { savedSwLanguage, SW_LANGUAGES, type SwLanguage } from "../../src/languages";
import { BRAND_COPY } from "./brandCopy";
import { SwDualCore } from "./SwDualCore";
import { SpiralGallery } from "./SpiralGallery";

function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return <a href={href} {...props}>{children}</a>;
}

function Image({ fill, priority, style, ...props }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) {
  return (
    <img
      {...props}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={fill ? { ...style, position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } : style}
    />
  );
}

const products = [
  {
    group: "site",
    name: "SW Create",
    kind: "Bağımsız dijital ürün merkezi",
    copy: "SW hesabını, ürün erişimlerini ve stüdyonun bütün dijital üretimlerini tek merkezde buluşturan ana platform.",
    state: "CANLI",
    color: "acid",
    logo: "/brand/swcreate-logo.png",
    logoClass: "sw-create-app-logo",
    visual: "/editorial/product-sw-create-original.png",
    href: "https://swcreate.com",
  },
  {
    group: "site",
    name: "Play Streamers",
    kind: "Yayıncı kontrol sistemi",
    copy: "Yayın akışını, topluluk verilerini ve destek olaylarını tek merkezde görünür kılan canlı yayıncı alanı.",
    state: "CANLI",
    color: "cobalt",
    logo: "/brand/play-streamers-ps-logo.svg",
    visual: "/editorial/product-play-streamers-original.png",
    href: "https://pstreamers.com",
  },
  {
    group: "extension",
    name: "Play Connect",
    kind: "Tarayıcı veri köprüsü",
    copy: "Bağış platformlarını tek bir güvenli veri katmanında buluşturan ücretsiz tarayıcı bağlantısı.",
    state: "CANLI",
    color: "coral",
    logo: "/brand/play-connect-pc-logo.svg",
    visual: "/editorial/product-play-connect-original.png",
    href: "https://pstreamers.com",
  },
  {
    group: "app",
    name: "Play Streamers App",
    kind: "Masaüstü yayıncı uygulaması",
    copy: "Yayın akışını, canlı olayları, bağlantıları ve gelir görünümünü Windows masaüstünde tek çalışma alanında birleştiren yerel uygulama.",
    state: "CANLI",
    color: "signal",
    logo: "/brand/play-streamers-ps-logo.svg",
    visual: "/editorial/product-play-streamers-app-original.png",
    href: "https://apps.microsoft.com/detail/9NWZ0TF5K999",
  },
];

const PLAY_CONNECT_STORES = {
  chromium: "https://chromewebstore.google.com/detail/play-connect/mpebmfjcdkflgiloecjonopfknojdaip",
  firefox: "https://addons.mozilla.org/en-US/firefox/addon/play-connect/",
} as const;

function playConnectStoreForBrowser() {
  const userAgent = window.navigator.userAgent;
  if (/Firefox|FxiOS/i.test(userAgent)) return PLAY_CONNECT_STORES.firefox;
  return PLAY_CONNECT_STORES.chromium;
}

const fieldNotes = [
  { src: "/editorial/prototype-lab.webp", alt: "Robotik üretim koluyla fiziksel prototip geliştiren tasarım ekibi", field: "INDUSTRIAL / R&D", label: "Fiziksel prototipleme" },
  { src: "/editorial/performance-stage.webp", alt: "Kırmızı kumaş ve hareket sensörleriyle sahne performansı", field: "PERFORMANCE / MOTION", label: "Hareket ve sahne" },
  { src: "/editorial/projection-field.webp", alt: "Soyut görüntülerle çevrili etkileşimli projeksiyon alanı", field: "GENERATIVE / SPACE", label: "Üretken deneyimler" },
  { src: "/editorial/hardware-bench.webp", alt: "Özel kontrol yüzeyi üreten donanım tasarımcısı", field: "HARDWARE / INTERFACE", label: "Özel donanım" },
  { src: "/editorial/urban-light-installation.webp", alt: "Brütalist mimaride kırmızı ışık yerleştirmesi", field: "PUBLIC / INSTALLATION", label: "Kamusal enstalasyon" },
  { src: "/editorial/film-production-set.webp", alt: "Sinematik ürün filmi çeken yaratıcı prodüksiyon ekibi", field: "FILM / DIRECTION", label: "Film prodüksiyonu" },
  { src: "/editorial/material-object-study.webp", alt: "Taş, kumaş, krom ve kırmızı akrilikle hazırlanmış materyal çalışması", field: "OBJECT / IDENTITY", label: "Nesne ve kimlik" },
] as const;

const technologyFrames = [
  { src: "/editorial/robot-vision-lab-v3.webp", alt: "Görsel algı teknolojilerini temsil eden robotik laboratuvar sahnesi", field: "COMPUTER VISION", label: "Görsel algı deneyleri", note: "Görüntüden kullanılabilir veriye" },
  { src: "/editorial/semiconductor-cleanroom-v3.webp", alt: "Hassas teknoloji araştırmalarını temsil eden temiz oda sahnesi", field: "TECH RESEARCH", label: "Teknoloji araştırması", note: "Yeni yöntemleri ürüne uyarlama" },
  { src: "/editorial/avionics-test-rig-v3.webp", alt: "Bağlantılı donanım fikirlerini temsil eden teknoloji test sahnesi", field: "HARDWARE CONCEPTS", label: "Donanım kurguları", note: "Fikirden deneysel prototipe" },
  { src: "/editorial/liquid-compute-rack-v3.webp", alt: "Modern dijital ürün altyapılarını temsil eden bilgi işlem sistemi", field: "PRODUCT INFRASTRUCTURE", label: "Ürün altyapıları", note: "Hızlı · güvenilir · ölçeklenebilir" },
  { src: "/editorial/autonomous-robot-fleet-v3.webp", alt: "Otomasyon akışlarını temsil eden mobil robotların bulunduğu endüstriyel sahne", field: "AUTOMATION", label: "Akıllı iş akışları", note: "Tekrarlanan işi sisteme devretme" },
  { src: "/editorial/haptic-keyboard-lab-v3.webp", alt: "Şeffaf mekanik klavye ve fiziksel kontrol arayüzü prototipi", field: "INTERACTION", label: "Yeni arayüzler", note: "Dijital ve fiziksel etkileşim" },
  { src: "/editorial/photonics-calibration-v3.webp", alt: "Işık ve sensör tabanlı etkileşimleri temsil eden optik laboratuvar sahnesi", field: "LIGHT & SENSOR", label: "Etkileşimli ışık", note: "Mekânı tepki veren yüzeye dönüştürme" },
  { src: "/editorial/drone-wind-tunnel-v3.webp", alt: "Hareket verisi ve gerçek zamanlı görselleştirmeyi temsil eden teknoloji sahnesi", field: "MOTION DATA", label: "Hareket verisi", note: "Veriyi canlı deneyime dönüştürme" },
] as const;

const languages = SW_LANGUAGES;
type Language = SwLanguage;

function productVisitorId() {
  const storageKey = "sw-product-visitor";
  const saved = window.localStorage.getItem(storageKey);
  if (saved) return saved;
  const created = crypto.randomUUID();
  window.localStorage.setItem(storageKey, created);
  return created;
}

export function BrandSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(savedSwLanguage);
  const [playConnectStore] = useState(playConnectStoreForBrowser);
  const [systemStats, setSystemStats] = useState({ activeUsers: "—", registeredAccounts: "—", activeProducts: "4" });
  const cursorOrbitRef = useRef<HTMLDivElement>(null);
  const languageControlRef = useRef<HTMLDivElement>(null);
  const ui = BRAND_COPY[language];
  const activeLanguage = languages.find(([code]) => code === language) ?? languages[0];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = `SW Create — ${BRAND_COPY[language].hero.eyebrow}`;
  }, [language]);

  useEffect(() => {
    const closeLanguage = (event: PointerEvent) => {
      if (!languageControlRef.current?.contains(event.target as Node)) setLanguageOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLanguageOpen(false);
    };
    document.addEventListener("pointerdown", closeLanguage);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeLanguage);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".signal-editorial-site section"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { rootMargin: "0px 0px -12%", threshold: .12 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/account`, { credentials: "include", cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (response.ok) window.location.replace("/home/");
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.warn("SW oturumu kontrol edilemedi.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let statsTimer = 0;
    let pulseTimer = 0;
    const pulseActivity = async () => {
      try {
        await fetch(`${API_BASE}/api/activity/pulse`, {
          method: "POST",
          credentials: "omit",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ product: "sw-create", visitor: productVisitorId() }),
          signal: controller.signal,
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.warn("SW ürün etkinliği bildirilemedi.");
      }
    };
    const loadStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/stats`, { signal: controller.signal, credentials: "omit", cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { activeUsers?: number; registeredAccounts?: number; activeProducts?: number };
        setSystemStats({
          activeUsers: typeof data.activeUsers === "number" && Number.isFinite(data.activeUsers) ? String(data.activeUsers) : "—",
          registeredAccounts: typeof data.registeredAccounts === "number" && Number.isFinite(data.registeredAccounts) ? String(data.registeredAccounts) : "—",
          activeProducts: "4",
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.warn("SW sistem verileri alınamadı.");
      }
    };
    const refreshVisibleStats = () => {
      if (!document.hidden) void loadStats();
    };
    void pulseActivity();
    void loadStats();
    statsTimer = window.setInterval(refreshVisibleStats, 15_000);
    pulseTimer = window.setInterval(() => {
      if (!document.hidden) void pulseActivity();
    }, 45_000);
    window.addEventListener("focus", refreshVisibleStats);
    document.addEventListener("visibilitychange", refreshVisibleStats);
    return () => {
      controller.abort();
      window.clearInterval(statsTimer);
      window.clearInterval(pulseTimer);
      window.removeEventListener("focus", refreshVisibleStats);
      document.removeEventListener("visibilitychange", refreshVisibleStats);
    };
  }, []);

  function chooseLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setLanguageOpen(false);
    window.localStorage.setItem("sw-language", nextLanguage);
  }

  useEffect(() => {
    const orbit = cursorOrbitRef.current;
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!orbit || !finePointer.matches) return;
    let frame = 0;
    let x = -100;
    let y = -100;
    const paint = () => {
      frame = 0;
      orbit.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const productSection = document.querySelector<HTMLElement>(".products-section");
    const productTrack = productSection?.querySelector<HTMLElement>(".product-gallery");
    const productStage = productSection?.querySelector<HTMLElement>(".products-sticky");
    const reel = document.querySelector<HTMLElement>(".showreel-section");
    const reelImage = reel?.querySelector<HTMLElement>(".showreel-image");
    const page = document.querySelector<HTMLElement>(".signal-editorial-site");
    const hero = document.querySelector<HTMLElement>(".signal-editorial-site .hero");
    if (!productSection || !productTrack || !productStage) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const paint = () => {
      frame = 0;
      const desktop = window.innerWidth > 760;
      const pageDistance = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      page?.style.setProperty("--page-progress", String(Math.min(1, Math.max(0, window.scrollY / pageDistance))));
      hero?.style.setProperty("--hero-progress", String(Math.min(1, Math.max(0, window.scrollY / Math.max(hero.offsetHeight, 1)))));
      if (desktop && !reducedMotion.matches) {
        const start = productSection.offsetTop;
        const distance = Math.max(productSection.offsetHeight - window.innerHeight, 1);
        const progress = Math.min(1, Math.max(0, (window.scrollY - start) / distance));
        const travel = Math.max(0, productTrack.scrollWidth - productStage.clientWidth + 64);
        productTrack.style.transform = `translate3d(${-travel * progress}px, 0, 0)`;
        productStage.style.setProperty("--product-progress", String(progress));
        productStage.style.setProperty("--product-heading-opacity", String(Math.max(0, 1 - progress * 7)));
      } else {
        productTrack.style.transform = "";
        productStage.style.removeProperty("--product-progress");
        productStage.style.removeProperty("--product-heading-opacity");
      }

      if (reel && reelImage && !reducedMotion.matches) {
        const rect = reel.getBoundingClientRect();
        const reelProgress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
        reelImage.style.transform = `scale(${1.12 - reelProgress * .12}) translate3d(0, ${(reelProgress - .5) * 8}%, 0)`;
        reel.style.setProperty("--reel-progress", String(reelProgress));
      }
    };
    const requestPaint = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", requestPaint);
    paint();
    return () => {
      window.removeEventListener("scroll", requestPaint);
      window.removeEventListener("resize", requestPaint);
      page?.style.removeProperty("--page-progress");
      hero?.style.removeProperty("--hero-progress");
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className="site-shell sw-character-site signal-editorial-site" dir={language === "ar" ? "rtl" : "ltr"}>
      <div ref={cursorOrbitRef} className="cursor-orbit" aria-hidden="true" />
      <div className="page-signal-rail" aria-hidden="true"><span /><b>SW / FIELD</b><i>{ui.hero.scroll}</i></div>

      <header className="topbar">
        <Link className="brand" href="#top" aria-label={ui.hero.home}>
          <span className="brand-mark"><Image src="/brand/swcreate-logo.png" alt="" width={42} height={42} priority /></span>
          <span className="brand-word"><strong>SW CREATE</strong><small>{ui.brandSubtitle}</small></span>
        </Link>
        <span className="topbar-signal" aria-hidden="true"><i /> SW CREATE · {ui.brandSubtitle}</span>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={ui.nav.menu}><span /> <span /></button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label={ui.nav.main}>
          <a href="#products" onClick={() => setMenuOpen(false)}>{ui.nav.products}</a>
          <a href="#capabilities" onClick={() => setMenuOpen(false)}>{ui.nav.method}</a>
          <a href="#edition" onClick={() => setMenuOpen(false)}>{ui.nav.edition}</a>
          <div className="language-control" ref={languageControlRef}>
            <button type="button" className="language-button" onClick={() => setLanguageOpen(!languageOpen)} aria-expanded={languageOpen} aria-label={ui.nav.language}><img src={activeLanguage[1]} alt="" /><span>{language.toUpperCase()}</span></button>
            {languageOpen && <div className="language-menu" role="menu" aria-label={ui.nav.language}>
              {languages.map(([code, flag, label]) => <button type="button" key={code} className={language === code ? "active" : ""} onClick={() => chooseLanguage(code)} role="menuitem"><img src={flag} alt="" />{label}</button>)}
            </div>}
          </div>
          <Link className="nav-account identity-link" href="/account/">{ui.nav.account} <span>↗</span></Link>
        </nav>
      </header>

      <section id="top" className="hero">
        <SpiralGallery />
        <div className="hero-backtype" aria-hidden="true"><span>{ui.work.items[0].category}</span><span>{ui.work.items[2].category}</span><span>{ui.work.items[3].category}</span></div>
        <aside className="hero-field-card" aria-hidden="true">
          <span>SW / {ui.products.label}</span><strong>∞</strong>
          <div><b>{ui.kinetic.rows[0][0]}</b><b>{ui.kinetic.rows[0][2]}</b><b>{ui.kinetic.rows[1][1]}</b><b>{ui.kinetic.rows[2][2]}</b></div>
        </aside>
        <div className="hero-scene-meta" aria-hidden="true"><span>{ui.hero.interactive}</span><span>{ui.hero.discover}</span></div>
        <aside className="hero-index" aria-hidden="true"><b>SW</b><span>{ui.brandSubtitle}</span></aside>
        <div className="hero-stage">
          <div className="hero-copy">
            <p className="eyebrow"><span /> {ui.hero.eyebrow}</p>
            <h1><span>{ui.hero.title[0]}</span><em>{ui.hero.title[1]}</em><span>{ui.hero.title[2]}</span></h1>
            <div className="hero-bottomline">
              <div className="hero-actions">
                <a className="button button-light slide-link" href="#products">{ui.hero.action} <span>↓</span></a>
                <Link className="text-link identity-link" href="/account/">{ui.hero.enter} <span>↗</span></Link>
              </div>
            </div>
          </div>
          <aside className="hero-machine">
            <div className="hero-machine-head"><span>SW CORE / {ui.products.items[0].state}</span><i /></div>
            <div className="hero-core" aria-label={ui.products.items[0].kind}>
              <div className="orbit orbit-one" aria-hidden="true" />
              <div className="orbit orbit-two" aria-hidden="true" />
              <div className="orbit orbit-three" aria-hidden="true" />
              <div className="core-image"><SwDualCore className="core-logo-shell" /></div>
            </div>
            <div className="hero-machine-links"><a href="https://swcreate.com" aria-label={ui.hero.home}>SW CREATE <span>↗</span></a><a href="https://pstreamers.com" target="_blank" rel="noreferrer" aria-label={ui.hero.streamers}>PLAY STREAMERS <span>↗</span></a></div>
          </aside>
        </div>
        <div className="hero-broadcast" aria-hidden="true"><div>{ui.brandSubtitle} · {ui.kinetic.rows.flat().join(" · ")} · </div><div>{ui.brandSubtitle} · {ui.kinetic.rows.flat().join(" · ")} · </div></div>
        <p className="hero-scroll-note" aria-hidden="true">{ui.hero.scroll} <span>↓</span></p>
      </section>

      <section className="system-strip" aria-label={ui.system.title} aria-live="polite">
        <p><span className="pulse-dot" /> {ui.system.title}</p>
        <div><strong>{systemStats.activeUsers}</strong><span>{ui.system.activeUsers}</span></div>
        <div><strong>{systemStats.registeredAccounts}</strong><span>{ui.system.accounts}</span></div>
        <div><strong>{systemStats.activeProducts}</strong><span>{ui.system.products}</span></div>
      </section>

      <section className="field-atlas-section" aria-labelledby="field-atlas-title">
        <header className="field-atlas-heading">
          <p>{ui.field.kicker}</p>
          <h2 id="field-atlas-title">{ui.field.title[0]}<br /><em>{ui.field.title[1]}</em><br />{ui.field.title[2]}</h2>
          <span>{ui.field.intro}</span>
        </header>
        <div className="field-atlas" role="list" aria-label={ui.field.list}>
          {fieldNotes.map((note, index) => (
            <figure className={`field-shot field-shot-${index + 1}`} key={note.src} role="listitem">
              <div className="field-shot-image"><Image src={note.src} alt={ui.field.items[index].alt} fill /></div>
              <figcaption><span>{note.field}</span><strong>{ui.field.items[index].label}</strong></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="capabilities" className="work-spectrum-section">
        <header className="work-spectrum-heading">
          <p>{ui.work.kicker}</p>
          <h2>{ui.work.title[0]} <em>{ui.work.title[1]}</em></h2>
          <span>{ui.work.intro}</span>
        </header>
        <div className="work-spectrum-grid">
          {[
            ["product", "/editorial/product-interface.webp"], ["automation", "/editorial/automation-sculpture.webp"], ["brand", "/editorial/brand-system.webp"],
            ["space", "/editorial/interactive-space.webp"], ["film", "/editorial/film-sound.webp"], ["community", "/editorial/creator-collective.webp"],
          ].map(([kind, src], index) => <article className={`work-tile work-tile-${kind}`} key={kind}><figure><Image src={src} alt={ui.work.items[index].alt} fill /></figure><div><span>{ui.work.items[index].category}</span><h3>{ui.work.items[index].title}</h3><p>{ui.work.items[index].copy}</p></div></article>)}
        </div>
      </section>

      <section id="technology" className="technology-section" aria-labelledby="technology-title">
        <header className="technology-heading">
          <p>{ui.tech.kicker}</p>
          <h2 id="technology-title">{ui.tech.title[0]}<br /><em>{ui.tech.title[1]}</em><br />{ui.tech.title[2]}<br />{ui.tech.title[3]}</h2>
          <span>{ui.tech.intro}</span>
        </header>
        <div className="technology-reel" role="list" aria-label={ui.tech.list}>
          {technologyFrames.map((frame, index) => (
            <figure className={`technology-frame technology-frame-${index + 1}`} key={frame.src} role="listitem">
              <Image src={frame.src} alt={ui.tech.items[index].alt} fill />
              <figcaption>
                <span>{ui.tech.items[index].field}</span>
                <strong>{ui.tech.items[index].title}</strong>
                <small>{ui.tech.items[index].note}</small>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="technology-status" aria-hidden="true"><i /> {ui.tech.status}</div>
      </section>

      <section className="showreel-section" aria-label={ui.showreel.aria}>
        <div className="showreel-image"><Image src="/editorial/urban-light-installation.webp" alt={ui.showreel.alt} fill /></div>
        <div className="showreel-noise" aria-hidden="true" />
        <p className="showreel-kicker">{ui.showreel.label}</p>
        <h2>{ui.showreel.title[0]}<br />{ui.showreel.title[1]}<br />{ui.showreel.title[2]}</h2>
        <div className="showreel-caption"><span>{ui.showreel.discipline}</span><p>{ui.showreel.copy}</p></div>
      </section>

      <section className="kinetic-interlude" aria-label={ui.kinetic.aria}>
        {ui.kinetic.rows.map((row, rowIndex) => <div key={rowIndex}>{[...row, ...row].map((term, index) => <span key={`${term}-${index}`}>{index > 0 && <i>·</i>}{index % 2 ? <em>{term}</em> : term}</span>)}</div>)}
      </section>

      <section id="products" className="products-section">
        <div className="products-sticky">
          <div className="section-heading">
            <p className="section-number">{ui.products.label}</p>
            <h2>{ui.products.title[0]}<br /><span>{ui.products.title[1]}</span></h2>
            <p>{ui.products.intro}</p>
          </div>
          <div className="product-progress" aria-hidden="true"><span /><b>{ui.products.progress}</b></div>
          <div className="product-gallery">
            {products.map((product, index) => (
              <a className={`product-card product-card-${index + 1} ${product.color} slide-link`} href={product.name === "Play Connect" ? playConnectStore : product.href} key={product.name} target="_blank" rel="noreferrer">
                <div className="product-visual"><Image src={product.visual} alt="" fill /></div>
                <div className="product-card-head"><b>{product.group === "site" ? ui.products.platform : product.group === "app" ? "APP" : ui.products.connector}</b><i>{ui.products.items[index].state}</i></div>
                <div className="product-main"><div className="product-brand-mark" aria-hidden="true">{product.logoClass ? <span className={product.logoClass} /> : <Image src={product.logo} alt="" width={96} height={96} />}</div><p>{ui.products.items[index].kind}</p><h3>{product.name}</h3><span>{ui.products.items[index].copy}</span></div>
                <div className="product-side"><span className="product-command">{ui.products.open}</span><span className="arrow">↗</span></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="studio" className="studio-section">
        <div className="studio-statement"><p className="section-number">{ui.studio.label}</p><h2>{ui.studio.title[0]}<br /><i>{ui.studio.title[1]}</i></h2></div>
        <div className="studio-workbench">
          <div className="studio-seal" aria-hidden="true"><span className="studio-logo-mark"><Image src="/brand/swcreate-logo.png" alt="" width={150} height={150} /></span><small>{ui.studio.seal}</small></div>
          <div className="principle-grid">
            {ui.studio.principles.map(({ title, copy }) => <article key={title}><div><h3>{title}</h3><p>{copy}</p></div><b aria-hidden="true">↘</b></article>)}
          </div>
        </div>
        <div className="studio-cinema" aria-hidden="true">
          <figure><Image src="/editorial/virtual-production-stage-v2.webp" alt="" fill /></figure>
          <figure><Image src="/editorial/hardware-bench.webp" alt="" fill /></figure>
          <figure><Image src="/editorial/material-object-study.webp" alt="" fill /></figure>
          <figure><Image src="/editorial/print-edition-workshop-v2.webp" alt="" fill /></figure>
          <figure><Image src="/editorial/urban-model-workshop-v2.webp" alt="" fill /></figure>
        </div>
        <div className="studio-note"><span>{ui.studio.noteLabel}</span><p>{ui.studio.note}</p></div>
      </section>

      <section id="edition" className="edition-section">
        <div className="edition-intro"><div className="edition-badge">{ui.edition.badge}</div><div className="edition-copy"><p className="section-number">{ui.edition.label}</p><h2>{ui.edition.title[0]}<br /><span>{ui.edition.title[1]}</span></h2><p>{ui.edition.intro}</p></div><aside><strong>{ui.edition.oneId}</strong><span>{ui.edition.allProducts}</span></aside></div>
        <div className="plan-grid plan-grid-three">
          {ui.edition.plans.map((plan, index) => <article className={`plan-card ${index === 1 ? "pro" : index === 2 ? "edition" : ""}`} key={plan.label}><span>{plan.label}</span><h3>{plan.title}</h3><strong>{plan.status}</strong><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><Link className="identity-link" href={index === 0 ? "/account/?mode=register" : index === 1 ? "/account/?plan=pro" : "/account/?plan=edition"}>{plan.action} <b>↗</b></Link></article>)}
        </div>
      </section>

      <section className="closing-section"><p>{ui.closing.title[0]}<br />{ui.closing.title[1]}</p><Link className="identity-link" href="/account/?mode=register">{ui.closing.action} <span>↗</span></Link></section>

      <footer className="site-footer">
        <div className="footer-identity"><Link className="brand footer-brand" href="#top" aria-label={ui.footer.top}><Image src="/brand/swcreate-logo.png" alt="" width={52} height={52} /></Link><p>{ui.footer.tagline}</p></div>
        <div className="footer-links"><strong>SW CREATE</strong><Link href="#products">{ui.footer.products}</Link><Link href="#studio">{ui.footer.management}</Link><Link href="#edition">{ui.footer.edition}</Link></div>
        <div className="footer-links"><strong>{ui.footer.trust}</strong><Link href="/privacy">{ui.footer.privacy}</Link><Link href="/terms">{ui.footer.terms}</Link><a href="mailto:swcreate.info@gmail.com">swcreate.info@gmail.com</a></div>
        <div className="footer-privacy"><span className="pulse-dot" /><strong>{ui.footer.privacyTitle}</strong><p>{ui.footer.privacyCopy}</p></div>
        <span className="footer-copyright">© 2026 SW Create · {ui.footer.copyright}</span>
      </footer>
    </main>
  );
}
