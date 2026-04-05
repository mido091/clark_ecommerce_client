<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-base font-bold text-textPrimary sm:text-lg lg:text-xl">{{ $t("admin.products") }}</h2>
      <button @click="openCreate" class="btn-primary self-start sm:self-auto">
        <Plus class="h-4 w-4" />
        {{ $t("admin.addProduct") }}
      </button>
    </div>

    <div class="relative">
      <Search class="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary" />
      <input
        v-model="search"
        @input="debouncedFetch"
        type="text"
        :placeholder="$t('products.searchPlaceholder')"
        class="form-input w-full ps-9"
      />
    </div>

    <div v-if="loading && products.length === 0" class="py-12 text-center text-textSecondary">
      {{ $t("common.loading") }}
    </div>

    <div v-else-if="products.length === 0" class="card p-12 text-center text-textSecondary">
      <PackageOpen class="mx-auto mb-4 h-12 w-12 opacity-20" />
      <p class="text-xs font-bold uppercase tracking-widest">{{ $t("common.noResults") }}</p>
    </div>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article
          v-for="product in products"
          :key="product.id"
          class="card cursor-pointer overflow-hidden transition-all duration-300 hover:border-primary-500/50 hover:-translate-y-0.5"
          @click="openDetails(product)"
        >
          <div class="relative aspect-video bg-gray-100 dark:bg-gray-900/40">
            <img
              :src="product.main_image || 'https://placehold.co/400x300'"
              :alt="product.name"
              class="h-full w-full object-cover"
              @error="(event) => (event.target.src = 'https://placehold.co/400x300')"
            />
            <div class="absolute end-2 top-2 flex gap-2">
              <button @click.stop="openEdit(product)" class="rounded-xl bg-white/90 p-2 text-primary-700 shadow dark:bg-gray-900/90 dark:text-primary-300">
                <Edit2 class="h-4 w-4" />
              </button>
              <button @click.stop="askDelete(product)" class="rounded-xl bg-white/90 p-2 text-red-500 shadow dark:bg-gray-900/90">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="space-y-3 p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="truncate font-bold text-textPrimary">{{ product.name }}</h3>
                <p v-if="product.name_ar" dir="rtl" class="truncate text-xs text-textSecondary">{{ product.name_ar }}</p>
              </div>
              <span class="text-[10px] font-black text-textSecondary opacity-30">#{{ product.id }}</span>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="badge bg-surface text-textSecondary">{{ product.category_name }}</span>
              <span class="badge bg-emerald-500/10 text-emerald-600">{{ product.stock }} stock</span>
              <span v-if="product.color_options?.length" class="badge bg-primary-500/10 text-primary-700 dark:text-primary-300">{{ product.color_options.length }} colors</span>
              <span v-if="product.size_mode !== 'none'" class="badge bg-[#8c6a32]/10 text-[#8c6a32]">{{ product.size_options?.length || 0 }} sizes</span>
            </div>

            <div class="flex items-center justify-between border-t border-borderThin pt-3">
              <div class="flex flex-col">
                <span v-if="product.old_price" class="text-[10px] font-bold text-red-500 line-through opacity-70">{{ formatCurrency(Number(product.old_price)) }}</span>
                <span class="font-black text-primary-600 dark:text-primary-400">{{ formatCurrency(Number(product.price)) }}</span>
              </div>
              <span v-if="!product.is_active" class="rounded-lg bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase text-yellow-700">Hidden</span>
            </div>
          </div>
        </article>
      </div>

      <div class="card border-none bg-background px-4 py-3 shadow-lg">
        <PaginationBar :current="pagination.page" :pages="pagination.pages" @change="fetchProducts" />
      </div>
    </div>

    <ConfirmModal
      v-model="deleteModal"
      :title="$t('admin.deleteProduct')"
      :message="$t('admin.confirmDelete')"
      @confirm="deleteProduct"
    />

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detailsModal" class="admin-modal-shell" @click.self="closeDetails">
          <div class="admin-modal-panel max-w-5xl">
            <div class="admin-modal-header">
              <div class="flex items-center gap-3">
                <div class="rounded-2xl bg-primary-100/50 p-2.5 text-primary-600 dark:bg-primary-900/40">
                  <PackageOpen class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-xl font-black text-textPrimary">
                    {{ viewedProduct?.name || $t("admin.productDetails") || "Product Details" }}
                  </h3>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-textSecondary opacity-60">
                    {{ viewedProduct ? `ID: #${viewedProduct.id}` : "" }}
                  </p>
                </div>
              </div>
              <button @click="closeDetails" class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl text-textSecondary hover:bg-surface">
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="admin-modal-body space-y-6">
              <div v-if="detailsLoading" class="flex min-h-[320px] items-center justify-center">
                <LoadingSpinner :size="32" />
              </div>

              <template v-else-if="viewedProduct">
                <div class="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                  <section class="space-y-4">
                    <div class="overflow-hidden rounded-[1.75rem] border border-borderThin bg-surface shadow-sm">
                      <img
                        :src="getViewedMainImage(viewedProduct)"
                        :alt="viewedProduct.name"
                        class="h-[260px] w-full object-cover sm:h-[340px]"
                        @error="(event) => (event.target.src = 'https://placehold.co/900x700')"
                      />
                    </div>
                  </section>

                  <section class="space-y-4">
                    <div class="rounded-3xl border border-borderThin bg-surface p-5">
                      <div class="flex flex-wrap items-start justify-between gap-4">
                        <div class="space-y-2">
                          <h4 class="text-2xl font-black text-textPrimary">{{ viewedProduct.name }}</h4>
                          <p v-if="viewedProduct.name_ar" dir="rtl" class="text-sm font-semibold text-textSecondary">
                            {{ viewedProduct.name_ar }}
                          </p>
                        </div>
                        <span
                          class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                          :class="viewedProduct.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300'"
                        >
                          {{ viewedProduct.is_active ? "Active" : "Hidden" }}
                        </span>
                      </div>

                      <div class="mt-5 grid gap-3 sm:grid-cols-2">
                        <div class="rounded-2xl bg-background px-4 py-3">
                          <p class="text-[10px] font-black uppercase tracking-widest text-textSecondary">{{ $t("common.category") }}</p>
                          <p class="mt-1 text-sm font-bold text-textPrimary">{{ viewedProduct.category_name || "-" }}</p>
                        </div>
                        <div class="rounded-2xl bg-background px-4 py-3">
                          <p class="text-[10px] font-black uppercase tracking-widest text-textSecondary">{{ $t("common.stock") }}</p>
                          <p class="mt-1 text-sm font-bold text-textPrimary">{{ viewedProduct.stock }}</p>
                        </div>
                        <div class="rounded-2xl bg-background px-4 py-3">
                          <p class="text-[10px] font-black uppercase tracking-widest text-textSecondary">{{ $t("admin.currentPrice") }}</p>
                          <p class="mt-1 text-sm font-bold text-primary-600 dark:text-primary-400">{{ formatCurrency(Number(viewedProduct.price || 0)) }}</p>
                        </div>
                        <div class="rounded-2xl bg-background px-4 py-3">
                          <p class="text-[10px] font-black uppercase tracking-widest text-textSecondary">{{ $t("admin.oldPrice") }}</p>
                          <p class="mt-1 text-sm font-bold text-textPrimary">
                            {{ viewedProduct.old_price ? formatCurrency(Number(viewedProduct.old_price)) : "-" }}
                          </p>
                        </div>
                        <div class="rounded-2xl bg-background px-4 py-3 sm:col-span-2">
                          <p class="text-[10px] font-black uppercase tracking-widest text-textSecondary">{{ $t("admin.netProfit") }}</p>
                          <p class="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {{ formatCurrency(Number(viewedProduct.net_profit || 0)) }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-3xl border border-borderThin bg-surface p-5">
                          <h5 class="text-sm font-black uppercase tracking-widest text-textPrimary">
                            {{ $t("admin.productDescription") }}
                          </h5>
                      <p class="mt-3 whitespace-pre-line text-sm leading-7 text-textSecondary">
                        {{ viewedProduct.description || "-" }}
                      </p>
                      <p
                        v-if="viewedProduct.description_ar"
                        dir="rtl"
                        class="mt-4 whitespace-pre-line text-sm leading-7 text-textSecondary"
                      >
                        {{ viewedProduct.description_ar }}
                      </p>
                    </div>

                    <div class="grid gap-4 lg:grid-cols-2">
                      <div class="rounded-3xl border border-borderThin bg-surface p-5">
                        <div class="flex items-center justify-between gap-3">
                          <h5 class="text-sm font-black uppercase tracking-widest text-textPrimary">
                            {{ uiText.availableSizes }}
                          </h5>
                          <span class="rounded-full bg-primary-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-700 dark:text-primary-300">
                            {{ viewedProduct.size_mode || "none" }}
                          </span>
                        </div>
                        <div v-if="viewedProduct.size_mode !== 'none' && viewedProduct.size_options?.length" class="mt-4 flex flex-wrap gap-2">
                          <span
                            v-for="size in viewedProduct.size_options"
                            :key="size"
                            class="rounded-full border border-borderThin bg-background px-3 py-2 text-xs font-bold text-textPrimary"
                          >
                            {{ size }}
                          </span>
                        </div>
                        <p v-else class="mt-4 text-sm text-textSecondary">
                          {{ uiText.noVariantsHint }}
                        </p>
                      </div>

                      <div class="rounded-3xl border border-borderThin bg-surface p-5">
                        <div class="flex items-center justify-between gap-3">
                          <h5 class="text-sm font-black uppercase tracking-widest text-textPrimary">
                            Colors
                          </h5>
                          <span class="rounded-full bg-primary-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-700 dark:text-primary-300">
                            {{ viewedProduct.color_options?.length || 0 }}
                          </span>
                        </div>
                        <div v-if="viewedProduct.color_options?.length" class="mt-4 space-y-3">
                          <div
                            v-for="color in viewedProduct.color_options"
                            :key="color.id || color.value"
                            class="rounded-2xl border border-borderThin bg-background px-4 py-3"
                          >
                            <div class="flex items-center gap-3">
                              <span
                                class="h-4 w-4 rounded-full border border-white/60"
                                :style="{ backgroundColor: color.value || '#c8a96b' }"
                              ></span>
                              <span class="text-sm font-bold text-textPrimary">{{ color.name }}</span>
                              <span class="text-xs font-semibold text-textSecondary">{{ color.value }}</span>
                            </div>
                          </div>
                        </div>
                        <p v-else class="mt-4 text-sm text-textSecondary">
                          {{ uiText.noColorsHint }}
                        </p>
                      </div>
                    </div>

                    <div
                      v-if="viewedProduct.variants?.length"
                      class="rounded-3xl border border-borderThin bg-surface p-5"
                    >
                      <div class="mb-4 flex items-center justify-between gap-3">
                        <h5 class="text-sm font-black uppercase tracking-widest text-textPrimary">
                          Variant Stock
                        </h5>
                        <span class="rounded-full bg-primary-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-700 dark:text-primary-300">
                          {{ viewedProduct.variants.length }}
                        </span>
                      </div>
                      <div class="grid gap-3 md:grid-cols-2">
                        <div
                          v-for="variant in sortedViewedVariants"
                          :key="variant.id"
                          class="rounded-2xl border border-borderThin bg-background px-4 py-3"
                        >
                          <div class="text-[10px] font-black uppercase tracking-widest text-textSecondary">
                            {{ getViewedVariantLabel(variant) }}
                          </div>
                          <div class="mt-2 text-sm font-bold text-textPrimary">
                            {{ variant.stock }} {{ $t("common.stock") }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </template>
            </div>

            <div class="admin-modal-footer">
              <button type="button" @click="closeDetails" class="btn-secondary w-full px-8 text-xs font-bold uppercase tracking-widest sm:w-auto">
                {{ $t("common.close") || "Close" }}
              </button>
              <button
                v-if="viewedProduct"
                type="button"
                @click="openEdit(viewedProduct)"
                class="btn-primary w-full px-8 py-3 text-xs font-black uppercase tracking-widest sm:w-auto"
              >
                <Edit2 class="h-4 w-4" />
                {{ $t("common.edit") || "Edit" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="formModal" class="admin-modal-shell" @click.self="closeForm">
          <div class="admin-modal-panel max-w-6xl">
            <div class="admin-modal-header">
              <div class="flex items-center gap-3">
                <div class="rounded-2xl bg-primary-100/50 p-2.5 text-primary-600 dark:bg-primary-900/40">
                  <Plus v-if="!editingProduct" class="h-5 w-5" />
                  <Edit2 v-else class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-xl font-black text-textPrimary">
                    {{ editingProduct ? $t("admin.editProduct") : $t("admin.addProduct") }}
                  </h3>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-textSecondary opacity-60">
                    {{
                      editingProduct
                        ? `ID: #${editingProduct.id}`
                        : uiText.variantReadyProduct
                    }}
                  </p>
                </div>
              </div>
              <button @click="closeForm" class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl text-textSecondary hover:bg-surface">
                <X class="h-5 w-5" />
              </button>
            </div>

            <form @submit.prevent="saveProduct">
              <div class="admin-modal-body space-y-6">
                <div v-if="formLoading" class="flex min-h-[320px] items-center justify-center">
                  <LoadingSpinner :size="32" />
                </div>

                <template v-else>
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ $t("common.name") }} *</label>
                      <input v-model="form.name" required class="form-input" />
                    </div>
                    <div>
                      <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ $t("admin.arabicName") }}</label>
                      <input v-model="form.name_ar" dir="rtl" class="form-input text-right" />
                    </div>
                    <div>
                      <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ $t("common.category") }} *</label>
                      <select v-model="form.category_id" required class="form-input">
                        <option value="" disabled>{{ $t("admin.selectCategory") }}</option>
                        <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
                      </select>
                    </div>
                    <label class="flex items-center justify-between rounded-2xl border border-borderThin bg-surface px-4 py-3">
                      <span class="text-sm font-semibold text-textSecondary">{{ $t("admin.isActive") }}</span>
                      <input v-model="form.is_active" type="checkbox" class="h-5 w-5 rounded text-primary-500 focus:ring-primary-500" />
                    </label>
                  </div>
                  <div class="grid gap-4 rounded-2xl border border-primary-100/50 bg-primary-50/30 p-5 dark:border-primary-900/20 dark:bg-primary-900/10 md:grid-cols-4">
                    <div>
                      <label class="form-label mb-1.5 text-xs uppercase tracking-wider text-primary-600">{{ $t("admin.currentPrice") }} *</label>
                      <input v-model.number="form.price" type="number" min="0" step="0.01" required class="form-input" />
                    </div>
                    <div>
                      <label class="form-label mb-1.5 text-xs uppercase tracking-wider text-emerald-600">{{ $t("admin.netProfit") }} *</label>
                      <input v-model.number="form.net_profit" type="number" min="0" step="0.01" required class="form-input" />
                    </div>
                    <div>
                      <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ $t("admin.oldPrice") }}</label>
                      <input v-model.number="form.old_price" type="number" min="0" step="0.01" class="form-input" />
                    </div>
                    <div>
                      <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ hasVariants ? uiText.fallbackStock : $t("common.stock") }}</label>
                      <input v-model.number="form.stock" :disabled="hasVariants" type="number" min="0" class="form-input disabled:opacity-60" />
                    </div>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ $t("admin.descEn") }}</label>
                      <textarea v-model="form.description" rows="3" class="form-input resize-none"></textarea>
                    </div>
                    <div>
                      <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ $t("admin.descAr") }}</label>
                      <textarea v-model="form.description_ar" rows="3" dir="rtl" class="form-input resize-none text-right"></textarea>
                    </div>
                  </div>

                  <section class="space-y-4 rounded-3xl border border-borderThin bg-background p-5">
                    <div>
                      <h4 class="text-sm font-black uppercase tracking-widest text-textPrimary">Size Mode</h4>
                      <p class="text-xs text-textSecondary">{{ uiText.sizeModeHint }}</p>
                    </div>
                    <div class="grid gap-3 md:grid-cols-3">
                      <button
                        v-for="option in sizeModeOptions"
                        :key="option.value"
                        type="button"
                        @click="setSizeMode(option.value)"
                        :class="[
                          'rounded-2xl border p-4 text-start',
                          form.size_mode === option.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-borderThin bg-surface',
                        ]"
                      >
                        <div class="font-bold text-textPrimary">{{ option.label }}</div>
                        <div class="mt-1 text-xs text-textSecondary">{{ option.description }}</div>
                      </button>
                    </div>

                    <div v-if="form.size_mode !== 'none'" class="space-y-3">
                      <label class="form-label mb-0 text-xs uppercase tracking-wider opacity-70">{{ uiText.availableSizes }}</label>
                      <div class="flex flex-wrap gap-2">
                        <button
                          v-for="size in availableSizes"
                          :key="size"
                          type="button"
                          @click="toggleSizeOption(size)"
                          :class="[
                            'rounded-full border px-4 py-2 text-sm font-bold',
                            form.size_options.includes(size)
                              ? 'border-primary-500 bg-primary-500 text-[#2d1f12]'
                              : 'border-borderThin bg-surface text-textSecondary',
                          ]"
                        >
                          {{ size }}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section class="space-y-4 rounded-3xl border border-borderThin bg-background p-5">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 class="text-sm font-black uppercase tracking-widest text-textPrimary">Colors</h4>
                        <p class="text-xs text-textSecondary">{{ uiText.colorsHint }}</p>
                      </div>
                      <button type="button" @click="addColor" class="btn-secondary w-full justify-center sm:w-auto">
                        <Palette class="h-4 w-4" />
                        {{ uiText.addColor }}
                      </button>
                    </div>

                    <div v-if="!form.colors.length" class="rounded-2xl border border-dashed border-borderThin bg-surface p-4 text-sm text-textSecondary">
                      {{ uiText.noColorsHint }}
                    </div>

                    <div v-else class="space-y-5">
                      <div v-for="(color, index) in form.colors" :key="color.client_key" class="space-y-4 rounded-3xl border border-borderThin bg-surface p-4">
                        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_84px_96px]">
                          <div>
                            <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ uiText.colorName }}</label>
                            <input v-model="color.name" class="form-input" :placeholder="uiText.colorNamePlaceholder" />
                          </div>
                          <div>
                            <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ uiText.colorHex }}</label>
                            <input v-model="color.value" class="form-input font-mono uppercase" placeholder="#C8A96B" />
                          </div>
                          <div>
                            <label class="form-label mb-1.5 text-xs uppercase tracking-wider opacity-70">{{ uiText.picker }}</label>
                            <input v-model="color.value" type="color" class="h-12 w-full rounded-2xl border border-borderThin bg-background p-1" />
                          </div>
                          <div class="flex items-end">
                            <button type="button" @click="removeColor(index)" class="w-full rounded-2xl bg-red-50 px-3 py-3 text-xs font-bold uppercase text-red-600 dark:bg-red-900/20 dark:text-red-400">
                              {{ uiText.remove }}
                            </button>
                          </div>
                        </div>

                        <div class="inline-flex items-center gap-2 rounded-full bg-background px-3 py-2 text-xs font-bold text-textPrimary">
                          <span class="h-3.5 w-3.5 rounded-full border border-white/50" :style="{ backgroundColor: color.value || '#c8a96b' }"></span>
                          {{ color.name || `${uiText.colorLabel} ${index + 1}` }}
                        </div>

                        <ImageUploader
                          :key="`color-${color.client_key}-${uploaderSeed}`"
                          :existing-images="color.existingImages"
                          @update:images="(files) => onColorImagesUpdate(color.client_key, files)"
                        />
                      </div>
                    </div>
                  </section>
                  <section class="space-y-4 rounded-3xl border border-borderThin bg-background p-5">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 class="text-sm font-black uppercase tracking-widest text-textPrimary">Variant Stock</h4>
                        <p class="text-xs text-textSecondary">
                          {{ hasVariants ? uiText.variantStockHint : uiText.noVariantsHint }}
                        </p>
                      </div>
                      <div v-if="hasVariants" class="rounded-full bg-primary-500/10 px-3 py-2 text-xs font-bold text-primary-700 dark:text-primary-300">
                        Total {{ totalVariantStock }}
                      </div>
                    </div>

                    <div v-if="!hasVariants" class="rounded-2xl border border-dashed border-borderThin bg-surface p-4 text-sm text-textSecondary">
                      {{ uiText.singleStockHint }}
                    </div>

                    <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div
                        v-for="combo in variantCombos"
                        :key="getVariantKey(combo.color_key, combo.size_value)"
                        class="rounded-2xl border border-borderThin bg-surface p-4"
                      >
                        <div class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-textSecondary">
                          <span
                            v-if="combo.color_key && getColorState(combo.color_key)"
                            class="h-3 w-3 rounded-full border border-borderThin shadow-sm"
                            :style="{ backgroundColor: getColorState(combo.color_key).value || '#c8a96b' }"
                          ></span>
                          {{ getComboLabel(combo) }}
                        </div>
                        <input
                          :value="getVariantStock(combo.color_key, combo.size_value)"
                          @input="setVariantStock(combo.color_key, combo.size_value, $event.target.value)"
                          type="number"
                          min="0"
                          class="form-input"
                        />
                      </div>
                    </div>
                  </section>

                  <section v-if="!form.colors.length" class="space-y-3">
                    <div class="flex items-center justify-between">
                      <label class="form-label mb-0 text-xs uppercase tracking-wider opacity-70">{{ uiText.generalProductImages }}</label>
                      <span class="text-[9px] font-black uppercase tracking-tighter text-textSecondary opacity-50">
                        {{ $t("admin.imageRequirements2MB") }}
                      </span>
                    </div>
                    <ImageUploader
                      :key="`general-${uploaderSeed}`"
                      :existing-images="form.existingImages"
                      @update:images="onImagesUpdate"
                    />
                  </section>

                  <div v-if="formError" class="rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                    <p class="text-center text-xs font-bold uppercase text-red-600">{{ formError }}</p>
                  </div>
                </template>
              </div>

              <div class="admin-modal-footer">
                <button type="button" @click="closeForm" class="btn-secondary w-full px-8 text-xs font-bold uppercase tracking-widest sm:w-auto">
                  {{ $t("common.cancel") }}
                </button>
                <button type="submit" :disabled="saving || formLoading" class="btn-primary min-w-[140px] w-full py-3 text-xs font-black uppercase tracking-widest sm:w-auto">
                  <LoadingSpinner v-if="saving" :size="18" />
                  {{ editingProduct ? $t("common.update") : $t("common.create") }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from "vue";
import { Edit2, PackageOpen, Palette, Plus, Search, Trash2, X } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import ConfirmModal from "@/components/ConfirmModal.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import ImageUploader from "@/components/ImageUploader.vue";
import api from "@/axios.js";
import { useCurrency } from "@/composables/useCurrency.js";

const ALPHA_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];
const NUMERIC_SIZES = Array.from({ length: 21 }, (_, index) => String(index + 30));

