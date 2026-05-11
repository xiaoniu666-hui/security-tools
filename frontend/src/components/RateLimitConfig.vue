<template>
  <div class="card">
    <h2>⚡ 速率限制配置</h2>
    
    <div class="form-group">
      <input 
        v-model="newConfig.endpoint" 
        type="text" 
        placeholder="API端点 (如: /api/auth/login)"
      />
      <input 
        v-model.number="newConfig.max_requests" 
        type="number" 
        placeholder="最大请求数"
        min="1"
      />
      <input 
        v-model.number="newConfig.window_seconds" 
        type="number" 
        placeholder="时间窗口(秒)"
        min="1"
      />
      <label class="checkbox-label">
        <input v-model="newConfig.enabled" type="checkbox" />
        启用
      </label>
      <button class="btn btn-primary" @click="addConfig">添加配置</button>
    </div>

    <table class="result">
      <thead>
        <tr>
          <th>端点</th>
          <th>最大请求数</th>
          <th>时间窗口</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in configs" :key="item.id">
          <td>{{ item.endpoint }}</td>
          <td>{{ item.max_requests }}</td>
          <td>{{ item.window_seconds }}秒</td>
          <td :class="item.enabled ? 'status-active' : 'status-disabled'">
            {{ item.enabled ? '启用' : '禁用' }}
          </td>
          <td>
            <button 
              class="btn btn-secondary" 
              @click="toggleConfig(item)"
            >
              {{ item.enabled ? '禁用' : '启用' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const configs = ref([])
const newConfig = ref({
  endpoint: '',
  max_requests: 100,
  window_seconds: 60,
  enabled: true
})

const loadConfigs = async () => {
  const response = await axios.get('/api/defense/rate-limit/config')
  configs.value = response.data.data || []
}

const addConfig = async () => {
  if (!newConfig.value.endpoint) return
  await axios.post('/api/defense/rate-limit/config', newConfig.value)
  newConfig.value = { endpoint: '', max_requests: 100, window_seconds: 60, enabled: true }
  await loadConfigs()
}

const toggleConfig = async (config) => {
  config.enabled = !config.enabled
  await axios.post('/api/defense/rate-limit/config', config)
  await loadConfigs()
}

onMounted(loadConfigs)
</script>

<style scoped>
.status-active { color: #00ff88; }
.status-disabled { color: #ff4757; }
.checkbox-label { display: flex; align-items: center; gap: 8px; padding: 12px; }
</style>