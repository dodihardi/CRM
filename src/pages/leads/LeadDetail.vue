<template>
  <div v-if="lead" class="space-y-8">
    <header class="flex items-start justify-between">
      <div class="flex items-center">
        <router-link to="/leads" class="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft class="w-6 h-6 text-slate-600" />
        </router-link>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-slate-900">{{ lead.name }}</h1>
            <span :class="getStatusClass(lead.status)" class="px-2 py-1 rounded text-xs font-medium">
              {{ lead.status }}
            </span>
          </div>
          <p class="text-slate-500">{{ lead.company }} · {{ lead.email }}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button 
          v-if="lead.status !== 'converted' && authStore.isStaff"
          @click="handleConvert"
          class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          Convert to Customer
        </button>
        <button class="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
          Edit Lead
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Info Column -->
      <div class="lg:col-span-2 space-y-8">
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 class="text-xl font-bold text-slate-900 mb-6">Lead Details</h2>
          <div class="grid grid-cols-2 gap-8">
            <div>
              <p class="text-xs font-medium text-slate-400 uppercase mb-1">Phone</p>
              <p class="text-lg font-medium text-slate-900">{{ lead.phone }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-400 uppercase mb-1">Source</p>
              <p class="text-lg font-medium text-slate-900">{{ lead.source }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-400 uppercase mb-1">Estimated Value</p>
              <p class="text-2xl font-bold text-slate-900">${{ lead.value.toLocaleString() }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-400 uppercase mb-1">Created At</p>
              <p class="text-lg font-medium text-slate-900">{{ new Date(lead.createdAt).toLocaleString() }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs font-medium text-slate-400 uppercase mb-1">Address</p>
              <p class="text-slate-600">{{ lead.address }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs font-medium text-slate-400 uppercase mb-1">Notes</p>
              <p class="text-slate-600">{{ lead.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 class="text-xl font-bold text-slate-900 mb-6">Activity Timeline</h2>
          <div class="space-y-8">
            <div v-for="activity in leadActivities" :key="activity.id" class="flex">
              <div class="flex flex-col items-center mr-6">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-emerald-600">
                  <component :is="getActivityIcon(activity.sub_type)" class="w-5 h-5" />
                </div>
                <div class="w-0.5 flex-1 bg-slate-100 my-2"></div>
              </div>
              <div class="pb-8">
                <p class="text-sm font-bold text-slate-900">{{ activity.content }}</p>
                <p class="text-xs text-slate-400 mt-1">{{ new Date(activity.timestamp).toLocaleString() }}</p>
                <div v-if="activity.sub_type === 'note'" class="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                  Customer expressed interest in the new excavator models.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions / Sidebar -->
      <div class="space-y-8">
        <div class="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
          <h3 class="text-lg font-bold mb-4">Quick Log</h3>
          <div class="space-y-4">
            <button class="w-full bg-slate-800 hover:bg-slate-700 text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center">
              <Phone class="w-4 h-4 mr-3 text-emerald-400" />
              Log Call
            </button>
            <button class="w-full bg-slate-800 hover:bg-slate-700 text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center">
              <Mail class="w-4 h-4 mr-3 text-emerald-400" />
              Log Email
            </button>
            <button class="w-full bg-slate-800 hover:bg-slate-700 text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center">
              <FileText class="w-4 h-4 mr-3 text-emerald-400" />
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-64">
    <p class="text-slate-500">Lead not found.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  FileText, 
  UserPlus, 
  RefreshCcw,
  CheckCircle2
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const authStore = useAuthStore()

const lead = computed(() => store.leads.find(l => l.id === route.params.id))
const leadActivities = computed(() => store.activities.filter(a => a.lead_id === route.params.id))

const handleConvert = async () => {
  if (lead.value) {
    try {
      const customer = await store.convertLeadToCustomer(lead.value.id)
      if (customer) {
        router.push(`/customers/${customer.id}`)
      }
    } catch (err) {
      alert('Failed to convert lead to customer')
    }
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800'
    case 'contacted': return 'bg-amber-100 text-amber-800'
    case 'qualified': return 'bg-purple-100 text-purple-800'
    case 'converted': return 'bg-emerald-100 text-emerald-800'
    default: return 'bg-slate-100 text-slate-800'
  }
}

const getActivityIcon = (subType: string) => {
  switch (subType) {
    case 'creation': return UserPlus
    case 'status_change': return RefreshCcw
    case 'conversion': return CheckCircle2
    default: return FileText
  }
}
</script>