const { t, locale } = useI18n();
const showToast = inject("showToast");
const { formatCurrency } = useCurrency();

const products = ref([]);
const categories = ref([]);
const loading = ref(true);
const search = ref("");
const pagination = reactive({ page: 1, pages: 1, total: 0 });

const formModal = ref(false);
const formLoading = ref(false);
const editingProduct = ref(null);
const saving = ref(false);
const formError = ref("");
const uploaderSeed = ref(0);
const form = reactive(createDefaultForm());
const detailsModal = ref(false);
const detailsLoading = ref(false);
const viewedProduct = ref(null);

const deleteModal = ref(false);
const productToDelete = ref(null);

const sizeModeOptions = computed(() => [
  {
    value: "none",
    label: locale.value === "ar" ? "بدون مقاسات" : "No Sizes",
    description: locale.value === "ar" ? "إخفاء اختيار المقاس." : "Hide size selection.",
  },
  {
    value: "alpha",
    label: locale.value === "ar" ? "مقاسات أبجدية" : "Alpha Sizes",
    description: "S, M, L, XL, XXL, XXXL.",
  },
  {
    value: "numeric",
    label: locale.value === "ar" ? "مقاسات رقمية" : "Numeric Sizes",
    description: locale.value === "ar" ? "أرقام مختارة من 30 إلى 50." : "Selected numbers from 30 to 50.",
  },
]);

