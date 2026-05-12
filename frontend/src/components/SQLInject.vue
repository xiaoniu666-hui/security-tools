<template>
  <div class="card">
    <h2>SQL注入测试</h2>
    <div class="form-group">
      <label for="sqlUrl">目标URL</label>
      <input 
        id="sqlUrl" 
        v-model="sqlUrl" 
        type="text" 
        placeholder="请输入目标URL，如: http://example.com?id=1"
      />
    </div>
    <div class="form-group">
      <label for="parameter">参数名</label>
      <input 
        id="parameter" 
        v-model="parameter" 
        type="text" 
        placeholder="需要测试的参数名，如: id"
      />
    </div>
    <div class="form-group">
      <label for="method">请求方法</label>
      <select id="method" v-model="method">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
        <option value="OPTIONS">OPTIONS</option>
      </select>
    </div>
    <button class="btn btn-primary" @click="testSQL" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '测试中...' : '开始测试' }}
    </button>

    <div v-if="result" class="result" :class="{ error: isVulnerable }">
      <pre>{{ formattedResult }}</pre>
    </div>

    <div v-if="isVulnerable" class="status error">
      ⚠️ 检测到SQL注入漏洞！
    </div>
    <div v-if="result && !isVulnerable" class="status success">
      ✅ 未检测到SQL注入漏洞
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const sqlUrl = ref('')
const parameter = ref('id')
const method = ref('GET')
const result = ref(null)
const loading = ref(false)
const isVulnerable = ref(false)

const formattedResult = computed(() => {
  if (result.value) {
    return JSON.stringify(result.value, null, 2)
  }
  return ''
})

const testSQL = async () => {
  if (!sqlUrl.value || !parameter.value) {
    alert('请填写完整的目标信息')
    return
  }

  loading.value = true
  isVulnerable.value = false

  try {
    const response = await axios.post('/api/sql/test', {
      url: sqlUrl.value,
      parameter: parameter.value,
      method: method.value
    })
    result.value = response.data
    isVulnerable.value = response.data.vulnerable || false
  } catch (err) {
    result.value = err.response?.data || { error: '测试失败' }
  } finally {
    loading.value = false
  }
}
</script>