<template>
  <div class="space-y-6">
    <header class="flex justify-between items-center">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-slate-900">CCTV Monitoring Dashboard</h2>
        <p class="text-slate-500 text-sm">Real-time public IP CCTV network across Indonesia, focusing on Jakarta area</p>
      </div>
      <div class="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
        <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1"></div>
        LIVE MONITORING
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Map Container -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] relative">
        <div class="absolute top-4 left-4 z-10 space-y-2">
          <div class="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Map Legend</h3>
            <div class="space-y-2">
              <div class="flex items-center text-xs text-slate-600">
                <div class="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                Active CCTV (Online)
              </div>
              <div class="flex items-center text-xs text-slate-600">
                <div class="w-3 h-3 bg-slate-300 rounded-full mr-2"></div>
                Inactive CCTV (Offline)
              </div>
              <div class="flex items-center text-xs text-slate-600">
                <div class="w-3 h-3 border-2 border-emerald-500 rounded-full mr-2"></div>
                Selected Point
              </div>
            </div>
          </div>

          <div class="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-2">
             <button @click="resetView" class="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors" title="Reset View">
              <Maximize class="w-4 h-4" />
            </button>
            <button @click="focusJakarta" class="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors uppercase">
              Focus Jakarta
            </button>
          </div>
        </div>

        <div ref="mapContainer" class="w-full h-full cursor-grab active:cursor-grabbing"></div>
        
        <div v-if="loading" class="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] flex items-center justify-center">
          <div class="flex flex-col items-center">
            <div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p class="text-sm font-medium text-slate-600">Loading Map Data...</p>
          </div>
        </div>
      </div>

      <!-- Details Panel -->
      <div class="space-y-6">
        <!-- Selected CCTV Info -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div v-if="selectedCctv" class="space-y-4">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-bold text-slate-900">{{ selectedCctv.name }}</h3>
                <p class="text-xs text-slate-500 font-mono">{{ selectedCctv.ip }}</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                Online
              </span>
            </div>

            <!-- Video Player Placeholder -->
            <div class="aspect-video bg-slate-900 rounded-xl overflow-hidden relative group">
              <img 
                :src="`https://picsum.photos/seed/${selectedCctv.id}/640/360?blur=1`" 
                class="w-full h-full object-cover opacity-50"
                alt="CCTV Feed Placeholder"
              />
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="flex flex-col items-center">
                  <Play class="w-12 h-12 text-emerald-500 mb-2 cursor-pointer hover:scale-110 transition-transform" @click="viewStream" />
                  <p class="text-xs text-white font-medium">Click to connect stream</p>
                </div>
              </div>
              <div class="absolute bottom-2 left-2 flex items-center space-x-2">
                <div class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span class="text-[10px] text-white font-bold opacity-80 uppercase tracking-widest">Live Feed</span>
              </div>
              <div class="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                FPS: 24 | BR: 2.1Mb/s
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div class="p-3 bg-slate-50 rounded-xl">
                <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Coordinates</p>
                <p class="text-xs font-medium text-slate-700">{{ selectedCctv.lat.toFixed(4) }}, {{ selectedCctv.lng.toFixed(4) }}</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl">
                <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Resolution</p>
                <p class="text-xs font-medium text-slate-700">1080p Full HD</p>
              </div>
            </div>

            <button 
              @click="viewStream"
              class="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              <Video class="w-4 h-4 mr-2" />
              Open High Definition Stream
            </button>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-center py-12">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <MapPin class="w-8 h-8" />
            </div>
            <h3 class="text-sm font-bold text-slate-900 mb-1">No CCTV Selected</h3>
            <p class="text-xs text-slate-500 px-4">Select a point on the map to view the real-time public CCTV feed from Jakarta.</p>
          </div>
        </div>

        <!-- CCTV List Sidebar -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-4 border-b border-slate-200 bg-slate-50">
            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Public CCTV Node List</h3>
          </div>
          <div class="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
            <div 
              v-for="cctv in cctvs" 
              :key="cctv.id"
              @click="selectCctv(cctv)"
              class="p-4 hover:bg-slate-50 cursor-pointer transition-colors group"
              :class="{'bg-emerald-50 border-l-4 border-emerald-500': selectedCctv?.id === cctv.id}"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{{ cctv.name }}</p>
                  <p class="text-[10px] text-slate-400 font-mono">{{ cctv.ip }}</p>
                </div>
                <ArrowUpRight class="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Stream Modal -->
    <div v-if="showStreamModal && selectedCctv" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" @click="showStreamModal = false"></div>
      <div class="bg-black rounded-3xl overflow-hidden shadow-2xl w-full max-w-5xl relative z-10 border border-white/10">
        <div class="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
          <div class="flex items-center space-x-4">
            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <div>
              <h3 class="text-white font-bold leading-tight">{{ selectedCctv.name }}</h3>
              <p class="text-white/60 text-xs font-mono uppercase tracking-widest">Stream: HD_JKT_{{ selectedCctv.id }}_MAIN</p>
            </div>
          </div>
          <button @click="showStreamModal = false" class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>

        <div class="aspect-video relative group">
          <img 
            :src="`https://picsum.photos/seed/live-${selectedCctv.id}/1280/720`" 
            class="w-full h-full object-cover"
            alt="Live Stream"
          />
          <div class="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <div class="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-white space-y-2">
              <div class="flex items-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                <Activity class="w-3 h-3 mr-2 text-emerald-400" />
                Network Analytics
              </div>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-[8px] text-white/40 uppercase">Latency</p>
                  <p class="text-xs font-mono">14ms</p>
                </div>
                <div>
                  <p class="text-[8px] text-white/40 uppercase">Uptime</p>
                  <p class="text-xs font-mono">99.8%</p>
                </div>
                <div>
                  <p class="text-[8px] text-white/40 uppercase">Bitrate</p>
                  <p class="text-xs font-mono">4.2Mbps</p>
                </div>
              </div>
            </div>
            
            <div class="flex space-x-3 mb-1">
              <div class="px-4 py-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center">
                <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                Sync OK
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import { 
  MapPin, 
  Video, 
  X, 
  Play, 
  Activity, 
  Maximize, 
  ArrowUpRight,
  ChevronRight
} from 'lucide-vue-next'

