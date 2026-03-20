<template>
  <div v-if="auction" class="space-y-8">
    <header class="flex items-start justify-between">
      <div class="flex items-center">
        <router-link to="/auctions" class="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft class="w-6 h-6 text-slate-600" />
        </router-link>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-slate-900">{{ auction.title }}</h1>
            <span :class="getStatusClass(auction.status)" class="px-2 py-1 rounded text-xs font-medium uppercase tracking-wider">
              {{ auction.status }}
            </span>
          </div>
          <p class="text-slate-500">Scheduled for {{ new Date(auction.createdAt).toLocaleDateString() }}</p>
        </div>
      </div>
      <div class="flex gap-3" v-if="authStore.isStaff">
        <button 
          @click="openEditAuctionModal"
          class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          Edit Auction
        </button>
        <button 
          v-if="auction.status === 'draft'"
          @click="showScheduleModal = true"
          class="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200"
        >
          Schedule Auction
        </button>
        <button 
          v-if="auction.status === 'scheduled'"
          @click="startAuction"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          Start Auction
        </button>
        <button 
          v-if="auction.status === 'active'"
          @click="showResultModal = true"
          class="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          Finalize Result
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <!-- Auction Schedule -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Auction Schedule</h2>
            <button v-if="authStore.isStaff" @click="openAddPhaseModal" class="text-emerald-600 hover:text-emerald-700 flex items-center text-sm font-bold">
              <Plus class="w-4 h-4 mr-1" /> Add Phase
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3 font-semibold">Phase</th>
                  <th class="px-6 py-3 font-semibold">Begin Date</th>
                  <th class="px-6 py-3 font-semibold">End Date</th>
                  <th class="px-6 py-3 font-semibold">Status</th>
                  <th class="px-6 py-3 font-semibold w-20">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="phase in auction.schedule" :key="phase.id" class="hover:bg-slate-50 transition-colors group">
                  <td class="px-6 py-4 font-bold text-slate-900 text-sm">{{ phase.name }}</td>
                  <td class="px-6 py-4 text-slate-600 text-sm">{{ new Date(phase.startDate).toLocaleString() }}</td>
                  <td class="px-6 py-4 text-slate-600 text-sm">{{ new Date(phase.endDate).toLocaleString() }}</td>
                  <td class="px-6 py-4">
                    <span :class="getPhaseStatusClass(phase.status)" class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      {{ phase.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button @click="openEditPhaseModal(phase)" class="text-slate-400 hover:text-emerald-600">
                        <Pencil class="w-4 h-4" />
                      </button>
                      <button @click="deletePhase(phase.id)" class="text-slate-400 hover:text-red-600">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Auction Items -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Auction Items</h2>
            <button v-if="authStore.isStaff" @click="openAddItemModal" class="text-emerald-600 hover:text-emerald-700 flex items-center text-sm font-bold">
              <Plus class="w-4 h-4 mr-1" /> Add Item
            </button>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="item in auction.items" :key="item.id" class="p-6 flex items-center justify-between group">
              <div class="flex items-center">
                <div class="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <Package class="w-8 h-8" />
                </div>
                <div class="ml-4">
                  <h3 class="font-bold text-slate-900">{{ item.name }}</h3>
                  <p class="text-sm text-slate-500">{{ item.description }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-6">
                <div class="text-right">
                  <p class="text-xs text-slate-400 uppercase font-medium">Starting Price</p>
                  <p class="text-lg font-bold text-slate-900">${{ item.startingPrice.toLocaleString() }}</p>
                </div>
                <button v-if="authStore.isStaff" @click="deleteItem(item.id)" class="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Auction Participants -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Participants</h2>
            <button v-if="authStore.isStaff" @click="openAddParticipantModal" class="text-emerald-600 hover:text-emerald-700 flex items-center text-sm font-bold">
              <Plus class="w-4 h-4 mr-1" /> Add Participant
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div v-for="p in auction.participants" :key="p.id" class="flex items-center justify-between p-4 bg-slate-50 rounded-xl group">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                  {{ p.name.charAt(0) }}
                </div>
                <div class="ml-3">
                  <p class="font-bold text-slate-900 text-sm">{{ p.name }}</p>
                  <p class="text-[10px] text-slate-400 uppercase font-bold">{{ p.type }}</p>
                </div>
              </div>
              <button v-if="authStore.isStaff" @click="deleteParticipant(p.id)" class="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <!-- Cost Planning Details -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Cost Planning</h2>
            <button v-if="authStore.isStaff" @click="openAddCostModal" class="text-emerald-600 hover:text-emerald-700 flex items-center text-sm font-bold">
              <Plus class="w-4 h-4 mr-1" /> Add Cost
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3 font-semibold">Item / Service</th>
                  <th class="px-6 py-3 font-semibold">Estimated</th>
                  <th class="px-6 py-3 font-semibold">Actual</th>
                  <th class="px-6 py-3 font-semibold">Status</th>
                  <th class="px-6 py-3 font-semibold w-20">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="cp in auction.costPlanning" :key="cp.id" class="hover:bg-slate-50 transition-colors group">
                  <td class="px-6 py-4 font-bold text-slate-900 text-sm">{{ cp.item }}</td>
                  <td class="px-6 py-4 text-slate-600 text-sm">${{ cp.estimatedCost.toLocaleString() }}</td>
                  <td class="px-6 py-4 text-slate-600 text-sm">${{ cp.actualCost.toLocaleString() }}</td>
                  <td class="px-6 py-4">
                    <span :class="getCostStatusClass(cp.status)" class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      {{ cp.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button @click="openEditCostModal(cp)" class="text-slate-400 hover:text-emerald-600">
                        <Pencil class="w-4 h-4" />
                      </button>
                      <button @click="deleteCost(cp.id)" class="text-slate-400 hover:text-red-600">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- Result Sidebar -->
      <aside v-if="auction.status === 'completed'" class="space-y-6">
        <div class="bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-10">
            <Trophy class="w-24 h-24" />
          </div>
          <h3 class="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">Auction Result</h3>
          <div class="space-y-6">
            <div>
              <p class="text-slate-400 text-sm mb-1">Winner</p>
              <p class="text-2xl font-bold">{{ getWinnerName(auction.winner_id) }}</p>
            </div>
            <div>
              <p class="text-slate-400 text-sm mb-1">Final Price</p>
              <p class="text-3xl font-bold text-emerald-400">${{ auction.finalPrice?.toLocaleString() }}</p>
            </div>
            <div class="pt-4 border-t border-slate-800">
              <router-link 
                v-if="relatedProject"
                :to="`/projects/${relatedProject.id}`"
                class="flex items-center text-sm font-medium text-white hover:text-emerald-400 transition-colors"
              >
                View Linked Project
                <ChevronRight class="w-4 h-4 ml-1" />
              </router-link>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Edit Auction Modal -->
    <div v-if="showEditAuctionModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Edit Auction</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Title</label>
              <input v-model="editAuctionForm.title" type="text" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select v-model="editAuctionForm.status" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showEditAuctionModal = false" class="flex-1 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button @click="saveAuction" class="flex-1 px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>

    <!-- Item Modal -->
    <div v-if="showItemModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Add Auction Item</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
              <input v-model="itemForm.name" type="text" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Description</label>
              <textarea v-model="itemForm.description" rows="3" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Starting Price ($)</label>
              <input v-model.number="itemForm.startingPrice" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showItemModal = false" class="flex-1 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button @click="submitItem" class="flex-1 px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700">Add Item</button>
        </div>
      </div>
    </div>

    <!-- Participant Modal -->
    <div v-if="showParticipantModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Add Participant</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Select Lead or Customer</label>
              <select v-model="participantForm.selectedId" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <optgroup label="Leads">
                  <option v-for="l in store.leads" :key="l.id" :value="`lead:${l.id}`">{{ l.name }} (Lead)</option>
                </optgroup>
                <optgroup label="Customers">
                  <option v-for="c in store.customers" :key="c.id" :value="`customer:${c.id}`">{{ c.name }} (Customer)</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showParticipantModal = false" class="flex-1 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button @click="submitParticipant" class="flex-1 px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700">Add</button>
        </div>
      </div>
    </div>

    <!-- Phase Modal -->
    <div v-if="showPhaseModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">{{ isEditingPhase ? 'Edit Phase' : 'Add Phase' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Phase Name</label>
              <input v-model="phaseForm.name" type="text" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                <input v-model="phaseForm.startDate" type="datetime-local" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">End Date</label>
                <input v-model="phaseForm.endDate" type="datetime-local" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select v-model="phaseForm.status" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="pending">Pending</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showPhaseModal = false" class="flex-1 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button @click="submitPhase" class="flex-1 px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>

    <!-- Cost Modal -->
    <div v-if="showCostModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">{{ isEditingCost ? 'Edit Cost' : 'Add Cost Item' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Item / Service</label>
              <input v-model="costForm.item" type="text" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">Estimated Cost ($)</label>
                <input v-model.number="costForm.estimatedCost" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">Actual Cost ($)</label>
                <input v-model.number="costForm.actualCost" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select v-model="costForm.status" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="planned">Planned</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showCostModal = false" class="flex-1 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button @click="submitCost" class="flex-1 px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>

    <!-- Schedule Modal (Quick Schedule) -->
    <div v-if="showScheduleModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Schedule Auction</h2>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Auction Date & Time</label>
              <input v-model="scheduleDate" type="datetime-local" class="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none">
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showScheduleModal = false" class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button @click="submitSchedule" class="flex-1 px-4 py-3 rounded-xl font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors">Schedule</button>
        </div>
      </div>
    </div>

    <!-- Finalize Modal -->
    <div v-if="showResultModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Finalize Auction</h2>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Select Winner</label>
              <select v-model="resultForm.winnerId" class="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="">Choose participant...</option>
                <option v-for="p in auction.participants" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Final Price ($)</label>
              <input v-model.number="resultForm.price" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Enter final bid amount">
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showResultModal = false" class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button @click="submitResult" class="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Confirm Result</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, Package, Trophy, ChevronRight, Calendar, Plus, Pencil, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const store = useAppStore()
const authStore = useAuthStore()

const auction = computed(() => store.auctions.find(a => a.id === route.params.id))
const relatedProject = computed(() => store.projects.find(p => p.auction_id === route.params.id))

// Edit Auction
const showEditAuctionModal = ref(false)
const editAuctionForm = reactive({ title: '', status: '' })
const openEditAuctionModal = () => {
  if (auction.value) {
    editAuctionForm.title = auction.value.title
    editAuctionForm.status = auction.value.status
    showEditAuctionModal.value = true
  }
}
const saveAuction = async () => {
  if (auction.value) {
    try {
      await store.updateAuction(auction.value.id, editAuctionForm)
      showEditAuctionModal.value = false
    } catch (err) {
      alert('Failed to update auction')
    }
  }
}

// Items
const showItemModal = ref(false)
const itemForm = reactive({ name: '', description: '', startingPrice: 0 })
const openAddItemModal = () => {
  itemForm.name = ''
  itemForm.description = ''
  itemForm.startingPrice = 0
  showItemModal.value = true
}
const submitItem = async () => {
  if (auction.value) {
    try {
      await store.addAuctionItem(auction.value.id, itemForm)
      showItemModal.value = false
    } catch (err) {
      alert('Failed to add item')
    }
  }
}
const deleteItem = async (id: string) => {
  if (confirm('Are you sure you want to delete this item?')) {
    try {
      await store.deleteAuctionItem(id)
    } catch (err) {
      alert('Failed to delete item')
    }
  }
}

// Participants
const showParticipantModal = ref(false)
const participantForm = reactive({ selectedId: '' })
const openAddParticipantModal = () => {
  participantForm.selectedId = ''
  showParticipantModal.value = true
}
const submitParticipant = async () => {
  if (auction.value && participantForm.selectedId) {
    const [type, id] = participantForm.selectedId.split(':')
    const entity = type === 'lead' ? store.leads.find(l => l.id === id) : store.customers.find(c => c.id === id)
    if (entity) {
      try {
        await store.addAuctionParticipant(auction.value.id, {
          participantId: id,
          participantType: type,
          name: entity.name
        })
        showParticipantModal.value = false
      } catch (err) {
        alert('Failed to add participant')
      }
    }
  }
}
const deleteParticipant = async (id: string) => {
  if (confirm('Remove this participant?')) {
    try {
      await store.deleteAuctionParticipant(id)
    } catch (err) {
      alert('Failed to remove participant')
    }
  }
}

// Phases
const showPhaseModal = ref(false)
const isEditingPhase = ref(false)
const currentPhaseId = ref('')
const phaseForm = reactive({ name: '', startDate: '', endDate: '', status: 'pending' })
const openAddPhaseModal = () => {
  isEditingPhase.value = false
  phaseForm.name = ''
  phaseForm.startDate = ''
  phaseForm.endDate = ''
  phaseForm.status = 'pending'
  showPhaseModal.value = true
}
const openEditPhaseModal = (phase: any) => {
  isEditingPhase.value = true
  currentPhaseId.value = phase.id
  phaseForm.name = phase.name
  phaseForm.startDate = new Date(phase.startDate).toISOString().slice(0, 16)
  phaseForm.endDate = new Date(phase.endDate).toISOString().slice(0, 16)
  phaseForm.status = phase.status
  showPhaseModal.value = true
}
const submitPhase = async () => {
  if (auction.value) {
    try {
      if (isEditingPhase.value) {
        await store.updateAuctionPhase(currentPhaseId.value, phaseForm)
      } else {
        await store.addAuctionPhase(auction.value.id, phaseForm)
      }
      showPhaseModal.value = false
    } catch (err) {
      alert('Failed to save phase')
    }
  }
}
const deletePhase = async (id: string) => {
  if (confirm('Delete this phase?')) {
    try {
      await store.deleteAuctionPhase(id)
    } catch (err) {
      alert('Failed to delete phase')
    }
  }
}

// Cost Planning
const showCostModal = ref(false)
const isEditingCost = ref(false)
const currentCostId = ref('')
const costForm = reactive({ item: '', estimatedCost: 0, actualCost: 0, status: 'planned' })
const openAddCostModal = () => {
  isEditingCost.value = false
  costForm.item = ''
  costForm.estimatedCost = 0
  costForm.actualCost = 0
  costForm.status = 'planned'
  showCostModal.value = true
}
const openEditCostModal = (cp: any) => {
  isEditingCost.value = true
  currentCostId.value = cp.id
  costForm.item = cp.item
  costForm.estimatedCost = cp.estimatedCost
  costForm.actualCost = cp.actualCost
  costForm.status = cp.status
  showCostModal.value = true
}
const submitCost = async () => {
  if (auction.value) {
    try {
      if (isEditingCost.value) {
        await store.updateCostPlanning(currentCostId.value, costForm)
      } else {
        await store.addCostPlanning(auction.value.id, costForm)
      }
      showCostModal.value = false
    } catch (err) {
      alert('Failed to save cost item')
    }
  }
}
const deleteCost = async (id: string) => {
  if (confirm('Delete this cost item?')) {
    try {
      await store.deleteCostPlanning(id)
    } catch (err) {
      alert('Failed to delete cost item')
    }
  }
}

const showScheduleModal = ref(false)
const scheduleDate = ref('')

const showResultModal = ref(false)
const resultForm = reactive({
  winnerId: '',
  price: 0
})

const submitSchedule = async () => {
  if (auction.value && scheduleDate.value) {
    try {
      await store.scheduleAuction(auction.value.id, scheduleDate.value)
      showScheduleModal.value = false
    } catch (err) {
      alert('Failed to schedule auction')
    }
  }
}

const startAuction = async () => {
  if (auction.value) {
    try {
      await store.startAuction(auction.value.id)
    } catch (err) {
      alert('Failed to start auction')
    }
  }
}

const submitResult = async () => {
  if (auction.value && resultForm.winnerId && resultForm.price > 0) {
    try {
      await store.completeAuction(auction.value.id, resultForm.winnerId, resultForm.price)
      showResultModal.value = false
    } catch (err) {
      alert('Failed to finalize auction result')
    }
  }
}

const getWinnerName = (id?: string) => {
  if (!id) return 'N/A'
  const p = auction.value?.participants.find(p => p.id === id)
  return p?.name || 'Unknown'
}

const getPhaseStatusClass = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-slate-100 text-slate-400'
    case 'ongoing': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

const getCostStatusClass = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-amber-100 text-amber-600'
    case 'paid': return 'bg-emerald-100 text-emerald-600'
    case 'cancelled': return 'bg-rose-100 text-rose-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-600'
    case 'scheduled': return 'bg-amber-100 text-amber-600'
    case 'active': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>
