package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gitlab.com/go-course-project/go15/vblog/exception"
)

// 成功, 怎么把 对象 -->  HTTP Reponse
func Success(data any, c *gin.Context) {
	// 其他逻辑
	// 脱敏
	// Desense()
	c.JSON(http.StatusOK, data)
}

// 成功, 怎么把 对象 -->  HTTP Reponse
// 统一返回的数据结构: ApiException
func Failed(err error, c *gin.Context) {
	// 非200 状态, 接口报错, 返回内容: ApiException对象

	httpCode := http.StatusInternalServerError
	if v, ok := err.(*exception.ApiException); ok {
		if v.HttpCode != 0 {
			httpCode = v.HttpCode
		}
	} else {
		// 非业务异常，支持转化为 指定的内部报错异常
		err = exception.ErrServerInternal(err.Error())
	}

	c.JSON(httpCode, err)
	c.Abort()
}
