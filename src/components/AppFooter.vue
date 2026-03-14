<template>
  <footer
    class="bg-slate-950 text-slate-400 mt-auto border-t border-white/10"
  >
    <div class="section-container py-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <!-- Brand -->
        <div class="md:col-span-2">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-3 font-extrabold text-2xl text-slate-200 mb-4 transition-transform hover:scale-105"
          >
            <!-- Dynamic Logo with Fallback -->
            <template v-if="settingsStore.logoUrl">
              <img 
                :src="settingsStore.logoUrl" 
                :alt="settingsStore.siteName"
                class="h-10 w-auto object-contain"
              />
            </template>
            <template v-else>
              <div class="p-2 bg-primary-500 rounded-xl">
                <ShoppingBag class="w-6 h-6 text-white" />
              </div>
            </template>
            <span class="tracking-tight">{{ settingsStore.siteName || "ShopWave" }}</span>
          </RouterLink>
          <p class="text-sm leading-relaxed max-w-sm mb-6 font-medium">
            {{ $t("footer.tagline") }}
          </p>
          <div class="flex items-center gap-4">
            <!-- Dynamic Social Icons -->
            <a
              v-if="settingsStore.socialFacebook"
              :href="settingsStore.socialFacebook"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 rounded-full flex items-center justify-center bg-background border border-borderThin hover:bg-primary-50 dark:hover:bg-white/5 hover:text-primary-500 transition-colors shadow-sm"
            >
              <Facebook class="w-4 h-4" />
            </a>
            <a
              v-if="settingsStore.socialX"
              :href="settingsStore.socialX"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 rounded-full flex items-center justify-center bg-background border border-borderThin hover:bg-primary-50 dark:hover:bg-white/5 hover:text-primary-500 transition-colors shadow-sm"
            >
              <Twitter class="w-4 h-4" />
            </a>
            <a
              v-if="settingsStore.socialWhatsapp"
              :href="settingsStore.socialWhatsapp"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 rounded-full flex items-center justify-center bg-background border border-borderThin hover:bg-primary-50 dark:hover:bg-white/5 hover:text-primary-500 transition-colors shadow-sm"
            >
              <MessageCircle class="w-4 h-4" />
            </a>
            <a
              v-if="settingsStore.socialTelegram"
              :href="settingsStore.socialTelegram"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 rounded-full flex items-center justify-center bg-background border border-borderThin hover:bg-primary-50 dark:hover:bg-white/5 hover:text-primary-500 transition-colors shadow-sm"
            >
              <Send class="w-4 h-4" />
            </a>
            <a
              v-if="settingsStore.socialGmail"
              :href="'mailto:' + settingsStore.socialGmail"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 rounded-full flex items-center justify-center bg-background border border-borderThin hover:bg-primary-50 dark:hover:bg-white/5 hover:text-primary-500 transition-colors shadow-sm"
            >
              <Mail class="w-4 h-4" />
            </a>
          </div>
        </div>
 
        <!-- Quick links -->
        <div class="col-span-1">
          <h4
            class="text-slate-200 font-bold mb-4 tracking-wide uppercase text-sm"
          >
            {{ $t("footer.quickLinks") }}
          </h4>
          <ul class="space-y-3 font-medium text-sm">
            <li>
              <RouterLink
                to="/products"
                class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <ChevronRight class="w-3 h-3 rtl:rotate-180" />
                {{ $t("nav.products") }}
              </RouterLink>
            </li>
            <li>
              <RouterLink
                to="/cart"
                class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <ChevronRight class="w-3 h-3 rtl:rotate-180" />
                {{ $t("nav.cart") }}
              </RouterLink>
            </li>
            <li>
              <RouterLink
                to="/orders"
                class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <ChevronRight class="w-3 h-3 rtl:rotate-180" />
                {{ $t("nav.orders") }}
              </RouterLink>
            </li>
            <li>
              <RouterLink
                to="/contact"
                class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <ChevronRight class="w-3 h-3 rtl:rotate-180" />
                {{ $t("common.contactUs") }}
              </RouterLink>
            </li>
          </ul>
        </div>
 
        <!-- Account links -->
        <div class="col-span-1">
          <h4
            class="text-slate-200 font-bold mb-4 tracking-wide uppercase text-sm"
          >
            {{ $t("nav.profile") }}
          </h4>
          <ul class="space-y-3 font-medium text-sm">
            <li v-if="!auth.isLoggedIn">
              <RouterLink
                to="/login"
                class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <ChevronRight class="w-3 h-3 rtl:rotate-180" />
                {{ $t("nav.login") }}
              </RouterLink>
            </li>
            <li v-if="!auth.isLoggedIn">
              <RouterLink
                to="/register"
                class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <ChevronRight class="w-3 h-3 rtl:rotate-180" />
                {{ $t("nav.register") }}
              </RouterLink>
            </li>
            <li v-if="auth.isLoggedIn">
              <RouterLink
                to="/profile"
                class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <ChevronRight class="w-3 h-3 rtl:rotate-180" />
                {{ $t("nav.profile") }}
              </RouterLink>
            </li>
            <li v-if="auth.isAdmin || auth.isOwner">
              <RouterLink
                to="/admin"
                class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <ChevronRight class="w-3 h-3 rtl:rotate-180" />
                {{ $t("nav.admin") }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
 
      <div
        class="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 font-medium"
      >
        <p class="text-xs sm:text-sm text-slate-500">
          © {{ currentYear }} {{ settingsStore.siteName || "ShopWave" }}. {{ $t("footer.rights") }}
        </p>
        
        <div class="flex flex-col items-center sm:items-end gap-2">
          <div class="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300">
            <span>{{ ui.locale === 'ar' ? 'تم التطوير بواسطة' : 'Developed by' }}</span>
            <span class="font-bold text-primary-400">Mido</span>
          </div>
          <div class="flex flex-col items-center sm:items-end gap-1 text-[11px] text-slate-500">
            <a href="tel:+201551683581" class="hover:text-primary-400 transition-colors tracking-wider">+201551683581</a>
            <a href="mailto:midoproblems091@gmail.com" class="hover:text-primary-400 transition-colors">midoproblems091@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import {
  ShoppingBag,
  ChevronRight,
  Heart,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle,
  Send,
  Mail,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useUiStore } from "@/stores/ui.js";

const auth = useAuthStore();
const settingsStore = useSettingsStore();
const ui = useUiStore();
const currentYear = new Date().getFullYear();
</script>
