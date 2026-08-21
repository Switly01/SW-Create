import { FormEvent, useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";
import { rememberSwAccount } from "./rememberedAccounts";
import { SW_IDENTITY_VERSION } from "./security";

type View = "profile" | "security";

export function MemberPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [view, setView] = useState<View>(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    return requested === "security" ? "security" : "profile";
  });
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiRequest<SwAccount>("/api/account")
      .then((data) => { rememberSwAccount(data); setAccount(data); setUsername(data.user.username || data.user.displayName); })
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
  return (
    <main className="member-shell">
      <header className="member-topbar"><a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>HESAP MERKEZİ</small></span></a><div className="member-top-status"><i /> SW AĞI BAĞLI</div><button onClick={logout} disabled={busy}>Çıkış yap</button></header>
      <div className="member-layout">
        <aside><p>SW IDENTITY</p><a className="member-home-link" href="/home/"><span>00</span>Kullanıcı ana sayfası</a>{(["profile", "security"] as View[]).map((item, index) => <button key={item} className={view === item ? "active" : ""} disabled={view === item} onClick={() => setView(item)}><span>0{index + 1}</span>{item === "profile" ? "Profil" : "Güvenlik"}</button>)}</aside>
        <section className="member-content">
          <div className="member-welcome"><p>SW IDENTITY · HESAP YÖNETİMİ</p><h1>HESAP<br />MERKEZİ.</h1></div>
          {view === "profile" && <form className="member-form" onSubmit={saveProfile}><h2>Profil bilgilerin</h2><label>KULLANICI ADI<input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]+" required /></label>{account.user.email && <label>E-POSTA<input value={account.user.email} disabled /></label>}<button disabled={busy}>Değişiklikleri kaydet</button>{status && <p>{status}</p>}</form>}
          {view === "security" && <div className="member-security"><p className="member-security-version">SW IDENTITY v{SW_IDENTITY_VERSION}</p><h2>Oturum ve kimlik</h2><article><span>SW</span><div><strong>Güvenli SW oturumu</strong><p>Oturumun yalnızca sunucunun okuyabildiği HttpOnly çerezle korunur. “Beni hatırla” seçildiğinde bu cihaz 30 gün açık kalır.</p></div></article><article><span>01</span><div><strong>Bot ve deneme koruması</strong><p>Şüpheli form davranışları, tekrar denemeleri ve otomatik istekler SW Identity güvenlik katmanında sınırlandırılır.</p></div></article><article><span>02</span><div><strong>Gizli hesap seçimi</strong><p>Hesap seçicide yalnızca kullanıcı adı saklanır. Parola, oturum anahtarı ve sağlayıcı erişim bilgileri tarayıcı deposuna yazılmaz.</p></div></article><button onClick={logout} disabled={busy}>Bu cihazdan çıkış yap</button></div>}
        </section>
      </div>
    </main>
  );
}
