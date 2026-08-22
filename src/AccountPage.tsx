import { FormEvent, useEffect, useRef, useState, type Ref } from "react";
import { API_BASE, apiRequest, type SwAccount, type SwTwoFactorChallenge } from "./api";
import { expireRememberedSwLogin, forgetRememberedSwAccount, readRememberedSwAccounts, rememberSwAccount, type RememberedSwAccount } from "./rememberedAccounts";
import { SW_IDENTITY_VERSION, TURNSTILE_SITE_KEY } from "./security";
import { TurnstileChallenge } from "./TurnstileChallenge";
import { SwDualCore } from "../app/ui/SwDualCore";

type Mode = "login" | "register";

function GoogleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12V14h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z"/></svg>;
}

function KickMark() {
  return <img className="kick-k-mark" src="/brand/kick-k.svg" alt="" aria-hidden="true" />;
}

function PasswordField({ name, label, current = false, inputRef }: { name: string; label: string; current?: boolean; inputRef?: Ref<HTMLInputElement> }) {
  const [visible, setVisible] = useState(false);
  return (
    <label>{label}
      <span className="password-field">
        <input ref={inputRef} name={name} type={visible ? "text" : "password"} autoComplete={current ? "current-password" : "new-password"} minLength={10} maxLength={200} required />
        <button type="button" className={visible ? "password-toggle visible" : "password-toggle"} onClick={() => setVisible((value) => !value)} aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={visible}>
          <span className="password-signal-visor" aria-hidden="true"><i /><b /><em /></span>
        </button>
      </span>
    </label>
  );
}

function ControlledPasswordField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const [visible, setVisible] = useState(false);
  return <span className="password-field identity-overlay-password"><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" placeholder={placeholder} minLength={10} required /><button type="button" className={visible ? "password-toggle visible" : "password-toggle"} onClick={() => setVisible((shown) => !shown)} aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={visible}><span className="password-signal-visor" aria-hidden="true"><i /><b /><em /></span></button></span>;
}

