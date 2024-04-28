<script lang="ts" setup>
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
    items: [
      [
        {
          label: 'Inputs',
          items: [
            {
              type: AudioModuleType.AudioSource,
              icon: 'pi pi-microphone',
              label: 'Audio Source',
            },
            {
              type: AudioModuleType.MidiInput,
              icon: 'pi pi-th-large',
              label: 'MIDI Input',
            },
          ],
        },
      ],
      [
        {
          label: 'Ananlysis',
          items: [
            {
              type: AudioModuleType.Oscilloscope,
              icon: 'pi pi-wave-pulse',
              label: 'Oscilloscope',
            },
          ],
        },
      ],
      [
        {
          label: 'Effects',
          items: [
            {
              type: AudioModuleType.Gain,
              icon: 'pi pi-gauge',
              label: 'Gain',
            },
          ],
        },
      ],
      [
        {
          label: 'Outputs',
          items: [
            {
              type: AudioModuleType.Destination,
              icon: 'pi pi-volume-up',
              label: 'Destination',
            },
          ],
        },
      ],
    ],
  },
])
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <MegaMenu
      class="sticky w-full z-10"
      :model="items"
    >
      <template #item="{ item }">
        <div
          v-if="item.root"
          v-ripple
          class="flex items-center cursor-pointer p-2 gap-2 border rounded-md"
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
