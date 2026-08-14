# swcreate.com alan adı kurulumu

## Hedef yapı

| Adres | Hedef |
|---|---|
| `https://swcreate.com` | SW Create marka sitesi ve hesap sistemi |
| `https://www.swcreate.com` | `https://swcreate.com` adresine kalıcı yönlendirme |
| `https://swcreate.com/api/*` | Aynı dağıtımdaki güvenli API rotaları |

## Cloudflare DNS

1. Cloudflare'da `swcreate.com` alanını aç.
2. Sites dağıtımı tamamlandıktan sonra alan adı bağlantı sonucunda verilen apex
   A kayıtlarını kök alan adına (`@`) ekle.
3. `www` için bağlantı sonucunda verilen CNAME hedefini ekle.
4. Sites tarafından verilen doğrulama TXT/CNAME kayıtlarını eksiksiz ekle.
5. Eski bir `@` A/AAAA/CNAME veya `www` CNAME kaydı aynı adresi kullanıyorsa
   önce hedefini doğrula; çakışan kayıt bırakma.
6. SSL durumu `active` olmadan mevcut kayıtları tekrar değiştirme.

## Yönlendirme

Cloudflare → Rules → Redirect Rules bölümünde:

- Eşleşme: hostname `www.swcreate.com`
- Hedef: `https://swcreate.com${uri.path}`
- Durum: `301`
- Sorgu dizesini koru: açık

## Secret

Barındırma ortamına en az 48 bayt rastgele üretilmiş `AUTH_PEPPER` secret'ı ekle.
Bu değer GitHub'a veya istemci koduna konulmaz.

## Kontrol

- `https://swcreate.com`
- `https://www.swcreate.com` ana alana yönleniyor mu
- `https://swcreate.com/api/health` 200 ve `database: connected` dönüyor mu
- kayıt, giriş, yenileme sonrası oturum ve çıkış akışları çalışıyor mu
