import i18n from "i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

i18n.init({
  debug: false,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  },
  resources: {
    en: { translation: en },
    ru: { translation: ru }
  }
});

export default i18n;
