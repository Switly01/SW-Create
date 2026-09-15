import { StrictMode } from "react";
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

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const page = path.endsWith("/account")
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
      : <BrandSite />;

const hasNativeLocalization = path === "/" || path.endsWith("/updates");
const showPortalLanguageControl = !path.endsWith("/home");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {hasNativeLocalization ? page : <PortalLocalization showControl={showPortalLanguageControl}>{page}</PortalLocalization>}
  </StrictMode>,
);
