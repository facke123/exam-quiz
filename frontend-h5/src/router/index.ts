import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/auth/forgot',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPassword.vue'),
    meta: { title: '找回密码', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/TabBarLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/home/Home.vue'),
        meta: { title: '首页', requiresAuth: true, keepAlive: true }
      },
      {
        path: 'chapter',
        name: 'ChapterList',
        component: () => import('@/views/chapter/ChapterList.vue'),
        meta: { title: '章节练习', requiresAuth: true, keepAlive: true }
      },
      {
        path: 'wrong',
        name: 'WrongBook',
        component: () => import('@/views/wrong/WrongBook.vue'),
        meta: { title: '错题本', requiresAuth: true, keepAlive: true }
      },
      {
        path: 'stats',
        name: 'Stats',
        component: () => import('@/views/stats/Stats.vue'),
        meta: { title: '数据统计', requiresAuth: true, keepAlive: true }
      },
      {
        path: 'mine',
        name: 'Mine',
        component: () => import('@/views/mine/Mine.vue'),
        meta: { title: '我的', requiresAuth: true, keepAlive: true }
      }
    ]
  },
  {
    path: '/quiz/:mode',
    name: 'Quiz',
    component: () => import('@/views/quiz/Quiz.vue'),
    meta: { title: '做题', requiresAuth: true }
  },
  {
    path: '/quiz/analysis/:id',
    name: 'Analysis',
    component: () => import('@/views/quiz/Analysis.vue'),
    meta: { title: '题目解析', requiresAuth: true }
  },
  {
    path: '/quiz/report/:id',
    name: 'Report',
    component: () => import('@/views/quiz/Report.vue'),
    meta: { title: '成绩报告', requiresAuth: true }
  },
  {
    path: '/real',
    name: 'RealExam',
    component: () => import('@/views/practice/RealExam.vue'),
    meta: { title: '历年真题', requiresAuth: true }
  },
  {
    path: '/mock',
    name: 'MockExam',
    component: () => import('@/views/practice/MockExam.vue'),
    meta: { title: '模拟考试', requiresAuth: true }
  },
  {
    path: '/daily',
    name: 'DailyPractice',
    component: () => import('@/views/practice/DailyPractice.vue'),
    meta: { title: '每日一练', requiresAuth: true }
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import('@/views/practice/Review.vue'),
    meta: { title: '艾宾浩斯复习', requiresAuth: true }
  },
  {
    path: '/case',
    name: 'CaseAnalysis',
    component: () => import('@/views/practice/CaseAnalysis.vue'),
    meta: { title: '案例分析', requiresAuth: true }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('@/views/user/Notes.vue'),
    meta: { title: '笔记管理', requiresAuth: true }
  },
  {
    path: '/records',
    name: 'Records',
    component: () => import('@/views/user/Records.vue'),
    meta: { title: '做题记录', requiresAuth: true }
  },
  {
    path: '/vip',
    name: 'VipCenter',
    component: () => import('@/views/vip/VipCenter.vue'),
    meta: { title: '会员中心', requiresAuth: false }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/user/Settings.vue'),
    meta: { title: '设置', requiresAuth: true }
  },
  {
    path: '/subject',
    name: 'SubjectPicker',
    component: () => import('@/views/subject/SubjectPicker.vue'),
    meta: { title: '科目选择', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 白名单（无需登录即可访问）
const WHITE_LIST = ['/auth/login', '/auth/register', '/auth/forgot', '/vip']

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const hasToken = !!userStore.token

  document.title = (to.meta.title as string) || '软考刷题'

  if (to.meta.requiresAuth === false || WHITE_LIST.includes(to.path)) {
    // 已登录不能进入登录页
    if (hasToken && ['/auth/login', '/auth/register', '/auth/forgot'].includes(to.path)) {
      return next('/')
    }
    return next()
  }

  if (to.meta.requiresAuth && !hasToken) {
    return next({ path: '/auth/login', query: { redirect: to.fullPath } })
  }

  next()
})

export default router
