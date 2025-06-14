<script lang="ts" setup>
import { moduleOptions } from '~/utils/module'

const { loading, save } = useDataStore()
const toast = useToast()

async function saveData() {
  await save()
  toast.add({ severity: 'success', summary: 'success!', life: 3000 })
}

const items = ref([
  {
    label: 'Modules',
    icon: 'pi pi-box',
    root: true,
    items: moduleOptions,
  },
])
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <MegaMenu
      class="h-full z-10 bg-gray-800 border-b border-gray-600"
      :model="items"
      :pt="{
        panel: {
          class: tw`p-2`,
        },
        submenuLabel: {
          class: tw`px-2 py-1 text-sm font-semibold mb-1`,
        },
        submenu: {
          class: tw`gap-1`,
        },
        grid: {
          class: tw`gap-4`,
        },
      }"
    >
      <template #item="{ item }">
        <div
          v-if="item.root"
          v-ripple
          class="flex items-center cursor-pointer p-2 gap-2 border rounded-md max-w-screen-sm"
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
          <i class="pi pi-angle-down" />
        </div>

        <DropNewModule
          v-else
          :icon="item.icon"
          :label="item.label as string"
          :type="item.type"
        />
      </template>
      <template #end>
        <div class="flex gap-2">
          <Button
            class="pi pi-save"
            @click="saveData"
          />

          <Button
            v-if="loading"
            class="pi pi-spin pi-spinner"
          />
          <PlayButton v-else />
        </div>
      </template>
    </MegaMenu>
    <slot />
    <Toast />
  </div>
</template>
