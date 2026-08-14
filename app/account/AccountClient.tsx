"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Account = {
  user: { id: string; email: string; displayName: string };
  entitlements: Array<{ product: string; tier: string }>;
};

export function AccountClient() {
  const [mode, setMode] = useState<"login" | "register">(() => {
    if (typeof window === "undefined") return "login";
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "register" || params.has("plan") ? "register" : "login";
  });
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/account", { credentials: "include" })
      .then(async (response) => response.ok ? setAccount(await response.json()) : null)
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      displayName: String(form.get("displayName") || ""),
    };
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as Account & { error?: string };
      if (!response.ok) throw new Error(data.error || "İşlem tamamlanamadı.");
      setAccount(data);
      setStatus({ type: "success", text: mode === "register" ? "SW hesabın oluşturuldu." : "Tekrar hoş geldin." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Beklenmedik bir hata oluştu." });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAccount(null);
    setStatus(null);
  }

  if (loading) {
    return <section className="account-panel"><div className="auth-box"><p className="section-number">SW IDENTITY</p><h1>HESABIN<br />HAZIRLANIYOR.</h1></div></section>;
  }

  if (account) {
    return (
      <section className="account-panel">
        <div className="auth-box">
          <p className="section-number">SW IDENTITY — BAĞLI</p>
          <h1>MERHABA,<br />{account.user.displayName.toUpperCase()}.</h1>
          <p>Ürün erişimlerin bu hesap üzerinden yönetilir. Ödeme sistemi etkinleştirildiğinde planların da aynı alanda görünecek.</p>
          <div className="profile-card">
            <div className="profile-head"><div><small>HESAP E-POSTASI</small><h2>{account.user.email}</h2></div><button onClick={logout}>Çıkış</button></div>
            <div className="entitlement-list">
              {account.entitlements.map((item) => <div className="entitlement" key={item.product}><span>{item.product}</span><strong>{item.tier.toUpperCase()}</strong></div>)}
            </div>
          </div>
          <Link className="account-back" href="/">← SW Create’a dön</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="account-panel">
      <div className="auth-box">
        <p className="section-number">SW IDENTITY — ERKEN ERİŞİM</p>
        <h1>HESABIN.<br />EKOSİSTEMİN.</h1>
        <p>Bu ilk sürümde SW hesabını oluşturabilir ve ürün yetkilerini tek merkezde tutabilirsin.</p>
        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setStatus(null); }}>Giriş yap</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setStatus(null); }}>Hesap oluştur</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && <label>GÖRÜNEN AD<input name="displayName" autoComplete="name" minLength={2} maxLength={48} required /></label>}
          <label>E-POSTA<input name="email" type="email" autoComplete="email" required /></label>
          <label>ŞİFRE<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={10} required /></label>
          <button className="auth-submit" disabled={busy}>{busy ? "İŞLENİYOR…" : mode === "login" ? "HESABA GİR ↗" : "SW HESABINI OLUŞTUR ↗"}</button>
        </form>
        <div className={`auth-status ${status?.type || ""}`} role="status">{status?.text}</div>
        <Link className="account-back" href="/">← SW Create’a dön</Link>
      </div>
    </section>
  );
}
