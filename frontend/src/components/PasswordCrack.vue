<template>
  <div class="card">
    <h2>弱密码爆破</h2>
    <div class="form-group">
      <label for="targetUrl">目标URL</label>
      <input 
        id="targetUrl" 
        v-model="targetUrl" 
        type="text" 
        placeholder="请输入目标登录页面URL"
      />
    </div>
    <div class="form-group">
      <label for="username">用户名</label>
      <input 
        id="username" 
        v-model="username" 
        type="text" 
        placeholder="请输入用户名"
      />
    </div>
    <div class="form-group">
      <label for="passwordList">密码列表</label>
      <textarea 
        id="passwordList" 
        v-model="passwordList" 
        placeholder="每行一个密码，如：&#10;admin&#10;123456&#10;password"
      ></textarea>
    </div>
    <button class="btn btn-primary" @click="startCrack" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '爆破中...' : '开始爆破' }}
    </button>

    <div v-if="crackProgress" class="progress-bar">
      <div class="progress-bar-inner" :style="{ width: crackProgress + '%' }"></div>
    </div>

    <div v-if="result" class="result" :class="{ error: found }">
      <pre>{{ formattedResult }}</pre>
    </div>

    <div v-if="found" class="status success">
      🎉 密码已找到: {{ foundPassword }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const targetUrl = ref('')
const username = ref('admin')
const passwordList = ref('admin\n123456\npassword\n123123\n654321\nroot\ntoor\n111111')
const result = ref(null)
const loading = ref(false)
const crackProgress = ref(0)
const found = ref(false)
const foundPassword = ref('')

const formattedResult = computed(() => {
  if (result.value) {
    return JSON.stringify(result.value, null, 2)
  }
  return ''
})

const startCrack = async () => {
  if (!targetUrl.value || !username.value) {
    alert('请填写完整的目标信息')
    return
  }
  
  loading.value = true
  found.value = false
  crackProgress.value = 0
  
  try {
    const response = await axios.post('/api/crack/password', {
      url: targetUrl.value,
      username: username.value,
      passwords: passwordList.value.split('\n').filter(p => p.trim())
    })
    result.value = response.data
    if (response.data.found) {
      found.value = true
      foundPassword.value = response.data.password
    }
  } catch (err) {
    result.value = err.response?.data || { error: '爆破失败' }
  } finally {
    loading.value = false
    crackProgress.value = 100
  }
}
</script>