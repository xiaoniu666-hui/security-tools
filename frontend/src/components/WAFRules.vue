<template>
  <div class="card">
    <h2>WAF规则管理</h2>
    
    <div class="form-group">
      <input v-model="ruleName" placeholder="规则名称" />
      <input v-model="rulePattern" placeholder="正则表达式" />
      <select v-model="ruleAction">
        <option value="block">拦截</option>
        <option value="allow">允许</option>
        <option value="log">记录</option>
      </select>
      <button class="btn btn-primary" @click="addRule">添加规则</button>
    </div>

    <div class="result">
      <div v-for="rule in rules" :key="rule.id" class="rule-item">
        <h3>{{ rule.name }}</h3>
        <p>模式: {{ rule.pattern }}</p>
        <p>动作: {{ rule.action }}</p>
        <button 
          class="btn" 
          :class="rule.active ? 'btn-secondary' : 'btn-primary'"
          @click="toggleRule(rule.id, !rule.active)"
        >
          {{ rule.active ? '禁用' : '启用' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const rules = ref([])
const ruleName = ref('')
const rulePattern = ref('')
const ruleAction = ref('block')

const loadRules = async () => {
  const response = await axios.get('/api/defense/waf/rules')
  rules.value = response.data.data
}

const addRule = async () => {
  if (!ruleName.value || !rulePattern.value) return
  await axios.post('/api/defense/waf/rules/add', {
    name: ruleName.value,
    pattern: rulePattern.value,
    action: ruleAction.value
  })
  ruleName.value = ''
  rulePattern.value = ''
  await loadRules()
}

const toggleRule = async (id, active) => {
  await axios.post('/api/defense/waf/rules/toggle', { id, active })
  await loadRules()
}

onMounted(loadRules)
</script>

<style scoped>
.rule-item { 
  padding: 15px; 
  border-bottom: 1px solid rgba(255,255,255,0.1); 
  margin-bottom: 10px;
}
</style>