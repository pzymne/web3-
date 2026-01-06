# SDK

给 他人使用(tools/service/...), 为了提升开发效率, 把API封装为SDK


创建用户的接口:  达到之前本地函数调用的使用体验 client.Createuser(ctx,CreateuserRequest) (User, error)
```go
package main

import (
  "fmt"
  "strings"
  "net/http"
  "io/ioutil"
)

func main() {

  url := "http://127.0.0.1:8080/vblog/api/v1/tokens"
  method := "POST"

  payload := strings.NewReader(`{
    "username": "author",
    "password": "123456"
}`)

  client := &http.Client {}
  req, err := http.NewRequest(method, url, payload)

  if err != nil {
    fmt.Println(err)
    return
  }
  req.Header.Add("Content-Type", "application/json")

  res, err := client.Do(req)
  if err != nil {
    fmt.Println(err)
    return
  }
  defer res.Body.Close()

  body, err := ioutil.ReadAll(res.Body)
  if err != nil {
    fmt.Println(err)
    return
  }
  fmt.Println(string(body))
  // 反序列花, []byte ---> obj
}
```



