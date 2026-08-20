import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vant 全局样式
import 'vant/lib/index.css'
// KaTeX 样式
import 'katex/dist/katex.min.css'
// 全局样式
import '@/styles/global.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化用户 store（从 localStorage 恢复 token）
import { useUserStore } from '@/stores/user'
useUserStore().initFromStorage()

app.mount('#app')
