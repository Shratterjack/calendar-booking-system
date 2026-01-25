<template>
  <div class="flex flex-col">
    <h1 class="text-xl font-bold">Schedule New Event</h1>
    <section class="grid grid-cols-12 my-10">
      <form @submit.prevent="handleSubmit" class="col-span-4">
        <div class="flex flex-col h-full mr-10 gap-y-4">
          <!-- Datepicker component -->
          <div class="border border-slate-200 rounded-xl my-2">
            <div class="flex flex-col px-8 py-5">
              <label> Select Date</label>
              <SelectDateButton :selected-date="date" @toggle-date="handleDatePickerToggle" />
              <DatePicker
                v-if="isDatePickerOpen"
                v-model="date"
                :min-date="new Date()"
                :masks="masks"
                title-position="left"
                borderless
                expanded
              />
            </div>
          </div>
          <!-- Timezone component -->
          <div class="flex flex-col py-5 justify-center border border-slate-200 rounded-xl gap-y-5">
            <div class="flex flex-col px-10">
              <label for="timezoneSelect">Timezone</label>
              <select
                class="py-3 px-3 border border-slate-200 rounded-xl"
                name="timezone"
                id="timezoneSelect"
                v-model="timezone"
              >
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Canada/Atlantic">Canada/Atlantic</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>

            <button
              class="bg-zinc-950 text-neutral-50 text-base border border-slate-200 rounded-xl mx-5 py-2 cursor-pointer"
            >
              Get Free Slots
            </button>
          </div>
        </div>
      </form>
      <div class="h-full border border-slate-200 col-span-8 mx-10 rounded-xl">
        <!-- Duration component -->
        <template v-if="!isBookingSuccessViewShown">
          <div class="flex flex-row justify-start items-center gap-3 py-2 mx-5">
            <label for="durationSelect" class="font-medium">Duration (Minutes):</label>
            <select
              class="border border-slate-200 rounded-xl px-5 py-2 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              name="duration"
              id="durationSelect"
              v-model="duration"
            >
              <option :value="30">30</option>
              <option :value="45">45</option>
            </select>
          </div>
          <SlotSelector
            class="mx-5 border-t border-slate-200"
            :time-slots="freeSlots"
            :duration="duration"
            @handle-slot-booking="handleSlotBooking"
          />
        </template>
        <template v-else>
          <BookingSuccess />
        </template>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { DatePicker } from 'v-calendar'
import SlotSelector from '@/components/SlotSelector.vue'
import SelectDateButton from '@/components/SelectDateButton.vue'
import BookingSuccess from '@/components/BookingSuccess.vue'

import { apiCall } from '../../utilities/apiService'

import 'v-calendar/style.css'

// const timezoneMap = {
//   'IST': 'Asia/Kolkata',
//   'LA': 'America/Los_Angeles',
//   'AST': 'Canada/Atlantic',
//   'GMT':'Europe/London'
//   'GMT':'Europe/Moscow'
// }
//

const isDatePickerOpen = ref(false)

const date = ref(new Date())

const duration = ref(30)
const timezone = ref('Asia/Kolkata')

const freeSlots = ref([])

const masks = ref({
  modelValue: 'YYYY-MM-DD',
})

const disablePastDates = (date: Date) => {
  console.log('date', date)
  return
  // const today = new Date()
  // today.setHours(0, 0, 0, 0)
  // return date < today
}

const handleDatePickerToggle = (toggleVal: boolean) => {
  isDatePickerOpen.value = toggleVal
}

async function handleSubmit() {
  const selectedDate = date.value && date.value.toISOString().split('T')
  let slotTime = ''

  if (selectedDate && selectedDate.length > 0 && selectedDate[0]) {
    slotTime = selectedDate[0]
  }

  console.log('slotTime', slotTime)
  console.log('timezone.value', timezone.value)

  freeSlots.value = await fetchFreeSlots(slotTime, timezone.value)
}

async function fetchFreeSlots(slotTime: string, timezone: string) {
  const params = new URLSearchParams({ slotTime, timezone })

  const path = `/events/free-slots?${params}`
  const result = await apiCall({ path: path, requestOptions: { method: 'GET' } })
  return result
}

const isBookingSuccessViewShown = ref(false)

const toggleBookingView = () => {}

async function handleSlotBooking() {
  isBookingViewShown.value = true
}
</script>
