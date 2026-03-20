import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/Login.vue'),
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
          component: () => import('@/pages/Dashboard.vue')
        },
        {
          path: 'leads',
          name: 'leads-list',
          component: () => import('@/pages/leads/LeadsList.vue')
        },
        {
          path: 'leads/:id',
          name: 'lead-detail',
          component: () => import('@/pages/leads/LeadDetail.vue')
        },
        {
          path: 'customers',
          name: 'customers-list',
          component: () => import('@/pages/customers/CustomersList.vue')
        },
        {
          path: 'customers/:id',
          name: 'customer-detail',
          component: () => import('@/pages/customers/CustomerDetail.vue')
        },
        {
          path: 'auctions',
          name: 'auctions-list',
          component: () => import('@/pages/auctions/AuctionsList.vue')
        },
        {
          path: 'auctions/:id',
          name: 'auction-detail',
          component: () => import('@/pages/auctions/AuctionDetail.vue')
        },
        {
          path: 'projects',
          name: 'projects-list',
          component: () => import('@/pages/projects/ProjectsList.vue')
        },
        {
          path: 'projects/:id',
          name: 'project-detail',
          component: () => import('@/pages/projects/ProjectDetail.vue')
        },
        {
          path: 'activities',
          name: 'activities',
          component: () => import('@/pages/Activities.vue')
        },
        {
          path: 'users',
          name: 'users-list',
          component: () => import('@/pages/Users.vue'),
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
