import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export interface Activity {
  id: string
  type: 'lead' | 'customer' | 'auction' | 'project' | 'system'
  sub_type: string
  content: string
  timestamp: string
  lead_id?: string
  customer_id?: string
  auction_id?: string
  project_id?: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  address: string
  status: 'new' | 'contacted' | 'qualified' | 'converted'
  value: number
  source: string
  notes: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  address: string
  lead_id?: string
  notes: string
  createdAt: string
}

export interface AuctionItem {
  id: string
  name: string
  description: string
  startingPrice: number
}

export interface AuctionPhase {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'pending' | 'ongoing' | 'completed'
}

export interface CostPlanning {
  id: string
  item: string
  estimatedCost: number
  actualCost: number
  status: 'planned' | 'paid' | 'cancelled'
}

export interface Auction {
  id: string
  title: string
  status: 'draft' | 'scheduled' | 'active' | 'completed'
  items: AuctionItem[]
  participants: { id: string; type: 'lead' | 'customer'; name: string }[]
  winner_id?: string
  finalPrice?: number
  schedule: AuctionPhase[]
  costPlanning: CostPlanning[]
  createdAt: string
}

export interface ProjectTask {
  id: string
  title: string
  completed: boolean
  beginDate: string
  endDate: string
  pic: string
}

export interface Project {
  id: string
  title: string
  customer_id: string
  auction_id: string
  status: 'planned' | 'ongoing' | 'completed'
  tasks: ProjectTask[]
  plannedCost: number
  actualCost: number
  createdAt: string
}

