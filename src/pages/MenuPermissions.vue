<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Menu Permissions</h1>
        <p class="text-slate-500">Manage menu access for each user role</p>
      </div>
      <div class="flex space-x-2">
        <button 
          @click="showManageRoles = true"
          class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center"
        >
          <Shield class="w-4 h-4 mr-2" />
          Manage Roles
        </button>
        <button 
          @click="showAddRole = !showAddRole; showAddMenu = false"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors flex items-center"
        >
          <Shield class="w-4 h-4 mr-2" />
          {{ showAddRole ? 'Close' : 'Add New Role' }}
        </button>
        <button 
          @click="showAddMenu = !showAddMenu; showAddRole = false"
          class="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center"
        >
          <Plus class="w-4 h-4 mr-2" />
          {{ showAddMenu ? 'Close' : 'Add New Menu' }}
        </button>
      </div>
    </div>

    <!-- Add New Role Form -->
    <div v-if="showAddRole" class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div class="flex justify-between items-start mb-4">
        <h3 class="font-bold text-slate-900">Add New User Role</h3>
        <div class="text-right">
          <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Existing Roles</span>
          <div class="flex flex-wrap justify-end gap-1">
            <span 
              v-for="role in roles" 
              :key="role.id"
              class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium capitalize"
            >
              {{ role.name }}
            </span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2">
          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Role Name</label>
          <input 
            v-model="newRoleName"
            type="text"
            placeholder="e.g. manager"
            class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div class="flex items-end">
          <button 
            @click="addRole"
            :disabled="!newRoleName || addingRole"
            class="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {{ addingRole ? 'Adding...' : 'Add Role' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add New Menu Form -->
    <div v-if="showAddMenu" class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 class="font-bold text-slate-900 mb-4">Add New Available Menu</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Menu Key</label>
          <input 
            v-model="newMenu.key"
            type="text"
            placeholder="e.g. settings"
            class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Label</label>
          <input 
            v-model="newMenu.label"
            type="text"
            placeholder="e.g. Settings"
            class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div class="flex items-end">
          <button 
            @click="addMenu"
            :disabled="!newMenu.key || !newMenu.label || addingMenu"
            class="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {{ addingMenu ? 'Adding...' : 'Add Menu' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Role List Overview -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Role List Overview</h3>
        <span class="text-xs text-slate-500">{{ roles.length }} roles total</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <div 
          v-for="role in roles" 
          :key="role.id"
          class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2 group"
        >
          <Shield class="w-3 h-3 text-blue-500" />
          <span class="text-sm font-medium text-slate-700 capitalize">{{ role.name }}</span>
          <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2" v-if="role.name !== 'admin'">
            <button @click="editingRole = role; editRoleName = role.name; showManageRoles = true" class="p-1 text-slate-400 hover:text-blue-500">
              <Pencil class="w-3 h-3" />
            </button>
            <button @click="deleteRole(role.id)" class="p-1 text-slate-400 hover:text-red-500">
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="role in roles" 
        :key="role.id"
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
      >
        <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 class="font-bold text-slate-900 capitalize">{{ role.name }} Role</h3>
          <Shield class="w-4 h-4 text-slate-400" />
        </div>
        
        <div class="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px]">
          <div 
            v-for="menu in availableMenus" 
            :key="menu.menu_key"
            class="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group"
          >
            <div class="flex items-center space-x-2">
              <span class="text-sm text-slate-700">{{ menu.label }}</span>
              <button 
                v-if="role.name === 'admin'"
                @click="deleteMenu(menu.id)"
                class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                title="Delete menu from available list"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
            <button 
              @click="togglePermission(role.name, menu.menu_key)"
              :disabled="role.name === 'admin' && menu.menu_key === 'menu-permissions'"
              class="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="[hasPermission(role.name, menu.menu_key) ? 'bg-emerald-500' : 'bg-slate-200']"
            >
              <span 
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="[hasPermission(role.name, menu.menu_key) ? 'translate-x-5' : 'translate-x-0']"
              ></span>
            </button>
          </div>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-200">
          <button 
            @click="savePermissions(role.name)"
            :disabled="saving === role.name"
            class="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {{ saving === role.name ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Manage Roles Modal -->
    <div v-if="showManageRoles" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-bold text-slate-900">Manage Existing Roles</h3>
          <button @click="showManageRoles = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div v-for="role in roles" :key="role.id" class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div v-if="editingRole?.id === role.id" class="flex-1 flex space-x-2">
                <input 
                  v-model="editRoleName"
                  type="text"
                  class="flex-1 px-3 py-1 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button @click="updateRole" class="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600">Save</button>
                <button @click="editingRole = null" class="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-300">Cancel</button>
              </div>
              <template v-else>
                <span class="font-bold text-slate-700 capitalize">{{ role.name }}</span>
                <div class="flex space-x-2" v-if="role.name !== 'admin'">
                  <button 
                    @click="editingRole = role; editRoleName = role.name"
                    class="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deleteRole(role.id)"
                    class="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <span v-else class="text-[10px] font-bold text-slate-400 uppercase">System Role</span>
              </template>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button @click="showManageRoles = false" class="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Shield, Plus, Trash2, Pencil, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const roles = ref<{ id: number, name: string }[]>([])

