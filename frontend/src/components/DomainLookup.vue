<template>
  <div class="card">
    <h2>域名查询IP</h2>
    
    <div class="form-group">
      <input 
        v-model="domain" 
        type="text" 
        placeholder="输入域名，如: google.com"
      />
      <select v-model="recordType">
        <option value="A">A记录 (IPv4)</option>
        <option value="AAAA">AAAA记录 (IPv6)</option>
        <option value="MX">MX记录 (邮件)</option>
        <option value="NS">NS记录 (域名服务器)</option>
      </select>
      <button class="btn btn-primary" @click="lookupDomain" :disabled="loading">
        <span v-if="loading" class="loading"></span>
        {{ loading ? '查询中...' : '查询' }}
      </button>
    </div>

    <div v-if="result" class="result" :class="{ error: !result.success }">
      <pre>{{ formattedResult }}</pre>
    </div>

    <div v-if="reverseResult" class="result">
      <h3>反向解析结果</h3>
      <pre>{{ JSON.stringify(reverseResult, null, 2) }}</pre>
    </div>

    <div v-if="history?.length > 0" class="result">
      <h3>查询历史</h3>
      <table>
        <thead>
          <tr><th>域名</th><th>IP</th><th>类型</th><th>时间</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in history" :key="item.id">
            <td>{{ item.domain }}</td>
            <td>{{ item.ip_address }}</td>
            <td>{{ item.record_type }}</td>
            <td>{{ item.created_at }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const domain = ref('')
const recordType = ref('A')
const result = ref(null)
const reverseResult = ref(null)
const history = ref([])
const loading = ref(false)

const formattedResult = computed(() => {
  if (result.value) {
    return JSON.stringify(result.value, null, 2)
  }
  return ''
})

const cleanDomain = (domainStr) => {
  let clean = domainStr.trim()
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '')
  clean = clean.replace(/\/.*$/, '')
  return clean
}

const lookupDomain = async () => {
  if (!domain.value) {
    alert('请输入域名')
    return
  }
  
  const cleanedDomain = cleanDomain(domain.value)
  if (!cleanedDomain) {
    alert('请输入有效的域名')
    return
  }
  
  loading.value = true
  result.value = null
  
  try {
    const response = await axios.get('/api/domain/lookup', {
      params: { domain: cleanedDomain, type: recordType.value }
    })
    result.value = response.data
    
    if (response.data.success && response.data.ip_addresses?.[0]) {
      const reverse = await axios.get('/api/domain/reverse', {
        params: { ip: response.data.ip_addresses[0] }
      })
      reverseResult.value = reverse.data
    }
    
    await loadHistory()
  } catch (error) {
    result.value = { success: false, error: error.message }
  } finally {
    loading.value = false
  }
}

const loadHistory = async () => {
  const response = await axios.get('/api/domain/history')
  history.value = response.data.data
}

onMounted(loadHistory)
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 13px; }
</style>