<template>
  <div class="card">
    <h2>🛡️ 输入验证检测</h2>
    
    <div class="form-group">
      <input 
        v-model="inputData.input" 
        type="text" 
        placeholder="输入要验证的内容"
      />
      <select v-model="inputData.field_type">
        <option value="email">邮箱</option>
        <option value="url">URL</option>
        <option value="ip">IP地址</option>
        <option value="domain">域名</option>
      </select>
      <button class="btn btn-primary" @click="validateInput">验证</button>
    </div>

    <div v-if="result" class="result" :class="result.validation.valid ? '' : 'error'">
      <h3>验证结果</h3>
      <p :class="result.validation.valid ? 'text-success' : 'text-danger'">
        {{ result.validation.valid ? '✅ 输入验证通过' : '❌ 输入验证失败' }}
      </p>
      <p><strong>清理后的值:</strong> {{ result.validation.sanitized }}</p>
      <div v-if="result.validation.warnings && result.validation.warnings.length > 0">
        <h4>警告信息:</h4>
        <ul>
          <li v-for="(warning, index) in result.validation.warnings" :key="index">
            ⚠️ {{ warning }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'

const inputData = reactive({
  input: '',
  field_type: 'email'
})

const result = ref(null)

const validateInput = async () => {
  if (!inputData.input) {
    alert('请输入要验证的内容')
    return
  }
  
  const response = await axios.post('/api/defense/validate/input', inputData)
  result.value = response.data
}
</script>

<style scoped>
.text-danger { color: #ff4757; }
.text-success { color: #00ff88; }
</style>