const uiText = computed(() => ({
  variantReadyProduct: locale.value === "ar" ? "منتج متعدد الخيارات" : "Variant Ready Product",
  fallbackStock: locale.value === "ar" ? "مخزون احتياطي" : "Fallback Stock",
  sizeModeHint:
    locale.value === "ar"
      ? "اختر بدون مقاسات، أو مقاسات أبجدية، أو مقاسات رقمية."
      : "Choose no sizes, alphabetic sizes, or numeric sizes.",
  availableSizes: locale.value === "ar" ? "المقاسات المتاحة" : "Available Sizes",
  colorsHint:
    locale.value === "ar"
      ? "كل لون يحتاج اسمًا وقيمة لون وصورة واحدة على الأقل."
      : "Each color needs a name, hex value, and at least one image.",
  addColor: locale.value === "ar" ? "إضافة لون" : "Add Color",
  noColorsHint:
    locale.value === "ar"
      ? "لم تتم إضافة ألوان بعد. سيستخدم المنتج المعرض العام فقط."
      : "No colors added. The product will use the general gallery only.",
  colorName: locale.value === "ar" ? "اسم اللون" : "Color Name",
  colorNamePlaceholder: locale.value === "ar" ? "بيج" : "Beige",
  colorHex: locale.value === "ar" ? "كود اللون" : "Color Hex",
  picker: locale.value === "ar" ? "المنتقي" : "Picker",
  remove: locale.value === "ar" ? "إزالة" : "Remove",
  colorLabel: locale.value === "ar" ? "لون" : "Color",
  variantStockHint:
    locale.value === "ar"
      ? "حدد المخزون لكل تركيبة مفعلة من اللون والمقاس."
      : "Set stock for every active combination.",
  noVariantsHint:
    locale.value === "ar"
      ? "لا توجد خيارات متعددة مفعلة بعد."
      : "No variants selected yet.",
  singleStockHint:
    locale.value === "ar"
      ? "سيستخدم هذا المنتج حقل المخزون الواحد بالأعلى."
      : "This product will use the single stock field above.",
  generalProductImages:
    locale.value === "ar" ? "صور المنتج العامة" : "General Product Images",
}));

