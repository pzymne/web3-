# 使用Localstorage 做应用状态管理

## vueuse useStroage

```
npm i @vueuse/core
```

```js
import { useStorage } from '@vueuse/core'

const initalState = {
  token: undefined
}

// bind object
export default useStorage('vblog', initalState, localStorage, {
  mergeDefaults: true
})
```

```json
{
  "user_id": 2,
  "username": "admin",
  "access_token": "cqdok7puevgi035j9r1g",
  "access_token_expired_at": 3600,
  "refresh_token": "cqdok7puevgi035j9r20",
  "refresh_token_expired_at": 14400,
  "created_at": 1721469471,
  "updated_at": 1721469471,
  "role": 0
}
```

```
app.token.refresh_token
app.token.user_id
```
