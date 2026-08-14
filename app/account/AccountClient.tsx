"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export type SwAccount = {
  profile: {
    userId: string;
    email: string;
    displayName: string;
    createdAt: number;
  };
  entitlements: Array<{
    product: string;
    slug: string;
    tier: string;
  }>;
};

type Identity = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
} | null;

type AccountClientProps = {
  account: SwAccount | null;
  accountError: string | null;
  identity: Identity;
  initialMode: "login" | "register";
  selectedPlan: string | null;
  signInPath: string;
  signOutPath: string;
};

const planLabels: Record<string, string> = {
  pro: "Ürün Pro",
  edition: "SW Create Özel",
};

export function AccountClient({
  account,
  accountError,
  identity,
  initialMode,
  selectedPlan,
  signInPath,
  signOutPath,
}: AccountClientProps) {
  const [mode, setMode] = useState(initialMode);
  const [view, setView] = useState<"overview" | "profile" | "security">("overview");
  const [displayName, setDisplayName] = useState(account?.profile.displayName ?? "");
  const [savedName, setSavedName] = useState(account?.profile.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const data = await response.json() as { profile?: { displayName: string }; error?: string };
      if (!response.ok || !data.profile) throw new Error(data.error || "Profil kaydedilemedi.");
      setDisplayName(data.profile.displayName);
      setSavedName(data.profile.displayName);
      setStatus({ type: "success", text: "Profil bilgilerin kaydedildi." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Profil kaydedilemedi." });
    } finally {
      setBusy(false);
    }
  }

  if (!identity) {
    return (
      <section className="account-panel">
        <div className="auth-box">
          <p className="section-number">SW KİMLİK — GÜVENLİ GİRİŞ</p>
          <h1>HESABIN.<br />EKOSİSTEMİN.</h1>
          <p>SW hesabın; Play Streamers, Play Connect ve gelecekteki SW ürünlerindeki erişimlerini tek kimlik altında toplar.</p>

          {selectedPlan && planLabels[selectedPlan] && (
            <div className="selected-plan"><span>SEÇİLEN ERİŞİM</span><strong>{planLabels[selectedPlan]}</strong><small>Giriş yaptıktan sonra hesabında hazır olacak.</small></div>
          )}

          <div className="auth-tabs" role="tablist" aria-label="Hesap işlemi">
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Giriş yap</button>
            <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Hesap oluştur</button>
          </div>

          <div className="identity-entry">
            <span className="identity-glyph" aria-hidden="true">SW</span>
            <div><strong>{mode === "login" ? "ChatGPT ile güvenli giriş" : "Ücretsiz SW hesabını oluştur"}</strong><p>{mode === "login" ? "ChatGPT kimliğini doğrula ve SW ürün merkezine devam et." : "ChatGPT ile ilk girişinde hesabın ve ücretsiz ürün erişimlerin otomatik hazırlanır."}</p></div>
          </div>
          <Link className="auth-submit identity-submit" href={signInPath}>{mode === "login" ? "GÜVENLİ GİRİŞE DEVAM ET" : "SW HESABINI OLUŞTUR"}<span>↗</span></Link>

          <ul className="identity-benefits">
            <li><i /> ChatGPT parolan SW Create tarafından görülmez veya tutulmaz.</li>
            <li><i /> Ürün yetkilerin tek hesapta kalır.</li>
            <li><i /> İstediğin zaman güvenle çıkış yapabilirsin.</li>
          </ul>
          <p className="identity-legal">Devam ederek <Link href="/terms">Koşullar</Link> ve <Link href="/privacy">Gizlilik Politikası</Link> metinlerini kabul etmiş olursun.</p>
          <Link className="account-back" href="/">← SW Create’a dön</Link>
        </div>
      </section>
    );
  }

  if (!account) {
    return (
      <section className="account-panel">
        <div className="auth-box">
          <p className="section-number">SW KİMLİK — OTURUM AÇIK</p>
          <h1>HESAP MERKEZİ<br />BEKLİYOR.</h1>
          <div className="account-error"><strong>Kimliğin doğrulandı.</strong><p>{accountError}</p></div>
          <a className="auth-submit identity-submit" href="/account">YENİDEN DENE <span>↻</span></a>
          <a className="account-back" href={signOutPath}>Güvenli çıkış yap</a>
        </div>
      </section>
    );
  }

  const memberSince = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(account.profile.createdAt * 1000);

  return (
    <section className="account-panel account-panel-authenticated">
      <div className="account-hub">
        <header className="account-hub-head">
          <div><p className="section-number">SW KİMLİK — BAĞLI</p><h1>MERHABA,<br />{savedName.toLocaleUpperCase("tr-TR")}.</h1></div>
          <span className="account-live"><i /> HESAP AKTİF</span>
        </header>

        <nav className="account-nav" aria-label="Hesap bölümleri">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>01</span>Genel bakış</button>
          <button className={view === "profile" ? "active" : ""} onClick={() => setView("profile")}><span>02</span>Profil</button>
          <button className={view === "security" ? "active" : ""} onClick={() => setView("security")}><span>03</span>Güvenlik</button>
        </nav>

        {view === "overview" && (
          <div className="account-view account-overview">
            <div className="account-summary-grid">
              <article><span>SW KİMLİĞİ</span><strong>{account.profile.userId.slice(0, 8).toUpperCase()}</strong><small>Merkezi hesap numaran</small></article>
              <article><span>ÜRÜN ERİŞİMİ</span><strong>{String(account.entitlements.length).padStart(2, "0")}</strong><small>Etkin ürün bağlantısı</small></article>
              <article><span>ÜYELİK</span><strong>FREE</strong><small>{memberSince} tarihinden beri</small></article>
            </div>
            <section className="product-access">
              <div className="account-section-title"><div><span>/ ÜRÜN ERİŞİMLERİ</span><h2>SW yörüngendeki ürünler</h2></div><small>{account.entitlements.length} AKTİF</small></div>
              <div className="entitlement-list">
                {account.entitlements.map((item, index) => (
                  <div className="entitlement" key={item.slug}><span className="entitlement-index">0{index + 1}</span><div><strong>{item.product}</strong><small>{item.slug === "play-connect" ? "Tarayıcı veri köprüsü" : "Yayıncı kontrol sistemi"}</small></div><b>{item.tier.toUpperCase()}</b></div>
                ))}
              </div>
            </section>
          </div>
        )}

        {view === "profile" && (
          <div className="account-view">
            <div className="account-section-title"><div><span>/ PROFİL</span><h2>SW kimlik bilgilerin</h2></div></div>
            <form className="profile-form" onSubmit={saveProfile}>
              <label>GÖRÜNEN AD<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={48} required /></label>
              <label>E-POSTA<input value={account.profile.email} disabled aria-describedby="email-note" /></label>
              <p id="email-note">E-posta adresin güvenli kimlik sağlayıcından alınır ve buradan değiştirilemez.</p>
              <button className="auth-submit" disabled={busy || displayName.trim() === savedName}>{busy ? "KAYDEDİLİYOR…" : "PROFİLİ KAYDET"}</button>
              <div className={`auth-status ${status?.type || ""}`} role="status">{status?.text}</div>
            </form>
          </div>
        )}

        {view === "security" && (
          <div className="account-view">
            <div className="account-section-title"><div><span>/ GÜVENLİK</span><h2>Oturum ve kimlik</h2></div></div>
            <div className="security-card"><span className="identity-glyph" aria-hidden="true">✓</span><div><strong>Güvenli oturum etkin</strong><p>Parolan SW Create tarafından saklanmaz. Kimliğin giriş sağlayıcın üzerinden doğrulanır.</p></div></div>
            <div className="security-row"><div><span>BAĞLI E-POSTA</span><strong>{account.profile.email}</strong></div><span className="verified-pill">DOĞRULANDI</span></div>
            <a className="signout-button" href={signOutPath}>Bütün SW oturumundan çıkış yap <span>↗</span></a>
          </div>
        )}

        <footer className="account-hub-footer"><Link href="/">← SW Create’a dön</Link><span>SW KİMLİK / GÜVENLİ KANAL</span></footer>
      </div>
    </section>
  );
}
