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
- `/privacy`: gizlilik politikası
- `/terms`: kullanım koşulları
- `/api/auth/*`: kayıt, giriş ve çıkış
- `/api/account`: oturum ve ürün yetkileri
- `/api/health`: uygulama ve D1 sağlık kontrolü

## Güvenlik

`AUTH_PEPPER` yalnızca barındırma ortamında secret olarak tutulmalıdır. Kaynak
koda ya da GitHub'a eklenmemelidir.

## Veritabanı

İlk D1 şeması `drizzle/0000_swcreate_identity.sql` dosyasındadır. Üretimde bir
kez uygulanır. Cloudflare Worker D1 bağlamasını `DB` adıyla kullanır.

## Alan adı

Canlı ana alan `swcreate.com`, tercih edilen yönlendirme `www.swcreate.com` →
`https://swcreate.com` şeklindedir. Arayüz `.github/workflows/pages.yml` ile
GitHub Pages'e yayınlanır; hesap API'si `https://api.swcreate.com` adresindeki
Cloudflare Worker üzerinde çalışır.
