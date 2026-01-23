<template>
  <main class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-800 mb-8">Calendar Booking</h1>
      <div class="flex flex-col gap-4">
        <RouterLink
          class="px-6 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-lg font-medium"
          to="/booking"
        >
          Book an Event
        </RouterLink>
        <RouterLink
          class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-lg font-medium"
          to="/events"
        >
          View Events
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts"></script>
