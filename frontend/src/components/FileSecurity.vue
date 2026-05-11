<template>
  <div class="card">
    <h2>📁 文件上传安全</h2>
    
    <div class="form-group">
      <input 
        v-model="fileData.filename" 
        type="text" 
        placeholder="文件名"
      />
      <input 
        v-model.number="fileData.size" 
        type="number" 
        placeholder="文件大小(字节)"
        min="0"
      />
      <input 
        v-model="fileData.type" 
        type="text" 
        placeholder="MIME类型"
      />
      <button class="btn btn-primary" @click="checkFile">检查文件</button>
    </div>

    <div v-if="result" class="result" :class="result.result.allowed ? '' : 'error'">
      <h3>检查结果</h3>
      <p :class="result.result.allowed ? 'text-success' : 'text-danger'">
        {{ result.result.allowed ? '✅ 文件检查通过' : '❌ 文件被拒绝' }}
      </p>
      <p>{{ result.result.message }}</p>
      <div v-if="result.result.recommendations && result.result.recommendations.length > 0">
        <h4>建议:</h4>
        <ul>
          <li v-for="(rec, index) in result.result.recommendations" :key="index">
            💡 {{ rec }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'

const fileData = reactive({
  filename: '',
  size: 0,
  type: ''
})

const result = ref(null)

const checkFile = async () => {
  if (!fileData.filename || !fileData.type) {
    alert('请提供文件名和类型')
    return
  }
  
  const response = await axios.post('/api/defense/file/check', fileData)
  result.value = response.data
}
</script>

<style scoped>
.text-danger { color: #ff4757; }
.text-success { color: #00ff88; }
</style>