<template>
  <div class="card">
    <h2>🌍 IP地理定位阻止</h2>
    
    <div class="form-group">
      <input 
        v-model="newCountry" 
        type="text" 
        placeholder="国家代码 (如: CN, US, JP)"
        maxlength="2"
      />
      <input 
        v-model="reason" 
        type="text" 
        placeholder="阻止原因"
      />
      <button class="btn btn-primary" @click="addCountry">加入阻止</button>
    </div>

    <table class="result">
      <thead>
        <tr>
          <th>国家代码</th>
          <th>原因</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in countries" :key="item.id">
          <td>{{ item.country_code }}</td>
          <td>{{ item.reason || '未指定' }}</td>
          <td :class="item.active ? 'status-active' : 'status-disabled'">
            {{ item.active ? '阻止中' : '已解除' }}
          </td>
          <td>
            <button 
              class="btn btn-secondary" 
              @click="toggleCountry(item)"
            >
              {{ item.active ? '解除阻止' : '阻止' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const countries = ref([])
const newCountry = ref('')
const reason = ref('')

const loadCountries = async () => {
  const response = await axios.get('/api/defense/geo/blocked-countries')
  countries.value = response.data.data || []
}

const addCountry = async () => {
  if (!newCountry.value || newCountry.value.length !== 2) {
    alert('请输入有效的国家代码(2个字符)')
    return
  }
  await axios.post('/api/defense/geo/block-country', {
    country_code: newCountry.value.toUpperCase(),
    reason: reason.value
  })
  newCountry.value = ''
  reason.value = ''
  await loadCountries()
}

const toggleCountry = async (country) => {
  if (country.active) {
    await axios.post('/api/defense/geo/unblock-country', {
      country_code: country.country_code
    })
  } else {
    await axios.post('/api/defense/geo/block-country', {
      country_code: country.country_code,
      reason: country.reason || '重新阻止'
    })
  }
  await loadCountries()
}

onMounted(loadCountries)
</script>

<style scoped>
.status-active { color: #ff4757; }
.status-disabled { color: #00ff88; }
</style>