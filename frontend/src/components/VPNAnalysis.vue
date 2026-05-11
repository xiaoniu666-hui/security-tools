<template>
  <div class="card">
    <h2>虚拟IP破解分析</h2>
    
    <div class="form-group">
      <input v-model="targetIP" placeholder="输入目标IP地址" />
      <button class="btn btn-primary" @click="analyzeIP">分析IP</button>
    </div>

    <div v-if="analysis" class="result">
      <h3>IP分析结果</h3>
      <div class="analysis-grid">
        <div class="analysis-item">
          <span class="label">是否VPN:</span>
          <span :class="analysis.is_vpn ? 'vpn' : 'clean'">{{ analysis.is_vpn ? '是' : '否' }}</span>
        </div>
        <div class="analysis-item">
          <span class="label">是否代理:</span>
          <span :class="analysis.is_proxy ? 'vpn' : 'clean'">{{ analysis.is_proxy ? '是' : '否' }}</span>
        </div>
        <div class="analysis-item">
          <span class="label">风险等级:</span>
          <span :class="'risk-' + analysis.risk_level">{{ analysis.risk_level }}</span>
        </div>
        <div class="analysis-item">
          <span class="label">信誉评分:</span>
          <span>{{ analysis.reputation }}/100</span>
        </div>
        <div class="analysis-item">
          <span class="label">国家:</span>
          <span>{{ analysis.country }}</span>
        </div>
      </div>
    </div>

    <div class="form-group">
      <input v-model="scanIP" placeholder="输入扫描目标IP" />
      <input v-model="portRange" placeholder="端口范围(如: 1-1000)" />
      <button class="btn btn-primary" @click="scanPorts">端口扫描</button>
    </div>

    <div v-if="scanResult" class="result">
      <h3>端口扫描结果</h3>
      <p>开放端口: {{ scanResult.open_ports.join(', ') }}</p>
      <div v-if="scanResult?.services?.length > 0">
        <h4>检测到的服务:</h4>
        <ul>
          <li v-for="service in scanResult.services" :key="service.port">
            {{ service.port }} - {{ service.service }}
          </li>
        </ul>
      </div>
    </div>

    <div class="form-group">
      <input v-model="spoofTarget" placeholder="目标IP" />
      <input v-model="spoofIP" placeholder="伪造IP" />
      <button class="btn btn-primary" @click="spoofTest">IP欺骗测试</button>
    </div>

    <div v-if="spoofResult" class="result">
      <h3>IP欺骗测试结果</h3>
      <p>整体可行性: <span :class="spoofResult.overall_possible ? 'vpn' : 'clean'">
        {{ spoofResult.overall_possible ? '可行' : '不可行' }}
      </span></p>
      <h4>可用方法:</h4>
      <ul>
        <li v-for="method in spoofResult.possible_methods" :key="method.name">
          {{ method.name }} - 难度: {{ method.difficulty }}
        </li>
      </ul>
    </div>

    <button class="btn btn-secondary" @click="getProxies">获取代理列表</button>
    <div v-if="proxies.length > 0" class="result">
      <h3>代理列表</h3>
      <table>
        <thead>
          <tr><th>IP</th><th>端口</th><th>协议</th><th>国家</th><th>匿名度</th><th>状态</th></tr>
        </thead>
        <tbody>
          <tr v-for="proxy in proxies" :key="proxy.ip_address">
            <td>{{ proxy.ip_address }}</td>
            <td>{{ proxy.port }}</td>
            <td>{{ proxy.protocol }}</td>
            <td>{{ proxy.country }}</td>
            <td>{{ proxy.anonymity }}</td>
            <td :class="proxy.status === 'active' ? 'status-active' : 'status-inactive'">{{ proxy.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const targetIP = ref('')
const scanIP = ref('')
const portRange = ref('1-1000')
const spoofTarget = ref('')
const spoofIP = ref('')

const analysis = ref(null)
const scanResult = ref(null)
const spoofResult = ref(null)
const proxies = ref([])

const analyzeIP = async () => {
  if (!targetIP.value) return
  const response = await axios.get('/api/vpn/analyze', { params: { ip: targetIP.value } })
  analysis.value = response.data.analysis
}

const scanPorts = async () => {
  if (!scanIP.value) return
  const [start, end] = portRange.value.split('-')
  const response = await axios.get('/api/vpn/scan-ports', {
    params: { ip: scanIP.value, start, end }
  })
  scanResult.value = response.data
}

const spoofTest = async () => {
  if (!spoofTarget.value || !spoofIP.value) return
  const response = await axios.post('/api/vpn/spoof-test', {
    target_ip: spoofTarget.value,
    spoofed_ip: spoofIP.value
  })
  spoofResult.value = response.data
}

const getProxies = async () => {
  const response = await axios.get('/api/vpn/proxies')
  proxies.value = response.data.data
}
</script>

<style scoped>
.analysis-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.analysis-item { padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; }
.label { color: #aaa; margin-right: 10px; }
.vpn { color: #ff4757; font-weight: bold; }
.clean { color: #00ff88; }
.risk-high { color: #ff4757; }
.risk-medium { color: #ffc107; }
.risk-low { color: #00ff88; }
.status-active { color: #00ff88; }
.status-inactive { color: #ff4757; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 13px; }
ul { list-style: none; padding-left: 0; }
li { padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
</style>