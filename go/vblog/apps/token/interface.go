package token

import "context"

const (
	AppName = "token"
)

type Service interface {
	// 令牌颁发
	// 1. 调用user模块来校验用户密码
	// 2. ...
	IssueToken(context.Context, *IssueTokenRequest) (*Token, error)

	// 令牌撤销
	// 删除令牌
	RevolkToken(context.Context, *RevolkTokenRequest) (*Token, error)

	// 令牌校验, 校验令牌合法性
	// 检查令牌是否是我们颁发(我们存数据)
	// 判断令牌是否过期
	ValidateToken(context.Context, *ValidateTokenRequest) (*Token, error)
}

func NewIssueTokenRequest(username, password string) *IssueTokenRequest {
	return &IssueTokenRequest{
		Username: username,
		Password: password,
		IsMember: false,
	}
}

type IssueTokenRequest struct {
	// 用户秘密
	Username string `json:"username"`
	Password string `json:"password"`
	// 记住我
	IsMember bool `json:"is_member"`
}

func NewRevolkTokenRequest(at, rt string) *RevolkTokenRequest {
	return &RevolkTokenRequest{
		AccessToken:  at,
		RefreshToken: rt,
	}
}

type RevolkTokenRequest struct {
	// 你要撤销的令牌
	// AccessToken, RefreshToken构成了一对 username/password
	AccessToken string
	// 你需要知道正确的刷新Token
	RefreshToken string
}

func NewValidateTokenRequest(at string) *ValidateTokenRequest {
	return &ValidateTokenRequest{
		AccessToken: at,
	}
}

type ValidateTokenRequest struct {
	// 你要撤销的令牌
	// AccessToken, RefreshToken构成了一对 username/password
	AccessToken string
}
