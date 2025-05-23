<template>
    <el-dialog :model-value="modelValue" title="发布新分享" width="600px" :before-close="handleClose"
        :close-on-click-modal="false" append-to-body destroy-on-close>
        <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
            <el-form-item label="标题" prop="title">
                <el-input v-model="formData.title" placeholder="给你的分享起个响亮的标题吧" maxlength="50" show-word-limit />
            </el-form-item>
            <el-form-item label="分享内容" prop="content">
                <el-input v-model="formData.content" type="textarea" :rows="6" placeholder="有什么新鲜事想分享给大家？"
                    maxlength="1000" show-word-limit resize="none" />
            </el-form-item>
            <el-form-item label="添加图片 (最多1张)">
                <el-upload ref="uploadRef" v-model:file-list="fileList" action="#" list-type="picture-card"
                    :auto-upload="false" :limit="1" :on-exceed="handleExceed" :on-change="handleFileChange"
                    :on-remove="handleFileRemove" accept="image/*">
                    <el-icon>
                        <Plus />
                    </el-icon>
                </el-upload>
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
                    发布
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage, ElUpload, ElIcon } from 'element-plus';
import type { FormInstance, FormRules, UploadInstance, UploadProps, UploadUserFile, UploadRawFile } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useUserStore } from '@/store/modules/user';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue', 'post-success']);

const formRef = ref<FormInstance>();
const uploadRef = ref<UploadInstance>();
const isSubmitting = ref(false);
const userStore = useUserStore();
const formData = reactive({
    title: '',
    content: '',
});
const fileList = ref<UploadUserFile[]>([]);
const imageUrls = ref<string[]>([]);

const rules = reactive<FormRules>({
    title: [
        { required: true, message: '标题不能为空', trigger: 'blur' },
        { min: 3, message: '标题至少需要 3 个字符', trigger: 'blur' },
    ],
    content: [
        { required: true, message: '分享内容不能为空', trigger: 'blur' },
        { min: 5, message: '内容至少需要 5 个字符', trigger: 'blur' },
    ],
});

const handleExceed: UploadProps['onExceed'] = (files) => {
    uploadRef.value!.clearFiles();
    const file = files[0] as UploadRawFile;
    uploadRef.value!.handleStart(file);
    ElMessage.warning('只能上传一张图片，旧图片已被替换');
};

const handleFileChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
    if (uploadFile.status === 'ready') {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === 'string') {
                imageUrls.value = [e.target.result];
                console.log('Generated Data URL:', imageUrls.value[0].substring(0, 50) + '...');
            } else {
                imageUrls.value = [];
                ElMessage.error('图片读取失败');
            }
        };
        reader.onerror = () => {
            imageUrls.value = [];
            ElMessage.error('图片读取错误');
        };
        if (uploadFile.raw) {
            reader.readAsDataURL(uploadFile.raw);
        } else {
            imageUrls.value = [];
        }
    }
    fileList.value = uploadFiles;
};

const handleFileRemove: UploadProps['onRemove'] = (_uploadFile, uploadFiles) => {
    imageUrls.value = [];
    fileList.value = uploadFiles;
    console.log('Image removed');
};

watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        formData.title = '';
        formData.content = '';
        imageUrls.value = [];
        fileList.value = [];
        setTimeout(() => {
            formRef.value?.resetFields();
        }, 0);
    }
});

const handleClose = () => {
    emit('update:modelValue', false);
};

const handleSubmit = async () => {
    if (!formRef.value || isSubmitting.value) return;

    if (!userStore.userInfo) {
        ElMessage.error('请先登录再发帖');
        return;
    }

    try {
        await formRef.value.validate();
        isSubmitting.value = true;

        console.log('Submitting post via API:', formData.title, formData.content, imageUrls.value);

        const response = await api.post('/posts', {
            title: formData.title,
            content: formData.content,
            imageUrls: imageUrls.value.length > 0 ? imageUrls.value : null,
        });

        ElMessage.success('发布成功！');
        emit('post-success', response.data);
        handleClose();

    } catch (error: any) {
        console.error("Error submitting post:", error);
        const isValidationError =
            typeof error === 'object' &&
            error !== null &&
            Object.keys(error).some(key => formData.hasOwnProperty(key));

        if (!isValidationError) {
            const message = error.response?.data?.message || '发布操作失败，请稍后再试';
            ElMessage.error(message);
        }
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped lang="scss">
.dialog-footer {
    text-align: right;
}

/* Add any specific styles if needed */
</style>