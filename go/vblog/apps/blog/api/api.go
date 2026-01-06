package api

import (
	"gitlab.com/go-course-project/go15/vblog/apps/blog"
	"gitlab.com/go-course-project/go15/vblog/conf"
	"gitlab.com/go-course-project/go15/vblog/ioc"
)

func init() {
	ioc.Api.Registry(blog.AppName, &BlogApiHandler{})
}

// 核心就是出来 API请求
// 没有为这个对象写单元测试: BlogApiHandler
// POST 启动后 进行测试(Debug): 进程Debug
type BlogApiHandler struct {
	svc blog.Service
}

func (h *BlogApiHandler) Init() error {
	h.svc = ioc.Controller.Get(blog.AppName).(blog.Service)

	// 把自己注册到Root Router
	// /vblog/v1/ 前置
	subRouter := conf.C().Application.GinRootRouter().Group("blogs")
	h.Registry(subRouter)
	return nil
}
