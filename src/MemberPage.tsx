import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { API_BASE, apiRequest, type SwAccount, type SwDevice } from "./api";
import { rememberSwAccount } from "./rememberedAccounts";
import { SW_IDENTITY_VERSION } from "./security";

type View = "profile" | "security" | "devices" | "subscriptions";
type TotpSetup = { setupId: string; secret: string; formattedSecret: string; otpauthUri: string; expiresAt: string };
type QrMethod = "qr" | "key";
type ConfirmAction = { kind: "logout" } | { kind: "device"; device: SwDevice } | null;

declare const qrcode: ((typeNumber: number, errorCorrectionLevel: "H") => { addData(data: string): void; make(): void; createDataURL(cellSize: number, margin: number): string }) | undefined;

const avatarPresets = ["orbit-cyan", "signal-acid", "core-cobalt", "flare-coral", "node-violet", "identity-paper"] as const;

function avatarLabel(value: string) {
  return ({ "orbit-cyan": "Yörünge", "signal-acid": "Sinyal", "core-cobalt": "Çekirdek", "flare-coral": "Parlama", "node-violet": "Düğüm", "identity-paper": "Kimlik" } as Record<string, string>)[value] || "SW";
}

function deviceTitle(userAgent: string) {
  const browser = /Edg\//.test(userAgent) ? "Microsoft Edge" : /Firefox\//.test(userAgent) ? "Mozilla Firefox" : /Chrome\//.test(userAgent) ? "Google Chrome" : /Safari\//.test(userAgent) ? "Safari" : "Web tarayıcısı";
  const system = /Windows/.test(userAgent) ? "Windows" : /Android/.test(userAgent) ? "Android" : /iPhone|iPad/.test(userAgent) ? "iOS" : /Mac OS/.test(userAgent) ? "macOS" : /Linux/.test(userAgent) ? "Linux" : "Bilinmeyen sistem";
  return `${browser} · ${system}`;
}

function dateTime(value: number) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(value * 1000);
}

