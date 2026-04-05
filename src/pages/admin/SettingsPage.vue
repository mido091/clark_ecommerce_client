<template>
  <div class="space-y-8 min-h-screen">
    <!-- Page Header (Sticky) -->
    <div
      class="sticky top-[80px] z-20 bg-background/80 backdrop-blur-md border-b border-borderThin -mx-4 px-4 py-4 mb-8"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-textPrimary uppercase tracking-widest">
            {{ $t("settings.title") }}
          </h2>
          <p
            v-if="settingsStore.data.updated_at"
            class="text-[10px] text-textSecondary uppercase font-bold tracking-tighter mt-1"
          >
            {{ $t("settings.lastUpdated") }}:
            {{ new Date(settingsStore.data.updated_at).toLocaleString() }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="auth.isOwner"
            @click="saveSettings"
            :disabled="saving"
            class="btn-primary"
          >
            <LoadingSpinner v-if="saving" :size="18" />
            <Save v-else class="w-4 h-4" />
            <span class="hidden sm:inline">{{ $t("common.save") }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-[280px_1fr] gap-10">
      <!-- Sidebar Navigation -->
      <aside class="hidden lg:block">
        <div class="sticky top-28 space-y-2">
          <h4 class="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-textSecondary mb-4">
            {{ $t("admin.controlCenter") || 'Navigation' }}
          </h4>
          <nav class="space-y-1">
            <a
              v-for="section in navSections"
              :key="section.id"
              :href="'#' + section.id"
              class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group hover:bg-surface border border-transparent hover:border-borderThin"
              :class="activeSection === section.id ? 'bg-surface border-primary-500/20 shadow-sm' : 'text-textSecondary'"
              @click.prevent="scrollTo(section.id)"
            >
              <component :is="section.icon" class="w-4 h-4 transition-colors" :class="activeSection === section.id ? 'text-primary-500' : 'group-hover:text-textPrimary'" />
              <span class="text-xs font-bold tracking-tight uppercase" :class="activeSection === section.id ? 'text-primary-600' : 'group-hover:text-textPrimary'">
                {{ section.label }}
              </span>
              <div v-if="activeSection === section.id" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(var(--primary-500-rgb),0.5)]"></div>
            </a>
          </nav>

          <!-- Status Card -->
          <div v-if="!auth.isOwner" class="mt-8 p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <div class="flex items-start gap-3">
              <Lock class="w-4 h-4 mt-1 flex-shrink-0" />
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest leading-none mb-2">{{ $t("admin.ownerOnly") }}</p>
                <p class="text-[10px] leading-relaxed opacity-80">{{ $t("admin.ownerOnlyDesc") }}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Content Area -->
      <div class="space-y-10 pb-20">
        <!-- Error / success feedback -->
        <Transition name="slide-up">
          <div
            v-if="feedbackMsg"
            :class="[
              'flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold shadow-sm border animate-in slide-in-from-top-4 duration-500',
              feedbackType === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
            ]"
          >
            <CheckCircle v-if="feedbackType === 'success'" class="w-5 h-5 flex-shrink-0" />
            <AlertCircle v-else class="w-5 h-5 flex-shrink-0" />
            {{ feedbackMsg }}
          </div>
        </Transition>

        <!-- Identity Section -->
        <section id="identity" class="card group overflow-hidden border-borderThin hover:border-primary-500/30 transition-all duration-500">
          <div class="p-8 border-b border-borderThin bg-surface/30">
            <h3 class="font-black text-textPrimary tracking-widest uppercase text-xs flex items-center gap-3">
              <Building2 class="w-5 h-5 text-primary-500" />
              {{ $t("settings.sectionIdentity") }}
            </h3>
          </div>
          
          <div class="p-8 space-y-8">
            <div class="grid sm:grid-cols-2 gap-8">
              <div class="sm:col-span-2">
                <label class="form-label text-[10px] uppercase font-black tracking-[0.15em] text-textSecondary">{{ $t("settings.siteName") }}</label>
                <input
                  v-model="form.site_name"
                  type="text"
                  :readonly="!auth.isOwner"
                  class="form-input text-sm font-medium"
                  :class="!auth.isOwner ? 'bg-surface/50 opacity-60 cursor-not-allowed' : ''"
                  :placeholder="$t('settings.siteNamePlaceholder')"
                />
              </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Site Logo Card -->
                <div class="p-6 rounded-[2rem] bg-surface/40 border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-primary-500/20 group/logo-card">
                  <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                      <div class="p-2.5 rounded-xl bg-primary-500/10 text-primary-500">
                        <ImageIcon class="w-5 h-5" />
                      </div>
                      <div>
                        <h4 class="text-[11px] font-black uppercase tracking-widest text-textPrimary leading-none">Website Logo</h4>
                        <p class="text-[9px] font-bold text-textSecondary uppercase tracking-tighter mt-1 opacity-70">Main branding asset</p>
                      </div>
                    </div>
                  </div>

                  <ImageUploadSingle
                    v-model="logoModel"
                    :label="null"
                    :max-size="2 * 1024 * 1024"
                    :uploading="saving"
                    :readonly="!auth.isOwner"
                    aspect="aspect-[16/6]"
                    fit="contain"
                  >
                    <template #footer>
                       <span class="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-lg">500x150px</span>
                    </template>
                  </ImageUploadSingle>
                </div>

                <!-- Site Favicon Card -->
                <div class="p-6 rounded-[2rem] bg-surface/40 border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-primary-500/20 group/favicon-card">
                  <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                      <div class="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                        <ImageIcon class="w-5 h-5" />
                      </div>
                      <div>
                        <h4 class="text-[11px] font-black uppercase tracking-widest text-textPrimary leading-none">Website Favicon</h4>
                        <p class="text-[9px] font-bold text-textSecondary uppercase tracking-tighter mt-1 opacity-70">Browser tab icon</p>
                      </div>
                    </div>
                    
                    <!-- Integrated Mini Preview -->
                    <div v-if="faviconModel" class="flex flex-col items-center">
                       <div class="w-6 h-6 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center">
                         <img :src="typeof faviconModel === 'string' ? faviconModel : previewFavicon" class="w-full h-full object-contain" />
                       </div>
                       <span class="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">16px</span>
                    </div>
                  </div>

                  <ImageUploadSingle
                    v-model="faviconModel"
                    :label="null"
                    :max-size="1024 * 1024"
                    accept="image/png,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico"
                    :uploading="saving"
                    :readonly="!auth.isOwner"
                    shape="square"
                    aspect="aspect-square"
                    fit="contain"
                    class="!max-w-[120px] mx-auto"
                  >
                    <template #footer>
                       <span class="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-lg">512x512px</span>
                    </template>
                  </ImageUploadSingle>
                </div>

                <div class="p-6 rounded-[2rem] bg-surface/40 border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-primary-500/20 group/footer-logo-card md:col-span-2">
                  <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                      <div class="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
                        <ImageIcon class="w-5 h-5" />
                      </div>
                      <div>
                        <h4 class="text-[11px] font-black uppercase tracking-widest text-textPrimary leading-none">Footer Logo</h4>
                        <p class="text-[9px] font-bold text-textSecondary uppercase tracking-tighter mt-1 opacity-70">Optional footer branding asset</p>
                      </div>
                    </div>
                  </div>

                  <ImageUploadSingle
                    v-model="footerLogoModel"
                    :label="null"
                    :max-size="1024 * 1024"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,.ico"
                    :uploading="saving"
                    :readonly="!auth.isOwner"
                    aspect="aspect-[16/5]"
                    fit="contain"
                  >
                    <template #footer>
                      <span class="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-lg">1MB max</span>
                    </template>
                  </ImageUploadSingle>
                </div>

                <!-- Hero Banner Image Card -->
                <div class="p-6 rounded-[2rem] bg-surface/40 border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-primary-500/20 group/hero-card md:col-span-2">
                  <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                      <div class="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
                        <ImageIcon class="w-5 h-5" />
                      </div>
                      <div>
                        <h4 class="text-[11px] font-black uppercase tracking-widest text-textPrimary leading-none">Hero Banner Image</h4>
                        <p class="text-[9px] font-bold text-textSecondary uppercase tracking-tighter mt-1 opacity-70">Main homepage hero image (right side visual)</p>
                      </div>
                    </div>
                  </div>

                  <ImageUploadSingle
                    v-model="heroImageModel"
                    :label="null"
                    :max-size="5 * 1024 * 1024"
                    accept="image/jpeg,image/png,image/webp"
                    :uploading="saving"
                    :readonly="!auth.isOwner"
                    aspect="aspect-[4/3]"
                    fit="cover"
                  >
                    <template #footer>
                      <span class="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-lg">Max 5MB — JPG / PNG / WEBP</span>
                    </template>
                  </ImageUploadSingle>
                </div>
              </div>
            </div>
          </div>
        </section>


        <!-- Contact Section -->
        <section id="contact" class="card group overflow-hidden border-borderThin hover:border-primary-500/30 transition-all duration-500">
          <div class="p-8 border-b border-borderThin bg-surface/30">
            <h3 class="font-black text-textPrimary tracking-widest uppercase text-xs flex items-center gap-3">
              <MessageSquare class="w-5 h-5 text-primary-500" />
              {{ $t("settings.sectionContact") }}
            </h3>
          </div>
          <div class="p-8 grid sm:grid-cols-2 gap-8">
            <div class="space-y-2">
              <label class="form-label text-[10px] uppercase font-black">{{ $t("settings.contactEmail") }}</label>
              <input
                v-model="form.contact_email"
                type="email"
                :readonly="!auth.isOwner"
                class="form-input text-sm"
                :class="!auth.isOwner ? 'bg-surface/50 opacity-60 cursor-not-allowed' : ''"
              />
            </div>
            <div class="space-y-2">
              <label class="form-label text-[10px] uppercase font-black">{{ $t("settings.whatsappNumber") }}</label>
              <input
                v-model="form.whatsapp_number"
                type="text"
                :readonly="!auth.isOwner"
                class="form-input text-sm"
                :class="!auth.isOwner ? 'bg-surface/50 opacity-60 cursor-not-allowed' : ''"
              />
            </div>
            <div class="space-y-2">
              <label class="form-label text-[10px] uppercase font-black">{{ $t("settings.currencyCode") }}</label>
              <input
                v-model="form.currency_code"
                type="text"
                maxlength="3"
                :readonly="!auth.isOwner"
                class="form-input text-sm uppercase font-mono"
                :class="!auth.isOwner ? 'bg-surface/50 opacity-60 cursor-not-allowed' : ''"
              />
            </div>
          </div>
        </section>

        <!-- Analytics Section -->
        <section id="analytics" class="card group overflow-hidden border-borderThin hover:border-primary-500/30 transition-all duration-500">
          <div class="p-8 border-b border-borderThin bg-surface/30">
            <h3 class="font-black text-textPrimary tracking-widest uppercase text-xs flex items-center gap-3">
              <BarChart2 class="w-5 h-5 text-primary-500" />
              {{ $t("settings.sectionAds") }}
            </h3>
          </div>
          <div class="p-8 grid sm:grid-cols-2 gap-8">
            <div class="space-y-2">
              <label class="form-label text-[10px] uppercase font-black">{{ $t("settings.googleAnalyticsId") }}</label>
              <input v-model="form.google_analytics_id" type="text" :readonly="!auth.isOwner" class="form-input text-sm font-mono uppercase tracking-wider" />
            </div>
            <div class="space-y-2">
              <label class="form-label text-[10px] uppercase font-black">{{ $t("settings.googleAdsClientId") }}</label>
              <input v-model="form.google_ads_client_id" type="text" :readonly="!auth.isOwner" class="form-input text-sm font-mono uppercase tracking-wider" />
            </div>
          </div>
        </section>

        <!-- Scripts Section -->
        <section id="scripts" class="card group overflow-hidden border-borderThin hover:border-primary-500/30 transition-all duration-500">
          <div class="p-8 border-b border-borderThin bg-surface/30">
            <h3 class="font-black text-textPrimary tracking-widest uppercase text-xs flex items-center gap-3">
              <Code2 class="w-5 h-5 text-primary-500" />
              {{ $t("settings.sectionScripts") }}
            </h3>
          </div>
          <div class="p-8 space-y-8">
            <div class="flex items-start gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 transition-colors group-hover:bg-red-500/10">
              <ShieldAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p class="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider leading-relaxed">
                {{ $t("settings.scriptsWarning") }}
              </p>
            </div>

            <div class="grid gap-8">
              <div class="space-y-3">
                <label class="form-label text-[10px] uppercase font-black flex items-center justify-between">
                  {{ $t("settings.headerScripts") }}
                  <span class="text-textSecondary opacity-50 font-normal normal-case italic">In head tag</span>
                </label>
                <textarea v-model="form.header_scripts" rows="6" :readonly="!auth.isOwner" class="form-input text-xs font-mono h-40" />
              </div>
              <div class="space-y-3">
                <label class="form-label text-[10px] uppercase font-black flex items-center justify-between">
                  {{ $t("settings.footerScripts") }}
                  <span class="text-textSecondary opacity-50 font-normal normal-case italic">Before /body tag</span>
                </label>
                <textarea v-model="form.footer_scripts" rows="6" :readonly="!auth.isOwner" class="form-input text-xs font-mono h-40" />
              </div>
            </div>
          </div>
        </section>

        <!-- Social Section -->
        <section id="social" class="card group overflow-hidden border-borderThin hover:border-primary-500/30 transition-all duration-500">
          <div class="p-8 border-b border-borderThin bg-surface/30">
            <h3 class="font-black text-textPrimary tracking-widest uppercase text-xs flex items-center gap-3">
              <Share2 class="w-5 h-5 text-primary-500" />
              {{ $t("settings.sectionSocial") }}
            </h3>
          </div>
          <div class="p-8 grid sm:grid-cols-2 gap-8">
            <div v-for="sc in socialPlatforms" :key="sc.key" class="space-y-2">
              <label class="form-label text-[10px] uppercase font-black flex items-center gap-2">
                <component :is="sc.icon" class="w-3.5 h-3.5 text-textSecondary" />
                {{ $t(`settings.socialLabel${sc.label}`) }}
              </label>
              <input v-model="form[sc.key]" :type="sc.type" :readonly="!auth.isOwner" class="form-input text-sm" :placeholder="sc.placeholder" />
            </div>
          </div>
        </section>

        <!-- Payment Section -->
        <section id="payment" class="card group overflow-hidden border-borderThin hover:border-primary-500/30 transition-all duration-500">
          <div class="p-8 border-b border-borderThin bg-surface/30">
            <h3 class="font-black text-textPrimary tracking-widest uppercase text-xs flex items-center gap-3">
              <CreditCard class="w-5 h-5 text-primary-500" />
              {{ $t("settings.sectionPayment") }}
            </h3>
          </div>
          <div class="p-8 grid sm:grid-cols-2 gap-8">
            <div class="space-y-2">
              <label class="form-label text-[10px] uppercase font-black">{{ $t("settings.walletNumber") }}</label>
              <input v-model="form.wallet_number" type="text" :readonly="!auth.isOwner" class="form-input text-sm font-bold tracking-widest" />
            </div>
            <div class="space-y-2">
              <label class="form-label text-[10px] uppercase font-black">{{ $t("settings.instapayHandle") }}</label>
              <input v-model="form.instapay_handle" type="text" :readonly="!auth.isOwner" class="form-input text-sm font-bold" />
            </div>
          </div>
        </section>

          <!-- Footer Actions (Owner only) -->
        <div v-if="auth.isOwner" class="sticky bottom-8 z-10 flex justify-end">
          <button @click="saveSettings" :disabled="saving" class="btn-primary px-10 py-5 rounded-full shadow-[0_15px_30px_rgba(var(--primary-500-rgb),0.3)] hover:shadow-primary-500/50 hover:-translate-y-1 transition-all duration-300 ring-8 ring-background/80 backdrop-blur-sm">
            <LoadingSpinner v-if="saving" :size="20" />
            <Save v-else class="w-5 h-5" />
            <span class="font-black uppercase tracking-widest text-sm">{{ $t("common.save") }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Save,
  Lock,
  Building2,
  MessageSquare,
  BarChart2,
  Code2,
  CheckCircle,
    AlertCircle,
    ShieldAlert,
    Upload,
    Image as ImageIcon,
    Share2,
    CreditCard,
    Facebook,
  Twitter,
  Instagram,
  Youtube,
  Send,
  Mail,
  Linkedin,
} from "lucide-vue-next";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import ImageUploadSingle from "@/components/ImageUploadSingle.vue";
import { useAuthStore } from "@/stores/auth.js";
import { useSettingsStore } from "@/stores/settings.js";

