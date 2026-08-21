import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { API_BASE, apiRequest, type SwAccount, type SwNotification, type SwNotificationSync, type SwSupportTicket } from "./api";
import { savedSwLanguage, SW_LANGUAGES, type SwLanguage } from "./languages";
import { rememberSwAccount } from "./rememberedAccounts";
import { SW_IDENTITY_VERSION } from "./security";

type Surface = "menu" | "notifications" | "language" | "status" | "updates" | "plans" | null;
type Diagnostic = { label: string; detail: string; state: "ok" | "warning" | "error" };

const copy = {
  tr: { home: "KULLANICI ANA SAYFASI", hello: "MERHABA", dashboard: "Dashboard", news: "NELER YENİ?", products: "Ürünlerin", menu: "Menü", language: "Dil", notifications: "Bildirimler", system: "Sistem" },
  en: { home: "MEMBER HOME", hello: "HELLO", dashboard: "Dashboard", news: "WHAT'S NEW?", products: "Your products", menu: "Menu", language: "Language", notifications: "Notifications", system: "System" },
} as const;

function playConnectUrl() {
  return /Firefox|FxiOS/i.test(navigator.userAgent)
    ? "https://addons.mozilla.org/en-US/firefox/addon/play-connect/"
    : "https://chromewebstore.google.com/detail/play-connect/mpebmfjcdkflgiloecjonopfknojdaip";
}

function timeLabel(timestamp: number, locale: SwLanguage) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(timestamp * 1000);
}

function FilePicker({ files, onFiles, onRemove }: { files: File[]; onFiles: (files: FileList | null) => void; onRemove: (index: number) => void }) {
  return <div className="support-file-picker"><label><span className="support-clip" aria-hidden="true" /> Fotoğraf veya dosya ekle<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,application/zip" onChange={(event) => { onFiles(event.target.files); event.target.value = ""; }} /></label><small>En fazla 10 dosya · Dosya başına 10 MB · Toplam 25 MB</small>{files.length > 0 && <div>{files.map((file, index) => <button type="button" key={`${file.name}-${file.lastModified}-${index}`} onClick={() => onRemove(index)}><span>{file.name}<small>{Math.ceil(file.size / 1024)} KB</small></span><b>×</b></button>)}</div>}</div>;
}

