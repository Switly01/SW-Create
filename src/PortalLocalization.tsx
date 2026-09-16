import { useEffect, useState, type ReactNode } from "react";
import { savedSwLanguage, SW_LANGUAGES, type SwLanguage } from "./languages";
import { PORTAL_TRANSLATION_OVERRIDES } from "./portalTranslationOverrides";

type PortalCatalog = {
  language: SwLanguage;
  translations: Record<string, string>;
};

const TRANSLATED_ATTRIBUTES = ["alt", "aria-label", "aria-description", "placeholder", "title"] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function localizedValue(value: string, translations: Record<string, string>) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const source = value.trim();
  if (!source) return value;

  const exact = translations[source];
  if (exact) return `${leading}${exact}${trailing}`;

  for (const [pattern, translation] of Object.entries(translations)) {
    if (!pattern.includes("{0}")) continue;
    const pieces = pattern.split(/(\{\d+\})/g);
    const indexes: number[] = [];
    const expression = pieces.map(piece => {
      const placeholder = piece.match(/^\{(\d+)\}$/);
      if (!placeholder) return escapeRegExp(piece);
      indexes.push(Number(placeholder[1]));
      return "(.+?)";
    }).join("");
    const match = source.match(new RegExp(`^${expression}$`, "u"));
    if (!match) continue;
    let output = translation;
    indexes.forEach((index, position) => { output = output.replaceAll(`{${index}}`, match[position + 1]); });
    return `${leading}${output}${trailing}`;
  }
  return value;
}

function localizeTree(root: Node, translations: Record<string, string>) {
  const translateNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
      const next = localizedValue(node.nodeValue, translations);
      if (next !== node.nodeValue) node.nodeValue = next;
      return;
    }
    if (!(node instanceof Element) || node.matches("script, style")) return;
    TRANSLATED_ATTRIBUTES.forEach(attribute => {
      const current = node.getAttribute(attribute);
      if (!current) return;
      const next = localizedValue(current, translations);
      if (next !== current) node.setAttribute(attribute, next);
    });
  };

  translateNode(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateNode(node);
    node = walker.nextNode();
  }
}

export function PortalLocalization({ children, showControl = true }: { children: ReactNode; showControl?: boolean }) {
  const [language, setLanguage] = useState<SwLanguage>(savedSwLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("sw-language", language);
    if (language === "tr") return;

    let cancelled = false;
    let observer: MutationObserver | undefined;
    fetch(`/locales/portal-${language}.json`)
      .then(response => {
        if (!response.ok) throw new Error(`Dil dosyası yüklenemedi: ${response.status}`);
        return response.json() as Promise<PortalCatalog>;
      })
      .then(catalog => {
        if (cancelled) return;
        const root = document.getElementById("root");
        if (!root) return;
        const translations = { ...catalog.translations, ...PORTAL_TRANSLATION_OVERRIDES[language] };
        document.title = localizedValue(document.title, translations).trim();
        localizeTree(root, translations);
        observer = new MutationObserver(records => {
          observer?.disconnect();
          records.forEach(record => {
            if (record.type === "characterData") localizeTree(record.target, translations);
            if (record.type === "attributes") localizeTree(record.target, translations);
            record.addedNodes.forEach(node => localizeTree(node, translations));
          });
          observer?.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...TRANSLATED_ATTRIBUTES] });
        });
        observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...TRANSLATED_ATTRIBUTES] });
      })
      .catch(error => console.error("SW dil kataloğu yüklenemedi.", error));

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [language]);

  const changeLanguage = (next: SwLanguage) => {
    window.localStorage.setItem("sw-language", next);
    setLanguage(next);
    window.location.reload();
  };

  return <>
    {children}
    {showControl && <label className="portal-language-dock">
      <span>Dil</span>
      <select value={language} onChange={event => changeLanguage(event.target.value as SwLanguage)} aria-label="Dil seçimi">
        {SW_LANGUAGES.map(([code, , label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>}
  </>;
}
