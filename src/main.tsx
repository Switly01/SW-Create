import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrandSite } from "../app/ui/BrandSite";
import "../app/globals.css";
import "../app/brand-character.css";
import "../app/studio-noir.css";
import { AccountPage } from "./AccountPage";
import { MemberHomePage } from "./MemberHomePage";
import { MemberPage } from "./MemberPage";
import { LegalPage } from "./LegalPage";
import { DashboardPage } from "./DashboardPage";
import { PlansPage } from "./PlansPage";
import { UpdateNotesPage } from "./UpdateNotesPage";
import { PortalLocalization } from "./PortalLocalization";
import { API_BASE } from "./api";
import { NotFoundPage } from "./NotFoundPage";

function PublicEntry() {
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const fallback = window.setTimeout(() => {
      if (!active) return;
      controller.abort();
      setSessionChecked(true);
    }, 5_000);
    fetch(`${API_BASE}/api/account`, { credentials: "include", cache: "no-store", signal: controller.signal })
      .then((response) => {
        window.clearTimeout(fallback);
        if (!active) return;
        if (response.ok) {
          window.location.replace("/home/");
          return;
        }
        setSessionChecked(true);
      })
      .catch((error) => {
        window.clearTimeout(fallback);
        if (active && !(error instanceof DOMException && error.name === "AbortError")) setSessionChecked(true);
      });
    return () => {
      active = false;
      window.clearTimeout(fallback);
      controller.abort();
    };
  }, []);

  if (!sessionChecked) return <main className="public-entry-gate" aria-live="polite"><img src="/brand/swcreate-logo.png" alt="" /><span>SW HESABI KONTROL EDİLİYOR</span><i /></main>;
  return <BrandSite />;
}

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const notFoundDocument = document.body.dataset.page === "not-found";
const page = notFoundDocument
  ? <NotFoundPage />
  : path.endsWith("/account")
  ? <AccountPage />
  : path.endsWith("/home")
    ? <MemberHomePage />
  : path.endsWith("/center")
    ? <MemberPage />
  : path.endsWith("/dashboard")
    ? <DashboardPage />
  : path.endsWith("/plans")
    ? <PlansPage />
  : path.endsWith("/updates")
    ? <UpdateNotesPage />
  : path.endsWith("/privacy")
      ? <LegalPage kind="privacy" />
    : path.endsWith("/terms")
      ? <LegalPage kind="terms" />
      : <PublicEntry />;

const hasNativeLocalization = notFoundDocument || path === "/" || path.endsWith("/updates");
const showPortalLanguageControl = !path.endsWith("/home");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {hasNativeLocalization ? page : <PortalLocalization showControl={showPortalLanguageControl}>{page}</PortalLocalization>}
  </StrictMode>,
);
