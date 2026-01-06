# 专门存放API请求(JS SDK)

登录API:

```
// POST /vblog/api/v1/tokens/ ---> Login
```

## axios

[axios](https://axios-http.com/zh/docs/intro)

```sh
 npm install axios
```

## 封装

```js
import client from './client'

export var LOGIN = (data) => {
  return client.post('/vblog/api/v1/tokens', data)
}

export var LOGOUT = () => {
  return client.delete('/vblog/api/v1/tokens', {})
}
```

## 使用vit代理来处理跨越问题

```js
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // string shorthand: http://localhost:5173/vblog/api/v1 -> http://127.0.0.1:8080/vblog/api/v1
      // URL请求 http://localhost:5173/vblog/api/v1, 不能再配置 baseURL
      '/vblog/api/v1': 'http://127.0.0.1:8080'
    }
  }
})
```

```js
// js端的http client
export default axios.create({
  // 因为开启了代理,  直接使用前端页面的URL地址, 由vite进行代理到后端
  baseURL: '',
  timeout: 5000
})
```

## 错误处理机制

请求正常 ==>

```
[],{}
```

请求失败 ==>

```json
{ "code": 50001, "message": "用户名或者密码不正确" }
```

```js
// 添加一个响应拦截器
client.interceptors.response.use(
  // 请求成功
  (value) => {
    // 返回成功请求后的数据
    return value.data
  },
  // 请求失败
  (err) => {
    console.log(err)
    var msg = err.message
    if (err.response && err.response.data) {
      msg = err.response.data.message
    }

    // 异常采用消息提醒
    Message.error(msg)
    return Promise.reject(err)
  }
)
```
