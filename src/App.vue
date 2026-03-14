<template>
  <!-- Root element — dir and lang are controlled by the UI store on <html> -->
  <div
    class="min-h-screen flex flex-col transition-colors duration-500 relative overflow-hidden"
  >
    <!-- Skip admin pages from showing the public layout -->
    <template v-if="!isAdminRoute">
      <AppHeader />
      <main class="flex-1 mt-20">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </Transition>
        </RouterView>
      </main>
      <AppFooter />
    </template>

    <!-- Admin routes use their own layout component -->
    <template v-else>
      <RouterView />
    </template>

    <!-- Global UI Manager (Modals & Toasts) -->
    <GlobalUIManager />
  </div>
</template>

<script setup>
import { computed, provide, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { defineAsyncComponent } from "vue";
import AppHeader from "@/components/AppHeader.vue";
const AppFooter = defineAsyncComponent(() => import("@/components/AppFooter.vue"));
const GlobalUIManager = defineAsyncComponent(() => import("@/components/GlobalUIManager.vue"));
import { useSettingsStore } from "@/stores/settings.js";
import { useScriptInjector } from "@/composables/useScriptInjector.js";
import { useUI } from "@/composables/useUI.js";
import { useWishlistStore } from "@/stores/wishlist.js";

const route = useRoute();
const settingsStore = useSettingsStore();
const wishlistStore = useWishlistStore();
const { injectScripts } = useScriptInjector();
const ui = useUI();

// Determine if we are on an admin route (admin has its own layout)
const isAdminRoute = computed(() => route.path.startsWith("/admin"));

// ── Global toast system ────────────────────────────────────
// Provide the advanced showToast function to all legacy child components
provide("showToast", ui.showToast);

// ── Settings: fetch on app mount + inject scripts ──────────
onMounted(async () => {
  await settingsStore.fetchSettings();
  wishlistStore.fetchWishlistIds();

  // Defer non-critical scripts (tracking/ads) to improve Total Blocking Time
  const deferScripts = () => {
    injectScripts(
      settingsStore.headerScripts,
      settingsStore.footerScripts,
      settingsStore.settings?.google_analytics_id,
      settingsStore.settings?.google_ads_client_id,
    );
  };

  if (window.requestIdleCallback) {
    window.requestIdleCallback(deferScripts);
  } else {
    setTimeout(deferScripts, 3000);
  }
});

// ── Reactive document.title ────────────────────────────────
// Updates the browser tab title whenever site_name changes
watch(
  () => settingsStore.siteName,
  (name) => {
    if (name) document.title = name;
  },
  { immediate: true },
);

// ── Reactive Favicon ───────────────────────────────────────
watch(
  () => settingsStore.faviconUrl,
  (url) => {
    if (!url) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  },
  { immediate: true },
);
</script>

<style scoped>
/* Page transition */
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
