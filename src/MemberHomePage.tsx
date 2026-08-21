import { useEffect, useState } from "react";
import { apiRequest, type SwAccount } from "./api";
import { rememberSwAccount } from "./rememberedAccounts";
import { SW_IDENTITY_VERSION } from "./security";

export function MemberHomePage() {
  const [account, setAccount] = useState<SwAccount | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest<SwAccount>("/api/account")
      .then((data) => {
        rememberSwAccount(data);
        setAccount(data);
      })
      .catch(() => window.location.replace("/account/"));
  }, []);

  async function logout() {
    setBusy(true);
    await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.replace("/");
  }

  if (!account) return <main className="member-shell"><div className="member-loading">KULLANICI ANA SAYFAN HAZIRLANIYOR…</div></main>;
  const memberSince = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(account.user.createdAt * 1000);
  const displayName = account.user.username || account.user.displayName;

  return (
    <main className="member-shell member-home-shell">
      <header className="member-topbar"><a href="/home/" className="member-brand"><img src="/brand/swcreate-logo.png" alt="" /><span>SW CREATE<small>KULLANICI ANA SAYFASI</small></span></a><div className="member-top-status"><i /> SW IDENTITY BAĞLI</div><div className="member-home-actions"><a href="/center/">Hesap merkezi</a><button onClick={logout} disabled={busy}>Çıkış yap</button></div></header>
      <section className="member-content member-home-content">
        <div className="member-welcome"><p>KULLANICI ANA SAYFASI · OTURUM AKTİF</p><h1>MERHABA,<br />{displayName.toLocaleUpperCase("tr-TR")}.</h1></div>
        <div className="member-dashboard">
          <section className="member-briefing">
            <div><span>SW AĞI / BUGÜN</span><h2>Yörüngen hazır.</h2><p>Burası sana ait kullanıcı ana sayfası. Ürünlerin, kimlik durumun ve hızlı geçişlerin tanıtım sitesinden bağımsız olarak burada çalışır.</p></div>
            <div className="member-orbit-mark" aria-hidden="true"><span>SW</span><i /><i /><i /></div>
          </section>

          <div className="account-summary-grid"><article><span>SW KİMLİĞİ</span><strong>{account.user.id.slice(0, 8).toUpperCase()}</strong><small>Merkezi hesap numaran</small></article><article><span>ÜRÜN ERİŞİMİ</span><strong>{String(account.entitlements.length).padStart(2, "0")}</strong><small>Etkin ürün bağlantısı</small></article><article><span>ÜYELİK</span><strong>FREE</strong><small>{memberSince} tarihinden beri</small></article></div>

          <div className="member-dashboard-grid">
            <section className="member-products"><div className="member-section-head"><div><span>ÜRÜN AĞI</span><h2>Ürünlerin</h2></div><b>{account.entitlements.length} BAĞLANTI</b></div>{account.entitlements.length > 0 ? account.entitlements.map((item) => <article key={item.slug}><div><i /> <span>{item.product}<small>{item.slug}</small></span></div><b>{item.tier.toUpperCase()}</b></article>) : <p className="member-empty">İlk ürün erişimin hesabına eklendiğinde burada görünecek.</p>}</section>

            <aside className="member-quick-panel"><span>HIZLI GEÇİŞLER</span><h2>Nereye gidiyorsun?</h2><a href="/center/?view=profile"><i>01</i><span>Hesap merkezi<small>Profilini ve SW kimliğini yönet</small></span><b>→</b></a><a href="/center/?view=security"><i>02</i><span>SW Identity güvenliği<small>Oturum ve güvenlik katmanını incele</small></span><b>→</b></a><a href="https://pstreamers.com" target="_blank" rel="noreferrer"><i>03</i><span>Play Streamers<small>Yayıncı kontrol sistemini aç</small></span><b>↗</b></a></aside>
          </div>

          <section className="member-signal-board">
            <div><span>SİSTEM SİNYALİ</span><strong><i /> TÜM SİSTEMLER ÇALIŞIYOR</strong></div>
            <div><span>GÜVENLİK KATMANI</span><strong>SW IDENTITY v{SW_IDENTITY_VERSION}</strong><small>Güvenli oturum etkin</small></div>
            <div><span>SONRAKİ ADIM</span><strong>PRO EDITION</strong><small>Erken erişim yakında</small></div>
          </section>
        </div>
      </section>
    </main>
  );
}
