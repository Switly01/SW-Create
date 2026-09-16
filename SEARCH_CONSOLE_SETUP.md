# Google Search Console kurulumu

Kod tarafı hazırdır: `robots.txt`, kök `sitemap.xml`, canonical adresler,
çok dilli `hreflang` sayfaları ve yapılandırılmış veri üretim paketine dahildir.

Hesap sahibi olarak tamamlanması gereken dış adımlar:

1. Search Console'da **Domain property** olarak `swcreate.com` ekle.
2. Google'ın verdiği `google-site-verification=...` TXT kaydını Cloudflare DNS'te
   kök alan adına ekle. Token'ı kaynak koda veya bu depoya koyma ve doğrulama
   sonrasında DNS'ten kaldırma.
3. Doğrulama tamamlandıktan sonra Sitemaps ekranına
   `https://swcreate.com/sitemap.xml` gönder.
4. URL Inspection ile önce `https://swcreate.com/`, ardından dil sayfaları,
   `/privacy/` ve `/terms/` için canlı URL testi yap ve dizine eklenmesini iste.
5. Page indexing, Core Web Vitals ve Enhancements raporlarını ilk dört hafta
   haftalık kontrol et. Sitemap'te olmayan hesap/üye sayfalarının `noindex`
   kalması beklenen davranıştır.

## DNS ve e-posta güvenliği

`_dmarc.swcreate.com` kaydı, raporların alınacağı gerçek ve izlenen posta adresi
belirlendikten sonra eklenmelidir. Başlangıç ilkesi:

```text
v=DMARC1; p=none; rua=mailto:<izlenen-dmarc-adresi>; adkim=s; aspf=s; pct=100
```

Raporlar en az iki hafta incelendikten sonra meşru göndericiler doğrulanarak
politika sırasıyla `quarantine`, ardından uygunsa `reject` düzeyine çıkarılır.
İzlenmeyen veya uydurma bir rapor adresi kullanılmamalıdır.
