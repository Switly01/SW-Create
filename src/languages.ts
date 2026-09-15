export const SW_LANGUAGES = [
  ["tr", "/flags/tr.svg", "Türkçe"],
  ["en", "/flags/en.svg", "English"],
  ["de", "/flags/de.svg", "Deutsch"],
  ["es", "/flags/es.svg", "Español"],
  ["fr", "/flags/fr.svg", "Français"],
  ["ru", "/flags/ru.svg", "Русский"],
  ["ar", "/flags/ar.svg", "العربية"],
  ["ja", "/flags/ja.svg", "日本語"],
] as const;

export type SwLanguage = typeof SW_LANGUAGES[number][0];

const SW_LOCALE_TAGS: Record<SwLanguage, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  es: "es-ES",
  fr: "fr-FR",
  ru: "ru-RU",
  ar: "ar",
  ja: "ja-JP",
};

export function swLocaleTag(language: SwLanguage) {
  return SW_LOCALE_TAGS[language];
}

export function savedSwLanguage(): SwLanguage {
  const saved = window.localStorage.getItem("sw-language");
  return SW_LANGUAGES.some(([code]) => code === saved) ? saved as SwLanguage : "tr";
}
