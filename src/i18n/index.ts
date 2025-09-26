import en, { type MessageKey, type Messages } from "../locales/en.js";

export type Locale = "en" | "es";
export type TranslationParams = Record<string, string | number>;

type CatalogMap = Partial<Record<Locale, Messages>>;

const catalogs: CatalogMap = { en };
let currentLocale: Locale = "en";
let activeMessages: Messages = en;
const listeners = new Set<() => void>();

const PARAM_PATTERN = /\{(\w+)\}/g;

function format(message: string, params?: TranslationParams): string {
  if (!params) return message;
  return message.replace(PARAM_PATTERN, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key];
      return value != null ? String(value) : "";
    }
    return match;
  });
}

async function loadLocaleMessages(locale: Locale): Promise<Messages> {
  if (!catalogs[locale]) {
    switch (locale) {
      case "es":
        catalogs.es = (await import("../locales/es.js")).default;
        break;
      default:
        catalogs[locale] = en;
        break;
    }
  }
  return catalogs[locale] ?? en;
}

export function availableLocales(): Locale[] {
  return ["en", "es"];
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: MessageKey, params?: TranslationParams): string {
  const template = activeMessages[key] ?? en[key];
  if (!template) {
    return key;
  }
  return format(template, params);
}

export async function setLocale(locale: Locale): Promise<void> {
  if (locale === currentLocale) return;
  activeMessages = await loadLocaleMessages(locale);
  currentLocale = locale;
  listeners.forEach((listener) => listener());
}

export function onLocaleChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function parseParams(value: string | null): TranslationParams | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as TranslationParams;
    return parsed;
  } catch {
    return undefined;
  }
}

export function applyTranslations(root: ParentNode = document): void {
  const elements = new Set<Element>();
  if (root instanceof Element && root.hasAttribute("data-i18n-key")) {
    elements.add(root);
  }
  root.querySelectorAll("[data-i18n-key]").forEach((el) => elements.add(el));

  elements.forEach((element) => {
    const key = element.getAttribute("data-i18n-key") as MessageKey | null;
    if (!key) return;
    const params = parseParams(element.getAttribute("data-i18n-params"));
    const value = t(key, params);
    const attrList = element.getAttribute("data-i18n-attr");
    if (attrList) {
      attrList
        .split(",")
        .map((attr) => attr.trim())
        .filter(Boolean)
        .forEach((attr) => {
          element.setAttribute(attr, value);
        });
    } else {
      element.textContent = value;
    }
  });
}
