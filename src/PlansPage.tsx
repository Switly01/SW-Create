import { useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";
import { SW_IDENTITY_VERSION } from "./security";

export function PlansPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  useEffect(() => { apiRequest<SwAccount>("/api/account").then(setAccount).catch(() => window.location.replace("/account/")); }, []);
  if (!account) return <main className="member-shell"><div className="member-loading">PLAN AĞI HAZIRLANIYOR…</div></main>;
  return <main className="member-shell sw-plans-page">
    <header className="member-topbar"><a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>PLANLAR</small></span></a><div className="member-top-status"><i /> SW IDENTITY v{SW_IDENTITY_VERSION}</div><a className="dashboard-account-link" href="/center/?view=subscriptions">Aboneliklerim</a></header>
    <section className="sw-plans-content"><div className="sw-dashboard-heading"><p>SW PLAN AĞI</p><h1>Ürünlerinle<br />birlikte büyü.</h1><span>SW hesabındaki merkezi planı ve ürünlere özel erişimleri ayrı bir sayfada yönet.</span></div>
      <div className="sw-plans-grid"><article className="active"><span>ŞU ANKİ PLAN</span><h2>SW FREE</h2><p>SW Identity, hesap merkezi, güvenlik, bildirimler ve destek ağı.</p><b>ETKİN</b></article><article><span>ÜRÜN PLANLARI</span><h2>PRODUCT+</h2><p>Her SW ürününün kendi gelişmiş özellikleri, o ürünün planıyla açılır.</p><b>YAKINDA</b></article><article><span>SW CREATE</span><h2>CREATOR</h2><p>Birden fazla SW ürününü tek kapsamlı kimlik ve destek katmanında birleştirir.</p><b>ERKEN ERİŞİM</b></article></div>
      <section className="sw-plan-entitlements"><span>HESABINDAKİ ÜRÜNLER</span>{account.entitlements.length ? account.entitlements.map((item) => <article key={item.slug}><strong>{item.product}</strong><small>{item.slug}</small><b>{item.tier.toUpperCase()}</b></article>) : <p>Henüz ürüne özel bir erişim bulunmuyor.</p>}</section>
    </section>
  </main>;
}
