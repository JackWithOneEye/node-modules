<script lang="ts" setup>
export type CabinetImpulseResponse = 'v30-sm57' | 'dv77-sm57' | 'g12f60-e606'

export type CabinetModuleProps = {
  id: string
  type: string
  title?: string
  impulseResponse?: CabinetImpulseResponse
  level?: number
}
const props = withDefaults(defineProps<CabinetModuleProps>(), {
  title: 'Cabinet',
  impulseResponse: 'v30-sm57',
  level: 1,
})

// CC0 IRs from Jester's Brutal Pack, see public/impulse-responses/README.md
const impulseResponseOptions: { label: string, value: CabinetImpulseResponse }[] = [
  { label: '4x12 V30 · SM57', value: 'v30-sm57' },
  { label: '4x12 DV-77 · SM57', value: 'dv77-sm57' },
  { label: '4x12 G12F-60 · e606', value: 'g12f60-e606' },
]

const store = useAudioContextStore()
const ctx = store.getAudioContext()
const convolverNode = new ConvolverNode(ctx)
// the convolver's IR normalization leaves the cab's midrange ~12 dB down; bring it back to about unity
const makeupNode = new GainNode(ctx, { gain: dB2Gain(12) })
const levelNode = new GainNode(ctx, { gain: props.level })
convolverNode.connect(makeupNode).connect(levelNode)

let latestLoad = 0
async function loadImpulseResponse(name: CabinetImpulseResponse) {
  const load = ++latestLoad
  try {
    const response = await fetch(`/impulse-responses/${name}.wav`)
    const buffer = await ctx.decodeAudioData(await response.arrayBuffer())
    if (load === latestLoad) {
      convolverNode.buffer = buffer
    }
  }
  catch (e) {
    console.warn(`failed to load impulse response "${name}"`, e)
  }
}

const impulseResponse = useOptionParam('impulseResponse', props.impulseResponse, loadImpulseResponse)
loadImpulseResponse(impulseResponse.value)

const level = useGainParam('level', props.level, value => store.setParamValue(levelNode.gain, value, 'exp', 0.05))

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        levelNode.connect(target, 0)
        return
      }
      levelNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        levelNode.disconnect(target, 0)
        return
      }
      levelNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', inputIndex: 0, node: convolverNode },
    level: { type: 'param', param: levelNode.gain },
  },
})

onUnmounted(() => {
  convolverNode.disconnect()
  makeupNode.disconnect()
  levelNode.disconnect()
  store.unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <div class="flex">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'input', label: 'in', signal: 'audio' },
          { id: 'level', label: 'level', signal: 'cv' },
        ]"
      />
      <div class="nodrag flex items-center gap-2">
        <USelect
          v-model="impulseResponse"
          :items="impulseResponseOptions"
          label-key="label"
          value-key="value"
          aria-label="Impulse response"
          class="w-44 text-xs"
          size="sm"
        />
        <KnobInput
          v-model="level"
          label="Level"
          :min="-24"
          :max="24"
          :format-fn="(v) => v + 'dB'"
        />
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
