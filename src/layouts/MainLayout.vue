<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- Sidebar -->
    <aside 
      class="bg-slate-900 text-white flex flex-col fixed inset-y-0 transition-all duration-300 ease-in-out z-30"
      :class="[isSidebarCollapsed ? 'w-20' : 'w-64']"
    >
      <div class="p-6 flex items-center" :class="[isSidebarCollapsed ? 'justify-center' : 'justify-between']">
        <h1 v-if="!isSidebarCollapsed" class="text-2xl font-bold text-emerald-400 truncate">Nexus CRM</h1>
        <div v-else class="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center text-slate-900 font-bold">N</div>
      </div>
      
      <nav class="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
        <!-- Dashboard -->
        <router-link 
          to="/"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group relative"
          :class="[
            $route.name === 'dashboard' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          ]"
        >
          <LayoutDashboard class="w-5 h-5 flex-shrink-0" :class="[!isSidebarCollapsed ? 'mr-3' : 'mx-auto']" />
          <span v-if="!isSidebarCollapsed" class="truncate">Dashboard</span>
          <div v-if="isSidebarCollapsed" class="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Dashboard
          </div>
        </router-link>

        <!-- Master Data -->
        <div class="space-y-1">
          <button 
            @click="toggleGroup('master')"
            class="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group relative text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Database class="w-5 h-5 flex-shrink-0" :class="[!isSidebarCollapsed ? 'mr-3' : 'mx-auto']" />
            <span v-if="!isSidebarCollapsed" class="truncate flex-1 text-left">Master Data</span>
            <ChevronDown v-if="!isSidebarCollapsed" class="w-4 h-4 transition-transform duration-200" :class="{'rotate-180': openGroups.master}" />
            
            <div v-if="isSidebarCollapsed" class="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Master Data
            </div>
          </button>
          
          <div v-if="openGroups.master && !isSidebarCollapsed" class="pl-4 space-y-1">
            <router-link 
              v-for="item in filteredMasterItems" 
              :key="item.name"
              :to="item.path"
              class="flex items-center px-4 py-2 text-xs font-medium rounded-lg transition-colors group relative"
              :class="[
                $route.name === item.routeName ? 'bg-slate-800/50 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4 mr-3 flex-shrink-0" />
              <span class="truncate">{{ item.name }}</span>
            </router-link>
          </div>
        </div>

        <!-- Transaction -->
        <div class="space-y-1">
          <button 
            @click="toggleGroup('transaction')"
            class="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group relative text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowRightLeft class="w-5 h-5 flex-shrink-0" :class="[!isSidebarCollapsed ? 'mr-3' : 'mx-auto']" />
            <span v-if="!isSidebarCollapsed" class="truncate flex-1 text-left">Transaction</span>
            <ChevronDown v-if="!isSidebarCollapsed" class="w-4 h-4 transition-transform duration-200" :class="{'rotate-180': openGroups.transaction}" />
            
            <div v-if="isSidebarCollapsed" class="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Transaction
            </div>
          </button>
          
          <div v-if="openGroups.transaction && !isSidebarCollapsed" class="pl-4 space-y-1">
            <router-link 
              v-for="item in transactionItems" 
              :key="item.name"
              :to="item.path"
              class="flex items-center px-4 py-2 text-xs font-medium rounded-lg transition-colors group relative"
              :class="[
                $route.name === item.routeName ? 'bg-slate-800/50 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4 mr-3 flex-shrink-0" />
              <span class="truncate">{{ item.name }}</span>
            </router-link>
          </div>
        </div>

        <!-- Local Deployment Section -->
        <div class="pt-4 pb-2 px-4" :class="[isSidebarCollapsed ? 'text-center' : '']">
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
            {{ isSidebarCollapsed ? 'Env' : 'Environment' }}
          </p>
        </div>
        <a 
          :href="appUrl" 
          target="_blank"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group relative"
        >
          <Globe class="w-5 h-5 flex-shrink-0" :class="[!isSidebarCollapsed ? 'mr-3' : 'mx-auto text-emerald-400']" />
          <span v-if="!isSidebarCollapsed" class="truncate text-emerald-400">Local Deployment</span>
          
          <div v-if="isSidebarCollapsed" class="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Local Deployment
          </div>
        </a>
      </nav>
      
      <div class="p-4 border-t border-slate-800">
        <div class="flex items-center" :class="[isSidebarCollapsed ? 'justify-center' : 'px-4 py-2']">
          <div class="w-8 h-8 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center text-xs font-bold">
            {{ authStore.user?.name.split(' ').map(n => n[0]).join('') }}
          </div>
          <div v-if="!isSidebarCollapsed" class="ml-3 truncate">
            <p class="text-sm font-medium truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-slate-400 truncate capitalize">{{ authStore.user?.role }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div 
      class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
      :style="{ marginLeft: isSidebarCollapsed ? '5rem' : '16rem' }"
    >
      <!-- Header Navigation -->
      <header class="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-8 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button 
            @click="toggleSidebar" 
            class="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu v-if="isSidebarCollapsed" class="w-5 h-5" />
            <ChevronLeft v-else class="w-5 h-5" />
          </button>
          
          <div class="relative hidden md:block">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search leads, auctions..." 
              class="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 w-64 transition-all focus:w-80"
            />
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <button class="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative">
            <Bell class="w-5 h-5" />
            <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div class="h-8 w-px bg-slate-200 mx-2"></div>
          
          <div class="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors group relative">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-bold text-slate-900">{{ authStore.user?.name }}</p>
              <p class="text-[10px] text-slate-500 uppercase font-bold">{{ authStore.user?.role }}</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
              <img :src="`https://picsum.photos/seed/${authStore.user?.username}/100/100`" alt="Avatar" class="w-full h-full object-cover" />
            </div>
            
            <!-- User Dropdown -->
            <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
              <button 
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <LogOut class="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-8 flex-1">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Gavel, 
  Briefcase, 
  History,
  Globe,
  Menu,
  Search,
  Bell,
  ChevronLeft,
  ChevronDown,
  LogOut,
  Database,
  ArrowRightLeft
} from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()
const isSidebarCollapsed = ref(false)
const appUrl = process.env.APP_URL || '#'

const openGroups = reactive({
  master: true,
  transaction: true
})

const toggleGroup = (group: 'master' | 'transaction') => {
  openGroups[group] = !openGroups[group]
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const masterItems = [
  { name: 'Leads', path: '/leads', routeName: 'leads-list', icon: Users },
  { name: 'Customers', path: '/customers', routeName: 'customers-list', icon: UserSquare2 },
  { name: 'Users', path: '/users', routeName: 'users-list', icon: Users, adminOnly: true },
]

const transactionItems = [
  { name: 'Auctions', path: '/auctions', routeName: 'auctions-list', icon: Gavel },
  { name: 'Projects', path: '/projects', routeName: 'projects-list', icon: Briefcase },
  { name: 'Sales Orders', path: '/sales-orders', routeName: 'sales-orders-list', icon: ArrowRightLeft },
  { name: 'Activities', path: '/activities', routeName: 'activities', icon: History },
]

const filteredMasterItems = computed(() => {
  return masterItems.filter(item => !item.adminOnly || authStore.isAdmin)
})
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

/* Custom scrollbar for sidebar */
nav::-webkit-scrollbar {
  width: 4px;
}
nav::-webkit-scrollbar-track {
  background: transparent;
}
nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
nav:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}
</style>
