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
          component: Dashboard
        },
        {
          path: 'leads',
          name: 'leads-list',
          component: LeadsList
        },
        {
          path: 'leads/:id',
          name: 'lead-detail',
          component: LeadDetail
        },
        {
          path: 'customers',
          name: 'customers-list',
          component: CustomersList
        },
        {
          path: 'customers/:id',
          name: 'customer-detail',
          component: CustomerDetail
        },
        {
          path: 'auctions',
          name: 'auctions-list',
          component: AuctionsList
        },
        {
          path: 'auctions/:id',
          name: 'auction-detail',
          component: AuctionDetail
        },
        {
          path: 'projects',
          name: 'projects-list',
          component: ProjectsList
        },
        {
          path: 'projects/:id',
          name: 'project-detail',
          component: ProjectDetail
        },
        {
          path: 'sales-orders',
          name: 'sales-orders-list',
          component: SalesOrdersList
        },
        {
          path: 'sales-orders/:id',
          name: 'sales-order-detail',
          component: SalesOrderDetail
        },
        {
          path: 'activities',
          name: 'activities',
          component: Activities
        },
        {
          path: 'users',
          name: 'users-list',
          component: Users,
          meta: { requiresAdmin: true }
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
  } else {
    next()
  }
})

export default router
