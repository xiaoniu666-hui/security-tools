<template>
  <div class="card">
    <h2>🔍 异常行为检测</h2>
    
    <div class="form-group">
      <input 
        v-model="detectionData.ip" 
        type="text" 
        placeholder="IP地址"
      />
      <input 
        v-model.number="detectionData.request_count" 
        type="number" 
        placeholder="请求次数"
        min="1"
      />
      <input 
        v-model.number="detectionData.avg_time_between" 
        type="number" 
        placeholder="平均间隔(ms)"
        min="1"
      />
      <button class="btn btn-primary" @click="detectAnomaly">检测</button>
    </div>

    <div v-if="result" class="result" :class="result.detected ? 'error' : ''">
      <h3>检测结果</h3>
      <p :class="result.detected ? 'text-danger' : 'text-success'">
        {{ result.detected ? '⚠️ 检测到异常行为' : '✅ 行为正常' }}
      </p>
      <div v-if="result.anomalies && result.anomalies.length > 0">
        <h4>检测到的异常:</h4>
        <ul>
          <li v-for="(anomaly, index) in result.anomalies" :key="index">
            <span :style="{ color: getScoreColor(anomaly.score) }">
              [{{ (anomaly.score * 100).toFixed(0) }}%] {{ anomaly.message }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'

const detectionData = reactive({
  ip: '',
  request_count: 100,
  avg_time_between: 100,
  status_codes: [200, 200, 200]
})

const result = ref(null)

const detectAnomaly = async () => {
  if (!detectionData.ip) {
    alert('请输入IP地址')
    return
  }
  
  const response = await axios.post('/api/defense/anomaly/detect', detectionData)
  result.value = response.data
}

const getScoreColor = (score) => {
  if (score >= 0.8) return '#ff4757'
  if (score >= 0.6) return '#ff6b35'
  if (score >= 0.4) return '#ffc107'
  return '#00ff88'
}
</script>

<style scoped>
.text-danger { color: #ff4757; }
.text-success { color: #00ff88; }
</style>