interface CCTV {
  id: number
  name: string
  lat: number
  lng: number
  ip: string
}

const mapContainer = ref<HTMLElement | null>(null)
const loading = ref(true)
const selectedCctv = ref<CCTV | null>(null)
const showStreamModal = ref(false)

const cctvs: CCTV[] = [
  { id: 1, name: 'CCTV Thamrin Central', lat: -6.1891, lng: 106.8236, ip: '112.215.10.42:8080' },
  { id: 2, name: 'CCTV Sudirman Gate', lat: -6.2202, lng: 106.8124, ip: '202.158.42.11:9000' },
  { id: 3, name: 'CCTV Monas North', lat: -6.1751, lng: 106.8271, ip: '103.226.176.5:80' },
  { id: 4, name: 'CCTV Kuningan Intersection', lat: -6.2241, lng: 106.8294, ip: '36.81.124.66:8888' },
  { id: 5, name: 'CCTV Blok M Plaza', lat: -6.2442, lng: 106.7971, ip: '182.253.220.10:8001' },
  { id: 6, name: 'CCTV Gatot Subroto', lat: -6.2297, lng: 106.8181, ip: '27.50.21.104:80' },
  { id: 7, name: 'CCTV Kota Tua Square', lat: -6.1341, lng: 106.8131, ip: '116.197.135.2:9999' },
  // Additional Indonesian Cities
  { id: 8, name: 'CCTV Surabaya North Port', lat: -7.2104, lng: 112.7411, ip: '103.123.44.12:8000' },
  { id: 9, name: 'CCTV Bandung City Hall', lat: -6.9147, lng: 107.6098, ip: '202.43.166.5:80' },
  { id: 10, name: 'CCTV Medan Center', lat: 3.5952, lng: 98.6722, ip: '118.97.12.22:8080' },
  { id: 11, name: 'CCTV Makassar Pier', lat: -5.1476, lng: 119.4327, ip: '27.42.10.5:8888' },
  { id: 12, name: 'CCTV Denpasar Bypass', lat: -8.6500, lng: 115.2167, ip: '182.253.44.2:9000' }
]

