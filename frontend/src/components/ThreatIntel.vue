<template>
  <div class="card">
    <h2>👁️ 威胁情报查询</h2>
    
    <div class="form-group">
      <input 
        v-model="queryIP" 
        type="text" 
        placeholder="输入要查询的IP地址"
      />
      <button class="btn btn-primary" @click="queryThreat">查询</button>
    </div>

    <div v-if="result" class="result" :class="result.threats_found ? 'error' : ''">
      <h3>查询结果</h3>
      <p :class="result.threats_found ? 'text-danger' : 'text-success'">
        {{ result.threats_found ? '⚠️ 检测到威胁' : '✅ IP安全' }}
      </p>
      <p>查询IP: {{ result.ip }}</p>
      <div v-if="result.threats && result.threats.length > 0">
        <h4>威胁详情:</h4>
        <ul>
          <li v-for="(threat, index) in result.threats" :key="index">
            <span :style="{ color: getProbabilityColor(threat.probability) }">
              [{{ (threat.probability * 100).toFixed(0) }}%] {{ threat.name }}
            </span>
            <br />来源: {{ threat.source }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const queryIP = ref('')
const result = ref(null)

const queryThreat = async () => {
  if (!queryIP.value) {
    alert('请输入IP地址')
    return
  }
  
  const response = await axios.post('/api/defense/threat/intel', { ip: queryIP.value })
  result.value = response.data
}

const getProbabilityColor = (prob) => {
  if (prob >= 0.7) return '#ff4757'
  if (prob >= 0.5) return '#ff6b35'
  if (prob >= 0.3) return '#ffc107'
  return '#00ff88'
}
</script>

<style scoped>
.text-danger { color: #ff4757; }
.text-success { color: #00ff88; }
</style>