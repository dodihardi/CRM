<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Dashboard</h1>
      <p class="text-slate-500">Welcome back, here's what's happening today.</p>
    </header>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="stat in stats" :key="stat.label" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <div :class="`p-2 rounded-lg ${stat.colorClass}`">
            <component :is="stat.icon" class="w-6 h-6" />
          </div>
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">{{ stat.label }}</span>
        </div>
        <div class="flex items-baseline">
          <h3 class="text-2xl font-bold text-slate-900">{{ stat.value }}</h3>
          <span v-if="stat.trend" class="ml-2 text-xs font-medium text-emerald-500">{{ stat.trend }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Leads -->
      <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900">Recent Leads</h2>
          <router-link to="/leads" class="text-sm font-medium text-emerald-600 hover:text-emerald-700">View all</router-link>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="lead in store.leads.slice(0, 5)" :key="lead.id" class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                {{ lead.name.charAt(0) }}
              </div>
              <div class="ml-4">
                <p class="text-sm font-bold text-slate-900">{{ lead.name }}</p>
                <p class="text-xs text-slate-500">{{ lead.company }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-slate-900">${{ lead.value.toLocaleString() }}</p>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                {{ lead.status }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activities -->
      <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900">Global Activities</h2>
          <router-link to="/activities" class="text-sm font-medium text-emerald-600 hover:text-emerald-700">View all</router-link>
        </div>
        <div class="p-6">
          <div class="space-y-6">
            <div v-for="activity in store.activities.slice(0, 5)" :key="activity.id" class="flex">
              <div class="flex flex-col items-center mr-4">
                <div class="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                <div class="w-0.5 flex-1 bg-slate-100 my-1"></div>
              </div>
              <div class="pb-4">
                <p class="text-sm text-slate-900">{{ activity.content }}</p>
                <p class="text-xs text-slate-400">{{ new Date(activity.timestamp).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Users, UserSquare2, Gavel, Briefcase } from 'lucide-vue-next'

const store = useAppStore()

const stats = computed(() => [
  { label: 'Total Leads', value: store.leads.length, icon: Users, colorClass: 'bg-blue-100 text-blue-600', trend: '+12%' },
  { label: 'Customers', value: store.customers.length, icon: UserSquare2, colorClass: 'bg-emerald-100 text-emerald-600', trend: '+5%' },
  { label: 'Active Auctions', value: store.auctions.filter(a => a.status === 'active').length, icon: Gavel, colorClass: 'bg-amber-100 text-amber-600' },
  { label: 'Active Projects', value: store.projects.filter(p => p.status === 'ongoing').length, icon: Briefcase, colorClass: 'bg-purple-100 text-purple-600' },
])
</script>
