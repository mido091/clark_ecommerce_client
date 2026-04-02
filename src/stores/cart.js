/**
 * @file cart.js (Pinia Store)
 * @description Local persistent shopping cart manager.
 *
 * This store manages the user's shopping cart ENTIRELY client-side until they hit "Checkout".
 * 
 * Flow:
 *  - User adds items to cart → State updates + saves to browser `localStorage`
 *  - Cart persists seamlessly across page refreshes and browser sessions
 *  - When user places an order, the frontend sends the local cart array to the `/orders` API
 *  - Upon successful order creation, `clearCart()` wipes the local storage
 *
 * Cart Key logic:
 *  To prevent identical products with different configurations (e.g., a Red Shirt vs a Blue Shirt)
 *  from merging into the same cart item, we use a unique `cart_key` combining the Product ID and Variant ID.
 */

import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  // ── State ────────────────────────────────────────────────────────────────────
  state: () => ({
    /** 
     * @type {Array<Object>} 
     * Initialized directly from localStorage. Fallback to empty array if missing or invalid.
     */
    items: JSON.parse(localStorage.getItem("cart") || "[]"),
  }),

  // ── Getters ──────────────────────────────────────────────────────────────────
  getters: {
    /** 
     * Total number of items in the cart (sum of all quantities).
     * Used for the Cart badge counter in the Navbar.
     */
    itemCount: (state) =>
      state.items.reduce((sum, item) => sum + item.quantity, 0),

    /** 
     * Total financial cost of the cart (Price × Quantity).
     */
    total: (state) =>
      state.items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0,
      ),
  },

  // ── Actions ──────────────────────────────────────────────────────────────────
  actions: {
    /**
     * Adds a product to the cart. If the exact same variation already exists,
     * it merely increments the quantity (up to the maximum available stock).
     *
     * @param {object} product - Product/Variant details object
     * @param {number} [qty=1] - Number of units to add
     */
    addItem(product, qty = 1) {
      // Create a unique identifier for this specific product + variant combination
      const cartKey = `${product.id}:${product.variant_id || "base"}`;
      
      const existing = this.items.find((item) => item.cart_key === cartKey);
      
      if (existing) {
        // Increment quantity, but never exceed available stock
        existing.quantity = Math.min(existing.quantity + qty, product.stock);
      } else {
        // Add as a completely new item in the cart array
        this.items.push({
          id: product.id,
          cart_key: cartKey,
          variant_id: product.variant_id || null,
          selected_size: product.selected_size || null,
          selected_color_name: product.selected_color_name || null,
          selected_color_value: product.selected_color_value || null,
          selected_image: product.selected_image || "",
          name: product.name,
          name_ar: product.name_ar,
          price: product.price,
          main_image:
            product.main_image || product.images?.[0]?.image_url || "",
          quantity: qty,
          stock: product.stock,
        });
      }
      this._persist(); // Save changes to localStorage immediately
    },

    /**
     * Updates the exact quantity of an existing cart item (triggered by Number inputs in the Cart UI).
     * If quantity drops to 0 or below, the item is removed entirely.
     *
     * @param {string} cartKey - The unique product+variant identifier
     * @param {number} quantity - The new desired quantity
     */
    updateQty(cartKey, quantity) {
      const item = this.items.find((entry) => entry.cart_key === cartKey);
      if (!item) return;
      
      if (quantity <= 0) {
        this.removeItem(cartKey);
      } else {
        // Update quantity, ensuring it doesn't exceed stock limit
        item.quantity = Math.min(quantity, item.stock);
        this._persist();
      }
    },

    /**
     * Completely removes an item row from the cart.
     * @param {string} cartKey
     */
    removeItem(cartKey) {
      this.items = this.items.filter((item) => item.cart_key !== cartKey);
      this._persist();
    },

    /**
     * Wipes the entire cart clean. 
     * Automatically called by the Checkout page after an order is successfully sent to the server.
     */
    clearCart() {
      this.items = [];
      this._persist();
    },

    /**
     * Internal helper to sync the Pinia state stringified array to localStorage.
     * @private
     */
    _persist() {
      localStorage.setItem("cart", JSON.stringify(this.items));
    },
  },
});
