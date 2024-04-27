<script lang="ts" setup>
import { VueFlow, useVueFlow, type Node, type Edge, useNodesInitialized } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'

const audioCtxStore = useAudioContextStore()

const { onPaneReady, onConnect, onEdgesChange, addEdges } = useVueFlow()
const nodes = ref<Node[]>([
  { id: '1', type: 'audio-source', label: 'Node 2', position: { x: 100, y: 100 } },
  { id: '2', type: 'destination', label: 'Node 2', position: { x: 200, y: 200 } },
  { id: '3', type: 'oscilloscope', label: 'Node 2', position: { x: 500, y: 200 } },
])

const edges = ref<Edge[]>([
  { id: 'e1', source: '1', sourceHandle: 'output', target: '2', targetHandle: 'input' },
  { id: 'e2', source: '1', sourceHandle: 'output', target: '3', targetHandle: 'input' },
])

onPaneReady(({ fitView }) => {
  fitView()
})

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
</script>

<template>
  <MegaMenu>
    <template #end>
      <Button
        class="h-10 w-10"
        @click="() => {
          if (audioCtxStore.state === 'suspended') {
            audioCtxStore.resume()
          }
          else {
            audioCtxStore.suspend()
          }
        }"
      >
        <template #icon>
          <i :class="`pi ${audioCtxStore.state === 'suspended' ? 'pi-play' : 'pi-stop'}`" />
        </template>
      </Button>
    </template>
  </MegaMenu>
  <VueFlow
    :nodes="nodes"
    :edges="edges"
    class="dark"
  >
    <template #node-audio-source="{ id }">
      <AudioSourceModule :id="id" />
    </template>
    <template #node-destination="{ id }">
      <DestinationModule :id="id" />
    </template>
    <template #node-oscilloscope="{ id }">
      <OscilloscopeModule :id="id" />
    </template>
    <Background />
    <Controls />
  </VueFlow>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';

.dark {
  background: #000000;
  color: #fffffb
}

.dark .vue-flow__node {
  background: hsl(0, 0%, 10%);
  color: #fffffb
}

.dark .vue-flow__node.selected {
  background: hsl(0, 0%, 20%);
  border: 1px solid hotpink
}

.vue-flow__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center
}

.dark .vue-flow__controls {
  border: 1px solid #FFFFFB
}

.vue-flow__controls .vue-flow__controls-button {
  border: none;
  border-right: 1px solid #eee
}

.dark .vue-flow__controls .vue-flow__controls-button {
  background: hsl(0, 0%, 20%);
  fill: #fffffb;
  border: none
}

.dark .vue-flow__controls .vue-flow__controls-button:hover {
  background: hsl(0, 0%, 30%)
}

.dark .vue-flow__edge-textbg {
  fill: #292524
}

.dark .vue-flow__edge-text {
  fill: #fffffb
}
</style>
