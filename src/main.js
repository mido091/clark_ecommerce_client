/**
 * @file main.js
 * @description Vue 3 application entry point for Clark Market.
 *
 * This file bootstraps the frontend application by:
 *  1. Creating the root Vue instance
 *  2. Registering global plugins: Pinia (state), Router, i18n (translations)
 *  3. Registering global directives (v-animate)
 *  4. Initializing crucial state BEFORE mounting the app to avoid UI flickering:
 *     - uiStore: Dark mode preference and RTL/LTR locale
 *     - authStore: Restoring user session from localStorage
 *  5. Mounting the application to the `#app` DOM element
 */

import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import router from "./router/index.js";
import i18n from "./i18n/index.js";
import "./style.css"; // Tailwind CSS and global styles
import App from "./App.vue";
import { useUiStore } from "./stores/ui.js";
import animateDirective from "./directives/animate.js";
import { useAuthStore } from "./stores/auth.js";

const app = createApp(App);
const pinia = createPinia();

// ── 1. Register Plugins ────────────────────────────────────────────────────────
app.use(pinia);
app.use(router);
app.use(i18n);

// ── 2. Register Global Directives ──────────────────────────────────────────────
// v-animate allows for scroll-triggered reveal animations across the app
app.use("animate", animateDirective);

// ── 3. App Initialization (Pre-Mount) ──────────────────────────────────────────
// Initialize persisted state (dark mode, locale dir/lang) BEFORE mounting
// This prevents the screen from flashing in the wrong theme/direction on load.
const uiStore = useUiStore();
uiStore.initFromStorage();

// Initialize auth from localStorage so the router guards know if the user is authenticated.
const authStore = useAuthStore();
authStore.initFromStorage();

// If a user session was found locally, ping the server to ensure the session/token is still valid.
// This runs asynchronously so it doesn't block the initial render.
if (authStore.user) {
  authStore.refreshSession();
}

// ── 4. Mount Application ───────────────────────────────────────────────────────
app.mount("#app");
