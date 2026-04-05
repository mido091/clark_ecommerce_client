/**
 * @file settings.js (Pinia Store)
 * @description Global Site Settings Manager.
 *
 * Fetches `GET /api/settings` once per application session.
 * Exposes computed accessors for commonly used fields (like logo, currency, scripts)
 * so any Vue component can read them reactively without digging into the raw `data` object.
 *
 * Performance concept (`isLoaded` guard):
 *  By leveraging the `isLoaded` flag, we ensure the network request happens only once,
 *  even if multiple components call `fetchSettings()` simultaneously on mount.
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/axios.js";
import { normalizeCurrencyCode } from "@/composables/useCurrency.js";

export const useSettingsStore = defineStore("settings", () => {
  // ── State ────────────────────────────────────────────────────────────────────
  /** Raw settings object as returned by the API */
  const data = ref({});

  /** Prevents duplicate network calls across hot-reloads or route changes */
  const isLoaded = ref(false);

  /** True while a network fetch or save operation is in-flight */
  const loading = ref(false);

  // ── Computed Accessors (Convenience Getters) ─────────────────────────────────
  // These provide a safe, reactive way to access settings without null-errors.
  // When 'data.value' updates (after fetch), all of these automatically update across the UI.
  
  const siteName = computed(() => data.value.site_name || "ShopWave");
  const logoUrl = computed(() => data.value.logo_url || null);
  const faviconUrl = computed(() => data.value.favicon_url || null);
  
  // Ensures currency code is always valid (e.g. falls back to "EGP" if DB has "USD" or null)
  const currencyCode = computed(() => normalizeCurrencyCode(data.value.currency_code));
  
  const contactEmail = computed(() => data.value.contact_email || "");
  const whatsappNumber = computed(() => data.value.whatsapp_number || "");
  
  const googleAnalyticsId = computed(() => data.value.google_analytics_id || "");
  const googleAdsClientId = computed(() => data.value.google_ads_client_id || "");
  const headerScripts = computed(() => data.value.header_scripts || "");
  const footerScripts = computed(() => data.value.footer_scripts || "");
  
  const socialFacebook = computed(() => data.value.social_facebook || "");
  const socialX = computed(() => data.value.social_x || "");
  const socialTelegram = computed(() => data.value.social_telegram || "");
  const socialGmail = computed(() => data.value.social_gmail || "");
  const socialWhatsapp = computed(() => data.value.social_whatsapp || "");
  
  const shippingGovernorates = computed(() =>
    Array.isArray(data.value.shipping_governorates) ? data.value.shipping_governorates : []
  );

  /** Hero banner image URL — falls back to null so components can use a default */
  const heroImageUrl = computed(() => data.value.hero_image_url || null);

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Fetch site settings from the public endpoint.
   * Safe to call multiple times in the app lifecycle — it becomes a no-op 
   * after the first successful load unless `force` is explicitly passed as true.
   *
   * @param {boolean} [force=false] By-pass the isLoaded check and re-fetch from network
   */
  async function fetchSettings(force = false) {
    if (isLoaded.value && !force) return;
    loading.value = true;
    try {
      const { data: res } = await api.get("/settings");
      data.value = {
        ...(res.data || {}),
        currency_code: normalizeCurrencyCode(res.data?.currency_code),
      };
      isLoaded.value = true;
    } catch (err) {
      console.warn("[settings] Failed to load site settings:", err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Partially update settings on the server (Admin only).
   * Accepts any subset of the settings fields. On success, the API returns the 
   * fully combined row, which is immediately synced back into this store.
   *
   * @param {object} payload  Fields to update 
   * @returns {Promise<object>}  Updated fully-merged settings data
   */
  async function updateSettings(payload) {
    loading.value = true;
    try {
      const { data: res } = await api.put("/settings", payload);
      // Sync full returned row so all computed accessors update immediately in the UI
      data.value = {
        ...(res.data || {}),
        currency_code: normalizeCurrencyCode(res.data?.currency_code),
      };
      return res.data;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    data,
    isLoaded,
    loading,

    // Computed accessors
    siteName,
    logoUrl,
    faviconUrl,
    currencyCode,
    contactEmail,
    whatsappNumber,
    googleAnalyticsId,
    googleAdsClientId,
    headerScripts,
    footerScripts,
    socialFacebook,
    socialX,
    socialTelegram,
    socialGmail,
    socialWhatsapp,
    shippingGovernorates,
    heroImageUrl,

    // Actions
    fetchSettings,
    updateSettings,
  };
});
