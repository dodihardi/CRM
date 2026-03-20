<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Auctions</h1>
        <p class="text-slate-500">Manage and track your equipment auctions.</p>
      </div>
      <button 
        @click="openAddModal"
        class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center"
      >
        <Plus class="w-4 h-4 mr-2" />
        Create Auction
      </button>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="auction in store.auctions" 
        :key="auction.id"
        class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-all group relative"
      >
        <div class="flex justify-between items-start mb-4">
          <span :class="getStatusClass(auction.status)" class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
            {{ auction.status }}
          </span>
          <div class="flex space-x-1">
            <button @click="openEditModal(auction)" class="text-slate-400 hover:text-emerald-600 p-1">
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button @click="confirmDelete(auction)" class="text-slate-400 hover:text-red-600 p-1">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <router-link :to="`/auctions/${auction.id}`">
          <h3 class="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2">{{ auction.title }}</h3>
          <div class="flex items-center text-sm text-slate-500 mb-4">
            <Package class="w-4 h-4 mr-2" />
            {{ auction.items?.length || 0 }} Items
            <span class="mx-2">·</span>
            <UsersIcon class="w-4 h-4 mr-2" />
            {{ auction.participants?.length || 0 }} Participants
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

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit Auction' : 'Create New Auction' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Auction Title</label>
            <input v-model="form.title" type="text" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select v-model="form.status" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Final Price ($)</label>
              <input v-model.number="form.finalPrice" type="number" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="closeModal" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {{ isSubmitting ? 'Saving...' : 'Save Auction' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="auctionToDelete" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Delete Auction?</h3>
        <p class="text-slate-500 mb-6">Are you sure you want to delete <strong>{{ auctionToDelete.title }}</strong>?</p>
        <div class="flex space-x-3">
          <button @click="auctionToDelete = null" class="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button @click="handleDelete" :disabled="isSubmitting" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
            {{ isSubmitting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { Plus, Package, Users as UsersIcon, ChevronRight, Pencil, Trash2, X, AlertTriangle } from 'lucide-vue-next'

const store = useAppStore()
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const auctionToDelete = ref<any>(null)

const form = ref({
  id: '',
  title: '',
  description: '',
  status: 'draft',
  finalPrice: 0,
  items: [],
  participants: []
})

const openAddModal = () => {
  isEditing.value = false
  form.value = { id: '', title: '', description: '', status: 'draft', finalPrice: 0, items: [], participants: [] }
  showModal.value = true
}

const openEditModal = (auction: any) => {
  isEditing.value = true
  form.value = { ...auction }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      await store.updateAuction(form.value.id, form.value)
    } else {
      await store.createAuction(form.value)
    }
    closeModal()
  } catch (err) {
    alert('Failed to save auction')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (auction: any) => {
  auctionToDelete.value = auction
}

const handleDelete = async () => {
  if (!auctionToDelete.value) return
  isSubmitting.value = true
  try {
    await store.deleteAuction(auctionToDelete.value.id)
    auctionToDelete.value = null
  } catch (err) {
    alert('Failed to delete auction')
  } finally {
    isSubmitting.value = false
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-600'
    case 'scheduled': return 'bg-amber-100 text-amber-600'
    case 'active': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>
