import { useEffect, useState } from "react";
import { savedSwLanguage, SW_LANGUAGES, type SwLanguage } from "./languages";

const NOT_FOUND_COPY: Record<SwLanguage, {
  title: string; eyebrow: string; body: string; home: string; products: string;
  help: string; language: string; path: string; documentTitle: string;
}> = {
  tr: { title: "Bu yörünge boş.", eyebrow: "404 / SİNYAL YOK", body: "Aradığın sayfa taşınmış, kaldırılmış ya da hiç var olmamış olabilir. SW merkezine dönerek doğru sinyali yeniden bulabilirsin.", home: "Ana sayfaya dön", products: "Ürünleri keşfet", help: "Yolunu hâlâ bulamıyorsan bize yaz.", language: "Dil", path: "Bulunamayan adres", documentTitle: "Sayfa bulunamadı — SW Create" },
  en: { title: "Nothing in this orbit.", eyebrow: "404 / SIGNAL LOST", body: "The page may have moved, been removed, or never existed. Return to the SW hub to pick up the right signal.", home: "Return home", products: "Explore products", help: "Still lost? Write to us.", language: "Language", path: "Missing address", documentTitle: "Page not found — SW Create" },
  de: { title: "Diese Umlaufbahn ist leer.", eyebrow: "404 / SIGNAL VERLOREN", body: "Die Seite wurde möglicherweise verschoben, entfernt oder hat nie existiert. Kehre zur SW-Zentrale zurück und finde das richtige Signal.", home: "Zur Startseite", products: "Produkte entdecken", help: "Noch nicht fündig? Schreib uns.", language: "Sprache", path: "Nicht gefundene Adresse", documentTitle: "Seite nicht gefunden — SW Create" },
  es: { title: "Esta órbita está vacía.", eyebrow: "404 / SEÑAL PERDIDA", body: "La página puede haberse movido, eliminado o quizá nunca existió. Vuelve al centro SW para encontrar la señal correcta.", home: "Volver al inicio", products: "Descubrir productos", help: "¿Sigues perdido? Escríbenos.", language: "Idioma", path: "Dirección no encontrada", documentTitle: "Página no encontrada — SW Create" },
  fr: { title: "Cette orbite est vide.", eyebrow: "404 / SIGNAL PERDU", body: "La page a peut-être été déplacée, supprimée ou n’a jamais existé. Retournez au centre SW pour retrouver le bon signal.", home: "Retour à l’accueil", products: "Découvrir les produits", help: "Toujours perdu ? Écrivez-nous.", language: "Langue", path: "Adresse introuvable", documentTitle: "Page introuvable — SW Create" },
  ru: { title: "Эта орбита пуста.", eyebrow: "404 / СИГНАЛ ПОТЕРЯН", body: "Страница могла быть перемещена, удалена или никогда не существовала. Вернитесь в центр SW, чтобы найти нужный сигнал.", home: "На главную", products: "Смотреть продукты", help: "Всё ещё не нашли путь? Напишите нам.", language: "Язык", path: "Адрес не найден", documentTitle: "Страница не найдена — SW Create" },
  ar: { title: "هذا المدار فارغ.", eyebrow: "404 / الإشارة مفقودة", body: "ربما نُقلت الصفحة أو حُذفت أو لم تكن موجودة من الأصل. عُد إلى مركز SW للعثور على الإشارة الصحيحة.", home: "العودة إلى الرئيسية", products: "استكشاف المنتجات", help: "ما زلت لا تجد الطريق؟ راسلنا.", language: "اللغة", path: "العنوان غير موجود", documentTitle: "الصفحة غير موجودة — SW Create" },
  ja: { title: "この軌道には何もありません。", eyebrow: "404 / シグナル消失", body: "ページは移動、削除されたか、最初から存在しなかった可能性があります。SWセンターに戻って正しいシグナルを探してください。", home: "ホームに戻る", products: "製品を見る", help: "まだ見つかりませんか？お問い合わせください。", language: "言語", path: "見つからないアドレス", documentTitle: "ページが見つかりません — SW Create" },
};

export function NotFoundPage() {
  const [language, setLanguage] = useState<SwLanguage>(savedSwLanguage);
  const copy = NOT_FOUND_COPY[language];
  const missingPath = `${window.location.pathname}${window.location.search}`;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = copy.documentTitle;
    window.localStorage.setItem("sw-language", language);
  }, [copy.documentTitle, language]);

  return <main className="not-found-page" dir={language === "ar" ? "rtl" : "ltr"}>
    <header className="not-found-header">
      <a href="/" className="not-found-brand" aria-label="SW Create"><span><img src="/brand/swcreate-logo.png" alt="" /></span><b>SW CREATE</b></a>
      <label><span>{copy.language}</span><select value={language} aria-label={copy.language} onChange={(event) => setLanguage(event.target.value as SwLanguage)}>{SW_LANGUAGES.map(([code, , label]) => <option key={code} value={code}>{label}</option>)}</select></label>
    </header>
    <section className="not-found-content">
      <div className="not-found-copy">
        <p>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <span>{copy.body}</span>
        <nav aria-label={copy.title}><a href="/">{copy.home}<i aria-hidden="true">→</i></a><a href="/#products">{copy.products}<i aria-hidden="true">↘</i></a></nav>
        <small>{copy.help} <a href="mailto:swcreate.info@gmail.com">swcreate.info@gmail.com</a></small>
      </div>
      <div className="not-found-signal" aria-hidden="true"><strong>404</strong><i /><i /><i /><span>SW / LOST SIGNAL</span></div>
    </section>
    <footer><span>{copy.path}</span><code dir="ltr">{missingPath}</code></footer>
  </main>;
}
