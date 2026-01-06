package token_test

import (
	"testing"
	"time"

	"gitlab.com/go-course-project/go15/vblog/apps/token"
	"gitlab.com/go-course-project/go15/vblog/apps/user"
)

func TestTokenString(t *testing.T) {
	tk := token.Token{
		UserId: 1,
		Role:   user.ROLE_ADMIN,
	}

	// 失败, 退出测试
	// t.Fatal()
	// 打印数据
	t.Log(tk.String())
}

func TestTokenExired(t *testing.T) {
	now := time.Now().Unix()
	tk := token.Token{
		UserId:               1,
		Role:                 user.ROLE_ADMIN,
		AccessTokenExpiredAt: 1,
		CreatedAt:            now,
	}

	// 失败, 退出测试
	// t.Fatal()
	// 打印数据
	t.Log(tk.AccessTokenIsExpired())
}
