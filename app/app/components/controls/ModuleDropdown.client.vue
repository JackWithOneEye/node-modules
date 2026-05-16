<script lang="ts" setup>
import { moduleOptions } from '~/utils/module'

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => window.addEventListener('click', onClickOutside))
onBeforeUnmount(() => window.removeEventListener('click', onClickOutside))
</script>

<template>
  <div
    ref="dropdownRef"
    class="relative"
  >
    <button
      class="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
      @click.stop="toggle"
    >
      <i class="pi pi-box" />
      <span class="hidden [@media(min-width:1200px)]:inline">Modules</span>
      <i class="pi pi-angle-down text-neutral-400 text-[10px]" />
    </button>
    <div
      v-if="open"
      class="absolute left-0 mt-1 bg-neutral-900 border border-neutral-700 rounded shadow-xl w-56 max-h-[32rem] overflow-y-auto z-50"
    >
      <div
        v-for="group in moduleOptions.flat()"
        :key="group.label"
        class="border-b border-neutral-800 last:border-b-0"
      >
        <div class="px-2 py-1 text-[10px] font-medium text-neutral-500 uppercase tracking-wide">
          {{ group.label }}
        </div>
        <div class="px-1 pb-1 space-y-0.5">
          <DropNewModule
            v-for="item in group.items"
            :key="item.type"
            :icon="item.icon"
            :label="item.label"
            :type="item.type"
            class="rounded hover:bg-white/5 cursor-grab active:cursor-grabbing"
          />
        </div>
      </div>
    </div>
  </div>
</template>
