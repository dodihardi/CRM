<template>
  <div class="relative" ref="container">
    <div class="relative">
      <Search v-if="!selectedItem" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref="inputRef"
        type="text"
        v-model="searchQuery"
        @focus="isOpen = true"
        @input="isOpen = true"
        :placeholder="selectedItem ? '' : placeholder"
        class="w-full pl-10 pr-10 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
        :class="{ 'pl-4': selectedItem }"
      />
      <div v-if="selectedItem" class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <span class="text-sm font-medium text-slate-900">{{ selectedItem[displayKey] }}</span>
      </div>
      <button
        v-if="selectedItem"
        type="button"
        @click="clearSelection"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        <X class="w-4 h-4" />
      </button>
      <button
        v-else
        type="button"
        @click="isOpen = !isOpen"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        <ChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isOpen }" />
      </button>
    </div>

    <!-- Dropdown Table -->
    <div
      v-if="isOpen"
      class="absolute z-[60] mt-1 w-full min-w-[400px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
      :class="dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'"
    >
      <div class="max-h-64 overflow-y-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr
              v-for="item in filteredOptions"
              :key="item[valueKey || 'id']"
              @click="selectItem(item)"
              class="hover:bg-emerald-50 cursor-pointer transition-colors"
              :class="{ 'bg-emerald-50/50': modelValue === item[valueKey || 'id'] }"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-2 text-sm text-slate-600"
              >
                {{ item[col.key] }}
              </td>
            </tr>
            <tr v-if="filteredOptions.length === 0">
              <td :colspan="columns.length" class="px-4 py-8 text-center text-slate-500 text-sm">
                No items found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Search, ChevronDown, X } from 'lucide-vue-next'

interface Column {
  label: string
  key: string
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: any[]
  columns: Column[]
  placeholder?: string
  displayKey?: string
  valueKey?: string
  searchKeys?: string[]
}>(), {
  placeholder: 'Search...',
  displayKey: 'name',
  valueKey: 'id',
  searchKeys: () => ['name']
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const searchQuery = ref('')
const container = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownPosition = ref<'bottom' | 'top'>('bottom')

const selectedItem = computed(() => {
  const vKey = props.valueKey || 'id'
  return props.options.find(opt => opt[vKey] === props.modelValue) || null
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(item => {
    return props.searchKeys.some(key => {
      const val = item[key]
      return val && String(val).toLowerCase().includes(query)
    })
  })
})

const selectItem = (item: any) => {
  const vKey = props.valueKey || 'id'
  emit('update:modelValue', item[vKey])
  emit('change', item)
  isOpen.value = false
  searchQuery.value = ''
}

const clearSelection = () => {
  emit('update:modelValue', null)
  emit('change', null)
  searchQuery.value = ''
}

const handleClickOutside = (event: MouseEvent) => {
  if (container.value && !container.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

const updatePosition = () => {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  if (spaceBelow < 300 && rect.top > 300) {
    dropdownPosition.value = 'top'
  } else {
    dropdownPosition.value = 'bottom'
  }
}

watch(isOpen, (val) => {
  if (val) {
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
  } else {
    window.removeEventListener('scroll', updatePosition, true)
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updatePosition, true)
})
</script>
