<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-slate-900">Departments</h2>
        <p class="text-slate-500 text-sm">Manage company structure and organization chart</p>
      </div>
      <div class="flex space-x-3">
        <button 
          v-if="viewMode === 'chart'"
          @click="exportToPng"
          class="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download class="w-4 h-4 mr-2" />
          Export PNG
        </button>
        <button 
          @click="toggleViewMode"
          class="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <component :is="viewMode === 'list' ? Network : List" class="w-4 h-4 mr-2" />
          {{ viewMode === 'list' ? 'Org Chart' : 'List View' }}
        </button>
        <button 
          @click="openCreateModal"
          class="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
        >
          <Plus class="w-4 h-4 mr-2" />
          Add Department
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="viewMode === 'list'" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Department</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Manager</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="dept in appStore.departments" :key="dept.id" class="hover:bg-slate-50 transition-colors group">
            <td class="px-6 py-4">
              <div class="font-bold text-slate-900">{{ dept.name }}</div>
              <div class="text-xs text-slate-500">{{ dept.description }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">
              {{ getParentName(dept.parentId) }}
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">
              {{ getManagerName(dept.managerId) }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="openEditModal(dept)" class="p-1 text-slate-400 hover:text-blue-600">
                  <Edit2 class="w-4 h-4" />
                </button>
                <button @click="confirmDelete(dept)" class="p-1 text-slate-400 hover:text-red-600">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="appStore.departments.length === 0">
            <td colspan="4" class="px-6 py-12 text-center text-slate-500">
              No departments found. Create one to get started.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="bg-white rounded-xl border border-slate-200 p-6 min-h-[600px] relative overflow-hidden">
      <div ref="chartContainer" class="w-full h-[600px]"></div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit Department' : 'Create Department' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase">Department Name</label>
            <input 
              v-model="form.name"
              type="text"
              required
              class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Engineering, Marketing..."
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase">Parent Department</label>
            <Combogrid
              v-model="form.parentId"
              :options="availableParentDepartments"
              :columns="[
                { label: 'Name', key: 'name' }
              ]"
              placeholder="Select Parent Department..."
              displayKey="name"
              :searchKeys="['name']"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase">Manager</label>
            <Combogrid
              v-model="form.managerId"
              :options="appStore.employees"
              :columns="[
                { label: 'Name', key: 'name' },
                { label: 'Position', key: 'position' }
              ]"
              placeholder="Select Manager..."
              displayKey="name"
              :searchKeys="['name', 'position']"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase">Description</label>
            <textarea 
              v-model="form.description"
              rows="3"
              class="w-full px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Brief description of the department..."
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              @click="showModal = false"
              class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="isSubmitting"
              class="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-bold disabled:opacity-50"
            >
              {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="p-6 text-center space-y-4">
          <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Trash2 class="w-8 h-8" />
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-bold text-slate-900">Delete Department?</h3>
            <p class="text-slate-500">This action cannot be undone. Make sure no employees or sub-departments are assigned to it.</p>
          </div>
          <div v-if="deleteError" class="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {{ deleteError }}
          </div>
          <div class="flex space-x-3 pt-4">
            <button 
              @click="showDeleteModal = false"
              class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button 
              @click="handleDelete"
              :disabled="isDeleting"
              class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-bold disabled:opacity-50"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAppStore, type Department } from '@/stores/app'
import { Plus, List, Network, Edit2, Trash2, X, User, Download } from 'lucide-vue-next'
import Combogrid from '@/components/Combogrid.vue'
import * as d3 from 'd3'

const appStore = useAppStore()
const viewMode = ref<'list' | 'chart'>('list')
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')
const selectedDept = ref<Department | null>(null)
const chartContainer = ref<HTMLElement | null>(null)

const form = ref({
  name: '',
  parentId: '',
  managerId: '',
  description: ''
})

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'chart' : 'list'
  if (viewMode.value === 'chart') {
    nextTick(() => renderChart())
  }
}

const getParentName = (id?: string) => {
  if (!id) return '-'
  return appStore.departments.find(d => d.id === id)?.name || '-'
}

const getManagerName = (id?: string) => {
  if (!id) return '-'
  return appStore.employees.find(e => e.id === id)?.name || '-'
}

const availableParentDepartments = computed(() => {
  if (!isEditing.value || !selectedDept.value) return appStore.departments
  // Prevent circular reference: cannot select self or children as parent
  const childrenIds = new Set<string>()
  const findChildren = (parentId: string) => {
    appStore.departments.filter(d => d.parentId === parentId).forEach(d => {
      childrenIds.add(d.id)
      findChildren(d.id)
    })
  }
  findChildren(selectedDept.value.id)
  return appStore.departments.filter(d => d.id !== selectedDept.value?.id && !childrenIds.has(d.id))
})

