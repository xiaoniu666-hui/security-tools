<template>
  <div class="card">
    <h2>命令注入测试</h2>
    
    <div class="form-group">
      <label for="cmdInput">测试输入</label>
      <input 
        id="cmdInput" 
        v-model="testInput" 
        type="text" 
        placeholder="输入可能包含命令注入的内容"
      />
    </div>

    <div class="scan-options">
      <label class="checkbox-label">
        <input type="checkbox" v-model="options.unix" />
        <span>Unix/Linux命令</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="options.windows" />
        <span>Windows命令</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="options.sql" />
        <span>SQL注入检测</span>
      </label>
    </div>

    <button class="btn btn-primary" @click="testInjection" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '检测中...' : '检测注入' }}
    </button>

    <div v-if="result" class="result">
      <h3>检测结果</h3>
      <div v-if="result.detections && result.detections.length > 0">
        <p class="warning">检测到以下注入风险：</p>
        <ul>
          <li v-for="(detect, index) in result.detections" :key="index">
            <strong>{{ detect.type }}:</strong> {{ detect.payload }} - {{ detect.severity }}
          </li>
        </ul>
      </div>
      <div v-else>
        <p class="success">未检测到注入风险</p>
      </div>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'

const testInput = ref('')
const loading = ref(false)
const result = ref(null)

const options = reactive({
  unix: true,
  windows: true,
  sql: true
})

const testInjection = async () => {
  if (!testInput.value) {
    alert('请输入测试内容')
    return
  }

  loading.value = true
  
  try {
    const response = await axios.post('/api/attack/command-injection', {
      input: testInput.value,
      options
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
.scan-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.warning {
  color: #ffa502;
  font-weight: bold;
}

.success {
  color: #00ff88;
  font-weight: bold;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>