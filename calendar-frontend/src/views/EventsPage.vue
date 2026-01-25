<template>
  <div class="flex flex-col">
    <h1 class="text-xl font-bold">Events</h1>
    <section class="grid grid-cols-12 my-10">
      <div class="flex flex-col col-span-12">
        <div class="flex gap-x-5 items-end border border-slate-200 rounded-xl p-5 mb-6">
          <div class="flex flex-col">
            <label for="startDate" class="font-medium mb-2">Select Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              v-model="startDate"
              class="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex flex-col">
            <label for="endDate" class="font-medium mb-2">Select End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              v-model="endDate"
              :min="startDate"
              class="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            @click="handleApplyFilter"
            :disabled="!startDate || !endDate || !isDateRangeValid"
            class="bg-zinc-950 text-neutral-50 px-6 py-2 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Apply Filter
          </button>
        </div>
        <div v-if="dateError" class="text-red-600 mb-4 px-2">
          {{ dateError }}
        </div>
        <EventsList :event-data="eventList" />
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import EventsList from '@/components/EventsList.vue'

import { apiCall } from '../../utilities/apiService'

const eventList = ref([])
const startDate = ref('')
const endDate = ref('')
const dateError = ref('')

const isDateRangeValid = computed(() => {
  if (!startDate.value || !endDate.value) return false
  return new Date(startDate.value) < new Date(endDate.value)
})

const fetchEvents = async (start: string, end: string) => {
  const params = new URLSearchParams({ startDate: start, endDate: end })

  const path = `/events/list?${params}`

  const result = await apiCall({ path: path, requestOptions: { method: 'GET' } })
  return result
}

const handleApplyFilter = async () => {
  dateError.value = ''

  if (!startDate.value || !endDate.value) {
    dateError.value = 'Please select both start and end dates'
    return
  }

  if (new Date(startDate.value) >= new Date(endDate.value)) {
    dateError.value = 'Start date must be before end date'
    return
  }

  eventList.value = await fetchEvents(startDate.value, endDate.value)
}
</script>