const { t } = useI18n();
const auth = useAuthStore();
const settingsStore = useSettingsStore();
const showToast = inject("showToast");

// ── Navigation Section Logic ────────────────────────────────
const activeSection = ref("identity");

const navSections = computed(() => [
  { id: "identity", icon: Building2, label: t("settings.sectionIdentity") },
  { id: "contact", icon: MessageSquare, label: t("settings.sectionContact") },
  { id: "analytics", icon: BarChart2, label: t("settings.sectionAds") },
  { id: "scripts", icon: Code2, label: t("settings.sectionScripts") },
  { id: "social", icon: Share2, label: t("settings.sectionSocial") },
  { id: "payment", icon: CreditCard, label: t("settings.sectionPayment") },
]);

const socialPlatforms = [
  { key: "social_facebook", label: "Facebook", icon: Facebook, type: "url", placeholder: "https://facebook.com/..." },
  { key: "social_x", label: "X", icon: Twitter, type: "url", placeholder: "https://x.com/..." },
  { key: "social_whatsapp", label: "Whatsapp", icon: MessageSquare, type: "text", placeholder: "https://wa.me/..." },
  { key: "social_telegram", label: "Telegram", icon: Send, type: "url", placeholder: "https://t.me/..." },
  { key: "social_gmail", label: "Gmail", icon: Mail, type: "email", placeholder: "contact@example.com" },
];

