<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

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
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <div class="flex flex-col gap-4">
        <HandleLabel>in</HandleLabel>
        <Handle id="input" class="!top-10" type="target" :position="Position.Left" />
        <HandleLabel>time</HandleLabel>
        <Handle id="delayTime" class="!top-16" type="target" :position="Position.Left" />
      </div>
      <div class="nodrag">
        <InputNumber v-model="delayTime" :min="0" :max="2" :step="0.01" :max-fraction-digits="3" :pt="{
          root: tw`[&>input]:w-24 [&>input]:border [&>input]:border-white/50 [&>input]:focus:border-white [&>input]:text-sm [&>input]:p-2 [&>input]:outline-none`,
        }" :min-fraction-digits="0" suffix="s" mode="decimal" show-buttons />
      </div>
      <div class="flex flex-col">
        <HandleLabel class="pt-1">
          out
        </HandleLabel>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>
    </div>
  </div>
</template>
