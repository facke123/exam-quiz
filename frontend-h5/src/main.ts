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

// 忽略 Chrome 扩展（如翻译插件、广告拦截等）消息通道关闭引发的未捕获 Promise 警告
window.addEventListener('unhandledrejection', (event) => {
  if (
    event?.reason?.message?.includes('message channel closed') ||
    event?.reason?.message?.includes('asynchronous response')
  ) {
    event.preventDefault()
  }
})

app.mount('#app')
