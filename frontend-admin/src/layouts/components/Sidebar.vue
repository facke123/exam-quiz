<script setup lang="ts">
import { computed } from 'vue'
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
      <div class="sidebar__logo-box">📝</div>
      <span v-show="!collapsed" class="sidebar__title">软考刷题后台</span>
    </div>
    <el-scrollbar class="sidebar__scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="#001529"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#ffffff"
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
  background: #001529;

  &__logo {
    height: var(--app-navbar-height);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fff;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__logo-box {
    width: 32px;
    height: 32px;
    background: var(--primary);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: 0.5px;
  }

  &__scroll {
    flex: 1;

    :deep(.el-menu) {
      border-right: none;
    }

    :deep(.el-menu-item) {
      height: 48px;
      line-height: 48px;
      font-size: 14px;
      border-left: 3px solid transparent;
      transition: all 0.2s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.06) !important;
        color: #fff !important;
      }

      &.is-active {
        background-color: rgba(74, 108, 247, 0.15) !important;
        color: #fff !important;
        border-left-color: var(--primary);
        font-weight: 600;
      }
    }

    :deep(.el-sub-menu__title) {
      height: 48px;
      line-height: 48px;
      font-size: 14px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.06) !important;
        color: #fff !important;
      }
    }
  }
}
</style>
