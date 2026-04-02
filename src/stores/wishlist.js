/**
 * @file wishlist.js (Pinia Store)
 * @description Manages the authenticated user's wishlist functionality.
 *
 * The wishlist system uses a hybrid fetching approach:
 *  - `fetchWishlistIds`: A lightweight call that fetches ONLY an array of Product IDs.
 *    Used to instantly populate the "Heart Icon" active state across all product cards site-wide.
 *  - `fetchWishlist`: A heavy call that fetches fully hydrated product objects (images, prices, categories).
 *    Only called when the user actually navigates to the dedicated `/wishlist` page.
 */

import { defineStore } from "pinia";
import api from "@/axios.js";
import { useAuthStore } from "./auth.js";

export const useWishlistStore = defineStore("wishlist", {
  state: () => ({
    /** @type {Array<Object>} Fully hydrated product objects (for the explicit Wishlist page) */
    items: [],
    
    /** @type {Array<number>} An array of Product IDs. Used across the site to highlight the heart icon */
    wishlistIds: [],
    
    loading: false,
    error: null,
  }),

  // ── Getters ──────────────────────────────────────────────────────────────────
  getters: {
    /**
     * Checks if a specific product ID exists in the user's wishlist.
     * Returns a function to allow parameterized queries from Vue templates:
     * `wishlistStore.isInWishlist(product.id)`
     */
    isInWishlist: (state) => (productId) => {
      // Must convert to numbers for safe strict equality comparison
      return state.wishlistIds.includes(Number(productId));
    },
    
    /** Total number of items in the wishlist (for badges) */
    count: (state) => state.items.length,
  },

  // ── Actions ──────────────────────────────────────────────────────────────────
  actions: {
    /**
     * HEAVY: Fetches full product data for every item in the wishlist.
     * Generally only called when the user visits the /wishlist route.
     */
    async fetchWishlist() {
      const auth = useAuthStore();
      if (!auth.isLoggedIn) return;

      this.loading = true;
      try {
        const { data } = await api.get("/wishlist");
        this.items = data.data;
        // Sync the lightweight ID tracker array automatically
        this.wishlistIds = this.items.map((item) => item.id);
      } catch (err) {
        this.error = err.response?.data?.message || "Failed to fetch wishlist";
      } finally {
        this.loading = false;
      }
    },

    /**
     * LIGHTWEIGHT: Fetches only the product IDs that the user has saved.
     * This is called early in the app lifecycle so product cards know whether 
     * to render an empty heart or a filled red heart.
     */
    async fetchWishlistIds() {
      const auth = useAuthStore();
      if (!auth.isLoggedIn) return;

      try {
        const { data } = await api.get("/wishlist/ids");
        this.wishlistIds = data.ids.map(Number);
      } catch (err) {
        console.error("Failed to fetch wishlist IDs", err);
      }
    },

    /**
     * Toggles a product in or out of the wishlist via the API.
     * 
     * Optimistic-like UI pattern behavior:
     *  - If it exists, it sends DELETE to the server, and immediately removes the ID from `wishlistIds`.
     *  - If it doesn't exist, it sends POST to the server, and immediately pushes the ID to `wishlistIds`.
     * 
     * @param {Object} product - Product context object (must contain an `.id` property)
     * @returns {boolean} True if the item was ADDED as a result, False if it was REMOVED.
     * @throws {Error} Throws "unauthenticated" if a guest user clicks the heart icon
     */
    async toggleWishlist(product) {
      const auth = useAuthStore();
      // Wishlist requires authentication. Vue components will catch this error 
      // and redirect the guest user to the Login page.
      if (!auth.isLoggedIn) {
        throw new Error("unauthenticated");
      }

      const productId = Number(product.id);
      const exists = this.isInWishlist(productId);

      try {
        if (exists) {
          // REMOVE FLOW
          await api.delete(`/wishlist/${productId}`);
          // Instantly untoggle the heart icon in the UI
          this.wishlistIds = this.wishlistIds.filter((id) => id !== productId);
          this.items = this.items.filter((item) => item.id !== productId);
        } else {
          // ADD FLOW
          await api.post("/wishlist", { product_id: productId });
          // Instantly toggle the heart icon to "filled/red" state in the UI
          this.wishlistIds.push(productId);
          
          // Note: We don't push the full product object to `items` here because
          // we might just be on a category page and don't have all the required
          // joined DB details. The next visit to /wishlist will call fetchWishlist() anyway.
        }
        return !exists; // Returns boolean indicating new state (added vs removed)
      } catch (err) {
        console.error("Wishlist toggle error", err);
        throw err;
      }
    },

    /** 
     * Resets local state to empty when the user logs out. 
     */
    clearWishlist() {
      this.items = [];
      this.wishlistIds = [];
    },
  },
});
