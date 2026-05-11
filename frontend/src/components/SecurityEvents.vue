<template>
  <div class="card">
    <h2>安全事件日志</h2>
    
    <select v-model="filterLevel" @change="loadEvents">
      <option value="">全部级别</option>
      <option value="info">信息</option>
      <option value="warning">警告</option>
      <option value="error">错误</option>
      <option value="critical">严重</option>
    </select>

    <div class="result">
      <div v-for="event in events" :key="event.id" :class="'event-item level-' + event.level">
        <div class="event-header">
          <span class="event-type">{{ event.type }}</span>
          <span class="event-time">{{ event.timestamp }}</span>
        </div>
        <p>{{ event.description }}</p>
        <div v-if="event.source_ip" class="event-meta">源IP: {{ event.source_ip }}</div>
        <div v-if="event.action_taken" class="event-action">{{ event.action_taken }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const events = ref([])
const filterLevel = ref('')

const loadEvents = async () => {
  const params = filterLevel.value ? { level: filterLevel.value } : {}
  const response = await axios.get('/api/defense/events', { params })
  events.value = response.data.data
}

onMounted(loadEvents)
</script>

<style scoped>
.event-item { 
  padding: 15px; 
  border-radius: 10px; 
  margin-bottom: 10px; 
}
.level-info { background: rgba(0, 217, 255, 0.1); }
.level-warning { background: rgba(255, 193, 7, 0.1); }
.level-error { background: rgba(255, 107, 53, 0.1); }
.level-critical { background: rgba(255, 71, 87, 0.1); }
.event-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.event-type { font-weight: bold; }
.event-meta, .event-action { font-size: 12px; color: #aaa; margin-top: 5px; }
</style>