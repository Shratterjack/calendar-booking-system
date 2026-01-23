<template>
  <button
    @click="handleBtnClick"
    type="button"
    class="border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-200"
  >
    <div class="flex flex-row px-5 py-3 items-center gap-2">
      <IconCalendar class="h-5 w-5" />
      <p>{{ displayDate() }}</p>
    </div>
  </button>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import IconCalendar from '@/components/icons/IconCalendar.vue'

const shouldToggleDate = ref(false)

const props = defineProps<{
  selectedDate: Date
}>()

const emit = defineEmits<{
  toggleDate: [value: boolean]
}>()

const displayDate = () => {
  return props.selectedDate.toLocaleDateString('en-GB')
}

const handleBtnClick = () => {
  shouldToggleDate.value = !shouldToggleDate.value

  emit('toggleDate', shouldToggleDate.value)
}
</script>
