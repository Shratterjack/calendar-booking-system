<template>
  <nav class="border-b border-slate-200 bg-white">
    <div class="flex justify-start mx-5">
      <div class="px-2 py-4">
        <RouterLink class="hover:text-blue-500 text-slate-500" to="/">Home</RouterLink>
      </div>
      <div class="px-2 py-4">
        <RouterLink class="hover:text-blue-500 text-slate-500" to="/events">Events</RouterLink>
      </div>
      <div class="px-2 py-4">
        <RouterLink class="hover:text-blue-500 text-slate-500" to="/booking">Schedule</RouterLink>
      </div>
    </div>
  </nav>
  <main class="mx-20 px-10 my-5">
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>
