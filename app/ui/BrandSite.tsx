"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const products = [
  {
    index: "01",
    name: "Play Streamers",
    kind: "Creator intelligence",
    copy: "Yayın akışını, topluluk verilerini ve destek olaylarını tek merkezde görünür kılar.",
    state: "CANLI",
    color: "cobalt",
    href: "https://pstreamers.com",
  },
  {
    index: "02",
    name: "Play Connect",
    kind: "Browser bridge",
    copy: "Bağış platformlarını tek bir güvenli veri katmanında buluşturan ücretsiz tarayıcı köprüsü.",
    state: "BETA",
    color: "coral",
    href: "https://pstreamers.com",
  },
  {
    index: "03",
    name: "Next by SW",
    kind: "Secret project",
    copy: "Üreticilerin dijital gelirlerini ve iş akışlarını yeniden düşünmek için hazırlanıyor.",
    state: "YAKINDA",
    color: "violet",
    href: "#edition",
  },
];

const principles = [
  ["Bir hesap", "Her SW Create ürününde aynı kimlik ve tek üyelik."],
  ["Açık kontrol", "Verin, bağlantıların ve ürün izinlerin senin yönetiminde."],
  ["Bağımsız üretim", "Gösteriş için değil, gerçekten kullanılan ürünler."],
];

export function BrandSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cursor, setCursor] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => setCursor({ x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <main className="site-shell">
      <div className="cursor-orbit" style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }} />
      <header className="topbar">
        <Link className="brand" href="#top" aria-label="SW Create ana sayfa">
          <span className="brand-mark"><Image src="/brand/swcreate-logo.png" alt="" width={42} height={42} priority /></span>
          <span>SW CREATE</span>
        </Link>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Menüyü aç veya kapat">
          <span /> <span />
        </button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Ana menü">
          <a href="#products" onClick={() => setMenuOpen(false)}>Ürünler</a>
          <a href="#studio" onClick={() => setMenuOpen(false)}>Stüdyo</a>
          <a href="#edition" onClick={() => setMenuOpen(false)}>Edition</a>
          <Link className="nav-account" href="/account">SW hesabı <span>↗</span></Link>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> BAĞIMSIZ TEKNOLOJİ STÜDYOSU</p>
          <h1>FİKRİN<br />KENDİ <em>ÇEKİM</em><br />ALANI OLSUN.</h1>
          <p className="hero-lead">Yaratıcıların ve dijital toplulukların etrafında dönen karakterli ürünler tasarlıyor, geliştiriyor ve büyütüyoruz.</p>
          <div className="hero-actions">
            <a className="button button-light" href="#products">Ekosistemi keşfet <span>↓</span></a>
            <Link className="text-link" href="/account">Merkezî hesabını oluştur <span>↗</span></Link>
          </div>
        </div>
        <div className="hero-art">
          <Image src="/brand/swcreate-orbit-core.png" alt="SW Create yaratıcı çekirdek illüstrasyonu" fill sizes="(max-width: 900px) 100vw, 58vw" priority />
          <div className="art-label label-one">BUILD / SHIP / EVOLVE</div>
          <div className="art-label label-two">IST · 2026</div>
        </div>
        <div className="hero-ticker" aria-hidden="true">
          <span>DESIGN WITH INTENT ✦ BUILD WITH CHARACTER ✦ SHIP WHAT MATTERS ✦ </span>
          <span>DESIGN WITH INTENT ✦ BUILD WITH CHARACTER ✦ SHIP WHAT MATTERS ✦ </span>
        </div>
      </section>

      <section id="products" className="products-section">
        <div className="section-heading">
          <p className="section-number">/ 01 — ÜRÜNLER</p>
          <h2>TEK TEK GÜÇLÜ.<br /><span>BİRLİKTE DAHA AKILLI.</span></h2>
          <p>Her ürün kendi problemini çözer. SW hesabı; kimliği, erişimi ve gelecekteki Edition avantajlarını aralarında taşır.</p>
        </div>
        <div className="product-list">
          {products.map((product) => (
            <a className={`product-card ${product.color}`} href={product.href} key={product.name} target={product.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              <span className="product-index">{product.index}</span>
              <div className="product-main">
                <p>{product.kind}</p>
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
          <p className="section-number">/ 02 — STÜDYO</p>
          <h2>SADECE ARAYÜZ DEĞİL.<br /><i>DAVRANIŞ</i> TASARLIYORUZ.</h2>
        </div>
        <div className="principle-grid">
          {principles.map(([title, copy], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <div className="studio-note">
          <span className="rotating-word">SW / SW / SW / SW /</span>
          <p>SW Create, küçük ama iddialı ürün ekiplerinin çevikliğini; uzun ömürlü bir ürün ekosisteminin disipliniyle birleştirir.</p>
        </div>
      </section>

      <section id="edition" className="edition-section">
        <div className="edition-badge">SW CREATE EDITION</div>
        <div className="edition-copy">
          <p className="section-number">/ 03 — ÜYELİK</p>
          <h2>BİR ÜYELİK.<br />BÜTÜN <span>PRO</span> DÜNYASI.</h2>
          <p>SW Create Edition; SW Create çatısı altındaki tüm ürünlerin Pro ayrıcalıklarını, erken erişimleri ve özel topluluk avantajlarını tek üyelikte buluşturacak.</p>
        </div>
        <div className="plan-grid">
          <article className="plan-card">
            <span>FREE</span><h3>Başlamak için</h3><strong>₺0</strong>
            <ul><li>Temel ürün özellikleri</li><li>Standart veri aralığı</li><li>Topluluk desteği</li></ul>
            <Link href="/account?mode=register">Ücretsiz hesap oluştur</Link>
          </article>
          <article className="plan-card pro">
            <span>PRODUCT PRO</span><h3>Tek üründe daha fazlası</h3><strong>YAKINDA</strong>
            <ul><li>Gelişmiş analiz ve kişiselleştirme</li><li>Öncelikli özellik erişimi</li><li>Daha uzun veri geçmişi</li></ul>
            <Link href="/account?plan=pro">Erken erişim listesi</Link>
          </article>
          <article className="plan-card edition">
            <span>SW CREATE EDITION</span><h3>Ekosistemin tamamı</h3><strong>YAKINDA</strong>
            <ul><li>Tüm SW ürünlerinde Pro</li><li>Yeni ürünlere erken erişim</li><li>Discord özel rol ve hızlı destek</li></ul>
            <Link href="/account?plan=edition">Edition listesine katıl</Link>
          </article>
        </div>
      </section>

      <section className="closing-section">
        <p>Bir sonraki ürünün<br />çekim alanına gir.</p>
        <Link href="/account?mode=register">SW hesabını oluştur <span>↗</span></Link>
      </section>

      <footer>
        <Link className="brand footer-brand" href="#top"><Image src="/brand/swcreate-logo.png" alt="" width={36} height={36} /> SW CREATE</Link>
        <p>İstanbul’dan, internet için.</p>
        <div><Link href="/privacy">Gizlilik</Link><Link href="/terms">Koşullar</Link><a href="mailto:swcreate.info@gmail.com">İletişim</a></div>
        <span>© 2026 SW Create</span>
      </footer>
    </main>
  );
}
