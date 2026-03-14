<template>
  <div class="bg-surface min-h-screen text-textPrimary py-12">
    <div class="section-container">
      <div
        class="flex flex-col items-center justify-center text-center mb-12 animate-fade-in-up"
      >
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          {{ $t("products.title") }}
        </h1>
        <p class="text-textSecondary max-w-2xl text-lg">
          {{ $t("products.subtitle") }}
        </p>
      </div>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- ── Sidebar Filters ──────────────────────────────── -->
        <aside class="lg:w-72 shrink-0">
          <div
            class="card p-6 lg:p-8 sticky top-28 space-y-8 shadow-lg border-none bg-background"
          >
            <h2
              class="font-extrabold text-xl text-textPrimary border-b border-borderThin pb-4"
            >
              {{ $t("common.filter") }}
            </h2>

            <!-- Search -->
            <div>
              <label
                class="form-label text-xs uppercase tracking-widest text-textSecondary font-bold"
                >{{ $t("common.search") }}</label
              >
              <div class="relative mt-2">
                <Search
                  class="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary/70"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  :placeholder="$t('products.searchPlaceholder')"
                  class="form-input ps-11"
                />
              </div>
            </div>

            <!-- Categories -->
            <div>
              <label
                class="form-label text-xs uppercase tracking-widest text-textSecondary font-bold"
                >{{ $t("products.filterByCategory") }}</label
              >
              <div class="flex flex-col gap-2 mt-2">
                <button
                  @click="selectedCategory = ''"
                  class="text-left px-4 py-2.5 text-sm font-semibold rounded-xl transition-all"
                  :class="
                    selectedCategory === ''
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-textSecondary hover:bg-surface hover:text-textPrimary'
                  "
                >
                  {{ $t("common.all") }}
                </button>
                <button
                  v-for="cat in categories"
                  :key="cat.id"
                  @click="selectedCategory = cat.id"
                  class="text-left px-4 py-2.5 text-sm font-semibold rounded-xl transition-all"
                  :class="
                    selectedCategory === cat.id
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-textSecondary hover:bg-surface hover:text-textPrimary'
                  "
                >
                  {{
                    ui.locale === "ar" && cat.name_ar ? cat.name_ar : cat.name
                  }}
                </button>
              </div>
            </div>

            <!-- Price range -->
            <div>
              <label
                class="form-label text-xs uppercase tracking-widest text-textSecondary font-bold"
                >{{ $t("common.priceRange") }}</label
              >
              <div class="flex gap-3 items-center mt-2">
                <input
                  v-model.number="filters.min_price"
                  type="number"
                  min="0"
                  :placeholder="$t('products.minPrice')"
                  class="form-input w-24 text-center px-2"
                  @input="debouncedFetch"
                />
                <span class="text-textSecondary font-medium">-</span>
                <input
                  v-model.number="filters.max_price"
                  type="number"
                  min="0"
                  :placeholder="$t('products.maxPrice')"
                  class="form-input w-24 text-center px-2"
                  @input="debouncedFetch"
                />
              </div>
            </div>

            <!-- Reset filters -->
            <button
              @click="resetFilters"
              class="btn-secondary w-full py-3 rounded-xl mt-4 font-bold uppercase tracking-wider text-xs"
            >
              <XCircle class="w-4 h-4" />
              {{ $t("common.reset") }}
            </button>
          </div>
        </aside>

        <!-- ── Products Grid ───────────────────────────────── -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-6">
            <p
              class="text-sm font-semibold text-textSecondary bg-background px-4 py-2 rounded-xl shadow-sm border border-borderThin"
            >
              <span
                class="text-primary-600 dark:text-primary-400 font-extrabold"
                >{{ pagination.total }}</span
              >
              {{ $t("products.items") }}
            </p>
          </div>

          <!-- Loading skeletons -->
          <ProductCardSkeleton v-if="loading && products.length === 0" :count="8" />

          <!-- Product grid -->
          <div
            v-if="filteredProducts.length > 0"
            class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up"
          >
            <ProductCard
              v-for="(p, index) in filteredProducts"
              :key="p.id"
              v-memo="[p.id, p.price, p.stock, ui.locale]"
              :product="p"
              :priority="index < 4"
            />
          </div>

          <!-- Empty state UX -->
          <div
            v-else-if="!loading"
            class="flex flex-col items-center justify-center py-24 px-6 text-center card bg-background border-none shadow-sm animate-fade-in"
          >
            <div
              class="w-20 h-20 rounded-full bg-primary-50 dark:bg-slate-800 flex items-center justify-center mb-6"
            >
              <PackageOpen class="w-10 h-10 text-primary-500" />
            </div>
            <h3 class="text-2xl font-extrabold text-textPrimary mb-2">
              {{ $t("products.noProductsFound") }}
            </h3>
            <p class="text-textSecondary mb-8 max-w-md">
              {{ $t("products.noProductsFilterDesc") }}
            </p>
            <button @click="resetFilters" class="btn-primary">
              {{ $t("products.clearFilters") }}
            </button>
          </div>

          <!-- Load More Logic -->
          <div v-if="pagination.page < pagination.pages" class="mt-12 flex flex-col items-center gap-4">
            <button 
              @click="loadMore" 
              :disabled="loading"
              class="btn-primary px-10 py-4 rounded-2xl shadow-lg hover:scale-105 transition-transform"
            >
              <span v-if="loading" class="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4 mr-2 inline-block" />
              {{ $t("common.loadMore") || "Load More" }}
            </button>
            <p class="text-xs text-textSecondary font-bold uppercase tracking-widest">
              {{ $t("products.showingItems", { n: filteredProducts.length, total: pagination.total }) || `Showing ${filteredProducts.length} of ${pagination.total} Items` }}
            </p>
          </div>

          <!-- Sentinel for Infinite Scroll (Intersection Observer) -->
          <div ref="loadMoreSentinel" class="h-10 w-full" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, inject, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Search, XCircle, PackageOpen } from "lucide-vue-next";
