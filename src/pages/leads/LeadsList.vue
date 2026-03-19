<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Leads</h1>
        <p class="text-slate-500">Manage your potential business opportunities.</p>
      </div>
      <button class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center">
        <Plus class="w-4 h-4 mr-2" />
        Add Lead
      </button>
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-6 py-4 font-semibold">Name</th>
            <th class="px-6 py-4 font-semibold">Company</th>
            <th class="px-6 py-4 font-semibold">Status</th>
            <th class="px-6 py-4 font-semibold">Value</th>
            <th class="px-6 py-4 font-semibold">Created</th>
            <th class="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="lead in store.leads" :key="lead.id" class="hover:bg-slate-50 transition-colors group">
            <td class="px-6 py-4">
              <router-link :to="`/leads/${lead.id}`" class="font-bold text-slate-900 hover:text-emerald-600">
                {{ lead.name }}
              </router-link>
              <p class="text-xs text-slate-400">{{ lead.email }}</p>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">{{ lead.company }}</td>
            <td class="px-6 py-4">
              <span :class="getStatusClass(lead.status)" class="px-2 py-1 rounded text-xs font-medium">
                {{ lead.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm font-bold text-slate-900">${{ lead.value.toLocaleString() }}</td>
            <td class="px-6 py-4 text-sm text-slate-500">{{ new Date(lead.createdAt).toLocaleDateString() }}</td>
            <td class="px-6 py-4 text-right">
              <router-link :to="`/leads/${lead.id}`" class="text-slate-400 hover:text-emerald-600 p-2">
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
import { Plus, ChevronRight } from 'lucide-vue-next'

const store = useAppStore()

const getStatusClass = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800'
    case 'contacted': return 'bg-amber-100 text-amber-800'
    case 'qualified': return 'bg-purple-100 text-purple-800'
    case 'converted': return 'bg-emerald-100 text-emerald-800'
    default: return 'bg-slate-100 text-slate-800'
  }
}
</script>
