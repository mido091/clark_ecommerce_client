/**
 * @file ui.js (Pinia Store)
 * @description UI State Manager for Theme (Dark Mode) and Internationalization (Locale).
 *
 * This store handles user interface preferences and persists them to `localStorage`.
 * It is uniquely initialized directly from `main.js` *before* the application mounts
 * to prevent the UI from flickering (e.g. from Light to Dark) on initial page load.
 *
 * Responsibilities:
 *  - Toggling Dark/Light Theme (applies the `.dark` class to `<html>`)
 *  - Toggling Locale (en/ar)
 *  - Updating HTML attributes organically: `dir="rtl"` vs `dir="ltr"` and `lang="ar"` etc.
 *  - Syncing the Pinia state with Vue-i18n's active locale
 */

import { defineStore } from "pinia";
import i18n from "@/i18n/index.js";

export const useUiStore = defineStore("ui", {
  state: () => ({
    /** @type {boolean} True = dark mode enabled, False = light mode */
    darkMode: false,
    /** @type {'en'|'ar'} The currently active language locale */
    locale: "en",
  }),

  actions: {
    /**
     * Restore persisted settings from localStorage and apply them to the DOM.
     * Called synchronously in main.js.
     */
    initFromStorage() {
      const savedDark = localStorage.getItem("darkMode");
      const savedLocale = localStorage.getItem("locale") || "en";

      this.darkMode = savedDark === "true";
      this.locale = savedLocale;

      // Apply changes to the HTML DOM immediately
      this._applyDark();
      this._applyLocale();
    },

    /**
     * Toggle between dark mode and light mode, update local storage, and manipulate DOM.
     */
    toggleDark() {
      this.darkMode = !this.darkMode;
      localStorage.setItem("darkMode", this.darkMode);
      this._applyDark();
    },

    /**
     * Switch the app language between 'en' and 'ar'.
     * Updates:
     *  1. Pinia State
     *  2. Local Storage
     *  3. Vue-i18n Plugin Global Instance
     *  4. HTML tag `dir` and `lang` attributes (via `_applyLocale`)
     * 
     * @param {'en'|'ar'} locale
     */
    setLocale(locale) {
      this.locale = locale;
      localStorage.setItem("locale", locale);
      
      // Tell the Vue i18n plugin to switch translations
      i18n.global.locale.value = locale;
      
      this._applyLocale();
    },

    /**
     * Internal DOM Helper:
     * Toggles the "dark" CSS class on the root HTML element.
     * Tailwind CSS dynamically shifts styles when this class is present.
     * @private
     */
    _applyDark() {
      if (this.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },

    /**
     * Internal DOM Helper:
     * Adjusts the root HTML element's language and writing direction attributes.
     * This is critical for Right-to-Left (RTL) layout rendering.
     * @private
     */
    _applyLocale() {
      const isArabic = this.locale === "ar";
      document.documentElement.setAttribute("lang", this.locale);
      document.documentElement.setAttribute("dir", isArabic ? "rtl" : "ltr");
    },
  },
});
