<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Sales Orders</h2>
        <p class="text-slate-500">Manage your sales orders and their status.</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
      >
        <Plus class="w-4 h-4 mr-2" />
        New Sales Order
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4">
      <div class="flex-1 min-w-[200px]">
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search by ID, customer..." 
            class="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
      <select 
        v-model="statusFilter"
        class="bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 min-w-[150px]"
      >
        <option value="all">All Status</option>
        <option value="draft">Draft</option>
        <option value="confirmed">Confirmed</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Sales Orders Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-bottom border-slate-200">
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4">
              <router-link :to="`/sales-orders/${order.id}`" class="text-sm font-bold text-emerald-600 hover:underline">
                {{ order.id }}
              </router-link>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">
                  {{ getCustomerName(order.customerId).split(' ').map(n => n[0]).join('') }}
                </div>
                <span class="text-sm font-medium text-slate-900">{{ getCustomerName(order.customerId) }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">
              {{ new Date(order.orderDate).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 text-sm font-bold text-slate-900">
              ${{ order.totalAmount.toLocaleString() }}
            </td>
            <td class="px-6 py-4">
              <span 
                class="px-2 py-1 text-[10px] font-bold uppercase rounded-full"
                :class="getStatusClass(order.status)"
              >
                {{ order.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <router-link 
                :to="`/sales-orders/${order.id}`"
                class="text-slate-400 hover:text-emerald-600 transition-colors"
              >
                <ChevronRight class="w-5 h-5 ml-auto" />
              </router-link>
            </td>
          </tr>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-slate-500">
              No sales orders found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 class="text-lg font-bold text-slate-900">New Sales Order</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleCreate" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase">Customer</label>
              <select 
                v-model="newOrder.customerId"
                required
                class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Customer</option>
                <option v-for="customer in appStore.customers" :key="customer.id" :value="customer.id">
                  {{ customer.name }}
                </option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase">Project (Optional)</label>
              <select 
                v-model="newOrder.projectId"
                class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">None</option>
                <option v-for="project in appStore.projects" :key="project.id" :value="project.id">
                  {{ project.title }}
                </option>
              </select>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase">Order Date</label>
            <input 
              v-model="newOrder.orderDate"
              type="date"
              required
              class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase">Notes</label>
            <textarea 
              v-model="newOrder.notes"
              rows="3"
              class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Additional information..."
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="isSubmitting"
              class="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
              Create Sales Order
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Plus, Search, ChevronRight, X, Loader2 } from 'lucide-vue-next'

const appStore = useAppStore()
const searchQuery = ref('')
const statusFilter = ref('all')
const showCreateModal = ref(false)
const isSubmitting = ref(false)

const newOrder = ref({
  customerId: '',
  projectId: '',
  orderDate: new Date().toISOString().split('T')[0],
  notes: '',
  status: 'draft' as const,
  totalAmount: 0,
  items: []
})

const filteredOrders = computed(() => {
  return appStore.salesOrders.filter(order => {
    const customerName = getCustomerName(order.customerId).toLowerCase()
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                         customerName.includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || order.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const getCustomerName = (id: string) => {
  return appStore.customers.find(c => c.id === id)?.name || 'Unknown'
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-600'
    case 'confirmed': return 'bg-blue-100 text-blue-600'
    case 'shipped': return 'bg-amber-100 text-amber-600'
    case 'delivered': return 'bg-emerald-100 text-emerald-600'
    case 'cancelled': return 'bg-red-100 text-red-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

const handleCreate = async () => {
  isSubmitting.value = true
  try {
    await appStore.createSalesOrder(newOrder.value)
    showCreateModal.value = false
    // Reset form
    newOrder.value = {
      customerId: '',
      projectId: '',
      orderDate: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'draft',
      totalAmount: 0,
      items: []
    }
  } catch (err) {
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>
