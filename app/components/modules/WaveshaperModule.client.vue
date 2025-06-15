<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type WaveshaperNodeModuleProps = {
  id: string
  type: string
  title?: string
  waveshaper?: 'sin' | 'sigmoid' | 'tanh' | 'x-root'
  modifier?: number // 0 - 100
}
const props = withDefaults(defineProps<WaveshaperNodeModuleProps>(), {
  title: 'Waveshaper',
  waveshaper: 'tanh',
  modifier: 0,
})

const { audioContext, registerModule, unregisterModule } = useAudioContextStore()

const waveshaperTables = useWaveshapersStore()

const waveshaperNode = new WaveShaperNode(audioContext, { curve: waveshaperTables[props.waveshaper][props.modifier], oversample: '4x' })
const waveshaper = useOptionParam('waveshaper', props.waveshaper, (value) => {
  waveshaperNode.curve = waveshaperTables[value][modifier.value]
})
const waveshaperOptions = [
  { label: 'sin', value: 'sin' as const },
  { label: 'sig', value: 'sigmoid' as const },
  { label: 'tanh', value: 'tanh' as const },
  { label: 'x-root', value: 'x-root' as const },
]
const [modifier] = useAudioParam('modifier', props.modifier, (value) => {
  waveshaperNode.curve = waveshaperTables[waveshaper.value][value]
})

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        waveshaperNode.connect(target, 0)
        return
      }
      waveshaperNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        waveshaperNode.disconnect(target, 0)
        return
      }
      waveshaperNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: waveshaperNode, inputIndex: 0 },
  },
})

onUnmounted(() => {
  waveshaperNode.disconnect()
  unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-1">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <HandleLabel class="pt-3">
        in
      </HandleLabel>
      <Handle id="input" type="target" :position="Position.Left" />
      <div class="nodrag flex items-center gap-1 border border-white/80 rounded-md p-2">
        <Knob v-model="modifier" :size="40" :min="0" :max="100" />
        <Dropdown v-model="waveshaper" class="border h-6 w-full" :pt="{
          input: tw`p-1 text-xs`,
        }" :options="waveshaperOptions" option-label="label" option-value="value" placeholder="Waveshaper" />
      </div>
      <div class="flex flex-col">
        <HandleLabel class="pt-3">
          out
        </HandleLabel>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>
    </div>
  </div>
</template>
