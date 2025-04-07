<template>
  <div class="register-container">
    <h2>注册新用户</h2>
    <el-form
      ref="registerFormRef"
      :model="registerForm"
      :rules="registerRules"
      label-width="80px"
      class="register-form"
      @submit.prevent="handleRegister"
    >
      <el-form-item label="用户名" prop="username">
        <el-input v-model="registerForm.username" placeholder="设置用户名" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="registerForm.email" placeholder="设置邮箱" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input v-model="registerForm.password" type="password" placeholder="设置登录密码" show-password />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
      </el-form-item>

      <el-form-item label-width="0px">
        <el-button
          type="primary"
          :loading="loading"
          native-type="submit"
          size="large"
          style="width: 100%;"
        >
          注册
        </el-button>
      </el-form-item>

      <div class="form-links">
        <el-link type="primary" @click="goToLogin">已有账号? 去登录</el-link>
      </div>

      <div v-if="errorMessage" class="error-message" style="color: red; margin-bottom: 1rem;">
        {{ errorMessage }}
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';

const router = useRouter();
const registerFormRef = ref<FormInstance>();
const loading = ref(false);
const errorMessage = ref('');

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.password) {
    callback(new Error("两次输入密码不一致!"));
  } else {
    callback();
  }
};

const registerRules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ],
});

const handleRegister = async () => {
  if (!registerFormRef.value) return;
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) {
      console.log('Form validation failed');
      return Promise.resolve();
    }
    
    loading.value = true;
    errorMessage.value = '';
    try {
      const payload = {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
      };
      const response = await apiClient.post('/auth/register', payload);
      
      console.log('Registration successful:', response.data);
      ElMessage.success('注册成功！即将跳转到登录页');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message;
      } else {
        errorMessage.value = 'An unexpected error occurred during registration.';
      }
    } finally {
      loading.value = false;
    }
  });
};

const goToLogin = () => {
  router.push('/auth/login');
};
</script>

<style scoped lang="scss">
.register-container {
  h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #303133;
  }

  .register-form {
    width: 100%;
    .el-form-item {
      margin-bottom: 22px;
    }
  }

  .form-links {
    text-align: right;
    margin-top: 10px;
  }
}
</style> 