const openCreateModal = () => {
  isEditing.value = false
  form.value = { name: '', parentId: '', managerId: '', description: '' }
  showModal.value = true
}

const openEditModal = (dept: Department) => {
  isEditing.value = true
  selectedDept.value = dept
  form.value = {
    name: dept.name,
    parentId: dept.parentId || '',
    managerId: dept.managerId || '',
    description: dept.description || ''
  }
  showModal.value = true
}

const confirmDelete = (dept: Department) => {
  selectedDept.value = dept
  deleteError.value = ''
  showDeleteModal.value = true
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value && selectedDept.value) {
      await appStore.updateDepartment(selectedDept.value.id, form.value)
    } else {
      await appStore.createDepartment(form.value)
    }
    showModal.value = false
  } catch (err) {
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!selectedDept.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await appStore.deleteDepartment(selectedDept.value.id)
    showDeleteModal.value = false
  } catch (err: any) {
    deleteError.value = err.message
  } finally {
    isDeleting.value = false
  }
}

const exportToPng = () => {
  if (!chartContainer.value) return
  const svgElement = chartContainer.value.querySelector('svg')
  if (!svgElement) return

  const serializer = new XMLSerializer()
  const svgClone = svgElement.cloneNode(true) as SVGElement
  
  // Add background and styles for export
  const styleElement = document.createElement('style')
  styleElement.textContent = `
    .node rect { filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.05)); }
    .link { fill: none; stroke: #cbd5e1; stroke-width: 1.5; }
    text { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  `
  svgClone.prepend(styleElement)

  const svgString = serializer.serializeToString(svgClone)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const bbox = svgElement.getBBox()
    
    // Add some padding
    const padding = 40
    canvas.width = svgElement.clientWidth
    canvas.height = svgElement.clientHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      
      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `organization-chart-${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
    URL.revokeObjectURL(url)
  }
  img.src = url
}

// Org Chart Rendering
const renderChart = () => {
  if (!chartContainer.value || appStore.departments.length === 0) return

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  const width = chartContainer.value.clientWidth
  const height = 600
  const margin = { top: 40, right: 90, bottom: 50, left: 90 }

  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
  
  const g = svg.append('g')

  // Create hierarchy
  const data = appStore.departments.map(d => ({
    ...d,
    parentId: d.parentId || null
  }))

  // Add a virtual root if there are multiple top-level departments
  const roots = data.filter(d => !d.parentId)
  let rootData: any
  if (roots.length > 1) {
    rootData = d3.stratify<any>()
      .id(d => d.id)
      .parentId(d => d.parentId)([
        { id: 'ROOT', name: 'Organization', parentId: null },
        ...data.map(d => ({ ...d, parentId: d.parentId || 'ROOT' }))
      ])
  } else if (roots.length === 1) {
    rootData = d3.stratify<any>()
      .id(d => d.id)
      .parentId(d => d.parentId)(data)
  } else {
    return
  }

  const treeLayout = d3.tree().nodeSize([200, 120])
  const root = treeLayout(rootData)

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom as any)

  // Initial centering
  const initialScale = 0.8
  const initialTransform = d3.zoomIdentity
    .translate(width / 2, margin.top + 50)
    .scale(initialScale)
  
  svg.call(zoom.transform as any, initialTransform)

  // Links
  g.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#cbd5e1')
    .attr('stroke-width', 1.5)
    .attr('d', (d: any) => {
      return `M${d.source.x},${d.source.y}
              V${(d.source.y + d.target.y) / 2}
              H${d.target.x}
              V${d.target.y}`;
    })

  // Nodes
  const node = g.selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d: any) => `translate(${d.x},${d.y})`)

  node.append('rect')
    .attr('width', 160)
    .attr('height', 60)
    .attr('x', -80)
    .attr('y', -30)
    .attr('rx', 8)
    .attr('fill', '#fff')
    .attr('stroke', (d: any) => d.data.id === 'ROOT' ? '#10b981' : '#e2e8f0')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('click', (event, d: any) => {
      if (d.data.id !== 'ROOT') openEditModal(d.data)
    })

  node.append('text')
    .attr('dy', -5)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', '#1e293b')
    .text((d: any) => d.data.name)

  node.append('text')
    .attr('dy', 15)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', '#64748b')
    .text((d: any) => {
      if (d.data.id === 'ROOT') return ''
      const managerName = getManagerName(d.data.managerId)
      return managerName !== '-' ? `Head: ${managerName}` : 'No Head Assigned'
    })
}

watch(() => appStore.departments, () => {
  if (viewMode.value === 'chart') renderChart()
}, { deep: true })

onMounted(async () => {
  if (appStore.departments.length === 0) {
    await appStore.fetchData()
  }
})
</script>

<style scoped>
.node rect {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.05));
}
.node:hover rect {
  stroke: #10b981;
}
</style>
