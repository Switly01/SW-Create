# SW Create

SW Create marka sitesi, merkezî hesap ve ürün yetkilendirme altyapısı.

## Yerel çalışma

```powershell
npm ci
npm run dev
```

## Yapı

- `/`: marka ve ürün vitrini
- `/account`: merkezî SW hesabı
- `/home`: oturum açan kullanıcıya özel ana sayfa
- `/center`: profil ve SW Identity güvenlik merkezi
- `/dashboard`: plan, abonelik ve ürün erişim paneli
- `/plans`: bağımsız SW planları sayfası
- `/privacy`: gizlilik politikası
- `/terms`: kullanım koşulları
- `/api/auth/*`: kayıt, giriş ve çıkış
- `/api/account`: oturum ve ürün yetkileri
- `/api/health`: uygulama ve D1 sağlık kontrolü

## Güvenlik

Güvenlik katmanı `SW Identity v1.7.0` adını taşır. `AUTH_PEPPER`, isteğe bağlı
`TURNSTILE_SECRET_KEY` ve iki aşamalı doğrulama için `TOTP_ENCRYPTION_KEY`
yalnızca Worker secret olarak tutulmalıdır. Kaynak koda
ya da GitHub'a eklenmemelidir. Turnstile'ın public site key'i GitHub Actions
variable olarak `VITE_TURNSTILE_SITE_KEY` adıyla verilir. Ayrıntılar
`SW_IDENTITY_SECURITY.md` dosyasındadır.

## Veritabanı

İlk D1 şeması `drizzle/0000_swcreate_identity.sql` dosyasındadır. Üretimde bir
kez uygulanır. Cloudflare Worker D1 bağlamasını `DB` adıyla kullanır.
SW Identity 1.1 veri akışı ve TOTP tabloları `migrations/0006_sw_identity_v1_1.sql`
migration'ıyla eklenir.
SW Identity 1.3 profil, cihaz ve destek dosyası kayıtları
`migrations/0008_account_devices_attachments.sql` migration'ıyla eklenir.
Profil ve destek dosyaları ek bir ücretli depolama servisi gerektirmeden özel
D1 dosya nesneleri ve parçaları olarak tutulur.
SW Identity 1.5 e-posta kodları, hesapla eşleşen bildirim okundu durumu,
harita koordinatları ve destek e-posta webhook kayıtlarını
`migrations/0010_identity_mail_and_controls.sql` migration'ıyla ekler.

E-posta sistemi için `RESEND_API_KEY` ve `RESEND_WEBHOOK_SECRET` Worker secret;
`SUPPORT_INBOUND_DOMAIN`, `SUPPORT_EMAIL_RECIPIENT` ve isteğe bağlı
`RESEND_FROM_EMAIL` Worker değişkenidir. Resend `email.received` webhook adresi
`https://api.swcreate.com/api/webhooks/resend` olmalıdır.

## Alan adı

Canlı ana alan `swcreate.com`, tercih edilen yönlendirme `www.swcreate.com` →
`https://swcreate.com` şeklindedir. Arayüz `.github/workflows/pages.yml` ile
GitHub Pages'e yayınlanır; hesap API'si `https://api.swcreate.com` adresindeki
Cloudflare Worker üzerinde çalışır.
