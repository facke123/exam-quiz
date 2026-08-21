<script setup lang="ts">
import { computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import * as Icons from '@element-plus/icons-vue'

const props = defineProps<{
  item: RouteRecordRaw
  basePath: string
}>()

function resolveMenuPath(routePath: string): string {
  if (routePath.startsWith('/')) return routePath
  if (props.basePath === '/') return `/${routePath}`
  return `${props.basePath}/${routePath}`.replace(/\/+/g, '/')
}

const visibleChildren = computed(() => {
  return (props.item.children || []).filter((c) => !c.meta?.hidden)
})

const isSingle = computed(() => {
  return visibleChildren.value.length === 1 && !props.item.meta?.alwaysShow
})

const isLeaf = computed(() => {
  return visibleChildren.value.length === 0
})
</script>

<template>
  <!-- 叶子节点（子菜单里的单项） -->
  <el-menu-item v-if="isLeaf" :index="basePath">
    <el-icon v-if="item.meta?.icon">
      <component :is="(Icons as any)[item.meta.icon]" />
    </el-icon>
    <template #title>{{ item.meta?.title }}</template>
  </el-menu-item>

  <!-- 根级单一子节点（如仪表盘、用户管理、数据统计） -->
  <el-menu-item
    v-else-if="isSingle"
    :index="resolveMenuPath(visibleChildren[0].path)"
  >
    <el-icon v-if="visibleChildren[0].meta?.icon || item.meta?.icon">
      <component
        :is="(Icons as any)[visibleChildren[0].meta?.icon || item.meta?.icon]"
      />
    </el-icon>
    <template #title>
      {{ visibleChildren[0].meta?.title || item.meta?.title }}
    </template>
  </el-menu-item>

  <!-- 多子节点：渲染为 sub-menu -->
  <el-sub-menu v-else :index="basePath">
    <template #title>
      <el-icon v-if="item.meta?.icon">
        <component :is="(Icons as any)[item.meta.icon]" />
      </el-icon>
      <span>{{ item.meta?.title }}</span>
    </template>
    <template v-for="child in visibleChildren" :key="child.path">
      <SidebarItem
        :item="child"
        :base-path="resolveMenuPath(child.path)"
      />
    </template>
  </el-sub-menu>
</template>
