import { useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";
import { rememberSwAccount } from "./rememberedAccounts";
import { SW_IDENTITY_VERSION } from "./security";

type Surface = "menu" | "notifications" | "language" | "status" | "bot" | null;
type Locale = "tr" | "en";

const copy = {
  tr: { home: "KULLANICI ANA SAYFASI", hello: "MERHABA", dashboard: "Dashboard", news: "NELER YENİ?", products: "Ürünlerin", menu: "Menü", language: "Dil", notifications: "Bildirimler", system: "Sistem", bot: "Play Bot" },
  en: { home: "MEMBER HOME", hello: "HELLO", dashboard: "Dashboard", news: "WHAT'S NEW?", products: "Your products", menu: "Menu", language: "Language", notifications: "Notifications", system: "System", bot: "Play Bot" },
} as const;

function playConnectUrl() {
  const firefox = /Firefox|FxiOS/i.test(navigator.userAgent);
  return firefox
    ? "https://addons.mozilla.org/en-US/firefox/addon/play-connect/"
    : "https://chromewebstore.google.com/detail/play-connect/mpebmfjcdkflgiloecjonopfknojdaip";
}

export function MemberHomePage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [surface, setSurface] = useState<Surface>(null);
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem("sw-language") === "en" ? "en" : "tr");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("sw-language", locale);
  }, [locale]);

  useEffect(() => {
    apiRequest<SwAccount>("/api/account")
      .then((data) => { rememberSwAccount(data); setAccount(data); })
      .catch(() => window.location.replace("/account/"));
  }, []);

  function toggle(next: Exclude<Surface, null>) {
    setSurface((current) => current === next ? null : next);
  }

  async function logout() {
    setBusy(true);
    await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => undefined);
    window.location.replace("/");
  }

  if (!account) return <main className="member-shell"><div className="member-loading">KULLANICI ANA SAYFAN HAZIRLANIYOR…</div></main>;
  const memberSince = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", { month: "long", year: "numeric" }).format(account.user.createdAt * 1000);
  const displayName = account.user.username || account.user.displayName;
  const t = copy[locale];

  return (
    <main className="member-shell member-home-shell">
      <header className="member-topbar member-command-bar">
        <a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>{t.home}</small></span></a>
        <div className="member-home-tools">
          <a className="member-dashboard-button" href="https://pstreamers.com" target="_blank" rel="noreferrer">{t.dashboard}<b>↗</b></a>
          <button type="button" className={surface === "notifications" ? "active" : ""} onClick={() => toggle("notifications")} title={t.notifications} aria-label={t.notifications}><span>◆</span><i /></button>
          <button type="button" className={surface === "language" ? "active" : ""} onClick={() => toggle("language")} title={t.language} aria-label={t.language}><span>◎</span></button>
          <button type="button" className={surface === "status" ? "active warning" : "warning"} onClick={() => toggle("status")} title={t.system} aria-label={t.system}><span>!</span></button>
          <button type="button" className={surface === "bot" ? "active play-bot" : "play-bot"} onClick={() => toggle("bot")} title={t.bot} aria-label={t.bot}><span>PB</span></button>
          <button type="button" className={surface === "menu" ? "active menu" : "menu"} onClick={() => toggle("menu")} title={t.menu} aria-label={t.menu}><span>≡</span></button>
        </div>
        {surface && <aside className={`member-command-surface ${surface}`}>
          <button className="member-command-close" type="button" onClick={() => setSurface(null)} aria-label="Kapat">×</button>
          {surface === "notifications" && <><span>BİLDİRİM MERKEZİ</span><h2>2 yeni sinyal</h2><article><b>SW Identity v{SW_IDENTITY_VERSION}</b><p>Veri akışı koruması ve iki aşamalı doğrulama hazır.</p></article><article><b>Play Connect canlı</b><p>Tarayıcına uygun mağaza sürümü kullanılabilir.</p></article></>}
          {surface === "language" && <><span>DİL SEÇİMİ</span><h2>Arayüz dili</h2><button className={locale === "tr" ? "choice active" : "choice"} onClick={() => setLocale("tr")}>🇹🇷 Türkçe</button><button className={locale === "en" ? "choice active" : "choice"} onClick={() => setLocale("en")}>🇬🇧 English</button></>}
          {surface === "status" && <><span>SİSTEM DURUMU</span><h2>SW ağı çalışıyor</h2><article><b><i /> Identity API</b><p>Doğrulanmış veri akışı bağlı.</p></article><article><b><i /> Hesap güvenliği</b><p>{account.security.twoFactorEnabled ? "İki aşamalı doğrulama açık." : "İki aşamalı doğrulama henüz açılmadı."}</p></article></>}
          {surface === "bot" && <><span>PLAY BOT / SW NODE</span><h2>Canlı denetim</h2><article><b><i /> Oturum</b><p>Sunucu tarafından doğrulandı.</p></article><article><b><i /> Veri akışı</b><p>SW Identity v{SW_IDENTITY_VERSION} korumasında.</p></article><article><b><i /> Tarayıcı</b><p>{window.isSecureContext ? "Güvenli HTTPS bağlamı etkin." : "Güvenli bağlantı algılanmadı."}</p></article></>}
          {surface === "menu" && <><span>SW MENÜ</span><h2>{displayName}</h2><a href="/center/?view=profile">Profilini düzenle <b>→</b></a><a href="/center/?view=security">Kimlik güvenliği <b>→</b></a><a href="/privacy/">Gizlilik politikası <b>→</b></a><button type="button" className="member-menu-logout" onClick={logout} disabled={busy}>Çıkış yap</button></>}
        </aside>}
      </header>

      <section className="member-content member-home-content">
        <div className="member-welcome"><p>{t.home} · SW IDENTITY BAĞLI</p><h1>{t.hello},<br />{displayName.toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US")}.</h1></div>
        <div className="member-dashboard">
          <section className="member-briefing">
            <div><span>SW AĞI / BUGÜN</span><h2>Yörüngen hazır.</h2><p>Burası sana ait kullanıcı ana sayfası. Ürünlerin, kimlik durumun ve hızlı geçişlerin tanıtım sitesinden bağımsız olarak burada çalışır.</p></div>
            <div className="member-orbit-mark" aria-hidden="true"><span><img src="/brand/swcreate-logo.png" alt="" /></span><i /><i /><i /></div>
          </section>

          <section className="member-whats-new"><div><span>SW SİNYALİ / v{SW_IDENTITY_VERSION}</span><h2>{t.news}</h2><p>SW Identity artık bot kontrolünün yanında veri akışını, güvenlik olaylarını ve Authenticator girişlerini de koruyor.</p></div><div className="member-release-list"><article><b>01</b><span>Doğrulanmış veri akışı<small>Her API isteği ayrı SW Flow kimliğiyle izlenir.</small></span></article><article><b>02</b><span>İki aşamalı doğrulama<small>Authenticator ve tek kullanımlık kurtarma kodları.</small></span></article><article><b>03</b><span>Play Bot denetimi<small>Oturum, HTTPS ve Identity durumunu canlı kontrol eder.</small></span></article></div></section>

          <div className="account-summary-grid"><article><span>SW KİMLİĞİ</span><strong>{account.user.id.slice(0, 8).toUpperCase()}</strong><small>Merkezi hesap numaran</small></article><article><span>ÜRÜN ERİŞİMİ</span><strong>{String(account.entitlements.length).padStart(2, "0")}</strong><small>Etkin ürün bağlantısı</small></article><article><span>ÜYELİK</span><strong>FREE</strong><small>{memberSince} tarihinden beri</small></article></div>

          <div className="member-dashboard-grid">
            <section className="member-products"><div className="member-section-head"><div><span>ÜRÜN AĞI</span><h2>{t.products}</h2></div><b>{account.entitlements.length} BAĞLANTI</b></div>{account.entitlements.length > 0 ? account.entitlements.map((item) => <article key={item.slug}><div><i /> <span>{item.product}<small>{item.slug}</small></span></div><b>{item.tier.toUpperCase()}</b></article>) : <p className="member-empty">İlk ürün erişimin hesabına eklendiğinde burada görünecek.</p>}</section>

            <aside className="member-quick-panel"><span>HIZLI GEÇİŞLER</span><h2>Ürün ağı</h2><a href="https://pstreamers.com" target="_blank" rel="noreferrer"><i>01</i><span>Play Streamers<small>Yayıncı Dashboard’unu aç</small></span><b>↗</b></a><a href={playConnectUrl()} target="_blank" rel="noreferrer"><i>02</i><span>Play Connect<small>Tarayıcına uygun mağaza sayfasını aç</small></span><b>↗</b></a><a href="/" target="_blank"><i>03</i><span>SW Create<small>Ürün ağını yeni sekmede görüntüle</small></span><b>↗</b></a></aside>
          </div>

          <section className="member-signal-board">
            <div><span>SİSTEM SİNYALİ</span><strong><i /> TÜM SİSTEMLER ÇALIŞIYOR</strong></div>
            <div><span>GÜVENLİK KATMANI</span><strong>SW IDENTITY v{SW_IDENTITY_VERSION}</strong><small>Veri akışı koruması etkin</small></div>
            <div><span>ÇİFT DOĞRULAMA</span><strong>{account.security.twoFactorEnabled ? "KORUMA AÇIK" : "KURULUM BEKLİYOR"}</strong><small>Menü → Kimlik güvenliği</small></div>
          </section>
        </div>
      </section>
    </main>
  );
}
