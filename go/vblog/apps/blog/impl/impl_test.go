package impl_test

import (
	"context"

	"gitlab.com/go-course-project/go15/vblog/apps/blog"
	"gitlab.com/go-course-project/go15/vblog/ioc"
	"gitlab.com/go-course-project/go15/vblog/test"

	// 到入被测试的对象, 全部倒入
	_ "gitlab.com/go-course-project/go15/vblog/apps"
)

var (
	// 声明被测试的对象
	serviceImpl blog.Service
	ctx         = context.Background()
)

// 被测试对象
func init() {
	test.DevelopmentSetup()
	serviceImpl = ioc.Controller.Get(blog.AppName).(blog.Service)
}
