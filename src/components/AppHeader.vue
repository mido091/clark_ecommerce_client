<template>
  <header
    :class="[
      'fixed top-0 left-0 right-0 w-full transition-all duration-300 z-[999]',
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-borderThin shadow-sm',
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
    ]"
  >
    <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20 gap-4">
        <!-- ── Left: Logo & Nav ─────────────────────────────────────────── -->
        <div class="flex items-center gap-8 shrink-0">
          <RouterLink
            to="/"
            class="flex items-center gap-2 font-extrabold text-xl shrink-0 transition-transform duration-300 hover:scale-105"
          >
            <img
              v-if="settings.logoUrl"
              :src="settings.logoUrl"
              :alt="settings.siteName || 'ShopWave'"
              class="h-8 w-auto min-w-[32px] object-contain dark:invert"
              width="120"
              height="32"
            />
            <ShoppingBag v-else class="w-7 h-7 text-primary-500" />
            <span
              class="hidden lg:inline font-bold text-2xl tracking-tight text-textPrimary h-8 flex items-center"
              >{{ settings.siteName || "ShopWave" }}</span
            >
          </RouterLink>

          <!-- Desktop Navigation -->
          <nav class="hidden xl:flex items-center gap-6">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="group relative py-2 text-sm font-semibold text-textSecondary hover:text-primary-600 dark:hover:text-primary-400 transition-colors uppercase tracking-widest"
              active-class="text-primary-600 dark:text-primary-400 font-extrabold"
            >
              {{ link.label }}
              <span
                class="absolute left-0 bottom-0 w-0 h-[2px] bg-primary-500 transition-all duration-300 group-hover:w-full"
                :class="{ 'w-full': route.path === link.to }"
              ></span>
            </RouterLink>
          </nav>
        </div>

        <!-- ── Center: Search Bar (Desktop) ────────────────────────────── -->
        <div class="hidden md:flex flex-1 max-w-md mx-4">
          <form @submit.prevent="performSearch" class="relative w-full group">
            <div class="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
              <Search class="w-4 h-4 text-textSecondary group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              v-model="headerSearchQuery"
              type="text"
              :placeholder="$t('products.searchPlaceholder') || 'Search products...'"
              class="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/50 focus:bg-white dark:focus:bg-slate-800 py-2.5 ps-11 pe-4 rounded-2xl text-sm font-medium transition-all outline-none"
            />
          </form>
        </div>

        <!-- ── Right: Controls ───────────────────────────────── -->
        <div class="flex items-center justify-end gap-1 sm:gap-2">
          <!-- Mobile Search Toggle -->
          <button
            @click="showMobileSearch = !showMobileSearch"
            class="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl text-textSecondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            :aria-label="$t('common.search')"
          >
            <Search class="w-5 h-5" />
          </button>
          <!-- Language toggle -->
          <button
            @click="toggleLocale"
            class="hidden sm:flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-textSecondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-textPrimary transition-colors"
            :title="$t('common.language')"
          >
            {{ ui.locale === "en" ? "عربي" : "ENG" }}
          </button>

          <!-- Dark/Light mode -->
          <button
            @click="ui.toggleDark()"
            class="hidden sm:flex items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl text-textSecondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-primary-500 transition-colors"
            :aria-label="ui.darkMode ? $t('common.lightMode') : $t('common.darkMode')"
            :title="ui.darkMode ? $t('common.lightMode') : $t('common.darkMode')"
          >
            <Sun v-if="ui.darkMode" class="w-5 h-5" />
            <Moon v-else class="w-5 h-5" />
          </button>

          <!-- Wishlist icon -->
          <RouterLink
            to="/wishlist"
            class="relative flex items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl text-textSecondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-pink-500 transition-colors"
            :aria-label="$t('nav.wishlist')"
          >
            <Heart class="w-5 h-5" />
            <span
              v-if="wishlist.count > 0"
              class="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-pink-500 text-white text-[10px] font-bold px-1 animate-bounce-in shadow-sm"
            >
              {{ wishlist.count }}
            </span>
          </RouterLink>

          <!-- Cart icon -->
          <RouterLink
            to="/cart"
            class="relative flex items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl text-textSecondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-primary-500 transition-colors"
            :aria-label="$t('nav.cart')"
          >
            <ShoppingCart class="w-5 h-5" />
            <span
              v-if="cart.itemCount > 0"
              class="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold px-1 animate-bounce-in shadow-sm"
            >
              {{ cart.itemCount }}
            </span>
          </RouterLink>

          <!-- (User Dropdown) ────────────────── -->
          <div
            v-if="auth.isLoggedIn"
            class="relative hidden md:block"
            ref="dropdownRef"
          >
            <button
              @click="dropdownOpen = !dropdownOpen"
              class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition-all duration-200 group border-borderThin hover:bg-black/5 dark:hover:bg-white/10"
              :aria-expanded="dropdownOpen"
            >
              <!-- Avatar -->
              <span
                class="w-8 h-8 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400 flex-shrink-0"
              >
                <img
                  v-if="auth.user?.image"
                  :src="auth.user.image"
                  :alt="auth.user?.name"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ headerInitials }}</span>
              </span>
              <!-- Name -->
              <span
                class="text-sm font-semibold max-w-[100px] truncate hidden lg:block text-textPrimary"
              >
                {{ auth.user?.name }}
              </span>
              <ChevronDown
                class="w-4 h-4 transition-transform duration-300 text-textSecondary group-hover:text-textPrimary"
                :class="[dropdownOpen ? 'rotate-180' : '']"
              />
            </button>

            <!-- Dropdown panel -->
            <Transition name="dropdown">
              <div
                v-if="dropdownOpen"
                class="absolute end-0 mt-3 w-64 bg-background rounded-2xl shadow-dark-soft border border-borderThin overflow-hidden py-2 z-50"
              >
                <!-- User info header -->
                <div class="px-5 py-4 border-b border-borderThin">
                  <p class="text-sm font-bold text-textPrimary truncate">
                    {{ auth.user?.name }}
                  </p>
                  <p class="text-xs text-textSecondary truncate mt-1">
                    {{ auth.user?.email }}
                  </p>
                  <!-- Role badge -->
                  <span :class="['badge mt-2', roleBadgeClass]">
                    {{ $t(`admin.roleBadge.${auth.user?.role || "user"}`) }}
                  </span>
                </div>

                <!-- Menu items -->
                <div class="py-2 px-2">
                  <RouterLink
                    to="/profile"
                    @click="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-textSecondary hover:bg-primary-50 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <UserCircle class="w-4 h-4" />
                    {{ $t("nav.profile") }}
                  </RouterLink>

                  <RouterLink
                    to="/orders"
                    @click="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-textSecondary hover:bg-primary-50 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Package class="w-4 h-4" />
                    {{ $t("nav.orders") }}
                  </RouterLink>

                  <!-- Admin-only -->
                  <RouterLink
                    v-if="auth.isAdmin"
                    to="/admin"
                    @click="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <LayoutDashboard class="w-4 h-4" />
                    {{ $t("nav.dashboard") }}
                  </RouterLink>
                </div>

                <div class="border-t border-borderThin px-2 py-2">
                  <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut class="w-4 h-4" />
                    {{ $t("nav.logout") }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Login button (guest) -->
          <RouterLink
            v-else
            to="/login"
            class="hidden sm:flex items-center justify-center px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wide text-white bg-primary-500 hover:bg-primary-600 transition-all shadow-sm hover:-translate-y-0.5"
          >
            {{ $t("nav.login") }}
          </RouterLink>

          <!-- Mobile menu button -->
          <button
            @click="mobileOpen = !mobileOpen"
            class="md:hidden flex items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl text-textSecondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            :aria-label="mobileOpen ? 'Close Menu' : 'Open Menu'"
          >
            <Menu v-if="!mobileOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
      </div>
    </div>
  </div>

  <!-- ── Mobile Search Bar (Expandable) ────────────────────────── -->
    <Transition name="search-slide">
      <div 
        v-if="showMobileSearch" 
        class="md:hidden bg-background border-t border-borderThin p-3 animate-in slide-in-from-top duration-300"
      >
        <form @submit.prevent="performSearch" class="relative group">
          <Search class="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary font-bold" />
          <input
            v-model="headerSearchQuery"
            type="text"
            ref="mobileSearchInput"
            :placeholder="$t('products.searchPlaceholder') || 'Search products...'"
            class="w-full bg-slate-100 dark:bg-slate-800/80 py-3 ps-11 pe-4 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </form>
      </div>
    </Transition>

    <!-- ── Mobile drawer ─────────────────────────────────────── -->
    <Transition name="mobile-menu">
      <div
        v-if="mobileOpen"
        class="md:hidden border-t border-borderThin bg-background/95 backdrop-blur-xl absolute top-full left-0 right-0 shadow-lg"
      >
        <!-- Logged-in user info strip -->
        <div
          v-if="auth.isLoggedIn"
          class="flex items-center gap-3 px-6 py-4 bg-surface border-b border-borderThin"
        >
          <span
            class="w-10 h-10 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400 flex-shrink-0"
          >
            <img
              v-if="auth.user?.image"
              :src="auth.user.image"
              :alt="auth.user?.name"
              class="w-full h-full object-cover"
            />
            <span v-else>{{ headerInitials }}</span>
          </span>
          <div class="min-w-0">
            <p class="text-sm font-bold text-textPrimary truncate">
              {{ auth.user?.name }}
            </p>
            <span :class="['badge mt-1 text-[10px]', roleBadgeClass]">{{
              $t(`admin.roleBadge.${auth.user?.role || "user"}`)
            }}</span>
          </div>
        </div>

        <div class="px-4 py-4 space-y-2">
          <div
            class="sm:hidden flex items-center gap-2 justify-between mb-4 pb-4 border-b border-borderThin"
          >
            <!-- Language toggle for mobile -->
            <button
              @click="toggleLocale"
              class="flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-textSecondary bg-surface hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
            >
              {{ ui.locale === "en" ? "عربي" : "ENG" }}
            </button>

            <!-- Dark Mode for mobile -->
            <button
              @click="ui.toggleDark()"
              class="flex-1 flex items-center justify-center py-2.5 text-textSecondary bg-surface rounded-xl hover:bg-primary-50 dark:hover:bg-white/5 transition-colors font-semibold text-sm"
            >
              <Sun v-if="ui.darkMode" class="w-4 h-4 mr-2" />
              <Moon v-else class="w-4 h-4 mr-2" />
              {{ ui.darkMode ? $t("common.lightMode") : $t("common.darkMode") }}
            </button>
          </div>

          <!-- Public links -->
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            @click="mobileOpen = false"
            class="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-textSecondary hover:bg-surface hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {{ link.label }}
          </RouterLink>

          <template v-if="auth.isLoggedIn">
            <div class="border-t border-borderThin my-2 pt-2" />

            <RouterLink
              to="/profile"
              @click="mobileOpen = false"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-textSecondary hover:bg-surface hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <UserCircle class="w-5 h-5" />
              {{ $t("nav.profile") }}
            </RouterLink>

            <RouterLink
              to="/orders"
              @click="mobileOpen = false"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-textSecondary hover:bg-surface hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Package class="w-5 h-5" />
              {{ $t("nav.orders") }}
            </RouterLink>

            <!-- Dashboard — admin/owner only -->
            <RouterLink
              v-if="auth.isAdmin"
              to="/admin"
              @click="mobileOpen = false"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 transition-colors"
            >
              <LayoutDashboard class="w-5 h-5" />
              {{ $t("nav.dashboard") }}
            </RouterLink>

            <button
              @click="handleLogout"
              class="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-base font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut class="w-5 h-5" />
              {{ $t("nav.logout") }}
            </button>
          </template>

          <template v-else>
            <div
              class="border-t border-borderThin my-4 pt-4 flex flex-col gap-3"
            >
              <RouterLink
                to="/login"
                @click="mobileOpen = false"
                class="btn-primary w-full shadow-md"
              >
                {{ $t("nav.login") }}
              </RouterLink>
              <RouterLink
                to="/register"
                @click="mobileOpen = false"
                class="btn-secondary w-full"
              >
                {{ $t("nav.register") }}
              </RouterLink>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ShoppingBag,
  ShoppingCart,
  Sun,
  Moon,
  LogOut,
  Package,
  Menu,
  X,
  LayoutDashboard,
  UserCircle,
  ChevronDown,
  Heart,
  Search,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth.js";
import { useCartStore } from "@/stores/cart.js";
import { useUiStore } from "@/stores/ui.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useWishlistStore } from "@/stores/wishlist.js";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const cart = useCartStore();
const ui = useUiStore();
const settings = useSettingsStore();
const wishlist = useWishlistStore();
const showToast = inject("showToast");

const mobileOpen = ref(false);
const showMobileSearch = ref(false);
const headerSearchQuery = ref("");
const mobileSearchInput = ref(null);
const dropdownOpen = ref(false);
const dropdownRef = ref(null);

// ── Floating Header Logic ─────────────────────────────────────
const isScrolled = ref(false);
const isVisible = ref(true);
let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;

function onClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    dropdownOpen.value = false;
  }
}

