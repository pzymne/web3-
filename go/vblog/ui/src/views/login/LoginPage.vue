<template>
    <div class="login-container-wrapper">
        <!-- 登录表单容器 -->
        <div class="login-container">
            <!-- title -->
            <div class="title">欢迎登录我的博客管理系统</div>
            <!-- 登录表单 -->
            <div style="margin-top: 20px;">
                <a-form size="large" :model="form" @submit="handleSubmit" auto-label-width>
                    <a-form-item hide-asterisk field="username" label="" :rules="{ required: true, message: '请输入用户名' }">
                        <a-input v-model="form.username" placeholder="请输入用户名" allow-clear>
                            <template #prefix>
                                <icon-user />
                            </template>
                        </a-input>
                    </a-form-item>
                    <a-form-item hide-asterisk field="password" label="" :rules="{ required: true, message: '请输入密码' }">
                        <a-input-password v-model="form.password" placeholder="请输入密码" allow-clear>
                            <template #prefix>
                                <icon-lock />
                            </template>
                        </a-input-password>
                    </a-form-item>
                    <a-form-item field="is_member" label="">
                        <a-checkbox value="true">记住</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                        <a-button :loading="LoginLoadding" html-type="submit" style="width: 100%;">登录</a-button>
                    </a-form-item>
                </a-form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { LOGIN } from '@/api/vblog'
import { useRouter } from 'vue-router';
import app from '@/stores/app'


// 获取router, 使用Router来帮忙进行路有切换
// 使用useRouter来获取当前的router对象
const router = useRouter()

const LoginLoadding = ref(false)

const form = reactive({
    username: '',
    password: '',
    is_member: false,
})

const handleSubmit = async (data) => {
    if (!data.errors) {
        console.log(data.values)
        // 把这个form表单数据提交给后代API Server
        // http client api call
        // 1. 登录Loading(是不是网络请求中)
        // 1.1 声明1个响应式变量 LoginLoadding
        // 1.2 开启请求时 设置为true, 请求结束设置为false
        try {
            LoginLoadding.value = true
            const resp = await LOGIN(data.values)
            // 2. 如果登录成功了， 需要跳转到后台页面
            // 使用push方法 指定需要跳转的路有
            // 直接把登录后到状态信息保存在LocalStorge里面
            app.value.token = resp
            router.push({ name: 'BackendLayout' })
        } finally {
            LoginLoadding.value = false
        }
    }
}
</script>

<style lang="css" scoped>
.login-container-wrapper {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #EFEFBB;
    /* fallback for old browsers */
    background: -webkit-linear-gradient(to right, #D4D3DD, #EFEFBB);
    /* Chrome 10-25, Safari 5.1-6 */
    background: linear-gradient(to right, #D4D3DD, #EFEFBB);
    /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
}

.login-container {
    height: 320px;
    width: 500px;
    border: solid 1px var(--color-neutral-3);
    padding: 26px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);

    background-color: rgba(255, 255, 255, 0.3);
    /* 设置背景颜色和透明度 */
    backdrop-filter: blur(10px);
    /* 设置模糊效果 */
    border-radius: 10px;
    /* 设置圆角 */
}

.title {
    font-size: 24px;
    font-weight: 600;
    display: flex;
    justify-content: center;
    color: var(--color-neutral-8);
}

/* 如何覆盖.arco-form-item-label-col的样式 */
.login-container :deep(.arco-form-item-label-col) {
    padding-right: 0px;
}
</style>