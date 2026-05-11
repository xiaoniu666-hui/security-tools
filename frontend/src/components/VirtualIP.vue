<template>
  <div class="card">
    <h2>虚拟IP生成</h2>
    <div class="form-group">
      <label for="count">生成数量</label>
      <input 
        id="count" 
        v-model.number="count" 
        type="number" 
        min="1" 
        max="100"
        placeholder="请输入生成数量"
      />
    </div>
    <div class="form-group">
      <label for="type">IP类型</label>
      <select id="type" v-model="type">
        <option value="ipv4">IPv4</option>
        <option value="ipv6">IPv6</option>
      </select>
    </div>
    <button class="btn btn-primary" @click="generateIP" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '生成中...' : '生成' }}
    </button>

    <div v-if="result?.length > 0" class="result">
      <pre>{{ result.join('\n') }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const count = ref(10)
const type = ref('ipv4')
const result = ref([])
const loading = ref(false)

const generateIP = async () => {
  if (!count.value || count.value < 1) {
    alert('请输入有效的生成数量')
    return
  }
  
  loading.value = true
  
  try {
    const response = await axios.get('/api/ip/generate', {
      params: { count: count.value, type: type.value }
    })
    result.value = response.data
  } catch (err) {
    result.value = ['生成失败: ' + (err.response?.data?.error || err.message)]
  } finally {
    loading.value = false
  }
}
</script>