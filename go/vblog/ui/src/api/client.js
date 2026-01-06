import axios from 'axios'
import { Message } from '@arco-design/web-vue'

// js端的http client
var client = axios.create({
  // 因为开启了代理,  直接使用前端页面的URL地址, 由vite进行代理到后端
  baseURL: '',
  timeout: 5000
})

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
    var code = 0
    if (err.response && err.response.data) {
      msg = err.response.data.message
      code = err.response.data.code
    }

    // 业务异常特殊处理
    // 用户的Token失效，或者被撤销,
    switch (code) {
      case 5000:
        // https://arco.design/vue/component/modal
        // import { h } from 'vue'
        // import { Modal, Button } from '@arco-design/web-vue'

        // const ModalContent = {
        //   setup() {
        //     const onClick = () => {
        //       Modal.info({
        //         title: 'Info Title',
        //         content: 'This is an nest info message'
        //       })
        //     }

        //     return () =>
        //       h('div', { class: 'info-modal-content' }, [
        //         h('span', { style: 'margin-bottom: 10px;' }, 'This is an info message'),
        //         h(Button, { size: 'mini', onClick }, 'Open Nest Modal')
        //       ])
        //   }
        // }
        // 这个不是一个vue组件, 也不是一个vue hook, 当前就是一个和vue没有关系的js库
        location.assign('/login')
        break
      case 5002:
        location.assign('/login')
        break
      case 5003:
        location.assign('/login')
        break
    }

    // 异常采用消息提醒
    Message.error(msg)
    return Promise.reject(err)
  }
)

export default client
