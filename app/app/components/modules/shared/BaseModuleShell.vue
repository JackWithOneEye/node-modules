<script lang="ts" setup>
import { computed } from 'vue'

export type BaseModuleShellProps = {
  id: string
  type: string
  title?: string
}

const props = defineProps<BaseModuleShellProps>()

const moduleEntry = computed(() => getModuleCatalogEntry(props.type))
const moduleLabel = computed(() => moduleEntry.value?.label ?? props.type)
const moduleIcon = computed(() => moduleEntry.value?.icon ?? 'pi pi-box')
</script>

<template>
  <section
    class="module-shell rounded-md border border-white/70 bg-black/80 px-2 py-2 shadow-sm"
    :data-node-id="id"
    :data-module-type="type"
  >
    <header class="mb-2 flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <i
          class="text-xs opacity-80"
          :class="moduleIcon"
        />
        <span class="truncate text-[10px] uppercase tracking-wide text-white/70">{{ moduleLabel }}</span>
      </div>
      <div class="flex items-center gap-1">
        <slot name="actions" />
        <slot name="toolbar" />
      </div>
    </header>
    <div class="mb-2 text-sm leading-none">
      <slot name="title">
        {{ title || moduleLabel }}
      </slot>
    </div>
    <div class="flex flex-col gap-2">
      <slot />
    </div>
  </section>
</template>

<style>
/*
 * Selected-state visuals are driven entirely by the Vue Flow ancestor class
 * so individual modules don't need to thread a `selected` prop through.
 */
.vue-flow__node.selected>.module-shell {
  border-color: rgb(255 255 255);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6);
}
</style>
