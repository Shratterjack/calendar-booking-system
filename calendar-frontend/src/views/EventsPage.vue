<template>
  <div class="flex flex-col">
    <h1 class="text-xl font-bold">Events</h1>
    <section class="grid grid-cols-12 my-10">
      <div class="flex flex-col">
        <div class="flex gap-x-5">
          <div class="py-5">
            <label for="startDate">Select Start date</label>
            <input type="date" id="startDate" name="startDate" />
          </div>
          <div class="py-5">
            <label for="endDate">Select End date</label>
            <input type="date" id="endDate" name="endDate" />
          </div>
          <!-- <div class="flex flex-col px-10">
            <label for="timezoneSelect">Timezone</label>
            <select
              class="py-3 border border-slate-200 rounded-xl"
              name="timezone"
              id="timezoneSelect"
            >
              <option default value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Canada/Atlantic">Canada/Atlantic</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div> -->
        </div>
        <EventsList :event-data="eventList" />
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, onBeforeMount } from 'vue'
import EventsList from '@/components/EventsList.vue'

import { apiCall } from '../../utilities/apiService'
//
const eventList = ref([])

const fetchEvents = async () => {
  const params = new URLSearchParams({ startDate: '2026-01-24', endDate: '2026-01-25' })

  const path = `/events/list?${params}`

  const result = await apiCall({ path: path, requestOptions: { method: 'GET' } })
  // eventList.value = result
  return result

  const formattedResult = result.map((slot) => {
    const startTime = new Date(slot.startingTime)

    const formattedTime = startTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    return {
      formattedTime: formattedTime,
    }
  })

  console.log('formattedResult', formattedResult)
}

onBeforeMount(async () => {
  eventList.value = await fetchEvents()
})
</script>
