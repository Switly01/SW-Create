import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "../chatgpt-auth";
import { loadSwAccount } from "@/lib/sw-identity";
import { AccountClient } from "./AccountClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SW Hesabı",
  description: "SW Create kimliğini, profilini ve ürün erişimlerini tek merkezden yönet.",
};

type AccountPageProps = {
  searchParams: Promise<{ mode?: string; plan?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [{ mode, plan }, identity] = await Promise.all([
    searchParams,
    getChatGPTUser(),
  ]);

  let account = null;
  let accountError: string | null = null;

  if (identity) {
    try {
      account = await loadSwAccount(identity);
    } catch (error) {
      console.error("SW account provisioning error", error);
      accountError = "Hesap verileri şu anda açılamadı. Oturumun güvende; biraz sonra yeniden deneyebilirsin.";
    }
  }

  const returnTo = `/account${plan ? `?plan=${encodeURIComponent(plan)}` : ""}`;

  return (
    <main className="account-shell">
      <section className="account-art" aria-label="SW Create kimlik alanı">
        <Image src="/brand/swcreate-orbit-core.png" alt="" fill priority sizes="43vw" />
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Image src="/brand/swcreate-logo.png" alt="" width={42} height={42} />
          </span>
          <span>SW CREATE</span>
        </Link>
        <div className="account-signal" aria-hidden="true">
          <i /> KİMLİK AĞI / GÜVENLİ
        </div>
        <div className="account-quote">
          <p>TEK KİMLİK.<br />BÜTÜN ÜRÜNLER.</p>
          <span>SW KİMLİK / v1.0</span>
        </div>
      </section>

      <AccountClient
        account={account}
        accountError={accountError}
        identity={identity}
        initialMode={mode === "register" || Boolean(plan) ? "register" : "login"}
        selectedPlan={plan ?? null}
        signInPath={chatGPTSignInPath(returnTo)}
        signOutPath={chatGPTSignOutPath("/")}
      />
    </main>
  );
}
