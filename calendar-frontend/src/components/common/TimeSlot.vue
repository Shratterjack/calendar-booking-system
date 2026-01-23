<template>
  <button
    type="button"
    class="border border-slate-200 rounded-lg px-4 py-2 hover:border-indigo-500 cursor-pointer"
    @click="emit('slotSelect', actualTime)"
  >
    {{ displayTimeText }}
  </button>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  actualTime: string
  time: string
}>()

const emit = defineEmits<{
  slotSelect: [value: string]
}>()

const displayTimeText = computed(() => {
  const timeSplit = props.time.split(',')
  return timeSplit[1]
})
</script>
