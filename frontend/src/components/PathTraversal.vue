<template>
  <div class="card">
    <h2>路径遍历测试</h2>
    
    <div class="form-group">
      <label for="pathInput">目标路径</label>
      <input 
        id="pathInput" 
        v-model="testPath" 
        type="text" 
        placeholder="输入测试路径，如: ../../etc/passwd"
      />
    </div>

    <div class="form-group">
      <label for="baseDir">基础目录</label>
      <input 
        id="baseDir" 
        v-model="baseDir" 
        type="text" 
        placeholder="限制的基础目录"
        value="/var/www/html"
      />
    </div>

    <button class="btn btn-primary" @click="testPathTraversal" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '检测中...' : '检测路径' }}
    </button>

    <div v-if="result" class="result">
      <h3>检测结果</h3>
      <div v-if="result.is_vulnerable" class="vulnerable">
        <p>⚠️ 检测到路径遍历漏洞！</p>
        <p>原始路径: {{ result.original_path }}</p>
        <p>解析后路径: {{ result.resolved_path }}</p>
        <p>是否逃出基础目录: {{ result.escape_basedir ? '是' : '否' }}</p>
      </div>
      <div v-else>
        <p class="safe">✓ 路径安全，未检测到遍历风险</p>
      </div>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const testPath = ref('../../etc/passwd')
const baseDir = ref('/var/www/html')
const loading = ref(false)
const result = ref(null)

const testPathTraversal = async () => {
  if (!testPath.value) {
    alert('请输入测试路径')
    return
  }

  loading.value = true
  
  try {
    const response = await axios.post('/api/attack/path-traversal', {
      path: testPath.value,
      base_dir: baseDir.value
    })
    result.value = response.data
  } catch (err) {
    result.value = { success: false, error: err.response?.data?.error || '检测失败' }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
</style>