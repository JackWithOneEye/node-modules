<script lang="ts" setup>
import { computed } from 'vue'
import { Position } from '@vue-flow/core'
import type { ModulePort } from '~/utils/module'

export type ModulePortRowProps = {
  input?: ModulePort
  output?: ModulePort
}

const props = defineProps<ModulePortRowProps>()

/**
 * Pick the narrowest possible grid template so empty sides do not leave
 * phantom columns / extra gap. Columns:
 *   left handle / left label / body / right label / right handle
 *
 * The grid uses no `gap`; spacing is controlled per-edge so labels sit
 * close to their handles and farther from the body.
 */
const gridTemplate = computed(() => {
  const cols: string[] = []
  if (props.input) {
    cols.push('16px', 'auto')
  }
  cols.push('minmax(0,1fr)')
  if (props.output) {
    cols.push('auto', '16px')
  }
  return cols.join(' ')
})
</script>

<template>
  <div
    class="grid items-center gap-0"
    :style="{ gridTemplateColumns: gridTemplate }"
  >
    <template v-if="input">
      <div class="relative h-6 w-4">
        <ModuleHandle
          :id="input.id"
          type="target"
          :position="Position.Left"
          :signal="input.signal"
        />
      </div>
      <HandleLabel class="justify-self-start pl-0.5 pr-3">
        {{ input.label }}
      </HandleLabel>
    </template>
    <div class="min-w-0">
      <slot />
    </div>
    <template v-if="output">
      <HandleLabel class="justify-self-end pl-3 pr-0.5">
        {{ output.label }}
      </HandleLabel>
      <div class="relative h-6 w-4">
        <ModuleHandle
          :id="output.id"
          type="source"
          :position="Position.Right"
          :signal="output.signal"
        />
      </div>
    </template>
  </div>
</template>