function scrollTo(id) {
  activeSection.value = id;
  const el = document.getElementById(id);
  if (el) {
    const yOffset = -120; // sticky header offset
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

// Intersection Observer for active section tracking
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      });
    },
    { threshold: 0.2, rootMargin: "-120px 0px -50% 0px" }
  );

  navSections.value.forEach((section) => {
    const el = document.getElementById(section.id);
    if (el) observer.observe(el);
  });
});

const previewFavicon = computed(() => {
  if (!faviconModel.value) return null;
  if (faviconModel.value instanceof File) return URL.createObjectURL(faviconModel.value);
  return `${faviconModel.value}`
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);/g, (_match, dec) =>
      String.fromCharCode(parseInt(dec, 10)),
    )
    .replace(/&amp;/g, "&");
});

// ── Local form state ────────────────────────────────────────
// Mirrors what's in the store so we can detect changes and cancel edits
const form = reactive({
  site_name: "",
  logo_url: "",
  favicon_url: "",
  footer_logo_url: "",
  hero_image_url: "",
  contact_email: "",
  whatsapp_number: "",
  currency_code: "",
  google_analytics_id: "",
  google_ads_client_id: "",
  header_scripts: "",
  footer_scripts: "",
  social_facebook: "",
  social_x: "",
  social_whatsapp: "",
  social_telegram: "",
  social_gmail: "",
  wallet_number: "",
  instapay_handle: "",
});

