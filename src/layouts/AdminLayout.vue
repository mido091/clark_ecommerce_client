<template>
  <div
    class="min-h-screen flex bg-background transition-colors overflow-x-hidden text-textPrimary"
  >
    <!-- Sidebar -->
    <aside
      @mouseenter="isSidebarHovered = true"
      @mouseleave="isSidebarHovered = false"
      :class="[
        'fixed inset-y-0 start-0 z-50 bg-surface border-e border-borderThin flex flex-col transition-all duration-300 ease-in-out shadow-sm',
        sidebarOpen
          ? 'translate-x-0 w-64'
          : 'ltr:-translate-x-full rtl:translate-x-full lg:!translate-x-0',
        isSidebarHovered ? 'lg:w-64 shadow-2xl' : 'lg:w-20',
      ]"
    >
      <!-- Logo -->
      <div
        class="flex items-center gap-4 px-6 py-6 border-b border-borderThin shrink-0 h-[80px]"
      >
        <div
          class="w-8 h-8 rounded-xl bg-primary-100/80 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center shrink-0 border border-primary-300/40 dark:border-primary-700/30"
        >
          <LayoutDashboard class="w-5 h-5" />
        </div>
        <span
          class="brand-display font-semibold text-textPrimary text-2xl tracking-[0.12em] uppercase transition-opacity duration-300 whitespace-nowrap"
          :class="
            isSidebarHovered || sidebarOpen ? 'opacity-100' : 'lg:opacity-0'
          "
        >
          {{ dashboardLabel }}
        </span>
        <!-- Close button (mobile) -->
        <button
          @click="sidebarOpen = false"
          class="ms-auto lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-background text-textSecondary hover:text-textPrimary transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <nav class="px-3 py-6 overflow-y-auto subtle-scrollbar space-y-1">
        <!-- Public links group -->
        <template v-for="link in publicLinks" :key="link.to">
          <RouterLink
            :to="link.to"
            @click="sidebarOpen = false"
            class="flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-bold text-textSecondary hover:bg-primary-50/70 dark:hover:bg-primary-900/10 hover:text-primary-700 dark:hover:text-primary-300 transition-all duration-300 relative group"
            active-class="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm"
            exact-active-class="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm"
            :title="link.label"
          >
            <component
              :is="link.icon"
              class="w-5 h-5 shrink-0 transition-all duration-300"
            />
            <span
              class="transition-opacity duration-300 whitespace-nowrap"
              :class="
                isSidebarHovered || sidebarOpen ? 'opacity-100' : 'lg:opacity-0'
              "
            >
              {{ link.label }}
            </span>
          </RouterLink>
        </template>

        <!-- Owner-only links group -->
        <div
          v-if="auth.isOwner"
          class="mt-6 pt-6 border-t border-borderThin space-y-1"
        >
          <p
            class="px-3 mb-3 text-[10px] font-extrabold uppercase tracking-widest text-textSecondary/60 transition-opacity duration-300"
            :class="
              isSidebarHovered || sidebarOpen ? 'opacity-100' : 'lg:opacity-0'
            "
          >
            {{ $t("admin.roleBadge.owner") }}
          </p>
          <RouterLink
            v-for="link in ownerLinks"
            :key="link.to"
            :to="link.to"
            @click="sidebarOpen = false"
            class="flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-bold text-primary-700/80 dark:text-primary-300/80 hover:bg-primary-50 dark:hover:bg-primary-900/12 hover:text-primary-700 dark:hover:text-primary-300 transition-all duration-300 relative group"
            active-class="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm"
            exact-active-class="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm"
            :title="link.label"
          >
            <component
              :is="link.icon"
              class="w-5 h-5 shrink-0 transition-all duration-300"
            />
            <span
              class="transition-opacity duration-300 whitespace-nowrap"
              :class="
                isSidebarHovered || sidebarOpen ? 'opacity-100' : 'lg:opacity-0'
              "
            >
              {{ link.label }}
            </span>
          </RouterLink>
        </div>
      </nav>

      <!-- Bottom controls -->
      <div
        class="mt-auto p-4 border-t border-borderThin bg-surface space-y-1 shrink-0"
      >
        <!-- Dark mode toggle -->
        <button
          @click="ui.toggleDark()"
          class="flex items-center gap-4 px-3 py-3 text-sm font-bold text-textSecondary hover:bg-background hover:text-textPrimary rounded-xl transition-colors w-full"
          :title="ui.darkMode ? $t('common.lightMode') : $t('common.darkMode')"
        >
          <Sun v-if="ui.darkMode" class="w-5 h-5 shrink-0" />
          <Moon v-else class="w-5 h-5 shrink-0" />
          <span
            class="transition-opacity duration-300 whitespace-nowrap"
            :class="
              isSidebarHovered || sidebarOpen
                ? 'opacity-100'
                : 'lg:opacity-0 hidden lg:block'
            "
          >
            {{ ui.darkMode ? $t("common.lightMode") : $t("common.darkMode") }}
          </span>
        </button>

        <!-- Lang toggle -->
        <button
          @click="toggleLocale"
          class="flex items-center gap-4 px-3 py-3 text-sm font-bold text-textSecondary hover:bg-background hover:text-textPrimary rounded-xl transition-colors w-full"
          title="Language"
        >
          <Globe class="w-5 h-5 shrink-0" />
          <span
            class="transition-opacity duration-300 whitespace-nowrap"
            :class="
              isSidebarHovered || sidebarOpen
                ? 'opacity-100'
                : 'lg:opacity-0 hidden lg:block'
            "
          >
            {{ ui.locale === "en" ? "العربية" : "English" }}
          </span>
        </button>

        <!-- Back to store -->
        <RouterLink
          to="/"
          class="flex items-center gap-4 px-3 py-3 text-sm font-bold text-textSecondary hover:bg-background hover:text-textPrimary rounded-xl transition-colors w-full"
          :title="$t('nav.home')"
        >
          <ArrowLeft class="w-5 h-5 shrink-0 rtl:rotate-180" />
          <span
            class="transition-opacity duration-300 whitespace-nowrap"
            :class="
              isSidebarHovered || sidebarOpen
                ? 'opacity-100'
                : 'lg:opacity-0 hidden lg:block'
            "
          >
            {{ $t("nav.home") }}
          </span>
        </RouterLink>

        <!-- Logout -->
        <button
          @click="handleLogout"
          class="flex items-center gap-4 px-3 py-3 text-sm font-bold text-red-500/80 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 rounded-xl transition-colors w-full"
          :title="$t('nav.logout')"
        >
          <LogOut class="w-5 h-5 shrink-0" />
          <span
            class="transition-opacity duration-300 whitespace-nowrap"
            :class="
              isSidebarHovered || sidebarOpen
                ? 'opacity-100'
                : 'lg:opacity-0 hidden lg:block'
            "
          >
            {{ $t("nav.logout") }}
          </span>
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-[45] bg-[#1f1611]/65 lg:hidden backdrop-blur-sm"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Main content area -->
    <div
      class="flex-1 w-full flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out"
      :class="isSidebarHovered ? 'lg:ms-64' : 'lg:ms-20'"
    >
      <!-- Top bar -->
      <header
        class="sticky top-0 z-10 bg-background/85 backdrop-blur-md border-b border-borderThin px-4 sm:px-8 py-4 flex items-center gap-4 h-[80px]"
      >
        <!-- Hamburger (mobile) -->
        <button
          @click="sidebarOpen = true"
          class="lg:hidden p-2 rounded-xl bg-background text-textSecondary hover:text-textPrimary shadow-sm"
        >
          <Menu class="w-5 h-5" />
        </button>
        <h1
          class="brand-display text-2xl sm:text-3xl font-semibold text-textPrimary capitalize tracking-[0.04em]"
        >
          {{ pageTitle }}
        </h1>
        <div class="ms-auto flex items-center gap-4">
          <!-- Role badge -->
          <span
            :class="[
              'badge text-[10px] uppercase font-extrabold tracking-widest px-3 py-1.5 shadow-sm',
              auth.user?.role === 'owner'
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-300/50 dark:border-primary-700/30'
                : auth.user?.role === 'admin'
                  ? 'bg-[#eadcc2] text-[#75522a] dark:bg-[#4a3828] dark:text-[#e8cca0] border border-primary-300/40 dark:border-[#8d6a40]/30'
                  : 'bg-[#ede3d3] text-[#755d44] dark:bg-[#433326] dark:text-[#d4b897] border border-borderThin',
            ]"
          >
            {{ roleLabel }}
          </span>
          <span
            class="text-sm font-bold text-textSecondary bg-background px-4 py-2 rounded-full hidden sm:block shadow-sm border border-borderThin"
          >
            {{ auth.user?.name || auth.user?.email }}
          </span>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4 sm:p-8">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  LayoutDashboard,
  Package,
  Tag,
  Ticket,
  ShoppingBag,
  CreditCard,
  Truck,
  Settings,
  Lock,
  Sun,
  Moon,
  Globe,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Users,
  MessageSquare,
  Inbox,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth.js";
