type LegalPageProps = { kind: "privacy" | "terms" };

export function LegalPage({ kind }: LegalPageProps) {
  const privacy = kind === "privacy";
  return (
    <main className="legal-page">
      <a className="brand" href="/"><span className="brand-mark"><img src="/brand/swcreate-logo.png" alt="" /></span>SW CREATE</a>
      <article className="legal-content">
        <p className="section-number">YASAL</p>
        <h1>{privacy ? <>GİZLİLİK<br />POLİTİKASI.</> : <>KULLANIM<br />KOŞULLARI.</>}</h1>
        <p>Son güncelleme: 16 Eylül 2026</p>
        {privacy ? (
          <>
            <h2>Topladığımız bilgiler</h2><p>SW Create hesabı oluşturduğunda e-posta adresin, görünen adın, güvenli biçimde özetlenmiş parolan ve ürün erişim kayıtların saklanır. Ham parola saklanmaz.</p>
            <h2>Kullanım amacı</h2><p>Bu bilgiler kimliğini doğrulamak, ürün erişimlerini tek hesapta yönetmek, güvenliği sağlamak ve açık rızanla hizmet bildirimleri göndermek için kullanılır.</p>
            <h2>Paylaşım ve satış</h2><p>Kişisel verileri satmayız. Hizmetin çalışması için zorunlu altyapı sağlayıcıları dışında üçüncü taraflara aktarım yapılmaz.</p>
            <h2>Saklama ve silme</h2><p>Hesabın açık olduğu sürece gerekli kayıtlar tutulur. Hesap silme veya veri talebi için <a href="mailto:swcreate.info@gmail.com">swcreate.info@gmail.com</a> adresine ulaşabilirsin.</p>
            <h2>Güvenlik</h2><p>Oturumlar güvenli çerezlerle, parolalar tuzlu güçlü özetlerle korunur. Şüpheli istekler hız sınırına tabi tutulur.</p>
            <h2>Çerezler ve dış hizmetler</h2><p>Oturumu ve dil tercihini korumak için zorunlu çerezler ile yerel depolama kullanılır. Google veya Kick ile giriş gibi isteğe bağlı bağlantılar seçildiğinde ilgili sağlayıcının kendi gizlilik koşulları da geçerlidir. Reklam ya da pazarlama çerezi kullanılmaz.</p>
          </>
        ) : (
          <>
            <h2>Hizmet kapsamı</h2><p>SW Create, ürün kataloğu, merkezî hesap ve ürün erişimi sağlar. Beta veya erken erişim özellikleri değişebilir.</p>
            <h2>Hesap güvenliği</h2><p>Hesabının ve giriş bilgilerinin güvenliğinden sen sorumlusun. Yetkisiz kullanım şüphesi halinde bizimle iletişime geçmelisin.</p>
            <h2>Kabul edilebilir kullanım</h2><p>Hizmeti hukuka aykırı, zararlı, istismar amaçlı veya altyapıyı aksatacak biçimde kullanamazsın.</p>
            <h2>Üyelikler</h2><p>Free, Product Pro ve SW Create Edition planları gösterilebilir. Ödeme sistemi etkinleştirilene kadar ücretli plan düğmeleri yalnızca erken erişim listesine kayıt sağlar.</p>
            <h2>Yaş ve uygunluk</h2><p>Hesap oluşturabilmek için en az 13 yaşında olmalısın. Bulunduğun ülkede daha yüksek bir dijital rıza yaşı geçerliyse bu sınıra ve gerekiyorsa veli onayına uymalısın.</p>
            <h2>Plan kodları</h2><p>Plan kodları devredilemez, yalnızca bir kez kullanılabilir ve satılamaz. Kötüye kullanım, yetkisiz dağıtım veya güvenlik ihlali halinde erişim askıya alınabilir.</p>
            <h2>Ödeme ve iade</h2><p>Şu anda doğrudan ödeme alınmaz. Ücretli satış başlamadan önce fiyat, yenileme, iptal ve iade koşulları satın alma adımında açıkça gösterilecektir.</p>
            <h2>İletişim</h2><p>Koşullarla ilgili sorular için <a href="mailto:swcreate.info@gmail.com">swcreate.info@gmail.com</a> adresine ulaşabilirsin.</p>
          </>
        )}
      </article>
    </main>
  );
}
