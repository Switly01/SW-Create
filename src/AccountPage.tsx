import { FormEvent, useEffect, useState } from "react";
import { API_BASE, apiRequest, type SwAccount } from "./api";
import { SwDualCore } from "../app/ui/SwDualCore";

type View = "overview" | "profile" | "security";
type Mode = "login" | "register";

const planLabels: Record<string, string> = {
  pro: "Product Pro",
  edition: "SW Create Edition",
};

function AccountPanel() {
  const params = new URLSearchParams(window.location.search);
  const selectedPlan = params.get("plan");
  const [mode, setMode] = useState<Mode>(params.get("mode") === "register" || Boolean(selectedPlan) ? "register" : "login");
  const [view, setView] = useState<View>("overview");
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const oauthResult = new URLSearchParams(window.location.search);
    const oauthError = oauthResult.get("oauth_error");
    if (oauthError) {
      const messages: Record<string, string> = {
        configuration: "Bu giriş yöntemi henüz yapılandırılmadı.",
        cancelled: "Giriş işlemi iptal edildi.",
        expired: "Giriş bağlantısının süresi doldu. Yeniden dene.",
        profile: "Hesap bilgileri sağlayıcıdan alınamadı.",
        failed: "Sosyal giriş şu anda tamamlanamadı.",
      };
      setStatus({ type: "error", text: messages[oauthError] || messages.failed });
    } else if (oauthResult.get("oauth") === "success") {
      setStatus({ type: "success", text: "SW hesabına güvenli biçimde giriş yapıldı." });
      window.history.replaceState({}, "", "/account/");
    }
    apiRequest<SwAccount>("/api/account")
      .then((data) => {
        setAccount(data);
        setDisplayName(data.user.displayName);
      })
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiRequest<SwAccount>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
          displayName: String(form.get("displayName") || ""),
        }),
      });
      setAccount(data);
      setDisplayName(data.user.displayName);
      setStatus({ type: "success", text: mode === "register" ? "SW hesabın oluşturuldu." : "Tekrar hoş geldin." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı." });
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const data = await apiRequest<SwAccount>("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify({ displayName }),
      });
      setAccount(data);
      setDisplayName(data.user.displayName);
      setStatus({ type: "success", text: "Profil bilgilerin kaydedildi." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Profil kaydedilemedi." });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
      setAccount(null);
      setView("overview");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <section className="account-panel"><div className="auth-box"><p className="section-number">SW IDENTITY</p><h1>HESABIN<br />HAZIRLANIYOR.</h1></div></section>;
  }

  if (!account) {
    return (
      <section className="account-panel">
        <div className="auth-box">
          <p className="section-number">SW IDENTITY — BAĞIMSIZ HESAP</p>
          <h1>HESABIN.<br />EKOSİSTEMİN.</h1>
          <p>SW hesabın; Play Streamers, Play Connect ve gelecekteki SW ürünlerindeki erişimlerini tek kimlik altında toplar.</p>

          {selectedPlan && planLabels[selectedPlan] && (
            <div className="selected-plan"><span>SEÇİLEN ERİŞİM</span><strong>{planLabels[selectedPlan]}</strong><small>Hesabını oluşturduktan sonra erken erişim tercihin hazır olacak.</small></div>
          )}

          <div className="auth-tabs" role="tablist" aria-label="Hesap işlemi">
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setStatus(null); }}>Giriş yap</button>
            <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setStatus(null); }}>Hesap oluştur</button>
          </div>

          <div className="social-auth" aria-label="Sosyal hesapla devam et">
            <a className="social-auth-button google" href={`${API_BASE}/api/auth/oauth/google/start`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z"/></svg>
              <span>Google ile devam et</span>
            </a>
            <a className="social-auth-button kick" href={`${API_BASE}/api/auth/oauth/kick/start`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 2h8v6h2V6h2V4h6v6h-2v2h2v10h-8v-6h-2v2H9v4H3V2Z"/></svg>
              <span>Kick ile devam et</span>
            </a>
          </div>
          <div className="auth-divider"><span>veya e-posta ile</span></div>

          <form className="auth-form profile-form" onSubmit={submit}>
            {mode === "register" && <label>GÖRÜNEN AD<input name="displayName" autoComplete="name" minLength={2} maxLength={48} required /></label>}
            <label>E-POSTA<input name="email" type="email" autoComplete="email" required /></label>
            <label>ŞİFRE<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={10} maxLength={200} required /></label>
            <button className="auth-submit" disabled={busy}>{busy ? "İŞLENİYOR…" : mode === "login" ? "SW HESABINA GİR ↗" : "SW HESABINI OLUŞTUR ↗"}</button>
          </form>
          <div className={`auth-status ${status?.type || ""}`} role="status">{status?.text}</div>
          <ul className="identity-benefits">
            <li><i /> Parolan yalnızca güçlü ve tuzlanmış bir özet olarak saklanır.</li>
            <li><i /> Ürün yetkilerin tek SW hesabında kalır.</li>
            <li><i /> ChatGPT veya başka bir üçüncü taraf hesabı gerekmez.</li>
          </ul>
          <p className="identity-legal">Devam ederek <a href="/terms/">Koşullar</a> ve <a href="/privacy/">Gizlilik Politikası</a> metinlerini kabul etmiş olursun.</p>
          <a className="account-back" href="/">← SW Create’a dön</a>
        </div>
      </section>
    );
  }

  const memberSince = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(account.user.createdAt * 1000);

  return (
    <section className="account-panel account-panel-authenticated">
      <div className="account-hub">
        <header className="account-hub-head">
          <div><p className="section-number">SW IDENTITY — BAĞLI</p><h1>MERHABA,<br />{account.user.displayName.toLocaleUpperCase("tr-TR")}.</h1></div>
          <span className="account-live"><i /> HESAP AKTİF</span>
        </header>

        <nav className="account-nav" aria-label="Hesap bölümleri">
          <button className={view === "overview" ? "active" : ""} disabled={view === "overview"} onClick={() => setView("overview")}><span>01</span>Genel bakış</button>
          <button className={view === "profile" ? "active" : ""} disabled={view === "profile"} onClick={() => setView("profile")}><span>02</span>Profil</button>
          <button className={view === "security" ? "active" : ""} disabled={view === "security"} onClick={() => setView("security")}><span>03</span>Güvenlik</button>
        </nav>

        {view === "overview" && (
          <div className="account-view account-overview">
            <div className="account-summary-grid">
              <article><span>SW KİMLİĞİ</span><strong>{account.user.id.slice(0, 8).toUpperCase()}</strong><small>Merkezi hesap numaran</small></article>
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
              <label>E-POSTA<input value={account.user.email} disabled /></label>
              <p>E-posta değişikliği, doğrulama sistemi etkinleştirildikten sonra buradan yönetilecek.</p>
              <button className="auth-submit" disabled={busy || displayName.trim() === account.user.displayName}>DEĞİŞİKLİKLERİ KAYDET <span>↗</span></button>
            </form>
            <div className={`auth-status ${status?.type || ""}`} role="status">{status?.text}</div>
          </div>
        )}

        {view === "security" && (
          <div className="account-view">
            <div className="account-section-title"><div><span>/ GÜVENLİK</span><h2>Oturum ve kimlik</h2></div></div>
            <div className="security-card"><span className="identity-glyph">SW</span><div><strong>Bağımsız SW oturumu</strong><p>Oturumun güvenli, HttpOnly çerez ve 30 günlük süre ile korunur.</p></div></div>
            <div className="security-row"><div><span>BAĞLI E-POSTA</span><strong>{account.user.email}</strong></div><span className="verified-pill">KAYITLI</span></div>
            <button type="button" className="signout-button" onClick={logout} disabled={busy}>Bütün SW oturumundan çıkış yap <span>↗</span></button>
          </div>
        )}

        <footer className="account-hub-footer"><a href="/">← SW Create’a dön</a><span>SW IDENTITY / SECURE CHANNEL</span></footer>
      </div>
    </section>
  );
}

export function AccountPage() {
  return (
    <main className="account-shell">
      <section className="account-art" aria-label="SW Create kimlik alanı">
        <div className="account-core-stage" aria-hidden="true">
          <i className="account-core-ring account-core-ring-one" />
          <i className="account-core-ring account-core-ring-two" />
          <i className="account-core-ring account-core-ring-three" />
          <SwDualCore className="account-dual-core" label="" />
        </div>
        <a className="brand" href="/"><span className="brand-mark"><img src="/brand/swcreate-logo.png" alt="" /></span><span>SW CREATE</span></a>
        <div className="account-signal" aria-hidden="true"><i /> IDENTITY NETWORK / SECURE</div>
        <div className="account-quote"><p>TEK KİMLİK.<br />BÜTÜN ÜRÜNLER.</p><span>SW IDENTITY / v1.0</span></div>
      </section>
      <AccountPanel />
    </main>
  );
}
