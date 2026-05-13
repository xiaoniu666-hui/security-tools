<template>
  <div class="card">
    <h2>XSS跨站测试</h2>
    <div class="form-group">
      <label for="xssUrl">目标URL</label>
      <input 
        id="xssUrl" 
        v-model="xssUrl" 
        type="text" 
        placeholder="请输入目标测试URL"
      />
    </div>
    <div class="form-group">
      <label for="xssPayload">XSS载荷</label>
      <textarea 
        id="xssPayload" 
        v-model="xssPayload" 
        placeholder="请输入XSS测试载荷，如: <script>alert('XSS')</script>"
      ></textarea>
    </div>
    <button class="btn btn-primary" @click="testXSS" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '测试中...' : '开始测试' }}
    </button>

    <div v-if="result" class="result" :class="{ error: isVulnerable }">
      <pre>{{ formattedResult }}</pre>
    </div>

    <div v-if="isVulnerable" class="status error">
      ⚠️ 检测到XSS漏洞！
    </div>
    <div v-if="result && !isVulnerable" class="status success">
      ✅ 未检测到XSS漏洞
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const xssUrl = ref('')
const xssPayload = ref('test payload')
const result = ref(null)
const loading = ref(false)
const isVulnerable = ref(false)

const formattedResult = computed(() => {
  if (result.value) {
    return JSON.stringify(result.value, null, 2)
  }
  return ''
})

const testXSS = async () => {
  if (!xssUrl.value) {
    alert('请输入目标URL')
    return
  }

  loading.value = true
  isVulnerable.value = false

  let targetUrl = xssUrl.value.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  try {
    const response = await axios.post('/api/xss/test', {
      url: targetUrl,
      payload: xssPayload.value
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