const saving = ref(false);
const logoError = ref(false);
const feedbackMsg = ref("");
const feedbackType = ref("success");

const logoModel = ref(null);
const faviconModel = ref(null);
const footerLogoModel = ref(null);
const heroImageModel = ref(null);

// function onLogoFileChange(event) { ... } removed in favor of ImageUploadSingle
// function onFaviconFileChange(event) { ... } removed in favor of ImageUploadSingle

/** Populate form from the Pinia store */
function syncFormFromStore() {
  const d = settingsStore.data;
  form.site_name = d.site_name || "";
  form.logo_url = d.logo_url || "";
  form.favicon_url = d.favicon_url || "";
  form.footer_logo_url = d.footer_logo_url || "";
  form.contact_email = d.contact_email || "";
  form.whatsapp_number = d.whatsapp_number || "";
  form.currency_code = d.currency_code || "EGP";
  form.google_analytics_id = d.google_analytics_id || "";
  form.google_ads_client_id = d.google_ads_client_id || "";
  form.header_scripts = d.header_scripts || "";
  form.footer_scripts = d.footer_scripts || "";
  form.social_facebook = d.social_facebook || "";
  form.social_x = d.social_x || "";
  form.social_whatsapp = d.social_whatsapp || "";
  form.social_telegram = d.social_telegram || "";
  form.social_gmail = d.social_gmail || "";
  form.wallet_number = d.wallet_number || "";
  form.instapay_handle = d.instapay_handle || "";
  form.hero_image_url = d.hero_image_url || "";

  logoModel.value = d.logo_url || null;
  faviconModel.value = d.favicon_url || null;
  footerLogoModel.value = d.footer_logo_url || null;
  heroImageModel.value = d.hero_image_url || null;
}

