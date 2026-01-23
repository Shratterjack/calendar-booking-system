<template>
  <div class="grid grid-cols-3 gap-4 p-6">
    <template v-if="timeSlots.length > 0">
      <TimeSlot
        v-for="(slot, index) in timeSlots"
        :key="index"
        :time="slot.startingDisplayTime"
        :actual-time="slot.startingTime"
        @slot-select="handleSlotSelect"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import TimeSlot from './common/TimeSlot.vue'

import { apiCall } from '../../utilities/apiService'

type EventDisplay = {
  startingTime: string
  startingDisplayTime: string
}

const props = defineProps<{
  timeSlots: EventDisplay[]
  duration: number
}>()

// const

// const emit = defineEmits<{
//   'select-date': [value: EventDisplay]
// }>()
const handleSlotSelect = async (value: string) => {
  console.log('slot value', value)

  const body = {
    slotTime: value,
    duration: Number(props.duration),
  }

  const path = `/events/booking`

  const response = await apiCall({ path, requestOptions: { method: 'POST', body } })
}

onMounted(() => {})
</script>
