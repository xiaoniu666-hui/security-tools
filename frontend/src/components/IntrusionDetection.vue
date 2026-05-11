<template>
  <div class="card">
    <h2>入侵检测</h2>
    
    <div class="form-group">
      <input v-model="testPayload" placeholder="输入测试载荷检测攻击类型" />
      <button class="btn btn-primary" @click="detectIntrusion">检测</button>
    </div>

    <div v-if="detectionResult" class="result" :class="detectionResult.detected ? 'error' : ''">
      <p v-if="detectionResult.detected">检测到攻击类型: {{ detectionResult.attack_types.join(', ') }}</p>
      <p v-else>未检测到攻击模式</p>
    </div>

    <div class="grid">
      <div class="stat-card" v-for="stat in statistics" :key="stat.level">
        <h3>{{ getLevelLabel(stat.level) }}</h3>
        <p class="count">{{ stat.count }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const testPayload = ref('')
const detectionResult = ref(null)
const statistics = ref([])

const getLevelLabel = (level) => {
  const labels = { info: '信息', warning: '警告', error: '错误', critical: '严重' }
  return labels[level] || level
}

const detectIntrusion = async () => {
  if (!testPayload.value) return
  const response = await axios.post('/api/defense/detect/intrusion', {
    ip: '127.0.0.1',
    payload: testPayload.value
  })
  detectionResult.value = response.data
}

const loadStatistics = async () => {
  const response = await axios.get('/api/defense/statistics')
  statistics.value = response.data.statistics.events
}

onMounted(loadStatistics)
</script>

<style scoped>
.stat-card { 
  background: rgba(255,255,255,0.05); 
  padding: 20px; 
  border-radius: 10px; 
  text-align: center;
}
.count { font-size: 2rem; font-weight: bold; color: #00d9ff; }
</style>