<template>
  <div class="w-full">
    <table class="table-auto rounded-xl">
      <thead class="bg-slate-50 border border-slate-200">
        <tr>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            ID
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            Date And Time
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            Duration
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-slate-200">
        <template v-if="eventData.length === 0">
          <tr>
            <td colspan="2" class="px-6 py-8 text-center text-slate-500">No events found</td>
          </tr>
        </template>
        <template v-else>
          <tr
            v-for="(event, index) in eventData"
            :key="index"
            class="border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
              {{ index + 1 }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
              {{ formatDateTime(event.startingTime) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
              {{ event.duration }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

type Event = {
  startingTime: string
  duration: number
}

const props = defineProps<{
  eventData: Event[]
  timezone: string
}>()

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime)

  // Format: "Jan 23, 2026 at 4:30 PM"
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }

  return date.toLocaleString('en-US', options).replace(',', ' at')
}

const calculateDuration = (event: Event) => {
  if (!event.endingTime) {
    return 'N/A'
  }

  const start = new Date(event.startingTime)
  const end = new Date(event.endingTime)
  const durationMs = end.getTime() - start.getTime()

  const hours = Math.floor(durationMs / (1000 * 60 * 60))
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${minutes}m`
  }
}
onMounted(() => {
  console.log('eventData', props.eventData)
})
</script>
