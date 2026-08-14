import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AccountClient } from "./AccountClient";

export const metadata: Metadata = {
  title: "Hesap",
  description: "SW Create ürünlerini ve erişimlerini tek merkezden yönet.",
};

export default function AccountPage() {
  return (
    <main className="account-shell">
      <section className="account-art">
        <Image src="/brand/swcreate-orbit-core.png" alt="" fill priority sizes="43vw" />
        <Link className="brand" href="/">
          <span className="brand-mark"><Image src="/brand/swcreate-logo.png" alt="" width={42} height={42} /></span>
          <span>SW CREATE</span>
        </Link>
        <div className="account-quote">
          <p>TEK KİMLİK.<br />BÜTÜN ÜRÜNLER.</p>
          <span>SW IDENTITY / v1.0</span>
        </div>
      </section>
      <AccountClient />
    </main>
  );
}
