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
    <template v-else>
      <div>Please Select your preferences</div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useToast } from 'vue-toastification'
import TimeSlot from './common/TimeSlot.vue'

import { apiCall } from '../../utilities/apiService'

type EventDisplay = {
  startingTime: string
  startingDisplayTime: string
}

type BookingResponse = {
  success: boolean
  data: {
    isBookingSuccess: boolean
    errorCode?: string
    message: string
  }
}

const props = defineProps<{
  timeSlots: EventDisplay[]
  duration: number
}>()

const toast = useToast()

const handleSlotSelect = async (value: string) => {
  const body = {
    slotTime: value,
    duration: Number(props.duration),
  }

  console.log('body', body)

  const path = `/events/booking`
  const clientDate = new Date(body.slotTime)
  const utcDate = new Date(clientDate.toLocaleString('en-US', { timeZone: 'UTC' }))
  console.log(utcDate.toISOString())

  // const response = (await apiCall({
  //   path,
  //   requestOptions: { method: 'POST', body },
  // })) as BookingResponse

  // if (response && response.success && response.data.isBookingSuccess) {
  //   toast.success(response.data.message || 'Booking successful!')
  // }
  // {
  //   toast.error(response.data.message || 'Booking failed. Please try again.')
  // }
}
</script>
