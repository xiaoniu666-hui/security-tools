<template>
  <div class="app">
    <div v-if="isCheckingAuth" class="loading-container">
      <div class="loading"></div>
      <p>正在验证身份...</p>
    </div>
    
    <Login v-else-if="!isLoggedIn" @login="handleLogin" />
    
    <div v-else class="main-content">
      <header class="header">
        <div class="logo">
          <h1>🔐 网络安全工具集</h1>
        </div>
        <div class="header-right">
          <span class="user-info">{{ currentUser?.username }}</span>
          <button class="btn-logout" @click="logout">退出</button>
        </div>
      </header>

      <div class="legal-notice">
        ⚠️ 本网站仅用于在法律允许下的src漏洞的挖掘，禁止进行违法行为
      </div>

      <nav class="nav">
        <div class="dropdown">
          <button class="dropdown-btn attack" @click="openDropdown($event, 'attack')">
            ⚔️ 攻击手段
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="dropdown-content" data-dropdown="attack">
            <button 
              v-for="tab in attackTabs" 
              :key="tab.id" 
              :class="['dropdown-item', { active: activeTab === tab.id }]"
              @click.stop="activeTab = tab.id; closeDropdowns()"
            >
              {{ tab.name }}
            </button>
          </div>
        </div>

        <div class="dropdown">
          <button class="dropdown-btn defense" @click="openDropdown($event, 'defense')">
            🛡️ 防御手段
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="dropdown-content" data-dropdown="defense">
            <button 
              v-for="tab in defenseTabs" 
              :key="tab.id" 
              :class="['dropdown-item', { active: activeTab === tab.id }]"
              @click.stop="activeTab = tab.id; closeDropdowns()"
            >
              {{ tab.name }}
            </button>
          </div>
        </div>

        <div class="dropdown">
          <button class="dropdown-btn tool" @click="openDropdown($event, 'tool')">
            🔧 辅助工具
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="dropdown-content" data-dropdown="tool">
            <button 
              v-for="tab in toolTabs" 
              :key="tab.id" 
              :class="['dropdown-item', { active: activeTab === tab.id }]"
              @click.stop="activeTab = tab.id; closeDropdowns()"
            >
              {{ tab.name }}
            </button>
          </div>
        </div>

        <div class="dropdown">
          <button class="dropdown-btn ai" @click="openDropdown($event, 'ai')">
            🤖 AI助手
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="dropdown-content" data-dropdown="ai">
            <button 
              :class="['dropdown-item', { active: activeTab === 'aiQA' }]"
              @click.stop="activeTab = 'aiQA'; closeDropdowns()"
            >
              AI问答
            </button>
          </div>
        </div>
      </nav>

      <main class="content">
        <div class="tab-content">
          <IPQuery v-if="activeTab === 'ipQuery'" />
          <VirtualIP v-if="activeTab === 'virtualIp'" />
          <Crawler v-if="activeTab === 'crawler'" />
          <DataCleaning v-if="activeTab === 'dataCleaning'" />
          
          <VulnerabilityScanner v-if="activeTab === 'vulnerabilityScanner'" />
          <XSSUpload v-if="activeTab === 'xssUpload'" />
          <CSRFTest v-if="activeTab === 'csrfTest'" />
          <CommandInjection v-if="activeTab === 'commandInjection'" />
          <PathTraversal v-if="activeTab === 'pathTraversal'" />
          <SSRFTest v-if="activeTab === 'ssrfTest'" />
          <PasswordCrack v-if="activeTab === 'passwordCrack'" />
          <SQLInject v-if="activeTab === 'sqlInject'" />
          <Blacklist v-if="activeTab === 'blacklist'" />
          <WAFRules v-if="activeTab === 'wafRules'" />
          <SecurityEvents v-if="activeTab === 'securityEvents'" />
          <SSLCertificates v-if="activeTab === 'sslCertificates'" />
          <IntrusionDetection v-if="activeTab === 'intrusionDetection'" />
          <RateLimitConfig v-if="activeTab === 'rateLimit'" />
          <GeoBlocking v-if="activeTab === 'geoBlocking'" />
          <AnomalyDetection v-if="activeTab === 'anomalyDetection'" />
          <InputValidation v-if="activeTab === 'inputValidation'" />
          <FileSecurity v-if="activeTab === 'fileSecurity'" />
          <SecurityHeaders v-if="activeTab === 'securityHeaders'" />
          <ThreatIntel v-if="activeTab === 'threatIntel'" />
          <DomainLookup v-if="activeTab === 'domainLookup'" />
          <VPNAnalysis v-if="activeTab === 'vpnAnalysis'" />
          <AIQA v-if="activeTab === 'aiQA'" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

