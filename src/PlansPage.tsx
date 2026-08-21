import { useEffect, useMemo, useState } from "react";
import { apiRequest, type SwAccount, type SwPlan, type SwPlanCatalog } from "./api";
import { SW_IDENTITY_VERSION } from "./security";

const productOrder = ["sw-create", "play-streamers"] as const;

export function PlansPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [catalog, setCatalog] = useState<SwPlanCatalog | null>(null);
  useEffect(() => {
    Promise.all([apiRequest<SwAccount>("/api/account"), apiRequest<SwPlanCatalog>("/api/plans")])
      .then(([nextAccount, nextCatalog]) => { setAccount(nextAccount); setCatalog(nextCatalog); })
      .catch(() => window.location.replace("/account/"));
  }, []);
  const groupedPlans = useMemo(() => {
    const groups = new Map<string, SwPlan[]>();
    for (const plan of catalog?.plans || []) groups.set(plan.productId, [...(groups.get(plan.productId) || []), plan]);
    return groups;
  }, [catalog]);
  if (!account || !catalog) return <main className="member-shell"><div className="member-loading">PLAN AĞI HAZIRLANIYOR…</div></main>;
  const subscriptionByProduct = new Map(catalog.subscriptions.map((item) => [item.productId, item]));
  return <main className="member-shell sw-plans-page">
    <header className="member-topbar"><a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>PLANLAR</small></span></a><div className="member-top-status"><i /> SW IDENTITY v{SW_IDENTITY_VERSION}</div><a className="dashboard-account-link" href="/center/?view=subscriptions">Aboneliklerim</a></header>
    <section className="sw-plans-content"><div className="sw-dashboard-heading"><p>SW PLAN AĞI</p><h1>Ürünlerinle<br />birlikte büyü.</h1><span>SW Create ve Play Streamers planlarını ayrı ürün katmanları olarak gör; etkin planların SW Identity hesabınla eşleşir.</span></div>
      <aside className="sw-plan-safety-note"><span>ABONELİK ALTYAPISI HAZIR</span><p>Ücretsiz planlar hesabına bağlıdır. Ücretli planlar için ödeme alınmıyor; güvenli ve yaş koşullarına uygun sağlayıcı seçilene kadar bu planlar “Yakında” durumunda kalır.</p></aside>
      <div className="sw-plan-products">{productOrder.map((productId) => {
        const plans = groupedPlans.get(productId) || [];
        const current = subscriptionByProduct.get(productId);
        if (!plans.length) return null;
        return <section key={productId} className="sw-plan-product"><header><span>SW ÜRÜN PLANI</span><h2>{plans[0].product}</h2><p>{productId === "sw-create" ? "Kimlik, üretim ve SW ürün ağı için merkezi planlar." : "Yayıncı paneli ve yayın üretim araçları için ürün planları."}</p></header><div className="sw-plans-grid">{plans.map((plan) => {
          const active = current?.planId === plan.id && current.status === "active";
          return <article key={plan.id} className={active ? "active" : ""}><span>{active ? "ŞU ANKİ PLAN" : plan.tier === "product-pro" ? "EN GENİŞ ÜRÜN PLANI" : "ÜRÜN PLANI"}</span><h3>{plan.name}</h3><p>{plan.description}</p><b>{active ? "ETKİN" : plan.availability === "coming_soon" ? "YAKINDA" : "HAZIR"}</b></article>;
        })}</div></section>;
      })}</div>
      <section className="sw-plan-entitlements"><span>HESABINDAKİ ERİŞİMLER</span>{account.entitlements.length ? account.entitlements.map((item) => <article key={item.slug}><strong>{item.product}</strong><small>{item.slug}</small><b>{item.tier.toUpperCase()}</b></article>) : <p>Henüz ürüne özel bir erişim bulunmuyor.</p>}</section>
    </section>
  </main>;
}
