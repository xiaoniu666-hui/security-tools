<template>
  <div class="card">
    <h2>数据清洗</h2>
    <div class="form-group">
      <label for="inputData">输入数据</label>
      <textarea 
        id="inputData" 
        v-model="inputData" 
        placeholder="请输入需要清洗的数据，支持JSON、HTML、文本等格式"
      ></textarea>
    </div>
    <div class="form-group">
      <label for="cleanType">清洗类型</label>
      <select id="cleanType" v-model="cleanType">
        <option value="html">HTML标签去除</option>
        <option value="json">JSON格式化</option>
        <option value="trim">首尾空格去除</option>
        <option value="special">特殊字符过滤</option>
        <option value="all">全部清洗</option>
      </select>
    </div>
    <button class="btn btn-primary" @click="cleanData" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '清洗中...' : '开始清洗' }}
    </button>

    <div v-if="result" class="result" :class="{ error: error }">
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const inputData = ref('')
const cleanType = ref('all')
const result = ref('')
const error = ref(false)
const loading = ref(false)

const cleanData = async () => {
  if (!inputData.value) {
    alert('请输入需要清洗的数据')
    return
  }
  
  loading.value = true
  error.value = false
  
  try {
    const response = await axios.post('/api/data/clean', {
      data: inputData.value,
      type: cleanType.value
    })
    result.value = response.data.result
  } catch (err) {
    error.value = true
    result.value = '清洗失败: ' + (err.response?.data?.error || err.message)
  } finally {
    loading.value = false
  }
}
</script>