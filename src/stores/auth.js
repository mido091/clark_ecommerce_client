/**
 * @file auth.js (Pinia Store)
 * @description Manages user authentication state, caching, and role-based access checks.
 *
 * This store handles:
 *  - Keeping track of the logged-in user object (`state.user`)
 *  - Caching the user in `localStorage` to persist sessions across page reloads
 *  - Providing reactive getters (`isLoggedIn`, `isAdmin`, `isOwner`) used by Router guards and UI components
 *  - Interacting with the `/users` API for login, registration, and logout
 *
 * SECURITY NOTE: The JWT token itself is NOT stored here or anywhere in JavaScript.
 * It is securely stored in an HttpOnly cookie managed by the browser. The user object
 * stored here is public information used purely for UI rendering and Client-Side Routing logic.
 */

import { defineStore } from "pinia";
import api from "@/axios.js";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    /** 
     * @type {object|null} 
     * The logged-in user profile data (id, name, email, role, image)
     * If this is null, the user is considered logged out.
     */
    user: null,
  }),

  // ── Getters (Reactive Computed Properties) ────────────────────────────────────
  getters: {
    /** @returns {boolean} True if a user is logged in */
    isLoggedIn: (state) => !!state.user,

    /** 
     * @returns {boolean} True ONLY if the user has the 'owner' role.
     * The owner is the highest-level admin (super-user).
     */
    isOwner: (state) => state.user?.role === "owner",

    /** 
     * @returns {boolean} True for both 'admin' and 'owner' roles.
     * Use this for general admin dashboard visibility checks.
     */
    isAdmin: (state) =>
      state.user?.role === "admin" || state.user?.role === "owner",
  },

  // ── Actions ──────────────────────────────────────────────────────────────────
  actions: {
    /**
     * Called in `main.js` before the Vue app mounts.
     * Attempts to instantly restore the user profile from localStorage
     * so that the UI can render in an authenticated state immediately without waiting for a network request.
     */
    initFromStorage() {
      const raw = localStorage.getItem("user");
      try {
        if (raw && raw !== "undefined") {
          this.user = JSON.parse(raw);
        }
      } catch {
        // If JSON fails to parse (data corruption), wipe it clean.
        localStorage.removeItem("user");
      }
    },

    /**
     * Silently pings the server to fetch the latest user profile and confirm the HttpOnly cookie is still valid.
     * If the session is invalid, the global Axios interceptor will catch the 401 and log the user out.
     */
    async refreshSession() {
      try {
        const { data } = await api.get("/users/me", {
          skipAuthRedirect: true, // Don't redirect to login if this background refresh fails
        });
        if (data?.user) {
          this._setSession({ user: data.user });
        }
        return data?.user || null;
      } catch {
        // Validation failed, clear the session locally
        this.user = null;
        localStorage.removeItem("user");
        return null;
      }
    },

    /**
     * Logs the user in via the API.
     * The backend will set the HttpOnly cookie in the response headers.
     * 
     * @param {string} email
     * @param {string} password
     */
    async login(email, password) {
      const { data } = await api.post("/users/login", { email, password });
      
      // Update local state if the server returned a user object
      if (data?.user) {
        this._setSession({ user: data.user });
      } else {
        throw new Error("Login failed: Invalid data format from server");
      }
      return data;
    },

    /**
     * Registers a new user.
     * Note: This does NOT log the user in automatically according to backend design.
     * The user must proceed to login after a successful registration.
     */
    async register(formData) {
      const { data } = await api.post("/users/register", formData);
      return data;
    },

    /**
     * Terminates the session.
     * Asks the server to invalidate (clear) the HttpOnly cookie, then wipes the local state.
     */
    async logout() {
      try {
        await api.post("/users/logout");
      } catch (err) {
        console.warn("Server logout failed, clearing local state anyway.", err);
      } finally {
        // Always clear local state even if the server request fails (e.g. network issue)
        this.user = null;
        localStorage.removeItem("user");
      }
    },

    /**
     * Internal helper to atomically update both Pinia state and localStorage.
     * @param {{ user: object }} payload
     * @private
     */
    _setSession({ user }) {
      this.user = user;
      localStorage.setItem("user", JSON.stringify(user));
    },
  },
});
