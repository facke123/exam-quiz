import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/global.scss'
import 'element-plus/dist/index.css'

const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
// 过滤第三方浏览器插件引起的异步通信断开误报
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('message channel closed before a response was received') ||
    event.reason?.message?.includes('A listener indicated an asynchronous response')
  ) {
    event.preventDefault()
  }
})

app.mount('#app')
