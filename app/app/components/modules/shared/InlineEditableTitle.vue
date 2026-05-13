<script lang="ts" setup>
export type InlineEditableTitleProps = {
  modelValue: string
  nodeId: string
  active: boolean
}
const props = defineProps<InlineEditableTitleProps>()
const emit = defineEmits<{
  commit: [title: string]
  done: []
}>()

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

async function enterEdit() {
  draft.value = props.modelValue
  editing.value = true
  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

function commit() {
  if (draft.value !== props.modelValue) {
    emit('commit', draft.value)
  }
  editing.value = false
  emit('done')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.stopPropagation()
    commit()
  }
  else if (e.key === 'Escape') {
    e.stopPropagation()
    cancel()
  }
}

function cancel() {
  editing.value = false
  draft.value = props.modelValue
  emit('done')
}

function onDblclick() {
  enterEdit()
}

watch(() => props.active, (val) => {
  if (val) {
    enterEdit()
  }
}, { immediate: true })
</script>

<template>
  <span
    v-if="!editing"
    class="cursor-pointer select-none"
    @dblclick.stop="onDblclick"
  >
    {{ modelValue }}
  </span>
  <input
    v-else
    ref="inputRef"
    v-model="draft"
    class="!h-6 !text-xs !py-0 !px-1 !w-full nodrag rounded border border-white/30 bg-black/60 text-white outline-none focus:border-white/60"
    @keydown="onKeydown"
    @blur="commit"
    @mousedown.stop
    @click.stop
  >
</template>