onMounted(async () => {
  // Always fetch fresh so the page reflects DB state (not just boot cache)
  await settingsStore.fetchSettings(/* force = */ true);
  syncFormFromStore();
});

// Reset logoError when URL changes
watch(
  () => form.logo_url,
  () => {
    logoError.value = false;
  },
);

// ── Save handler ────────────────────────────────────────────
async function saveSettings() {
  if (!auth.isOwner) return;

  saving.value = true;
  feedbackMsg.value = "";

  try {
    // ── Dual-mode payload ────────────────────────────────────────
    // • No new logo → plain JSON (express.json() parses it cleanly,
    //   no multipart/Content-Type boundary issues).
    // • New logo selected → FormData (Multer handles the file upload).
    // In both cases every field is sent with its current value so the
    // backend always receives a complete object and never needs to guess.

    const textFields = {
      site_name: form.site_name ?? "",
      currency_code: form.currency_code ?? "",
      contact_email: form.contact_email ?? "",
      whatsapp_number: form.whatsapp_number ?? "",
      google_analytics_id: form.google_analytics_id ?? "",
      google_ads_client_id: form.google_ads_client_id ?? "",
      header_scripts: form.header_scripts ?? "",
      footer_scripts: form.footer_scripts ?? "",
      social_facebook: form.social_facebook ?? "",
      social_x: form.social_x ?? "",
      social_whatsapp: form.social_whatsapp ?? "",
      social_telegram: form.social_telegram ?? "",
      social_gmail: form.social_gmail ?? "",
      wallet_number: form.wallet_number ?? "",
      instapay_handle: form.instapay_handle ?? "",
    };

    let payload;

    if (
      logoModel.value instanceof File ||
      faviconModel.value instanceof File ||
      footerLogoModel.value instanceof File ||
      heroImageModel.value instanceof File
    ) {
      const fd = new FormData();
      Object.entries(textFields).forEach(([k, v]) => fd.append(k, v));
      
      if (logoModel.value instanceof File) fd.append("logo", logoModel.value);
      else fd.append("logo_url", typeof logoModel.value === 'string' ? logoModel.value : (form.logo_url ?? ""));

      if (faviconModel.value instanceof File) fd.append("favicon", faviconModel.value);
      else fd.append("favicon_url", typeof faviconModel.value === 'string' ? faviconModel.value : (form.favicon_url ?? ""));

      if (footerLogoModel.value instanceof File) fd.append("footer_logo", footerLogoModel.value);
      else fd.append("footer_logo_url", typeof footerLogoModel.value === 'string' ? footerLogoModel.value : (form.footer_logo_url ?? ""));

      if (heroImageModel.value instanceof File) fd.append("hero_image", heroImageModel.value);
      else fd.append("hero_image_url", typeof heroImageModel.value === 'string' ? heroImageModel.value : (form.hero_image_url ?? ""));

      payload = fd;
    } else {
      payload = { 
        ...textFields, 
        logo_url: typeof logoModel.value === 'string' ? logoModel.value : (form.logo_url ?? ""),
        favicon_url: typeof faviconModel.value === 'string' ? faviconModel.value : (form.favicon_url ?? ""),
        footer_logo_url: typeof footerLogoModel.value === 'string' ? footerLogoModel.value : (form.footer_logo_url ?? ""),
        hero_image_url: typeof heroImageModel.value === 'string' ? heroImageModel.value : (form.hero_image_url ?? ""),
      };
    }

    // ── 🔍 DIAGNOSTIC: log EXACTLY what we're sending ───────────
    if (payload instanceof FormData) {
      console.log("[saveSettings] MODE: FormData (file upload)");
      for (const [key, value] of payload.entries()) {
        console.log(
          `  ↑ FormData[${key}]:`,
          value instanceof File
            ? `File("${value.name}", ${value.size}B)`
            : value,
        );
      }
    } else {
      console.log("[saveSettings] MODE: JSON (text-only)");
      console.log("  ↑ JSON payload:", JSON.stringify(payload, null, 2));
    }
    // ─────────────────────────────────────────────────────────────

    // payload is either FormData (logo upload) or a plain JSON object (text-only)
    await settingsStore.updateSettings(payload);

    // Models updated via syncFormFromStore called implicitly or manually
    syncFormFromStore(); // Ensure UI reflects saved state

    feedbackType.value = "success";
    feedbackMsg.value = t("settings.saveSuccess");
    showToast?.(t("settings.saveSuccess"), "success");

    setTimeout(() => {
      feedbackMsg.value = "";
    }, 5000);
  } catch (err) {
    // ── 🔍 DIAGNOSTIC: log EXACTLY what came back ─────────────
    console.error("[saveSettings] ❌ Request failed:", {
      httpStatus: err.response?.status,
      serverMsg: err.response?.data?.message,
      serverData: err.response?.data,
      axiosMsg: err.message,
    });
    // ─────────────────────────────────────────────────────────────
    feedbackType.value = "error";
    feedbackMsg.value = err.response?.data?.message || t("settings.saveError");
    showToast?.(feedbackMsg.value, "error");
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.slide-up-enter-active {
  transition: all 0.3s ease;
}
.slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

section {
  scroll-margin-top: 120px;
}
</style>
