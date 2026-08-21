<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-badge">📝</div>
        <h1 class="title">软考刷题系统</h1>
        <p class="subtitle">后台教研与运营管理控制台</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入管理员账号 (默认 admin)"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码 (默认 admin123)"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          :loading="loading"
          class="submit-btn"
          @click="handleLogin"
        >
          立即登录
        </el-button>
      </el-form>

      <div class="login-footer">
        <span>默认管理员：admin / admin123</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功，欢迎进入控制台')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    // 错误已由拦截器提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #001529 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 12px;
  padding: 36px 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;

  .logo-badge {
    width: 48px;
    height: 48px;
    background: var(--primary);
    border-radius: 12px;
    margin: 0 auto 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(74, 108, 247, 0.35);
  }

  .title {
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 4px;
  }

  .subtitle {
    font-size: 13px;
    color: var(--gray-5);
  }
}

.submit-btn {
  width: 100%;
  height: 44px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 700;
  margin-top: 6px;
  background: var(--primary);
  border-color: var(--primary);

  &:hover {
    opacity: 0.9;
  }
}

.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: var(--gray-5);
}
</style>
