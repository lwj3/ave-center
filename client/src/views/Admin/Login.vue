<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">
          <img style="width: 30px;" src="https://ave.ai/_nuxt/avedex_mobile_logo.DN0XNEWA.webp" alt="AVE Logo"/> 
          AVE 学习中心
        </h1>
      </div>
      <el-form :model="form" @keyup.enter="handleLogin" size="large">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAdminStore } from '../../store/admin'
import { login } from '../../api'

const router = useRouter()
const route = useRoute()
const adminStore = useAdminStore()
const loading = ref(false)

const form = ref({
  username: '',
  password: '',
})

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const res = await login(form.value)
    if (res.code === 0) {
      adminStore.setLogin(res.data)
      ElMessage.success('登录成功')
      const redirect = route.query.redirect || '/admin/articles'
      router.push(redirect)
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('../../assets/home-bg-2.png') center center fixed no-repeat;
  background-size: cover;
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
}

.login-tip {
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 8px;
}
</style>