const availableMenus = ref<{ id: number, menu_key: string, label: string }[]>([])
const permissions = ref<{ role: string, menu_key: string }[]>([])
const saving = ref<string | null>(null)
const showAddMenu = ref(false)
const showAddRole = ref(false)
const showManageRoles = ref(false)
const addingMenu = ref(false)
const addingRole = ref(false)
const editingRole = ref<{ id: number, name: string } | null>(null)
const newMenu = ref({ key: '', label: '' })
const newRoleName = ref('')
const editRoleName = ref('')

const fetchRoles = async () => {
  try {
    console.log('Fetching roles...');
    const res = await fetch('/api/roles', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      const data = await res.json();
      console.log('Roles fetched:', data);
      roles.value = data;
    } else {
      console.error('Failed to fetch roles:', res.status, res.statusText);
    }
  } catch (err) {
    console.error('Failed to fetch roles:', err)
  }
}

const addRole = async () => {
  if (!newRoleName.value) return
  addingRole.value = true
  try {
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ name: newRoleName.value })
    })
    if (res.ok) {
      await fetchRoles()
      newRoleName.value = ''
      showAddRole.value = false
      alert('Role added successfully')
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to add role')
    }
  } catch (err) {
    console.error('Failed to add role:', err)
    alert('An error occurred while adding the role')
  } finally {
    addingRole.value = false
  }
}

const updateRole = async () => {
  if (!editingRole.value || !editRoleName.value) return
  try {
    const res = await fetch(`/api/roles/${editingRole.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ name: editRoleName.value })
    })
    if (res.ok) {
      await fetchRoles()
      await fetchPermissions() // Refresh permissions as role name might have changed
      editingRole.value = null
      editRoleName.value = ''
      alert('Role updated successfully')
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to update role')
    }
  } catch (err) {
    console.error('Failed to update role:', err)
    alert('An error occurred while updating the role')
  }
}

const deleteRole = async (id: number) => {
  if (!confirm('Are you sure you want to delete this role?')) return
  try {
    const res = await fetch(`/api/roles/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      await fetchRoles()
      await fetchPermissions()
      alert('Role deleted successfully')
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to delete role')
    }
  } catch (err) {
    console.error('Failed to delete role:', err)
    alert('An error occurred while deleting the role')
  }
}

const fetchAvailableMenus = async () => {
  try {
    const res = await fetch('/api/available-menus', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      availableMenus.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch available menus:', err)
  }
}

const fetchPermissions = async () => {
  try {
    const res = await fetch('/api/menu-permissions', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      permissions.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch permissions:', err)
  }
}

const addMenu = async () => {
  if (!newMenu.value.key || !newMenu.value.label) return
  addingMenu.value = true
  try {
    const res = await fetch('/api/available-menus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        menu_key: newMenu.value.key,
        label: newMenu.value.label
      })
    })
    if (res.ok) {
      await fetchAvailableMenus()
      newMenu.value = { key: '', label: '' }
      showAddMenu.value = false
    }
  } catch (err) {
    console.error('Failed to add menu:', err)
  } finally {
    addingMenu.value = false
  }
}

const deleteMenu = async (id: number) => {
  if (!confirm('Are you sure you want to delete this menu? This will not remove the actual page, only the permission entry.')) return
  try {
    const res = await fetch(`/api/available-menus/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      await fetchAvailableMenus()
      await fetchPermissions()
    }
  } catch (err) {
    console.error('Failed to delete menu:', err)
  }
}

onMounted(() => {
  fetchRoles()
  fetchAvailableMenus()
  fetchPermissions()
})

const hasPermission = (role: string, menuKey: string) => {
  return permissions.value.some(p => p.role === role && p.menu_key === menuKey)
}

const togglePermission = (role: string, menuKey: string) => {
  const index = permissions.value.findIndex(p => p.role === role && p.menu_key === menuKey)
  if (index > -1) {
    permissions.value.splice(index, 1)
  } else {
    permissions.value.push({ role, menu_key: menuKey })
  }
}

const savePermissions = async (role: string) => {
  saving.value = role
  try {
    const menuKeys = permissions.value
      .filter(p => p.role === role)
      .map(p => p.menu_key)

    const res = await fetch('/api/menu-permissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ role, menuKeys })
    })

    if (res.ok) {
      // Refresh current user permissions if they match the updated role
      if (authStore.user?.role === role) {
        await authStore.fetchMe()
      }
    }
  } catch (err) {
    console.error('Failed to save permissions:', err)
  } finally {
    saving.value = null
  }
}
</script>