import Login from './components/Login.vue'
import IPQuery from './components/IPQuery.vue'
import VirtualIP from './components/VirtualIP.vue'
import Crawler from './components/Crawler.vue'
import DataCleaning from './components/DataCleaning.vue'

import VulnerabilityScanner from './components/VulnerabilityScanner.vue'
import XSSUpload from './components/XSSUpload.vue'
import PasswordCrack from './components/PasswordCrack.vue'
import SQLInject from './components/SQLInject.vue'
import CSRFTest from './components/CSRFTest.vue'
import CommandInjection from './components/CommandInjection.vue'
import PathTraversal from './components/PathTraversal.vue'
import SSRFTest from './components/SSRFTest.vue'
import Blacklist from './components/Blacklist.vue'
import WAFRules from './components/WAFRules.vue'
import SecurityEvents from './components/SecurityEvents.vue'
import SSLCertificates from './components/SSLCertificates.vue'
import IntrusionDetection from './components/IntrusionDetection.vue'
import RateLimitConfig from './components/RateLimitConfig.vue'
import GeoBlocking from './components/GeoBlocking.vue'
import AnomalyDetection from './components/AnomalyDetection.vue'
import InputValidation from './components/InputValidation.vue'
import FileSecurity from './components/FileSecurity.vue'
import SecurityHeaders from './components/SecurityHeaders.vue'
import ThreatIntel from './components/ThreatIntel.vue'
import DomainLookup from './components/DomainLookup.vue'
import VPNAnalysis from './components/VPNAnalysis.vue'
import AIQA from './components/AIQA.vue'

const isLoggedIn = ref(false)
const currentUser = ref(null)
const activeTab = ref('xssUpload')
const isCheckingAuth = ref(true)
const openDropdownId = ref(null)

const attackTabs = [
  { id: 'xssUpload', name: 'XSS跨站测试' },
  { id: 'csrfTest', name: 'CSRF攻击测试' },
  { id: 'commandInjection', name: '命令注入测试' },
  { id: 'pathTraversal', name: '路径遍历测试' },
  { id: 'ssrfTest', name: 'SSRF测试' },
  { id: 'sqlInject', name: 'SQL注入测试' },
  { id: 'vulnerabilityScanner', name: '综合漏洞扫描' },
  { id: 'passwordCrack', name: '弱密码爆破' },
  { id: 'crawler', name: '信息收集爬虫' }
]

const defenseTabs = [
  { id: 'blacklist', name: 'IP黑名单管理' },
  { id: 'wafRules', name: 'WAF规则配置' },
  { id: 'securityEvents', name: '安全事件监控' },
  { id: 'sslCertificates', name: 'SSL证书管理' },
  { id: 'intrusionDetection', name: '入侵检测系统' },
  { id: 'rateLimit', name: '速率限制配置' },
  { id: 'geoBlocking', name: 'IP地理定位阻止' },
  { id: 'anomalyDetection', name: '异常行为检测' },
  { id: 'inputValidation', name: '输入验证检测' },
  { id: 'fileSecurity', name: '文件上传安全' },
  { id: 'securityHeaders', name: '安全头配置' },
  { id: 'threatIntel', name: '威胁情报查询' }
]

const toolTabs = [
  { id: 'ipQuery', name: 'IP信息查询' },
  { id: 'domainLookup', name: '域名查询IP' },
  { id: 'virtualIp', name: '虚拟IP生成' },
  { id: 'vpnAnalysis', name: '虚拟IP破解' },
  { id: 'dataCleaning', name: '数据清洗处理' }
]

const handleLogin = (user) => {
  currentUser.value = user
  isLoggedIn.value = true
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  isLoggedIn.value = false
  currentUser.value = null
  activeTab.value = 'xssUpload'
}

