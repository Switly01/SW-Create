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
    window.location.replace("/account/");
  }

  if (!account) return <main className="member-shell"><div className="member-loading">SW MERKEZİ HAZIRLANIYOR…</div></main>;
  const memberSince = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(account.user.createdAt * 1000);

  return (
    <main className="member-shell">
      <header className="member-topbar"><a href="/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>ÜYE MERKEZİ</small></span></a><button onClick={logout} disabled={busy}>Çıkış yap</button></header>
      <div className="member-layout">
        <aside><p>SW IDENTITY</p>{(["overview", "profile", "security"] as View[]).map((item, index) => <button key={item} className={view === item ? "active" : ""} disabled={view === item} onClick={() => setView(item)}><span>0{index + 1}</span>{item === "overview" ? "Genel bakış" : item === "profile" ? "Profil" : "Güvenlik"}</button>)}</aside>
        <section className="member-content">
          <div className="member-welcome"><p>SW HESABI · AKTİF</p><h1>MERHABA,<br />{(account.user.username || account.user.displayName).toLocaleUpperCase("tr-TR")}.</h1></div>
          {view === "overview" && <><div className="account-summary-grid"><article><span>SW KİMLİĞİ</span><strong>{account.user.id.slice(0, 8).toUpperCase()}</strong><small>Merkezi hesap numaran</small></article><article><span>ÜRÜN ERİŞİMİ</span><strong>{String(account.entitlements.length).padStart(2, "0")}</strong><small>Etkin ürün bağlantısı</small></article><article><span>ÜYELİK</span><strong>FREE</strong><small>{memberSince} tarihinden beri</small></article></div><div className="member-products"><h2>SW yörüngendeki ürünler</h2>{account.entitlements.map((item) => <article key={item.slug}><span>{item.product}</span><b>{item.tier.toUpperCase()}</b></article>)}</div></>}
          {view === "profile" && <form className="member-form" onSubmit={saveProfile}><h2>Profil bilgilerin</h2><label>KULLANICI ADI<input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]+" required /></label>{account.user.email && <label>E-POSTA<input value={account.user.email} disabled /></label>}<button disabled={busy}>Değişiklikleri kaydet</button>{status && <p>{status}</p>}</form>}
          {view === "security" && <div className="member-security"><h2>Oturum ve kimlik</h2><article><span>SW</span><div><strong>Güvenli SW oturumu</strong><p>Oturumun HttpOnly çerezle korunur. “Beni hatırla” seçildiğinde bu cihaz 30 gün açık kalır.</p></div></article><button onClick={logout} disabled={busy}>Bu cihazdan çıkış yap</button></div>}
        </section>
      </div>
    </main>
  );
}
