<script lang="ts" setup>
export type DelayLineModuleProps = {
  id: string
  type: string
  title?: string
  delayTime?: number // seconds
}

const props = withDefaults(defineProps<DelayLineModuleProps>(), {
  title: 'Delay Line',
  delayTime: 0.1,
})

const store = useAudioContextStore()
const delayNode = new DelayNode(store.getAudioContext(), {
  maxDelayTime: 2,
  delayTime: props.delayTime,
})

const delayTime = ref(props.delayTime)

const { updateNodeData } = useVueFlow()

watch(delayTime, (value) => {
  store.setParamValue(delayNode.delayTime, value, 'lin')
  updateNodeData<DelayLineModuleProps>(props.id, { delayTime: value })
})

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        delayNode.connect(target, 0)
        return
      }
      delayNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        delayNode.disconnect(target, 0)
        return
      }
      delayNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', inputIndex: 0, node: delayNode },
    delayTime: { type: 'param', param: delayNode.delayTime },
  },
})

onUnmounted(() => {
  delayNode.disconnect()
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
          { id: 'delayTime', label: 'time', signal: 'cv' },
        ]"
      />
      <KnobInput
        v-model="delayTime"
        label="delay"
        :min="0"
        :max="2"
        :step="0.01"
        :format-fn="(v) => `${(v * 1000).toFixed()}ms`"
      />
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
