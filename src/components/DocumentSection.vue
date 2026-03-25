<template>
  <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
      <h2 class="text-xl font-bold text-slate-900">Documents</h2>
      <label class="cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center">
        <Plus class="w-4 h-4 mr-2" />
        Upload Doc
        <input type="file" class="hidden" @change="handleFileUpload" accept=".pdf,.doc,.docx,image/*" :disabled="isUploading" />
      </label>
    </div>
    
    <div class="p-6">
      <div v-if="isUploading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span class="ml-3 text-slate-500 font-medium">Uploading document...</span>
      </div>
      
      <div v-else-if="documents.length === 0" class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <FileText class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-slate-500 font-medium">No documents uploaded yet</p>
        <p class="text-xs text-slate-400 mt-1">PDF, Word, and Images supported (max 5MB)</p>
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="doc in documents" :key="doc.id" class="flex items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
          <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mr-4">
            <component :is="getFileIcon(doc.type)" class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 truncate" :title="doc.name">{{ doc.name }}</p>
            <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {{ formatSize(doc.size) }} · {{ new Date(doc.createdAt).toLocaleDateString() }}
            </p>
          </div>
          <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <a :href="doc.url" target="_blank" class="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Download">
              <Download class="w-4 h-4" />
            </a>
            <button @click="handleDelete(doc.id)" class="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, FileText, FileCode, FileImage, Download, Trash2, File as FileIcon } from 'lucide-vue-next'
import { useAppStore, type Document } from '@/stores/app'

const props = defineProps<{
  entityType: 'lead' | 'customer' | 'auction' | 'project'
  entityId: string
}>()

const store = useAppStore()
const documents = ref<Document[]>([])
const isUploading = ref(false)

const fetchDocs = async () => {
  try {
    documents.value = await store.fetchDocuments(props.entityType, props.entityId)
  } catch (err) {
    console.error('Failed to fetch documents:', err)
  }
}

onMounted(fetchDocs)

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return
  
  const file = target.files[0]
  isUploading.value = true
  
  try {
    await store.uploadDocument(props.entityType, props.entityId, file)
    await fetchDocs()
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to upload document')
  } finally {
    isUploading.value = false
    target.value = '' // Reset input
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this document?')) return
  
  try {
    await store.deleteDocument(id)
    documents.value = documents.value.filter(d => d.id !== id)
  } catch (err) {
    alert('Failed to delete document')
  }
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return FileImage
  if (type === 'application/pdf') return FileText
  if (type.includes('word')) return FileCode
  return FileIcon
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>
