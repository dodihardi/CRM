<template>
  <div v-if="project" class="space-y-8">
    <header class="flex items-start justify-between">
      <div class="flex items-center">
        <router-link to="/projects" class="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft class="w-6 h-6 text-slate-600" />
        </router-link>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-slate-900">{{ project.title }}</h1>
            <span :class="getStatusClass(project.status)" class="px-2 py-1 rounded text-xs font-medium uppercase tracking-wider">
              {{ project.status }}
            </span>
          </div>
          <p class="text-slate-500">Linked to Customer: {{ customerName }}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
          Edit Project
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Task List -->
      <div class="lg:col-span-2 space-y-8">
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Project Tasks</h2>
            <div class="flex items-center text-sm text-slate-500">
              <span class="font-bold text-emerald-600 mr-1">{{ completedTasks }}</span> / {{ project.tasks.length }} Completed
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div v-for="task in project.tasks" :key="task.id" class="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group">
              <button 
                @click="task.completed = !task.completed"
                class="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                :class="task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'"
              >
                <Check v-if="task.completed" class="w-4 h-4" />
              </button>
              <span class="ml-4 font-medium" :class="task.completed ? 'text-slate-400 line-through' : 'text-slate-700'">
                {{ task.title }}
              </span>
            </div>
            <div class="pt-4">
              <button class="text-emerald-600 text-sm font-bold flex items-center hover:text-emerald-700">
                <Plus class="w-4 h-4 mr-1" />
                Add Task
              </button>
            </div>
          </div>
        </section>

        <!-- Project Timeline -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 class="text-xl font-bold text-slate-900 mb-6">Project History</h2>
          <div class="space-y-8">
            <div v-for="activity in projectActivities" :key="activity.id" class="flex">
              <div class="flex flex-col items-center mr-6">
                <div class="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                <div class="w-0.5 flex-1 bg-slate-100 my-1"></div>
              </div>
              <div class="pb-4">
                <p class="text-sm text-slate-900">{{ activity.content }}</p>
                <p class="text-xs text-slate-400">{{ new Date(activity.timestamp).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Sidebar Info -->
      <aside class="space-y-8">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Info</h3>
          <div class="flex items-center mb-6">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
              {{ customerName.charAt(0) }}
            </div>
            <div class="ml-4">
              <p class="font-bold text-slate-900">{{ customerName }}</p>
              <router-link :to="`/customers/${project.customer_id}`" class="text-xs text-emerald-600 font-bold hover:underline">View Profile</router-link>
            </div>
          </div>
          <div class="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <p class="text-xs text-slate-400 uppercase font-bold">Auction Source</p>
              <router-link :to="`/auctions/${project.auction_id}`" class="text-sm font-medium text-slate-900 hover:text-emerald-600">
                {{ auctionTitle }}
              </router-link>
            </div>
          </div>
        </div>

        <div class="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-100">
          <h3 class="font-bold mb-2">Project Progress</h3>
          <div class="w-full bg-emerald-700/50 rounded-full h-2 mb-4">
            <div class="bg-white h-2 rounded-full transition-all duration-500" :style="{ width: `${progress}%` }"></div>
          </div>
          <p class="text-xs text-emerald-100">{{ progress }}% of tasks completed</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ArrowLeft, Check, Plus } from 'lucide-vue-next'

const route = useRoute()
const store = useAppStore()

const project = computed(() => store.projects.find(p => p.id === route.params.id))
const projectActivities = computed(() => store.activities.filter(a => a.project_id === route.params.id))

const customerName = computed(() => {
  if (!project.value) return ''
  const c = store.customers.find(c => c.id === project.value?.customer_id)
  return c?.name || 'Unknown'
})

const auctionTitle = computed(() => {
  if (!project.value) return ''
  const a = store.auctions.find(a => a.id === project.value?.auction_id)
  return a?.title || 'Unknown'
})

const completedTasks = computed(() => project.value?.tasks.filter(t => t.completed).length || 0)
const progress = computed(() => {
  if (!project.value || project.value.tasks.length === 0) return 0
  return Math.round((completedTasks.value / project.value.tasks.length) * 100)
})

const getStatusClass = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-slate-100 text-slate-600'
    case 'ongoing': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>
