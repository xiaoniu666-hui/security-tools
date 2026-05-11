<template>
  <div class="card">
    <h2>IP查询</h2>
    <div class="form-group">
      <label for="ipInput">IP地址</label>
      <input 
        id="ipInput" 
        v-model="ipAddress" 
        type="text" 
        placeholder="请输入IP地址，如: 192.168.1.1"
      />
    </div>
    <button class="btn btn-primary" @click="queryIP" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '查询中...' : '查询' }}
    </button>

    <div v-if="result" class="result" :class="{ error: error }">
      <pre>{{ formattedResult }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const ipAddress = ref('')
const result = ref(null)
const error = ref(false)
const loading = ref(false)

const formattedResult = computed(() => {
  if (result.value) {
    return JSON.stringify(result.value, null, 2)
  }
  return ''
})

const queryIP = async () => {
  if (!ipAddress.value) {
    alert('请输入IP地址')
    return
  }

  loading.value = true
  error.value = false

  try {
    const response = await axios.get('/api/ip/query', {
      params: { ip: ipAddress.value }
    })
    result.value = response.data
  } catch (err) {
    error.value = true
    result.value = err.response?.data || { error: '查询失败' }
  } finally {
    loading.value = false
  }
}
</script>