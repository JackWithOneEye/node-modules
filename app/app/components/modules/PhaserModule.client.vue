<script lang="ts" setup>
import { Position } from '@vue-flow/core'

export type PhaserModuleProps = {
  id: string
  type: string
  title?: string
  depth?: number
  intensity?: number
  stages?: number
  modulationMapping?: ModulationMapping
}
const props = withDefaults(defineProps<PhaserModuleProps>(), {
  title: 'Phaser',
  depth: 0.5,
  intensity: 0.0,
  stages: 4,
  modulationMapping: ModulationMapping.Linear,
})

const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const phaserNode = new PhaserWorkletNode(getAudioContext(), { depth: props.depth, intensity: props.intensity, stages: props.stages, modulationMapping: props.modulationMapping })

const pctConv = linearConverter(100)
const [depth] = useAudioParam('depth', props.depth, value => setParamValue(phaserNode.depth, value), pctConv)
const [intensity] = useAudioParam('intensity', props.intensity, value => setParamValue(phaserNode.intensity, value), pctConv)
const [stages] = useAudioParam('stages', props.stages, value => setParamValue(phaserNode.stages, value))
const modulationMapping = useOptionParam('modulationMapping', props.modulationMapping, value => setParamValue(phaserNode.modulationMapping, value))
const modulationMappingOptLabels = {
  [ModulationMapping.Linear]: 'lin',
  [ModulationMapping.Exponential]: 'exp',
} as const

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        phaserNode.connect(target, 0)
        return
      }
      phaserNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        phaserNode.disconnect(target, 0)
        return
      }
      phaserNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: phaserNode, inputIndex: 0 },
    modulation: { type: 'param', param: phaserNode.modulation },
    depth: { type: 'param', param: phaserNode.depth },
    intensity: { type: 'param', param: phaserNode.intensity },
  },
  onSuspend: () => {
    phaserNode.reset()
  },
})

onUnmounted(() => {
  phaserNode.destroy()
  unregisterModule(props.id)
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
        :ports="[{ id: 'input', label: 'in', signal: 'audio' }]"
      />
      <div class="relative flex flex-col items-center select-none w-13">
        <span class="text-xs text-center font-mono w-12 text-white/50">mod</span>
        <div class="relative h-2 w-2">
          <UTooltip
            text="modulation"
            arrow
            :delay-duration="0"
            :disable-closing-trigger="true"
            :content="{ side: 'top', sideOffset: 4 }"
          >
            <ModuleHandle
              id="modulation"
              class="left-1!"
              type="target"
              :position="Position.Bottom"
              signal="cv"
            />
          </UTooltip>
        </div>
      </div>
      <WithHandle
        handle-id="depth"
        handle-signal="cv"
      >
        <KnobInput
          v-model="depth"
          label="depth"
          :min="0"
          :max="100"
          :step="1"
          :format-fn="(v) => v.toFixed(0) + '%'"
        />
      </WithHandle>
      <WithHandle
        handle-id="intensity"
        handle-signal="cv"
      >
        <KnobInput
          v-model="intensity"
          label="intensity"
          :min="0"
          :max="100"
          :step="1"
          :format-fn="(v) => v.toFixed(0) + '%'"
        />
      </WithHandle>
      <KnobInput
        v-model="stages"
        label="stages"
        :min="1"
        :max="6"
        :step="1"
        :format-fn="(v) => v.toFixed(0)"
      />
      <KnobInput
        v-model="modulationMapping"
        label="mod mapping"
        :min="ModulationMapping.Linear"
        :max="ModulationMapping.Exponential"
        :format-fn="(v) => modulationMappingOptLabels[v as ModulationMapping]"
      />
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
