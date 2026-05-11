<template>
  <div class="card">
    <h2>SSRF测试</h2>
    
    <div class="form-group">
      <label for="ssrfUrl">目标URL</label>
      <input 
        id="ssrfUrl" 
        v-model="targetUrl" 
        type="text" 
        placeholder="输入要测试的URL"
      />
    </div>

    <div class="quick-urls">
      <span class="label">快速选择:</span>
      <button v-for="url in quickUrls" :key="url.value" class="btn btn-secondary" @click="targetUrl = url.value">
        {{ url.label }}
      </button>
    </div>

    <button class="btn btn-primary" @click="testSSRF" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '测试中...' : '开始测试' }}
    </button>

    <div v-if="result" class="result">
      <h3>测试结果</h3>
      <div v-if="result.is_vulnerable" class="vulnerable">
        <p>⚠️ 检测到SSRF漏洞！</p>
        <p>可访问的内部资源:</p>
        <ul>
          <li v-for="(resource, index) in result.accessible_resources" :key="index">
            {{ resource }}
          </li>
        </ul>
      </div>
      <div v-else>
        <p class="safe">✓ 未检测到SSRF漏洞</p>
      </div>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const targetUrl = ref('')
const loading = ref(false)
const result = ref(null)

const quickUrls = [
  { label: '内网IP', value: 'http://192.168.1.1' },
  { label: '本地主机', value: 'http://localhost:80' },
  { label: '元数据', value: 'http://169.254.169.254' },
  { label: '本地文件', value: 'file:///etc/passwd' }
]

const testSSRF = async () => {
  if (!targetUrl.value) {
    alert('请输入目标URL')
    return
  }

  loading.value = true
  
  try {
    const response = await axios.post('/api/attack/ssrf-test', {
      url: targetUrl.value
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
.quick-urls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
}

.label {
  color: #aaa;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.vulnerable {
  border-left: 4px solid #ff4757;
  padding-left: 10px;
}

.safe {
  color: #00ff88;
  font-weight: bold;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>