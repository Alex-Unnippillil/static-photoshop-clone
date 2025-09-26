import en from "../locales/en.js";
const catalogs = { en };
let currentLocale = "en";
let activeMessages = en;
const listeners = new Set();
const PARAM_PATTERN = /\{(\w+)\}/g;
function format(message, params) {
    if (!params)
        return message;
    return message.replace(PARAM_PATTERN, (match, key) => {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            const value = params[key];
            return value != null ? String(value) : "";
        }
        return match;
    });
}
async function loadLocaleMessages(locale) {
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
export function availableLocales() {
    return ["en", "es"];
}
export function getLocale() {
    return currentLocale;
}
export function t(key, params) {
    const template = activeMessages[key] ?? en[key];
    if (!template) {
        return key;
    }
    return format(template, params);
}
export async function setLocale(locale) {
    if (locale === currentLocale)
        return;
    activeMessages = await loadLocaleMessages(locale);
    currentLocale = locale;
    listeners.forEach((listener) => listener());
}
export function onLocaleChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
function parseParams(value) {
    if (!value)
        return undefined;
    try {
        const parsed = JSON.parse(value);
        return parsed;
    }
    catch {
        return undefined;
    }
}
export function applyTranslations(root = document) {
    const elements = new Set();
    if (root instanceof Element && root.hasAttribute("data-i18n-key")) {
        elements.add(root);
    }
    root.querySelectorAll("[data-i18n-key]").forEach((el) => elements.add(el));
    elements.forEach((element) => {
        const key = element.getAttribute("data-i18n-key");
        if (!key)
            return;
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
        }
        else {
            element.textContent = value;
        }
    });
}
