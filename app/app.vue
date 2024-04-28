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
  @apply bg-gray-950 text-slate-50
}

.vue-flow__node.selected {
  @apply bg-gray-900
}

.vue-flow__controls {
  @apply flex flex-wrap justify-center border-white
}

.vue-flow__controls .vue-flow__controls-button {
  @apply border-none border-r border-[#eee]
}

.vue-flow__controls .vue-flow__controls-button {
  @apply bg-gray-800 fill-slate-50 border-none
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
