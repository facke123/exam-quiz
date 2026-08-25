import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { storage } from '@/utils/storage'

// 路由元信息类型
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    roles?: string[]
    hidden?: boolean
    keepAlive?: boolean
    affix?: boolean // 标签页常驻
  }
}

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Odometer', keepAlive: true, affix: true },
      },
    ],
  },
  {
    path: '/question',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/question/list',
    meta: { title: '题目管理', icon: 'Document' },
    children: [
      {
        path: 'list',
        name: 'QuestionList',
        component: () => import('@/views/question/QuestionList.vue'),
        meta: { title: '题目列表', icon: 'Document', keepAlive: true },
      },
      {
        path: 'import',
        name: 'QuestionImport',
        component: () => import('@/views/question/QuestionImport.vue'),
        meta: { title: '题目导入', icon: 'Upload', keepAlive: true },
      },
      {
        path: 'feedback',
        alias: ['error-report'],
        name: 'ErrorReport',
        component: () => import('@/views/question/ErrorReport.vue'),
        meta: { title: '纠错反馈', icon: 'Warning', keepAlive: true },
      },
    ],
  },
  {
    path: '/exam',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/exam/subject',
    meta: { title: '考试管理', icon: 'Notebook' },
    children: [
      {
        path: 'subject',
        name: 'SubjectManage',
        component: () => import('@/views/exam/SubjectManage.vue'),
        meta: { title: '科目章节', icon: 'Files', keepAlive: true },
      },
      {
        path: 'paper',
        name: 'PaperManage',
        component: () => import('@/views/exam/PaperManage.vue'),
        meta: { title: '试卷管理', icon: 'Tickets', keepAlive: true },
      },
    ],
  },
  {
    path: '/ai',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/ai/generate',
    meta: { title: 'AI出题', icon: 'MagicStick' },
    children: [
      {
        path: 'generate',
        name: 'AIGenerate',
        component: () => import('@/views/ai/AIGenerate.vue'),
        meta: { title: '出题审核', icon: 'MagicStick', keepAlive: true },
      },
      {
        path: 'prompt',
        name: 'AIPrompt',
        component: () => import('@/views/ai/AIPrompt.vue'),
        meta: { title: 'Prompt管理', icon: 'ChatLineSquare', keepAlive: true },
      },
      {
        path: 'config',
        name: 'AIConfig',
        component: () => import('@/views/ai/AIConfig.vue'),
        meta: { title: 'AI模型配置', icon: 'Setting', keepAlive: true },
      },
    ],
  },
  {
    path: '/user',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/user/list',
    children: [
      {
        path: 'list',
        name: 'UserList',
        component: () => import('@/views/user/UserList.vue'),
        meta: { title: '用户管理', icon: 'User', keepAlive: true },
      },
    ],
  },
  {
    path: '/stats',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/stats/overview',
    children: [
      {
        path: 'overview',
        name: 'StatsOverview',
        component: () => import('@/views/stats/StatsOverview.vue'),
        meta: { title: '数据统计', icon: 'TrendCharts', keepAlive: true },
      },
    ],
  },
  {
    path: '/content',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/content/announcement',
    meta: { title: '内容管理', icon: 'Picture' },
    children: [
      {
        path: 'announcement',
        name: 'Announcement',
        component: () => import('@/views/content/Announcement.vue'),
        meta: { title: '公告管理', icon: 'Bell', keepAlive: true },
      },
      {
        path: 'banner',
        name: 'BannerManage',
        component: () => import('@/views/content/Banner.vue'),
        meta: { title: 'Banner管理', icon: 'Picture', keepAlive: true },
      },
    ],
  },
  {
    path: '/system',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/system/admin',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'admin',
        name: 'AdminSetting',
        component: () => import('@/views/system/AdminSetting.vue'),
        meta: { title: '管理员设置', icon: 'UserFilled', keepAlive: true },
      },
      {
        path: 'config',
        name: 'SystemConfig',
        component: () => import('@/views/system/SystemConfig.vue'),
        meta: { title: '系统配置', icon: 'Tools', keepAlive: true },
      },
      {
        path: 'log',
        name: 'OperationLog',
        component: () => import('@/views/system/OperationLog.vue'),
        meta: { title: '操作日志', icon: 'List', keepAlive: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', hidden: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

// 不需要登录的白名单
const whiteList = ['/login']

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 软考刷题后台` : '软考刷题后台'
  const token = storage.get('admin_token')

  if (token) {
    if (to.path === '/login') {
      next('/')
    } else {
      // 角色权限校验
      const userStore = useUserStore()
      if (to.meta.roles && to.meta.roles.length > 0) {
        if (!userStore.roles.some((r) => to.meta.roles!.includes(r))) {
          next('/403')
          return
        }
      }
      next()
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

export default router
