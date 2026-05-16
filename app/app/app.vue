<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
@import 'primeicons/primeicons.css';

@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';

.nodrag {
  @apply cursor-auto
}

.vue-flow__node {
  @apply bg-black text-white
}

.vue-flow__node.selected {
  @apply bg-black
}

.vue-flow__edge.selected .vue-flow__edge-path {
  stroke-width: 3;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
}

.vue-flow__controls {
  @apply flex flex-wrap justify-center border-white
}

.vue-flow__controls .vue-flow__controls-button {
  @apply border-none border-r border-white
}

.vue-flow__controls .vue-flow__controls-button {
  @apply bg-black fill-white border border-white
}

.vue-flow__controls .vue-flow__controls-button:hover {
  @apply bg-gray-700
}

.vue-flow__controls {
  @apply bottom-4 right-4 left-auto top-auto
}

.vue-flow__minimap {
  @apply bg-neutral-900 border border-neutral-700 rounded top-4 right-4 bottom-auto left-auto max-h-48
}

.vue-flow__minimap-node {
  @apply fill-neutral-600 stroke-neutral-500
}

.vue-flow__minimap-mask {
  @apply fill-black/50
}
/*
.dark .vue-flow__edge-textbg {
  fill: #292524
}

.dark .vue-flow__edge-text {
  fill: #fffffb
} */
</style>
