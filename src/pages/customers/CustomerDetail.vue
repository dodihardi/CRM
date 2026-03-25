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
      <div class="flex gap-3">
        <button 
          @click="openEditModal"
          class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center"
        >
          <Pencil class="w-4 h-4 mr-2" />
          Edit Customer
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <!-- Related Projects -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Related Projects</h2>
            <button @click="openAddProjectModal" class="text-emerald-600 hover:text-emerald-700 flex items-center text-sm font-bold">
              <Plus class="w-4 h-4 mr-1" /> Add Project
            </button>
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

        <!-- Auction History -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h2 class="text-xl font-bold text-slate-900">Auction History</h2>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-if="customerAuctions.length === 0" class="p-8 text-center text-slate-500">
              No auction history found for this customer.
            </div>
            <router-link 
              v-for="auction in customerAuctions" 
              :key="auction.id"
              :to="`/auctions/${auction.id}`"
              class="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div>
                <h3 class="font-bold text-slate-900">{{ auction.title }}</h3>
                <p class="text-sm text-slate-500">
                  {{ new Date(auction.createdAt).toLocaleDateString() }} · 
                  <span v-if="auction.winner_id === customer.id" class="text-emerald-600 font-bold">Winner</span>
                  <span v-else class="text-slate-400">Participant</span>
                </p>
              </div>
              <div class="text-right">
                <span :class="getAuctionStatusClass(auction.status)" class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  {{ auction.status }}
                </span>
                <p v-if="auction.finalPrice && auction.winner_id === customer.id" class="text-sm font-bold text-slate-900 mt-1">
                  ${{ auction.finalPrice.toLocaleString() }}
                </p>
              </div>
            </router-link>
          </div>
        </section>

        <!-- Documents -->
        <DocumentSection entityType="customer" :entityId="customer.id" />

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
              <Phone class="w-4 h-4 mr-3" />
              <span class="text-sm">{{ customer.phone }}</span>
            </div>
            <div class="flex items-center text-slate-600">
              <Building2 class="w-4 h-4 mr-3" />
              <span class="text-sm">{{ customer.company }}</span>
            </div>
            <div class="flex items-start text-slate-600">
              <MapPin class="w-4 h-4 mr-3 mt-1" />
              <span class="text-sm">{{ customer.address }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Notes</h3>
          <p class="text-sm text-slate-600 leading-relaxed">{{ customer.notes }}</p>
        </div>
      </aside>
    </div>

    <!-- Edit Customer Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <h3 class="text-xl font-bold text-slate-900">Edit Customer</h3>
          <button @click="showEditModal = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-6 h-6" />
          </button>
        </div>
        <form @submit.prevent="handleEditSubmit" class="p-8 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input v-model="editForm.name" type="text" required class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input v-model="editForm.email" type="email" required class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-bold text-slate-700 mb-1">Phone</label>
              <input v-model="editForm.phone" type="text" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-bold text-slate-700 mb-1">Company</label>
              <input v-model="editForm.company" type="text" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-bold text-slate-700 mb-1">Address</label>
              <textarea v-model="editForm.address" rows="2" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-bold text-slate-700 mb-1">Notes</label>
              <textarea v-model="editForm.notes" rows="3" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-6">
            <button type="button" @click="showEditModal = false" class="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Project Modal -->
    <div v-if="showProjectModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Add New Project</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Project Title</label>
              <input v-model="projectForm.title" type="text" required class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Linked Auction (Optional)</label>
              <select v-model="projectForm.auction_id" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="">No Auction</option>
                <option v-for="a in store.auctions" :key="a.id" :value="a.id">{{ a.title }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">Planned Cost ($)</label>
                <input v-model.number="projectForm.plannedCost" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">Status</label>
                <select v-model="projectForm.status" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="planned">Planned</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showProjectModal = false" class="flex-1 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button @click="handleProjectSubmit" :disabled="isSubmitting" class="flex-1 px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            {{ isSubmitting ? 'Creating...' : 'Create Project' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ArrowLeft, Mail, Building2, Phone, MapPin, Pencil, Plus, X } from 'lucide-vue-next'
import DocumentSection from '@/components/DocumentSection.vue'

const route = useRoute()
const store = useAppStore()

const customer = computed(() => store.customers.find(c => c.id === route.params.id))
const customerProjects = computed(() => store.projects.filter(p => p.customer_id === route.params.id))
const customerActivities = computed(() => store.activities.filter(a => a.customer_id === route.params.id))
const customerAuctions = computed(() => {
  if (!customer.value) return []
  return store.auctions.filter(a => 
    a.participants.some(p => p.id === customer.value?.id && p.type === 'customer') ||
    a.winner_id === customer.value?.id
  )
})

const isSubmitting = ref(false)

// Edit Customer
const showEditModal = ref(false)
const editForm = reactive({
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  notes: ''
})

const openEditModal = () => {
  if (customer.value) {
    editForm.name = customer.value.name
    editForm.email = customer.value.email
    editForm.phone = customer.value.phone
    editForm.company = customer.value.company
    editForm.address = customer.value.address
    editForm.notes = customer.value.notes
    showEditModal.value = true
  }
}

const handleEditSubmit = async () => {
  if (!customer.value) return
  isSubmitting.value = true
  try {
    await store.updateCustomer(customer.value.id, editForm)
    showEditModal.value = false
  } catch (err) {
    alert('Failed to update customer')
  } finally {
    isSubmitting.value = false
  }
}

// Add Project
const showProjectModal = ref(false)
const projectForm = reactive({
  title: '',
  auction_id: '',
  plannedCost: 0,
  status: 'planned' as const
})

const openAddProjectModal = () => {
  projectForm.title = ''
  projectForm.auction_id = ''
  projectForm.plannedCost = 0
  projectForm.status = 'planned'
  showProjectModal.value = true
}

const handleProjectSubmit = async () => {
  if (!customer.value) return
  isSubmitting.value = true
  try {
    await store.createProject({
      ...projectForm,
      customer_id: customer.value.id,
      tasks: [],
      actualCost: 0
    })
    showProjectModal.value = false
  } catch (err) {
    alert('Failed to create project')
  } finally {
    isSubmitting.value = false
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-slate-100 text-slate-600'
    case 'ongoing': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-800'
  }
}

const getAuctionStatusClass = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-600'
    case 'scheduled': return 'bg-amber-100 text-amber-600'
    case 'active': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>
