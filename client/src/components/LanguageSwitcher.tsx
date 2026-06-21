import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const toggle = () => {
    const next = i18n.language === "zh-TW" ? "en" : "zh-TW";
    void i18n.changeLanguage(next);
    localStorage.setItem("locale", next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
    >
      {i18n.language === "zh-TW" ? "EN" : "中"}
    </button>
  );
}
