<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import Tabs from './components/Tabs.vue'
import { constantRoutes } from '@/router'

const appStore = useAppStore()
const route = useRoute()

// 过滤出需要显示的菜单路由
const menuRoutes = computed(() => {
  return constantRoutes.filter(
    (r) => !r.meta?.hidden && r.children && r.children.length > 0,
  )
})

const contentKey = computed(() => route.path)

const cachedViews = computed(() => {
  return constantRoutes
    .flatMap((r) => r.children || [])
    .filter((c) => c.meta?.keepAlive)
    .map((c) => c.name as string)
})
</script>

<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="admin-layout__sidebar" :class="{ 'is-collapsed': appStore.sidebarCollapsed }">
      <Sidebar :routes="menuRoutes" :collapsed="appStore.sidebarCollapsed" />
    </aside>

    <!-- 主区域 -->
    <div class="admin-layout__main">
      <Navbar />
      <Tabs />
      <main class="admin-layout__content">
        <router-view v-slot="{ Component }">
          <keep-alive :include="cachedViews">
            <component :is="Component" :key="contentKey" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;

  &__sidebar {
    width: var(--app-sidebar-width);
    height: 100%;
    flex-shrink: 0;
    transition: width 0.28s ease;
    background: #001529;
    overflow: hidden;

    &.is-collapsed {
      width: var(--app-sidebar-collapsed-width);
    }
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100%;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    background: var(--app-content-bg);
  }
}
</style>
