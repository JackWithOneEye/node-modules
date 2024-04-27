<template>
  <div class="h-screen">
    <ClientOnly
      fallback-tag="span"
      fallback="....."
    >
      <ModularEditor />
    </ClientOnly>
  </div>
</template>

<style>
@import 'primevue/resources/themes/aura-dark-green/theme.css';
@import 'primeicons/primeicons.css';
</style>
