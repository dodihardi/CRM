<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Customers</h1>
        <p class="text-slate-500">Your active business partners and clients.</p>
      </div>
      <button 
        @click="openAddModal"
        class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center"
      >
        <Plus class="w-4 h-4 mr-2" />
        Add Customer
      </button>
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-6 py-4 font-semibold">Name</th>
            <th class="px-6 py-4 font-semibold">Company</th>
            <th class="px-6 py-4 font-semibold">Phone</th>
            <th class="px-6 py-4 font-semibold">Source</th>
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
            <td class="px-6 py-4 text-sm text-slate-600">{{ customer.phone }}</td>
            <td class="px-6 py-4">
              <span v-if="customer.lead_id" class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                From Lead
              </span>
              <span v-else class="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                Direct
              </span>
            </td>
            <td class="px-6 py-4 text-right space-x-2">
              <button @click="openEditModal(customer)" class="text-slate-400 hover:text-emerald-600 p-2">
                <Pencil class="w-4 h-4" />
              </button>
              <button @click="confirmDelete(customer)" class="text-slate-400 hover:text-red-600 p-2">
                <Trash2 class="w-4 h-4" />
              </button>
              <router-link :to="`/customers/${customer.id}`" class="text-slate-400 hover:text-emerald-600 p-2">
                <ChevronRight class="w-5 h-5 inline" />
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit Customer' : 'Add New Customer' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input v-model="form.name" type="text" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input v-model="form.email" type="email" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input v-model="form.phone" type="text" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <input v-model="form.company" type="text" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <textarea v-model="form.address" rows="2" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea v-model="form.notes" rows="3" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="closeModal" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {{ isSubmitting ? 'Saving...' : 'Save Customer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="customerToDelete" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Delete Customer?</h3>
        <p class="text-slate-500 mb-6">Are you sure you want to delete <strong>{{ customerToDelete.name }}</strong>?</p>
        <div class="flex space-x-3">
          <button @click="customerToDelete = null" class="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
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
import { Plus, ChevronRight, Pencil, Trash2, X, AlertTriangle } from 'lucide-vue-next'

const store = useAppStore()
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const customerToDelete = ref<any>(null)

const form = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  notes: ''
})

const openAddModal = () => {
  isEditing.value = false
  form.value = { id: '', name: '', email: '', phone: '', company: '', address: '', notes: '' }
  showModal.value = true
}

const openEditModal = (customer: any) => {
  isEditing.value = true
  form.value = { ...customer }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      await store.updateCustomer(form.value.id, form.value)
    } else {
      await store.createCustomer(form.value)
    }
    closeModal()
  } catch (err) {
    alert('Failed to save customer')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (customer: any) => {
  customerToDelete.value = customer
}

const handleDelete = async () => {
  if (!customerToDelete.value) return
  isSubmitting.value = true
  try {
    await store.deleteCustomer(customerToDelete.value.id)
    customerToDelete.value = null
  } catch (err) {
    alert('Failed to delete customer')
  } finally {
    isSubmitting.value = false
  }
}
</script>
