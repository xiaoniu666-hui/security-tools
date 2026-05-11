<template>
  <div class="card">
    <h2>🔐 安全头配置</h2>
    
    <div class="form-group">
      <select v-model="selectedServer">
        <option value="nginx">Nginx</option>
        <option value="apache">Apache</option>
        <option value="express">Express</option>
      </select>
      <button class="btn btn-primary" @click="generateConfig">生成配置</button>
    </div>

    <div v-if="generatedConfig" class="result">
      <h3>{{ selectedServer.toUpperCase() }} 配置</h3>
      <pre>{{ generatedConfig }}</pre>
      <button class="btn btn-secondary" @click="copyConfig">复制配置</button>
    </div>

    <table class="result">
      <thead>
        <tr>
          <th>安全头</th>
          <th>值</th>
          <th>说明</th>
          <th>启用</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(header, index) in headers" :key="index">
          <td>{{ header.name }}</td>
          <td>{{ header.value }}</td>
          <td>{{ header.description }}</td>
          <td>
            <input 
              type="checkbox" 
              v-model="header.enabled"
              @change="updateHeaders"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const headers = ref([])
const selectedServer = ref('nginx')
const generatedConfig = ref('')

const loadHeaders = async () => {
  const response = await axios.get('/api/defense/headers/config')
  headers.value = response.data.data || []
}

const updateHeaders = async () => {
  await axios.post('/api/defense/headers/generate', { headers: headers.value })
}

const generateConfig = async () => {
  const response = await axios.post('/api/defense/headers/generate', { headers: headers.value })
  generatedConfig.value = response.data.configurations[selectedServer.value]
}

const copyConfig = async () => {
  await navigator.clipboard.writeText(generatedConfig.value)
  alert('配置已复制到剪贴板')
}

onMounted(loadHeaders)
</script>

<style scoped>
pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 13px;
}
</style>