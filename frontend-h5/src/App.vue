<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <keep-alive :include="cachedViews">
        <component :is="Component" />
      </keep-alive>
    </router-view>

    <!-- 全局 Loading -->
    <van-loading
      v-if="globalLoading"
      type="spinner"
      color="#6366F1"
      size="32px"
      class="global-loading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const cachedViews = ref<string[]>(['Home', 'ChapterList', 'WrongBook', 'Stats', 'Mine'])
const globalLoading = ref(false)
</script>

<style scoped lang="scss">
.app-container {
  width: 100%;
  min-height: 100vh;
}

.global-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
}
</style>