const availableSizes = computed(() => (form.size_mode === "numeric" ? NUMERIC_SIZES : ALPHA_SIZES));
const hasColors = computed(() => form.colors.length > 0);
const hasSizes = computed(() => form.size_mode !== "none" && form.size_options.length > 0);
const hasVariants = computed(() => hasColors.value || hasSizes.value);

const variantCombos = computed(() => {
  if (hasColors.value && hasSizes.value) {
    return form.colors.flatMap((color) =>
      form.size_options.map((sizeValue) => ({ color_key: color.client_key, size_value: sizeValue })),
    );
  }
  if (hasColors.value) return form.colors.map((color) => ({ color_key: color.client_key, size_value: null }));
  if (hasSizes.value) return form.size_options.map((sizeValue) => ({ color_key: null, size_value: sizeValue }));
  return [];
});

const totalVariantStock = computed(() =>
  variantCombos.value.reduce((sum, combo) => sum + Number(getVariantStock(combo.color_key, combo.size_value) || 0), 0),
);

const sizeSortOrder = {
  XS: 1,
  S: 2,
  M: 3,
  L: 4,
  XL: 5,
  XXL: 6,
  XXXL: 7,
};

function getSizeRank(sizeValue) {
  if (!sizeValue) return 999;
  const normalized = String(sizeValue).toUpperCase();
  if (sizeSortOrder[normalized]) return sizeSortOrder[normalized];

  const numeric = Number.parseInt(normalized, 10);
  return Number.isNaN(numeric) ? 999 : numeric;
}

