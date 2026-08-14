import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
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
    index: "01",
    signal: "SW/PLAY-001",
    name: "Play Streamers",
    kind: "Yayıncı kontrol sistemi",
    copy: "Yayın akışını, topluluk verilerini ve destek olaylarını tek merkezde görünür kılan canlı yayıncı alanı.",
    state: "CANLI",
    color: "cobalt",
    href: "https://pstreamers.com",
  },
  {
    index: "02",
    signal: "SW/BRIDGE-002",
    name: "Play Connect",
    kind: "Tarayıcı veri köprüsü",
    copy: "Bağış platformlarını tek bir güvenli veri katmanında buluşturan ücretsiz tarayıcı bağlantısı.",
    state: "BETA",
    color: "coral",
    href: "https://pstreamers.com",
  },
  {
    index: "03",
    signal: "SW/UNKNOWN-003",
    name: "Next by SW",
    kind: "Gizli frekans",
    copy: "Üreticilerin dijital gelirlerini ve iş akışlarını yeniden düşünmek için çekirdekte hazırlanıyor.",
    state: "YAKINDA",
    color: "violet",
    href: "#edition",
  },
];

const principles = [
  ["01", "Bir hesap", "Her SW Create ürününde aynı kimlik, tek merkez ve taşınabilir erişim."],
  ["02", "Açık kontrol", "Verin, bağlantıların ve ürün izinlerin yalnızca senin yönetiminde."],
  ["03", "Karakterli üretim", "Kopyalanan kalıplar değil; problemi gerçekten çözen bağımsız ürünler."],
];

const systemStats = [
  ["02", "Yayındaki ürün"],
  ["01", "Ortak SW hesabı"],
  ["IST", "Merkez koordinat"],
  ["∞", "Üretim döngüsü"],
];

