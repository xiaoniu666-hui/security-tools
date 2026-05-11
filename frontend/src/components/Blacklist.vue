<template>
  <div class="card">
    <h2>IP黑名单管理</h2>
    
    <div class="form-group">
      <input 
        v-model="newIP" 
        type="text" 
        placeholder="输入要加入黑名单的IP"
      />
      <select v-model="severity">
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
        <option value="critical">严重</option>
      </select>
      <button class="btn btn-primary" @click="addBlacklist">加入黑名单</button>
    </div>

    <table class="result">
      <thead>
        <tr>
          <th>IP地址</th>
          <th>原因</th>
          <th>严重等级</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in blacklist" :key="item.id">
          <td>{{ item.ip }}</td>
          <td>{{ item.reason }}</td>
          <td :class="'severity-' + item.severity">{{ item.severity }}</td>
          <td><button class="btn btn-secondary" @click="removeBlacklist(item.ip)">移除</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const blacklist = ref([])
const newIP = ref('')
const severity = ref('medium')

const loadBlacklist = async () => {
  const response = await axios.get('/api/defense/blacklist')
  blacklist.value = response.data.data
}

const addBlacklist = async () => {
  if (!newIP.value) return
  await axios.post('/api/defense/blacklist/add', { ip: newIP.value, severity, reason: '手动添加' })
  newIP.value = ''
  await loadBlacklist()
}

const removeBlacklist = async (ip) => {
  await axios.post('/api/defense/blacklist/remove', { ip })
  await loadBlacklist()
}

onMounted(loadBlacklist)
</script>

<style scoped>
.severity-low { color: #00ff88; }
.severity-medium { color: #ffc107; }
.severity-high { color: #ff6b35; }
.severity-critical { color: #ff4757; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: left; }
</style>