export function MemberPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [view, setView] = useState<View>(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    return (["security", "devices", "subscriptions"] as View[]).includes(requested as View) ? requested as View : "profile";
  });
  const [username, setUsername] = useState("");
  const [avatarPreset, setAvatarPreset] = useState("orbit-cyan");
  const [avatarRevision, setAvatarRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [qrMethod, setQrMethod] = useState<QrMethod>("qr");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [devices, setDevices] = useState<SwDevice[]>([]);
  const [deviceCountdown, setDeviceCountdown] = useState(5);
  const [visibleLocation, setVisibleLocation] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const totpQrDataUrl = useMemo(() => {
    if (!totpSetup || typeof qrcode !== "function") return "";
    try { const qr = qrcode(0, "H"); qr.addData(totpSetup.otpauthUri); qr.make(); return qr.createDataURL(6, 4); } catch { return ""; }
  }, [totpSetup]);

  const loadAccount = async () => {
    const data = await apiRequest<SwAccount>("/api/account");
    rememberSwAccount(data); setAccount(data); setUsername(data.user.username || data.user.displayName); setAvatarPreset(data.user.avatar.type === "preset" ? data.user.avatar.value : "orbit-cyan");
    return data;
  };

  const loadDevices = async () => {
    const data = await apiRequest<{ devices: SwDevice[] }>("/api/account/devices");
    setDevices(data.devices); setDeviceCountdown(5);
  };

  useEffect(() => { loadAccount().catch(() => window.location.replace("/account/")); }, []);

  useEffect(() => {
    const nextUrl = new URL(window.location.href); nextUrl.searchParams.set("view", view); window.history.replaceState({}, "", nextUrl);
    setStatus("");
    if (view !== "devices") return;
    void loadDevices();
    const timer = window.setInterval(() => setDeviceCountdown((value) => value <= 1 ? 5 : value - 1), 1000);
    const poller = window.setInterval(() => { if (!document.hidden) void loadDevices(); }, 5000);
    return () => { window.clearInterval(timer); window.clearInterval(poller); };
  }, [view]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const data = await apiRequest<SwAccount>("/api/account/profile", { method: "PUT", body: JSON.stringify({ username, avatarPreset }) });
      setAccount(data); rememberSwAccount(data); setStatus("Profil bilgilerin kaydedildi.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Profil kaydedilemedi."); }
    finally { setBusy(false); }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setStatus("");
    try {
      const form = new FormData(); form.set("file", file);
      const data = await apiRequest<SwAccount>("/api/account/avatar", { method: "POST", body: form });
      setAccount(data); rememberSwAccount(data); setAvatarRevision(Date.now()); setStatus("Profil fotoğrafın kaydedildi.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Profil fotoğrafı yüklenemedi."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      await apiRequest("/api/account/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword, newPasswordRepeat }) });
      setCurrentPassword(""); setNewPassword(""); setNewPasswordRepeat(""); setStatus("Şifren değiştirildi ve diğer cihazlardaki oturumlar kapatıldı.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Şifre değiştirilemedi."); }
    finally { setBusy(false); }
  }

  async function startTwoFactor() { setBusy(true); setStatus(""); setRecoveryCodes([]); try { setQrMethod("qr"); setTotpSetup(await apiRequest<TotpSetup>("/api/account/totp/setup", { method: "POST", body: "{}" })); } catch (error) { setStatus(error instanceof Error ? error.message : "Kurulum başlatılamadı."); } finally { setBusy(false); } }
  async function confirmTwoFactor(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!totpSetup) return; setBusy(true); setStatus(""); try { const data = await apiRequest<SwAccount & { recoveryCodes: string[] }>("/api/account/totp/confirm", { method: "POST", body: JSON.stringify({ setupId: totpSetup.setupId, code: totpCode }) }); setAccount(data); setRecoveryCodes(data.recoveryCodes); setTotpSetup(null); setTotpCode(""); setStatus("Doğrulama uygulaması bağlandı. Kurtarma kodlarını güvenli bir yere kaydet."); } catch (error) { setStatus(error instanceof Error ? error.message : "Kod doğrulanamadı."); } finally { setBusy(false); } }
  async function disableTwoFactor(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setStatus(""); try { const data = await apiRequest<SwAccount>("/api/account/totp/disable", { method: "POST", body: JSON.stringify({ code: totpCode }) }); setAccount(data); setTotpCode(""); setRecoveryCodes([]); setStatus("Doğrulama uygulaması bağlantısı kaldırıldı."); } catch (error) { setStatus(error instanceof Error ? error.message : "Doğrulama kapatılamadı."); } finally { setBusy(false); } }

  async function logout() { setBusy(true); await apiRequest("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => undefined); window.location.replace("/"); }
  async function revokeDevice(device: SwDevice) { setBusy(true); try { const data = await apiRequest<{ ok: boolean; current: boolean }>(`/api/account/devices/${device.id}`, { method: "DELETE" }); if (data.current) window.location.replace("/account/"); else { setConfirmAction(null); await loadDevices(); } } catch (error) { setStatus(error instanceof Error ? error.message : "Oturum kapatılamadı."); setConfirmAction(null); } finally { setBusy(false); } }

  if (!account) return <main className="member-shell"><div className="member-loading">SW MERKEZİ HAZIRLANIYOR…</div></main>;
  const avatarUrl = account.user.avatar.type === "custom" ? `${API_BASE}${account.user.avatar.url}?v=${avatarRevision}` : null;
  const viewNames: Record<View, string> = { profile: "Profil", security: "Güvenlik", devices: "Cihazlar", subscriptions: "Abonelikler" };

  return <main className="member-shell account-center-shell">
    <header className="member-topbar"><a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>HESAP MERKEZİ</small></span></a><div className="member-top-status"><i /> SW AĞI BAĞLI</div><button onClick={() => setConfirmAction({ kind: "logout" })} disabled={busy}>Çıkış yap</button></header>
    <div className="member-layout"><aside><p>SW IDENTITY</p>{(["profile", "security", "devices", "subscriptions"] as View[]).map((item, index) => <button key={item} className={view === item ? "active" : ""} disabled={view === item} onClick={() => setView(item)}><span>0{index + 1}</span>{viewNames[item]}</button>)}</aside>
      <section className="member-content account-center-content">
        {view === "profile" && <div className="account-view"><div className="account-view-heading"><p>SW HESABI · PROFİL</p><h1>Profilini düzenle</h1><span>Kullanıcı adını ve profil fotoğrafını buradan yönet.</span></div><div className="account-profile-identity"><div className={`account-avatar ${account.user.avatar.type === "preset" ? account.user.avatar.value : "custom"}`}>{avatarUrl ? <img src={avatarUrl} alt="Profil fotoğrafı" /> : <img src="/brand/swcreate-logo.png" alt="" />}</div><div><strong>{account.user.username}</strong><span>{account.user.email || "SW Identity hesabı"}</span></div></div><form className="account-settings-card" onSubmit={saveProfile}><h2>Kullanıcı adı</h2><p>Yeni kullanıcı adın 3–32 karakter olmalıdır.</p><label>Kullanıcı adı<input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]+" required /></label><button disabled={busy}>Kullanıcı adını kaydet</button></form><section className="account-settings-card"><h2>Profil fotoğrafı</h2><p>Hazır bir SW kimliği seçebilir veya bu cihazdan kendi fotoğrafını kullanabilirsin.</p><div className="avatar-preset-list">{avatarPresets.map((preset) => <button type="button" key={preset} className={account.user.avatar.type === "preset" && avatarPreset === preset ? `active ${preset}` : preset} onClick={() => setAvatarPreset(preset)} title={avatarLabel(preset)}><img src="/brand/swcreate-logo.png" alt="" /></button>)}</div><label className="avatar-upload-button">Kendi fotoğrafını seç<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} disabled={busy} /></label><button type="button" className="avatar-save-preset" onClick={() => void saveProfile({ preventDefault() {} } as FormEvent<HTMLFormElement>)} disabled={busy}>Seçili SW görselini kaydet</button></section>{status && <p className="account-view-status">{status}</p>}</div>}

        {view === "security" && <div className="account-view"><div className="account-view-heading"><p>SW IDENTITY v{SW_IDENTITY_VERSION}</p><h1>E-posta, şifre ve güvenlik</h1><span>Hesap değişiklikleri güvenli oturumun ve doğrulama uygulamanla korunur.</span></div><section className="account-settings-card"><h2>E-posta</h2><p>Hesabına bağlı mevcut e-posta adresi.</p><label>Mevcut e-posta<input value={account.user.email || "Henüz doğrulanmış e-posta yok"} disabled /></label><a className="account-card-link" href="/home/">E-posta değişikliği için SW Destek’e git</a></section><form className="account-settings-card" onSubmit={changePassword}><h2>Şifre</h2><p>Şifren değiştirildiğinde bu cihaz dışındaki açık oturumlar kapatılır.</p>{[["Mevcut şifre", currentPassword, setCurrentPassword], ["Yeni şifre", newPassword, setNewPassword], ["Yeni şifre tekrar", newPasswordRepeat, setNewPasswordRepeat]].map(([label, value, setter]) => <label key={label as string}>{label as string}<span className="secure-input"><input type={showPasswords ? "text" : "password"} value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} minLength={label === "Mevcut şifre" ? undefined : 10} required /><button type="button" onClick={() => setShowPasswords((shown) => !shown)} aria-label={showPasswords ? "Şifreleri gizle" : "Şifreleri göster"}><i /></button></span></label>)}<button disabled={busy}>Şifreyi değiştir</button></form><section className="account-settings-card"><h2>Doğrulama uygulaması</h2><p>{account.security.twoFactorEnabled ? "Açık. Yeni girişler Authenticator koduyla korunuyor." : "Kapalı. Google Authenticator, Microsoft Authenticator ve standart TOTP uygulamalarıyla çalışır."}</p>{!account.security.twoFactorEnabled && !totpSetup && <button onClick={startTwoFactor} disabled={busy}>Doğrulama uygulaması bağla</button>}{totpSetup && <section className="totp-setup"><span>1. Authenticator uygulamana SW hesabını ekle</span><div className="totp-methods" role="tablist" aria-label="Authenticator kurulum yöntemi"><button type="button" role="tab" aria-selected={qrMethod === "qr"} className={qrMethod === "qr" ? "active" : ""} onClick={() => setQrMethod("qr")}>QR kodu tara</button><button type="button" role="tab" aria-selected={qrMethod === "key"} className={qrMethod === "key" ? "active" : ""} onClick={() => setQrMethod("key")}>Kurulum anahtarı</button></div>{qrMethod === "qr" && <div className="totp-qr-panel">{totpQrDataUrl ? <div className="totp-qr-code"><img src={totpQrDataUrl} alt="SW Create Authenticator QR kodu" /><span aria-hidden="true"><img src="/brand/swcreate-logo.png" alt="" /></span></div> : <p>QR sistemi yüklenemedi. Kurulum anahtarını kullanabilirsin.</p>}<strong>Authenticator uygulamanda “QR kodu tara” seçeneğini aç.</strong><small>QR yalnızca bu tarayıcıda oluşturulur.</small></div>}{qrMethod === "key" && <div className="totp-key-panel"><p>Kurulum anahtarını elle gir.</p><code>{totpSetup.formattedSecret}</code><a href={totpSetup.otpauthUri}>Authenticator uygulamasında aç</a></div>}<span>2. Uygulamanın ürettiği 6 haneli kodu doğrula</span><form onSubmit={confirmTwoFactor}><input value={totpCode} onChange={(event) => setTotpCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} placeholder="123456" required /><button disabled={busy}>Doğrula ve aç</button></form></section>}{account.security.twoFactorEnabled && <form className="totp-disable" onSubmit={disableTwoFactor}><label>Bağlantıyı kaldırmak için kod<input value={totpCode} onChange={(event) => setTotpCode(event.target.value)} autoComplete="one-time-code" placeholder="123456 veya XXXX-XXXX" required /></label><button disabled={busy}>Doğrulama uygulamasını kaldır</button></form>}</section>{recoveryCodes.length > 0 && <section className="totp-recovery"><strong>Kurtarma kodların</strong><p>Her kod yalnızca bir kez kullanılabilir.</p><div>{recoveryCodes.map((code) => <code key={code}>{code}</code>)}</div></section>}{status && <p className="account-view-status">{status}</p>}</div>}

        {view === "devices" && <div className="account-view"><div className="account-view-heading"><p>SW OTURUM AĞI</p><h1>Oturum açılan cihazlar</h1><span>Hesabına giriş yapılan cihazları, açık oturumları, son etkinliği ve Cloudflare’ın yaklaşık konumunu kontrol et.</span></div><div className="device-refresh"><span>Son yenileme: şimdi · Açıkken {deviceCountdown} saniyede bir kontrol edilir.</span><button onClick={() => void loadDevices()}>↻ Yenile</button></div><div className="device-list">{devices.map((device) => { const location = [device.location.city, device.location.region, device.location.country].filter(Boolean).join(", ") || "Yaklaşık konum bilinmiyor"; return <article key={device.id}><div className="device-icon"><i /></div><div className="device-info"><strong>{deviceTitle(device.userAgent)} {device.current && <b>OTURUM AÇIK</b>}</strong><span>İlk giriş: {dateTime(device.createdAt)}</span><span>Son aktiflik: {dateTime(device.lastSeenAt)}</span>{visibleLocation === device.id && <em>{location} · Konum yaklaşık gösterilir</em>}</div><div className="device-actions"><button onClick={() => setVisibleLocation((current) => current === device.id ? null : device.id)}>{visibleLocation === device.id ? "Konumu gizle" : "Konumu göster"}</button><button className="danger" onClick={() => setConfirmAction({ kind: "device", device })}>{device.current ? "Bu cihazdan çık" : "Oturumu kapat"}</button></div></article>; })}</div>{status && <p className="account-view-status">{status}</p>}</div>}

        {view === "subscriptions" && <div className="account-view"><div className="account-view-heading"><p>SW ÜRÜN AĞI</p><h1>Abonelikler ve planlar</h1><span>Hangi üründe hangi plana sahip olduğunu ve erişim durumunu burada gör.</span></div><section className="subscription-summary"><span>MEVCUT ANA PLAN</span><strong>SW FREE</strong><p>Merkezi kimlik, güvenlik, destek ve temel ürün erişimi etkin.</p></section><div className="subscription-list">{account.entitlements.map((item) => <article key={item.slug}><div><i /><span><strong>{item.product}</strong><small>{item.slug}</small></span></div><b>{item.tier.toUpperCase()}</b></article>)}</div></div>}
      </section></div>
    {confirmAction && <div className="member-confirm-overlay" role="dialog" aria-modal="true"><section><span>SW IDENTITY ONAYI</span><h2>{confirmAction.kind === "logout" ? "Hesabından çıkış yapılsın mı?" : "Bu oturum kapatılsın mı?"}</h2><p>{confirmAction.kind === "logout" ? "Bu cihazdaki SW oturumun güvenli şekilde kapatılacak." : `${deviceTitle(confirmAction.device.userAgent)} oturumu artık hesabına erişemeyecek.`}</p><div><button onClick={() => setConfirmAction(null)}>Vazgeç</button><button className="danger" disabled={busy} onClick={() => confirmAction.kind === "logout" ? void logout() : void revokeDevice(confirmAction.device)}>{busy ? "İŞLENİYOR…" : "ONAYLA"}</button></div></section></div>}
  </main>;
}
