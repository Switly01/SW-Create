import { useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";
import { SW_IDENTITY_VERSION } from "./security";

type ProductKey = "sw-create" | "sw-identity" | "play-streamers" | "play-connect";
type ReleaseEntry = { version: string; title: string; body: string };
type ProductHistory = { name: string; mark: string; current: string; summary: string; entries: ReleaseEntry[] };

const histories: Record<ProductKey, ProductHistory> = {
  "sw-create": {
    name: "SW Create",
    mark: "SW",
    current: "Site 2.0",
    summary: "Marka sahnesi, ortak hesap sistemi ve ürün ağı bağımsız bir kullanıcı deneyiminde birleşti.",
    entries: [
      { version: "Site 2.0", title: "GitHub Pages ve özel alan adı", body: "Frontend GitHub Pages'a taşındı; swcreate.com, www yönlendirmesi ve api.swcreate.com Worker hattı birbirinden ayrılarak yayın mimarisi sadeleştirildi." },
      { version: "Site 2.0", title: "Yeni SW marka sahnesi", body: "Çekirdek, sürekli bozulma sinyali, karakteristik göz/sinyal biçimleri ve SW Create ile Play Streamers geçişleri aynı görsel dilde yeniden kuruldu." },
      { version: "Hesap 1.0", title: "Giriş, kayıt ve hesap merkezi", body: "Normal hesap, Google, Kick, beni hatırla, kullanıcı adı ve doğum tarihi akışları; bağımsız /account/ ve /center/ alanlarında birleştirildi." },
      { version: "Üye Alanı 1.0", title: "Bağımsız kullanıcı ana sayfası", body: "Oturum açan kullanıcı pazarlama ana sayfasından ayrılarak menü, bildirim, sistem durumu, destek ve neler yeni bileşenleriyle dolu bir üye alanına yönlendirildi." },
      { version: "Hesap Merkezi 2.0", title: "Profil, güvenlik, cihaz ve bağlantılar", body: "Profil fotoğrafı, parola ve e-posta yönetimi, Authenticator, kurtarma kodları, cihaz oturumları, abonelikler ve bağlı platformlar tek merkezde toplandı." },
      { version: "Planlar 1.0", title: "Ürün ve plan kataloğu", body: "SW Create ile Play Streamers için Free, Pro ve Product Pro planları; ayrı plan ve dashboard sayfalarıyla kataloglandı. Ödeme altyapısı hazır olmadan yanlış bir aktif abonelik gösterilmiyor." },
      { version: "Canlı Veri 1.0", title: "Gerçek ürün ve hesap ölçümleri", body: "Kayıtlı hesap ve aktif ürün göstergeleri rastgele sayılardan çıkarılarak API tarafından sağlanan doğrulanabilir verilere bağlandı." },
      { version: "Play Connect 1.0", title: "Tarayıcıya uygun mağaza yönlendirmesi", body: "Play Connect çağrısı tarayıcı motorunu algılayarak Chromium kullanıcılarını Chrome Web Store'a, Firefox kullanıcılarını Mozilla Add-ons sayfasına yönlendiriyor." },
      { version: "İletişim 2.0", title: "Destek, bildirim ve sürüm merkezi", body: "İletişim adresi, canlı destek talepleri, okunma durumu, sistem bildirimleri ve dört ürünlü güncelleme arşivi kullanıcı alanına eklendi." },
    ],
  },
  "sw-identity": {
    name: "SW Identity",
    mark: "ID",
    current: `v${SW_IDENTITY_VERSION}`,
    summary: "Kimlik doğrulama, veri akışı, posta köprüsü ve ürün bağlantıları aynı sürümlü güvenlik katmanında korunuyor.",
    entries: [
      { version: "v1.0", title: "Merkezi SW hesabı", body: "Kayıt, giriş, oturum ve hesap verileri Cloudflare Worker ile D1 üzerinde ortak bir kimlik katmanına taşındı." },
      { version: "v1.1", title: "Temel savunma katmanı", body: "PBKDF2 parola özeti, sunucu pepper'ı, HttpOnly oturum çerezi, CORS sınırı, hız kısıtlama ve Turnstile doğrulaması birlikte çalışacak şekilde sertleştirildi." },
      { version: "v1.2", title: "OAuth ve iki aşamalı doğrulama", body: "Google/Kick OAuth, AES-GCM ile korunan TOTP sırrı, Authenticator QR kurulumu ve tek kullanımlık kurtarma kodları eklendi." },
      { version: "v1.3", title: "Profil, cihaz ve özel dosya akışı", body: "Kullanıcı adı ve avatar yönetimi, açık oturumların cihaz bilgileri, yaklaşık konum ve kullanıcıya özel yetkili dosya indirme altyapısı oluşturuldu." },
      { version: "v1.4", title: "E-posta güvenlik kodları", body: "Resend üzerinden 10 dakika geçerli, yenisi üretildiğinde eskisini kapatan kodlarla parola sıfırlama, e-posta değişikliği ve hesap silme doğrulamaları kuruldu." },
      { version: "v1.5", title: "Destek ve abonelik veri sözleşmesi", body: "Destek konuşmaları, bildirimleri, plan kataloğu ve ürün hakları için kalıcı veri modeli ile güvenli API sözleşmesi eklendi." },
      { version: "v1.6", title: "Hızlı hesap ve sağlayıcı ağı", body: "Cihaza bağlı dönen hızlı giriş anahtarı, Google/Kick bağlantısı, kurtarma kodu yenileme ve Play Streamers için kısa ömürlü ürün devri hazırlandı." },
      { version: "v1.7", title: "20 günlük güvenilen cihaz", body: "Beni hatırla seçiliyken Authenticator doğrulamasını başarıyla geçen cihazda sunucu oturumu ve cihaz anahtarı 20 gün korunuyor; seçim yapılmadığında standart oturum süresi devam ediyor." },
      { version: "v1.7", title: "Kayıpsız destek eki ve temiz yanıt", body: "Resend ek kimlikleri kalıcı saklanıyor, dosya yalnızca bilet sahibi indirirken güvenli bağlantıdan alınıyor. Türkçe/İngilizce e-posta alıntı başlıkları ve eski mesaj zinciri konuşmaya eklenmeden temizleniyor." },
      { version: "v1.7", title: "Güvenli bağlantı kesme", body: "Google, Kick ve Play Streamers bağlantıları hesap merkezinden kaldırılabiliyor. Kullanıcıyı hesabının dışında bırakacak son giriş yönteminin silinmesi SW Identity tarafından engelleniyor." },
    ],
  },
  "play-streamers": {
    name: "Play Streamers",
    mark: "PS",
    current: "v4.20",
    summary: "Yayıncı paneli, bağış köprüleri ve hesap bazlı ölçüm sistemi doğrulanabilir bir çalışma alanında birleşti.",
    entries: [
      { version: "Temel Sürüm", title: "Yayıncı kontrol merkezi", body: "Canlı yayın bağlantıları, platform kartları, dashboard, profil ve yayın odaklı koyu arayüz Play Streamers'ın ana ürün deneyimini oluşturdu." },
      { version: "Kimlik ve Destek", title: "Cihaz, güvenlik ve destek alanları", body: "SW hesabı, iki aşamalı doğrulama, cihaz oturumları, destek talepleri, bildirimler ve e-posta yanıt köprüsü kullanıcı paneline bağlandı." },
      { version: "v3.8", title: "Daha hızlı olay algılama", body: "Bağış olayı 750 ms, sayfa/uyarı 500 ms ve durum 1 saniyelik kontrollü yoklama aralıklarıyla gecikme azaltıldı." },
      { version: "v3.9", title: "DAB ölçüm katmanı", body: "Bağış akışının sağlığını izleyen DAB sinyali sisteme eklendi ve sorunlar görünür sistem durumuna taşındı." },
      { version: "v4.4", title: "Gözlemci ve Play Bot", body: "Arayüz ve veri akışındaki olağan dışı durumları kontrol eden gözlemci katmanı ile Play Bot tanılama sinyalleri geliştirildi." },
      { version: "v4.10", title: "Ortak sistem kontrolleri", body: "Farklı bağış sağlayıcılarının sağlık kontrolleri aynı doğrulama mantığında birleştirildi; yanlış olumlu sinyaller azaltıldı." },
      { version: "v4.12–4.13", title: "Geometri ve grafik doğruluğu", body: "Panel yerleşimi, ölçüm geometrisi ve canlı grafik çizimi farklı ekran ölçülerinde daha tutarlı hale getirildi." },
      { version: "v4.14–4.15", title: "TipeeeStream marka düzeltmesi", body: "TipeeeStream sağlayıcı kartı ve marka varlıkları doğru logo, boyut ve görünürlük kurallarıyla güncellendi." },
      { version: "v4.17", title: "Sayaç tutarlılığı", body: "Gösterge sayaçlarının yeniden yükleme ve olay geçişlerinde aynı gerçek değeri koruması sağlandı." },
      { version: "v4.18–4.19", title: "DAB kontrol iyileştirmeleri", body: "DAB sağlık ölçümü sınır durumlarda sertleştirildi; geçici ağ sinyallerinin kalıcı arıza gibi görünmesi engellendi." },
      { version: "v4.20", title: "Hesap bazlı Kick ölçümü ve gizlilik", body: "Kick ölçümleri kullanıcı hesabına özel hale getirildi; oturum ve yayın verisinin hesaplar arasında karışmasını önleyen gizlilik sınırları güçlendirildi." },
    ],
  },
  "play-connect": {
    name: "Play Connect",
    mark: "PC",
    current: "v1.10.3",
    summary: "Chromium ve Firefox mağazalarında aynı sürümle çalışan yayın köprüsü, canlı olayları düşük gecikmeyle taşıyor.",
    entries: [
      { version: "İlk Sürüm", title: "Tarayıcı yayın köprüsü", body: "Desteklenen platformlardaki canlı olayları Play Streamers deneyimine taşıyan Chromium ve Gecko eklenti temeli oluşturuldu." },
      { version: "v1.9.7", title: "Kontrollü hızlı yoklama", body: "Etkinlik 750 ms, sayfa/uyarı 500 ms ve durum 1 saniye aralıklarla denetlenerek hız ile tarayıcı yükü dengelendi." },
      { version: "v1.10.x", title: "DAB uyumlu etkinlik mimarisi", body: "Arka plan ve içerik akışları Play Streamers'ın DAB sağlık sinyaliyle uyumlu hale getirildi; kopuk bağlantılar daha görünür oldu." },
      { version: "v1.10.3", title: "Chromium ve Gecko eşitliği", body: "Her iki manifest ve kaynak paket aynı 1.10.3 sürümüne sabitlendi; Firefox'a api.swcreate.com izni ve Chromium ile eş etkinlik bildirimi eklendi." },
      { version: "v1.10.3", title: "Canlı mağaza yayını", body: "Play Connect Chrome Web Store ve Mozilla Add-ons üzerinde yayınlandı; sitedeki deneme etiketi kaldırılarak canlı ürün durumuna geçirildi." },
      { version: "v1.10.3", title: "Doğru tarayıcı mağazası", body: "SW Create indirme çağrısı tarayıcı tabanını algılayarak kullanıcıyı doğru resmi eklenti sayfasına gönderiyor." },
      { version: "v1.10.3", title: "Paket ve test bütünlüğü", body: "Chromium ve Gecko paketleri kökte manifest.json içerecek biçimde üretildi; iki platformun ortak test takımı 36/36 başarıyla tamamlandı." },
    ],
  },
};

const productOrder: ProductKey[] = ["sw-create", "sw-identity", "play-streamers", "play-connect"];

export function UpdateNotesPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [active, setActive] = useState<ProductKey>("sw-create");
  useEffect(() => { apiRequest<SwAccount>("/api/account").then(setAccount).catch(() => window.location.replace("/account/")); }, []);
  if (!account) return <main className="member-shell"><div className="member-loading">GÜNCELLEME AĞI HAZIRLANIYOR…</div></main>;
  const history = histories[active];
  return <main className="member-shell sw-updates-page">
    <header className="member-topbar"><a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>GÜNCELLEME NOTLARI</small></span></a><div className="member-top-status"><i /> SW IDENTITY v{SW_IDENTITY_VERSION}</div><a className="dashboard-account-link" href="/home/">Kullanıcı ana sayfası</a></header>
    <section className="sw-updates-content">
      <div className="sw-dashboard-heading"><p>DÖRT ÜRÜN · TEK ARŞİV</p><h1>Değişen her şey,<br />tek yörüngede.</h1><span>SW Create, kimlik güvenliği, yayıncı paneli ve tarayıcı köprüsündeki doğrulanmış geliştirmeleri ürün ürün incele.</span></div>
      <nav className="sw-update-tabs" aria-label="Ürün güncelleme notları">{productOrder.map((key) => { const item = histories[key]; return <button key={key} type="button" className={active === key ? "active" : ""} aria-pressed={active === key} onClick={() => setActive(key)}><b>{item.mark}</b><span><strong>{item.name}</strong><small>{item.current}</small></span><i aria-hidden="true">→</i></button>; })}</nav>
      <div className="sw-release-hero" aria-live="polite"><span>GÜNCEL SÜRÜM · {history.name.toUpperCase()}</span><strong>{history.current}</strong><p>{history.summary}</p></div>
      <section className="sw-update-notes" aria-live="polite">{history.entries.map((note, index) => <article key={`${active}-${note.version}-${note.title}`}><b>{String(index + 1).padStart(2, "0")}</b><div><span>{history.name.toUpperCase()} · {note.version}</span><h2>{note.title}</h2><p>{note.body}</p></div><i aria-hidden="true" /></article>)}</section>
    </section>
  </main>;
}
