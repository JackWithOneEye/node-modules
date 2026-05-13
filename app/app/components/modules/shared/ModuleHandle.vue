<script lang="ts" setup>
import { Handle, type Position } from '@vue-flow/core'
import type { SignalType } from '~/utils/module'

export type ModuleHandleProps = {
  id: string
  type: 'source' | 'target'
  position: Position
  signal: SignalType
}

const props = defineProps<ModuleHandleProps>()

const parentNodeId = inject(ParentNodeIdKey)
const handleSignals = inject(HandleSignalsKey)

if (import.meta.dev && (!parentNodeId || !handleSignals)) {
  console.warn('[ModuleHandle] missing ParentNodeId / HandleSignals — handle will render but signal registry access will be skipped')
}

const borderColor = computed(() => getSignalColor(props.signal))
const signalGlow = computed(() => getSignalGlowColor(props.signal))

watch(() => props.signal, (s) => {
  if (parentNodeId && handleSignals) {
    handleSignals.register(parentNodeId, props.id, s)
  }
}, { immediate: true })

onUnmounted(() => {
  if (parentNodeId && handleSignals) {
    handleSignals.unregister(parentNodeId, props.id)
  }
})
</script>

<template>
  <Handle
    :id="id"
    :type="type"
    :position="position"
    :data-signal="signal ?? undefined"
    :style="{ borderColor, '--signal-color': borderColor, '--signal-glow': signalGlow }"
    class="module-handle !h-3 !w-3 !border !bg-black before:absolute before:-inset-2 before:content-[''] transition-shadow duration-150 hover:shadow-[0_0_0_4px_var(--signal-glow)]"
  />
</template>
