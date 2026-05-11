<template>
  <div class="card">
    <h2>SSL证书管理</h2>
    
    <div class="form-group">
      <input v-model="checkDomain" placeholder="输入域名检查证书" />
      <button class="btn btn-primary" @click="checkCertificate">检查证书</button>
    </div>

    <div v-if="certInfo" class="result">
      <h3>证书信息</h3>
      <p>域名: {{ certInfo.domain }}</p>
      <p>颁发机构: {{ certInfo.issuer }}</p>
      <p>有效期: {{ certInfo.valid_from }} - {{ certInfo.valid_to }}</p>
      <p>状态: <span :class="certInfo.valid ? 'valid' : 'invalid'">{{ certInfo.valid ? '有效' : '无效' }}</span></p>
    </div>

    <div class="result">
      <div v-for="cert in certificates" :key="cert.id" class="cert-item">
        <h3>{{ cert.domain }}</h3>
        <p>状态: <span :class="'status-' + cert.status">{{ cert.status }}</span></p>
        <p>有效期至: {{ cert.valid_to }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const certificates = ref([])
const checkDomain = ref('')
const certInfo = ref(null)

const loadCertificates = async () => {
  const response = await axios.get('/api/defense/ssl/certificates')
  certificates.value = response.data.data
}

const checkCertificate = async () => {
  if (!checkDomain.value) return
  const response = await axios.post('/api/defense/ssl/check', { domain: checkDomain.value })
  certInfo.value = response.data.data
}

onMounted(loadCertificates)
</script>

<style scoped>
.cert-item { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px; }
.status-valid { color: #00ff88; }
.status-expiring { color: #ffc107; }
.status-expired { color: #ff4757; }
.valid { color: #00ff88; }
.invalid { color: #ff4757; }
</style>