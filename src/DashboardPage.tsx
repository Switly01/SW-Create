import { useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";
import { rememberSwAccount } from "./rememberedAccounts";
import { SW_IDENTITY_VERSION } from "./security";

export function DashboardPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  useEffect(() => { apiRequest<SwAccount>("/api/account").then((data) => { rememberSwAccount(data); setAccount(data); }).catch(() => window.location.replace("/account/")); }, []);
  if (!account) return <main className="member-shell"><div className="member-loading">SW DASHBOARD HAZIRLANIYOR…</div></main>;
  const displayName = account.user.username || account.user.displayName;
  return <main className="member-shell sw-dashboard-page"><header className="member-topbar"><a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>DASHBOARD</small></span></a><div className="member-top-status"><i /> SW IDENTITY v{SW_IDENTITY_VERSION}</div><a className="dashboard-account-link" href="/center/">Hesabım</a></header><section className="sw-dashboard-content"><div className="sw-dashboard-heading"><p>SW ÜRÜN VE PLAN AĞI</p><h1>{displayName},<br />kontrol sende.</h1><span>Planlarını, ürün erişimlerini ve kimlik korumanı tek panelde gör.</span></div><div className="sw-dashboard-summary"><article><span>ANA PLAN</span><strong>SW FREE</strong><small>Etkin</small></article><article><span>ÜRÜN ERİŞİMİ</span><strong>{String(account.entitlements.length).padStart(2, "0")}</strong><small>Bağlı ürün</small></article><article><span>KİMLİK KORUMASI</span><strong>{account.security.twoFactorEnabled ? "2FA AÇIK" : "STANDART"}</strong><small>SW Identity v{SW_IDENTITY_VERSION}</small></article></div><section className="sw-dashboard-products"><div><span>ABONELİKLER</span><h2>Ürün planların</h2></div>{account.entitlements.map((item, index) => <article key={item.slug}><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{item.product}</strong><small>{item.slug}</small></span><b>{item.tier.toUpperCase()}</b></article>)}</section><div className="sw-dashboard-actions"><a href="/center/?view=subscriptions">Abonelikleri yönet <b>→</b></a><a href="/center/?view=security">Kimlik güvenliği <b>→</b></a><a href="/home/">Kullanıcı ana sayfası <b>←</b></a></div></section></main>;
}
