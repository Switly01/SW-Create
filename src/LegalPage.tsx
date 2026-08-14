type LegalPageProps = { kind: "privacy" | "terms" };

export function LegalPage({ kind }: LegalPageProps) {
  const privacy = kind === "privacy";
  return (
    <main className="legal-page">
      <a className="brand" href="/"><span className="brand-mark"><img src="/brand/swcreate-logo.png" alt="" /></span>SW CREATE</a>
      <article className="legal-content">
        <p className="section-number">YASAL / {privacy ? "01" : "02"}</p>
        <h1>{privacy ? <>GİZLİLİK<br />POLİTİKASI.</> : <>KULLANIM<br />KOŞULLARI.</>}</h1>
        <p>Son güncelleme: 14 Ağustos 2026</p>
        {privacy ? (
          <>
            <h2>Topladığımız bilgiler</h2><p>SW Create hesabı oluşturduğunda e-posta adresin, görünen adın, güvenli biçimde özetlenmiş parolan ve ürün erişim kayıtların saklanır. Ham parola saklanmaz.</p>
            <h2>Kullanım amacı</h2><p>Bu bilgiler kimliğini doğrulamak, ürün erişimlerini tek hesapta yönetmek, güvenliği sağlamak ve açık rızanla hizmet bildirimleri göndermek için kullanılır.</p>
            <h2>Paylaşım ve satış</h2><p>Kişisel verileri satmayız. Hizmetin çalışması için zorunlu altyapı sağlayıcıları dışında üçüncü taraflara aktarım yapılmaz.</p>
            <h2>Saklama ve silme</h2><p>Hesabın açık olduğu sürece gerekli kayıtlar tutulur. Hesap silme veya veri talebi için <a href="mailto:swcreate.info@gmail.com">swcreate.info@gmail.com</a> adresine ulaşabilirsin.</p>
            <h2>Güvenlik</h2><p>Oturumlar güvenli çerezlerle, parolalar tuzlu güçlü özetlerle korunur. Şüpheli istekler hız sınırına tabi tutulur.</p>
          </>
        ) : (
          <>
            <h2>Hizmet kapsamı</h2><p>SW Create, ürün kataloğu, merkezî hesap ve ürün erişimi sağlar. Beta veya erken erişim özellikleri değişebilir.</p>
            <h2>Hesap güvenliği</h2><p>Hesabının ve giriş bilgilerinin güvenliğinden sen sorumlusun. Yetkisiz kullanım şüphesi halinde bizimle iletişime geçmelisin.</p>
            <h2>Kabul edilebilir kullanım</h2><p>Hizmeti hukuka aykırı, zararlı, istismar amaçlı veya altyapıyı aksatacak biçimde kullanamazsın.</p>
            <h2>Üyelikler</h2><p>Free, Product Pro ve SW Create Edition planları gösterilebilir. Ödeme sistemi etkinleştirilene kadar ücretli plan düğmeleri yalnızca erken erişim listesine kayıt sağlar.</p>
            <h2>İletişim</h2><p>Koşullarla ilgili sorular için <a href="mailto:swcreate.info@gmail.com">swcreate.info@gmail.com</a> adresine ulaşabilirsin.</p>
          </>
        )}
      </article>
    </main>
  );
}
