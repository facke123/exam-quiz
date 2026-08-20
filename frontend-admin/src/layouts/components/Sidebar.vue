<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { useRoute } from 'vue-router'
import SidebarItem from './SidebarItem.vue'

defineProps<{
  routes: RouteRecordRaw[]
  collapsed: boolean
}>()

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<template>
  <div class="sidebar">
    <div class="sidebar__logo">
      <el-icon size="28" color="#2f6bff"><Reading /></el-icon>
      <span v-show="!collapsed" class="sidebar__title">软考刷题后台</span>
    </div>
    <el-scrollbar class="sidebar__scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="#001529"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#fff"
        router
        unique-opened
      >
        <template v-for="item in routes" :key="item.path">
          <sidebar-item :item="item" :base-path="item.path" />
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__logo {
    height: var(--app-navbar-height);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #fff;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
  }

  &__scroll {
    flex: 1;

    :deep(.el-menu) {
      border-right: none;
    }

    :deep(.el-sub-menu__title:hover),
    :deep(.el-menu-item:hover) {
      background-color: rgba(255, 255, 255, 0.06) !important;
    }

    :deep(.el-menu-item.is-active) {
      background-color: #2f6bff !important;
    }
  }
}
</style>
