<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Auctions</h1>
        <p class="text-slate-500">Manage and track your equipment auctions.</p>
      </div>
      <button class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center">
        <Plus class="w-4 h-4 mr-2" />
        Create Auction
      </button>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link 
        v-for="auction in store.auctions" 
        :key="auction.id"
        :to="`/auctions/${auction.id}`"
        class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-all group"
      >
        <div class="flex justify-between items-start mb-4">
          <span :class="getStatusClass(auction.status)" class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
            {{ auction.status }}
          </span>
          <span class="text-xs text-slate-400">{{ new Date(auction.createdAt).toLocaleDateString() }}</span>
        </div>
        <h3 class="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2">{{ auction.title }}</h3>
        <div class="flex items-center text-sm text-slate-500 mb-4">
          <Package class="w-4 h-4 mr-2" />
          {{ auction.items.length }} Items
          <span class="mx-2">·</span>
          <Users class="w-4 h-4 mr-2" />
          {{ auction.participants.length }} Participants
        </div>
        <div v-if="auction.status === 'completed'" class="pt-4 border-t border-slate-50 flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase">Final Price</span>
          <span class="text-lg font-bold text-emerald-600">${{ auction.finalPrice?.toLocaleString() }}</span>
        </div>
        <div v-else class="pt-4 border-t border-slate-50 flex items-center justify-between text-emerald-600 font-bold text-sm">
          View Details
          <ChevronRight class="w-4 h-4" />
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { Plus, Package, Users, ChevronRight } from 'lucide-vue-next'

const store = useAppStore()

const getStatusClass = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-600'
    case 'active': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>
