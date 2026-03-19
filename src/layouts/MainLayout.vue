<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0">
      <div class="p-6">
        <h1 class="text-2xl font-bold text-emerald-400">Nexus CRM</h1>
      </div>
      
      <nav class="flex-1 px-4 space-y-1">
        <router-link 
          v-for="item in navItems" 
          :key="item.name"
          :to="item.path"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors"
          :class="[
            $route.name === item.routeName ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 mr-3" />
          {{ item.name }}
        </router-link>

        <!-- Local Deployment Section -->
        <div class="pt-4 pb-2 px-4">
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Environment</p>
        </div>
        <a 
          :href="appUrl" 
          target="_blank"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Globe class="w-5 h-5 mr-3 text-emerald-400" />
          Local Deployment
        </a>
      </nav>
      
      <div class="p-4 border-t border-slate-800">
        <div class="flex items-center px-4 py-2">
          <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">JD</div>
          <div class="ml-3">
            <p class="text-sm font-medium">John Doe</p>
            <p class="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 ml-64 p-8">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Gavel, 
  Briefcase, 
  History,
  Globe
} from 'lucide-vue-next'

const appUrl = process.env.APP_URL || '#'

const navItems = [
  { name: 'Dashboard', path: '/', routeName: 'dashboard', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', routeName: 'leads-list', icon: Users },
  { name: 'Customers', path: '/customers', routeName: 'customers-list', icon: UserSquare2 },
  { name: 'Auctions', path: '/auctions', routeName: 'auctions-list', icon: Gavel },
  { name: 'Projects', path: '/projects', routeName: 'projects-list', icon: Briefcase },
  { name: 'Activities', path: '/activities', routeName: 'activities', icon: History },
]
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
