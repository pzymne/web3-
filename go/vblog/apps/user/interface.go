package user

import (
	"context"

	"gitlab.com/go-course-project/go15/vblog/common"
)

const (
	// 业务包名称, 用于托管这个业务包的业务对象 Servce的具体实现
	AppName = "user"
)

// user.Service
// 用户管理接口
// 接口定义的原则:  站在调用方(使用者)的角度来设计接口
// userServiceImpl.CreateUser(ctx, *CreateUserRequest)
// 站在接口的调用方, triaceId, 其他非业务参数 他不理解
type Service interface {
	// 用户创建
	// 1. 用户取消了请求怎么办?
	// 2. 后面要做Trace, Trace ID怎么传递进来
	// 3. 多个接口 需要做事务(Session), 这个事务对象怎么传递进来
	// 4. CreateUser(username, password string)
	//    CreateUser(username, password string, labels map[string]string)
	// 能不能放到 Request里面定义
	CreateUser(context.Context, *CreateUserRequest) (*User, error)
	// 用户查询
	// 总统有多个
	QueryUser(context.Context, *QueryUserRequest) (*UserSet, error)
}

func NewQueryUserRequest() *QueryUserRequest {
	return &QueryUserRequest{
		PageRequest: common.NewPageRequest(),
	}
}

// 什么没定义在Modle那边
type QueryUserRequest struct {
	Username string

	*common.PageRequest
}
