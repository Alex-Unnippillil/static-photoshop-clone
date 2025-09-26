import { initEditor } from "./editor.js";
import { applyTranslations, availableLocales, getLocale, onLocaleChange, setLocale, t, } from "./i18n/index.js";
async function bootstrap() {
    const supported = new Set(availableLocales());
    let preferred = "en";
    if (typeof navigator !== "undefined" && navigator.language) {
        const candidate = navigator.language.slice(0, 2).toLowerCase();
        if (supported.has(candidate)) {
            preferred = candidate;
        }
    }
    if (preferred !== getLocale()) {
        await setLocale(preferred);
    }
    document.documentElement.lang = getLocale();
    document.title = t("app.title");
    applyTranslations();
    const handle = initEditor();
    handle.refreshLocalization();
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
        languageSelect.value = getLocale();
        languageSelect.addEventListener("change", async () => {
            const value = languageSelect.value;
            if (!supported.has(value))
                return;
            await setLocale(value);
        });
    }
    onLocaleChange(() => {
        const locale = getLocale();
        document.documentElement.lang = locale;
        document.title = t("app.title");
        applyTranslations();
        handle.refreshLocalization();
        if (languageSelect) {
            languageSelect.value = locale;
        }
    });
    window.addEventListener("beforeunload", () => handle.destroy());
}
void bootstrap();
