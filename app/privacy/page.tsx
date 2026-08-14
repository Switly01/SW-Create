import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Gizlilik Politikası" };

export default function PrivacyPage() {
  return <main className="legal-page"><Link className="brand" href="/"><span className="brand-mark"><Image src="/brand/swcreate-logo.png" alt="" width={42} height={42} /></span>SW CREATE</Link><article className="legal-content"><p className="section-number">YASAL / 01</p><h1>GİZLİLİK<br />POLİTİKASI.</h1><p>Son güncelleme: 14 Ağustos 2026</p><h2>Topladığımız bilgiler</h2><p>SW Create hesabı oluşturduğunda e-posta adresin, görünen adın, güvenli biçimde özetlenmiş parolan ve ürün erişim kayıtların saklanır. Ham parola saklanmaz.</p><h2>Kullanım amacı</h2><p>Bu bilgiler kimliğini doğrulamak, ürün erişimlerini tek hesapta yönetmek, güvenliği sağlamak ve açık rızanla hizmet bildirimleri göndermek için kullanılır.</p><h2>Paylaşım ve satış</h2><p>Kişisel verileri satmayız. Hizmetin çalışması için zorunlu altyapı sağlayıcıları dışında üçüncü taraflara aktarım yapılmaz.</p><h2>Saklama ve silme</h2><p>Hesabın açık olduğu sürece gerekli kayıtlar tutulur. Hesap silme veya veri talebi için <a href="mailto:swcreate.info@gmail.com">swcreate.info@gmail.com</a> adresine ulaşabilirsin.</p><h2>Güvenlik</h2><p>Oturumlar güvenli çerezlerle, parolalar tuzlu güçlü özetlerle korunur. Şüpheli istekler hız sınırına tabi tutulur.</p></article></main>;
}
