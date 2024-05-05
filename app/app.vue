<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
@import 'primevue/resources/themes/aura-dark-cyan/theme.css';
@import 'primeicons/primeicons.css';

@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';

.nodrag {
  @apply cursor-auto
}

.vue-flow__node {
  @apply bg-black text-white
}

.vue-flow__node.selected {
  @apply bg-black
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
/*
.dark .vue-flow__edge-textbg {
  fill: #292524
}

.dark .vue-flow__edge-text {
  fill: #fffffb
} */
</style>