export function MemberHomePage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [surface, setSurface] = useState<Surface>(null);
  const [locale, setLocale] = useState<SwLanguage>(savedSwLanguage);
  const [busy, setBusy] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<SwNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [tickets, setTickets] = useState<SwSupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportCategory, setSupportCategory] = useState("technical");
  const [supportNotice, setSupportNotice] = useState("");
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const commandRef = useRef<HTMLElement>(null);
  const supportRef = useRef<HTMLElement>(null);

  const activeLanguage = SW_LANGUAGES.find(([code]) => code === locale) ?? SW_LANGUAGES[0];
  const t = copy[locale === "en" ? "en" : "tr"];
  const unreadCount = notifications.filter((item) => !readNotifications.includes(item.id)).length;
  const currentTicket = tickets.find((ticket) => ticket.id === selectedTicket) ?? null;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    localStorage.setItem("sw-language", locale);
  }, [locale]);

  useEffect(() => {
    apiRequest<SwAccount>("/api/account").then((data) => {
      rememberSwAccount(data);
      setAccount(data);
      const stored = localStorage.getItem(`sw-notifications-read:${data.user.id}`);
      try { setReadNotifications(stored ? JSON.parse(stored) as string[] : []); } catch { setReadNotifications([]); }
    }).catch(() => window.location.replace("/account/"));
  }, []);

  const loadTickets = useCallback(async () => {
    const data = await apiRequest<{ tickets: SwSupportTicket[] }>("/api/support/tickets");
    setTickets(data.tickets);
    return data.tickets;
  }, []);

  const syncNotifications = useCallback(async () => {
    if (document.hidden || !navigator.onLine) return;
    const data = await apiRequest<SwNotificationSync>("/api/notifications/sync");
    setNotifications(data.notifications);
  }, []);

  useEffect(() => {
    if (!account) return;
    void syncNotifications();
    const timer = window.setInterval(() => void syncNotifications(), 12_000);
    const refresh = () => { if (!document.hidden) void syncNotifications(); };
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("online", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [account, syncNotifications]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (surface && !commandRef.current?.contains(target)) setSurface(null);
      if (supportOpen && !supportRef.current?.contains(target) && !target.closest?.(".member-support-rail")) setSupportOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSurface(null); setSupportOpen(false); setLogoutConfirm(false); }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [surface, supportOpen]);

  const runDiagnostics = useCallback(async () => {
    const controlCount = document.querySelectorAll(".member-home-tools button").length;
    const results: Diagnostic[] = [
      { label: "Güvenli bağlantı", detail: window.isSecureContext ? "HTTPS bağlamı doğrulandı." : "HTTPS bağlamı algılanamadı.", state: window.isSecureContext ? "ok" : "error" },
      { label: "Arayüz sözleşmesi", detail: controlCount >= 5 ? "Kritik komutlar yerinde." : "Eksik bir komut alanı algılandı.", state: controlCount >= 5 ? "ok" : "warning" },
    ];
    try {
      const response = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
      const health = await response.json() as { ok?: boolean; version?: string; dataFlow?: string; twoFactor?: string };
      const headerMatches = (response.headers.get("x-sw-identity") || "").includes(SW_IDENTITY_VERSION);
      results.push({ label: "Identity API", detail: health.ok ? `SW Identity v${health.version} yanıt verdi.` : "API beklenen yanıtı vermedi.", state: health.ok ? "ok" : "error" });
      results.push({ label: "Sürüm bütünlüğü", detail: health.version === SW_IDENTITY_VERSION && headerMatches ? "Frontend, API ve güvenlik başlıkları eşleşiyor." : "Sürüm veya güvenlik başlığı uyuşmuyor.", state: health.version === SW_IDENTITY_VERSION && headerMatches ? "ok" : "warning" });
      results.push({ label: "Veri akışı", detail: health.dataFlow === "verified" ? "SW Flow doğrulaması etkin." : "Veri akışı doğrulanamadı.", state: health.dataFlow === "verified" ? "ok" : "error" });
      results.push({ label: "İki aşamalı koruma", detail: health.twoFactor === "available" ? "Authenticator altyapısı kullanılabilir." : "Authenticator yapılandırması eksik.", state: health.twoFactor === "available" ? "ok" : "warning" });
    } catch { results.push({ label: "Identity API", detail: "API bağlantısı kurulamadı.", state: "error" }); }
    setDiagnostics(results);
  }, []);

  function toggle(next: Exclude<Surface, null>) {
    setSurface((current) => current === next ? null : next);
    if (next === "status") void runDiagnostics();
  }

  function rememberRead(ids: string[]) {
    if (!account) return;
    const next = Array.from(new Set([...readNotifications, ...ids]));
    setReadNotifications(next);
    localStorage.setItem(`sw-notifications-read:${account.user.id}`, JSON.stringify(next));
  }

  async function openNotification(notification: SwNotification) {
    rememberRead([notification.id]);
    setSurface(null);
    if (notification.target === "updates") setSurface("updates");
    else {
      setSupportOpen(true);
      const items = await loadTickets().catch(() => []);
      setSelectedTicket(notification.ticketId || items[0]?.id || null);
    }
  }

  async function openSupport(ticketId?: string) {
    setSurface(null);
    setSupportOpen(true);
    const items = await loadTickets().catch(() => []);
    setSelectedTicket(ticketId || items[0]?.id || null);
  }

  function chooseSupportFiles(files: FileList | null) {
    if (!files) return;
    const merged = [...supportFiles, ...Array.from(files)].slice(0, 10);
    const total = merged.reduce((sum, file) => sum + file.size, 0);
    if (merged.some((file) => file.size > 10 * 1024 * 1024) || total > 25 * 1024 * 1024) {
      setSupportNotice("Dosya başına 10 MB, toplamda 25 MB sınırı vardır.");
      return;
    }
    setSupportFiles(merged); setSupportNotice("");
  }

  async function uploadSupportFiles(ticketId: string, messageId: string) {
    for (const file of supportFiles) {
      const form = new FormData(); form.set("messageId", messageId); form.set("file", file);
      await apiRequest(`/api/support/tickets/${ticketId}/attachments`, { method: "POST", body: form });
    }
    setSupportFiles([]);
  }

  async function submitTicket(event: FormEvent) {
    event.preventDefault(); setBusy(true); setSupportNotice("");
    try {
      const data = await apiRequest<{ ticket: SwSupportTicket }>("/api/support/tickets", { method: "POST", body: JSON.stringify({ subject: supportSubject, category: supportCategory, message: supportMessage }) });
      const messageId = data.ticket.messages[0]?.id;
      if (supportFiles.length && messageId) await uploadSupportFiles(data.ticket.id, messageId);
      setSupportSubject(""); setSupportMessage(""); setSupportNotice("Talebin ve dosyaların SW destek ağına ulaştı.");
      await loadTickets(); setSelectedTicket(data.ticket.id); await syncNotifications();
    } catch (error) { setSupportNotice(error instanceof Error ? error.message : "Talep gönderilemedi."); }
    finally { setBusy(false); }
  }

  async function replyTicket(event: FormEvent) {
    event.preventDefault(); if (!currentTicket) return; setBusy(true);
    try {
      const data = await apiRequest<{ ticket: SwSupportTicket }>(`/api/support/tickets/${currentTicket.id}/messages`, { method: "POST", body: JSON.stringify({ message: supportMessage }) });
      const messageId = [...data.ticket.messages].reverse().find((message) => message.sender === "user")?.id;
      if (supportFiles.length && messageId) await uploadSupportFiles(currentTicket.id, messageId);
      setSupportMessage(""); await loadTickets();
    } catch (error) { setSupportNotice(error instanceof Error ? error.message : "Mesaj gönderilemedi."); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => undefined);
    window.location.replace("/");
  }

  const statusSummary = useMemo(() => {
    const errors = diagnostics.filter((item) => item.state === "error").length;
    const warnings = diagnostics.filter((item) => item.state === "warning").length;
    return !diagnostics.length ? "Denetim hazırlanıyor" : errors ? `${errors} kritik sinyal` : warnings ? `${warnings} uyarı bulundu` : "Tüm denetimler temiz";
  }, [diagnostics]);

  if (!account) return <main className="member-shell"><div className="member-loading">KULLANICI ANA SAYFAN HAZIRLANIYOR…</div></main>;
  const memberSince = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", { month: "long", year: "numeric" }).format(account.user.createdAt * 1000);
  const displayName = account.user.username || account.user.displayName;

  const renderSurface = () => {
    if (!surface) return null;
    return <aside className={`member-command-surface ${surface}`}>
      <button className="member-command-close" type="button" onClick={() => setSurface(null)} aria-label="Kapat">×</button>
      {surface === "notifications" && <><span>BİLDİRİM MERKEZİ</span><h2>{unreadCount ? `${unreadCount} yeni sinyal` : "Yeni sinyal yok"}</h2><div className="notification-list">{notifications.length ? notifications.map((notification) => <button type="button" key={notification.id} className={readNotifications.includes(notification.id) ? "notification-card read" : "notification-card"} onClick={() => void openNotification(notification)}><i /><span><b>{notification.title}</b><p>{notification.body}</p><small>{timeLabel(notification.createdAt, locale)} · Aç</small></span><strong>→</strong></button>) : <p className="member-empty">Bildirim ağı sessiz.</p>}</div></>}
      {surface === "language" && <><span>DİL SEÇİMİ</span><h2>Arayüz dili</h2><div className="member-language-menu">{SW_LANGUAGES.map(([code, flag, label]) => <button type="button" key={code} className={locale === code ? "active" : ""} onClick={() => { setLocale(code); setSurface(null); }}><img src={flag} alt="" /><span>{label}</span><b>{code.toUpperCase()}</b></button>)}</div></>}
      {surface === "status" && <><span>SİSTEM DURUMU · PLAY BOT</span><h2>{statusSummary}</h2><p className="play-bot-intro">Play Bot; bağlantıyı, SW Identity veri akışını, sürüm bütünlüğünü ve kritik arayüz sözleşmelerini canlı olarak inceler.</p><div className="diagnostic-list">{diagnostics.map((item) => <article key={item.label} className={item.state}><b><i />{item.label}</b><p>{item.detail}</p></article>)}</div><button type="button" className="diagnostic-refresh" onClick={() => void runDiagnostics()}>Yeniden denetle</button></>}
      {surface === "updates" && <><span>GÜNCELLEME NOTLARI</span><h2>SW Identity v{SW_IDENTITY_VERSION}</h2><article><b><i /> Destek ağı</b><p>Talepler artık SW hesabına bağlı ve bildirim merkeziyle eşzamanlı.</p></article><article><b><i /> Akıllı Play Bot</b><p>API, veri akışı, güvenlik başlıkları ve arayüz sözleşmeleri birlikte denetleniyor.</p></article><article><b><i /> Komuta merkezi</b><p>Dil, menü, bildirim ve sistem yüzeyleri dış tıklamada güvenle kapanıyor.</p></article></>}
      {surface === "plans" && <><span>SW PLANLARI</span><h2>Ürün ağınla büyür</h2><article><b><i /> SW Free</b><p>Merkezi kimlik, temel ürün erişimi, bildirimler ve destek talepleri.</p></article><article><b><i /> Ürün planları</b><p>Her ürünün ek planı etkinleştiğinde Dashboard’da görünür.</p></article></>}
      {surface === "menu" && <><span>SW MENÜ</span><h2>{displayName}</h2><a href="/center/">Hesabım <b>→</b></a><button type="button" className="surface-link" onClick={() => setSurface("updates")}>Güncelleme notları <b>→</b></button><button type="button" className="surface-link" onClick={() => setSurface("plans")}>Planlar <b>→</b></button><button type="button" className="surface-link" onClick={() => void openSupport()}>Destek taleplerim <b>→</b></button><a href="/privacy/">Gizlilik politikası <b>→</b></a><button type="button" className="member-menu-logout" onClick={() => { setSurface(null); setLogoutConfirm(true); }}>Çıkış yap</button></>}
    </aside>;
  };

  return <main className="member-shell member-home-shell">
    <button type="button" className="member-support-rail" onClick={() => void openSupport()}><span className="support-headset" aria-hidden="true" /> DESTEK</button>
    <header className="member-topbar member-command-bar" ref={commandRef}>
      <a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>{t.home}</small></span></a>
      <div className="member-home-tools">
        <a className="member-dashboard-button" href="/dashboard/">{t.dashboard}<b>▦</b></a>
        <button type="button" className={surface === "notifications" ? "active" : ""} onClick={() => toggle("notifications")} title={t.notifications} aria-label={t.notifications}><span className="notification-glyph"><i /><b /></span>{unreadCount > 0 && <em>{unreadCount}</em>}</button>
        <button type="button" className={surface === "language" ? "active member-language-trigger" : "member-language-trigger"} onClick={() => toggle("language")} title={t.language} aria-label={t.language}><img src={activeLanguage[1]} alt="" /><span>{locale.toUpperCase()}</span></button>
        <button type="button" className={surface === "status" ? "active warning" : "warning"} onClick={() => toggle("status")} title={t.system} aria-label={t.system}><span>!</span></button>
        <button type="button" className={surface === "menu" ? "active menu" : "menu"} onClick={() => toggle("menu")} title={t.menu} aria-label={t.menu}><span>≡</span></button>
      </div>{renderSurface()}
    </header>

    <section className="member-content member-home-content"><div className="member-welcome"><p>{t.home} · SW IDENTITY BAĞLI</p><h1>{t.hello},<br />{displayName.toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US")}.</h1></div><div className="member-dashboard">
      <section className="member-briefing"><div><span>SW AĞI / BUGÜN</span><h2>Yörüngen hazır.</h2><p>Burası sana ait kullanıcı ana sayfası. Ürünlerin, planların, bildirimlerin ve destek taleplerin tanıtım sitesinden bağımsız çalışır.</p></div><div className="member-orbit-mark" aria-hidden="true"><span><img src="/brand/swcreate-logo.png" alt="" /></span><i /><i /><i /></div></section>
      <section className="member-whats-new"><div><span>SW SİNYALİ / v{SW_IDENTITY_VERSION}</span><h2>{t.news}</h2><p>SW Identity artık destek olaylarını, bildirim akışını ve Play Bot sistem denetimlerini tek güvenli katmanda birleştiriyor.</p></div><div className="member-release-list"><article><b>01</b><span>Akıllı sistem denetimi<small>API, sürüm, veri akışı ve arayüz sözleşmeleri birlikte izlenir.</small></span></article><article><b>02</b><span>Hesaba bağlı destek<small>Gönderilen ve yanıtlanan talepler bildirim merkezine düşer.</small></span></article><article><b>03</b><span>Plan Dashboard’u<small>Ürün erişimlerin ve üyeliklerin tek panelde görünür.</small></span></article></div></section>
      <div className="account-summary-grid"><article><span>SW KİMLİĞİ</span><strong>{account.user.id.slice(0, 8).toUpperCase()}</strong><small>Merkezi hesap numaran</small></article><article><span>ÜRÜN ERİŞİMİ</span><strong>{String(account.entitlements.length).padStart(2, "0")}</strong><small>Etkin ürün bağlantısı</small></article><article><span>ÜYELİK</span><strong>FREE</strong><small>{memberSince} tarihinden beri</small></article></div>
      <div className="member-dashboard-grid"><section className="member-products"><div className="member-section-head"><div><span>ÜRÜN AĞI</span><h2>{t.products}</h2></div><b>{account.entitlements.length} BAĞLANTI</b></div>{account.entitlements.length > 0 ? account.entitlements.map((item) => <article key={item.slug}><div><i /><span>{item.product}<small>{item.slug}</small></span></div><b>{item.tier.toUpperCase()}</b></article>) : <p className="member-empty">İlk ürün erişimin hesabına eklendiğinde burada görünecek.</p>}</section><aside className="member-quick-panel"><span>HIZLI GEÇİŞLER</span><h2>Ürün ağı</h2><a href="https://pstreamers.com" target="_blank" rel="noreferrer"><i>01</i><span>Play Streamers<small>Yayıncı alanını aç</small></span><b>↗</b></a><a href={playConnectUrl()} target="_blank" rel="noreferrer"><i>02</i><span>Play Connect<small>Tarayıcına uygun mağaza sayfasını aç</small></span><b>↗</b></a><a href="/dashboard/"><i>03</i><span>SW Dashboard<small>Plan ve erişimlerini görüntüle</small></span><b>→</b></a></aside></div>
      <section className="member-signal-board"><div><span>SİSTEM SİNYALİ</span><strong><i /> TÜM SİSTEMLER ÇALIŞIYOR</strong></div><div><span>GÜVENLİK KATMANI</span><strong>SW IDENTITY v{SW_IDENTITY_VERSION}</strong><small>Veri akışı koruması etkin</small></div><div><span>ÇİFT DOĞRULAMA</span><strong>{account.security.twoFactorEnabled ? "KORUMA AÇIK" : "KURULUM BEKLİYOR"}</strong><small>Menü → Hesabım</small></div></section>
    </div></section>

    {supportOpen && <aside className="member-support-drawer" ref={supportRef} aria-label="SW destek merkezi">
      <header><div><span>SW DESTEK AĞI</span><h2>Nasıl yardımcı olabiliriz?</h2></div><button type="button" onClick={() => setSupportOpen(false)}>×</button></header>
      <div className="support-layout"><nav><button type="button" className={!selectedTicket ? "active" : ""} onClick={() => { setSelectedTicket(null); setSupportMessage(""); setSupportFiles([]); }}>+ Yeni destek talebi</button>{tickets.map((ticket) => <button type="button" key={ticket.id} className={selectedTicket === ticket.id ? "active" : ""} onClick={() => { setSelectedTicket(ticket.id); setSupportMessage(""); setSupportFiles([]); }}><span>{ticket.subject}</span><small>{ticket.status === "answered" ? "YANITLANDI" : "YANIT BEKLİYOR"}</small></button>)}</nav>
        <section>{currentTicket ? <><div className="support-ticket-head"><span>{currentTicket.category}</span><h3>{currentTicket.subject}</h3><small>{timeLabel(currentTicket.updatedAt, locale)}</small></div><div className="support-conversation">{currentTicket.messages.map((message) => <article key={message.id} className={message.sender}><b>{message.sender === "support" ? "SW DESTEK" : "SEN"}</b><p>{message.body}</p>{message.attachments.length > 0 && <div className="support-attachments">{message.attachments.map((attachment) => <a key={attachment.id} href={`${API_BASE}${attachment.url}`} target="_blank" rel="noreferrer">{attachment.mimeType.startsWith("image/") && <img src={`${API_BASE}${attachment.url}`} alt="" />}<span>{attachment.fileName}<small>{Math.ceil(attachment.size / 1024)} KB</small></span></a>)}</div>}<small>{timeLabel(message.createdAt, locale)}</small></article>)}</div><form onSubmit={replyTicket}><textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} minLength={4} maxLength={2000} placeholder="Yanıtını yaz…" required /><FilePicker files={supportFiles} onFiles={chooseSupportFiles} onRemove={(index) => setSupportFiles((items) => items.filter((_, itemIndex) => itemIndex !== index))} /><button disabled={busy}>Mesajı ve dosyaları gönder</button>{supportNotice && <p>{supportNotice}</p>}</form></> : <form className="support-new-form" onSubmit={submitTicket}><label>Kategori<select value={supportCategory} onChange={(event) => setSupportCategory(event.target.value)}><option value="technical">Teknik sorun</option><option value="account">Hesap ve güvenlik</option><option value="plans">Planlar ve ürünler</option><option value="feedback">Öneri</option></select></label><label>Konu<input value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} minLength={4} maxLength={100} required /></label><label>Mesaj<textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} minLength={10} maxLength={2000} required /></label><FilePicker files={supportFiles} onFiles={chooseSupportFiles} onRemove={(index) => setSupportFiles((items) => items.filter((_, itemIndex) => itemIndex !== index))} /><button disabled={busy}>{busy ? "GÖNDERİLİYOR…" : "TALEBİ VE DOSYALARI GÖNDER"}</button>{supportNotice && <p>{supportNotice}</p>}</form>}</section>
      </div>
    </aside>}
    {logoutConfirm && <div className="member-confirm-overlay" role="dialog" aria-modal="true"><section><span>OTURUM GÜVENLİĞİ</span><h2>Çıkış yapmak istediğine emin misin?</h2><p>Bu cihazdaki SW oturumun kapatılacak. Hesabın ve ürün verilerin silinmeyecek.</p><div><button type="button" onClick={() => setLogoutConfirm(false)}>Vazgeç</button><button type="button" className="danger" onClick={() => void logout()} disabled={busy}>{busy ? "ÇIKIŞ YAPILIYOR…" : "EVET, ÇIKIŞ YAP"}</button></div></section></div>}
  </main>;
}
