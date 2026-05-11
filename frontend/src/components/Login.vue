<template>
  <div class="login-container">
    <div class="login-card">
      <h2>{{ isRegister ? '注册' : '登录' }}</h2>
      
      <div class="form-group">
        <input 
          v-model="username" 
          type="text" 
          placeholder="用户名或邮箱"
        />
      </div>
      
      <div class="form-group" v-if="isRegister">
        <input 
          v-model="email" 
          type="email" 
          placeholder="邮箱"
        />
      </div>
      
      <div class="form-group">
        <input 
          v-model="password" 
          type="password" 
          placeholder="密码"
        />
      </div>
      
      <button class="btn btn-primary" @click="handleSubmit">
        {{ isRegister ? '注册' : '登录' }}
      </button>
      
      <p class="toggle-link" @click="isRegister = !isRegister">
        {{ isRegister ? '已有账号？点击登录' : '没有账号？点击注册' }}
      </p>
      
      <div v-if="error" class="error-message">{{ error }}</div>
      
      <div v-if="success" class="success-message">{{ success }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits(['login'])

const isRegister = ref(false)
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')

const handleSubmit = async () => {
  error.value = ''
  success.value = ''

  if (!username.value || !password.value) {
    error.value = '请填写完整信息'
    return
  }

  if (isRegister.value && !email.value) {
    error.value = '请填写邮箱'
    return
  }

  try {
    const url = isRegister.value ? '/api/auth/register' : '/api/auth/login'
    const data = isRegister.value
      ? { username: username.value, email: email.value, password: password.value }
      : { username: username.value, password: password.value }

    const response = await axios.post(url, data)

    if (response.data.success) {
      if (!isRegister.value) {
        localStorage.setItem('token', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('expiresAt', response.data.expiresAt)
        emit('login', response.data.user)
      } else {
        success.value = '注册成功！请登录'
        isRegister.value = false
      }
    }
  } catch (err) {
    error.value = err.response?.data?.error || '操作失败'
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.login-card h2 {
  color: #00d9ff;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group input {
  width: 100%;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 16px;
}

.form-group input::placeholder {
  color: #666;
}

.toggle-link {
  margin-top: 20px;
  color: #00d9ff;
  cursor: pointer;
}

.toggle-link:hover {
  text-decoration: underline;
}

.error-message {
  color: #ff4757;
  margin-top: 15px;
}

.success-message {
  color: #00ff88;
  margin-top: 15px;
}

.btn {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(90deg, #00d9ff, #00ff88);
  color: #000;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 217, 255, 0.4);
}
</style>