const sortedViewedVariants = computed(() => {
  const variants = [...(viewedProduct.value?.variants || [])];

  return variants.sort((a, b) => {
    const colorA = String(a.color_name || "").toLowerCase();
    const colorB = String(b.color_name || "").toLowerCase();

    if (colorA !== colorB) {
      return colorA.localeCompare(colorB, locale.value === "ar" ? "ar" : "en", {
        sensitivity: "base",
      });
    }

    return getSizeRank(a.size_value) - getSizeRank(b.size_value);
  });
});
watch(
  variantCombos,
  (combos) => {
    const nextStocks = {};
    combos.forEach((combo) => {
      const key = getVariantKey(combo.color_key, combo.size_value);
      nextStocks[key] = form.variantStocks[key] ?? 0;
    });
    form.variantStocks = nextStocks;
    if (hasVariants.value) form.stock = totalVariantStock.value;
  },
  { deep: true, immediate: true },
);

watch(
  () => form.colors.length,
  (count) => {
    if (count > 0) {
      form.images = [];
      form.existingImages = [];
    }
  },
);

function createDefaultForm() {
  return {
    name: "",
    name_ar: "",
    category_id: "",
    price: "",
    net_profit: "",
    old_price: "",
    stock: 0,
    description: "",
    description_ar: "",
    specs_en: "",
    specs_ar: "",
    is_active: true,
    images: [],
    existingImages: [],
    size_mode: "none",
    size_options: [],
    colors: [],
    variantStocks: {},
  };
}

