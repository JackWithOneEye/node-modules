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
const delayNode = new DelayNode(store.audioContext, {
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
    :title="title"
  >
    <div class="flex gap-2">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'input', label: 'in' },
          { id: 'delayTime', label: 'time' },
        ]"
      />
      <div class="nodrag">
        <InputNumber v-model="delayTime" :min="0" :max="2" :step="0.01" :max-fraction-digits="3" :pt="{
          root: tw`[&>input]:w-24 [&>input]:border [&>input]:border-white/50 [&>input]:focus:border-white [&>input]:text-sm [&>input]:p-2 [&>input]:outline-none`,
        }" :min-fraction-digits="0" suffix="s" mode="decimal" show-buttons />
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out' }]"
      />
    </div>
  </BaseModuleShell>
</template>
