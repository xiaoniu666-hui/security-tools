<template>
  <div class="card">
    <h2>CSRF攻击测试</h2>
    
    <div class="form-group">
      <label for="csrfUrl">目标URL</label>
      <input 
        id="csrfUrl" 
        v-model="targetUrl" 
        type="text" 
        placeholder="输入目标URL"
      />
    </div>
    
    <div class="form-group">
      <label for="csrfMethod">请求方法</label>
      <select id="csrfMethod" v-model="requestMethod">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
      </select>
      <input 
        v-model="csrfToken" 
        type="text" 
        placeholder="CSRF Token（可选）"
      />
    </div>

    <button class="btn btn-primary" @click="testCSRF" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '测试中...' : '开始测试' }}
    </button>

    <div v-if="result" class="result" :class="{ error: !result.success }">
      <h3>测试结果</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const targetUrl = ref('')
const requestMethod = ref('GET')
const csrfToken = ref('')
const loading = ref(false)
const result = ref(null)

const testCSRF = async () => {
  if (!targetUrl.value) {
    alert('请输入目标URL')
    return
  }

  loading.value = true
  
  try {
    const response = await axios.post('/api/attack/csrf-test', {
      url: targetUrl.value,
      method: requestMethod.value,
      csrf_token: csrfToken.value
    })
    result.value = response.data
  } catch (err) {
    result.value = { success: false, error: err.response?.data?.error || '测试失败' }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.form-group input,
.form-group select {
  flex: 1;
  min-width: 200px;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.result.error {
  border-color: rgba(255, 71, 87, 0.5);
}

.result pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>