import { FormEvent, useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";
import { rememberSwAccount } from "./rememberedAccounts";
import { SW_IDENTITY_VERSION } from "./security";

type View = "profile" | "security";
type TotpSetup = { setupId: string; secret: string; formattedSecret: string; otpauthUri: string; expiresAt: string };

export function MemberPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [view, setView] = useState<View>(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    return requested === "security" ? "security" : "profile";
  });
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

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
    await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => undefined);
    window.location.replace("/");
  }

  async function startTwoFactor() {
    setBusy(true); setStatus(""); setRecoveryCodes([]);
    try {
      setTotpSetup(await apiRequest<TotpSetup>("/api/account/totp/setup", { method: "POST", body: "{}" }));
    } catch (error) { setStatus(error instanceof Error ? error.message : "Kurulum başlatılamadı."); }
    finally { setBusy(false); }
  }

  async function confirmTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!totpSetup) return;
    setBusy(true); setStatus("");
    try {
      const data = await apiRequest<SwAccount & { recoveryCodes: string[] }>("/api/account/totp/confirm", { method: "POST", body: JSON.stringify({ setupId: totpSetup.setupId, code: totpCode }) });
      setAccount(data); setRecoveryCodes(data.recoveryCodes); setTotpSetup(null); setTotpCode("");
      setStatus("İki aşamalı doğrulama açıldı. Kurtarma kodlarını güvenli bir yere kaydet.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Kod doğrulanamadı."); }
    finally { setBusy(false); }
  }

  async function disableTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setStatus("");
    try {
      const data = await apiRequest<SwAccount>("/api/account/totp/disable", { method: "POST", body: JSON.stringify({ code: totpCode }) });
      setAccount(data); setTotpCode(""); setRecoveryCodes([]); setStatus("İki aşamalı doğrulama kapatıldı.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Doğrulama kapatılamadı."); }
    finally { setBusy(false); }
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
          {view === "security" && <div className="member-security"><p className="member-security-version">SW IDENTITY v{SW_IDENTITY_VERSION}</p><h2>Oturum, veri ve kimlik</h2><article><span>SW</span><div><strong>Güvenli SW oturumu</strong><p>Oturumun yalnızca sunucunun okuyabildiği HttpOnly çerezle korunur. “Beni hatırla” seçildiğinde bu cihaz 30 gün açık kalır.</p></div></article><article><span>01</span><div><strong>Doğrulanmış veri akışı</strong><p>Her API isteği ayrı SW Flow kimliği taşır; hassas değerler güvenlik günlüğüne yazılmaz ve trafik yalnız izin verilen kaynaklardan kabul edilir.</p></div></article><article><span>02</span><div><strong>Bot ve deneme koruması</strong><p>Şüpheli form davranışları, tekrar denemeleri ve otomatik istekler SW Identity güvenlik katmanında sınırlandırılır.</p></div></article><article><span>03</span><div><strong>İki aşamalı doğrulama</strong><p>{account.security.twoFactorEnabled ? "Authenticator koruması açık. Her yeni girişte tek kullanımlık kod istenir." : "Authenticator uygulamasıyla hesabına ikinci bir güvenlik katmanı ekle."}</p></div></article>
            {!account.security.twoFactorEnabled && !totpSetup && <button onClick={startTwoFactor} disabled={busy}>İki aşamalı doğrulamayı kur</button>}
            {totpSetup && <section className="totp-setup"><span>1. Authenticator uygulamanda hesabı aç</span><a href={totpSetup.otpauthUri}>Authenticator’a ekle</a><code>{totpSetup.formattedSecret}</code><span>2. Uygulamanın ürettiği 6 haneli kodu doğrula</span><form onSubmit={confirmTwoFactor}><input value={totpCode} onChange={(event) => setTotpCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} placeholder="123456" required /><button disabled={busy}>Doğrula ve aç</button></form></section>}
            {account.security.twoFactorEnabled && <form className="totp-disable" onSubmit={disableTwoFactor}><label>İki aşamalı doğrulamayı kapatmak için kod<input value={totpCode} onChange={(event) => setTotpCode(event.target.value)} autoComplete="one-time-code" placeholder="123456 veya XXXX-XXXX" required /></label><button disabled={busy}>Korumayı kapat</button></form>}
            {recoveryCodes.length > 0 && <section className="totp-recovery"><strong>Kurtarma kodların</strong><p>Her kod yalnızca bir kez kullanılabilir. Bu ekran kapandıktan sonra tekrar gösterilmez.</p><div>{recoveryCodes.map((code) => <code key={code}>{code}</code>)}</div></section>}
            {status && <p className="member-security-status">{status}</p>}<button onClick={logout} disabled={busy}>Bu cihazdan çıkış yap</button></div>}
        </section>
      </div>
    </main>
  );
}
