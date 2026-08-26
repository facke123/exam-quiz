<template>
  <div class="register-page">
    <div class="bg-decor">
      <div class="circle c1" />
      <div class="circle c2" />
    </div>

    <div class="logo-area">
      <div class="logo">
        软
      </div>
      <h1 class="title">
        创建账号
      </h1>
      <p class="subtitle">
        开启你的备考之旅
      </p>
    </div>

    <div class="form-card">
      <div class="reg-tip-banner">
        📬 支持邮箱快速注册，注册成功即可畅享题库与智能解析
      </div>

      <van-field
        v-model="form.account"
        placeholder="请输入常用邮箱地址（如 xxx@qq.com）"
        left-icon="envelop-o"
        clearable
        type="email"
        class="input-field"
      />
      <van-field
        v-model="form.code"
        center
        clearable
        placeholder="6位邮箱验证码"
        left-icon="shield-o"
        maxlength="6"
        class="input-field"
      >
        <template #button>
          <van-button
            size="small"
            type="primary"
            plain
            round
            :disabled="counting"
            @click="sendCode"
          >
            {{ codeText }}
          </van-button>
        </template>
      </van-field>
      <div class="code-tip">
        验证码将发送至上述邮箱，5分钟内有效
      </div>

      <van-field
        v-model="form.password"
        type="password"
        placeholder="设置登录密码（6-20位）"
        left-icon="lock"
        clearable
        class="input-field"
      />
      <div
        v-if="form.password"
        class="strength-bar"
      >
        <div class="strength-segs">
          <span
            v-for="i in 4"
            :key="i"
            :style="{ background: i <= score ? scoreColor : '' }"
          />
        </div>
        <span class="strength-text">{{ strengthTextVal }}</span>
      </div>
      <van-field
        v-model="form.confirmPassword"
        type="password"
        placeholder="再次确认登录密码"
        left-icon="lock"
        clearable
        class="input-field"
      />

      <van-button
        type="primary"
        block
        round
        :loading="loading"
        class="register-btn"
        @click="onRegister"
      >
        立即注册
      </van-button>

      <div class="form-actions">
        <router-link
          to="/auth/login"
          class="link"
        >
          已有账号？去登录
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { register, sendCode as apiSendCode } from '@/api/auth'
import { isAccount, isEmail, isValidPassword, passwordStrength, strengthText, strengthColor } from '@/utils/validate'

const router = useRouter()
const form = reactive({
  account: '',
  code: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const counting = ref(false)
let count = 60

const score = computed(() => passwordStrength(form.password))
const scoreColor = computed(() => strengthColor(score.value))
const strengthTextVal = computed(() => strengthText(score.value))

const codeText = computed(() => (counting.value ? `${count}s 后重发` : '获取验证码'))

async function sendCode() {
  const acc = form.account.trim()
  if (!acc) return showToast('请输入注册邮箱')
  if (!isEmail(acc) && !isAccount(acc)) return showToast('请输入有效的邮箱地址（如 example@qq.com）')

  try {
    const res = await apiSendCode(acc, 'register')
    showToast({ type: 'success', message: res.data?.message || '验证码已发送至邮箱，请查收' })
    counting.value = true
    const timer = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(timer)
        counting.value = false
        count = 60
      }
    }, 1000)
  } catch (err: any) {
    showToast(err.message || '发送失败，请稍后重试')
  }
}

async function onRegister() {
  const acc = form.account.trim()
  if (!acc) return showToast('请输入注册邮箱')
  if (!isEmail(acc) && !isAccount(acc)) return showToast('请输入有效的邮箱地址')
  if (!/^\d{6}$/.test(form.code.trim())) return showToast('请输入6位数字验证码')
  if (!isValidPassword(form.password)) return showToast('密码长度需为6-20位')
  if (form.password !== form.confirmPassword) return showToast('两次输入的密码不一致')

  loading.value = true
  try {
    await register({ account: acc, code: form.code.trim(), password: form.password })
    showToast({ type: 'success', message: '恭喜！注册成功' })
    router.replace('/auth/login')
  } catch (err: any) {
    showToast(err.message || '注册失败，请检查验证码或邮箱')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.register-page {
  position: relative;
  min-height: 100vh;
  padding: var(--space-2xl) var(--space-xl) var(--space-xl);
  background: var(--gradient-primary);
  overflow: hidden;
}

.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);

    &.c1 {
      width: 240px;
      height: 240px;
      top: -80px;
      left: -80px;
    }
    &.c2 {
      width: 180px;
      height: 180px;
      bottom: -40px;
      right: -40px;
    }
  }
}

.logo-area {
  text-align: center;
  color: #fff;
  margin-bottom: var(--space-xl);
  position: relative;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-md);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  font-size: 32px;
  font-weight: 700;
  @include flex-center;
}

.title {
  font-size: var(--font-size-xl);
}

.subtitle {
  font-size: var(--font-size-sm);
  opacity: 0.85;
  margin-top: 4px;
}

.form-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
}

.reg-tip-banner {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 12px;
  color: #1e40af;
  line-height: 1.4;
  margin-bottom: var(--space-md);
}

.code-tip {
  font-size: 11px;
  color: var(--text-secondary);
  margin: -6px 0 var(--space-md) 4px;
}

.input-field {
  margin-bottom: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-page);

  :deep(.van-field__control) {
    font-size: var(--font-size-base);
    padding: 10px 0;
  }
}

.strength-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);

  .strength-segs {
    flex: 1;
    display: flex;
    gap: 4px;

    span {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: var(--border-light);
      transition: background var(--transition-base);
    }
  }

  .strength-text {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }
}

.register-btn {
  margin-top: var(--space-lg);
  height: 48px;
  font-size: var(--font-size-md);
  font-weight: 600;
  background: var(--gradient-primary);
  border: none;
}

.form-actions {
  text-align: center;
  margin-top: var(--space-lg);

  .link {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
  }
}
</style>
