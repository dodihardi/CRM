import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'

// Static imports for pages to avoid "module not loaded" issues
import Login from '@/pages/Login.vue'
import Dashboard from '@/pages/Dashboard.vue'
import LeadsList from '@/pages/leads/LeadsList.vue'
import LeadDetail from '@/pages/leads/LeadDetail.vue'
import CustomersList from '@/pages/customers/CustomersList.vue'
import CustomerDetail from '@/pages/customers/CustomerDetail.vue'
import AuctionsList from '@/pages/auctions/AuctionsList.vue'
import AuctionDetail from '@/pages/auctions/AuctionDetail.vue'
import ProjectsList from '@/pages/projects/ProjectsList.vue'
import ProjectDetail from '@/pages/projects/ProjectDetail.vue'
import SalesOrdersList from '@/pages/sales-orders/SalesOrdersList.vue'
import SalesOrderDetail from '@/pages/sales-orders/SalesOrderDetail.vue'
import Activities from '@/pages/Activities.vue'
import Users from '@/pages/Users.vue'
import Employees from '@/pages/Employees.vue'
import Departments from '@/pages/Departments.vue'
import MenuPermissions from '@/pages/MenuPermissions.vue'
import CCTVMonitoring from '@/pages/CCTVMonitoring.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { guest: true }
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: Dashboard,
          meta: { menuKey: 'dashboard' }
        },
        {
          path: 'leads',
          name: 'leads-list',
          component: LeadsList,
          meta: { menuKey: 'leads' }
        },
        {
          path: 'leads/:id',
          name: 'lead-detail',
          component: LeadDetail,
          meta: { menuKey: 'leads' }
        },
        {
          path: 'customers',
          name: 'customers-list',
          component: CustomersList,
          meta: { menuKey: 'customers' }
        },
        {
          path: 'customers/:id',
          name: 'customer-detail',
          component: CustomerDetail,
          meta: { menuKey: 'customers' }
        },
        {
          path: 'auctions',
          name: 'auctions-list',
          component: AuctionsList,
          meta: { menuKey: 'auctions' }
        },
        {
          path: 'auctions/:id',
          name: 'auction-detail',
          component: AuctionDetail,
          meta: { menuKey: 'auctions' }
        },
        {
          path: 'projects',
          name: 'projects-list',
          component: ProjectsList,
          meta: { menuKey: 'projects' }
        },
        {
          path: 'projects/:id',
          name: 'project-detail',
          component: ProjectDetail,
          meta: { menuKey: 'projects' }
        },
        {
          path: 'sales-orders',
          name: 'sales-orders-list',
          component: SalesOrdersList,
          meta: { menuKey: 'sales-orders' }
        },
        {
          path: 'sales-orders/:id',
          name: 'sales-order-detail',
          component: SalesOrderDetail,
          meta: { menuKey: 'sales-orders' }
        },
        {
          path: 'activities',
          name: 'activities',
          component: Activities,
          meta: { menuKey: 'activities' }
        },
        {
          path: 'users',
          name: 'users-list',
          component: Users,
          meta: { requiresAdmin: true, menuKey: 'users' }
        },
        {
          path: 'employees',
          name: 'employees-list',
          component: Employees,
          meta: { requiresAdmin: true, menuKey: 'employees' }
        },
        {
          path: 'departments',
          name: 'departments-list',
          component: Departments,
          meta: { requiresAdmin: true, menuKey: 'departments' }
        },
        {
          path: 'menu-permissions',
          name: 'menu-permissions',
          component: MenuPermissions,
          meta: { requiresAdmin: true, menuKey: 'menu-permissions' }
        },
        {
          path: 'cctv-monitoring',
          name: 'cctv-monitoring',
          component: CCTVMonitoring,
          meta: { menuKey: 'cctv-monitoring' }
        }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // If we have a token but no user, try to fetch the user
  if (authStore.token && !authStore.user) {
    await authStore.fetchMe()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'dashboard' })
  } else if (to.meta.menuKey && !authStore.hasPermission(to.meta.menuKey as string)) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
