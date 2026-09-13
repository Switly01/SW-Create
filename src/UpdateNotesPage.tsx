import { useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";
import { savedSwLanguage, SW_LANGUAGES, type SwLanguage } from "./languages";
import releaseNotesFamily from "./release-notes-family.localized.json";
import { SW_IDENTITY_VERSION } from "./security";

type ProductKey = "swcreate" | "identity" | "web" | "app" | "connect";
type ReleaseEntry = { version: string; title: string; beta: boolean; items: string[] };
type ProductHistory = { name: string; tabTitle: string; current: string; summary: string; entries: ReleaseEntry[] };
type ReleaseLocale = {
  ui: { eyebrow:string; title:string; intro:string; latest:string; beta:string; fullRelease:string; language:string; memberHome:string; currentVersion:string; loading:string };
  products: Record<ProductKey, ProductHistory>;
};

const productOrder: ProductKey[] = ["swcreate", "identity", "web", "app", "connect"];
const productLogos: Record<ProductKey, string> = {
  swcreate: "/brand/swcreate-logo.png",
  identity: "/brand/sw-identity-logo.svg",
  web: "/brand/play-streamers-ps-logo.svg",
  app: "/brand/play-streamers-ps-logo.svg",
  connect: "/brand/play-connect-pc-logo.svg",
};

export function UpdateNotesPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [active, setActive] = useState<ProductKey>("swcreate");
  const [locale, setLocale] = useState<SwLanguage>(savedSwLanguage);
  const archive = releaseNotesFamily.locales[locale] as unknown as ReleaseLocale;
  useEffect(() => { apiRequest<SwAccount>("/api/account").then(setAccount).catch(() => window.location.replace("/account/")); }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    localStorage.setItem("sw-language", locale);
  }, [locale]);
  if (!account) return <main className="member-shell"><div className="member-loading">{archive.ui.loading}</div></main>;
  const history = archive.products[active];
  return <main className="member-shell sw-updates-page">
    <header className="member-topbar"><a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>{archive.ui.title.toLocaleUpperCase(locale)}</small></span></a><div className="member-top-status"><i /> SW IDENTITY v{SW_IDENTITY_VERSION}</div><div className="sw-updates-header-actions"><label><span className="sr-only">{archive.ui.language}</span><select value={locale} aria-label={archive.ui.language} onChange={event => setLocale(event.target.value as SwLanguage)}>{SW_LANGUAGES.map(([code,,label]) => <option key={code} value={code}>{label}</option>)}</select></label><a className="dashboard-account-link" href="/home/">{archive.ui.memberHome}</a></div></header>
    <section className="sw-updates-content">
      <div className="sw-dashboard-heading"><p>{archive.ui.eyebrow}</p><h1>{archive.ui.title}</h1><span>{archive.ui.intro}</span></div>
      <nav className="sw-update-tabs" aria-label={archive.ui.title}>{productOrder.map((key) => { const item = archive.products[key]; return <button key={key} type="button" className={active === key ? "active" : ""} aria-pressed={active === key} onClick={() => setActive(key)}><b><img src={productLogos[key]} alt="" /></b><span><strong>{item.tabTitle}</strong><small>{item.current}</small></span><i aria-hidden="true">→</i></button>; })}</nav>
      <div className="sw-release-hero" aria-live="polite"><span>{archive.ui.currentVersion} · {history.name.toLocaleUpperCase(locale)}</span><strong>{history.current}</strong><p>{history.summary}</p></div>
      <section className="sw-update-notes" aria-live="polite">{history.entries.map((note, index) => <article className={note.beta ? "beta-release" : "stable-release"} key={`${active}-${note.version}-${note.title}`}><b>{String(index + 1).padStart(2, "0")}</b><div><span>{[note.beta ? archive.ui.beta : (note.version === "1.0" ? archive.ui.fullRelease : ""), note.version].filter(Boolean).join(" · ")}</span><h2>{note.title}</h2><ul>{note.items.map(item => <li key={item}>{item}</li>)}</ul></div><i aria-hidden="true" /></article>)}</section>
    </section>
  </main>;
}
