<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type ValueModuleProps = {
  id: string
  type: string
  title?: string
  offset?: number
}
const props = withDefaults(defineProps<ValueModuleProps>(), {
  title: 'Value',
  offset: 0,
})

const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const constantSourceNode = new ConstantSourceNode(audioContext, { offset: props.offset })
constantSourceNode.start()

const [offset] = useAudioParam('offset', props.offset, value => setParamValue(constantSourceNode.offset, value, 'lin'))

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        constantSourceNode.connect(target, 0)
        return
      }
      constantSourceNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        constantSourceNode.disconnect(target, 0)
        return
      }
      constantSourceNode.disconnect(target, 0, targetIndex)
    },
  },
})

onUnmounted(() => {
  constantSourceNode.disconnect()
  constantSourceNode.stop()
  unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-2 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <div class="nodrag">
        <InputNumber
          v-model="offset"
          :pt="{
            root: tw`[&>input]:w-24 [&>input]:border [&>input]:border-white/50 [&>input]:focus:border-white [&>input]:text-sm [&>input]:p-2 [&>input]:outline-none`,
          }"
          mode="decimal"
          show-buttons
          :min="0"
          :max="10000"
          :step="0.1"
        />
      </div>
      <div class="flex flex-col">
        <HandleLabel class="pt-1">
          out
        </HandleLabel>
        <Handle
          id="output"
          type="source"
          :position="Position.Right"
        />
      </div>
    </div>
  </div>
</template>
