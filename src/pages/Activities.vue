<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Global Activities</h1>
      <p class="text-slate-500">Track every interaction across the entire system.</p>
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-8">
        <div class="space-y-12">
          <div v-for="(group, date) in groupedActivities" :key="date">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center">
              <Calendar class="w-4 h-4 mr-2" />
              {{ date }}
            </h3>
            <div class="space-y-8 ml-2">
              <div v-for="activity in group" :key="activity.id" class="flex group">
                <div class="flex flex-col items-center mr-6">
                  <div :class="getIconBg(activity.type)" class="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110">
                    <component :is="getIcon(activity.type)" class="w-5 h-5" />
                  </div>
                  <div class="w-0.5 flex-1 bg-slate-100 my-2"></div>
                </div>
                <div class="pb-4 flex-1">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-bold text-slate-900">{{ activity.content }}</p>
                    <span class="text-xs text-slate-400">{{ new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                  </div>
                  <div class="mt-2 flex gap-2">
                    <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      {{ activity.type }}
                    </span>
                    <span v-if="activity.sub_type" class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      {{ activity.sub_type.replace('_', ' ') }}
                    </span>
                  </div>
                  
                  <!-- References -->
                  <div class="mt-3 flex flex-wrap gap-3">
                    <router-link v-if="activity.lead_id" :to="`/leads/${activity.lead_id}`" class="text-xs font-medium text-blue-600 hover:underline flex items-center">
                      <Link2 class="w-3 h-3 mr-1" /> Lead Profile
                    </router-link>
                    <router-link v-if="activity.customer_id" :to="`/customers/${activity.customer_id}`" class="text-xs font-medium text-emerald-600 hover:underline flex items-center">
                      <Link2 class="w-3 h-3 mr-1" /> Customer Profile
                    </router-link>
                    <router-link v-if="activity.auction_id" :to="`/auctions/${activity.auction_id}`" class="text-xs font-medium text-amber-600 hover:underline flex items-center">
                      <Link2 class="w-3 h-3 mr-1" /> Auction Details
                    </router-link>
                    <router-link v-if="activity.project_id" :to="`/projects/${activity.project_id}`" class="text-xs font-medium text-purple-600 hover:underline flex items-center">
                      <Link2 class="w-3 h-3 mr-1" /> Project View
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { 
  Calendar, 
  Users, 
  UserSquare2, 
  Gavel, 
  Briefcase, 
  Settings,
  Link2
} from 'lucide-vue-next'

const store = useAppStore()

const groupedActivities = computed(() => {
  const groups: Record<string, any[]> = {}
  store.activities.forEach(activity => {
    const date = new Date(activity.timestamp).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[date]) groups[date] = []
    groups[date].push(activity)
  })
  return groups
})

const getIcon = (type: string) => {
  switch (type) {
    case 'lead': return Users
    case 'customer': return UserSquare2
    case 'auction': return Gavel
    case 'project': return Briefcase
    default: return Settings
  }
}

const getIconBg = (type: string) => {
  switch (type) {
    case 'lead': return 'bg-blue-500'
    case 'customer': return 'bg-emerald-500'
    case 'auction': return 'bg-amber-500'
    case 'project': return 'bg-purple-500'
    default: return 'bg-slate-500'
  }
}
</script>
