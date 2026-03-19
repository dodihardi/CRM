<template>
  <div v-if="auction" class="space-y-8">
    <header class="flex items-start justify-between">
      <div class="flex items-center">
        <router-link to="/auctions" class="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft class="w-6 h-6 text-slate-600" />
        </router-link>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-slate-900">{{ auction.title }}</h1>
            <span :class="getStatusClass(auction.status)" class="px-2 py-1 rounded text-xs font-medium uppercase tracking-wider">
              {{ auction.status }}
            </span>
          </div>
          <p class="text-slate-500">Scheduled for {{ new Date(auction.createdAt).toLocaleDateString() }}</p>
        </div>
      </div>
      <div v-if="auction.status === 'active'" class="flex gap-3">
        <button 
          @click="showResultModal = true"
          class="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          Finalize Result
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <!-- Auction Items -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Auction Items</h2>
            <span class="text-sm text-slate-500">{{ auction.items.length }} Items</span>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="item in auction.items" :key="item.id" class="p-6 flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <Package class="w-8 h-8" />
                </div>
                <div class="ml-4">
                  <h3 class="font-bold text-slate-900">{{ item.name }}</h3>
                  <p class="text-sm text-slate-500">{{ item.description }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-400 uppercase font-medium">Starting Price</p>
                <p class="text-lg font-bold text-slate-900">${{ item.startingPrice.toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Participants -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h2 class="text-xl font-bold text-slate-900">Registered Participants</h2>
          </div>
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="p in auction.participants" :key="p.id" class="flex items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
              <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                {{ p.name.charAt(0) }}
              </div>
              <div class="ml-3">
                <p class="text-sm font-bold text-slate-900">{{ p.name }}</p>
                <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                  {{ p.type }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Result Sidebar -->
      <aside v-if="auction.status === 'completed'" class="space-y-6">
        <div class="bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-10">
            <Trophy class="w-24 h-24" />
          </div>
          <h3 class="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">Auction Result</h3>
          <div class="space-y-6">
            <div>
              <p class="text-slate-400 text-sm mb-1">Winner</p>
              <p class="text-2xl font-bold">{{ getWinnerName(auction.winner_id) }}</p>
            </div>
            <div>
              <p class="text-slate-400 text-sm mb-1">Final Price</p>
              <p class="text-3xl font-bold text-emerald-400">${{ auction.finalPrice?.toLocaleString() }}</p>
            </div>
            <div class="pt-4 border-t border-slate-800">
              <router-link 
                v-if="relatedProject"
                :to="`/projects/${relatedProject.id}`"
                class="flex items-center text-sm font-medium text-white hover:text-emerald-400 transition-colors"
              >
                View Linked Project
                <ChevronRight class="w-4 h-4 ml-1" />
              </router-link>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Finalize Modal -->
    <div v-if="showResultModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Finalize Auction</h2>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Select Winner</label>
              <select v-model="resultForm.winnerId" class="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="">Choose participant...</option>
                <option v-for="p in auction.participants" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Final Price ($)</label>
              <input v-model.number="resultForm.price" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Enter final bid amount">
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showResultModal = false" class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button @click="submitResult" class="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Confirm Result</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ArrowLeft, Package, Trophy, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const store = useAppStore()

const auction = computed(() => store.auctions.find(a => a.id === route.params.id))
const relatedProject = computed(() => store.projects.find(p => p.auction_id === route.params.id))

const showResultModal = ref(false)
const resultForm = reactive({
  winnerId: '',
  price: 0
})

const submitResult = () => {
  if (auction.value && resultForm.winnerId && resultForm.price > 0) {
    store.completeAuction(auction.value.id, resultForm.winnerId, resultForm.price)
    showResultModal.value = false
  }
}

const getWinnerName = (id?: string) => {
  if (!id) return 'N/A'
  const p = auction.value?.participants.find(p => p.id === id)
  return p?.name || 'Unknown'
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-600'
    case 'active': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>