import { useUiStore } from "@/stores/ui.js";
import { useCartStore } from "@/stores/cart.js";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();
const cart = useCartStore();

const sidebarOpen = ref(false);
const isSidebarHovered = ref(false);

onMounted(() => {
  if (auth.user) {
    auth.refreshSession();
  }
});

const allNavLinks = computed(() => [
  { to: "/admin", icon: LayoutDashboard, label: t("admin.dashboard") },
  { to: "/admin/products", icon: Package, label: t("admin.products") },
  { to: "/admin/categories", icon: Tag, label: t("admin.categories") },
  { to: "/admin/coupons", icon: Ticket, label: t("admin.coupons.title") || "Coupons" },
  { to: "/admin/orders", icon: ShoppingBag, label: t("admin.orders") },
  // { to: "/admin/payments", icon: CreditCard, label: t("admin.payments") },
  { to: "/admin/shipping", icon: Truck, label: t("settings.sectionShipping") },
  {
    to: "/admin/reviews",
    icon: MessageSquare,
    label: t("admin.reviewManagement"),
  },
  {
    to: "/admin/messages",
    icon: Inbox,
    label: t("admin.messages") || "Messages",
  },
  {
    to: "/admin/settings",
    icon: Settings,
    label: t("admin.settings"),
    ownerOnly: true,
  },
  {
    to: "/admin/users",
    icon: Users,
    label: t("admin.users.title"),
    ownerOnly: true,
  },
]);

const publicLinks = computed(() =>
  allNavLinks.value.filter((l) => !l.ownerOnly),
);
const ownerLinks = computed(() => allNavLinks.value.filter((l) => l.ownerOnly));
const visibleNavLinks = computed(() =>
  allNavLinks.value.filter((link) => !link.ownerOnly || auth.isOwner),
);

const navLinks = allNavLinks;

const roleLabel = computed(() => {
  const role = auth.user?.role || "admin";
  return t(`admin.roleBadge.${role}`);
});

const dashboardLabel = computed(() =>
  auth.user?.role === "owner" ? "Owner" : "Admin",
);

const pageTitle = computed(() => {
  const found = navLinks.value.find((l) => l.to === route.path);
  return found ? found.label : "";
});

function toggleLocale() {
  ui.setLocale(ui.locale === "en" ? "ar" : "en");
}

function handleLogout() {
  auth.logout();
  cart.clearCart();
  router.push({ name: "login" });
}
</script>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
