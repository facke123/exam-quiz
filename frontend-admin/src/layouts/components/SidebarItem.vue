<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import * as Icons from '@element-plus/icons-vue'

const props = defineProps<{
  item: RouteRecordRaw
  basePath: string
}>()

// 是否只有一个可显示子节点
function isSingleChild(item: RouteRecordRaw): boolean {
  const visibleChildren = (item.children || []).filter((c) => !c.meta?.hidden)
  return visibleChildren.length === 1 && !item.meta?.alwaysShow
}

function resolveMenuPath(routePath: string): string {
  return props.basePath === '/' ? routePath : `${props.basePath}/${routePath}`.replace(/\/+/g, '/')
}
</script>

<template>
  <!-- 单一子节点：直接渲染为 menu-item -->
  <template v-if="isSingleChild(item)">
    <el-menu-item :index="resolveMenuPath(item.children![0].path)">
      <el-icon v-if="item.children![0].meta?.icon">
        <component :is="(Icons as any)[item.children![0].meta.icon]" />
      </el-icon>
      <template #title>{{ item.children![0].meta?.title }}</template>
    </el-menu-item>
  </template>

  <!-- 多子节点：渲染为 sub-menu -->
  <el-sub-menu v-else :index="basePath">
    <template #title>
      <el-icon v-if="item.meta?.icon">
        <component :is="(Icons as any)[item.meta.icon]" />
      </el-icon>
      <span>{{ item.meta?.title }}</span>
    </template>
    <template v-for="child in item.children" :key="child.path">
      <SidebarItem
        v-if="!child.meta?.hidden"
        :item="child"
        :base-path="resolveMenuPath(child.path)"
      />
    </template>
  </el-sub-menu>
</template>
