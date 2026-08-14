import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Kullanım Koşulları" };

export default function TermsPage() {
  return <main className="legal-page"><Link className="brand" href="/"><span className="brand-mark"><Image src="/brand/swcreate-logo.png" alt="" width={42} height={42} /></span>SW CREATE</Link><article className="legal-content"><p className="section-number">YASAL / 02</p><h1>KULLANIM<br />KOŞULLARI.</h1><p>Son güncelleme: 14 Ağustos 2026</p><h2>Hizmet kapsamı</h2><p>SW Create, ürün kataloğu, merkezî hesap ve ürün erişimi sağlar. Deneme veya erken erişim özellikleri değişebilir.</p><h2>Hesap güvenliği</h2><p>Hesabının ve giriş bilgilerinin güvenliğinden sen sorumlusun. Yetkisiz kullanım şüphesi halinde bizimle iletişime geçmelisin.</p><h2>Kabul edilebilir kullanım</h2><p>Hizmeti hukuka aykırı, zararlı, istismar amaçlı veya altyapıyı aksatacak biçimde kullanamazsın.</p><h2>Üyelikler</h2><p>Ücretsiz, Ürün Pro ve SW Create Özel planları gösterilebilir. Ödeme sistemi etkinleştirilene kadar ücretli plan düğmeleri yalnızca erken erişim listesine kayıt sağlar.</p><h2>İletişim</h2><p>Koşullarla ilgili sorular için <a href="mailto:swcreate.info@gmail.com">swcreate.info@gmail.com</a> adresine ulaşabilirsin.</p></article></main>;
}
