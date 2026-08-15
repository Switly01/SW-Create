import type { AnchorHTMLAttributes, ImgHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { SwDualCore } from "./SwDualCore";

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
    href: "https://swcreate.com",
  },
  {
    group: "site",
    name: "Play Streamers",
    kind: "Yayıncı kontrol sistemi",
    copy: "Yayın akışını, topluluk verilerini ve destek olaylarını tek merkezde görünür kılan canlı yayıncı alanı.",
    state: "CANLI",
    color: "cobalt",
    href: "https://pstreamers.com",
  },
  {
    group: "extension",
    name: "Play Connect",
    kind: "Tarayıcı veri köprüsü",
    copy: "Bağış platformlarını tek bir güvenli veri katmanında buluşturan ücretsiz tarayıcı bağlantısı.",
    state: "DENEME",
    color: "coral",
    href: "https://pstreamers.com",
  },
];

const principles = [
  ["Bir hesap", "Her SW Create ürününde aynı kimlik, tek merkez ve taşınabilir erişim."],
  ["Açık kontrol", "Verin, bağlantıların ve ürün izinlerin yalnızca senin yönetiminde."],
  ["Karakterli üretim", "Kopyalanan kalıplar değil; problemi gerçekten çözen bağımsız ürünler."],
];

const languages = [
  ["tr", "/flags/tr.svg", "Türkçe"],
  ["en", "/flags/en.svg", "English"],
  ["de", "/flags/de.svg", "Deutsch"],
  ["es", "/flags/es.svg", "Español"],
  ["fr", "/flags/fr.svg", "Français"],
  ["ru", "/flags/ru.svg", "Русский"],
  ["ar", "/flags/ar.svg", "العربية"],
  ["ja", "/flags/ja.svg", "日本語"],
] as const;

type Language = typeof languages[number][0];
type TransitionMode = "idle" | "slide" | "identity";

