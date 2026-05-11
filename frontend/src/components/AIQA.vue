<template>
  <div class="ai-container">
    <div class="ai-header">
      <h2>AI安全助手</h2>
      <button class="btn btn-secondary" @click="newSession">新对话</button>
    </div>
    
    <div class="chat-container">
      <div class="message-list" ref="messageList">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['message', msg.isBot ? 'bot' : 'user']"
        >
          <div class="avatar">{{ msg.isBot ? 'AI' : 'Me' }}</div>
          <div class="content">
            <p v-if="!msg.isThinking">{{ msg.displayText || msg.text }}</p>
            <div v-else class="thinking">
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
              <span class="thinking-text">思考中...</span>
            </div>
            <span class="time">{{ msg.time }}</span>
          </div>
        </div>
      </div>
      
      <div class="input-area">
        <input 
          v-model="question" 
          type="text" 
          placeholder="输入您的问题..."
          :disabled="isTyping"
          @keyup.enter="sendMessage"
        />
        <button class="btn btn-primary" @click="sendMessage" :disabled="isTyping">发送</button>
      </div>
    </div>
    
    <div class="quick-questions">
      <h4>快捷问题</h4>
      <div class="quick-tags">
        <button 
          v-for="q in quickQuestions" 
          :key="q" 
          class="quick-tag"
          @click="quickAsk(q)"
          :disabled="isTyping"
        >
          {{ q }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import axios from 'axios'

const messages = ref([])
const question = ref('')
const sessionId = ref('')
const isTyping = ref(false)
const messageList = ref(null)
const typingInterval = ref(null)

const quickQuestions = [
  '什么是XSS测试？',
  '如何使用IP查询功能？',
  '什么是SQL注入？',
  '如何配置WAF规则？',
  '端口扫描有什么用？'
]

const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

const typeWriter = (messageIndex, fullText) => {
  let charIndex = 0
  messages.value[messageIndex].displayText = ''
  
  typingInterval.value = setInterval(() => {
    if (charIndex < fullText.length) {
      messages.value[messageIndex].displayText += fullText.charAt(charIndex)
      charIndex++
      scrollToBottom()
    } else {
      clearInterval(typingInterval.value)
      isTyping.value = false
    }
  }, 50)
}

const newSession = async () => {
  const response = await axios.post('/api/ai/new-session')
  sessionId.value = response.data.sessionId
  messages.value = [{
    isBot: true,
    text: response.data.greeting,
    displayText: response.data.greeting,
    time: new Date().toLocaleTimeString()
  }]
}

const sendMessage = async () => {
  if (!question.value.trim() || isTyping.value) return
  
  messages.value.push({
    isBot: false,
    text: question.value,
    displayText: question.value,
    time: new Date().toLocaleTimeString()
  })
  
  const tempQuestion = question.value
  question.value = ''
  scrollToBottom()
  
  // 添加思考状态消息
  const thinkingIndex = messages.value.length
  messages.value.push({
    isBot: true,
    isThinking: true,
    text: '',
    displayText: '',
    time: new Date().toLocaleTimeString()
  })
  isTyping.value = true
  scrollToBottom()
  
  try {
    // 先等待一段时间模拟思考
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const response = await axios.post('/api/ai/ask', {
      question: tempQuestion,
      sessionId: sessionId.value
    })
    
    // 结束思考状态，开始打字机效果
    messages.value[thinkingIndex].isThinking = false
    messages.value[thinkingIndex].text = response.data.answer
    typeWriter(thinkingIndex, response.data.answer)
    
    if (!sessionId.value) {
      sessionId.value = response.data.sessionId
    }
  } catch (error) {
    messages.value[thinkingIndex].isThinking = false
    messages.value[thinkingIndex].text = '抱歉，我暂时无法回答这个问题。'
    typeWriter(thinkingIndex, '抱歉，我暂时无法回答这个问题。')
  }
}

const quickAsk = (q) => {
  question.value = q
  sendMessage()
}

onMounted(newSession)
</script>

<style scoped>
.ai-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  display: flex;
  margin-bottom: 20px;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message.user .content {
  background: linear-gradient(90deg, #00d9ff, #00ff88);
  color: #000;
}

.message.bot .content {
  background: rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin: 0 10px;
}

.message.user .avatar {
  background: linear-gradient(90deg, #00d9ff, #00ff88);
  color: #000;
}

.message.bot .avatar {
  background: rgba(255, 255, 255, 0.2);
}

.content {
  padding: 15px 20px;
  border-radius: 20px;
  position: relative;
}

.content p {
  margin: 0;
  line-height: 1.6;
}

.thinking {
  display: flex;
  align-items: center;
  gap: 5px;
}

.thinking-dot {
  width: 8px;
  height: 8px;
  background: #00d9ff;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.thinking-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dot:nth-child(2) {
  animation-delay: -0.16s;
}

.thinking-text {
  color: #aaa;
  margin-left: 5px;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.time {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 5px;
  display: block;
}

.input-area {
  display: flex;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-area input {
  flex: 1;
  padding: 15px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 16px;
}

.input-area button {
  margin-left: 10px;
  padding: 15px 30px;
  border-radius: 25px;
}

.quick-questions {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-questions h4 {
  margin-bottom: 15px;
  color: #aaa;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-tag {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 20px;
  color: #00d9ff;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-tag:hover {
  background: rgba(0, 217, 255, 0.2);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: linear-gradient(90deg, #00d9ff, #00ff88);
  color: #000;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
</style>