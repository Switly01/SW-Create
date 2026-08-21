import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrandSite } from "../app/ui/BrandSite";
import "../app/globals.css";
import "../app/brand-character.css";
import { AccountPage } from "./AccountPage";
import { MemberPage } from "./MemberPage";
import { LegalPage } from "./LegalPage";

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const page = path.endsWith("/account")
  ? <AccountPage />
  : path.endsWith("/center")
    ? <MemberPage />
  : path.endsWith("/privacy")
    ? <LegalPage kind="privacy" />
    : path.endsWith("/terms")
      ? <LegalPage kind="terms" />
      : <BrandSite />;

createRoot(document.getElementById("root")!).render(<StrictMode>{page}</StrictMode>);
