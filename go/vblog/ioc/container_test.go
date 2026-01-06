package ioc_test

import (
	"testing"

	user "gitlab.com/go-course-project/go15/vblog/apps/user/impl"
	"gitlab.com/go-course-project/go15/vblog/ioc"
)

func TestRegistry(t *testing.T) {
	ioc.Controller.Registry("user", &user.UserServiceImpl{})

	// 0x140000b6708
	t.Logf("%p", ioc.Controller.Get("user"))
}
