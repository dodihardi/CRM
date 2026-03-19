<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Customers</h1>
        <p class="text-slate-500">Your active business partners and clients.</p>
      </div>
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-6 py-4 font-semibold">Name</th>
            <th class="px-6 py-4 font-semibold">Company</th>
            <th class="px-6 py-4 font-semibold">Source</th>
            <th class="px-6 py-4 font-semibold">Joined</th>
            <th class="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="customer in store.customers" :key="customer.id" class="hover:bg-slate-50 transition-colors group">
            <td class="px-6 py-4">
              <router-link :to="`/customers/${customer.id}`" class="font-bold text-slate-900 hover:text-emerald-600">
                {{ customer.name }}
              </router-link>
              <p class="text-xs text-slate-400">{{ customer.email }}</p>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">{{ customer.company }}</td>
            <td class="px-6 py-4">
              <span v-if="customer.lead_id" class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                From Lead
              </span>
              <span v-else class="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                Direct
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-500">{{ new Date(customer.createdAt).toLocaleDateString() }}</td>
            <td class="px-6 py-4 text-right">
              <router-link :to="`/customers/${customer.id}`" class="text-slate-400 hover:text-emerald-600 p-2">
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
</script>
