<template>
  <div class="login-container">
    <h2>登录美食推荐平台</h2>
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      label-width="0px"  class="login-form"
      @submit.prevent="handleLogin" 
    >
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          placeholder="用户名/手机号/邮箱"
          size="large"
          prefix-icon="User"
          data-cy="login-username"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          placeholder="密码"
          size="large"
          prefix-icon="Lock"
          show-password
          data-cy="login-password"
        />
      </el-form-item>

      <!-- 可以添加验证码输入框 -->
      <!-- <el-form-item prop="captcha"> ... </el-form-item> -->

      <el-form-item>
        <el-button
          type="primary"
          :loading="loading"
          native-type="submit"
          size="large"
          style="width: 100%;"
          data-cy="login-submit"
        >
          登录
        </el-button>
      </el-form-item>

      <div class="form-links">
        <el-link type="primary" @click="goToRegister">立即注册</el-link>
        <el-link type="info">忘记密码?</el-link>
      </div>

      <!-- Add a place to display error messages -->
      <div v-if="errorMessage" class="error-message" style="color: red; margin-bottom: 1rem;">
        {{ errorMessage }}
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue'; // 引入图标
import { useAuthStore } from '@/store/modules/auth';
import { useUserStore } from '@/store/modules/user';
import apiClient from '@/services/api'; // Import the configured Axios instance

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();

const loginFormRef = ref<FormInstance>();
const loading = ref(false);
const errorMessage = ref(''); // To display API errors

const loginForm = reactive({
  username: '',
  password: '',
  loginType: 'password' as const, // 明确登录类型
});

const loginRules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名/手机号/邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码长度至少为6位', trigger: 'blur' }],
  // captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
});

async function handleLogin() {
  loading.value = true;
  errorMessage.value = ''; // Clear previous errors

  try {
    // Prepare payload with the correct field name expected by the backend
    const payload = {
        emailOrUsername: loginForm.username, // Assuming loginForm.username holds the input
        password: loginForm.password
    };
    
    // Use the payload in the API call
    const response = await apiClient.post('/auth/login', payload);

    if (response.data && response.data.token) {
      const { token, user } = response.data;

      // 1. Store the token
      localStorage.setItem('authToken', token);

      // 2. Store user info (e.g., in Pinia store)
      authStore.setToken(token);
      userStore.setUser(user);
      console.log('Login successful, user:', user); // Placeholder

      // 3. Redirect to home or dashboard
      router.push({ name: 'Home' }); // Assuming you have a route named 'Home'

    } else {
      // Should not happen if backend sends correct response
      errorMessage.value = 'Login failed: Invalid response from server.';
    }

  } catch (error: any) {
    console.error('Login error:', error);
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message; // Show backend error
    } else {
      errorMessage.value = 'An unexpected error occurred during login.';
    }
  } finally {
    loading.value = false;
  }
}

const goToRegister = () => {
  router.push('/auth/register');
};
</script>

<style scoped lang="scss">
.login-container {
  h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #303133;
  }

  .login-form {
    width: 100%;
  }

  .form-links {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }
}
</style> 