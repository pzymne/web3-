import client from './client'

/* 登录相关API */
export var LOGIN = (data) => {
  return client.post('/vblog/api/v1/tokens', data)
}

export var LOGOUT = (refreshToken) => {
  return client.delete('/vblog/api/v1/tokens', {
    headers: {
      'X-REFRESH-TOKEN': refreshToken
    }
  })
}

/* 文章管理API */
export var LIST_BLOG = (params) => {
  return client.get('/vblog/api/v1/blogs', { params })
}

export var GET_BLOG = (id) => {
  return client.get(`/vblog/api/v1/blogs/${id}`)
}

export var CREATE_BLOG = (data) => {
  return client.post('/vblog/api/v1/blogs', data)
}

export var UPDATE_BLOG = (id, data) => {
  return client.put(`/vblog/api/v1/blogs/${id}`, data)
}

export var DELETE_BLOG = (id) => {
  return client.delete(`/vblog/api/v1/blogs/${id}`)
}