const localizedHero: Record<Language, { products: string; method: string; edition: string; account: string; eyebrow: string; title: [string, string, string]; lead: string; action: string; enter: string }> = {
  tr: { products: "Ürünler", method: "SW yönetimi", edition: "SW üyeliği", account: "SW hesabı", eyebrow: "BAĞIMSIZ TEKNOLOJİ STÜDYOSU", title: ["FİKRİN", "KENDİ ÇEKİM", "ALANI OLSUN."], lead: "Yaratıcıların ve dijital toplulukların etrafında dönen karakterli ürünler tasarlıyor, geliştiriyor ve büyütüyoruz.", action: "Sinyali takip et", enter: "SW merkezine gir" },
  en: { products: "Products", method: "SW method", edition: "Edition", account: "SW account", eyebrow: "INDEPENDENT TECHNOLOGY STUDIO", title: ["GIVE YOUR", "IDEA ITS OWN", "GRAVITY."], lead: "We design, build and grow distinctive products around creators and digital communities.", action: "Follow the signal", enter: "Enter SW center" },
  de: { products: "Produkte", method: "SW Methode", edition: "Edition", account: "SW Konto", eyebrow: "UNABHÄNGIGES TECHNOLOGIESTUDIO", title: ["DEINE IDEE", "BRAUCHT EIGENE", "ANZIEHUNGSKRAFT."], lead: "Wir gestalten und entwickeln charaktervolle Produkte für Kreative und digitale Gemeinschaften.", action: "Signal folgen", enter: "SW Zentrale öffnen" },
  es: { products: "Productos", method: "Método SW", edition: "Edition", account: "Cuenta SW", eyebrow: "ESTUDIO TECNOLÓGICO INDEPENDIENTE", title: ["QUE TU IDEA", "TENGA SU PROPIA", "GRAVEDAD."], lead: "Diseñamos y desarrollamos productos con carácter para creadores y comunidades digitales.", action: "Seguir la señal", enter: "Entrar al centro SW" },
  fr: { products: "Produits", method: "Méthode SW", edition: "Edition", account: "Compte SW", eyebrow: "STUDIO TECHNOLOGIQUE INDÉPENDANT", title: ["DONNEZ À", "VOTRE IDÉE SA", "GRAVITÉ."], lead: "Nous concevons et développons des produits distinctifs pour les créateurs et les communautés numériques.", action: "Suivre le signal", enter: "Entrer dans SW" },
  ru: { products: "Продукты", method: "Метод SW", edition: "Edition", account: "Аккаунт SW", eyebrow: "НЕЗАВИСИМАЯ ТЕХНОЛОГИЧЕСКАЯ СТУДИЯ", title: ["ПУСТЬ У", "ИДЕИ БУДЕТ", "СВОЯ ГРАВИТАЦИЯ."], lead: "Мы создаём выразительные продукты для авторов и цифровых сообществ.", action: "Следовать сигналу", enter: "Войти в центр SW" },
  ar: { products: "المنتجات", method: "منهج SW", edition: "Edition", account: "حساب SW", eyebrow: "استوديو تقني مستقل", title: ["لِفكرتك", "جاذبيتها", "الخاصة."], lead: "نصمم ونطور منتجات مميزة للمبدعين والمجتمعات الرقمية.", action: "اتبع الإشارة", enter: "ادخل مركز SW" },
  ja: { products: "製品", method: "SW方式", edition: "Edition", account: "SWアカウント", eyebrow: "独立系テクノロジースタジオ", title: ["アイデアに", "独自の引力を", "与えよう。"], lead: "クリエイターとデジタルコミュニティのために、個性的な製品を設計・開発します。", action: "シグナルを追う", enter: "SWセンターへ" },
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
  const [language, setLanguage] = useState<Language>("tr");
  const [transitionMode, setTransitionMode] = useState<TransitionMode>("idle");
  const [systemStats, setSystemStats] = useState({ activeUsers: "—", registeredAccounts: "—", activeProducts: "—" });
  const cursorOrbitRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<number>(0);
  const ui = localizedHero[language];
  const activeLanguage = languages.find(([code]) => code === language) ?? languages[0];

  useEffect(() => {
    const saved = window.localStorage.getItem("sw-language") as Language | null;
    if (saved && languages.some(([code]) => code === saved)) setLanguage(saved);
  }, []);

  useEffect(() => {
    const resetTransition = () => {
      window.clearTimeout(transitionTimerRef.current);
      setTransitionMode("idle");
    };
    const resetWhenVisible = () => {
      if (document.visibilityState === "visible") resetTransition();
    };
    resetTransition();
    window.addEventListener("pageshow", resetTransition);
    window.addEventListener("pagehide", resetTransition);
    window.addEventListener("popstate", resetTransition);
    document.addEventListener("visibilitychange", resetWhenVisible);
    return () => {
      window.removeEventListener("pageshow", resetTransition);
      window.removeEventListener("pagehide", resetTransition);
      window.removeEventListener("popstate", resetTransition);
      document.removeEventListener("visibilitychange", resetWhenVisible);
      window.clearTimeout(transitionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer = 0;
    const pulseActivity = async () => {
      try {
        await fetch("https://api.swcreate.com/api/activity/pulse", {
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
        const response = await fetch("https://api.swcreate.com/api/stats", { signal: controller.signal, credentials: "omit" });
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
    void pulseActivity().then(loadStats);
    timer = window.setInterval(() => { void pulseActivity().then(loadStats); }, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  function animatedNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setMenuOpen(false);
    setLanguageOpen(false);
    const mode: TransitionMode = href.startsWith("#") ? "slide" : "identity";
    setTransitionMode(mode);
    window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      if (href.startsWith("#")) {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", href);
        transitionTimerRef.current = window.setTimeout(() => setTransitionMode("idle"), 520);
      } else {
        window.location.assign(href);
        transitionTimerRef.current = window.setTimeout(() => setTransitionMode("idle"), 1800);
      }
    }, mode === "identity" ? 560 : 250);
  }

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

  return (
    <main className="site-shell sw-character-site" dir={language === "ar" ? "rtl" : "ltr"}>
      <div ref={cursorOrbitRef} className="cursor-orbit" aria-hidden="true" />
      <div className={`site-transition ${transitionMode !== "idle" ? `active ${transitionMode}` : ""}`} aria-hidden="true">
        {transitionMode === "identity" && <SwDualCore className="transition-core" label="" />}
        <span>SW CREATE</span><i />
      </div>

      <header className="topbar">
        <Link className="brand" href="#top" aria-label="SW Create ana sayfa">
          <span className="brand-mark"><Image src="/brand/swcreate-logo.png" alt="" width={42} height={42} priority /></span>
          <span className="brand-word"><strong>SW CREATE</strong><small>BAĞIMSIZ DİJİTAL STÜDYO</small></span>
        </Link>
        <span className="topbar-signal" aria-hidden="true"><i /> SW CREATE · BAĞIMSIZ DİJİTAL STÜDYO</span>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Menüyü aç veya kapat"><span /> <span /></button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Ana menü">
          <a href="#products" onClick={(event) => animatedNavigation(event, "#products")}>{ui.products}</a>
          <a href="#studio" onClick={(event) => animatedNavigation(event, "#studio")}>{ui.method}</a>
          <a href="#edition" onClick={(event) => animatedNavigation(event, "#edition")}>{ui.edition}</a>
          <div className="language-control">
            <button type="button" className="language-button" onClick={() => setLanguageOpen(!languageOpen)} aria-expanded={languageOpen} aria-label="Dil seçimi"><img src={activeLanguage[1]} alt="" /><span>{language.toUpperCase()}</span></button>
            {languageOpen && <div className="language-menu" role="menu" aria-label="Dil seçimi">
              {languages.map(([code, flag, label]) => <button type="button" key={code} className={language === code ? "active" : ""} onClick={() => chooseLanguage(code)} role="menuitem"><img src={flag} alt="" />{label}</button>)}
            </div>}
          </div>
          <Link className="nav-account identity-link" href="/account" onClick={(event) => animatedNavigation(event, "/account")}>{ui.account} <span>↗</span></Link>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> {ui.eyebrow}</p>
          <h1>{ui.title[0]}<br /><em>{ui.title[1]}</em><br />{ui.title[2]}</h1>
          <p className="hero-lead">{ui.lead}</p>
          <div className="hero-actions">
            <a className="button button-light slide-link" href="#products" onClick={(event) => animatedNavigation(event, "#products")}>{ui.action} <span>↓</span></a>
            <Link className="text-link identity-link" href="/account" onClick={(event) => animatedNavigation(event, "/account")}>{ui.enter} <span>↗</span></Link>
          </div>
        </div>
        <div className="hero-core" aria-label="SW Create ürün çekirdeği">
          <div className="orbit orbit-one" aria-hidden="true" />
          <div className="orbit orbit-two" aria-hidden="true" />
          <div className="orbit orbit-three" aria-hidden="true" />
          <div className="core-image"><SwDualCore className="core-logo-shell" /></div>
          <div className="core-brand-name">SW CREATE</div>
          <div className="core-product-name">PLAY STREAMERS</div>
        </div>
      </section>

      <section className="system-strip" aria-label="SW Create sistem özeti">
        <p><span className="pulse-dot" /> SW SİSTEM DİZİNİ</p>
        <div><strong>{systemStats.activeUsers}</strong><span>SW ürünlerini aktif kullanan</span></div>
        <div><strong>{systemStats.registeredAccounts}</strong><span>Kayıtlı SW hesabı</span></div>
        <div><strong>{systemStats.activeProducts}</strong><span>Aktif ürün sayısı</span></div>
      </section>

      <section id="products" className="products-section">
        <div className="section-heading">
          <p className="section-number">ÜRÜNLER</p>
          <h2>HER ÜRÜN BİR<br /><span>SW SİNYALİ.</span></h2>
          <p>Her ürün kendi problemini çözer. SW hesabı; kimliği, erişimi ve gelecekteki üyelik avantajlarını ürünler arasında taşır.</p>
        </div>
        {(["site", "extension"] as const).map((group) => (
          <div className="product-group" key={group}>
            <div className="product-group-title"><i /> <h3>{group === "site" ? "Siteler" : "Eklentiler"}</h3></div>
            <div className="product-list">
              {products.filter((product) => product.group === group).map((product) => (
                <a className={`product-card ${product.color} slide-link`} href={product.href} key={product.name} target="_blank" rel="noreferrer">
                  <div className="product-main"><p>{product.kind}</p><h3>{product.name}</h3><span>{product.copy}</span></div>
                  <div className="product-side"><span className="state">{product.state}</span><span className="arrow">↗</span></div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="studio" className="studio-section">
        <div className="studio-statement"><p className="section-number">SW YÖNETİMİ</p><h2>ŞABLON DEĞİL.<br /><i>KENDİ FİZİĞİMİZİ</i> KURUYORUZ.</h2></div>
        <div className="principle-grid">
          {principles.map(([title, copy]) => <article key={title}><div className="principle-glyph" aria-hidden="true"><Image src="/brand/swcreate-logo.png" alt="" width={60} height={60} /></div><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
        <div className="studio-note"><span className="studio-logo-mark"><Image src="/brand/swcreate-logo.png" alt="SW Create" width={150} height={150} /></span><p>Küçük bir ekibin hızını, uzun ömürlü bir ürün ekosisteminin disipliniyle birleştiriyoruz. Her sürüm daha az gürültü, daha fazla kontrol.</p></div>
      </section>

      <section id="edition" className="edition-section">
        <div className="edition-grid" aria-hidden="true" />
        <div className="edition-badge">SW CREATE EDITION</div>
        <div className="edition-copy"><p className="section-number">TEK PASAPORT</p><h2>BİR KİMLİK.<br />BÜTÜN <span>PRO</span> YÖRÜNGESİ.</h2><p>SW Create Edition; SW Create çatısı altındaki ürünlerin avantajlarını, erken erişimleri ve özel topluluk ayrıcalıklarını tek üyelikte buluşturur.</p></div>
        <div className="plan-grid plan-grid-three">
          <article className="plan-card"><span>SW CREATE FREE</span><h3>Ücretsiz merkez hesabı</h3><strong>₺0</strong><ul><li>Temel ürün özellikleri</li><li>Standart veri aralığı</li><li>Topluluk desteği</li></ul><Link className="identity-link" href="/account?mode=register" onClick={(event) => animatedNavigation(event, "/account?mode=register")}>Ücretsiz hesap oluştur</Link></article>
          <article className="plan-card pro"><span>SW CREATE PRO EDITION</span><h3>Stüdyo avantajları</h3><strong>YAKINDA</strong><ul><li>Güncellemelere önceden erişim</li><li>Özel Discord rolü ve hızlı destek</li><li>Yeni gelir araçlarına erken erişim</li></ul><Link className="identity-link" href="/account?plan=pro" onClick={(event) => animatedNavigation(event, "/account?plan=pro")}>Pro listesine katıl</Link></article>
          <article className="plan-card edition"><span>SW CREATE PRODUCT PRO EDITION</span><h3>Bütün ürünlerin Pro erişimi</h3><strong>YAKINDA</strong><ul><li>Tüm SW ürünlerinde Pro</li><li>Yeni ürünlere erken erişim</li><li>Öncelikli ürün desteği</li></ul><Link className="identity-link" href="/account?plan=edition" onClick={(event) => animatedNavigation(event, "/account?plan=edition")}>Edition listesine katıl</Link></article>
        </div>
      </section>

      <section className="closing-section"><p>Bir sonraki ürünün<br />çekim alanına gir.</p><Link className="identity-link" href="/account?mode=register" onClick={(event) => animatedNavigation(event, "/account?mode=register")}>SW hesabını oluştur <span>↗</span></Link></section>

      <footer className="site-footer">
        <div className="footer-identity"><Link className="brand footer-brand" href="#top"><Image src="/brand/swcreate-logo.png" alt="" width={44} height={44} /> SW CREATE</Link><p>Bağımsız fikirler için karakterli dijital ürünler.</p></div>
        <div className="footer-links"><strong>SW CREATE</strong><Link href="#products">Ürünler</Link><Link href="#studio">SW yönetimi</Link><Link href="#edition">SW Create Edition</Link></div>
        <div className="footer-links"><strong>GÜVEN</strong><Link href="/privacy">Gizlilik</Link><Link href="/terms">Koşullar</Link><a href="mailto:swcreate.info@gmail.com">İletişim</a></div>
        <div className="footer-privacy"><span className="pulse-dot" /><strong>GİZLİLİK ÖNCELİKLİ</strong><p>Kimlik ve erişim verilerin yalnızca seçtiğin SW ürünlerini çalıştırmak için kullanılır.</p></div>
        <span className="footer-copyright">© 2026 SW Create · Bağımsız dijital stüdyo</span>
      </footer>
    </main>
  );
}
