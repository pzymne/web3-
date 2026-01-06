<template>
    <a-layout>
        <a-layout-header class="header">
            <div class="header-left">
                我的博客
            </div>
            <div class="header-right">
                <a-space>
                    <a-button class="header-color" type="text"
                        @click="router.push({ name: 'FrontendBlogList' })">前台</a-button>
                    <a-button class="header-color" :loading="logoutLoadding" type="text" @click="handleLogout"><span
                            style="margin-right: 12px;">退出</span><icon-export /></a-button>
                </a-space>
            </div>
        </a-layout-header>
        <a-layout>
            <a-layout-sider collapsible :width="260" class="sider-bar" breakpoint="xl">
                <a-menu @menu-item-click="handleMenuItemClick" :style="{ width: '100%', height: '100%' }"
                    :default-open-keys="['BlogManagement']" :default-selected-keys="['BackendBlogList']" breakpoint="xl"
                    @collapse="onCollapse">
                    <a-sub-menu key="BlogManagement">
                        <template #icon><icon-apps></icon-apps></template>
                        <template #title>文章管理</template>
                        <a-menu-item key="BackendBlogList">文章列表</a-menu-item>
                        <a-menu-item key="BackendTagList">标签列表</a-menu-item>
                    </a-sub-menu>
                    <a-sub-menu key="CommentManagement">
                        <template #icon><icon-message /></template>
                        <template #title>评论管理</template>
                        <a-menu-item key="BackendCommentList">评论列表</a-menu-item>
                    </a-sub-menu>
                </a-menu>
            </a-layout-sider>
            <a-layout-content class="page"><router-view /></a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script setup>
import { LOGOUT } from '@/api/vblog'
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import app from '@/stores/app'

const router = useRouter()

const logoutLoadding = ref(false)
const handleLogout = async () => {
    // 1. 调用logout接口
    try {
        logoutLoadding.value = true
        await LOGOUT(app.value.token.refresh_token)
        app.value.token = undefined
    } catch(err) {
        console.log(err)
    } finally {
        logoutLoadding.value = false
    }
    // 2. 跳转到登录界面
    router.push({ name: 'LoginPage' })
}

const onCollapse = (v) => {
    console.log(v)
}

const handleMenuItemClick = (v) => {
    router.push({ name: v })
}
</script>

<style lang="css" scoped>
.header {
    height: 59px;
    border-bottom: 1px solid var(--color-border);
    padding: 0px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-neutral-8);
}

.header-color {
    color: var(--color-neutral-8);
    font-size: 12px;
}

.header-left {
    font-weight: 600;
}

.header-right {
    display: flex;
}

.sider-bar {
    height: calc(100vh - 60px);
    border-right: 1px solid var(--color-border);
}

.sider-bar :deep(.arco-layout-sider-trigger-light) {
    border-right: 1px solid var(--color-border);
}

.page {
    padding: 12px;
    height: calc(100vh - 60px);
    overflow: auto;

    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    /* Firefox */
}

.page::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, and Opera */
}
</style>