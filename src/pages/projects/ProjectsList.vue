<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Projects</h1>
      <p class="text-slate-500">Post-auction delivery and implementation tracking.</p>
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-6 py-4 font-semibold">Project Title</th>
            <th class="px-6 py-4 font-semibold">Customer</th>
            <th class="px-6 py-4 font-semibold">Status</th>
            <th class="px-6 py-4 font-semibold">Progress</th>
            <th class="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="store.projects.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-slate-500">
              No active projects. Complete an auction to start a project.
            </td>
          </tr>
          <tr v-for="project in store.projects" :key="project.id" class="hover:bg-slate-50 transition-colors group">
            <td class="px-6 py-4">
              <router-link :to="`/projects/${project.id}`" class="font-bold text-slate-900 hover:text-emerald-600">
                {{ project.title }}
              </router-link>
              <p class="text-xs text-slate-400">ID: {{ project.id }}</p>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">{{ getCustomerName(project.customer_id) }}</td>
            <td class="px-6 py-4">
              <span :class="getStatusClass(project.status)" class="px-2 py-1 rounded text-xs font-medium uppercase">
                {{ project.status }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center">
                <div class="w-24 bg-slate-100 rounded-full h-1.5 mr-3">
                  <div class="bg-emerald-500 h-1.5 rounded-full" :style="{ width: `${getProgress(project)}%` }"></div>
                </div>
                <span class="text-xs font-bold text-slate-600">{{ getProgress(project) }}%</span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <router-link :to="`/projects/${project.id}`" class="text-slate-400 hover:text-emerald-600 p-2">
                <ChevronRight class="w-5 h-5 inline" />
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { ChevronRight } from 'lucide-vue-next'

const store = useAppStore()

const getCustomerName = (id: string) => {
  const c = store.customers.find(c => c.id === id)
  return c?.name || 'Unknown'
}

const getProgress = (project: any) => {
  if (project.tasks.length === 0) return 0
  const completed = project.tasks.filter((t: any) => t.completed).length
  return Math.round((completed / project.tasks.length) * 100)
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-slate-100 text-slate-600'
    case 'ongoing': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-800'
  }
}
</script>