function createClientKey() {
  return `color-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createColorState(color = {}) {
  return {
    id: color.id || null,
    client_key: color.client_key || createClientKey(),
    name: color.name || "",
    value: color.value || "#c8a96b",
    existingImages: Array.isArray(color.existingImages) ? [...color.existingImages] : [],
    newImages: Array.isArray(color.newImages) ? [...color.newImages] : [],
  };
}

async function fetchProducts(page = 1) {
  loading.value = true;
  try {
    const params = { page, limit: 20 };
    if (search.value) params.name = search.value;
    const { data } = await api.get("/products", { params });
    products.value = data.data;
    Object.assign(pagination, data.pagination);
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  try {
    const { data } = await api.get("/categories");
    categories.value = data.data;
  } catch (error) {
    showToast?.(error.response?.data?.message || t("common.error"), "error");
  }
}

let debounceTimer;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchProducts(1), 400);
}

function resetForm() {
  Object.assign(form, createDefaultForm());
  uploaderSeed.value += 1;
  formError.value = "";
}

function closeForm() {
  formModal.value = false;
  formError.value = "";
}

function closeDetails() {
  detailsModal.value = false;
  detailsLoading.value = false;
  viewedProduct.value = null;
}

async function openDetails(productCard) {
  detailsModal.value = true;
  detailsLoading.value = true;
  viewedProduct.value = null;

  try {
    const { data } = await api.get(`/products/${productCard.id}`);
    viewedProduct.value = data.data;
  } catch (error) {
    showToast?.(error.response?.data?.message || t("common.error"), "error");
    closeDetails();
  } finally {
    detailsLoading.value = false;
  }
}

function openCreate() {
  editingProduct.value = null;
  formLoading.value = false;
  resetForm();
  formModal.value = true;
}

async function openEdit(productCard) {
  closeDetails();
  editingProduct.value = productCard;
  formModal.value = true;
  formLoading.value = true;
  resetForm();

  try {
    const { data } = await api.get(`/products/${productCard.id}`);
    const product = data.data;
    const colorKeyById = new Map();
    const colors = (product.color_options || []).map((color) => {
      const state = createColorState({
        id: color.id,
        client_key: createClientKey(),
        name: color.name,
        value: color.value,
        existingImages: color.images || [],
      });
      colorKeyById.set(color.id, state.client_key);
      return state;
    });

    const nextVariantStocks = {};
    (product.variants || []).forEach((variant) => {
      const colorKey = variant.color_id ? colorKeyById.get(variant.color_id) : null;
      nextVariantStocks[getVariantKey(colorKey, variant.size_value)] = Number(variant.stock || 0);
    });

    Object.assign(form, {
      name: product.name || "",
      name_ar: product.name_ar || "",
      category_id: product.category_id || "",
      price: product.price || "",
      net_profit: product.net_profit ?? "",
      old_price: product.old_price || "",
      stock: product.stock || 0,
      description: product.description || "",
      description_ar: product.description_ar || "",
      specs_en: product.specs_en || "",
      specs_ar: product.specs_ar || "",
      is_active: !!product.is_active,
      images: [],
      existingImages: product.images || [],
      size_mode: product.size_mode || "none",
      size_options: Array.isArray(product.size_options) ? [...product.size_options] : [],
      colors,
      variantStocks: nextVariantStocks,
    });

    uploaderSeed.value += 1;
  } catch (error) {
    showToast?.(error.response?.data?.message || t("common.error"), "error");
    formModal.value = false;
  } finally {
    formLoading.value = false;
  }
}

function setSizeMode(mode) {
  form.size_mode = mode;
  if (mode === "none") {
    form.size_options = [];
    return;
  }
  const allowed = mode === "numeric" ? NUMERIC_SIZES : ALPHA_SIZES;
  form.size_options = allowed.filter((size) => form.size_options.includes(size));
}

function toggleSizeOption(sizeValue) {
  if (form.size_options.includes(sizeValue)) {
    form.size_options = form.size_options.filter((size) => size !== sizeValue);
    return;
  }
  form.size_options = [...form.size_options, sizeValue].sort(
    (left, right) => availableSizes.value.indexOf(left) - availableSizes.value.indexOf(right),
  );
}

function addColor() {
  form.colors.push(createColorState());
}

function removeColor(index) {
  form.colors.splice(index, 1);
}

function onImagesUpdate(newFiles) {
  form.images = newFiles;
}

function onColorImagesUpdate(clientKey, files) {
  const color = form.colors.find((entry) => entry.client_key === clientKey);
  if (color) color.newImages = files;
}
function getVariantKey(colorKey, sizeValue) {
  return `${colorKey || "base"}::${sizeValue || "base"}`;
}

function getVariantStock(colorKey, sizeValue) {
  return form.variantStocks[getVariantKey(colorKey, sizeValue)] ?? 0;
}

function setVariantStock(colorKey, sizeValue, value) {
  form.variantStocks[getVariantKey(colorKey, sizeValue)] = Math.max(0, Number.parseInt(value, 10) || 0);
  if (hasVariants.value) form.stock = totalVariantStock.value;
}

function getColorState(clientKey) {
  return form.colors.find((entry) => entry.client_key === clientKey);
}

function getComboLabel(combo) {
  const colorIndex = combo.color_key ? form.colors.findIndex((entry) => entry.client_key === combo.color_key) : -1;
  const color = colorIndex >= 0 ? form.colors[colorIndex] : null;

  const colorLabel = color ? (color.name || `${uiText.value.colorLabel} ${colorIndex + 1}`) : null;

  if (colorLabel && combo.size_value) return `${colorLabel} / ${combo.size_value}`;
  if (colorLabel) return colorLabel;
  return combo.size_value || "Base";
}

function getViewedVariantLabel(variant) {
  if (variant.color_name && variant.size_value) {
    return `${variant.color_name} / ${variant.size_value}`;
  }
  if (variant.color_name) return variant.color_name;
  if (variant.size_value) return variant.size_value;
  return "Base";
}

function getViewedMainImage(product) {
  return (
    product?.main_image ||
    product?.images?.find((image) => image?.image_url)?.image_url ||
    "https://placehold.co/900x700"
  );
}

function getPreparedColors() {
  return form.colors
    .map((color, index) => ({
      id: color.id || null,
      client_key: color.client_key,
      name: String(color.name || "").trim(),
      value: String(color.value || "").trim(),
      sort_order: index,
      existingImages: color.existingImages || [],
      newImages: color.newImages || [],
    }))
    .filter((color) => color.name && color.value);
}

function validateForm() {
  if (!form.name || !form.category_id || !form.price || !form.description) return "Please fill in the required product fields.";
  if (form.net_profit === "" || Number(form.net_profit) < 0) return "Net profit must be zero or greater.";
  if (form.old_price && Number(form.old_price) <= Number(form.price)) return "Original price must be higher than current price.";
  if (form.size_mode !== "none" && form.size_options.length === 0) return "Please choose at least one size option.";

  const preparedColors = getPreparedColors();
  if (preparedColors.length !== form.colors.length) return "Each color must have a name and a valid hex value.";

  for (const color of preparedColors) {
    if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(color.value)) return `Color "${color.name}" must use a valid hex color.`;
    const uploadedCount = (color.newImages || []).filter(Boolean).length;
    const existingCount = Array.isArray(color.existingImages) ? color.existingImages.length : 0;
    if (uploadedCount > 5) return `Color "${color.name}" cannot have more than 5 images.`;
    if (!editingProduct.value && uploadedCount === 0) return `Please upload at least one image for "${color.name}".`;
    if (editingProduct.value && uploadedCount === 0 && existingCount === 0) return `Color "${color.name}" must keep at least one image.`;
  }

  const generalImagesCount = (form.images || []).filter(Boolean).length + (form.existingImages || []).length;
  if (!preparedColors.length && generalImagesCount === 0) return "Please upload at least one general product image.";

  if (hasVariants.value) {
    for (const combo of variantCombos.value) {
      const stockValue = form.variantStocks[getVariantKey(combo.color_key, combo.size_value)];
      if (stockValue === undefined || Number(stockValue) < 0) return "Every variant combination must have a valid stock value.";
    }
  }

  return "";
}

async function saveProduct() {
  formError.value = validateForm();
  if (formError.value) return;

  saving.value = true;
  try {
    const preparedColors = getPreparedColors();
    const variantStock = variantCombos.value.map((combo) => ({
      color_key: combo.color_key,
      size_value: combo.size_value,
      stock: Number(getVariantStock(combo.color_key, combo.size_value) || 0),
    }));

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("name_ar", form.name_ar || "");
    payload.append("category_id", form.category_id);
    payload.append("price", form.price);
    payload.append("net_profit", form.net_profit);
    payload.append("old_price", form.old_price || "");
    payload.append("stock", hasVariants.value ? totalVariantStock.value : Number(form.stock || 0));
    payload.append("description", form.description);
    payload.append("description_ar", form.description_ar || "");
    payload.append("specs_en", form.specs_en || "");
    payload.append("specs_ar", form.specs_ar || "");
    payload.append("is_active", form.is_active ? 1 : 0);
    payload.append("size_mode", form.size_mode);
    payload.append("size_options", JSON.stringify(form.size_options));
    payload.append(
      "colors",
      JSON.stringify(preparedColors.map(({ id, client_key, name, value, sort_order }) => ({
        id,
        client_key,
        name,
        value,
        sort_order,
      }))),
    );
    payload.append("variant_stock", JSON.stringify(variantStock));

    (form.images || []).filter(Boolean).forEach((file) => payload.append("images", file));
    preparedColors.forEach((color) => {
      (color.newImages || []).filter(Boolean).forEach((file) => payload.append(`color_images:${color.client_key}`, file));
    });

    if (editingProduct.value) {
      await api.put(`/products/${editingProduct.value.id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      await api.post("/products", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    closeForm();
    showToast?.(
      editingProduct.value ? `${t("common.update")} successful` : `${t("common.create")} successful`,
      "success",
    );
    await fetchProducts(pagination.page);
  } catch (error) {
    formError.value = error.response?.data?.message || t("admin.saveError");
  } finally {
    saving.value = false;
  }
}

function askDelete(product) {
  productToDelete.value = product;
  deleteModal.value = true;
}

async function deleteProduct() {
  try {
    await api.delete(`/products/${productToDelete.value.id}`);
    showToast?.(`${t("common.delete")} successful`, "success");
    await fetchProducts(pagination.page);
  } catch (error) {
    showToast?.(error.response?.data?.message || t("common.error"), "error");
  }
}

onMounted(() => {
  fetchProducts();
  loadCategories();
});
</script>

<style scoped>
.modal-enter-active {
  transition: all 0.25s ease;
}

.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
