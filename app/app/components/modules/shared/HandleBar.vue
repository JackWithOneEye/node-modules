<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core'

export type HandleBarItem = { id: string, label: string, type: 'source' | 'target' }
export type HandleBarProps = {
  handles: HandleBarItem[]
  position: 'left' | 'right'
  offset?: number // rem
  spacing?: number // rem
}
const props = withDefaults(defineProps<HandleBarProps>(), {
  offset: 2.5,
  spacing: 1.5,
})

const handlePosition = props.position === 'left' ? Position.Left : Position.Right
</script>

<template>
  <div class="flex flex-col gap-4">
    <template
      v-for="(handle, index) in handles"
      :key="handle.id"
    >
      <HandleLabel>
        {{ handle.label }}
      </HandleLabel>
      <Handle
        :id="handle.id"
        :style="{ top: `${(offset + (index * spacing))}rem` }"
        :type="handle.type"
        :position="handlePosition"
      />
    </template>
  </div>
</template>
