import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../src/api";
import { savedSwLanguage, SW_LANGUAGES, type SwLanguage } from "../../src/languages";
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
    visual: "/editorial/automation-sculpture.webp",
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
    visual: "/editorial/creator-studio.webp",
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
    visual: "/editorial/product-interface.webp",
    href: "https://pstreamers.com",
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

const principles = [
  ["Bir hesap", "Her SW Create ürününde aynı kimlik, tek merkez ve taşınabilir erişim."],
  ["Açık kontrol", "Verin, bağlantıların ve ürün izinlerin yalnızca senin yönetiminde."],
  ["Karakterli üretim", "Kopyalanan kalıplar değil; problemi gerçekten çözen bağımsız ürünler."],
];

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
const localizedHero: Record<Language, { products: string; method: string; edition: string; account: string; eyebrow: string; title: [string, string, string]; lead: string; action: string; enter: string }> = {
  tr: { products: "Ürünler", method: "Neler yapıyoruz", edition: "SW üyeliği", account: "SW hesabı", eyebrow: "Bağımsız teknoloji stüdyosu", title: ["Fikrin", "kendi çekim", "alanı olsun."], lead: "Yaratıcıların ve dijital toplulukların etrafında dönen karakterli ürünler tasarlıyor, geliştiriyor ve büyütüyoruz.", action: "Ürünleri keşfet", enter: "SW merkezine gir" },
  en: { products: "Products", method: "What we do", edition: "Edition", account: "SW account", eyebrow: "Independent technology studio", title: ["Give your", "idea its own", "gravity."], lead: "We design, build and grow distinctive products around creators and digital communities.", action: "Explore products", enter: "Enter SW center" },
  de: { products: "Produkte", method: "Was wir tun", edition: "Edition", account: "SW Konto", eyebrow: "Unabhängiges Technologiestudio", title: ["Deine Idee", "braucht eigene", "Anziehungskraft."], lead: "Wir gestalten und entwickeln charaktervolle Produkte für Kreative und digitale Gemeinschaften.", action: "Produkte entdecken", enter: "SW Zentrale öffnen" },
  es: { products: "Productos", method: "Qué hacemos", edition: "Edition", account: "Cuenta SW", eyebrow: "Estudio tecnológico independiente", title: ["Que tu idea", "tenga su propia", "gravedad."], lead: "Diseñamos y desarrollamos productos con carácter para creadores y comunidades digitales.", action: "Descubrir productos", enter: "Entrar al centro SW" },
  fr: { products: "Produits", method: "Notre savoir-faire", edition: "Edition", account: "Compte SW", eyebrow: "Studio technologique indépendant", title: ["Donnez à", "votre idée sa", "gravité."], lead: "Nous concevons et développons des produits distinctifs pour les créateurs et les communautés numériques.", action: "Découvrir les produits", enter: "Entrer dans SW" },
  ru: { products: "Продукты", method: "Что мы делаем", edition: "Edition", account: "Аккаунт SW", eyebrow: "Независимая технологическая студия", title: ["Пусть у", "идеи будет", "своя гравитация."], lead: "Мы создаём выразительные продукты для авторов и цифровых сообществ.", action: "Открыть продукты", enter: "Войти в центр SW" },
  ar: { products: "المنتجات", method: "ماذا نصنع", edition: "Edition", account: "حساب SW", eyebrow: "استوديو تقني مستقل", title: ["لِفكرتك", "جاذبيتها", "الخاصة."], lead: "نصمم ونطور منتجات مميزة للمبدعين والمجتمعات الرقمية.", action: "اتبع الإشارة", enter: "ادخل مركز SW" },
  ja: { products: "製品", method: "できること", edition: "Edition", account: "SWアカウント", eyebrow: "独立系テクノロジースタジオ", title: ["アイデアに", "独自の引力を", "与えよう。"], lead: "クリエイターとデジタルコミュニティのために、個性的な製品を設計・開発します。", action: "製品を見る", enter: "SWセンターへ" },
};

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
  const [systemStats, setSystemStats] = useState({ activeUsers: "—", registeredAccounts: "—", activeProducts: "—" });
  const cursorOrbitRef = useRef<HTMLDivElement>(null);
  const languageControlRef = useRef<HTMLDivElement>(null);
  const ui = localizedHero[language];
  const activeLanguage = languages.find(([code]) => code === language) ?? languages[0];

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
          activeProducts: typeof data.activeProducts === "number" && Number.isFinite(data.activeProducts) ? String(data.activeProducts) : "—",
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
    document.documentElement.lang = nextLanguage;
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
      } else {
        productTrack.style.transform = "";
        productStage.style.removeProperty("--product-progress");
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
      <div className="page-signal-rail" aria-hidden="true"><span /><b>SW / 01—06</b><i>SCROLL</i></div>

      <header className="topbar">
        <Link className="brand" href="#top" aria-label="SW Create ana sayfa">
          <span className="brand-mark"><Image src="/brand/swcreate-logo.png" alt="" width={42} height={42} priority /></span>
          <span className="brand-word"><strong>SW CREATE</strong><small>BAĞIMSIZ DİJİTAL STÜDYO</small></span>
        </Link>
        <span className="topbar-signal" aria-hidden="true"><i /> SW CREATE · BAĞIMSIZ DİJİTAL STÜDYO</span>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Menüyü aç veya kapat"><span /> <span /></button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Ana menü">
          <a href="#products" onClick={() => setMenuOpen(false)}>{ui.products}</a>
          <a href="#capabilities" onClick={() => setMenuOpen(false)}>{ui.method}</a>
          <a href="#edition" onClick={() => setMenuOpen(false)}>{ui.edition}</a>
          <div className="language-control" ref={languageControlRef}>
            <button type="button" className="language-button" onClick={() => setLanguageOpen(!languageOpen)} aria-expanded={languageOpen} aria-label="Dil seçimi"><img src={activeLanguage[1]} alt="" /><span>{language.toUpperCase()}</span></button>
            {languageOpen && <div className="language-menu" role="menu" aria-label="Dil seçimi">
              {languages.map(([code, flag, label]) => <button type="button" key={code} className={language === code ? "active" : ""} onClick={() => chooseLanguage(code)} role="menuitem"><img src={flag} alt="" />{label}</button>)}
            </div>}
          </div>
          <Link className="nav-account identity-link" href="/account/">{ui.account} <span>↗</span></Link>
        </nav>
      </header>

      <section id="top" className="hero">
        <SpiralGallery />
        <div className="hero-backtype" aria-hidden="true"><span>CREATE</span><span>WITHOUT</span><span>LIMITS</span></div>
        <aside className="hero-field-card" aria-hidden="true">
          <span>SW / OUTPUT MATRIX</span><strong>∞</strong>
          <div><b>CODE</b><b>OBJECT</b><b>MOTION</b><b>SPACE</b></div>
        </aside>
        <div className="hero-scene-meta" aria-hidden="true"><span>INTERACTIVE / 01</span><span>MOVE · SCROLL · DISCOVER</span></div>
        <div className="hero-grid" aria-hidden="true" />
        <aside className="hero-index" aria-hidden="true"><b>01</b><span>SW / INDEPENDENT DIGITAL STUDIO</span></aside>
        <div className="hero-stage">
          <div className="hero-copy">
            <p className="eyebrow"><span /> {ui.eyebrow}</p>
            <h1><span>{ui.title[0]}</span><em>{ui.title[1]}</em><span>{ui.title[2]}</span></h1>
            <div className="hero-bottomline">
              <p className="hero-lead">{ui.lead}</p>
              <div className="hero-actions">
                <a className="button button-light slide-link" href="#products">{ui.action} <span>↓</span></a>
                <Link className="text-link identity-link" href="/account/">{ui.enter} <span>↗</span></Link>
              </div>
            </div>
          </div>
          <aside className="hero-machine">
            <div className="hero-machine-head"><span>SW CORE / LIVE</span><i /></div>
            <div className="hero-core" aria-label="SW Create ürün çekirdeği">
              <div className="orbit orbit-one" aria-hidden="true" />
              <div className="orbit orbit-two" aria-hidden="true" />
              <div className="orbit orbit-three" aria-hidden="true" />
              <div className="core-image"><SwDualCore className="core-logo-shell" /></div>
            </div>
            <div className="hero-machine-links"><a href="https://swcreate.com" aria-label="SW Create ana sayfası">SW CREATE <span>01</span></a><a href="https://pstreamers.com" target="_blank" rel="noreferrer" aria-label="Play Streamers sitesini aç">PLAY STREAMERS <span>02 ↗</span></a></div>
          </aside>
        </div>
        <div className="hero-broadcast" aria-hidden="true"><div>INDEPENDENT DIGITAL STUDIO · SOFTWARE · DESIGN · FILM · SOUND · HARDWARE · EXPERIENCE · </div><div>INDEPENDENT DIGITAL STUDIO · SOFTWARE · DESIGN · FILM · SOUND · HARDWARE · EXPERIENCE · </div></div>
        <p className="hero-scroll-note" aria-hidden="true">SCROLL TO EXPLORE <span>↓</span></p>
      </section>

      <section className="system-strip" aria-label="SW Create sistem özeti" aria-live="polite">
        <p><span className="pulse-dot" /> SW SİSTEM DİZİNİ</p>
        <div><strong>{systemStats.activeUsers}</strong><span>SW ürünlerini aktif kullanan</span></div>
        <div><strong>{systemStats.registeredAccounts}</strong><span>Kayıtlı SW hesabı</span></div>
        <div><strong>{systemStats.activeProducts}</strong><span>Aktif ürün sayısı</span></div>
      </section>

      <section className="field-atlas-section" aria-labelledby="field-atlas-title">
        <header className="field-atlas-heading">
          <p>SW CREATE / VISUAL FIELD ARCHIVE · 01—07</p>
          <h2 id="field-atlas-title">TEK BİR<br /><em>FORMATIMIZ</em><br />YOK.</h2>
          <span>Yazılımdan sahneye, donanımdan filme; fikrin ihtiyaç duyduğu alanı kuruyoruz.</span>
        </header>
        <div className="field-atlas" role="list" aria-label="SW Create üretim alanlarından seçkiler">
          {fieldNotes.map((note, index) => (
            <figure className={`field-shot field-shot-${index + 1}`} key={note.src} role="listitem">
              <div className="field-shot-image"><Image src={note.src} alt={note.alt} fill /></div>
              <figcaption><span>{String(index + 1).padStart(2, "0")} / {note.field}</span><strong>{note.label}</strong></figcaption>
            </figure>
          ))}
        </div>
        <aside className="field-atlas-note" aria-hidden="true"><span>7 DISCIPLINES</span><b>ONE<br />STUDIO</b></aside>
      </section>

      <section id="capabilities" className="work-spectrum-section">
        <header className="work-spectrum-heading">
          <p>SW / MULTIDISCIPLINARY STUDIO</p>
          <h2>Bir fikrin ihtiyaç duyduğu <em>her şey.</em></h2>
          <span>Tek bir uzmanlığa sıkışmıyoruz. Stratejiden yazılıma, kimlikten içeriğe ve fiziksel-dijital deneyimlere kadar fikri çalışan bir bütüne dönüştürüyoruz.</span>
        </header>
        <div className="work-spectrum-grid">
          <article className="work-tile work-tile-product"><figure><Image src="/editorial/product-interface.webp" alt="Mobil ürün ve arayüz tasarımı" fill /></figure><div><span>01 / ÜRÜN</span><h3>Dijital ürünler</h3><p>Web, mobil, kullanıcı deneyimi ve ölçeklenebilir ürün sistemleri.</p></div></article>
          <article className="work-tile work-tile-automation"><figure><Image src="/editorial/automation-sculpture.webp" alt="Otomasyon ve veri sistemlerini temsil eden dijital yerleştirme" fill /></figure><div><span>02 / TEKNOLOJİ</span><h3>AI & otomasyon</h3><p>Tekrarlanan işi azaltan akıllı akışlar, veri köprüleri ve özel araçlar.</p></div></article>
          <article className="work-tile work-tile-brand"><figure><Image src="/editorial/brand-system.webp" alt="Marka kimliği ve editoryal tasarım materyalleri" fill /></figure><div><span>03 / TASARIM</span><h3>Marka sistemleri</h3><p>Kimlik, yön, tipografi ve dijitalde yaşayan görsel dil.</p></div></article>
          <article className="work-tile work-tile-space"><figure><Image src="/editorial/interactive-space.webp" alt="Etkileşimli ışık ve mekân deneyimi" fill /></figure><div><span>04 / DENEYİM</span><h3>Etkileşimli dünyalar</h3><p>WebGL, gerçek zamanlı görseller ve fiziksel-dijital deneyimler.</p></div></article>
          <article className="work-tile work-tile-film"><figure><Image src="/editorial/film-sound.webp" alt="Film, ses ve içerik prodüksiyon ekipmanı" fill /></figure><div><span>05 / İÇERİK</span><h3>Film & ses</h3><p>Hareketli görüntü, ses tasarımı ve hikâyeyi taşıyan içerik.</p></div></article>
          <article className="work-tile work-tile-community"><figure><Image src="/editorial/creator-collective.webp" alt="Yaratıcı topluluğu temsil eden sinematik mekân" fill /></figure><div><span>06 / TOPLULUK</span><h3>Platform & topluluk</h3><p>İnsanları ürün etrafında buluşturan sürdürülebilir dijital alanlar.</p></div></article>
        </div>
      </section>

      <section id="technology" className="technology-section" aria-labelledby="technology-title">
        <header className="technology-heading">
          <p>SW / TECHNOLOGY LAB · 08 SYSTEMS</p>
          <h2 id="technology-title">TEKNOLOJİYİ<br /><em>ARAÇ DEĞİL,</em><br />MALZEME GİBİ<br />İŞLİYORUZ.</h2>
          <span>Yapay zekâ, otomasyon, ürün altyapısı ve yeni nesil arayüzleri araştırıyor; işe yarayan fikirleri dijital ürünlere, deneyimlere ve prototiplere dönüştürüyoruz.</span>
        </header>
        <div className="technology-reel" role="list" aria-label="SW Create teknoloji çalışma alanları">
          {technologyFrames.map((frame, index) => (
            <figure className={`technology-frame technology-frame-${index + 1}`} key={frame.src} role="listitem">
              <Image src={frame.src} alt={frame.alt} fill />
              <figcaption>
                <span>{String(index + 1).padStart(2, "0")} / {frame.field}</span>
                <strong>{frame.label}</strong>
                <small>{frame.note}</small>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="technology-status" aria-hidden="true"><i /> LIVE R&amp;D <span>08 ACTIVE FIELDS</span></div>
      </section>

      <section className="showreel-section" aria-label="SW Create çalışma yaklaşımı">
        <div className="showreel-image"><Image src="/editorial/urban-light-installation.webp" alt="Kırmızı ışık panelleriyle şekillenen kamusal dijital yerleştirme" fill /></div>
        <div className="showreel-noise" aria-hidden="true" />
        <p className="showreel-kicker">SW CREATE / FIELD NOTE 02</p>
        <h2>FİKİR NEREYE<br />GİDERSE, <em>BİZ DE</em><br />ORAYA GİDERİZ.</h2>
        <div className="showreel-caption"><span>NO FIXED DISCIPLINE</span><p>Ürün, görüntü, sistem, ses veya mekân. Çözümün formatını alışkanlık değil, fikrin kendisi belirler.</p></div>
        <div className="showreel-counter" aria-hidden="true"><strong>02</strong><span>06</span></div>
        <div className="showreel-stamp" aria-hidden="true">BUILD<br />BEYOND<br />FORMAT</div>
      </section>

      <section className="kinetic-interlude" aria-label="SW Create üretim alanları">
        <div><span>SOFTWARE</span><i>·</i><em>DESIGN</em><i>·</i><span>PRODUCT</span></div>
        <div><em>AI</em><i>·</i><span>AUTOMATION</span><i>·</i><em>DATA</em></div>
        <div><span>FILM</span><i>·</i><em>SOUND</em><i>·</i><span>EXPERIENCE</span></div>
      </section>

      <section id="products" className="products-section">
        <div className="products-sticky">
          <div className="section-heading">
            <p className="section-number">03 / ÜRÜNLER</p>
            <h2>HER ÜRÜN BİR<br /><span>SW SİNYALİ.</span></h2>
            <p>Her ürün kendi problemini çözer. SW hesabı; kimliği, erişimi ve gelecekteki üyelik avantajlarını ürünler arasında taşır.</p>
          </div>
          <div className="product-progress" aria-hidden="true"><span /><b>DRAGGED BY SCROLL</b><i>01 — 03</i></div>
          <div className="product-gallery">
            {products.map((product, index) => (
              <a className={`product-card product-card-${index + 1} ${product.color} slide-link`} href={product.name === "Play Connect" ? playConnectStore : product.href} key={product.name} target="_blank" rel="noreferrer">
                <div className="product-visual"><Image src={product.visual} alt="" fill /></div>
                <div className="product-card-head"><span>{String(index + 1).padStart(2, "0")}</span><b>{product.group === "site" ? "PLATFORM" : "CONNECTOR"}</b><i>{product.state}</i></div>
                <div className="product-main"><div className="product-brand-mark" aria-hidden="true"><Image src={product.logo} alt="" width={96} height={96} /></div><p>{product.kind}</p><h3>{product.name}</h3><span>{product.copy}</span></div>
                <div className="product-side"><span className="product-command">OPEN PRODUCT</span><span className="arrow">↗</span></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="studio" className="studio-section">
        <div className="studio-statement"><p className="section-number">04 / SW YÖNETİMİ</p><h2>ŞABLON DEĞİL.<br /><i>KENDİ FİZİĞİMİZİ</i> KURUYORUZ.</h2></div>
        <div className="studio-workbench">
          <div className="studio-seal" aria-hidden="true"><span className="studio-logo-mark"><Image src="/brand/swcreate-logo.png" alt="" width={150} height={150} /></span><small>BUILD / VERIFY / EVOLVE</small></div>
          <div className="principle-grid">
            {principles.map(([title, copy], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div><b aria-hidden="true">↘</b></article>)}
          </div>
        </div>
        <div className="studio-cinema" aria-hidden="true">
          <figure><Image src="/editorial/film-production-set.webp" alt="" fill /></figure>
          <figure><Image src="/editorial/hardware-bench.webp" alt="" fill /></figure>
          <figure><Image src="/editorial/material-object-study.webp" alt="" fill /></figure>
        </div>
        <div className="studio-note"><span>SW / METHOD</span><p>Küçük bir ekibin hızını, uzun ömürlü bir ürün ekosisteminin disipliniyle birleştiriyoruz. Her sürüm daha az gürültü, daha fazla kontrol.</p></div>
      </section>

      <section id="edition" className="edition-section">
        <div className="edition-grid" aria-hidden="true" />
        <div className="edition-intro"><div className="edition-badge">SW CREATE EDITION</div><div className="edition-copy"><p className="section-number">05 / TEK PASAPORT</p><h2>BİR KİMLİK.<br />BÜTÜN <span>PRO</span> AVANTAJLARI.</h2><p>SW Create Edition; SW Create çatısı altındaki ürünlerin avantajlarını, erken erişimleri ve özel topluluk ayrıcalıklarını tek üyelikte buluşturur.</p></div><aside><strong>ONE ID</strong><span>ALL PRODUCTS</span></aside></div>
        <div className="plan-grid plan-grid-three">
          <article className="plan-card"><span>01 / SW CREATE FREE</span><h3>Ücretsiz merkez hesabı</h3><strong>₺0</strong><ul><li>Temel ürün özellikleri</li><li>Standart veri aralığı</li><li>Topluluk desteği</li></ul><Link className="identity-link" href="/account/?mode=register">Ücretsiz hesap oluştur <b>↗</b></Link></article>
          <article className="plan-card pro"><span>02 / SW CREATE PRO EDITION</span><h3>Stüdyo avantajları</h3><strong>YAKINDA</strong><ul><li>Güncellemelere önceden erişim</li><li>Özel Discord rolü ve hızlı destek</li><li>Yeni gelir araçlarına erken erişim</li></ul><Link className="identity-link" href="/account/?plan=pro">Pro listesine katıl <b>↗</b></Link></article>
          <article className="plan-card edition"><span>03 / PRODUCT PRO EDITION</span><h3>Bütün ürünlerin Pro erişimi</h3><strong>YAKINDA</strong><ul><li>Tüm SW ürünlerinde Pro</li><li>Yeni ürünlere erken erişim</li><li>Öncelikli ürün desteği</li></ul><Link className="identity-link" href="/account/?plan=edition">Edition listesine katıl <b>↗</b></Link></article>
        </div>
      </section>

      <section className="closing-section"><p>Bir sonraki ürünün<br />çekim alanına gir.</p><Link className="identity-link" href="/account/?mode=register">SW hesabını oluştur <span>↗</span></Link></section>

      <footer className="site-footer">
        <div className="footer-identity"><Link className="brand footer-brand" href="#top" aria-label="Sayfanın başına dön"><Image src="/brand/swcreate-logo.png" alt="" width={52} height={52} /></Link><p>Bağımsız fikirler için karakterli dijital ürünler.</p></div>
        <div className="footer-links"><strong>SW CREATE</strong><Link href="#products">Ürünler</Link><Link href="#studio">SW yönetimi</Link><Link href="#edition">SW Create Edition</Link></div>
        <div className="footer-links"><strong>GÜVEN</strong><Link href="/privacy">Gizlilik</Link><Link href="/terms">Koşullar</Link><a href="mailto:swcreate.info@gmail.com">swcreate.info@gmail.com</a></div>
        <div className="footer-privacy"><span className="pulse-dot" /><strong>GİZLİLİK ÖNCELİKLİ</strong><p>Kimlik ve erişim verilerin yalnızca seçtiğin SW ürünlerini çalıştırmak için kullanılır.</p></div>
        <span className="footer-copyright">© 2026 SW Create · Bağımsız dijital stüdyo</span>
      </footer>
    </main>
  );
}
