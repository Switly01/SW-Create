import { useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";
import { SW_IDENTITY_VERSION } from "./security";

const notes = [
  { number: "01", title: "Güvenli hızlı hesap seçimi", body: "SW hesabı parolayı tarayıcı koduna kaydetmeden, bu cihaza ve tarayıcıya bağlı dönen bir anahtarla açılır. Şifre veya e-posta değiştiğinde eski hızlı giriş anahtarları kapanır." },
  { number: "02", title: "10 dakikalık tek-geçerli e-posta kodu", body: "Güvenlik kodları en fazla 10 dakika çalışır. Yeni kod üretildiği anda aynı işlem için daha önce üretilen açık kod devre dışı bırakılır." },
  { number: "03", title: "Canlı destek posta köprüsü", body: "Destek yanıtları ve e-posta ekleri güvenli özel dosya akışına alınır; konuşma açıkken sayfa yenilenmeden görünür ve dosyalar indirilebilir." },
  { number: "04", title: "Bağlı giriş sağlayıcıları", body: "Google ve Kick hesapları artık oturum açıkken SW Identity hesabına bağlanabilir. Başka kullanıcıya bağlı bir kimliğin yeniden bağlanması engellenir." },
  { number: "05", title: "Kurtarma kodu rotasyonu", body: "İki aşamalı doğrulama kurtarma kodları doğrulama sonrasında yeniden üretilebilir. Yenileme yapıldığında önceki kodların tamamı anında geçersiz olur." },
  { number: "06", title: "Play Streamers giriş hazırlığı", body: "Play Streamers gerçek PS kimliğiyle gösterilir. SW hesabıyla ürün girişi için sunucu tarafındaki kısa ömürlü bağlantı şeması hazırlandı; ürün tarafı bağlanana kadar yanlış bir bağlı durumu gösterilmez." },
];

export function UpdateNotesPage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  useEffect(() => { apiRequest<SwAccount>("/api/account").then(setAccount).catch(() => window.location.replace("/account/")); }, []);
  if (!account) return <main className="member-shell"><div className="member-loading">GÜNCELLEME AĞI HAZIRLANIYOR…</div></main>;
  return <main className="member-shell sw-updates-page"><header className="member-topbar"><a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>GÜNCELLEME NOTLARI</small></span></a><div className="member-top-status"><i /> SW IDENTITY v{SW_IDENTITY_VERSION}</div><a className="dashboard-account-link" href="/home/">Kullanıcı ana sayfası</a></header><section className="sw-updates-content"><div className="sw-dashboard-heading"><p>SW SİNYAL KAYDI</p><h1>Değişen her şey,<br />tek yörüngede.</h1><span>Kimlik, veri akışı ve kullanıcı deneyimindeki güncellemeleri sürümleriyle birlikte burada takip et.</span></div><div className="sw-release-hero"><span>GÜNCEL SÜRÜM</span><strong>SW IDENTITY v{SW_IDENTITY_VERSION}</strong><p>Hızlı hesap seçimi, gelen destek ekleri, sağlayıcı bağlantıları ve kurtarma kodu rotasyonu güvenlik katmanına eklendi.</p></div><section className="sw-update-notes">{notes.map((note) => <article key={note.number}><b>{note.number}</b><div><span>SW IDENTITY v{SW_IDENTITY_VERSION}</span><h2>{note.title}</h2><p>{note.body}</p></div><i aria-hidden="true" /></article>)}</section></section></main>;
}
