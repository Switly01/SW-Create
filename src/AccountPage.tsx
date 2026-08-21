import { FormEvent, useEffect, useRef, useState, type Ref } from "react";
import { API_BASE, apiRequest, type SwAccount } from "./api";
import { forgetRememberedSwAccount, readRememberedSwAccounts, rememberSwAccount } from "./rememberedAccounts";
import { SW_IDENTITY_VERSION, TURNSTILE_SITE_KEY } from "./security";
import { TurnstileChallenge } from "./TurnstileChallenge";
import { SwDualCore } from "../app/ui/SwDualCore";

type Mode = "login" | "register";

function GoogleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12V14h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z"/></svg>;
}

function KickMark() {
  return <span className="kick-letter" aria-hidden="true">K</span>;
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
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const identityInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const formStartedAtRef = useRef(Date.now());

  useEffect(() => {
    const oauth = new URLSearchParams(window.location.search);
    if (oauth.get("oauth") === "success") {
      window.location.replace("/home/");
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

  function chooseRememberedAccount(username: string) {
    if (identityInputRef.current) identityInputRef.current.value = username;
    setNativeInfoOpen(false);
    window.requestAnimationFrame(() => passwordInputRef.current?.focus());
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
      const account = await apiRequest<SwAccount>(`/api/auth/${mode}`, {
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
      rememberSwAccount(account);
      window.location.replace("/home/");
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı." });
      setTurnstileReset((value) => value + 1);
    } finally {
      setBusy(false);
    }
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

        <form className="auth-form profile-form" onSubmit={submit}>
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

          <label className="remember-control"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span aria-hidden="true"><i /></span><b>Beni hatırla</b><small>Bu cihazda 30 gün açık kal</small></label>
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
              {rememberedAccounts.map((account) => <div className="sw-account-picker-row" key={account.id}><button type="button" className="sw-account-picker-select" onClick={() => chooseRememberedAccount(account.username)}><span>{account.displayName.slice(0, 1).toLocaleUpperCase("tr-TR")}</span><div><strong>{account.displayName}</strong><small>@{account.username}</small></div><b aria-hidden="true">→</b></button><button type="button" className="sw-account-picker-forget" aria-label={`${account.displayName} hesabını bu cihazdan unut`} onClick={() => setRememberedAccounts(forgetRememberedSwAccount(account.id))}>×</button></div>)}
              {rememberedAccounts.length === 0 && <div className="sw-account-picker-empty"><strong>Bu cihazda kayıtlı hesap yok.</strong><span>İlk girişinden sonra hesabın burada görünecek.</span></div>}
            </div>
            <button type="button" className="sw-account-picker-other" onClick={useAnotherAccount}><span>+</span> Başka bir SW hesabı kullan</button>
            <footer>SW IDENTITY v{SW_IDENTITY_VERSION} · PAROLA SAKLANMAZ</footer>
          </section>
        </div>}
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
