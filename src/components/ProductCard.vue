<template>
  <div
    v-memo="[product.id, isInWishlist, imageLoaded, ui.locale]"
    class="card-hover group cursor-pointer flex flex-col relative h-full bg-background product-card-container"
    @click="$router.push(`/products/${product.id}`)"
  >
    <!-- Product Image (aspect-square) -->
    <div
      class="relative overflow-hidden aspect-square w-full bg-surface dark:bg-black/50"
    >
      <!-- Skeleton Shimmer Overlay (CLS Prevention) -->
      <div
        v-if="!imageLoaded"
        class="absolute inset-0 z-10 bg-gray-200 dark:bg-slate-800 animate-pulse"
      >
        <div
          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"
        />
      </div>

      <OptimizedImage
        :src="optimizedImageUrl"
        :alt="displayName"
        :aspect-ratio="'1/1'"
        container-class="w-full h-full"
        img-class="transition-all duration-700 ease-out group-hover:scale-110"
        :loading="priority ? 'eager' : 'lazy'"
        :priority="priority"
      />

      <!-- Wishlist Button -->
      <button
        @click.stop="toggleWishlist"
        class="absolute top-3 z-20 p-2.5 rounded-full shadow-sm hover:scale-110 transition-transform duration-300 glass-effect"
        :class="[
          ui.locale === 'ar' ? 'left-3 right-auto' : 'right-3 left-auto',
        ]"
        :title="isInWishlist ? $t('wishlist.removed') : $t('wishlist.added')"
      >
        <Heart
          class="w-4 h-4 transition-colors duration-300"
          :class="
            isInWishlist
              ? 'text-pink-500 fill-pink-500 hover:text-pink-600'
              : 'text-textSecondary hover:text-pink-500'
          "
        />
      </button>

      <!-- Badges -->
      <div
        class="absolute top-3 flex flex-col gap-2 z-20"
        :class="[
          ui.locale === 'ar' ? 'right-3 left-auto' : 'left-3 right-auto',
        ]"
      >
        <span
          v-if="discountPercentage"
          class="text-[10px] font-black text-white uppercase tracking-tighter bg-red-600 px-2.5 py-1 rounded-full shadow-lg animate-in zoom-in-50 duration-500 ring-2 ring-white/20"
        >
          {{ ui.locale === 'ar' ? `وفر ${discountPercentage}%` : `SAVE ${discountPercentage}%` }}
        </span>
        <span
          v-if="product.stock === 0"
          class="text-[10px] font-bold text-white uppercase tracking-wider bg-red-500 px-3 py-1 rounded-full shadow-sm"
        >
          {{ $t("products.outOfStock") }}
        </span>
        <span
          v-else-if="product.stock <= 5"
          class="text-[10px] font-bold text-white uppercase tracking-wider bg-orange-500 px-3 py-1 rounded-full shadow-sm"
        >
          {{ $t("products.lowStockBadge", { n: product.stock }) }}
        </span>
      </div>

      <!-- Quick Add to Cart Button Hover Overlay (Desktop) -->
      <div
        class="hidden sm:block absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-30"
      >
        <button
          @click.stop="addToCart"
          :disabled="product.stock === 0"
          class="w-full btn-primary py-2.5 rounded-xl text-sm justify-center shadow-lg"
          :class="cartPulse ? 'animate-pulse' : ''"
        >
          <ShoppingCart v-if="product.stock > 0" class="w-4 h-4" />
          <span>{{
            product.stock === 0
              ? $t("products.outOfStock")
              : $t("products.addToCart")
          }}</span>
        </button>
      </div>

      <!-- Mobile Floating Add to Cart (Mobile Only - Always Visible) -->
      <button
        v-if="product.stock > 0"
        @click.stop="addToCart"
        class="sm:hidden absolute bottom-3 z-30 p-3 rounded-full shadow-xl bg-primary-500 text-white active:scale-90 transition-all duration-300 flex items-center justify-center ring-4 ring-background/10"
        :class="[
          ui.locale === 'ar' ? 'left-3' : 'right-3',
          cartPulse ? 'animate-bounce' : ''
        ]"
      >
        <ShoppingCart class="w-5 h-5" />
      </button>
    </div>

    <!-- Info Box -->
    <div
      class="flex flex-col gap-0.5 p-3 sm:p-5 flex-1"
      :class="[ui.locale === 'ar' ? 'text-right' : 'text-left']"
    >
      <p
        class="text-[11px] font-bold text-primary-500 uppercase tracking-widest truncate"
      >
        {{ ui.locale === 'ar' && product.category_name_ar ? product.category_name_ar : product.category_name }}
      </p>
      <h3
        class="font-semibold text-textPrimary text-sm sm:text-base line-clamp-2 transition-colors duration-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 mt-1"
      >
        {{ displayName }}
      </h3>
      <!-- Stars inside card -->
      <div
        v-if="product.review_count > 0 || product.avg_rating > 0"
        class="flex gap-1 mt-1 mb-1 items-center"
      >
        <Star
          v-for="i in 5"
          :key="i"
          class="w-3.5 h-3.5"
          :class="
            i <= Math.round(product.avg_rating || 0)
              ? 'text-yellow-400 fill-current'
              : 'text-gray-200 dark:text-gray-700'
          "
        />
        <span
          class="text-[10px] text-textSecondary font-semibold ml-1 rtl:ml-0 rtl:mr-1"
          >({{ product.review_count || 0 }})</span
        >
      </div>

      <div class="mt-auto pt-2 sm:pt-3 flex items-center gap-3">
        <span class="text-base sm:text-lg font-extrabold text-textPrimary shrink-0">
          ${{ Number(product.price).toFixed(2) }}
        </span>
        <span v-if="product.old_price" class="text-xs font-semibold text-red-500 line-through opacity-70">
          ${{ Number(product.old_price).toFixed(2) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ShoppingCart, Heart, Star } from "lucide-vue-next";
import OptimizedImage from "@/components/OptimizedImage.vue";
import { useCartStore } from "@/stores/cart.js";
import { useUiStore } from "@/stores/ui.js";
import { useWishlistStore } from "@/stores/wishlist.js";
import { useSettingsStore } from "@/stores/settings.js";

const props = defineProps({
  product: { type: Object, required: true },
  priority: { type: Boolean, default: false }, // New prop for LCP optimization
});

const { t } = useI18n();
const cart = useCartStore();
const ui = useUiStore();
const wishlist = useWishlistStore();
const settings = useSettingsStore();
const showToast = inject("showToast");

const imageLoaded = ref(false);
const cartPulse = ref(false);

const displayName = computed(() =>
  ui.locale === "ar" && props.product.name_ar
    ? props.product.name_ar
    : props.product.name,
);

const isInWishlist = computed(() => wishlist.isInWishlist(props.product.id));

/**
 * Multi-CDN Image Optimization:
 * Supports Unsplash and Pexels to ensure high-res images are resized.
 */
const optimizedImageUrl = computed(() => {
  const base = props.product.main_image;
  if (!base) return "/placeholder-product.png";

  try {
    const url = new URL(base);
    
    // Clear potentially redundant params from seed script
    url.searchParams.delete('w');
    url.searchParams.delete('h');
    url.searchParams.delete('width');
    url.searchParams.delete('height');
    url.searchParams.delete('t'); // Remove cache buster for better performance

    // Unsplash Optimization
    if (base.includes("unsplash.com")) {
      url.searchParams.set("w", "400");
      url.searchParams.set("q", "75");
      url.searchParams.set("fm", "webp");
      url.searchParams.set("fit", "crop");
      return url.toString();
    }

    // Pexels Optimization
    if (base.includes("pexels.com")) {
      url.searchParams.set("w", "400");
      url.searchParams.set("h", "500");
      url.searchParams.set("fit", "crop");
      return url.toString();
    }
  } catch (e) {
    return base;
  }
  
  return base;
});

const discountPercentage = computed(() => {
  if (!props.product.old_price || props.product.old_price <= props.product.price)
    return 0;
  const diff = props.product.old_price - props.product.price;
  return Math.round((diff / props.product.old_price) * 100);
});

function addToCart() {
  cart.addItem(props.product);
  showToast?.(t("products.addedToCart"), "success", 2000);
  cartPulse.value = true;
  setTimeout(() => (cartPulse.value = false), 600);
}

async function toggleWishlist() {
  try {
    const added = await wishlist.toggleWishlist(props.product);
    showToast?.(
      added ? t("wishlist.added") : t("wishlist.removed"),
      added ? "success" : "info",
      2000,
    );
  } catch (err) {
    if (err.message === "unauthenticated") {
      showToast?.(t("common.loginRequired") || "Please login first", "warning");
    } else {
      showToast?.(t("common.error"), "error");
    }
  }
}

function onImageError(e) {
  imageLoaded.value = true; // Stop showing skeleton
  const name = settings.siteName || "Store";
  e.target.src = `https://placehold.co/400x500/f8fafc/94a3b8?text=${encodeURIComponent(name)}`;
}
</script>

<style scoped>
/* Critical Layout Styles - Loads immediately with the component */
.product-card-container {
  min-height: 320px; /* Reduced for mobile */
}

@media (min-width: 640px) {
  .product-card-container {
    min-height: 480px;
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite linear;
}

/* Glassmorphism for badges and buttons */
.glass-effect {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}
.dark .glass-effect {
  background: rgba(15, 23, 42, 0.8);
}
</style>
