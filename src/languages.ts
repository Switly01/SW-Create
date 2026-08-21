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

export function savedSwLanguage(): SwLanguage {
  const saved = window.localStorage.getItem("sw-language");
  return SW_LANGUAGES.some(([code]) => code === saved) ? saved as SwLanguage : "tr";
}
