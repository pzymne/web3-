import { createRouter, createWebHistory } from 'vue-router'
import app from '@/stores/app'

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
      beforeEnter: () => {
        // 怎么确认用户当前有没有登录喃?
        // 如果中断直接返回你要去向的页面
        if (!app.value.token) {
          return { name: 'LoginPage' }
        }
      },
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
        },
        {
          // /backend/vblogs
          path: 'comments/list',
          name: 'BackendCommentList',
          // 没有嵌套, 这个就最终的页面
          component: () => import('@/views/backend/comment/ListPage.vue')
        },
        {
          // /backend/vblogs
          path: 'tags/list',
          name: 'BackendTagList',
          // 没有嵌套, 这个就最终的页面
          component: () => import('@/views/backend/tag/ListPage.vue')
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
    },
    // 匹配前面所有没有被名字的路由, 都指向404页面 /*
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/common/NotFound.vue')
    }
  ]
})

export default router
