<template>
  <div
    class="relative overflow-hidden bg-surface-variant/20"
    :class="[containerClass, !isLoaded ? 'animate-pulse' : '']"
    :style="aspectRatioStyle"
  >
    <!-- Blur-up placeholder (Low-res or solid color) -->
    <div
      v-if="!isLoaded && showPlaceholder"
      class="absolute inset-0 z-0 transition-opacity duration-500"
      :class="placeholderClass"
    >
      <div 
        v-if="placeholderUrl" 
        class="w-full h-full bg-cover bg-center filter blur-xl scale-110 opacity-50"
        :style="{ backgroundImage: `url(${placeholderUrl})` }"
      ></div>
      <div v-else class="w-full h-full bg-slate-200 dark:bg-slate-800"></div>
    </div>

    <picture>
      <!-- Modern formats (WebP/AVIF) handled via CDN if supported or via browsers -->
      <source
        v-if="optimizedSources"
        v-for="source in optimizedSources"
        :key="source.srcset"
        :srcset="source.srcset"
        :type="source.type"
        :sizes="sizes"
      />
      
      <img
        ref="imgRef"
        :src="currentSrc"
        :alt="alt"
        :loading="loading"
        :width="width"
        :height="height"
        :class="[
          'w-full h-full object-cover transition-all duration-700 ease-in-out',
          isLoaded ? 'opacity-100' : 'opacity-0 scale-105',
          imgClass
        ]"
        :fetchpriority="priority ? 'high' : 'auto'"
        decoding="async"
        @load="onLoad"
        @error="onError"
      />
    </picture>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
  aspectRatio: { type: String, default: '1/1' },
  containerClass: { type: String, default: '' },
  imgClass: { type: String, default: '' },
  loading: { type: String, default: 'lazy' }, // 'eager' or 'lazy'
  priority: { type: Boolean, default: false },
  sizes: { type: String, default: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' },
  showPlaceholder: { type: Boolean, default: true },
  placeholderUrl: { type: String, default: '' },
  placeholderClass: { type: String, default: '' },
});

const isLoaded = ref(false);
const isError = ref(false);
const imgRef = ref(null);

const aspectRatioStyle = computed(() => {
  return { aspectRatio: props.aspectRatio };
});

const currentSrc = computed(() => {
  if (isError.value) return '/placeholder-product.png';
  return props.src;
});

/**
 * Generates srcset for Unsplash or Pexels images.
 * In a real production environment, this would ideally use a 
 * dedicated image proxy (like Vercel Image Optimization or Cloudinary).
 */
const optimizedSources = computed(() => {
  if (!props.src) return null;

  const isUnsplash = props.src.includes('unsplash.com');
  const isPexels = props.src.includes('images.pexels.com');

  if (isUnsplash) {
    const baseUrl = new URL(props.src);
    baseUrl.searchParams.delete('w');
    baseUrl.searchParams.set('q', '80');
    baseUrl.searchParams.set('fit', 'crop');

    const generateSrcset = (format) => {
      const sizes = [400, 800, 1200];
      return sizes.map(s => {
        const url = new URL(baseUrl);
        url.searchParams.set('w', s);
        if (format) url.searchParams.set('fm', format);
        return `${url.toString()} ${s}w`;
      }).join(', ');
    };

    return [
      { type: 'image/avif', srcset: generateSrcset('avif') },
      { type: 'image/webp', srcset: generateSrcset('webp') }
    ];
  }

  // Add more CDN support as needed
  return null;
});

function onLoad() {
  isLoaded.value = true;
}

function onError(e) {
  isError.value = true;
  isLoaded.value = true; // Stop skeleton
}

onMounted(() => {
  // Check if already complete (e.g. cached)
  if (imgRef.value?.complete) {
    onLoad();
  }
});
</script>

<style scoped>
/* Low quality image blur effect */
.blur-load {
  filter: blur(20px);
  clip-path: inset(0);
}
</style>
