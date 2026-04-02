/**
 * @file coupon.js (Pinia Store)
 * @description Coupon management and validation state.
 *
 * This store serves two different roles:
 *  1. Admin context (`fetchAllCoupons`, `createCoupon`, etc.): Used by the admin dashboard for CRUD operations.
 *  2. Customer context (`validateCoupon`, `activeCoupon`): Used during the Checkout process 
 *     to validate a user's typed coupon code and calculate the discount in real-time.
 */

import { defineStore } from "pinia";
import api from "@/axios.js";

export const useCouponStore = defineStore("coupons", {
  state: () => ({
    /** @type {Array<Object>} Admin: List of all coupons in the system */
    coupons: [],
    
    /** @type {boolean} Network activity indicator for the admin table */
    loading: false,
    
    /** 
     * @type {Object|null} 
     * Customer: Holds the successfully validated coupon during the active checkout session.
     * Includes the calculated `discount_amount` specific to their current cart subtotal.
     */
    activeCoupon: null,
  }),

  actions: {
    // ── Admin Actions ────────────────────────────────────────────────────────

    /** Fetches all coupons for the admin dashboard panel */
    async fetchAllCoupons() {
      this.loading = true;
      try {
        const { data } = await api.get("/coupons");
        this.coupons = data.data;
      } catch (error) {
        console.error("Failed to fetch coupons:", error);
      } finally {
        this.loading = false;
      }
    },

    /** Creates a new coupon and refreshes the list */
    async createCoupon(payload) {
      const { data } = await api.post("/coupons", payload);
      await this.fetchAllCoupons();
      return data;
    },

    /** Updates an existing coupon (partial fields allowed) and refreshes the list */
    async updateCoupon(id, payload) {
      const { data } = await api.patch(`/coupons/${id}`, payload);
      await this.fetchAllCoupons();
      return data;
    },

    /** Deletes an existing coupon and refreshes the list */
    async deleteCoupon(id) {
      const { data } = await api.delete(`/coupons/${id}`);
      await this.fetchAllCoupons();
      return data;
    },

    // ── Customer Actions ─────────────────────────────────────────────────────

    /**
     * Called by the user in the Checkout page when applying a promo code.
     * Hits the /validate endpoint to verify rules (min amount, expiry date, uses limit).
     * If successful, saves the coupon and its calculated discount amount to `activeCoupon`.
     * 
     * @param {string} code - The coupon code string (e.g. "SAVE10")
     * @param {number} subtotal - The cart's current total price
     * @returns {Promise<Object>} The API response indicating success
     * @throws Will throw if the coupon is invalid/expired/not applicable
     */
    async validateCoupon(code, subtotal) {
      try {
        const { data } = await api.post("/coupons/validate", { code, subtotal });
        this.activeCoupon = data.data; // Store the validated coupon and discount value
        return data;
      } catch (error) {
        this.activeCoupon = null; // Clear any existing coupon if the new one fails
        throw error;
      }
    },

    /** 
     * Clears the currently applied coupon. 
     * Called when a user explicitly removes a code from their checkout, or when the order completes.
     */
    clearActiveCoupon() {
      this.activeCoupon = null;
    }
  }
});