let svg: any
let projection: any
let path: any
let g: any
let zoom: d3.ZoomBehavior<Element, unknown>

const initMap = async () => {
  if (!mapContainer.value) return

  const width = mapContainer.value.clientWidth
  const height = mapContainer.value.clientHeight

  svg = d3.select(mapContainer.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)

  g = svg.append('g')

  // Center on Indonesia
  projection = d3.geoMercator()
    .center([118, -2])
    .scale(width * 1.5)
    .translate([width / 2, height / 2])

  path = d3.geoPath().projection(projection)

  zoom = d3.zoom()
    .scaleExtent([1, 40])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
      // Resize markers inversely to zoom to keep them visible but small
      g.selectAll('.cctv-marker')
        .attr('r', 5 / event.transform.k)
        .attr('stroke-width', 1 / event.transform.k)
    })

  svg.call(zoom as any)

  try {
    const response = await fetch('https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia.geojson')
    const geoData = await response.json()

    g.selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('d', path as any)
      .attr('fill', '#f1f5f9')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 0.5)
      .attr('class', 'indonesia-path')

    renderMarkers()
    loading.value = false
    
    // Auto focus Jakarta after a short delay
    setTimeout(focusJakarta, 500)
    
  } catch (error) {
    console.error('Error loading map data:', error)
    loading.value = false
  }
}

const renderMarkers = () => {
  g.selectAll('.cctv-marker').remove()

  g.selectAll('.cctv-marker')
    .data(cctvs)
    .enter()
    .append('circle')
    .attr('class', 'cctv-marker')
    .attr('cx', (d: CCTV) => projection([d.lng, d.lat])?.[0] || 0)
    .attr('cy', (d: CCTV) => projection([d.lng, d.lat])?.[1] || 0)
    .attr('r', 5)
    .attr('fill', '#10b981')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('click', (event: any, d: CCTV) => {
      selectCctv(d)
    })
    .append('title')
    .text((d: CCTV) => d.name)
}

const selectCctv = (cctv: CCTV) => {
  selectedCctv.value = cctv
  
  // Highlight movement
  const [x, y] = projection([cctv.lng, cctv.lat])
  svg.transition().duration(750).call(
    zoom.transform as any,
    d3.zoomIdentity.translate(svg.node().clientWidth / 2, svg.node().clientHeight / 2).scale(25).translate(-x, -y)
  )

  // Visual feedback for marker
  g.selectAll('.selected-indicator').remove()
  g.append('circle')
    .attr('class', 'selected-indicator animate-ping')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', 10 / 25) // scaled
    .attr('fill', 'none')
    .attr('stroke', '#10b981')
    .attr('stroke-width', 2 / 25)
}

const focusJakarta = () => {
  const jakartaCoords: [number, number] = [106.8456, -6.2088]
  const [x, y] = projection(jakartaCoords)
  
  svg.transition().duration(1000).call(
    zoom.transform as any,
    d3.zoomIdentity.translate(svg.node().clientWidth / 2, svg.node().clientHeight / 2).scale(15).translate(-x, -y)
  )
}

const resetView = () => {
  svg.transition().duration(1000).call(
    zoom.transform as any,
    d3.zoomIdentity
  )
  selectedCctv.value = null
  g.selectAll('.selected-indicator').remove()
}

const viewStream = () => {
  if (selectedCctv.value) {
    showStreamModal.value = true
  }
}

onMounted(() => {
  initMap()
})

// Handle component resize
window.addEventListener('resize', () => {
  // Re-render map if needed or update viewbox
})
</script>

<style scoped>
.indonesia-path:hover {
  fill: #e2e8f0;
  transition: fill 0.2s;
}

.cctv-marker:hover {
  fill: #059669;
  r: 8px; /* Note: this might need adjust with zoom k */
  transition: all 0.2s;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
