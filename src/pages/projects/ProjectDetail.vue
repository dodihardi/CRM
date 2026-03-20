<template>
  <div v-if="project" class="space-y-8">
    <header class="flex items-start justify-between">
      <div class="flex items-center">
        <router-link to="/projects" class="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft class="w-6 h-6 text-slate-600" />
        </router-link>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-slate-900">{{ project.title }}</h1>
            <span :class="getStatusClass(project.status)" class="px-2 py-1 rounded text-xs font-medium uppercase tracking-wider">
              {{ project.status }}
            </span>
          </div>
          <p class="text-slate-500">Linked to Customer: {{ customerName }}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button @click="openEditProjectModal" class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
          Edit Project
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Task List -->
      <div class="lg:col-span-2 space-y-8">
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Project Tasks</h2>
            <div class="flex items-center text-sm text-slate-500">
              <span class="font-bold text-emerald-600 mr-1">{{ completedTasks }}</span> / {{ project.tasks.length }} Completed
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3 font-semibold w-12">Done</th>
                  <th class="px-6 py-3 font-semibold">Task Title</th>
                  <th class="px-6 py-3 font-semibold">Begin Date</th>
                  <th class="px-6 py-3 font-semibold">End Date</th>
                  <th class="px-6 py-3 font-semibold">PIC</th>
                  <th class="px-6 py-3 font-semibold w-20">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="task in project.tasks" :key="task.id" class="hover:bg-slate-50 transition-colors group">
                  <td class="px-6 py-4">
                    <button 
                      @click="toggleTask(task)"
                      class="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                      :class="task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'"
                    >
                      <Check v-if="task.completed" class="w-4 h-4" />
                    </button>
                  </td>
                  <td class="px-6 py-4">
                    <span class="font-medium text-sm" :class="task.completed ? 'text-slate-400 line-through' : 'text-slate-700'">
                      {{ task.title }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                    {{ new Date(task.beginDate).toLocaleDateString() }}
                  </td>
                  <td class="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                    {{ new Date(task.endDate).toLocaleDateString() }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 mr-2">
                        {{ task.pic.charAt(0) }}
                      </div>
                      <span class="text-sm text-slate-600 whitespace-nowrap">{{ task.pic }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button @click="openEditTaskModal(task)" class="text-slate-400 hover:text-emerald-600">
                        <Pencil class="w-4 h-4" />
                      </button>
                      <button @click="deleteTask(task.id)" class="text-slate-400 hover:text-red-600">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-6 bg-slate-50/50 border-t border-slate-100">
            <button @click="openAddTaskModal" class="text-emerald-600 text-sm font-bold flex items-center hover:text-emerald-700">
              <Plus class="w-4 h-4 mr-1" />
              Add Task
            </button>
          </div>
        </section>

        <!-- Project Timeline -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 class="text-xl font-bold text-slate-900 mb-6">Project History</h2>
          <div class="space-y-8">
            <div v-for="activity in projectActivities" :key="activity.id" class="flex">
              <div class="flex flex-col items-center mr-6">
                <div class="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                <div class="w-0.5 flex-1 bg-slate-100 my-1"></div>
              </div>
              <div class="pb-4">
                <p class="text-sm text-slate-900">{{ activity.content }}</p>
                <p class="text-xs text-slate-400">{{ new Date(activity.timestamp).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Sidebar Info -->
      <aside class="space-y-8">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Info</h3>
          <div class="flex items-center mb-6">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
              {{ customerName.charAt(0) }}
            </div>
            <div class="ml-4">
              <p class="font-bold text-slate-900">{{ customerName }}</p>
              <router-link :to="`/customers/${project.customer_id}`" class="text-xs text-emerald-600 font-bold hover:underline">View Profile</router-link>
            </div>
          </div>
          <div class="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <p class="text-xs text-slate-400 uppercase font-bold">Auction Source</p>
              <router-link :to="`/auctions/${project.auction_id}`" class="text-sm font-medium text-slate-900 hover:text-emerald-600">
                {{ auctionTitle }}
              </router-link>
            </div>
          </div>
        </div>

        <div class="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-100">
          <h3 class="font-bold mb-2">Project Progress</h3>
          <div class="w-full bg-emerald-700/50 rounded-full h-2 mb-4">
            <div class="bg-white h-2 rounded-full transition-all duration-500" :style="{ width: `${progress}%` }"></div>
          </div>
          <p class="text-xs text-emerald-100">{{ progress }}% of tasks completed</p>
        </div>

        <!-- Cost Planning & Realization -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest">Cost Realization</h3>
            <button v-if="authStore.isAdmin" @click="openCostModal" class="text-emerald-600 hover:text-emerald-700">
              <Settings class="w-4 h-4" />
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <p class="text-xs text-slate-400 font-bold uppercase mb-1">Planned Cost</p>
              <p class="text-xl font-bold text-slate-900">${{ project.plannedCost.toLocaleString() }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-bold uppercase mb-1">Actual Realization</p>
              <p class="text-xl font-bold" :class="project.actualCost > project.plannedCost ? 'text-red-600' : 'text-emerald-600'">
                ${{ project.actualCost.toLocaleString() }}
              </p>
            </div>
            
            <div class="pt-4 border-t border-slate-100">
              <div class="flex justify-between text-xs font-bold mb-2">
                <span class="text-slate-500">Utilization</span>
                <span :class="costUtilization > 100 ? 'text-red-600' : 'text-emerald-600'">{{ costUtilization }}%</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500" 
                  :class="costUtilization > 100 ? 'bg-red-500' : 'bg-emerald-500'"
                  :style="{ width: `${Math.min(costUtilization, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Edit Project Modal -->
    <div v-if="showEditProjectModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Edit Project</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Title</label>
              <input v-model="editProjectForm.title" type="text" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select v-model="editProjectForm.status" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showEditProjectModal = false" class="flex-1 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button @click="saveProject" class="flex-1 px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>

    <!-- Task Modal -->
    <div v-if="showTaskModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">{{ isEditingTask ? 'Edit Task' : 'Add Task' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Task Title</label>
              <input v-model="taskForm.title" type="text" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">Begin Date</label>
                <input v-model="taskForm.beginDate" type="date" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">End Date</label>
                <input v-model="taskForm.endDate" type="date" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">PIC</label>
              <input v-model="taskForm.pic" type="text" class="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="flex items-center">
              <input v-model="taskForm.completed" type="checkbox" id="taskCompleted" class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500">
              <label for="taskCompleted" class="ml-2 text-sm font-medium text-slate-700">Completed</label>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showTaskModal = false" class="flex-1 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button @click="submitTask" class="flex-1 px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>

    <!-- Cost Edit Modal -->
    <div v-if="showCostModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Update Project Costs</h2>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Planned Cost ($)</label>
              <input v-model.number="costForm.planned" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Actual Realization ($)</label>
              <input v-model.number="costForm.actual" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none">
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <button @click="showCostModal = false" class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button @click="saveCosts" class="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, Check, Plus, Settings, Pencil, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const store = useAppStore()
const authStore = useAuthStore()

const project = computed(() => store.projects.find(p => p.id === route.params.id))
const projectActivities = computed(() => store.activities.filter(a => a.project_id === route.params.id))

const customerName = computed(() => {
  if (!project.value) return ''
  const c = store.customers.find(c => c.id === project.value?.customer_id)
  return c?.name || 'Unknown'
})

const auctionTitle = computed(() => {
  if (!project.value) return ''
  const a = store.auctions.find(a => a.id === project.value?.auction_id)
  return a?.title || 'Unknown'
})

const completedTasks = computed(() => project.value?.tasks.filter(t => t.completed).length || 0)
const progress = computed(() => {
  if (!project.value || project.value.tasks.length === 0) return 0
  return Math.round((completedTasks.value / project.value.tasks.length) * 100)
})

const costUtilization = computed(() => {
  if (!project.value || project.value.plannedCost === 0) return 0
  return Math.round((project.value.actualCost / project.value.plannedCost) * 100)
})

// Edit Project
const showEditProjectModal = ref(false)
const editProjectForm = reactive({ title: '', status: '' })
const openEditProjectModal = () => {
  if (project.value) {
    editProjectForm.title = project.value.title
    editProjectForm.status = project.value.status
    showEditProjectModal.value = true
  }
}
const saveProject = async () => {
  if (project.value) {
    try {
      await store.updateProject(project.value.id, editProjectForm)
      showEditProjectModal.value = false
    } catch (err) {
      alert('Failed to update project')
    }
  }
}

// Tasks
const showTaskModal = ref(false)
const isEditingTask = ref(false)
const currentTaskId = ref('')
const taskForm = reactive({ title: '', completed: false, beginDate: '', endDate: '', pic: '' })

const openAddTaskModal = () => {
  isEditingTask.value = false
  taskForm.title = ''
  taskForm.completed = false
  taskForm.beginDate = new Date().toISOString().split('T')[0]
  taskForm.endDate = new Date().toISOString().split('T')[0]
  taskForm.pic = ''
  showTaskModal.value = true
}

const openEditTaskModal = (task: any) => {
  isEditingTask.value = true
  currentTaskId.value = task.id
  taskForm.title = task.title
  taskForm.completed = task.completed
  taskForm.beginDate = new Date(task.beginDate).toISOString().split('T')[0]
  taskForm.endDate = new Date(task.endDate).toISOString().split('T')[0]
  taskForm.pic = task.pic
  showTaskModal.value = true
}

const submitTask = async () => {
  if (project.value) {
    try {
      if (isEditingTask.value) {
        await store.updateProjectTask(currentTaskId.value, taskForm)
      } else {
        await store.addProjectTask(project.value.id, taskForm)
      }
      showTaskModal.value = false
    } catch (err) {
      alert('Failed to save task')
    }
  }
}

const toggleTask = async (task: any) => {
  try {
    await store.updateProjectTask(task.id, { ...task, completed: !task.completed })
  } catch (err) {
    alert('Failed to update task status')
  }
}

const deleteTask = async (id: string) => {
  if (confirm('Delete this task?')) {
    try {
      await store.deleteProjectTask(id)
    } catch (err) {
      alert('Failed to delete task')
    }
  }
}

const showCostModal = ref(false)
const costForm = reactive({
  planned: 0,
  actual: 0
})

const openCostModal = () => {
  if (project.value) {
    costForm.planned = project.value.plannedCost
    costForm.actual = project.value.actualCost
    showCostModal.value = true
  }
}

const saveCosts = async () => {
  if (project.value) {
    try {
      await store.updateProjectCosts(project.value.id, costForm.planned, costForm.actual)
      showCostModal.value = false
    } catch (err) {
      alert('Failed to update project costs')
    }
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-slate-100 text-slate-600'
    case 'ongoing': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>
