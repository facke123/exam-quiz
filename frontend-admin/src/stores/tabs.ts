import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  name: string
  path: string
  title: string
  affix?: boolean
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([])

  function addTab(route: RouteLocationNormalized) {
    if (!route.name || route.meta?.hidden) return
    const exist = tabs.value.find((t) => t.path === route.path)
    if (!exist) {
      tabs.value.push({
        name: route.name as string,
        path: route.path,
        title: (route.meta?.title as string) || '未命名',
        affix: route.meta?.affix,
      })
    }
  }

  function removeTab(path: string) {
    const idx = tabs.value.findIndex((t) => t.path === path)
    if (idx === -1) return
    if (tabs.value[idx].affix) return
    tabs.value.splice(idx, 1)
  }

  function closeOther(path: string) {
    tabs.value = tabs.value.filter((t) => t.path === path || t.affix)
  }

  function closeAll() {
    tabs.value = tabs.value.filter((t) => t.affix)
  }

  return {
    tabs,
    addTab,
    removeTab,
    closeOther,
    closeAll,
  }
})
