import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
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
        }
      ]
    }
  ]
})

export default router
