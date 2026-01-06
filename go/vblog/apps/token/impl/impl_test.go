package impl_test

import (
	"context"
	"testing"

	"gitlab.com/go-course-project/go15/vblog/apps/token"
	"gitlab.com/go-course-project/go15/vblog/ioc"
	"gitlab.com/go-course-project/go15/vblog/test"
)

var (
	// 声明被测试的对象
	serviceImpl token.Service
	ctx         = context.Background()
)

// 招到对象
func init() {
	// 初始化单测环境
	test.DevelopmentSetup()

	// 使用构造函数
	// serviceImpl = impl.NewTokenServiceImpl(user.NewUserServiceImpl())

	// 去ioc 中获取 被测试的业务对象
	serviceImpl = ioc.Controller.Get(token.AppName).(token.Service)
}

func TestIssueToken(t *testing.T) {
	req := token.NewIssueTokenRequest("admin", "123456")
	tk, err := serviceImpl.IssueToken(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(tk)
}

func TestRevolkToken(t *testing.T) {
	req := token.NewRevolkTokenRequest("cpdutq197i6bgqoevclg", "cpdutq197i6bgqoevcm0")
	tk, err := serviceImpl.RevolkToken(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(tk)
}

func TestValidateToken(t *testing.T) {
	req := token.NewValidateTokenRequest("cpduaoh97i68rbsc3mqg")
	tk, err := serviceImpl.ValidateToken(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(tk)
}
