<template>
  <div v-if="customer" class="space-y-8">
    <header class="flex items-start justify-between">
      <div class="flex items-center">
        <router-link to="/customers" class="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft class="w-6 h-6 text-slate-600" />
        </router-link>
        <div>
          <h1 class="text-3xl font-bold text-slate-900">{{ customer.name }}</h1>
          <p class="text-slate-500">{{ customer.company }} · {{ customer.email }}</p>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <!-- Related Projects -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h2 class="text-xl font-bold text-slate-900">Related Projects</h2>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-if="customerProjects.length === 0" class="p-8 text-center text-slate-500">
              No projects found for this customer.
            </div>
            <router-link 
              v-for="project in customerProjects" 
              :key="project.id"
              :to="`/projects/${project.id}`"
              class="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div>
                <h3 class="font-bold text-slate-900">{{ project.title }}</h3>
                <p class="text-sm text-slate-500">Created on {{ new Date(project.createdAt).toLocaleDateString() }}</p>
              </div>
              <span :class="getStatusClass(project.status)" class="px-2 py-1 rounded text-xs font-medium uppercase">
                {{ project.status }}
              </span>
            </router-link>
          </div>
        </section>

        <!-- Activity History -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 class="text-xl font-bold text-slate-900 mb-6">Customer Activity</h2>
          <div class="space-y-8">
            <div v-for="activity in customerActivities" :key="activity.id" class="flex">
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

      <aside class="space-y-8">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Contact Details</h3>
          <div class="space-y-4">
            <div class="flex items-center text-slate-600">
              <Mail class="w-4 h-4 mr-3" />
              <span class="text-sm">{{ customer.email }}</span>
            </div>
            <div class="flex items-center text-slate-600">
              <Building2 class="w-4 h-4 mr-3" />
              <span class="text-sm">{{ customer.company }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ArrowLeft, Mail, Building2 } from 'lucide-vue-next'

const route = useRoute()
const store = useAppStore()

const customer = computed(() => store.customers.find(c => c.id === route.params.id))
const customerProjects = computed(() => store.projects.filter(p => p.customer_id === route.params.id))
const customerActivities = computed(() => store.activities.filter(a => a.customer_id === route.params.id))

const getStatusClass = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-slate-100 text-slate-600'
    case 'ongoing': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-800'
  }
}
</script>
