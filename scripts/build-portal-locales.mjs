import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const familyRoot = resolve(root, "..");
const ts = createRequire(new URL("../package.json", import.meta.url))("typescript");
const languages = ["en", "de", "es", "fr", "ru", "ar", "ja"];
const sourceFiles = [
  "src/AccountPage.tsx",
  "src/MemberHomePage.tsx",
  "src/MemberPage.tsx",
  "src/DashboardPage.tsx",
  "src/PlansPage.tsx",
  "src/LegalPage.tsx",
  "src/TurnstileChallenge.tsx",
  "src/PortalLocalization.tsx",
  "src/api.ts",
  "account/index.html",
  "home/index.html",
  "center/index.html",
  "dashboard/index.html",
  "plans/index.html",
  "privacy/index.html",
  "terms/index.html",
];

const clean = value => String(value || "").replace(/\\n|\\r|\\t/g, " ").replace(/\s+/g, " ").trim();
const passthrough = value => /^(?:SW CREATE|SW IDENTITY|SW Dashboard|Play Streamers|Play Connect|Google Chrome|Microsoft Edge|Mozilla Firefox|WebGL|API|HTTPS|FREE|PRO|PRODUCT PRO|DATA FLOW PROTECTED)$/i.test(clean(value))
  || /^(?:[\d\s.,:%+\-/–—()]+|[A-Z]{2,5}|v?\d+(?:\.\d+)*)$/i.test(clean(value));