const openDropdown = (event, dropdownId) => {
  const btn = event.currentTarget
  const dropdown = btn.parentElement
  const content = dropdown.querySelector('.dropdown-content')
  
  if (openDropdownId.value === dropdownId) {
    openDropdownId.value = null
    closeDropdowns()
  } else {
    openDropdownId.value = dropdownId
    closeDropdowns()
    
    if (content) {
      const rect = btn.getBoundingClientRect()
      content.style.left = `${rect.left}px`
      content.style.top = `${rect.bottom + 10}px`
      content.style.display = 'block'
    }
  }
}

const closeDropdowns = () => {
  const dropdowns = document.querySelectorAll('.dropdown-content')
  dropdowns.forEach(d => {
    d.style.display = 'none'
  })
}

const handleClickOutside = (event) => {
  const dropdowns = document.querySelectorAll('.dropdown')
  let clickedInside = false
  
  dropdowns.forEach(dropdown => {
    if (dropdown.contains(event.target)) {
      clickedInside = true
    }
  })
  
  if (!clickedInside) {
    openDropdownId.value = null
    closeDropdowns()
  }
}

const checkAuth = async () => {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const response = await axios.get('/api/auth/check', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.authenticated) {
        isLoggedIn.value = true
        currentUser.value = response.data.user
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
  isCheckingAuth.value = false
}

onMounted(() => {
  checkAuth()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #fff;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
}

.main-content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-y: visible;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.legal-notice {
  background: linear-gradient(90deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2));
  border-top: 1px solid rgba(255, 193, 7, 0.3);
  border-bottom: 1px solid rgba(255, 193, 7, 0.3);
  padding: 12px 30px;
  text-align: center;
  color: #ffc107;
  font-size: 14px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  color: #00d9ff;
  font-weight: bold;
}

.btn-logout {
  padding: 10px 20px;
  background: rgba(255, 71, 87, 0.2);
  border: 1px solid #ff4757;
  border-radius: 10px;
  color: #ff4757;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: #ff4757;
  color: #fff;
}

.nav {
  display: flex;
  gap: 15px;
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.2);
  overflow-x: auto;
  overflow-y: visible;
  position: relative;
  z-index: 1000;
}

.dropdown {
  position: relative;
  flex-shrink: 0;
  z-index: 1001;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.dropdown-btn.attack {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.dropdown-btn.defense {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.dropdown-btn.tool {
  background: rgba(0, 217, 255, 0.2);
  color: #00d9ff;
  border: 1px solid rgba(0, 217, 255, 0.3);
}

.dropdown-btn.ai {
  background: rgba(156, 39, 176, 0.2);
  color: #9c27b0;
  border: 1px solid rgba(156, 39, 176, 0.3);
}

.dropdown-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.dropdown-arrow {
  font-size: 10px;
  transition: transform 0.3s;
}

.dropdown-content {
  display: none;
  position: fixed;
  background: rgba(20, 20, 35, 0.98);
  border-radius: 15px;
  min-width: 220px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  z-index: 9999;
  border: 1px solid rgba(255, 255, 255, 0.15);
  max-height: 400px;
  overflow-y: auto;
}

.dropdown-item {
  width: 100%;
  padding: 12px 20px;
  text-align: left;
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  padding-left: 25px;
}

.dropdown-item.active {
  background: linear-gradient(90deg, rgba(0, 217, 255, 0.3), rgba(0, 255, 136, 0.3));
  color: #00d9ff;
  padding-left: 25px;
}

.dropdown-item.active:hover {
  background: linear-gradient(90deg, rgba(0, 217, 255, 0.4), rgba(0, 255, 136, 0.4));
}

.content {
  flex: 1;
  padding: 20px 30px;
}

.tab-content {
  min-height: 500px;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card h2 {
  color: #00d9ff;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.form-group input {
  padding: 12px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 14px;
  flex: 1;
  min-width: 200px;
}

.form-group select {
  padding: 12px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.95);
  color: #000;
  font-size: 14px;
  flex: 1;
  min-width: 200px;
  cursor: pointer;
}

.form-group input::placeholder {
  color: #666;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(90deg, #00d9ff, #00ff88);
  color: #000;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 217, 255, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.result {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.result.error {
  border-color: rgba(255, 71, 87, 0.5);
}

.result pre {
  white-space: pre-wrap;
  word-break: break-all;
  color: #aaa;
  font-size: 14px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
}

th {
  color: #00d9ff;
}

.loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  gap: 20px;
}

.loading-container p {
  color: #00d9ff;
  font-size: 16px;
}
</style>