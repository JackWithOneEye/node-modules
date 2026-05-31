<script lang="ts" setup>
const { open, config, handleConfirm, handleCancel } = useConfirmModal()

function onOpenChange(value: boolean) {
  if (!value) {
    handleCancel()
  }
}
</script>

<template>
  <UModal
    :open="open"
    :title="config?.title"
    @update:open="onOpenChange"
  >
    <template #body>
      <div class="flex items-start gap-3">
        <UIcon
          name="ph:warning"
          class="w-6 h-6 text-white shrink-0 mt-0.5"
        />
        <p class="text-neutral-300 text-sm">
          {{ config?.message }}
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          label="Cancel"
          @click="handleCancel"
        />
        <UButton
          :label="config?.confirmLabel ?? 'Confirm'"
          :color="config?.confirmVariant ?? 'primary'"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
