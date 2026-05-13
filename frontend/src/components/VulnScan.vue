<template>
  <div class="card">
    <h2>漏洞扫描器</h2>

    <div class="form-group">
      <label for="vulnUrl">目标URL</label>
      <input
        id="vulnUrl"
        v-model="targetUrl"
        type="text"
        placeholder="请输入目标URL，如: https://example.com"
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
        <option value="HEAD">HEAD</option>
        <option value="TRACE">TRACE</option>
      </select>
    </div>

    <div class="scan-options">
      <label class="checkbox-label">
        <input type="checkbox" v-model="scanOptions.headers" />
        <span>HTTP头检测</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="scanOptions.ports" />
        <span>端口扫描</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="scanOptions.ssl" />
        <span>SSL检测</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="scanOptions.subdomain" />
        <span>子域名检测</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="scanOptions.cve" />
        <span>CVE检测</span>
      </label>
    </div>

    <button class="btn btn-primary" @click="startScan" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '扫描中...' : '开始扫描' }}
    </button>

    <div v-if="loading" class="progress-info">
      <p>正在扫描目标服务器，请稍候...</p>
    </div>

    <div v-if="results" class="results-container">
      <div class="summary-section">
        <h3>扫描摘要</h3>
        <div class="summary-grid">
          <div class="summary-item critical">
            <span class="count">{{ results.summary.critical }}</span>
            <span class="label">严重</span>
          </div>
          <div class="summary-item high">
            <span class="count">{{ results.summary.high }}</span>
            <span class="label">高危</span>
          </div>
          <div class="summary-item medium">
            <span class="count">{{ results.summary.medium }}</span>
            <span class="label">中危</span>
          </div>
          <div class="summary-item low">
            <span class="count">{{ results.summary.low }}</span>
            <span class="label">低危</span>
          </div>
          <div class="summary-item info">
            <span class="count">{{ results.summary.info }}</span>
            <span class="label">信息</span>
          </div>
        </div>
      </div>

      <div v-if="results?.portScan?.length > 0" class="port-section">
        <h3>开放端口</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>端口</th>
              <th>服务</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="port in results.portScan" :key="port.port">
              <td>{{ port.port }}</td>
              <td>{{ port.service }}</td>
              <td><span class="status-open">开放</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="results?.vulnerabilities?.length > 0" class="vuln-section">
        <h3>发现的问题</h3>
        <div v-for="(vuln, index) in results.vulnerabilities" :key="index" class="vuln-item" :class="vuln.severity">
          <div class="vuln-header">
            <span class="vuln-type">{{ vuln.type }}</span>
            <span class="vuln-severity" :class="vuln.severity">{{ getSeverityText(vuln.severity) }}</span>
          </div>
          <p class="vuln-desc">{{ vuln.description }}</p>
          <p v-if="vuln.recommendation" class="vuln-recommend">
            <strong>建议:</strong> {{ vuln.recommendation }}
          </p>
        </div>
      </div>

      <div v-if="results.recommendations" class="recommendations-section">
        <h3>安全建议</h3>
        <ul class="recommend-list">
          <li v-for="(rec, index) in results.recommendations" :key="index">{{ rec }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const targetUrl = ref('')
const method = ref('GET')
const loading = ref(false)
const results = ref(null)

const scanOptions = ref({
  headers: true,
  ports: true,
  ssl: true,
  subdomain: false,
  cve: false
})

const getSeverityText = (severity) => {
  const map = {
    critical: '严重',
    high: '高危',
    medium: '中危',
    low: '低危',
    info: '信息'
  }
  return map[severity] || severity
}

const startScan = async () => {
  if (!targetUrl.value) {
    alert('请输入目标URL')
    return
  }

  if (!targetUrl.value.startsWith('http://') && !targetUrl.value.startsWith('https://')) {
    targetUrl.value = 'https://' + targetUrl.value
  }

  const selectedScans = []
  if (scanOptions.value.headers) selectedScans.push('headers')
  if (scanOptions.value.ports) selectedScans.push('ports')
  if (scanOptions.value.ssl) selectedScans.push('ssl')
  if (scanOptions.value.subdomain) selectedScans.push('subdomain')
  if (scanOptions.value.cve) selectedScans.push('cve')

  if (selectedScans.length === 0) {
    alert('请至少选择一种扫描类型')
    return
  }

  loading.value = true
  results.value = null

  try {
    const response = await axios.post('/api/vuln/scan', {
      url: targetUrl.value,
      method: method.value,
      scanTypes: selectedScans
    })
    results.value = response.data
  } catch (err) {
    alert(err.response?.data?.error || '扫描失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.scan-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: background 0.3s;
}

.checkbox-label:hover {
  background: rgba(255, 255, 255, 0.1);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.progress-info {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 217, 255, 0.1);
  border-radius: 10px;
  text-align: center;
  color: #00d9ff;
}

.results-container {
  margin-top: 25px;
}

.summary-section {
  margin-bottom: 25px;
}

.summary-section h3 {
  color: #00d9ff;
  margin-bottom: 15px;
  font-size: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.summary-item .count {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.summary-item .label {
  font-size: 14px;
  opacity: 0.8;
}

.summary-item.critical {
  background: rgba(255, 71, 87, 0.2);
  border: 1px solid rgba(255, 71, 87, 0.5);
}
.summary-item.critical .count { color: #ff4757; }

.summary-item.high {
  background: rgba(255, 165, 2, 0.2);
  border: 1px solid rgba(255, 165, 2, 0.5);
}
.summary-item.high .count { color: #ffa502; }

.summary-item.medium {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.5);
}
.summary-item.medium .count { color: #ffd700; }

.summary-item.low {
  background: rgba(0, 217, 255, 0.2);
  border: 1px solid rgba(0, 217, 255, 0.5);
}
.summary-item.low .count { color: #00d9ff; }

.summary-item.info {
  background: rgba(128, 128, 128, 0.2);
  border: 1px solid rgba(128, 128, 128, 0.5);
}
.summary-item.info .count { color: #888; }

.port-section {
  margin-bottom: 25px;
}

.port-section h3 {
  color: #00d9ff;
  margin-bottom: 15px;
  font-size: 18px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.data-table th {
  background: rgba(0, 217, 255, 0.1);
  color: #00d9ff;
  font-weight: 600;
}

.status-open {
  color: #00ff88;
  font-weight: bold;
}

.vuln-section {
  margin-bottom: 25px;
}

.vuln-section h3 {
  color: #00d9ff;
  margin-bottom: 15px;
  font-size: 18px;
}

.vuln-item {
  padding: 15px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-left: 4px solid;
}

.vuln-item.critical { border-color: #ff4757; }
.vuln-item.high { border-color: #ffa502; }
.vuln-item.medium { border-color: #ffd700; }
.vuln-item.low { border-color: #00d9ff; }
.vuln-item.info { border-color: #888; }

.vuln-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.vuln-type {
  font-weight: bold;
  color: #fff;
}

.vuln-severity {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.vuln-severity.critical { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
.vuln-severity.high { background: rgba(255, 165, 2, 0.2); color: #ffa502; }
.vuln-severity.medium { background: rgba(255, 215, 0, 0.2); color: #ffd700; }
.vuln-severity.low { background: rgba(0, 217, 255, 0.2); color: #00d9ff; }
.vuln-severity.info { background: rgba(128, 128, 128, 0.2); color: #888; }

.vuln-desc {
  color: #aaa;
  margin-bottom: 8px;
  line-height: 1.5;
}

.vuln-recommend {
  color: #00ff88;
  font-size: 13px;
  line-height: 1.5;
}

.recommendations-section {
  margin-bottom: 25px;
}

.recommendations-section h3 {
  color: #00d9ff;
  margin-bottom: 15px;
  font-size: 18px;
}

.recommend-list {
  list-style: none;
  padding: 0;
}

.recommend-list li {
  padding: 10px 15px;
  margin-bottom: 8px;
  background: rgba(0, 255, 136, 0.1);
  border-radius: 8px;
  color: #00ff88;
  border-left: 3px solid #00ff88;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .summary-item .count {
    font-size: 24px;
  }
}
</style>
