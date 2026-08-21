# SW Identity Security

Sürüm: `1.4.0`

Profil fotoğrafları ve destek ekleri özel D1 dosya nesnelerinde parçalı tutulur;
dosya erişimi oturum ve kayıt sahipliği doğrulamasından sonra Worker üzerinden
verilir. Destek ekleri dosya başına 10 MB, talep başına 10 dosya ve toplam
25 MB ile sınırlandırılır. Cihaz kayıtlarında ham IP yerine yalnızca özet değer
saklanır; kullanıcıya Cloudflare'ın yaklaşık şehir/bölge bilgisi gösterilir.

SW Identity, SW Create hesap ve oturum akışının güvenlik katmanıdır. Bu ad bir
görsel etiketten ibaret değildir; aşağıdaki kontroller birlikte çalışır.

## Uygulama katmanları

- Parolalar ham olarak saklanmaz; salt ve Worker secret içindeki pepper ile
  PBKDF2 özeti alınır.
- Oturum anahtarı veritabanına yalnızca SHA-256 özetiyle yazılır ve tarayıcıya
  `HttpOnly`, `Secure`, `SameSite=Lax` çerezi olarak verilir.
- Yazma istekleri izin verilen origin listesiyle sınırlandırılır.
- İstek gövdesi 16 KB ile sınırlıdır.
- Giriş ve kayıt denemeleri hem IP hem hedef hesap için D1 üzerinde
  sınırlandırılır.
- Kullanıcı var/yok yanıtı aynı hata metnine ve parola özeti işlemine alınarak
  hesap keşfi zorlaştırılır.
- Görünmez bot alanı ve form doldurma süresi denetimi basit otomasyonu eler.
- Turnstile yapılandırıldığında her giriş ve kayıt isteği tek kullanımlık,
  beş dakika geçerli token ile Worker tarafında doğrulanır.
- Her API isteği kişisel veri içermeyen ayrı bir `SW Flow` kimliği taşır;
  güvenlik olayları IP adresinin pepper'lı özetiyle kaydedilir ve parola, TOTP
  sırrı, OAuth token'ı veya oturum anahtarı olay günlüğüne yazılmaz.
- Yazma istekleri yalnız JSON olarak kabul edilir ve hesap yanıtları yalnız
  arayüzün ihtiyaç duyduğu alanlarla sınırlandırılır.
- TOTP iki aşamalı doğrulama sırları AES-GCM ile şifrelenir; kurtarma kodları
  yalnız hash olarak tutulur ve tek kullanımlıdır.
- API yanıtları `SW Identity v1.4.0` sürüm başlığı ile güvenlik, içerik türü,
  çerçeveleme, izin ve yönlendiren politikalarını taşır.
- Cihazdaki hesap seçicide yalnızca kullanıcı kimliği ve görünen ad saklanır;
  parola, OAuth token'ı veya oturum anahtarı `localStorage` içine yazılmaz.
- E-posta, şifre ve hesap silme işlemleri; iki adımlı doğrulama açıksa TOTP veya
  kurtarma kodu, değilse 10 dakika geçerli tek kullanımlık e-posta koduyla
  doğrulanır. Kod özetleri D1'de tutulur ve hatalı deneme sayısı sınırlandırılır.
- Destek yanıtları yalnız Resend'in zaman sınırlı HMAC/Svix imzası ve izinli
  gönderen adresi doğrulandıktan sonra doğru kullanıcı konuşmasına yazılır.
- Bildirim okundu bilgisi hesapla birlikte sunucuda tutulur; tarayıcı depolaması
  güvenlik ve görünürlük kararının kaynağı değildir.

## Turnstile'ı etkinleştirme

Bu ayarlar kullanıcı tarafından yapılmalıdır:

1. Cloudflare panelinde bir Turnstile widget oluştur.
2. İzin verilen hostlara `swcreate.com` ve `www.swcreate.com` ekle.
3. Public site key'i GitHub deposunda **Settings → Secrets and variables →
   Actions → Variables** bölümüne `VITE_TURNSTILE_SITE_KEY` adıyla ekle.
4. Secret key'i Cloudflare Worker secret olarak `TURNSTILE_SECRET_KEY` adıyla
   ekle. Secret değeri GitHub dosyasına veya frontend koduna yazılmamalıdır.
5. Frontend'i yeniden build et ve Worker'ı yeniden yayımla.
6. Giriş, kayıt ve hatalı token akışlarını canlı alan adında test et.

Turnstile anahtarları eklenmeden sistem pasif koruma modunda çalışır: origin,
IP/hesap hız sınırı, form zamanı ve bot alanı aktiftir; Turnstile doğrulaması
zorunlu değildir.

## İki aşamalı doğrulamayı etkinleştirme

1. `migrations/0006_sw_identity_v1_1.sql` migration'ını canlı D1 veritabanına
   bir kez uygula.
2. En az 32 karakterlik, diğer anahtarlardan bağımsız rastgele bir değeri
   Worker secret olarak `TOTP_ENCRYPTION_KEY` adıyla ekle.
3. Worker'ı yeniden yayımla. Bu secret daha sonra değiştirilirse daha önce
   kurulmuş Authenticator sırları çözülemez; yedeklenmeli ve döndürme işlemi
   planlı migration ile yapılmalıdır.
4. Hesap Merkezi → Güvenlik bölümünden Authenticator kurulumunu test et.

## Cloudflare ücretsiz koruma kontrol listesi

- Web trafiği alan adında Cloudflare proxy üzerinden geçmelidir.
- SSL/TLS modu sertifika durumu doğrulandıktan sonra `Full (strict)` olmalıdır.
- Always Use HTTPS açık olmalıdır.
- Ücretsiz Managed WAF kuralları açık tutulmalıdır.
- `/api/auth/` yolu için IP bazlı rate limiting kuralı oluşturulmalıdır.
- Bot Fight Mode bütün alan adına etki ettiği ve API/eklenti trafiğini de
  challenge edebildiği için önce test edilerek açılmalıdır.
- Saldırı sırasında geçici olarak Under Attack Mode kullanılabilir; sürekli
  açık bırakmak normal ziyaretçi ve OAuth akışlarını bozabilir.

Hiçbir uygulama veya ücretsiz plan bütün saldırılara karşı kesintisizlik
garantisi vermez. SW Identity uygulama ve kimlik katmanını korur; hacimsel DDoS
trafiğinin ağ kenarında karşılanması Cloudflare'ın proxy ve DDoS sisteminin
görevidir.
