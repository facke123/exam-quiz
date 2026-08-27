<template>
  <div class="pc-desktop-wrapper">
    <!-- PC 大屏左侧专属功能与导航侧边栏 (屏幕宽度 >= 1200px 显示) -->
    <PcDesktopSidebarLeft class="pc-flank-sidebar pc-flank-left" />

    <!-- 核心页面主视口容器 (手机全屏 / PC端居中精致画布) -->
    <main class="app-main-canvas">
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
    </main>

    <!-- PC 大屏右侧专属辅助与同步侧边栏 (屏幕宽度 >= 1200px 显示) -->
    <PcDesktopSidebarRight class="pc-flank-sidebar pc-flank-right" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSubjectStore } from '@/stores/subject'
import PcDesktopSidebarLeft from '@/components/PcDesktopSidebarLeft.vue'
import PcDesktopSidebarRight from '@/components/PcDesktopSidebarRight.vue'

const cachedViews = ref<string[]>(['Home', 'ChapterList', 'WrongBook', 'Stats', 'Mine'])
const globalLoading = ref(false)
const subjectStore = useSubjectStore()

onMounted(() => {
  subjectStore.fetchSubjects()
})
</script>

<style scoped lang="scss">
.pc-desktop-wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* 核心视口画布容器 */
.app-main-canvas {
  width: 100%;
  min-height: 100vh;
  position: relative;
  background: var(--bg-page, #f4f5f7);
}

/* 默认在移动端隐藏 PC 侧边栏 */
.pc-flank-sidebar {
  display: none;
}

/* PC 端响应式大屏展示 (屏幕宽度 >= 768px) */
@media (min-width: 768px) {
  .pc-desktop-wrapper {
    padding: 24px 16px;
    gap: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .app-main-canvas {
    max-width: 520px;
    border-radius: 20px;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
}

/* PC 端超宽屏显示左右两侧 Companion 面板 (屏幕宽度 >= 1200px) */
@media (min-width: 1200px) {
  .pc-flank-sidebar {
    display: flex;
  }
}

.global-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
}
</style>

