package token

import (
	"net/http"

	"gitlab.com/go-course-project/go15/vblog/exception"
)

var (
	ErrUnauthorized        = exception.NewApiException(50000, "请登录").WithHttpCode(http.StatusUnauthorized)
	ErrAuthFailed          = exception.NewApiException(50001, "用户名或者密码不正确").WithHttpCode(http.StatusUnauthorized)
	ErrAccessTokenExpired  = exception.NewApiException(50002, "AccessToken过期")
	ErrRefreshTokenExpired = exception.NewApiException(50003, "RefreshToken过期")
	ErrPermissionDeny      = exception.NewApiException(50004, "当前角色无权限访问该接口").WithHttpCode(http.StatusForbidden)
)