export function BrandSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cursorOrbitRef = useRef<HTMLDivElement>(null);

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
    <main className="site-shell sw-character-site">
      <div ref={cursorOrbitRef} className="cursor-orbit" aria-hidden="true" />

      <header className="topbar">
        <Link className="brand" href="#top" aria-label="SW Create ana sayfa">
          <span className="brand-mark"><Image src="/brand/swcreate-logo.png" alt="" width={42} height={42} priority /></span>
          <span className="brand-word"><strong>SW CREATE</strong><small>INDEPENDENT DIGITAL STUDIO</small></span>
        </Link>
        <span className="topbar-signal" aria-hidden="true"><i /> SIGNAL / IST / 2026</span>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Menüyü aç veya kapat">
          <span /> <span />
        </button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Ana menü">
          <a href="#products" onClick={() => setMenuOpen(false)}>Ürünler</a>
          <a href="#studio" onClick={() => setMenuOpen(false)}>SW yöntemi</a>
          <a href="#edition" onClick={() => setMenuOpen(false)}>Edition</a>
          <Link className="nav-account" href="/account">SW hesabı <span>↗</span></Link>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-rail hero-rail-left" aria-hidden="true">SW/CORE_001 · 41.0082° N · 28.9784° E</div>
        <div className="hero-copy">
          <p className="eyebrow"><span /> BAĞIMSIZ TEKNOLOJİ STÜDYOSU <b>／ 001</b></p>
          <h1>FİKRİN<br />KENDİ <em>ÇEKİM</em><br />ALANI OLSUN.</h1>
          <p className="hero-lead">Yaratıcıların ve dijital toplulukların etrafında dönen karakterli ürünler tasarlıyor, geliştiriyor ve büyütüyoruz.</p>
          <div className="hero-actions">
            <a className="button button-light" href="#products">Sinyali takip et <span>↓</span></a>
            <Link className="text-link" href="/account">SW merkezine gir <span>↗</span></Link>
          </div>
        </div>

        <div className="hero-core" aria-label="SW Create ürün çekirdeği">
          <div className="core-coordinate core-coordinate-top">SYSTEM / ONLINE</div>
          <div className="orbit orbit-one" aria-hidden="true" />
          <div className="orbit orbit-two" aria-hidden="true" />
          <div className="orbit orbit-three" aria-hidden="true" />
          <div className="core-image">
            <SwDualCore className="core-logo-shell" />
            <span className="core-logo-code" aria-hidden="true">SW / CORE 001</span>
          </div>
          <a className="signal-node node-play" href="https://pstreamers.com" target="_blank" rel="noreferrer"><i /> PLAY STREAMERS <b>LIVE</b></a>
          <a className="signal-node node-connect" href="https://pstreamers.com" target="_blank" rel="noreferrer"><i /> PLAY CONNECT <b>BETA</b></a>
          <a className="signal-node node-edition" href="#edition"><i /> SW EDITION <b>SOON</b></a>
          <div className="core-readout"><span>CREATIVE GRAVITY</span><strong>100%</strong><small>Ideas in orbit</small></div>
        </div>

      </section>

      <section className="system-strip" aria-label="SW Create sistem özeti">
        <p><span className="pulse-dot" /> SW SYSTEM INDEX</p>
        {systemStats.map(([value, label]) => (
          <div key={label}><strong>{value}</strong><span>{label}</span></div>
        ))}
      </section>

      <section id="products" className="products-section">
        <div className="section-heading">
          <p className="section-number">/ 01 — YAYINLAR</p>
          <h2>HER ÜRÜN BİR<br /><span>SW SİNYALİ.</span></h2>
          <p>Her ürün kendi problemini çözer. SW hesabı; kimliği, erişimi ve gelecekteki Edition avantajlarını ürünler arasında taşır.</p>
        </div>
        <div className="product-list">
          {products.map((product) => (
            <a className={`product-card ${product.color}`} data-signal={product.signal} href={product.href} key={product.name} target={product.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              <span className="product-index">{product.index}</span>
              <div className="product-main">
                <p>{product.signal} <i /> {product.kind}</p>
                <h3>{product.name}</h3>
                <span>{product.copy}</span>
              </div>
              <div className="product-side">
                <span className="state">{product.state}</span>
                <span className="arrow">↗</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="studio" className="studio-section">
        <div className="studio-statement">
          <p className="section-number">/ 02 — SW YÖNTEMİ</p>
          <h2>ŞABLON DEĞİL.<br /><i>KENDİ FİZİĞİMİZİ</i> KURUYORUZ.</h2>
        </div>
        <div className="principle-grid">
          {principles.map(([number, title, copy]) => (
            <article key={title}>
              <span>{number} / PRINCIPLE</span>
              <div className="principle-glyph" aria-hidden="true"><b>SW</b></div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <div className="studio-note">
          <span className="rotating-word">SW / SW / SW / SW /</span>
          <p>Küçük bir ekibin hızını, uzun ömürlü bir ürün ekosisteminin disipliniyle birleştiriyoruz. Her sürüm daha az gürültü, daha fazla kontrol.</p>
        </div>
      </section>

      <section id="edition" className="edition-section">
        <div className="edition-grid" aria-hidden="true" />
        <div className="edition-badge">SW CREATE EDITION</div>
        <div className="edition-copy">
          <p className="section-number">/ 03 — TEK PASAPORT</p>
          <h2>BİR KİMLİK.<br />BÜTÜN <span>PRO</span> YÖRÜNGESİ.</h2>
          <p>SW Create Edition; SW Create çatısı altındaki tüm ürünlerin Pro ayrıcalıklarını, erken erişimleri ve özel topluluk avantajlarını tek üyelikte buluşturacak.</p>
        </div>
        <div className="plan-grid">
          <article className="plan-card">
            <span>FREE / 00</span><h3>Başlangıç sinyali</h3><strong>₺0</strong>
            <ul><li>Temel ürün özellikleri</li><li>Standart veri aralığı</li><li>Topluluk desteği</li></ul>
            <Link href="/account?mode=register">Ücretsiz hesap oluştur</Link>
          </article>
          <article className="plan-card pro">
            <span>PRODUCT PRO / 01</span><h3>Tek üründe daha derin</h3><strong>YAKINDA</strong>
            <ul><li>Gelişmiş analiz ve kişiselleştirme</li><li>Öncelikli özellik erişimi</li><li>Daha uzun veri geçmişi</li></ul>
            <Link href="/account?plan=pro">Erken erişim listesi</Link>
          </article>
          <article className="plan-card edition">
            <span>SW EDITION / ∞</span><h3>Ekosistemin tamamı</h3><strong>YAKINDA</strong>
            <ul><li>Tüm SW ürünlerinde Pro</li><li>Yeni ürünlere erken erişim</li><li>Discord özel rol ve hızlı destek</li></ul>
            <Link href="/account?plan=edition">Edition listesine katıl</Link>
          </article>
        </div>
      </section>

      <section className="closing-section">
        <span className="closing-code">SW/ENTRY_POINT</span>
        <p>Bir sonraki ürünün<br />çekim alanına gir.</p>
        <Link href="/account?mode=register">SW hesabını oluştur <span>↗</span></Link>
      </section>

      <footer>
        <Link className="brand footer-brand" href="#top"><Image src="/brand/swcreate-logo.png" alt="" width={36} height={36} /> SW CREATE</Link>
        <p>İstanbul’dan, internet için.</p>
        <div><Link href="/privacy">Gizlilik</Link><Link href="/terms">Koşullar</Link><a href="mailto:swcreate.info@gmail.com">İletişim</a></div>
        <span>© 2026 SW Create / SW-001</span>
      </footer>
    </main>
  );
}
