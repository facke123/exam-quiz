<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const appStore = useAppStore()

// 应用暗色模式
watch(
  () => appStore.darkMode,
  (val) => {
    document.documentElement.classList.toggle('dark', val)
  },
  { immediate: true },
)
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
    <div v-loading.fullscreen.lock="$route.meta.loading" class="global-loading" />
  </el-config-provider>
</template>

<style scoped lang="scss">
.global-loading {
  display: none;
}
</style>
