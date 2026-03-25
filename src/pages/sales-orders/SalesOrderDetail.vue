<template>
  <div v-if="order" class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-1">
        <div class="flex items-center space-x-3">
          <router-link to="/sales-orders" class="text-slate-400 hover:text-slate-600">
            <ArrowLeft class="w-5 h-5" />
          </router-link>
          <h2 class="text-2xl font-bold text-slate-900">Order {{ order.id }}</h2>
          <span 
            class="px-2 py-1 text-[10px] font-bold uppercase rounded-full"
            :class="getStatusClass(order.status)"
          >
            {{ order.status }}
          </span>
        </div>
        <p class="text-slate-500">Created on {{ new Date(order.createdAt).toLocaleDateString() }}</p>
      </div>
      <div class="flex space-x-3">
        <button 
          @click="showDeleteModal = true"
          class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Delete Order
        </button>
        <div class="relative inline-block text-left">
          <select 
            v-model="order.status"
            @change="handleStatusUpdate"
            class="bg-white border border-slate-200 rounded-lg text-sm font-medium px-4 py-2 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <!-- Left Column: Order Details & Items -->
      <div class="col-span-2 space-y-6">
        <!-- Items Table -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Order Items</h3>
            <button 
              @click="showAddItemModal = true"
              class="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center"
            >
              <Plus class="w-4 h-4 mr-1" />
              Add Item
            </button>
          </div>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-bottom border-slate-200">
                <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Price</th>
                <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="(item, index) in order.items" :key="index" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-sm text-slate-900">{{ item.description }}</td>
                <td class="px-6 py-4 text-sm text-slate-600">{{ item.quantity }}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${{ item.unitPrice.toLocaleString() }}</td>
                <td class="px-6 py-4 text-sm font-bold text-slate-900">${{ item.totalPrice.toLocaleString() }}</td>
                <td class="px-6 py-4 text-right">
                  <button 
                    @click="removeItem(index)"
                    class="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="order.items.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-slate-500 italic">
                  No items added yet.
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-slate-50 font-bold">
                <td colspan="3" class="px-6 py-4 text-right text-slate-500 uppercase tracking-wider">Total Amount</td>
                <td class="px-6 py-4 text-slate-900">${{ order.totalAmount.toLocaleString() }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Notes -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Notes</h3>
          <textarea 
            v-model="order.notes"
            rows="4"
            class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            placeholder="Add notes about this order..."
            @blur="handleUpdate"
          ></textarea>
        </div>
      </div>

      <!-- Right Column: Customer & Project Info -->
      <div class="space-y-6">
        <!-- Customer Info -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Customer</h3>
          <div v-if="customer" class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
              {{ customer.name.split(' ').map(n => n[0]).join('') }}
            </div>
            <div>
              <p class="font-bold text-slate-900">{{ customer.name }}</p>
              <p class="text-xs text-slate-500">{{ customer.email }}</p>
            </div>
          </div>
          <div class="pt-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Phone</span>
              <span class="text-slate-900">{{ customer?.phone }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Company</span>
              <span class="text-slate-900">{{ customer?.company }}</span>
            </div>
          </div>
        </div>

        <!-- Project Info -->
        <div v-if="project" class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Linked Project</h3>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Briefcase class="w-5 h-5" />
            </div>
            <div>
              <p class="font-bold text-slate-900">{{ project.title }}</p>
              <p class="text-xs text-slate-500">{{ project.status }}</p>
            </div>
          </div>
          <router-link 
            :to="`/projects/${project.id}`"
            class="block w-full text-center py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            View Project
          </router-link>
        </div>
      </div>
    </div>

    <!-- Add Item Modal -->
    <div v-if="showAddItemModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 class="text-lg font-bold text-slate-900">Add Order Item</h3>
          <button @click="showAddItemModal = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="addItem" class="p-6 space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase">Description</label>
            <input 
              v-model="newItem.description"
              type="text"
              required
              class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Item name or description"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase">Quantity</label>
              <input 
                v-model.number="newItem.quantity"
                type="number"
                min="1"
                required
                class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase">Unit Price</label>
              <input 
                v-model.number="newItem.unitPrice"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              @click="showAddItemModal = false"
              class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="p-6 text-center space-y-4">
          <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Trash2 class="w-8 h-8" />
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-bold text-slate-900">Delete Sales Order?</h3>
            <p class="text-slate-500">This action cannot be undone. All items associated with this order will be removed.</p>
          </div>
          <div class="flex space-x-3 pt-4">
            <button 
              @click="showDeleteModal = false"
              class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button 
              @click="handleDelete"
              class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-64">
    <Loader2 class="w-8 h-8 animate-spin text-emerald-600" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ArrowLeft, Plus, Trash2, X, Loader2, Briefcase } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const showAddItemModal = ref(false)
const showDeleteModal = ref(false)
const isUpdating = ref(false)

const newItem = ref({
  description: '',
  quantity: 1,
  unitPrice: 0
})

const order = computed(() => {
  return appStore.salesOrders.find(o => o.id === route.params.id)
})

const customer = computed(() => {
  return order.value ? appStore.customers.find(c => c.id === order.value?.customerId) : null
})

const project = computed(() => {
  return order.value ? appStore.projects.find(p => p.id === order.value?.projectId) : null
})

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

const addItem = async () => {
  if (!order.value) return
  
  const item = {
    ...newItem.value,
    totalPrice: newItem.value.quantity * newItem.value.unitPrice
  }
  
  const updatedItems = [...order.value.items, item]
  const totalAmount = updatedItems.reduce((sum, i) => sum + i.totalPrice, 0)
  
  try {
    await appStore.updateSalesOrder(order.value.id, {
      ...order.value,
      items: updatedItems,
      totalAmount
    })
    showAddItemModal.value = false
    newItem.value = { description: '', quantity: 1, unitPrice: 0 }
  } catch (err) {
    console.error(err)
  }
}

const removeItem = async (index: number) => {
  if (!order.value) return
  
  const updatedItems = order.value.items.filter((_, i) => i !== index)
  const totalAmount = updatedItems.reduce((sum, i) => sum + i.totalPrice, 0)
  
  try {
    await appStore.updateSalesOrder(order.value.id, {
      ...order.value,
      items: updatedItems,
      totalAmount
    })
  } catch (err) {
    console.error(err)
  }
}

const handleStatusUpdate = async () => {
  if (!order.value) return
  await handleUpdate()
}

const handleUpdate = async () => {
  if (!order.value || isUpdating.value) return
  isUpdating.value = true
  try {
    await appStore.updateSalesOrder(order.value.id, order.value)
  } catch (err) {
    console.error(err)
  } finally {
    isUpdating.value = false
  }
}

const handleDelete = async () => {
  if (!order.value) return
  try {
    await appStore.deleteSalesOrder(order.value.id)
    router.push('/sales-orders')
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  if (appStore.salesOrders.length === 0) {
    await appStore.fetchData()
  }
})
</script>