import ProductCard from "@/components/ProductCard.vue";
import ProductCardSkeleton from "@/components/ProductCardSkeleton.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import { useUiStore } from "@/stores/ui.js";
import api from "@/axios.js";

const route = useRoute();
const router = useRouter();
const ui = useUiStore();
const { t } = useI18n();
const showToast = inject("showToast");

// Filter state
const filters = reactive({
  name: route.query.name || "",
  category_id: route.query.category_id || "",
  min_price: route.query.min_price || "",
  max_price: route.query.max_price || "",
});

const products = ref([]);
const categories = ref([]);
const loading = ref(true);
const pagination = reactive({ page: 1, pages: 1, total: 0, limit: 12 });
const loadMoreSentinel = ref(null);

const searchQuery = ref(route.query.name || "");
const selectedCategory = ref(route.query.category_id || "");

// Sync with route changes (for header search)
watch(() => route.query.name, (newName) => {
  searchQuery.value = newName || "";
});

/**
 * Filtered Products:
 * Now just returns the reactive products array fetched from the backend.
 */
const filteredProducts = computed(() => {
  return products.value || [];
});

async function loadCategories() {
  try {
    const { data } = await api.get("/categories");
    categories.value = data.data ? data.data.filter((c) => c.is_active) : [];
  } catch (e) {
    showToast?.(t("common.error"), "error");
  }
}

/**
 * Optimized Product Fetching:
 * Supports incremental loading (Load More) and backend-side filtering.
 */
async function fetchProducts(page = 1, append = false) {
  loading.value = true;
  pagination.page = page;

  try {
    const { data } = await api.get("/products", {
      params: { 
        page, 
        limit: pagination.limit,
        name: searchQuery.value,
        category_id: selectedCategory.value,
        min_price: filters.min_price,
        max_price: filters.max_price
      },
    });
    
    const newProducts = data.data || data.products || [];
    if (append) {
      products.value = [...products.value, ...newProducts];
    } else {
      products.value = newProducts;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (data.pagination) Object.assign(pagination, data.pagination);
  } catch (e) {
    showToast?.(t("common.error"), "error");
    if (!append) products.value = [];
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  if (pagination.page < pagination.pages && !loading.value) {
    fetchProducts(pagination.page + 1, true);
  }
}

let debounceTimer;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchProducts(1), 450);
}

function resetFilters() {
  searchQuery.value = "";
  selectedCategory.value = "";
  filters.min_price = "";
  filters.max_price = "";
}

// Watchers for reactive fetching
watch(searchQuery, () => debouncedFetch());
watch(selectedCategory, () => fetchProducts(1));

// Intersection Observer for Infinite Scroll
let observer;
onMounted(() => {
  loadCategories();
  // If we have query params, they will be handled by the watchers or the initial fetch
  // but let's just do one clean fetch.
  fetchProducts(1);

  // Initialize Intersection Observer
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading.value && pagination.page < pagination.pages) {
      loadMore();
    }
  }, { threshold: 0.1 });

  if (loadMoreSentinel.value) {
    observer.observe(loadMoreSentinel.value);
  }
});
</script>
