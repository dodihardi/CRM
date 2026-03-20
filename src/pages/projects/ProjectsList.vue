<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Projects</h1>
        <p class="text-slate-500">Post-auction delivery and implementation tracking.</p>
      </div>
      <button 
        @click="openAddModal"
        class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center"
      >
        <Plus class="w-4 h-4 mr-2" />
        Add Project
      </button>
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-6 py-4 font-semibold">Project Title</th>
            <th class="px-6 py-4 font-semibold">Customer</th>
            <th class="px-6 py-4 font-semibold">Status</th>
            <th class="px-6 py-4 font-semibold">Progress</th>
            <th class="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="store.projects.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-slate-500">
              No active projects.
            </td>
          </tr>
          <tr v-for="project in store.projects" :key="project.id" class="hover:bg-slate-50 transition-colors group">
            <td class="px-6 py-4">
              <router-link :to="`/projects/${project.id}`" class="font-bold text-slate-900 hover:text-emerald-600">
                {{ project.title }}
              </router-link>
              <p class="text-xs text-slate-400">ID: {{ project.id }}</p>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">{{ getCustomerName(project.customer_id) }}</td>
            <td class="px-6 py-4">
              <span :class="getStatusClass(project.status)" class="px-2 py-1 rounded text-xs font-medium uppercase">
                {{ project.status }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center">
                <div class="w-24 bg-slate-100 rounded-full h-1.5 mr-3">
                  <div class="bg-emerald-500 h-1.5 rounded-full" :style="{ width: `${getProgress(project)}%` }"></div>
                </div>
                <span class="text-xs font-bold text-slate-600">{{ getProgress(project) }}%</span>
              </div>
            </td>
            <td class="px-6 py-4 text-right space-x-2">
              <button @click="openEditModal(project)" class="text-slate-400 hover:text-emerald-600 p-2">
                <Pencil class="w-4 h-4" />
              </button>
              <button @click="confirmDelete(project)" class="text-slate-400 hover:text-red-600 p-2">
                <Trash2 class="w-4 h-4" />
              </button>
              <router-link :to="`/projects/${project.id}`" class="text-slate-400 hover:text-emerald-600 p-2">
                <ChevronRight class="w-5 h-5 inline" />
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit Project' : 'Add New Project' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
            <input v-model="form.title" type="text" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Customer</label>
              <select v-model="form.customer_id" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                <option value="" disabled>Select Customer</option>
                <option v-for="c in store.customers" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select v-model="form.status" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Planned Cost ($)</label>
              <input v-model.number="form.plannedCost" type="number" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Actual Cost ($)</label>
              <input v-model.number="form.actualCost" type="number" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="closeModal" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {{ isSubmitting ? 'Saving...' : 'Save Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="projectToDelete" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Delete Project?</h3>
        <p class="text-slate-500 mb-6">Are you sure you want to delete <strong>{{ projectToDelete.title }}</strong>?</p>
        <div class="flex space-x-3">
          <button @click="projectToDelete = null" class="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button @click="handleDelete" :disabled="isSubmitting" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
            {{ isSubmitting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { ChevronRight, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-vue-next'

const store = useAppStore()
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const projectToDelete = ref<any>(null)

const form = ref({
  id: '',
  title: '',
  description: '',
  customer_id: '',
  status: 'planned',
  plannedCost: 0,
  actualCost: 0,
  tasks: []
})

const openAddModal = () => {
  isEditing.value = false
  form.value = { id: '', title: '', description: '', customer_id: '', status: 'planned', plannedCost: 0, actualCost: 0, tasks: [] }
  showModal.value = true
}

const openEditModal = (project: any) => {
  isEditing.value = true
  form.value = { ...project }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      await store.updateProject(form.value.id, form.value)
    } else {
      await store.createProject(form.value)
    }
    closeModal()
  } catch (err) {
    alert('Failed to save project')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (project: any) => {
  projectToDelete.value = project
}

const handleDelete = async () => {
  if (!projectToDelete.value) return
  isSubmitting.value = true
  try {
    await store.deleteProject(projectToDelete.value.id)
    projectToDelete.value = null
  } catch (err) {
    alert('Failed to delete project')
  } finally {
    isSubmitting.value = false
  }
}

const getCustomerName = (id: string) => {
  const c = store.customers.find(c => c.id === id)
  return c?.name || 'Unknown'
}

const getProgress = (project: any) => {
  if (project.tasks.length === 0) return 0
  const completed = project.tasks.filter((t: any) => t.completed).length
  return Math.round((completed / project.tasks.length) * 100)
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-slate-100 text-slate-600'
    case 'ongoing': return 'bg-blue-100 text-blue-600'
    case 'completed': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-slate-100 text-slate-800'
  }
}
</script>