function AccountPanel() {
  const params = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState<Mode>(params.get("mode") === "register" ? "register" : "login");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [nativeInfoOpen, setNativeInfoOpen] = useState(false);
  const [rememberedAccounts, setRememberedAccounts] = useState(readRememberedSwAccounts);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [forgotOpen, setForgotOpen] = useState(params.get("forgot") === "1");
  const [forgotStep, setForgotStep] = useState<"request" | "reset">("request");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotPasswordRepeat, setForgotPasswordRepeat] = useState("");
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const identityInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const formStartedAtRef = useRef(Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const oauth = new URLSearchParams(window.location.search);
    if (oauth.get("oauth") === "success") {
      window.location.replace("/home/");
      return;
    }
    const challengeId = String(oauth.get("challenge_id") || "").trim();
    if (oauth.get("two_factor_required") === "1" && challengeId) {
      setTwoFactorChallenge(challengeId);
      setChecking(false);
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
      .then((account) => {
        rememberSwAccount(account);
        window.location.replace("/home/");
      })
      .catch(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!nativeInfoOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNativeInfoOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [nativeInfoOpen]);

  function changeMode(next: Mode) {
    setMode(next);
    setStatus(null);
    setNativeInfoOpen(false);
    setTurnstileReset((value) => value + 1);
    formStartedAtRef.current = Date.now();
    const url = new URL(window.location.href);
    if (next === "register") url.searchParams.set("mode", "register");
    else url.searchParams.delete("mode");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  function oauthUrl(provider: "google" | "kick") {
    const query = new URLSearchParams({ mode, remember: remember ? "1" : "0" });
    return `${API_BASE}/api/auth/oauth/${provider}/start?${query}`;
  }

  async function chooseRememberedAccount(account: RememberedSwAccount) {
    setNativeInfoOpen(false);
    if (account.loginToken) {
      setBusy(true); setStatus({ type: "success", text: `${account.displayName} için güvenli cihaz anahtarı doğrulanıyor…` });
      try {
        const signedIn = await apiRequest<SwAccount>("/api/auth/remembered", { method: "POST", body: JSON.stringify({ token: account.loginToken }) });
        rememberSwAccount(signedIn);
        window.location.replace("/home/");
        return;
      } catch (error) {
        setRememberedAccounts(expireRememberedSwLogin(account.id));
        setStatus({ type: "error", text: error instanceof Error ? error.message : "Hızlı giriş tamamlanamadı." });
      } finally { setBusy(false); }
    }
    if (identityInputRef.current) identityInputRef.current.value = account.username;
    window.requestAnimationFrame(() => {
      passwordInputRef.current?.focus();
      setStatus({ type: "success", text: `${account.username} seçildi. Bu cihazı yeniden güvenilir yapmak için parolanla giriş yap.` });
    });
  }

  function useAnotherAccount() {
    if (identityInputRef.current) identityInputRef.current.value = "";
    setNativeInfoOpen(false);
    window.requestAnimationFrame(() => identityInputRef.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const passwordRepeat = String(form.get("passwordRepeat") || "");
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setBusy(false);
      setStatus({ type: "error", text: "SW Identity doğrulaması hazırlanıyor. Birkaç saniye sonra yeniden dene." });
      return;
    }
    if (mode === "register" && password !== passwordRepeat) {
      setBusy(false);
      setStatus({ type: "error", text: "Şifreler aynı değil." });
      return;
    }
    try {
      const result = await apiRequest<SwAccount | SwTwoFactorChallenge>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          identity: String(form.get("identity") || ""),
          username: String(form.get("username") || ""),
          password,
          passwordRepeat,
          birthDate: String(form.get("birthDate") || ""),
          remember,
          website: String(form.get("website") || ""),
          startedAt: formStartedAtRef.current,
          turnstileToken,
        }),
      });
      if ("twoFactorRequired" in result) {
        setTwoFactorChallenge(result.challengeId);
        setTwoFactorCode("");
        return;
      }
      const account = result;
      rememberSwAccount(account);
      window.location.replace("/home/");
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı." });
      setTurnstileReset((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }

  async function verifyTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const account = await apiRequest<SwAccount>("/api/auth/two-factor/verify", {
        method: "POST",
        body: JSON.stringify({ challengeId: twoFactorChallenge, code: twoFactorCode, remember }),
      });
      rememberSwAccount(account);
      window.location.replace("/home/");
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Doğrulama tamamlanamadı." });
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus(null);
    try {
      const data = await apiRequest<{ message: string }>("/api/auth/password/forgot", { method: "POST", body: JSON.stringify({ email: forgotEmail }) });
      setForgotStep("reset"); setStatus({ type: "success", text: data.message });
    } catch (error) { setStatus({ type: "error", text: error instanceof Error ? error.message : "Kod gönderilemedi." }); }
    finally { setBusy(false); }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus(null);
    try {
      await apiRequest("/api/auth/password/reset", { method: "POST", body: JSON.stringify({ email: forgotEmail, code: forgotCode, newPassword: forgotPassword, newPasswordRepeat: forgotPasswordRepeat }) });
      setForgotOpen(false); setForgotStep("request"); setForgotCode(""); setForgotPassword(""); setForgotPasswordRepeat("");
      setStatus({ type: "success", text: "Şifren yenilendi. Yeni şifrenle giriş yapabilirsin." });
    } catch (error) { setStatus({ type: "error", text: error instanceof Error ? error.message : "Şifre sıfırlanamadı." }); }
    finally { setBusy(false); }
  }

  if (checking) return <section className="account-panel"><div className="auth-box"><p className="section-number">SW IDENTITY</p><h1>HESAP<br />KONTROLÜ.</h1></div></section>;

  return (
    <section className="account-panel">
      <div className="auth-box">
        <p className="section-number">SW IDENTITY v{SW_IDENTITY_VERSION} — BAĞIMSIZ HESAP</p>
        <h1>{mode === "login" ? <>TEKRAR<br />HOŞ GELDİN.</> : <>KİMLİĞİNİ<br />OLUŞTUR.</>}</h1>
        <p>{mode === "login" ? "Var olan SW hesabınla merkezine gir." : "Tek kullanıcı adıyla bütün SW ürünlerine bağlan."}</p>

        <div className="auth-tabs" role="tablist" aria-label="Hesap işlemi">
          <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Giriş yap</button>
          <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Hesap oluştur</button>
        </div>

        <form ref={formRef} className="auth-form profile-form" onSubmit={submit}>
          <label className="identity-honeypot" aria-hidden="true">ŞİRKET SİTESİ<input name="website" autoComplete="off" tabIndex={-1} /></label>
          {mode === "login" ? (
            <label>E-POSTA YA DA KULLANICI ADI<input ref={identityInputRef} name="identity" autoComplete="username" required /></label>
          ) : (
            <label>KULLANICI ADI<input name="username" autoComplete="username" minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]+" required /></label>
          )}
          <PasswordField name="password" label="ŞİFRE" current={mode === "login"} inputRef={passwordInputRef} />
          {mode === "register" && <PasswordField name="passwordRepeat" label="ŞİFRE TEKRAR" />}
          {mode === "register" && <label>DOĞUM TARİHİ<input name="birthDate" type="date" autoComplete="bday" min="1900-01-01" required /></label>}

          <TurnstileChallenge onToken={setTurnstileToken} resetSignal={turnstileReset} />

          <button type="submit" className="native-auth-submit" disabled={busy}>
            {busy ? "BAĞLANIYOR…" : mode === "login" ? "GİRİŞ YAP" : "HESAP OLUŞTUR"}
            <span aria-hidden="true">↗</span>
          </button>

          <div className="auth-provider-divider"><span>YA DA SAĞLAYICIYLA DEVAM ET</span></div>

          <div className="social-auth social-auth-icons" aria-label="Hesap sağlayıcısı">
            {mode === "login" && <button type="button" className="social-auth-button sw" title="SW Identity ile devam et" aria-label="SW Identity ile devam et" aria-haspopup="dialog" aria-expanded={nativeInfoOpen} onClick={() => {
              setNativeInfoOpen((open) => !open);
            }}><img src="/brand/swcreate-logo.png" alt="" /></button>}
            <a className="social-auth-button google" href={oauthUrl("google")} title="Google ile devam et" aria-label="Google ile devam et"><GoogleMark /></a>
            <a className="social-auth-button kick" href={oauthUrl("kick")} title="Kick ile devam et" aria-label="Kick ile devam et"><KickMark /></a>
          </div>

          {mode === "login" && nativeInfoOpen && <aside className="native-provider-panel" aria-live="polite">
            <img src="/brand/swcreate-logo.png" alt="" />
            <div><strong>SW IDENTITY</strong><p>SW kullanıcı adın veya e-postan ve şifrenle doğrudan giriş yap. Bilgilerini yukarıdaki güvenli alana yazman yeterli.</p></div>
            <button type="button" onClick={() => identityInputRef.current?.focus()}>Bilgilerime dön</button>
          </aside>}

          <label className="remember-control"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span aria-hidden="true"><i /></span><b>Beni hatırla</b><small>Bu cihazda 20 gün açık kal</small></label>
          {mode === "login" && <button type="button" className="forgot-password-link" onClick={() => { setForgotOpen(true); setForgotStep("request"); setStatus(null); }}>Şifremi unuttum</button>}
        </form>
        <div className={`auth-status ${status?.type || ""}`} role="status">{status?.text}</div>
        <p className="identity-legal">Devam ederek <a href="/terms/">Koşullar</a> ve <a href="/privacy/">Gizlilik Politikası</a> metinlerini kabul etmiş olursun.</p>
        <a className="account-back" href="/">← SW Create’a dön</a>

        {mode === "login" && nativeInfoOpen && <div className="sw-account-picker" role="dialog" aria-modal="true" aria-labelledby="sw-account-picker-title">
          <button type="button" className="sw-account-picker-backdrop" onClick={() => setNativeInfoOpen(false)} aria-label="Hesap seçiciyi kapat" />
          <section>
            <header><img src="/brand/swcreate-logo.png" alt="" /><div><span>SW IDENTITY</span><h2 id="sw-account-picker-title">Bir hesap seç</h2></div><button type="button" onClick={() => setNativeInfoOpen(false)} aria-label="Kapat">×</button></header>
            <p>Bu cihazda daha önce kullanılan SW hesapları. Yalnızca hesap adı hatırlanır; şifren cihazda saklanmaz.</p>
            <div className="sw-account-picker-list">
              {rememberedAccounts.map((account) => <div className="sw-account-picker-row" key={account.id}><button type="button" className="sw-account-picker-select" disabled={busy} onClick={() => void chooseRememberedAccount(account)}><span>{account.displayName.slice(0, 1).toLocaleUpperCase("tr-TR")}</span><div><strong>{account.displayName}</strong><small>@{account.username}{account.loginToken ? " · HIZLI GİRİŞ" : ""}</small></div><b aria-hidden="true">→</b></button><button type="button" className="sw-account-picker-forget" aria-label={`${account.displayName} hesabını bu cihazdan unut`} onClick={() => setRememberedAccounts(forgetRememberedSwAccount(account.id))}>×</button></div>)}
              {rememberedAccounts.length === 0 && <div className="sw-account-picker-empty"><strong>Bu cihazda kayıtlı hesap yok.</strong><span>İlk girişinden sonra hesabın burada görünecek.</span></div>}
            </div>
            <button type="button" className="sw-account-picker-other" onClick={useAnotherAccount}><span>+</span> Başka bir SW hesabı kullan</button>
            <footer>SW IDENTITY v{SW_IDENTITY_VERSION} · PAROLA SAKLANMAZ</footer>
          </section>
        </div>}
      </div>
      {twoFactorChallenge && <div className="identity-2fa-overlay" role="dialog" aria-modal="true" aria-labelledby="identity-2fa-title">
        <section><span>SW IDENTITY v{SW_IDENTITY_VERSION}</span><h2 id="identity-2fa-title">Girişini doğrula</h2><p>Authenticator uygulamandaki 6 haneli kodu veya kurtarma kodlarından birini gir.</p><form onSubmit={verifyTwoFactor}><input value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} autoComplete="one-time-code" placeholder="123456 veya XXXX-XXXX" minLength={6} maxLength={9} required autoFocus /><button disabled={busy}>{busy ? "DOĞRULANIYOR…" : "GİRİŞİ TAMAMLA"}</button></form><button type="button" className="identity-2fa-cancel" onClick={() => setTwoFactorChallenge("")}>İptal et</button></section>
      </div>}
      {forgotOpen && <div className="identity-2fa-overlay identity-forgot-overlay" role="dialog" aria-modal="true" aria-labelledby="identity-forgot-title"><section><span>SW IDENTITY v{SW_IDENTITY_VERSION}</span><h2 id="identity-forgot-title">Şifreni yenile</h2><p>{forgotStep === "request" ? "SW hesabına bağlı e-posta adresini gir. Hesap varsa 10 dakika geçerli 6 haneli kod gönderilir." : "E-postana gelen kodu ve yeni şifreni gir. Yeni kod istersen önceki kod devre dışı kalır."}</p>{forgotStep === "request" ? <form onSubmit={requestPasswordReset}><input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} autoComplete="email" placeholder="E-posta adresi" required /><button disabled={busy}>{busy ? "GÖNDERİLİYOR…" : "KOD GÖNDER"}</button></form> : <form onSubmit={resetPassword}><input value={forgotCode} onChange={(event) => setForgotCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="6 haneli kod" minLength={6} maxLength={6} required /><ControlledPasswordField value={forgotPassword} onChange={setForgotPassword} placeholder="Yeni şifre" /><ControlledPasswordField value={forgotPasswordRepeat} onChange={setForgotPasswordRepeat} placeholder="Yeni şifre tekrar" /><button disabled={busy}>{busy ? "YENİLENİYOR…" : "ŞİFREYİ YENİLE"}</button></form>}<button type="button" className="identity-2fa-cancel" onClick={() => { setForgotOpen(false); setForgotStep("request"); }}>İptal et</button></section></div>}
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
        <div className="account-quote"><p>TEK KİMLİK.<br />BÜTÜN ÜRÜNLER.</p><span>SW IDENTITY <b>v{SW_IDENTITY_VERSION}</b> · DATA FLOW PROTECTED</span></div>
      </section>
      <AccountPanel />
    </main>
  );
}
