/**
 * @file useCurrency.js (Composable)
 * @description Reusable formatting logic for monetary values.
 *
 * This composable connects the `useSettingsStore` (which knows the admin-defined currency code)
 * with the `useUiStore` (which knows if the user is browsing in English or Arabic).
 * 
 * It automatically outputs the localized symbol and properly rounded values.
 * e.g., An amount of 50 in standard mode yields "EGP 50.00"
 * in Arabic mode yields "ج.م 50.00".
 */

import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings.js";
import { useUiStore } from "@/stores/ui.js";

/**
 * Standardizes the provided currency string.
 * It forcibly corrects legacy/null values and redirects "USD" fallbacks safely to native "EGP".
 * 
 * @param {string} code - The raw currency code from DB
 * @returns {string} Sanitized uppercase 3-letter currency code
 */
export function normalizeCurrencyCode(code) {
  const normalized = String(code || "EGP").trim().toUpperCase();
  if (!normalized || normalized === "USD") {
    return "EGP";
  }
  return normalized;
}

/**
 * Returns the correct local-language label/symbol for the active currency code.
 * Arabic users see "ج.م", English users see "EGP".
 * 
 * @param {string} currencyCode 
 * @param {string} locale - 'ar' or 'en'
 * @returns {string}
 */
export function getCurrencyLabel(currencyCode, locale = "ar") {
  const normalized = normalizeCurrencyCode(currencyCode);
  
  if (normalized === "EGP") {
    // If the locale string starts with "ar", emit Arabic symbol
    return String(locale || "ar").toLowerCase().startsWith("ar")
      ? "\u062C.\u0645" // "ج.م"
      : "EGP";
  }
  
  return normalized;
}

/**
 * Core stateless formatting function. Use this if calculating entirely outside of Vue's reactivity.
 * Parses strings to Floats and applies minimum 2 decimal padding safely.
 * 
 * @param {number|string} amount - the sum
 * @param {Object} options 
 * @returns {string} Combined structured string, e.g. "EGP 99.00"
 */
export function formatCurrencyValue(amount, options = {}) {
  const {
    currencyCode = "EGP",
    locale = "ar",
    minimumFractionDigits = 2,
  } = options;

  // Protect against NaN injection by converting weird types to 0
  const numericValue = Number(amount || 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  
  const label = getCurrencyLabel(currencyCode, locale);

  return `${label} ${safeValue.toFixed(minimumFractionDigits)}`;
}

/**
 * The standard Composable export meant for Vue components `<script setup>`.
 * It automatically binds to the reactive global stores.
 */
export function useCurrency() {
  const settingsStore = useSettingsStore();
  const ui = useUiStore();

  /** @type {import('vue').ComputedRef<string>} Reactively gets current backend preference */
  const currencyCode = computed(() =>
    normalizeCurrencyCode(settingsStore.currencyCode),
  );

  /** @type {import('vue').ComputedRef<string>} Reactively gets active symbol for current language */
  const currencyLabel = computed(() =>
    getCurrencyLabel(currencyCode.value, ui.locale),
  );

  /**
   * The main formatter function for components.
   * Auto-uses current app state unless explicitly overridden via options.
   * 
   * @param {number|string} amount 
   * @param {Object} [options={}] override dictionary
   * @returns {string} Fully localized string
   */
  function formatCurrency(amount, options = {}) {
    return formatCurrencyValue(amount, {
      currencyCode: options.currencyCode || currencyCode.value,
      locale: options.locale || ui.locale,
      minimumFractionDigits: options.minimumFractionDigits ?? 2,
    });
  }

  return {
    currencyCode,
    currencyLabel,
    formatCurrency,
  };
}
