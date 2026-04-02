/**
 * @file useConversion.js (Composable)
 * @description Marketing Campaign Conversion Tracker wrapper.
 * 
 * Provides a standardized bridge to fire marketing events to external platforms
 * like Google Analytics or Google Ads (via `gtag.js`).
 * Built to automatically synchronize with the app's Pinia configured currency system.
 */
import { useSettingsStore } from "@/stores/settings.js";
import { normalizeCurrencyCode } from "@/composables/useCurrency.js";

export function useConversion() {
  const settingsStore = useSettingsStore();

  /**
   * Dispatches a highly specific "purchase" telemetry packet to Google Analytics/Ads.
   * This is generally called exactly once when the `/checkout` component successfully completes its API flow.
   * 
   * It maps backend data parameters (e.g. `order.id`, `order.total_price`, `item.price`)
   * strictly into the officially required schema shape expected by Google (`transaction_id`, `value`, `items`).
   * 
   * @param {Object} order - The full response data object received from the backend `/orders` creation API
   */
  function trackPurchase(order) {
    // Fail semi-silently if `gtag` hasn't been instantiated on the global window.
    // This typically occurs if no GA/Ads tracking IDs were filled out by the admin in Settings.
    if (typeof window.gtag !== "function") return;

    window.gtag("event", "purchase", {
      transaction_id: order.id || order.order_id,
      value: parseFloat(order.total_price),
      currency: normalizeCurrencyCode(settingsStore.currencyCode),
      items: (order.items || []).map((item) => ({
        item_id: item.product_id,
        item_name: item.name,
        // The price per unit (Google expects unit-price, calculates extensions automatically)
        price: parseFloat(item.price), 
        quantity: item.quantity,
      })),
    });
  }

  return { trackPurchase };
}
