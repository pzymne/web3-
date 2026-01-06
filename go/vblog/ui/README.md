# ui

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## 前端开发

[前端框架搭建](https://gitee.com/infraboard/go-course/blob/master/day21/vblog-base.md)

### 清理模版

只留下App.vue 这个Root视图

### 安装UI插件

[UI组件](https://gitee.com/infraboard/go-course/blob/master/day20/vue3-ui.md)

```sh
npm install --save-dev @arco-design/web-vue
```

```js
import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import App from './App.vue'
import '@arco-design/web-vue/dist/arco.css'

const app = createApp(App)
app.use(ArcoVue)
app.mount('#app')
```

### UI原型

[UI原型](https://gitee.com/infraboard/go-course/blob/master/day21/vblog-base.md)

[](./docs/pags.drawio)

页面嵌套如何处理(Vue Router):

[](./docs/slot.drawio)

代码片段插件: Vue VSCode Snippets

### 布局页面设计

```js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'LoginPage',
      // 没有嵌套, 这个就最终的页面
      // import 使用, 会把这个页面的代码加载过来
      // 惰性加载,  使用()=> Component,  这会在真正访问这个页面的时候，才加载这个页面组件
      component: () => import('@/views/login/LoginPage.vue')
    },
    {
      path: '/backend',
      name: 'BackendLayout',
      // 没有嵌套, 这个就最终的页面
      component: () => import('@/views/backend/BackendLayout.vue'),
      redirect: { name: 'BackendBlogList' },
      children: [
        {
          // /backend/vblogs
          path: 'blogs/list',
          name: 'BackendBlogList',
          // 没有嵌套, 这个就最终的页面
          component: () => import('@/views/backend/blogs/ListPage.vue')
        },
        {
          // /backend/vblogs
          path: 'blogs/edit',
          name: 'BackendBlogEdit',
          // 没有嵌套, 这个就最终的页面
          component: () => import('@/views/backend/blogs/EditPage.vue')
        }
      ]
    },
    {
      path: '/frontend',
      name: 'FrontendLayout',
      // 没有嵌套, 这个就最终的页面
      component: () => import('@/views/frontend/FrontendLayout.vue'),
      redirect: { name: 'FrontendBlogList' },
      children: [
        {
          // /backend/vblogs
          path: 'blogs/list',
          name: 'FrontendBlogList',
          // 没有嵌套, 这个就最终的页面
          component: () => import('@/views/frontend/blogs/ListPage.vue')
        },
        {
          // /backend/vblogs
          path: 'blogs/detail',
          name: 'FronendBlogDetail',
          // 没有嵌套, 这个就最终的页面
          component: () => import('@/views/frontend/blogs/DetailPage.vue')
        }
      ]
    }
  ]
})

export default router
```

### 登录页面开发

```vue
<template>
  <div class="login-container-wrapper">
    <!-- 登录表单容器 -->
    <div class="login-container">
      <!-- title -->
      <div class="title">欢迎登录我的博客管理系统</div>
      <!-- 登录表单 -->
      <div style="margin-top: 20px;">
        <a-form size="large" :model="form" @submit="handleSubmit" auto-label-width>
          <a-form-item
            hide-asterisk
            field="username"
            label=""
            :rules="{ required: true, message: '请输入用户名' }"
          >
            <a-input v-model="form.username" placeholder="请输入用户名" allow-clear>
              <template #prefix>
                <icon-user />
              </template>
            </a-input>
          </a-form-item>
          <a-form-item
            hide-asterisk
            field="password"
            label=""
            :rules="{ required: true, message: '请输入密码' }"
          >
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
            <a-button :loading="LoginLoadding" html-type="submit" style="width: 100%;"
              >登录</a-button
            >
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { LOGIN } from '@/api/vblog'
import { useRouter } from 'vue-router'

// 获取router, 使用Router来帮忙进行路有切换
// 使用useRouter来获取当前的router对象
const router = useRouter()

const LoginLoadding = ref(false)

const form = reactive({
  username: '',
  password: '',
  is_member: false
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
      console.log(resp)
      router.push({ name: 'BackendLayout' })
    } finally {
      LoginLoadding.value = false
    }
  }
}
</script>
```

### 后面管理页面开发

#### 后台框架

```vue
<template>
  <a-layout>
    <a-layout-header class="header">
      <div class="header-left">我的博客</div>
      <div class="header-right">
        <a-space>
          <a-button type="text">前台</a-button>
          <a-button type="text"
            ><span style="margin-right: 12px;">退出</span><icon-export
          /></a-button>
        </a-space>
      </div>
    </a-layout-header>
    <a-layout>
      <a-layout-sider collapsible :width="260" class="sider-bar">侧边栏导航组件</a-layout-sider>
      <a-layout-content><router-view /></a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup></script>

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

.header-left {
  font-weight: 600;
}

.header-right {
  display: flex;
}

.sider-bar {
  height: calc(100vh - 60px);
}
</style>
```

#### 顶部导航

#### 后台文章管理

### 前台展示页面开发

### 更换主题

选择主题 [主题商店](https://arco.design/themes?currentPage=4&depLibrary=%40arco-design%2Fweb-vue&onlyPublished=false&pageSize=15&sortBy=starCount&tag=all)

选择一款合适的主题 替换掉默认主题
```sh
npm i @arco-themes/vue-jzg-color
```

```js
// import '@arco-design/web-vue/dist/arco.css'
import '@arco-themes/vue-jzg-color/index.less'
```

安装less css与编译器:

```js
npm install -D less
```
