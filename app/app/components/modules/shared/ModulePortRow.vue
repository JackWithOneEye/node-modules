<script lang="ts" setup>
import { computed } from 'vue'
import { Position } from '@vue-flow/core'
import type { ModulePort } from '~/utils/module'

export type ModulePortRowProps = {
  input?: ModulePort
  output?: ModulePort
}

const props = defineProps<ModulePortRowProps>()

const gridTemplate = computed(() => {
  const cols: string[] = []
  if (props.input) {
    cols.push('8px')
  }
  cols.push('minmax(0,1fr)')
  if (props.output) {
    cols.push('8px')
  }
  return cols.join(' ')
})
</script>

<template>
  <div
    class="grid items-center"
    :style="{ gridTemplateColumns: gridTemplate }"
  >
    <template v-if="input">
      <div class="relative h-2 w-2 translate-x-[-4.5px]">
        <UTooltip
          :text="input.id"
          arrow
          :delay-duration="0"
          :disable-closing-trigger="true"
          :content="{ side: 'left', sideOffset: 8 }"
        >
          <ModuleHandle
            :id="input.id"
            type="target"
            :position="Position.Left"
            :signal="input.signal"
          />
        </UTooltip>
      </div>
    </template>
    <div class="min-w-0">
      <slot />
    </div>
    <template v-if="output">
      <div class="relative h-2 w-2 translate-x-[4.5px]">
        <UTooltip
          :text="output.id"
          arrow
          :delay-duration="0"
          :disable-closing-trigger="true"
          :content="{ side: 'right', sideOffset: 8 }"
        >
          <ModuleHandle
            :id="output.id"
            type="source"
            :position="Position.Right"
            :signal="output.signal"
          />
        </UTooltip>
      </div>
    </template>
  </div>
</template>
