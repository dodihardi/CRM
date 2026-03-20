<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/app'

const authStore = useAuthStore()
const appStore = useAppStore()

onMounted(async () => {
  await authStore.fetchMe()
})

watch(() => authStore.isAuthenticated, (newVal) => {
  if (newVal) {
    appStore.fetchData()
  }
}, { immediate: true })
</script>
