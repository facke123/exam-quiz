import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, getAdminInfo, logout as logoutApi, type LoginParams, type AdminInfo } from '@/api/auth'
import { storage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(storage.get('admin_token') || '')
  const adminInfo = ref<AdminInfo | null>(storage.get('admin_info') || null)
  const roles = ref<string[]>(adminInfo.value?.roles || [])

  async function login(params: LoginParams) {
    const res = await loginApi(params)
    token.value = res.data.token
    adminInfo.value = res.data.admin
    roles.value = res.data.admin.roles
    storage.set('admin_token', token.value)
    storage.set('admin_info', adminInfo.value)
    return res
  }

  async function fetchAdminInfo() {
    const res = await getAdminInfo()
    adminInfo.value = res.data
    roles.value = res.data.roles
    storage.set('admin_info', adminInfo.value)
    return res.data
  }

  async function logout() {
    try {
      await logoutApi()
    } catch (e) {
      // 忽略登出请求失败
    }
    resetState()
  }

  function resetState() {
    token.value = ''
    adminInfo.value = null
    roles.value = []
    storage.remove('admin_token')
    storage.remove('admin_info')
  }

  return {
    token,
    adminInfo,
    roles,
    login,
    fetchAdminInfo,
    logout,
    resetState,
  }
})
