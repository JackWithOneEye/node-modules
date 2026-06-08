<script lang="ts" setup>
import { Position, type HandleType } from '@vue-flow/core'
import type { SignalType } from '~/utils/module'

interface Props {
  handleId: string
  handleType?: HandleType
  handleSignal: SignalType
  handlePosition?: Position
}

withDefaults(defineProps<Props>(), {
  handleType: 'target',
  handlePosition: Position.Bottom,
})
</script>

<template>
  <div class="relative flex flex-col items-center select-none pb-2">
    <slot />
    <div class="relative h-1">
      <ModuleHandle
        :id="handleId"
        :type="handleType"
        :position="handlePosition"
        :signal="handleSignal"
      />
    </div>
  </div>
</template>
