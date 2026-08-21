import { FormEvent, useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";

type View = "overview" | "profile" | "security";

export function MemberPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [view, setView] = useState<View>("overview");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiRequest<SwAccount>("/api/account")
      .then((data) => { setAccount(data); setUsername(data.user.username || data.user.displayName); })
      .catch(() => window.location.replace("/account/"));
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await apiRequest<SwAccount>("/api/account/profile", { method: "PUT", body: JSON.stringify({ username }) });
      setAccount(data);
      setUsername(data.user.username || data.user.displayName);
      setStatus("Kullanıcı adı kaydedildi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profil kaydedilemedi.");
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.replace("/");
  }

  if (!account) return <main className="member-shell"><div className="member-loading">SW MERKEZİ HAZIRLANIYOR…</div></main>;
  const memberSince = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(account.user.createdAt * 1000);
  const displayName = account.user.username || account.user.displayName;

  return (
    <main className="member-shell">
      <header className="member-topbar"><a href="/center/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>ÜYE MERKEZİ</small></span></a><div className="member-top-status"><i /> SW AĞI BAĞLI</div><button onClick={logout} disabled={busy}>Çıkış yap</button></header>
      <div className="member-layout">
        <aside><p>SW IDENTITY</p>{(["overview", "profile", "security"] as View[]).map((item, index) => <button key={item} className={view === item ? "active" : ""} disabled={view === item} onClick={() => setView(item)}><span>0{index + 1}</span>{item === "overview" ? "Genel bakış" : item === "profile" ? "Profil" : "Güvenlik"}</button>)}</aside>
        <section className="member-content">
          <div className="member-welcome"><p>SW HESABI · AKTİF</p><h1>MERHABA,<br />{displayName.toLocaleUpperCase("tr-TR")}.</h1></div>
          {view === "overview" && <div className="member-dashboard">
            <section className="member-briefing">
              <div><span>MERKEZ / BUGÜN</span><h2>Yörüngen hazır.</h2><p>Kimliğin, ürün erişimlerin ve güvenlik ayarların tek merkezde. Buradan SW ağındaki bir sonraki durağına geçebilirsin.</p></div>
              <div className="member-orbit-mark" aria-hidden="true"><span>SW</span><i /><i /><i /></div>
            </section>

            <div className="account-summary-grid"><article><span>SW KİMLİĞİ</span><strong>{account.user.id.slice(0, 8).toUpperCase()}</strong><small>Merkezi hesap numaran</small></article><article><span>ÜRÜN ERİŞİMİ</span><strong>{String(account.entitlements.length).padStart(2, "0")}</strong><small>Etkin ürün bağlantısı</small></article><article><span>ÜYELİK</span><strong>FREE</strong><small>{memberSince} tarihinden beri</small></article></div>

            <div className="member-dashboard-grid">
              <section className="member-products"><div className="member-section-head"><div><span>ÜRÜN AĞI</span><h2>SW yörüngendeki ürünler</h2></div><b>{account.entitlements.length} BAĞLANTI</b></div>{account.entitlements.length > 0 ? account.entitlements.map((item) => <article key={item.slug}><div><i /> <span>{item.product}<small>{item.slug}</small></span></div><b>{item.tier.toUpperCase()}</b></article>) : <p className="member-empty">İlk ürün erişimin hesabına eklendiğinde burada görünecek.</p>}</section>

              <aside className="member-quick-panel"><span>HIZLI KOMUTLAR</span><h2>Merkezini yönet.</h2><button type="button" onClick={() => setView("profile")}><i>01</i><span>Profili düzenle<small>Kullanıcı adını ve hesap bilgilerini yönet</small></span><b>→</b></button><button type="button" onClick={() => setView("security")}><i>02</i><span>Güvenlik alanı<small>Oturumunu ve kimlik korumanı incele</small></span><b>→</b></button><a href="https://pstreamers.com" target="_blank" rel="noreferrer"><i>03</i><span>Play Streamers<small>Yayıncı kontrol sistemini aç</small></span><b>↗</b></a></aside>
            </div>

            <section className="member-signal-board">
              <div><span>SİSTEM SİNYALİ</span><strong><i /> TÜM SİSTEMLER ÇALIŞIYOR</strong></div>
              <div><span>KİMLİK KATMANI</span><strong>SW IDENTITY</strong><small>Güvenli oturum etkin</small></div>
              <div><span>SONRAKİ ADIM</span><strong>PRO EDITION</strong><small>Erken erişim yakında</small></div>
            </section>
          </div>}
          {view === "profile" && <form className="member-form" onSubmit={saveProfile}><h2>Profil bilgilerin</h2><label>KULLANICI ADI<input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]+" required /></label>{account.user.email && <label>E-POSTA<input value={account.user.email} disabled /></label>}<button disabled={busy}>Değişiklikleri kaydet</button>{status && <p>{status}</p>}</form>}
          {view === "security" && <div className="member-security"><h2>Oturum ve kimlik</h2><article><span>SW</span><div><strong>Güvenli SW oturumu</strong><p>Oturumun HttpOnly çerezle korunur. “Beni hatırla” seçildiğinde bu cihaz 30 gün açık kalır.</p></div></article><button onClick={logout} disabled={busy}>Bu cihazdan çıkış yap</button></div>}
        </section>
      </div>
    </main>
  );
}
