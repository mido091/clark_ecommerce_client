<template>
  <div class="flex flex-col md:flex-row gap-4 h-[400px] md:h-[600px]">
    <!-- Thumbnail strip (Vertical on Desktop, Hidden on Mobile) -->
    <div
      v-if="images && images.length > 1"
      class="hidden md:flex flex-col gap-3 w-24 overflow-y-auto custom-scrollbar pe-1"
    >
      <button
        v-for="(img, i) in images"
        :key="img.id"
        @click="activeIndex = i"
        :class="[
          'shrink-0 w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 relative border-2',
          i === activeIndex
            ? 'border-primary-500 shadow-sm opacity-100'
            : 'border-transparent opacity-60 hover:opacity-100',
        ]"
      >
        <img
          :src="img.image_url"
          :alt="`Thumb ${i + 1}`"
          class="w-full h-full object-cover"
          @error="onError"
        />
      </button>
    </div>

    <!-- Main image viewer -->
    <div
      class="flex-1 relative bg-surface dark:bg-black/20 rounded-3xl overflow-hidden group cursor-crosshair border border-borderThin"
    >
      <Transition name="img-fade" mode="out-in">
        <img
          :key="activeIndex"
          :src="activeImage.image_url"
          :alt="`Product image ${activeIndex + 1}`"
          class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-[1000ms] ease-out"
          @error="onError"
        />
      </Transition>

      <!-- Prev / Next arrows (shown only when multiple images) -->
      <template v-if="images && images.length > 1">
        <button
          @click="prev"
          class="absolute start-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-md hover:scale-110 transition-transform rounded-full"
        >
          <ChevronRight class="w-5 h-5 text-textPrimary" />
        </button>
        <button
          @click="next"
          class="absolute end-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-md hover:scale-110 transition-transform rounded-full"
        >
          <ChevronLeft class="w-5 h-5 text-textPrimary" />
        </button>
      </template>
    </div>

    <div
      v-if="images && images.length > 1"
      class="md:hidden flex gap-3 overflow-x-auto pb-2 mt-2 custom-scrollbar px-1"
    >
      <button
        v-for="(img, i) in images"
        :key="img.id"
        @click="activeIndex = i"
        :class="[
          'shrink-0 w-20 h-20 rounded-2xl overflow-hidden transition-all duration-300 border-2',
          i === activeIndex
            ? 'border-primary-500 shadow-sm opacity-100'
            : 'border-transparent opacity-60',
        ]"
      >
        <img
          :src="img.image_url"
          :alt="`Thumb ${i + 1}`"
          class="w-full h-full object-cover"
          @error="onError"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

const props = defineProps({
  images: { type: Array, required: true },
});

const activeIndex = ref(
  Math.max(
    props.images.findIndex((i) => i.is_main === 1),
    0,
  ),
);

const activeImage = computed(
  () => props.images[activeIndex.value] || { image_url: "" },
);

watch(
  () => props.images,
  (images) => {
    const nextIndex = Math.max(
      images.findIndex((image) => image.is_main === 1),
      0,
    );
    activeIndex.value = nextIndex;
  },
  { deep: true },
);

function prev() {
  activeIndex.value =
    (activeIndex.value - 1 + props.images.length) % props.images.length;
}
function next() {
  activeIndex.value = (activeIndex.value + 1) % props.images.length;
}
function onError(e) {
  e.target.src =
    "https://placehold.co/600x600/f1f5f9/94a3b8?text=Image+Not+Found";
}
</script>

<style scoped>
.img-fade-enter-active,
.img-fade-leave-active {
  transition: opacity 0.25s ease-out;
}
.img-fade-enter-from,
.img-fade-leave-to {
  opacity: 0;
}
</style>
