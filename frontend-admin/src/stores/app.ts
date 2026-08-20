import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref<boolean>(false)
  const darkMode = ref<boolean>(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  return {
    sidebarCollapsed,
    darkMode,
    toggleSidebar,
    toggleDarkMode,
  }
})
