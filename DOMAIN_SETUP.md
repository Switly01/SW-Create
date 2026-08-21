# swcreate.com alan adı kurulumu

## Hedef yapı

| Adres | Hedef |
|---|---|
| `https://swcreate.com` | GitHub Pages üzerindeki SW Create marka sitesi ve hesap arayüzü |
| `https://www.swcreate.com` | `https://swcreate.com` adresine kalıcı yönlendirme |
| `https://api.swcreate.com` | Cloudflare Worker üzerindeki güvenli hesap ve ürün API'si |

## Cloudflare DNS

1. Cloudflare'da `swcreate.com` alanını aç.
2. GitHub Pages için kök alan adına (`@`) GitHub'ın dört apex A kaydını ekle.
3. `www` için `Switly01.github.io` hedefli CNAME kaydı ekle.
4. Depodaki `public/CNAME` dosyasının yalnızca `swcreate.com` içerdiğini koru.
5. Eski bir `@` A/AAAA/CNAME veya `www` CNAME kaydı aynı adresi kullanıyorsa
   önce hedefini doğrula; çakışan kayıt bırakma.
6. GitHub → Settings → Pages bölümünde kaynak olarak **GitHub Actions** seçili
   olmalı. SSL durumu etkinleşmeden DNS kayıtlarını tekrar değiştirme.

## Yönlendirme

Cloudflare → Rules → Redirect Rules bölümünde:

- Eşleşme: hostname `www.swcreate.com`
- Hedef: `https://swcreate.com${uri.path}`
- Durum: `301`
- Sorgu dizesini koru: açık

## Worker secret'ı

Cloudflare Worker'a en az 48 bayt rastgele üretilmiş `AUTH_PEPPER` secret'ı ekle.
Bu değer GitHub'a veya istemci koduna konulmaz.

## Kontrol

- `https://swcreate.com`
- `https://www.swcreate.com` ana alana yönleniyor mu
- `https://api.swcreate.com/api/health` 200 ve `database: connected` dönüyor mu
- kayıt, giriş, yenileme sonrası oturum ve çıkış akışları çalışıyor mu
