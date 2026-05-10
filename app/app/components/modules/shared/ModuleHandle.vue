<script lang="ts" setup>
import { Handle, type Position } from '@vue-flow/core'
import type { SignalType } from '~/utils/module'

export type ModuleHandleProps = {
  id: string
  type: 'source' | 'target'
  position: Position
  signal?: SignalType
}

defineProps<ModuleHandleProps>()
</script>

<template>
  <Handle :id="id" :type="type" :position="position" :data-signal="signal ?? null"
    class="module-handle !h-3 !w-3 !border !border-white !bg-black before:absolute before:-inset-2 before:content-[''] transition-shadow duration-150 hover:!shadow-[0_0_0_4px_rgba(255,255,255,0.2)]" />
</template>