function handleScroll() {
  if (typeof window === "undefined") return;
  const currentScrollY = window.scrollY;

  // Toggle glassmorphism background
  isScrolled.value = currentScrollY > 10;

  // Hide on scroll down, show on scroll up
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    isVisible.value = false;
    // Close dropdowns when scrolling away
    dropdownOpen.value = false;
    mobileOpen.value = false;
  } else {
    isVisible.value = true;
  }

  lastScrollY = currentScrollY;
}

onMounted(() => {
  document.addEventListener("mousedown", onClickOutside);
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onClickOutside);
  window.removeEventListener("scroll", handleScroll);
});

// ── Computed ──────────────────────────────────────────────────
const headerInitials = computed(() => {
  const name = auth.user?.name || "";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
});

const roleBadgeClass = computed(() => {
  const role = auth.user?.role;
  if (role === "owner")
    return "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300";
  if (role === "admin")
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
  return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
});

const navLinks = computed(() => [
  { to: "/", label: t("nav.home") || "Home" },
  { to: "/products", label: t("nav.products") || "Products" },
  { to: "/contact", label: t("common.contactUs") || "Contact Us" },
]);

// ── Actions ───────────────────────────────────────────────────
function toggleLocale() {
  ui.setLocale(ui.locale === "en" ? "ar" : "en");
}

function handleLogout() {
  auth.logout();
  cart.clearCart();
  mobileOpen.value = false;
  dropdownOpen.value = false;
  router.push({ name: "home" });
  showToast?.(t("auth.logoutSuccess"), "info");
}

function performSearch() {
  if (!headerSearchQuery.value.trim()) return;
  router.push({
    path: "/products",
    query: { name: headerSearchQuery.value.trim() },
  });
  showMobileSearch.value = false;
  mobileOpen.value = false;
}

watch(showMobileSearch, async (val) => {
  if (val) {
    await nextTick();
    mobileSearchInput.value?.focus();
  }
});
</script>

<style scoped>
.dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-leave-active {
  transition: all 0.15s ease-in;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.mobile-menu-enter-active {
  transition: all 0.25s ease-out;
}
.mobile-menu-leave-active {
  transition: all 0.2s ease-in;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
