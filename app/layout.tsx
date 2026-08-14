import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SW Create — Fikirden ürüne, tek ekosistem",
    template: "%s — SW Create",
  },
  description:
    "SW Create; yaratıcıların, yayıncıların ve dijital toplulukların kullandığı bağımsız ürünleri tek hesapta birleştiren teknoloji stüdyosudur.",
  icons: {
    icon: "/brand/swcreate-logo.png",
    shortcut: "/brand/swcreate-logo.png",
  },
  metadataBase: new URL("https://swcreate.com"),
  openGraph: {
    title: "SW Create",
    description: "Yaratıcı ürünlerin işletim sistemi.",
    url: "https://swcreate.com",
    siteName: "SW Create",
    images: ["/brand/swcreate-orbit-core.png"],
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
