<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">User Management</h1>
        <p class="text-slate-500">Manage system users and their roles</p>
      </div>
      <button 
        @click="openAddModal"
        class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
      >
        <UserPlus class="w-4 h-4 mr-2" />
        Add User
      </button>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created At</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold mr-3">
                  {{ user.name.charAt(0) }}
                </div>
                <span class="font-medium text-slate-900">{{ user.name }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-slate-600">{{ user.username }}</td>
            <td class="px-6 py-4">
              <span 
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="roleBadgeClass(user.role)"
              >
                {{ user.role }}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-500 text-sm">
              {{ new Date(user.createdAt).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 text-right space-x-2">
              <button 
                @click="openEditModal(user)"
                class="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                title="Edit User"
              >
                <Pencil class="w-4 h-4" />
              </button>
              <button 
                @click="confirmDelete(user)"
                class="p-2 text-slate-400 hover:text-red-600 transition-colors"
                title="Delete User"
                :disabled="user.id === authStore.user?.id"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit User' : 'Add New User' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              v-model="form.name" 
              type="text" 
              required
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              v-model="form.username" 
              type="text" 
              required
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="e.g. johndoe"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Password {{ isEditing ? '(Leave blank to keep current)' : '' }}
            </label>
            <input 
              v-model="form.password" 
              type="password" 
              :required="!isEditing"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select 
              v-model="form.role" 
              required
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none bg-white"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div v-if="error" class="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
            {{ error }}
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? 'Saving...' : 'Save User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="userToDelete" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Delete User?</h3>
        <p class="text-slate-500 mb-6">
          Are you sure you want to delete <strong>{{ userToDelete.name }}</strong>? This action cannot be undone.
        </p>
        <div class="flex space-x-3">
          <button 
            @click="userToDelete = null"
            class="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="handleDelete"
            :disabled="isSubmitting"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {{ isSubmitting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { UserPlus, Pencil, Trash2, X, AlertTriangle } from 'lucide-vue-next'

const authStore = useAuthStore()
const users = ref<any[]>([])
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const error = ref('')
const userToDelete = ref<any>(null)

const form = ref({
  id: '',
  username: '',
  password: '',
  role: 'staff',
  name: ''
})

const fetchUsers = async () => {
  try {
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      users.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch users:', err)
  }
}

onMounted(fetchUsers)

const roleBadgeClass = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-700'
    case 'staff': return 'bg-blue-100 text-blue-700'
    case 'viewer': return 'bg-slate-100 text-slate-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const openAddModal = () => {
  isEditing.value = false
  form.value = { id: '', username: '', password: '', role: 'staff', name: '' }
  error.value = ''
  showModal.value = true
}

const openEditModal = (user: any) => {
  isEditing.value = true
  form.value = { ...user, password: '' }
  error.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = async () => {
  isSubmitting.value = true
  error.value = ''
  try {
    const url = isEditing.value ? `/api/users/${form.value.id}` : '/api/users'
    const method = isEditing.value ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(form.value)
    })

    if (res.ok) {
      await fetchUsers()
      closeModal()
    } else {
      const data = await res.json()
      error.value = data.error || 'Failed to save user'
    }
  } catch (err) {
    error.value = 'An error occurred'
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (user: any) => {
  userToDelete.value = user
}

const handleDelete = async () => {
  if (!userToDelete.value) return
  isSubmitting.value = true
  try {
    const res = await fetch(`/api/users/${userToDelete.value.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      await fetchUsers()
      userToDelete.value = null
    }
  } catch (err) {
    console.error('Failed to delete user:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>
