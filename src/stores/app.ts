import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  company: string
  status: 'new' | 'contacted' | 'qualified' | 'converted'
  value: number
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  company: string
  lead_id?: string
  createdAt: string
}

export interface AuctionItem {
  id: string
  name: string
  description: string
  startingPrice: number
}

export interface Auction {
  id: string
  title: string
  status: 'draft' | 'active' | 'completed'
  items: AuctionItem[]
  participants: { id: string; type: 'lead' | 'customer'; name: string }[]
  winner_id?: string
  finalPrice?: number
  createdAt: string
}

export interface Project {
  id: string
  title: string
  customer_id: string
  auction_id: string
  status: 'planned' | 'ongoing' | 'completed'
  tasks: { id: string; title: string; completed: boolean }[]
  createdAt: string
}

export const useAppStore = defineStore('app', () => {
  // Mock Data
  const leads = ref<Lead[]>([
    { id: 'L1', name: 'Alice Johnson', email: 'alice@example.com', company: 'TechCorp', status: 'new', value: 5000, createdAt: '2024-03-10T10:00:00Z' },
    { id: 'L2', name: 'Bob Smith', email: 'bob@example.com', company: 'BuildIt', status: 'qualified', value: 12000, createdAt: '2024-03-12T14:30:00Z' },
  ])

  const customers = ref<Customer[]>([
    { id: 'C1', name: 'Charlie Brown', email: 'charlie@peanuts.com', company: 'Peanuts Inc', createdAt: '2024-01-15T09:00:00Z' }
  ])

  const auctions = ref<Auction[]>([
    { 
      id: 'A1', 
      title: 'Spring Equipment Auction', 
      status: 'active', 
      items: [
        { id: 'I1', name: 'Excavator X200', description: 'Heavy duty excavator', startingPrice: 50000 }
      ],
      participants: [
        { id: 'L2', type: 'lead', name: 'Bob Smith' },
        { id: 'C1', type: 'customer', name: 'Charlie Brown' }
      ],
      createdAt: '2024-03-15T08:00:00Z' 
    }
  ])

  const projects = ref<Project[]>([])

  const activities = ref<Activity[]>([
    { id: 'ACT1', type: 'lead', sub_type: 'creation', content: 'Lead Alice Johnson created', timestamp: '2024-03-10T10:00:00Z', lead_id: 'L1' },
    { id: 'ACT2', type: 'lead', sub_type: 'status_change', content: 'Lead Bob Smith status changed to Qualified', timestamp: '2024-03-12T15:00:00Z', lead_id: 'L2' },
  ])

  // Actions
  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    activities.value.unshift({
      id: 'ACT' + (activities.value.length + 1),
      timestamp: new Date().toISOString(),
      ...activity
    })
  }

  const convertLeadToCustomer = (leadId: string) => {
    const leadIndex = leads.value.findIndex(l => l.id === leadId)
    if (leadIndex !== -1) {
      const lead = leads.value[leadIndex]
      lead.status = 'converted'
      
      const newCustomer: Customer = {
        id: 'C' + (customers.value.length + 1),
        name: lead.name,
        email: lead.email,
        company: lead.company,
        lead_id: lead.id,
        createdAt: new Date().toISOString()
      }
      
      customers.value.push(newCustomer)
      addActivity({
        type: 'customer',
        sub_type: 'conversion',
        content: `Lead ${lead.name} converted to Customer`,
        customer_id: newCustomer.id,
        lead_id: lead.id
      })
      return newCustomer
    }
  }

  const completeAuction = (auctionId: string, winnerId: string, finalPrice: number) => {
    const auction = auctions.value.find(a => a.id === auctionId)
    if (auction) {
      auction.status = 'completed'
      auction.winner_id = winnerId
      auction.finalPrice = finalPrice

      // Auto-create project
      const winner = auction.participants.find(p => p.id === winnerId)
      let customerId = winnerId
      
      // If winner is a lead, convert them first
      if (winner?.type === 'lead') {
        const customer = convertLeadToCustomer(winnerId)
        if (customer) customerId = customer.id
      }

      const newProject: Project = {
        id: 'P' + (projects.value.length + 1),
        title: `Project: ${auction.title}`,
        customer_id: customerId,
        auction_id: auction.id,
        status: 'planned',
        tasks: [
          { id: 'T1', title: 'Initial Consultation', completed: false },
          { id: 'T2', title: 'Delivery Planning', completed: false }
        ],
        createdAt: new Date().toISOString()
      }

      projects.value.push(newProject)
      addActivity({
        type: 'project',
        sub_type: 'creation',
        content: `Project created for ${auction.title}`,
        project_id: newProject.id,
        auction_id: auction.id,
        customer_id: customerId
      })
    }
  }

  return {
    leads,
    customers,
    auctions,
    projects,
    activities,
    addActivity,
    convertLeadToCustomer,
    completeAuction
  }
})
