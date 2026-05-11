<template>
  <div class="card">
    <h2>Python爬虫</h2>
    <div class="form-group">
      <label for="url">目标URL</label>
      <input 
        id="url" 
        v-model="url" 
        type="text" 
        placeholder="请输入目标网址，如: https://example.com"
      />
    </div>
    <div class="form-group">
      <label for="depth">爬取深度</label>
      <input 
        id="depth" 
        v-model.number="depth" 
        type="number" 
        min="1" 
        max="5"
        placeholder="爬取深度(1-5)"
      />
    </div>
    <button class="btn btn-primary" @click="startCrawl" :disabled="loading">
      <span v-if="loading" class="loading"></span>
      {{ loading ? '爬取中...' : '开始爬取' }}
    </button>

    <div v-if="crawlProgress" class="progress-bar">
      <div class="progress-bar-inner" :style="{ width: crawlProgress + '%' }"></div>
    </div>

    <div v-if="result" class="result" :class="{ error: error }">
      <pre>{{ formattedResult }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const url = ref('')
const depth = ref(1)
const result = ref(null)
const error = ref(false)
const loading = ref(false)
const crawlProgress = ref(0)

const formattedResult = computed(() => {
  if (result.value) {
    return JSON.stringify(result.value, null, 2)
  }
  return ''
})

const startCrawl = async () => {
  if (!url.value) {
    alert('请输入目标URL')
    return
  }

  loading.value = true
  error.value = false
  crawlProgress.value = 0

  try {
    const response = await axios.post('/api/crawler/start', {
      url: url.value,
      depth: depth.value
    })
    result.value = response.data
  } catch (err) {
    error.value = true
    result.value = err.response?.data || { error: '爬取失败' }
  } finally {
    loading.value = false
    crawlProgress.value = 100
  }
}
</script>