export const useAppStore = defineStore('app', () => {
  const authStore = useAuthStore()
  const leads = ref<Lead[]>([])
  const customers = ref<Customer[]>([])
  const auctions = ref<Auction[]>([])
  const projects = ref<Project[]>([])
  const activities = ref<Activity[]>([])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authStore.token}`
  })

  const fetchData = async () => {
    if (!authStore.token) return
    isLoading.value = true
    error.value = null
    try {
      const headers = { 'Authorization': `Bearer ${authStore.token}` }
      const [leadsRes, customersRes, auctionsRes, projectsRes, activitiesRes] = await Promise.all([
        fetch('/api/leads', { headers }),
        fetch('/api/customers', { headers }),
        fetch('/api/auctions', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/activities', { headers })
      ])

      if (leadsRes.status === 401 || leadsRes.status === 403) {
        authStore.logout()
        return
      }

      leads.value = await leadsRes.json()
      customers.value = await customersRes.json()
      auctions.value = await auctionsRes.json()
      projects.value = await projectsRes.json()
      activities.value = await activitiesRes.json()
    } catch (err) {
      error.value = 'Failed to fetch data'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  const convertLeadToCustomer = async (leadId: string) => {
    try {
      const res = await fetch('/api/leads/convert', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ leadId })
      })
      
      if (!res.ok) throw new Error('Failed to convert lead')
      
      const newCustomer = await res.json()
      await fetchData()
      return newCustomer
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const updateProjectCosts = async (projectId: string, planned: number, actual: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/costs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ planned, actual })
      })
      
      if (!res.ok) throw new Error('Failed to update project costs')
      
      const updatedProject = await res.json()
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
      
      const activitiesRes = await fetch('/api/activities', {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })
      activities.value = await activitiesRes.json()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const scheduleAuction = async (auctionId: string, date: string) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}/schedule`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ date })
      })
      if (!res.ok) throw new Error('Failed to schedule auction')
      await fetchData()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const startAuction = async (auctionId: string) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })
      if (!res.ok) throw new Error('Failed to start auction')
      await fetchData()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const completeAuction = async (auctionId: string, winnerId: string, finalPrice: number) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}/complete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ winnerId, finalPrice })
      })
      if (!res.ok) throw new Error('Failed to complete auction')
      await fetchData()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  return {
    leads,
    customers,
    auctions,
    projects,
    activities,
    isLoading,
    error,
    fetchData,
    convertLeadToCustomer,
    updateProjectCosts,
    scheduleAuction,
    startAuction,
    completeAuction,
    // Leads CRUD
    createLead: async (lead: Partial<Lead>) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(lead)
      })
      if (!res.ok) throw new Error('Failed to create lead')
      await fetchData()
    },
    updateLead: async (id: string, lead: Partial<Lead>) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(lead)
      })
      if (!res.ok) throw new Error('Failed to update lead')
      await fetchData()
    },
    deleteLead: async (id: string) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete lead')
      await fetchData()
    },
    // Customers CRUD
    createCustomer: async (customer: Partial<Customer>) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(customer)
      })
      if (!res.ok) throw new Error('Failed to create customer')
      await fetchData()
    },
    updateCustomer: async (id: string, customer: Partial<Customer>) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(customer)
      })
      if (!res.ok) throw new Error('Failed to update customer')
      await fetchData()
    },
    deleteCustomer: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete customer')
      await fetchData()
    },
    // Auctions CRUD
    createAuction: async (auction: Partial<Auction>) => {
      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(auction)
      })
      if (!res.ok) throw new Error('Failed to create auction')
      await fetchData()
    },
    updateAuction: async (id: string, auction: Partial<Auction>) => {
      const res = await fetch(`/api/auctions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(auction)
      })
      if (!res.ok) throw new Error('Failed to update auction')
      await fetchData()
    },
    deleteAuction: async (id: string) => {
      const res = await fetch(`/api/auctions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete auction')
      await fetchData()
    },
    // Projects CRUD
    createProject: async (project: Partial<Project>) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(project)
      })
      if (!res.ok) throw new Error('Failed to create project')
      await fetchData()
    },
    updateProject: async (id: string, project: Partial<Project>) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(project)
      })
      if (!res.ok) throw new Error('Failed to update project')
      await fetchData()
    },
    deleteProject: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete project')
      await fetchData()
    },
    // Auction Items
    addAuctionItem: async (auctionId: string, item: Partial<AuctionItem>) => {
      const res = await fetch(`/api/auctions/${auctionId}/items`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(item)
      })
      if (!res.ok) throw new Error('Failed to add auction item')
      await fetchData()
    },
    deleteAuctionItem: async (itemId: string) => {
      const res = await fetch(`/api/auction-items/${itemId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete auction item')
      await fetchData()
    },
    // Auction Participants
    addAuctionParticipant: async (auctionId: string, participant: { participantId: string; participantType: string; name: string }) => {
      const res = await fetch(`/api/auctions/${auctionId}/participants`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(participant)
      })
      if (!res.ok) throw new Error('Failed to add participant')
      await fetchData()
    },
    deleteAuctionParticipant: async (participantId: string) => {
      const res = await fetch(`/api/auction-participants/${participantId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Failed to remove participant')
      await fetchData()
    },
    // Auction Schedule
    addAuctionPhase: async (auctionId: string, phase: Partial<AuctionPhase>) => {
      const res = await fetch(`/api/auctions/${auctionId}/schedule`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(phase)
      })
      if (!res.ok) throw new Error('Failed to add schedule phase')
      await fetchData()
    },
    updateAuctionPhase: async (phaseId: string, phase: Partial<AuctionPhase>) => {
      const res = await fetch(`/api/auction-schedule/${phaseId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(phase)
      })
      if (!res.ok) throw new Error('Failed to update schedule phase')
      await fetchData()
    },
    deleteAuctionPhase: async (phaseId: string) => {
      const res = await fetch(`/api/auction-schedule/${phaseId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete schedule phase')
      await fetchData()
    },
    // Auction Cost Planning
    addCostPlanning: async (auctionId: string, cp: Partial<CostPlanning>) => {
      const res = await fetch(`/api/auctions/${auctionId}/cost-planning`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(cp)
      })
      if (!res.ok) throw new Error('Failed to add cost planning item')
      await fetchData()
    },
    updateCostPlanning: async (cpId: string, cp: Partial<CostPlanning>) => {
      const res = await fetch(`/api/auction-cost-planning/${cpId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(cp)
      })
      if (!res.ok) throw new Error('Failed to update cost planning item')
      await fetchData()
    },
    deleteCostPlanning: async (cpId: string) => {
      const res = await fetch(`/api/auction-cost-planning/${cpId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete cost planning item')
      await fetchData()
    },
    // Project Tasks
    addProjectTask: async (projectId: string, task: Partial<ProjectTask>) => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(task)
      })
      if (!res.ok) throw new Error('Failed to add task')
      await fetchData()
    },
    updateProjectTask: async (taskId: string, task: Partial<ProjectTask>) => {
      const res = await fetch(`/api/project-tasks/${taskId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(task)
      })
      if (!res.ok) throw new Error('Failed to update task')
      await fetchData()
    },
    deleteProjectTask: async (taskId: string) => {
      const res = await fetch(`/api/project-tasks/${taskId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete task')
      await fetchData()
    }
  }
})