function translatable(value) {
  const text = clean(value);
  if (!text || text.length < 2 || text.length > 1200 || passthrough(text)) return false;
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/u.test(text)) return false;
  if (/^(?:https?:|mailto:|\/|\.|#|\[|script\[|image\/|[\w.+-]+@[\w.-]+\.)/i.test(text)) return false;
  if (/^active \{\d+\}$/i.test(text)) return false;
  if (/^[a-z0-9_-]+(?:\s+[a-z0-9_-]+)+$/i.test(text) && /(?:shell|page|form|visible|active|warning|menu|overlay|button|icons|read)/i.test(text)) return false;
  if (/^(?:M\d|[A-Za-z]\d+[-.\dA-Za-z\s]+$|\[A-Za-z)/.test(text)) return false;
  return true;
}

function addCandidate(target, value) {
  const text = clean(value);
  if (translatable(text)) target.add(text);
}

function extractTypeScript(source, target, filename) {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = node => {
    if (ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) addCandidate(target, node.text);
    if (ts.isTemplateExpression(node)) {
      const value = node.head.text + node.templateSpans.map((span, index) => `{${index}}${span.literal.text}`).join("");
      addCandidate(target, value);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
}

function extractHtml(source, target) {
  for (const match of source.matchAll(/<title>([\s\S]*?)<\/title>/gi)) addCandidate(target, match[1]);
}

function translationValid(source, value, language) {
  const output = clean(value);
  if (!output) return false;
  const tokens = text => [...text.matchAll(/\{\d+\}/g)].map(match => match[0]).sort().join(",");
  if (tokens(source) !== tokens(output)) return false;
  return true;
}

const reviewed = {
  "SW ürünlerini aktif kullanan": {
    en: "Active SW product users", de: "Aktive Nutzer der SW-Produkte", es: "Usuarios activos de productos SW", fr: "Utilisateurs actifs des produits SW", ru: "Активные пользователи продуктов SW", ar: "المستخدمون النشطون لمنتجات SW", ja: "SW製品のアクティブユーザー",
  },
  "Verilerin, bağlantıların ve ürün izinlerin yalnızca senin yönetiminde.": {
    en: "Your data, connections and product permissions stay under your control.", de: "Deine Daten, Verbindungen und Produktberechtigungen bleiben unter deiner Kontrolle.", es: "Tus datos, conexiones y permisos de producto permanecen bajo tu control.", fr: "Vos données, connexions et autorisations produit restent sous votre contrôle.", ru: "Ваши данные, подключения и разрешения продуктов остаются под вашим контролем.", ar: "تظل بياناتك واتصالاتك وأذونات منتجاتك تحت سيطرتك.", ja: "データ、接続、製品権限はすべてあなた自身が管理できます。",
  },
  "Yörüngen hazır.": {
    en: "Your workspace is ready.", de: "Dein Arbeitsbereich ist bereit.", es: "Tu espacio de trabajo está listo.", fr: "Votre espace de travail est prêt.", ru: "Ваше рабочее пространство готово.", ar: "مساحة عملك جاهزة.", ja: "ワークスペースの準備ができました。",
  },
  "KENDİ FİZİĞİMİZİ KURUYORUZ.": {
    en: "WE BUILD SYSTEMS ON OUR OWN TERMS.", de: "WIR BAUEN SYSTEME NACH UNSEREN EIGENEN REGELN.", es: "CREAMOS SISTEMAS CON NUESTRAS PROPIAS REGLAS.", fr: "NOUS CRÉONS DES SYSTÈMES SELON NOS PROPRES RÈGLES.", ru: "МЫ СОЗДАЁМ СИСТЕМЫ ПО СВОИМ ПРАВИЛАМ.", ar: "نبني الأنظمة وفق رؤيتنا الخاصة.", ja: "自分たちの思想でシステムをつくる。",
  },
  "{0} yaklaşık konumu": {
    en: "Approximate location of {0}", de: "Ungefährer Standort von {0}", es: "Ubicación aproximada de {0}", fr: "Localisation approximative de {0}", ru: "Примерное местоположение: {0}", ar: "الموقع التقريبي لـ {0}", ja: "{0}のおおよその位置",
  },
  "Büyük haritada aç ↗": {
    en: "Open in full map ↗", de: "Auf großer Karte öffnen ↗", es: "Abrir en el mapa completo ↗", fr: "Ouvrir sur la carte complète ↗", ru: "Открыть на большой карте ↗", ar: "افتح في الخريطة الكاملة ↗", ja: "大きな地図で開く ↗",
  },
  "SW AĞI / BUGÜN": {
    en: "SW NETWORK / TODAY", de: "SW-NETZWERK / HEUTE", es: "RED SW / HOY", fr: "RÉSEAU SW / AUJOURD’HUI", ru: "СЕТЬ SW / СЕГОДНЯ", ar: "شبكة SW / اليوم", ja: "SWネットワーク / 今日",
  },
  "SW SİNYALİ / v": {
    en: "SW SIGNAL / v", de: "SW-SIGNAL / v", es: "SEÑAL SW / v", fr: "SIGNAL SW / v", ru: "СИГНАЛ SW / v", ar: "إشارة SW / v", ja: "SWシグナル / v",
  },
  "SİSTEM SİNYALİ": {
    en: "SYSTEM SIGNAL", de: "SYSTEMSIGNAL", es: "SEÑAL DEL SISTEMA", fr: "SIGNAL SYSTÈME", ru: "СИГНАЛ СИСТЕМЫ", ar: "إشارة النظام", ja: "システムシグナル",
  },
  "SW Create Free Edition": {
    en: "SW Create Free Edition", de: "SW Create Free Edition", es: "SW Create Free Edition", fr: "SW Create Free Edition", ru: "SW Create Free Edition", ar: "SW Create Free Edition", ja: "SW Create Free Edition",
  },
  "BAĞLANTIYI KES": {
    en: "DISCONNECT", de: "VERBINDUNG TRENNEN", es: "DESCONECTAR", fr: "DÉCONNECTER", ru: "ОТКЛЮЧИТЬ", ar: "قطع الاتصال", ja: "接続を解除",
  },
  "ÇİFT DOĞRULAMA": {
    en: "TWO-FACTOR AUTHENTICATION", de: "ZWEI-FAKTOR-AUTHENTIFIZIERUNG", es: "AUTENTICACIÓN EN DOS PASOS", fr: "AUTHENTIFICATION À DEUX FACTEURS", ru: "ДВУХФАКТОРНАЯ АУТЕНТИФИКАЦИЯ", ar: "المصادقة الثنائية", ja: "二要素認証",
  },
  "Girişini doğrula": {
    en: "Verify your sign-in", de: "Anmeldung bestätigen", es: "Verifica tu inicio de sesión", fr: "Vérifiez votre connexion", ru: "Подтвердите вход", ar: "تحقق من تسجيل الدخول", ja: "ログインを確認",
  },
  "SW Hesabı — SW Create": { en: "SW Account — SW Create" },
  "STÜDYOYA DÖN": { en: "RETURN TO STUDIO" },
  "SW Create kimlik alanı": { en: "SW Create identity area" },
  "TEK KİMLİK.": { en: "ONE IDENTITY." },
  "BÜTÜN ÜRÜNLER.": { en: "ACROSS EVERY PRODUCT." },
  "Tek hesap": { en: "One account" },
  "Güvenli veri akışı": { en: "Secure data flow" },
  "Ürünler arası erişim": { en: "Cross-product access" },
  "— BAĞIMSIZ HESAP": { en: "— INDEPENDENT ACCOUNT" },
  "TEKRAR": { en: "WELCOME" },
  "HOŞ GELDİN.": { en: "BACK." },
  "Var olan SW hesabınla merkezine gir.": { en: "Sign in to your hub with your existing SW account." },
  "Hesap işlemi": { en: "Account action" },
  "Giriş yap": { en: "Sign in" },
  "Hesap oluştur": { en: "Create account" },
  "ŞİRKET SİTESİ": { en: "COMPANY WEBSITE" },
  "E-POSTA YA DA KULLANICI ADI": { en: "EMAIL OR USERNAME" },
  "ŞİFRE": { en: "PASSWORD" },
  "Şifreyi göster": { en: "Show password" },
  "SW bot ve hız koruması etkin": { en: "SW bot and rate protection active" },
  "GİRİŞ YAP": { en: "SIGN IN" },
  "YA DA SAĞLAYICIYLA DEVAM ET": { en: "OR CONTINUE WITH A PROVIDER" },
  "Hesap sağlayıcısı": { en: "Account provider" },
  "Beni hatırla": { en: "Remember me" },
  "Bu cihazda 20 gün açık kal": { en: "Stay signed in on this device for 20 days" },
  "Şifremi unuttum": { en: "Forgot password" },
  "Devam ederek": { en: "By continuing, you accept the" },
  "Koşullar": { en: "Terms of Service" },
  "ve": { en: "and" },
  "Gizlilik Politikası": { en: "Privacy Policy" },
  "metinlerini kabul etmiş olursun.": { en: "." },
  "← SW Create’a dön": { en: "← Return to SW Create" },
  "Dil": { en: "Language" },
  "Dil seçimi": { en: "Language selection" },
  "SW IDENTITY / ACCESS LAYER": { en: "SW IDENTITY / ACCESS LAYER", de: "SW IDENTITY / ACCESS LAYER", es: "SW IDENTITY / ACCESS LAYER", fr: "SW IDENTITY / ACCESS LAYER", ru: "SW IDENTITY / ACCESS LAYER", ar: "SW IDENTITY / ACCESS LAYER", ja: "SW IDENTITY / ACCESS LAYER" },
  "SW Identity ile devam et": { en: "Continue with SW Identity", de: "Mit SW Identity fortfahren", es: "Continuar con SW Identity", fr: "Continuer avec SW Identity", ru: "Продолжить с SW Identity", ar: "المتابعة باستخدام SW Identity", ja: "SW Identityで続行" },
  "Google ile devam et": { en: "Continue with Google", de: "Mit Google fortfahren", es: "Continuar con Google", fr: "Continuer avec Google", ru: "Продолжить с Google", ar: "المتابعة باستخدام Google", ja: "Googleで続行" },
  "Kick ile devam et": { en: "Continue with Kick", de: "Mit Kick fortfahren", es: "Continuar con Kick", fr: "Continuer avec Kick", ru: "Продолжить с Kick", ar: "المتابعة باستخدام Kick", ja: "Kickで続行" },
  "YASAL": { en: "LEGAL", de: "RECHTLICH", es: "LEGAL", fr: "MENTIONS LÉGALES", ru: "ПРАВОВАЯ ИНФОРМАЦИЯ", ar: "قانوني", ja: "法的情報" },
  "GİZLİLİK": { en: "PRIVACY", de: "DATENSCHUTZ", es: "POLÍTICA DE", fr: "POLITIQUE DE", ru: "ПОЛИТИКА", ar: "سياسة", ja: "プライバシー" },
  "POLİTİKASI.": { en: "POLICY.", de: "RICHTLINIE.", es: "PRIVACIDAD.", fr: "CONFIDENTIALITÉ.", ru: "КОНФИДЕНЦИАЛЬНОСТИ.", ar: "الخصوصية.", ja: "ポリシー。" },
  "KULLANIM": { en: "TERMS", de: "NUTZUNGS", es: "TÉRMINOS", fr: "CONDITIONS", ru: "УСЛОВИЯ", ar: "شروط", ja: "利用" },
  "KOŞULLARI.": { en: "OF USE.", de: "BEDINGUNGEN.", es: "DE USO.", fr: "D’UTILISATION.", ru: "ИСПОЛЬЗОВАНИЯ.", ar: "الاستخدام.", ja: "規約。" },
  "Gizlilik Politikası — SW Create": { en: "Privacy Policy — SW Create", de: "Datenschutzrichtlinie — SW Create", es: "Política de privacidad — SW Create", fr: "Politique de confidentialité — SW Create", ru: "Политика конфиденциальности — SW Create", ar: "سياسة الخصوصية — SW Create", ja: "プライバシーポリシー — SW Create" },
  "Kullanım Koşulları — SW Create": { en: "Terms of Use — SW Create", de: "Nutzungsbedingungen — SW Create", es: "Términos de uso — SW Create", fr: "Conditions d’utilisation — SW Create", ru: "Условия использования — SW Create", ar: "شروط الاستخدام — SW Create", ja: "利用規約 — SW Create" },
  "SW Create — Kullanıcı Ana Sayfası": { en: "SW Create — Member Home", de: "SW Create — Mitgliederstartseite", es: "SW Create — Inicio de miembro", fr: "SW Create — Accueil membre", ru: "SW Create — Главная участника", ar: "SW Create — الصفحة الرئيسية للعضو", ja: "SW Create — メンバーホーム" },
  "SW Create — Üye Merkezi": { en: "SW Create — Member Center", de: "SW Create — Mitgliederzentrale", es: "SW Create — Centro de miembros", fr: "SW Create — Espace membre", ru: "SW Create — Центр участника", ar: "SW Create — مركز الأعضاء", ja: "SW Create — メンバーセンター" },
  "SW Create — Dashboard": { en: "SW Create — Dashboard", de: "SW Create — Übersicht", es: "SW Create — Panel", fr: "SW Create — Tableau de bord", ru: "SW Create — Панель управления", ar: "SW Create — لوحة التحكم", ja: "SW Create — ダッシュボード" },
  "Planlar — SW Create": { en: "Plans — SW Create", de: "Tarife — SW Create", es: "Planes — SW Create", fr: "Offres — SW Create", ru: "Тарифы — SW Create", ar: "الخطط — SW Create", ja: "プラン — SW Create" },
  "Son güncelleme: 14 Ağustos 2026": { en: "Last updated: August 14, 2026" },
  "Topladığımız bilgiler": { en: "Information we collect" },
  "SW Create hesabı oluşturduğunda e-posta adresin, görünen adın, güvenli biçimde özetlenmiş parolan ve ürün erişim kayıtların saklanır. Ham parola saklanmaz.": { en: "When you create an SW Create account, we store your email address, display name, securely hashed password, and product-access records. We never store your raw password." },
  "Kullanım amacı": { en: "How we use your information" },
  "Bu bilgiler kimliğini doğrulamak, ürün erişimlerini tek hesapta yönetmek, güvenliği sağlamak ve açık rızanla hizmet bildirimleri göndermek için kullanılır.": { en: "We use this information to verify your identity, manage product access through one account, keep the service secure, and send service notifications with your consent." },
  "Paylaşım ve satış": { en: "Sharing and sale of data" },
  "Kişisel verileri satmayız. Hizmetin çalışması için zorunlu altyapı sağlayıcıları dışında üçüncü taraflara aktarım yapılmaz.": { en: "We do not sell personal data. We share data only with infrastructure providers that are necessary to operate the service." },
  "Saklama ve silme": { en: "Retention and deletion" },
  "Hesabın açık olduğu sürece gerekli kayıtlar tutulur. Hesap silme veya veri talebi için": { en: "We retain required records while your account remains active. For account deletion or a data request, contact" },
  "adresine ulaşabilirsin.": { en: "for assistance." },
  "Güvenlik": { en: "Security" },
  "Oturumlar güvenli çerezlerle, parolalar tuzlu güçlü özetlerle korunur. Şüpheli istekler hız sınırına tabi tutulur.": { en: "Sessions are protected with secure cookies, and passwords with strong salted hashes. Suspicious requests are rate-limited." },
  "Hizmet kapsamı": { en: "Scope of service" },
  "SW Create, ürün kataloğu, merkezî hesap ve ürün erişimi sağlar. Beta veya erken erişim özellikleri değişebilir.": { en: "SW Create provides a product catalog, a central account, and product access. Beta and early-access features may change." },
  "Hesap güvenliği": { en: "Account security" },
  "Hesabının ve giriş bilgilerinin güvenliğinden sen sorumlusun. Yetkisiz kullanım şüphesi halinde bizimle iletişime geçmelisin.": { en: "You are responsible for keeping your account and sign-in details secure. Contact us if you suspect unauthorized use." },
  "Kabul edilebilir kullanım": { en: "Acceptable use" },
  "Hizmeti hukuka aykırı, zararlı, istismar amaçlı veya altyapıyı aksatacak biçimde kullanamazsın.": { en: "You may not use the service unlawfully, harmfully, abusively, or in a way that disrupts its infrastructure." },
  "Üyelikler": { en: "Memberships" },
  "Free, Product Pro ve SW Create Edition planları gösterilebilir. Ödeme sistemi etkinleştirilene kadar ücretli plan düğmeleri yalnızca erken erişim listesine kayıt sağlar.": { en: "Free, Product Pro, and SW Create Edition plans may be displayed. Until payments are enabled, paid-plan buttons only register interest for early access." },
  "İletişim": { en: "Contact" },
  "Koşullarla ilgili sorular için": { en: "For questions about these terms, contact" },
};

const reviewedAccountByLanguage = {
  de: {
    "SW Hesabı — SW Create": "SW-Konto — SW Create", "STÜDYOYA DÖN": "ZURÜCK ZUM STUDIO", "SW Create kimlik alanı": "SW Create Identitätsbereich", "TEK KİMLİK.": "EINE IDENTITÄT.", "BÜTÜN ÜRÜNLER.": "FÜR ALLE PRODUKTE.", "Tek hesap": "Ein Konto", "Güvenli veri akışı": "Sicherer Datenfluss", "Ürünler arası erişim": "Produktübergreifender Zugriff", "— BAĞIMSIZ HESAP": "— UNABHÄNGIGES KONTO", "TEKRAR": "WILLKOMMEN", "HOŞ GELDİN.": "ZURÜCK.", "Var olan SW hesabınla merkezine gir.": "Melde dich mit deinem bestehenden SW-Konto in deiner Zentrale an.", "Hesap işlemi": "Kontoaktion", "Giriş yap": "Anmelden", "Hesap oluştur": "Konto erstellen", "ŞİRKET SİTESİ": "UNTERNEHMENSWEBSEITE", "E-POSTA YA DA KULLANICI ADI": "E-MAIL ODER BENUTZERNAME", "ŞİFRE": "PASSWORT", "Şifreyi göster": "Passwort anzeigen", "SW bot ve hız koruması etkin": "SW-Bot- und Ratenschutz aktiv", "GİRİŞ YAP": "ANMELDEN", "YA DA SAĞLAYICIYLA DEVAM ET": "ODER MIT EINEM ANBIETER FORTFAHREN", "Hesap sağlayıcısı": "Kontoanbieter", "Beni hatırla": "Angemeldet bleiben", "Bu cihazda 20 gün açık kal": "Auf diesem Gerät 20 Tage angemeldet bleiben", "Şifremi unuttum": "Passwort vergessen", "Devam ederek": "Wenn du fortfährst, akzeptierst du die", "Koşullar": "Nutzungsbedingungen", "ve": "und", "Gizlilik Politikası": "Datenschutzrichtlinie", "metinlerini kabul etmiş olursun.": ".", "← SW Create’a dön": "← Zurück zu SW Create", "Dil": "Sprache", "Dil seçimi": "Sprachauswahl",
  },
  es: {
    "SW Hesabı — SW Create": "Cuenta SW — SW Create", "STÜDYOYA DÖN": "VOLVER AL ESTUDIO", "SW Create kimlik alanı": "Área de identidad de SW Create", "TEK KİMLİK.": "UNA IDENTIDAD.", "BÜTÜN ÜRÜNLER.": "EN TODOS LOS PRODUCTOS.", "Tek hesap": "Una cuenta", "Güvenli veri akışı": "Flujo de datos seguro", "Ürünler arası erişim": "Acceso entre productos", "— BAĞIMSIZ HESAP": "— CUENTA INDEPENDIENTE", "TEKRAR": "TE DAMOS LA", "HOŞ GELDİN.": "BIENVENIDA.", "Var olan SW hesabınla merkezine gir.": "Entra en tu centro con tu cuenta SW actual.", "Hesap işlemi": "Acción de cuenta", "Giriş yap": "Iniciar sesión", "Hesap oluştur": "Crear cuenta", "ŞİRKET SİTESİ": "SITIO DE LA EMPRESA", "E-POSTA YA DA KULLANICI ADI": "CORREO O NOMBRE DE USUARIO", "ŞİFRE": "CONTRASEÑA", "Şifreyi göster": "Mostrar contraseña", "SW bot ve hız koruması etkin": "Protección contra bots y límites activa", "GİRİŞ YAP": "INICIAR SESIÓN", "YA DA SAĞLAYICIYLA DEVAM ET": "O CONTINUAR CON UN PROVEEDOR", "Hesap sağlayıcısı": "Proveedor de cuenta", "Beni hatırla": "Recordarme", "Bu cihazda 20 gün açık kal": "Mantener la sesión durante 20 días en este dispositivo", "Şifremi unuttum": "Olvidé mi contraseña", "Devam ederek": "Al continuar, aceptas los", "Koşullar": "Términos de uso", "ve": "y la", "Gizlilik Politikası": "Política de privacidad", "metinlerini kabul etmiş olursun.": ".", "← SW Create’a dön": "← Volver a SW Create", "Dil": "Idioma", "Dil seçimi": "Selección de idioma",
  },
  fr: {
    "SW Hesabı — SW Create": "Compte SW — SW Create", "STÜDYOYA DÖN": "RETOUR AU STUDIO", "SW Create kimlik alanı": "Espace d’identité SW Create", "TEK KİMLİK.": "UNE IDENTITÉ.", "BÜTÜN ÜRÜNLER.": "POUR TOUS LES PRODUITS.", "Tek hesap": "Un compte", "Güvenli veri akışı": "Flux de données sécurisé", "Ürünler arası erişim": "Accès entre les produits", "— BAĞIMSIZ HESAP": "— COMPTE INDÉPENDANT", "TEKRAR": "BON", "HOŞ GELDİN.": "RETOUR.", "Var olan SW hesabınla merkezine gir.": "Connectez-vous à votre espace avec votre compte SW existant.", "Hesap işlemi": "Action du compte", "Giriş yap": "Se connecter", "Hesap oluştur": "Créer un compte", "ŞİRKET SİTESİ": "SITE DE L’ENTREPRISE", "E-POSTA YA DA KULLANICI ADI": "E-MAIL OU NOM D’UTILISATEUR", "ŞİFRE": "MOT DE PASSE", "Şifreyi göster": "Afficher le mot de passe", "SW bot ve hız koruması etkin": "Protection SW contre les robots et les abus active", "GİRİŞ YAP": "SE CONNECTER", "YA DA SAĞLAYICIYLA DEVAM ET": "OU CONTINUER AVEC UN FOURNISSEUR", "Hesap sağlayıcısı": "Fournisseur de compte", "Beni hatırla": "Se souvenir de moi", "Bu cihazda 20 gün açık kal": "Rester connecté 20 jours sur cet appareil", "Şifremi unuttum": "Mot de passe oublié", "Devam ederek": "En continuant, vous acceptez les", "Koşullar": "Conditions d’utilisation", "ve": "et la", "Gizlilik Politikası": "Politique de confidentialité", "metinlerini kabul etmiş olursun.": ".", "← SW Create’a dön": "← Retour à SW Create", "Dil": "Langue", "Dil seçimi": "Choix de la langue",
  },
  ru: {
    "SW Hesabı — SW Create": "Аккаунт SW — SW Create", "STÜDYOYA DÖN": "ВЕРНУТЬСЯ В СТУДИЮ", "SW Create kimlik alanı": "Раздел идентификации SW Create", "TEK KİMLİK.": "ОДНА УЧЁТНАЯ ЗАПИСЬ.", "BÜTÜN ÜRÜNLER.": "ДЛЯ ВСЕХ ПРОДУКТОВ.", "Tek hesap": "Один аккаунт", "Güvenli veri akışı": "Защищённый поток данных", "Ürünler arası erişim": "Доступ ко всем продуктам", "— BAĞIMSIZ HESAP": "— НЕЗАВИСИМЫЙ АККАУНТ", "TEKRAR": "СНОВА", "HOŞ GELDİN.": "ДОБРО ПОЖАЛОВАТЬ.", "Var olan SW hesabınla merkezine gir.": "Войдите в центр с существующим аккаунтом SW.", "Hesap işlemi": "Действие с аккаунтом", "Giriş yap": "Войти", "Hesap oluştur": "Создать аккаунт", "ŞİRKET SİTESİ": "САЙТ КОМПАНИИ", "E-POSTA YA DA KULLANICI ADI": "ПОЧТА ИЛИ ИМЯ ПОЛЬЗОВАТЕЛЯ", "ŞİFRE": "ПАРОЛЬ", "Şifreyi göster": "Показать пароль", "SW bot ve hız koruması etkin": "Защита SW от ботов и частых запросов активна", "GİRİŞ YAP": "ВОЙТИ", "YA DA SAĞLAYICIYLA DEVAM ET": "ИЛИ ПРОДОЛЖИТЬ ЧЕРЕЗ СЕРВИС", "Hesap sağlayıcısı": "Сервис учётной записи", "Beni hatırla": "Запомнить меня", "Bu cihazda 20 gün açık kal": "Оставаться в системе 20 дней на этом устройстве", "Şifremi unuttum": "Забыли пароль?", "Devam ederek": "Продолжая, вы принимаете", "Koşullar": "Условия использования", "ve": "и", "Gizlilik Politikası": "Политику конфиденциальности", "metinlerini kabul etmiş olursun.": ".", "← SW Create’a dön": "← Вернуться в SW Create", "Dil": "Язык", "Dil seçimi": "Выбор языка",
  },
  ar: {
    "SW Hesabı — SW Create": "حساب SW — SW Create", "STÜDYOYA DÖN": "العودة إلى الاستوديو", "SW Create kimlik alanı": "مساحة هوية SW Create", "TEK KİMLİK.": "هوية واحدة.", "BÜTÜN ÜRÜNLER.": "لكل المنتجات.", "Tek hesap": "حساب واحد", "Güvenli veri akışı": "تدفق بيانات آمن", "Ürünler arası erişim": "وصول عبر المنتجات", "— BAĞIMSIZ HESAP": "— حساب مستقل", "TEKRAR": "مرحباً", "HOŞ GELDİN.": "بعودتك.", "Var olan SW hesabınla merkezine gir.": "ادخل إلى مركزك باستخدام حساب SW الحالي.", "Hesap işlemi": "إجراء الحساب", "Giriş yap": "تسجيل الدخول", "Hesap oluştur": "إنشاء حساب", "ŞİRKET SİTESİ": "موقع الشركة", "E-POSTA YA DA KULLANICI ADI": "البريد الإلكتروني أو اسم المستخدم", "ŞİFRE": "كلمة المرور", "Şifreyi göster": "إظهار كلمة المرور", "SW bot ve hız koruması etkin": "حماية SW من الروبوتات وكثرة الطلبات مفعلة", "GİRİŞ YAP": "تسجيل الدخول", "YA DA SAĞLAYICIYLA DEVAM ET": "أو المتابعة باستخدام مزود", "Hesap sağlayıcısı": "مزود الحساب", "Beni hatırla": "تذكرني", "Bu cihazda 20 gün açık kal": "البقاء مسجلاً لمدة 20 يوماً على هذا الجهاز", "Şifremi unuttum": "نسيت كلمة المرور", "Devam ederek": "بالمتابعة، فإنك توافق على", "Koşullar": "شروط الاستخدام", "ve": "و", "Gizlilik Politikası": "سياسة الخصوصية", "metinlerini kabul etmiş olursun.": ".", "← SW Create’a dön": "← العودة إلى SW Create", "Dil": "اللغة", "Dil seçimi": "اختيار اللغة",
  },
  ja: {
    "SW Hesabı — SW Create": "SWアカウント — SW Create", "STÜDYOYA DÖN": "スタジオに戻る", "SW Create kimlik alanı": "SW Create IDエリア", "TEK KİMLİK.": "ひとつのID。", "BÜTÜN ÜRÜNLER.": "すべての製品へ。", "Tek hesap": "ひとつのアカウント", "Güvenli veri akışı": "安全なデータフロー", "Ürünler arası erişim": "製品をまたぐアクセス", "— BAĞIMSIZ HESAP": "— 独立アカウント", "TEKRAR": "おかえり", "HOŞ GELDİN.": "なさい。", "Var olan SW hesabınla merkezine gir.": "既存のSWアカウントでセンターにログインしてください。", "Hesap işlemi": "アカウント操作", "Giriş yap": "ログイン", "Hesap oluştur": "アカウント作成", "ŞİRKET SİTESİ": "企業サイト", "E-POSTA YA DA KULLANICI ADI": "メールアドレスまたはユーザー名", "ŞİFRE": "パスワード", "Şifreyi göster": "パスワードを表示", "SW bot ve hız koruması etkin": "SWのボット・過剰アクセス対策は有効です", "GİRİŞ YAP": "ログイン", "YA DA SAĞLAYICIYLA DEVAM ET": "または外部サービスで続行", "Hesap sağlayıcısı": "アカウントプロバイダー", "Beni hatırla": "ログイン状態を保存", "Bu cihazda 20 gün açık kal": "このデバイスで20日間ログイン状態を保つ", "Şifremi unuttum": "パスワードを忘れた場合", "Devam ederek": "続行すると、", "Koşullar": "利用規約", "ve": "および", "Gizlilik Politikası": "プライバシーポリシー", "metinlerini kabul etmiş olursun.": "に同意したものとみなされます。", "← SW Create’a dön": "← SW Createに戻る", "Dil": "言語", "Dil seçimi": "言語を選択",
  },
};

for (const [language, translations] of Object.entries(reviewedAccountByLanguage)) {
  for (const [source, value] of Object.entries(translations)) {
    reviewed[source] = { ...(reviewed[source] || {}), [language]: value };
  }
}

async function runTranslator(requests) {
  const work = await mkdtemp(join(tmpdir(), "swcreate-portal-i18n-"));
  const input = join(work, "input.json");
  const output = join(work, "output.json");
  await writeFile(input, JSON.stringify({ sourceLanguage: "tr", requests }), "utf8");
  const python = process.env.I18N_PYTHON;
  if (!python) throw new Error("I18N_PYTHON tanımlanmalıdır.");
  try {
    await new Promise((resolvePromise, rejectPromise) => {
      const child = spawn(python, [join(familyRoot, "scripts", "local-i18n-translator.py"), "--input", input, "--output", output], {
        cwd: familyRoot,
        env: process.env,
        stdio: ["ignore", "inherit", "inherit"],
      });
      child.once("error", rejectPromise);
      child.once("exit", code => code === 0 ? resolvePromise() : rejectPromise(new Error(`Çeviri motoru ${code} koduyla durdu.`)));
    });
    return JSON.parse(await readFile(output, "utf8")).translations;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

async function main() {
  const sources = new Set();
  for (const file of sourceFiles) {
    const source = await readFile(join(root, file), "utf8");
    if (file.endsWith(".html")) extractHtml(source, sources);
    else extractTypeScript(source, sources, file);
  }
  Object.keys(reviewed).forEach(source => sources.add(source));
  const orderedSources = [...sources].sort((left, right) => left.localeCompare(right, "tr"));

  const existing = Object.fromEntries(await Promise.all(languages.map(async language => {
    try {
      const payload = JSON.parse(await readFile(join(familyRoot, "locales", `${language}.json`), "utf8"));
      let portal = {};
      try { portal = JSON.parse(await readFile(join(root, "public", "locales", `portal-${language}.json`), "utf8")).translations || {}; } catch {}
      return [language, { ...(payload.translations || {}), ...portal }];
    } catch { return [language, {}]; }
  })));
  const catalogs = Object.fromEntries(languages.map(language => [language, new Map()]));
  for (const language of languages) {
    for (const source of orderedSources) {
      const value = reviewed[source]?.[language] || existing[language]?.[source];
      if (translationValid(source, value, language)) catalogs[language].set(source, clean(value));
      else if (passthrough(source)) catalogs[language].set(source, source);
    }
  }

  const requests = {};
  for (const language of languages) {
    requests[language] = orderedSources.filter(source => !catalogs[language].has(source));
    console.log(`${language}: ${catalogs[language].size} hazır, ${requests[language].length} üretilecek.`);
  }
  const generated = await runTranslator(requests);
  for (const language of languages) {
    requests[language].forEach((source, index) => {
      const value = clean(generated[language]?.[index]);
      if (translationValid(source, value, language)) catalogs[language].set(source, value);
    });
  }

  await mkdir(join(root, "public", "locales"), { recursive: true });
  for (const language of languages) {
    const translations = Object.fromEntries([...catalogs[language]].sort(([left], [right]) => left.localeCompare(right, "tr")));
    await writeFile(join(root, "public", "locales", `portal-${language}.json`), `${JSON.stringify({ version: "2026-09-15.1", sourceLanguage: "tr", language, translations })}\n`, "utf8");
    console.log(`${language}: ${Object.keys(translations).length}/${orderedSources.length} yazıldı.`);
  }
}

await main();
