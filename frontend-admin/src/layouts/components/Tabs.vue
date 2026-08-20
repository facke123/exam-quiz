<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '@/stores/tabs'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

// 初始添加当前路由
watch(
  () => route.path,
  () => {
    tabsStore.addTab(route)
  },
  { immediate: true },
)

onMounted(() => {
  tabsStore.addTab(route)
})

function handleClick(path: string) {
  router.push(path)
}

function handleClose(path: string) {
  const tabs = tabsStore.tabs
  const idx = tabs.findIndex((t) => t.path === path)
  tabsStore.removeTab(path)
  // 如果关闭的是当前激活的 tab，跳转到相邻 tab
  if (route.path === path) {
    const next = tabs[idx] || tabs[idx - 1] || tabs[0]
    if (next) router.push(next.path)
  }
}

function handleCloseOther(path: string) {
  tabsStore.closeOther(path)
}

function handleCloseAll() {
  tabsStore.closeAll()
  const first = tabsStore.tabs[0]
  if (first) router.push(first.path)
}
</script>

<template>
  <div class="tabs">
    <el-scrollbar>
      <div class="tabs__inner">
        <div
          v-for="tab in tabsStore.tabs"
          :key="tab.path"
          class="tabs__item"
          :class="{ 'is-active': route.path === tab.path }"
          @click="handleClick(tab.path)"
          @contextmenu.prevent="
            (e) => {
              e.stopPropagation()
            }
          "
        >
          <span class="tabs__title">{{ tab.title }}</span>
          <el-icon
            v-if="!tab.affix"
            class="tabs__close"
            size="12"
            @click.stop="handleClose(tab.path)"
          >
            <Close />
          </el-icon>
        </div>
      </div>
    </el-scrollbar>

    <el-dropdown class="tabs__action" trigger="click">
      <el-icon size="16"><CircleClose /></el-icon>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="handleCloseOther(route.path)">关闭其他</el-dropdown-item>
          <el-dropdown-item @click="handleCloseAll">关闭全部</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  height: var(--app-tabs-height);
  background: var(--el-bg-color);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--app-border-color);
  padding: 0 8px;

  &__inner {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    white-space: nowrap;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid var(--app-border-color);
    border-radius: 4px;
    font-size: 12px;
    color: var(--app-text-regular);
    cursor: pointer;
    background: var(--el-bg-color);
    transition: all 0.2s;

    &:hover {
      color: var(--el-color-primary);
    }

    &.is-active {
      background: var(--el-color-primary);
      color: #fff;
      border-color: var(--el-color-primary);
    }
  }

  &__close {
    border-radius: 50%;
    &:hover {
      background: rgba(0, 0, 0, 0.15);
    }
  }

  &__action {
    margin-left: 8px;
    cursor: pointer;
    color: var(--app-text-regular);
    flex-shrink: 0;
  }
}
</style>
