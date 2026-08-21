import { FormEvent, useEffect, useState } from "react";
import { API_BASE, apiRequest, type SwAccount } from "./api";
import { SwDualCore } from "../app/ui/SwDualCore";

type Mode = "login" | "register";

function GoogleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12V14h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z"/></svg>;
}

function KickMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 2h8v6h2V6h2V4h6v6h-2v2h2v10h-8v-6h-2v2H9v4H3V2Z"/></svg>;
}

function PasswordField({ name, label, repeat = false, current = false }: { name: string; label: string; repeat?: boolean; current?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <label>{label}
      <span className="password-field">
        <input name={name} type={visible ? "text" : "password"} autoComplete={current ? "current-password" : "new-password"} minLength={10} maxLength={200} required />
        <button type="button" className={visible ? "password-toggle visible" : "password-toggle"} onClick={() => setVisible((value) => !value)} aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={visible}>
          <span className="password-scan-eye" aria-hidden="true"><i /></span>
        </button>
      </span>
    </label>
  );
}

function AccountPanel() {
  const params = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState<Mode>(params.get("mode") === "register" ? "register" : "login");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const oauth = new URLSearchParams(window.location.search);
    if (oauth.get("oauth") === "success") {
      window.location.replace("/center/");
      return;
    }
    const oauthError = oauth.get("oauth_error");
    if (oauthError) {
      const messages: Record<string, string> = {
        configuration: "Bu giriş yöntemi henüz yapılandırılmadı.",
        cancelled: "Giriş işlemi iptal edildi.",
        expired: "Giriş bağlantısının süresi doldu. Yeniden dene.",
        profile: "Hesap bilgileri sağlayıcıdan alınamadı.",
        account_missing: "Hesap mevcut değil.",
        failed: "Sosyal giriş tamamlanamadı.",
      };
      setStatus({ type: "error", text: messages[oauthError] || messages.failed });
    }
    apiRequest<SwAccount>("/api/account")
      .then(() => window.location.replace("/center/"))
      .catch(() => setChecking(false));
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    setStatus(null);
    const url = new URL(window.location.href);
    if (next === "register") url.searchParams.set("mode", "register");
    else url.searchParams.delete("mode");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  function oauthUrl(provider: "google" | "kick") {
    const query = new URLSearchParams({ mode, remember: remember ? "1" : "0" });
    return `${API_BASE}/api/auth/oauth/${provider}/start?${query}`;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const passwordRepeat = String(form.get("passwordRepeat") || "");
    if (mode === "register" && password !== passwordRepeat) {
      setBusy(false);
      setStatus({ type: "error", text: "Şifreler aynı değil." });
      return;
    }
    try {
      await apiRequest<SwAccount>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          identity: String(form.get("identity") || ""),
          username: String(form.get("username") || ""),
          password,
          passwordRepeat,
          birthDate: String(form.get("birthDate") || ""),
          remember,
        }),
      });
      window.location.replace("/center/");
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı." });
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <section className="account-panel"><div className="auth-box"><p className="section-number">SW IDENTITY</p><h1>HESAP<br />KONTROLÜ.</h1></div></section>;

  return (
    <section className="account-panel">
      <div className="auth-box">
        <p className="section-number">SW IDENTITY — BAĞIMSIZ HESAP</p>
        <h1>{mode === "login" ? <>TEKRAR<br />HOŞ GELDİN.</> : <>KİMLİĞİNİ<br />OLUŞTUR.</>}</h1>
        <p>{mode === "login" ? "Var olan SW hesabınla merkezine gir." : "Tek kullanıcı adıyla bütün SW ürünlerine bağlan."}</p>

        <div className="auth-tabs" role="tablist" aria-label="Hesap işlemi">
          <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Giriş yap</button>
          <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Hesap oluştur</button>
        </div>

        <form className="auth-form profile-form" onSubmit={submit}>
          {mode === "login" ? (
            <label>E-POSTA YA DA KULLANICI ADI<input name="identity" autoComplete="username" required /></label>
          ) : (
            <label>KULLANICI ADI<input name="username" autoComplete="username" minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]+" required /></label>
          )}
          <PasswordField name="password" label="ŞİFRE" current={mode === "login"} />
          {mode === "register" && <PasswordField name="passwordRepeat" label="ŞİFRE TEKRAR" repeat />}
          {mode === "register" && <label>DOĞUM TARİHİ<input name="birthDate" type="date" autoComplete="bday" min="1900-01-01" required /></label>}

          <div className="social-auth social-auth-icons" aria-label="Hesap sağlayıcısı">
            <button type="submit" className="social-auth-button sw" title="SW hesabıyla devam et" aria-label="SW hesabıyla devam et" disabled={busy}><img src="/brand/swcreate-logo.png" alt="" /></button>
            <a className="social-auth-button google" href={oauthUrl("google")} title="Google ile devam et" aria-label="Google ile devam et"><GoogleMark /></a>
            <a className="social-auth-button kick" href={oauthUrl("kick")} title="Kick ile devam et" aria-label="Kick ile devam et"><KickMark /></a>
          </div>

          <label className="remember-control"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span aria-hidden="true"><i /></span><b>Beni hatırla</b><small>Bu cihazda 30 gün açık kal</small></label>
        </form>
        <div className={`auth-status ${status?.type || ""}`} role="status">{status?.text}</div>
        <p className="identity-legal">Devam ederek <a href="/terms/">Koşullar</a> ve <a href="/privacy/">Gizlilik Politikası</a> metinlerini kabul etmiş olursun.</p>
        <a className="account-back" href="/">← SW Create’a dön</a>
      </div>
    </section>
  );
}

export function AccountPage() {
  return (
    <main className="account-shell auth-entry-shell">
      <section className="account-art" aria-label="SW Create kimlik alanı">
        <div className="account-core-stage" aria-hidden="true"><SwDualCore className="account-dual-core" label="" /></div>
        <a className="brand" href="/"><span className="brand-mark"><img src="/brand/swcreate-logo.png" alt="" /></span><span>SW CREATE</span></a>
        <div className="account-signal" aria-hidden="true"><i /> IDENTITY NETWORK / SECURE</div>
        <div className="account-quote"><p>TEK KİMLİK.<br />BÜTÜN ÜRÜNLER.</p><span>SW IDENTITY</span></div>
      </section>
      <AccountPanel />
    </main>
  );
}
