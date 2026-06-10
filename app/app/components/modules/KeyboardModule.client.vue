<script lang="ts" setup>
export type KeyboardModuleProps = {
  id: string
  type: string
  title?: string
  octaveShift?: number
}
const props = withDefaults(defineProps<KeyboardModuleProps>(), {
  title: 'Keyboard',
  octaveShift: 0,
})

const store = useAudioContextStore()
const audioContext = store.getAudioContext()

const gateNode = new ConstantSourceNode(audioContext, { offset: 0 })
const noteNode = new ConstantSourceNode(audioContext, { offset: 0 })
const retriggerNode = new ConstantSourceNode(audioContext, { offset: 0 })
gateNode.start()
noteNode.start()
retriggerNode.start()

const octaveShift = useParam('octaveShift', props.octaveShift)
const octaveLabel = computed(() => {
  const base = 4 + octaveShift.value
  return `C${base}`
})
const baseMidi = computed(() => 60 + octaveShift.value * 12)

const nodesMap: Record<string, ConstantSourceNode> = {
  note: noteNode,
  gate: gateNode,
  retrigger: retriggerNode,
}

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect(outputId, target, targetIndex) {
      const node = nodesMap[outputId]
      if (!node) {
        return
      }
      if (target instanceof AudioParam) {
        node.connect(target, 0)
        return
      }
      node.connect(target, 0, targetIndex)
    },
    disconnect(outputId, target, targetIndex) {
      const node = nodesMap[outputId]
      if (!node) {
        return
      }
      if (target instanceof AudioParam) {
        node.disconnect(target, 0)
        return
      }
      node.disconnect(target, 0, targetIndex)
    },
  },
})

const WHITE_KEY_SEMITONES = [0, 2, 4, 5, 7, 9, 11]
const BLACK_KEY_SEMITONES = [1, 3, 6, 8, 10]
const BLACK_KEY_LEFT_PCT = [14.2857, 28.5714, 57.1429, 71.4286, 85.7143]

const activeKey = ref<number | null>(null)
const activePointerId = ref<number | null>(null)

function midiToFreq(midi: number): number {
  return Math.round(Math.pow(2, (midi - 69) / 12) * 440 * 100) * 0.01
}

function keyOn(midi: number) {
  activeKey.value = midi
  store.setMultipleParamValues(
    [gateNode.offset, 1],
    [noteNode.offset, midiToFreq(midi)],
    [retriggerNode.offset, 1, 'pulse'],
  )
}

function keyOff() {
  if (activeKey.value !== null) {
    activeKey.value = null
  }
  store.setParamValue(gateNode.offset, 0)
}

function onKeyPointerDown(event: PointerEvent, midi: number) {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return
  }
  activePointerId.value = event.pointerId
  keyOn(midi)
}

function onWindowPointerUp(event: PointerEvent) {
  if (activePointerId.value !== null && event.pointerId !== activePointerId.value) {
    return
  }
  activePointerId.value = null
  keyOff()
}

function onWindowPointerCancel(event: PointerEvent) {
  if (activePointerId.value !== null && event.pointerId !== activePointerId.value) {
    return
  }
  activePointerId.value = null
  keyOff()
}

function onWindowMouseUp() {
  if (activePointerId.value !== null) {
    activePointerId.value = null
  }
  keyOff()
}

function onWindowBlur() {
  if (activePointerId.value !== null) {
    activePointerId.value = null
  }
  keyOff()
}

function onVisibilityChange() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    onWindowBlur()
  }
}

const abortCtrlr = new AbortController()
onMounted(() => {
  window.addEventListener('pointerup', onWindowPointerUp, { signal: abortCtrlr.signal })
  window.addEventListener('pointercancel', onWindowPointerCancel, { signal: abortCtrlr.signal })
  window.addEventListener('mouseup', onWindowMouseUp, { signal: abortCtrlr.signal })
  window.addEventListener('blur', onWindowBlur, { signal: abortCtrlr.signal })
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange, { signal: abortCtrlr.signal })
  }
})

onUnmounted(() => {
  abortCtrlr.abort()
  activePointerId.value = null
  keyOff()
  gateNode.disconnect()
  gateNode.stop()
  noteNode.disconnect()
  noteNode.stop()
  retriggerNode.disconnect()
  retriggerNode.stop()
  store.unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <div class="flex ps-2 pt-1 pb-2">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-center gap-1">
          <UButton
            icon="ph:minus"
            size="xs"
            variant="outline"
            color="neutral"
            :disabled="octaveShift <= -2"
            @click="octaveShift--"
          />
          <span class="text-xs text-white/70 w-8 text-center font-mono">{{ octaveLabel }}</span>
          <UButton
            icon="ph:plus"
            size="xs"
            variant="outline"
            color="neutral"
            :disabled="octaveShift >= 2"
            @click="octaveShift++"
          />
        </div>
        <div
          class="relative w-42 h-20 bg-neutral-700 border border-neutral-600 rounded-b select-none touch-none"
          @contextmenu.prevent
        >
          <div class="absolute inset-0 flex">
            <div
              v-for="(semi, i) in WHITE_KEY_SEMITONES"
              :key="'w' + i"
              class="flex-1 h-full border border-neutral-400 border-t-0 z-10 cursor-pointer transition-colors duration-50"
              :class="activeKey === baseMidi + semi ? 'bg-indigo-300' : 'bg-neutral-200 hover:bg-indigo-200'"
              @pointerdown.prevent="onKeyPointerDown($event, baseMidi + semi)"
            />
          </div>
          <div class="absolute inset-x-0 top-0 h-[60%] z-20 pointer-events-none">
            <div
              v-for="(semi, i) in BLACK_KEY_SEMITONES"
              :key="'b' + i"
              class="absolute w-[calc((100%/7)*0.6)] h-full border border-black border-t-0 -translate-x-1/2 cursor-pointer pointer-events-auto transition-colors duration-50"
              :class="activeKey === baseMidi + semi ? 'bg-indigo-500' : 'bg-neutral-800 hover:bg-indigo-700'"
              :style="{ left: BLACK_KEY_LEFT_PCT[i] + '%' }"
              @pointerdown.prevent="onKeyPointerDown($event, baseMidi + semi)"
            />
          </div>
        </div>
      </div>
      <ModulePortRail
        position="right"
        :ports="[
          { id: 'note', label: 'note', signal: 'midi' },
          { id: 'gate', label: 'gate', signal: 'gate' },
          { id: 'retrigger', label: 'retrig', signal: 'gate' },
        ]"
      />
    </div>
  </BaseModuleShell>
</template>
