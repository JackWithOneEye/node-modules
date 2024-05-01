<script lang="ts" setup>
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { VueFlow } from '@vue-flow/core'
import type { Node, Edge, ViewportTransform } from '@vue-flow/core'

const { initialData } = defineProps<{ initialData: { nodes: Node[], edges: Edge[], viewport?: ViewportTransform } }>()

const audioCtxStore = useAudioContextStore()

const { onConnect, onEdgesChange, addEdges } = useVueFlow()
const nodes = ref(initialData.nodes)
const edges = ref(initialData.edges)
const viewport = ref(initialData.viewport)

onConnect((connection) => {
  addEdges(connection)
  audioCtxStore.connectModules(
    connection.source,
    connection.sourceHandle!,
    connection.target,
    connection.targetHandle!,
  )
})

onEdgesChange((changes) => {
  for (const change of changes) {
    if (change.type === 'remove') {
      audioCtxStore.disconnectModules(
        change.source,
        change.sourceHandle!,
        change.target,
        change.targetHandle!,
      )
    }
  }
})

const init = useNodesInitialized()
watch(init, (curr) => {
  if (curr) {
    for (const { source, sourceHandle, target, targetHandle } of edges.value) {
      audioCtxStore.connectModules(
        source,
        sourceHandle!,
        target,
        targetHandle!,
      )
    }
  }
}, { once: true })

const { onDragOver, onDrop, onDragLeave, isDragOver } = useDnDModule()
</script>

<template>
  <div
    class="contents"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="viewport"
      class="flex-1 bg-black text-white"
    >
      <template #[`node-${AudioModuleType.AudioSource}`]="{ id, type }">
        <AudioSourceModule
          :id="id"
          :type="type"
        />
      </template>
      <template #[`node-${AudioModuleType.Destination}`]="{ id, type, data }">
        <DestinationModule
          :id="id"
          :type="type"
          :gain="data.gain"
        />
      </template>
      <template #[`node-${AudioModuleType.Gain}`]="{ id, type, data }">
        <GainModule
          :id="id"
          :type="type"
          :gain="data.gain"
        />
      </template>
      <template #[`node-${AudioModuleType.MidiInput}`]="{ id, type, data }">
        <MidiInputModule
          :id="id"
          :type="type"
          :channel="data.channel"
          :device-id="data.deviceId"
          :priority="data.priority"
        />
      </template>
      <template #[`node-${AudioModuleType.MultiFilter}`]="{ id, type, data }">
        <MultiFilterModule
          :id="id"
          :type="type"
          :cutoff="data.cutoff"
          :q="data.q"
        />
      </template>
      <template #[`node-${AudioModuleType.Multiplier}`]="{ id, type }">
        <MultiplierModule
          :id="id"
          :type="type"
        />
      </template>
      <template #[`node-${AudioModuleType.Oscillator}`]="{ id, type, data }">
        <OscillatorModule
          :id="id"
          :type="type"
          :frequency="data.frequency"
          :detune="data.detune"
          :waveform="data.waveform"
        />
      </template>
      <template #[`node-${AudioModuleType.Oscilloscope}`]="{ id, type }">
        <OscilloscopeModule
          :id="id"
          :type="type"
        />
      </template>
      <Background :class="{ 'bg-slate-900': isDragOver }" />
      <Controls />
    </VueFlow>
  </div>
</template>
