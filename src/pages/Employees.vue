<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Employee Management</h1>
        <p class="text-slate-500">Manage your team members and their roles</p>
      </div>
      <button 
        @click="openAddModal"
        class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm"
      >
        <UserPlus class="w-4 h-4 mr-2" />
        Add Employee
      </button>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p class="text-sm text-slate-500 font-medium">Total Employees</p>
        <p class="text-2xl font-bold text-slate-900">{{ appStore.employees.length }}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p class="text-sm text-slate-500 font-medium">Active</p>
        <p class="text-2xl font-bold text-emerald-600">{{ appStore.employees.filter(e => e.status === 'active').length }}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p class="text-sm text-slate-500 font-medium">On Leave</p>
        <p class="text-2xl font-bold text-amber-600">{{ appStore.employees.filter(e => e.status === 'on_leave').length }}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p class="text-sm text-slate-500 font-medium">Inactive</p>
        <p class="text-2xl font-bold text-slate-400">{{ appStore.employees.filter(e => e.status === 'inactive').length }}</p>
      </div>
    </div>

    <!-- Employees Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="relative max-w-sm w-full">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search employees..." 
            class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div class="flex items-center space-x-2">
          <select 
            v-model="filterDepartment"
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">All Departments</option>
            <option v-for="dept in appStore.departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Position / Dept</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="emp in filteredEmployees" :key="emp.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold mr-3">
                    {{ emp.name.charAt(0) }}
                  </div>
                  <div>
                    <div class="font-bold text-slate-900">{{ emp.name }}</div>
                    <div class="flex items-center space-x-2">
                      <div class="text-xs text-slate-500">ID: {{ emp.id }}</div>
                      <div v-if="emp.userId" class="flex items-center text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                        <User class="w-2.5 h-2.5 mr-1" />
                        Linked
                      </div>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-slate-900">{{ emp.position }}</div>
                <div class="text-xs text-slate-500">{{ getDepartmentName(emp.departmentId) || emp.department }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-slate-600 flex items-center">
                  <Mail class="w-3 h-3 mr-1 opacity-50" /> {{ emp.email }}
                </div>
                <div class="text-sm text-slate-600 flex items-center">
                  <Phone class="w-3 h-3 mr-1 opacity-50" /> {{ emp.phone || '-' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span 
                  class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                  :class="statusBadgeClass(emp.status)"
                >
                  {{ emp.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500 text-sm">
                {{ new Date(emp.joinedAt).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <button 
                  @click="openEditModal(emp)"
                  class="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Edit Employee"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button 
                  @click="confirmDelete(emp)"
                  class="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete Employee"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <tr v-if="filteredEmployees.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                No employees found matching your criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit Employee' : 'Add New Employee' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Basic Info -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Information</h4>
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
                <label class="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  v-model="form.email" 
                  type="email" 
                  required
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input 
                  v-model="form.phone" 
                  type="tel" 
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. +1 (555) 000-0000"
                />
              </div>
            </div>

            <!-- Job Info -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Details</h4>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Position</label>
                <input 
                  v-model="form.position" 
                  type="text" 
                  required
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. Sales Manager"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <Combogrid
                  v-model="form.departmentId"
                  :options="appStore.departments"
                  :columns="[
                    { label: 'Name', key: 'name' }
                  ]"
                  placeholder="Select Department..."
                  displayKey="name"
                  :searchKeys="['name']"
                  @change="onDepartmentChange"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  v-model="form.status" 
                  required
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Joined Date</label>
                <input 
                  v-model="form.joinedAt" 
                  type="date" 
                  required
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <!-- Manager & User Selection -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Direct Manager</label>
              <Combogrid
                v-model="form.managerId"
                :options="managerOptions"
                placeholder="Select Manager..."
                displayKey="name"
                valueKey="value"
                :searchKeys="['name', 'position', 'department']"
                :columns="[
                  { label: 'Name', key: 'name' },
                  { label: 'Position', key: 'position' },
                  { label: 'Dept', key: 'department' }
                ]"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">System User Account</label>
              <Combogrid
                v-model="form.userId"
                :options="userOptions"
                placeholder="Assign to User..."
                displayKey="name"
                valueKey="value"
                :searchKeys="['name', 'username', 'role']"
                :columns="[
                  { label: 'Name', key: 'name' },
                  { label: 'Username', key: 'username' },
                  { label: 'Role', key: 'role' }
                ]"
              />
            </div>
          </div>

          <div v-if="error" class="mt-6 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
            {{ error }}
          </div>

          <div class="flex justify-end space-x-3 pt-8 border-t border-slate-100 mt-8">
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
              class="px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 font-bold shadow-sm"
            >
              {{ isSubmitting ? 'Saving...' : 'Save Employee' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="employeeToDelete" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Delete Employee?</h3>
        <p class="text-slate-500 mb-6">
          Are you sure you want to delete <strong>{{ employeeToDelete.name }}</strong>? This action cannot be undone.
        </p>
        <div class="flex space-x-3">
          <button 
            @click="employeeToDelete = null"
            class="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="handleDelete"
            :disabled="isSubmitting"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-bold"
          >
            {{ isSubmitting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore, type Employee } from '@/stores/app'
import { 
  UserPlus, 
  Pencil, 
  Trash2, 
  X, 
  AlertTriangle, 
  Search, 
  Mail, 
  Phone,
  Contact,
  User
} from 'lucide-vue-next'
import Combogrid from '@/components/Combogrid.vue'

const appStore = useAppStore()
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const error = ref('')
const employeeToDelete = ref<Employee | null>(null)
const searchQuery = ref('')
const filterDepartment = ref('')

const form = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  departmentId: '',
  status: 'active' as 'active' | 'inactive' | 'on_leave',
  joinedAt: new Date().toISOString().split('T')[0],
  managerId: '',
  userId: ''
})

const getDepartmentName = (id?: string) => {
  if (!id) return ''
  return appStore.departments.find(d => d.id === id)?.name || ''
}

const onDepartmentChange = (id: string) => {
  const dept = appStore.departments.find(d => d.id === id)
  if (dept) {
    form.value.department = dept.name
  }
}

onMounted(async () => {
  await Promise.all([
    appStore.fetchData(),
    appStore.fetchUsers()
  ])
})

const filteredEmployees = computed(() => {
  return appStore.employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDept = !filterDepartment.value || emp.departmentId === filterDepartment.value
    return matchesSearch && matchesDept
  })
})

const managerOptions = computed(() => {
  return appStore.employees
    .filter(e => !isEditing.value || e.id !== form.value.id)
    .map(e => ({
      value: e.id,
      label: e.name,
      name: e.name,
      position: e.position,
      department: e.department
    }))
})

const userOptions = computed(() => {
  return appStore.users.map(u => ({
    value: u.id,
    label: u.name,
    name: u.name,
    username: u.username,
    role: u.role
  }))
})

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700'
    case 'inactive': return 'bg-slate-100 text-slate-700'
    case 'on_leave': return 'bg-amber-100 text-amber-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const openAddModal = () => {
  isEditing.value = false
  form.value = { 
    id: '', 
    name: '', 
    email: '', 
    phone: '', 
    position: '', 
    department: '', 
    departmentId: '',
    status: 'active',
    joinedAt: new Date().toISOString().split('T')[0],
    managerId: '',
    userId: ''
  }
  error.value = ''
  showModal.value = true
}

const openEditModal = (emp: Employee) => {
  isEditing.value = true
  form.value = { 
    ...emp,
    departmentId: emp.departmentId || '',
    joinedAt: emp.joinedAt ? new Date(emp.joinedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    managerId: emp.managerId || '',
    userId: emp.userId || ''
  }
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
    if (isEditing.value) {
      await appStore.updateEmployee(form.value.id, form.value)
    } else {
      await appStore.createEmployee(form.value)
    }
    closeModal()
  } catch (err: any) {
    error.value = err.message || 'Failed to save employee'
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (emp: Employee) => {
  employeeToDelete.value = emp
}

const handleDelete = async () => {
  if (!employeeToDelete.value) return
  isSubmitting.value = true
  try {
    await appStore.deleteEmployee(employeeToDelete.value.id)
    employeeToDelete.value = null
  } catch (err: any) {
    console.error('Failed to delete employee:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>
