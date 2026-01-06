package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// OPTIONS /cors HTTP/1.1
// Origin: http://api.bob.com
// Access-Control-Request-Method: PUT
// Access-Control-Request-Headers: X-Custom-Header
// Host: api.alice.com
// Accept-Language: en-US
// Connection: keep-alive
// User-Agent: Mozilla/5.0...

// Header: Access-Control-Allow-Origin, 允许的源（域)
// Header: Access-Control-Allow-Methods, 服务端 允许的方法(所有方法, 一般大于请求的该头)
// Header: Access-Control-Allow-Headers, 服务队 允许的自定义Header
// Header: Access-Control-Max-Age, 用来指定本次预检请求的有效期, 避免多次请求, 该字段可选

func CROS(ctx *gin.Context) {
	// preflight
	// AllowMethods := []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	// AllowHeaders := []string{"Origin", "Content-Length", "Content-Type"}

	h := ctx.Writer.Header()

	if ctx.Request.Method == http.MethodOptions {
		// 复杂请求: preflight
		h["Access-Control-Allow-Headers"] = []string{"Origin,Content-Length,Content-Type"}
		h["Access-Control-Allow-Methods"] = []string{"GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS"}
		h["Access-Control-Max-Age"] = []string{"43200"}
		ctx.AbortWithStatus(http.StatusNoContent)
		return
	} else {
		// 简单请求
		h["Access-Control-Allow-Origin"] = []string{"*"}
	}

	ctx.Next()
}
