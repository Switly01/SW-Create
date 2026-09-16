import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrandSite } from "../app/ui/BrandSite";
import "../app/globals.css";
import "../app/brand-character.css";
import "../app/studio-noir.css";
import { publicPathLanguage } from "./languages";
const AccountPage = lazy(() => import("./AccountPage").then(module => ({ default: module.AccountPage })));
const MemberHomePage = lazy(() => import("./MemberHomePage").then(module => ({ default: module.MemberHomePage })));
const MemberPage = lazy(() => import("./MemberPage").then(module => ({ default: module.MemberPage })));
const LegalPage = lazy(() => import("./LegalPage").then(module => ({ default: module.LegalPage })));
const DashboardPage = lazy(() => import("./DashboardPage").then(module => ({ default: module.DashboardPage })));
const PlansPage = lazy(() => import("./PlansPage").then(module => ({ default: module.PlansPage })));
const UpdateNotesPage = lazy(() => import("./UpdateNotesPage").then(module => ({ default: module.UpdateNotesPage })));
const PortalLocalization = lazy(() => import("./PortalLocalization").then(module => ({ default: module.PortalLocalization })));
const NotFoundPage = lazy(() => import("./NotFoundPage").then(module => ({ default: module.NotFoundPage })));

function PublicEntry() {
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

const hasNativeLocalization = notFoundDocument || path === "/" || Boolean(publicPathLanguage()) || path.endsWith("/updates");
const showPortalLanguageControl = !path.endsWith("/home");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<main className="route-loading" aria-live="polite"><img src="/brand/swcreate-logo-128.webp" alt="" /><span>SW CREATE</span></main>}>
      {hasNativeLocalization ? page : <PortalLocalization showControl={showPortalLanguageControl}>{page}</PortalLocalization>}
    </Suspense>
  </StrictMode>,
);
