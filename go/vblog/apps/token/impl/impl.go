package impl

import (
	"context"
	"fmt"

	"gitlab.com/go-course-project/go15/vblog/apps/token"
	"gitlab.com/go-course-project/go15/vblog/apps/user"
	"gitlab.com/go-course-project/go15/vblog/conf"
	"gitlab.com/go-course-project/go15/vblog/exception"
	"gitlab.com/go-course-project/go15/vblog/ioc"
	"gorm.io/gorm"
)

// func NewTokenServiceImpl(userServiceImpl user.Service) *TokenServiceImpl {
// 	// 每个业务对象, 都可能依赖到 数据库
// 	// db = create conn
// 	// 获取一个全新的 mysql 连接池对象
// 	// 程序启动的时候一定要加载配置
// 	return &TokenServiceImpl{
// 		db:   conf.C().MySQL.GetDB(),
// 		user: userServiceImpl,
// 	}
// }

// import _ ---> init方法来注册 包里面的核心对象
func init() {
	ioc.Controller.Registry(token.AppName, &TokenServiceImpl{})
}

type TokenServiceImpl struct {
	// db conn 共享对象
	// mysql host port  ....
	db *gorm.DB

	// 依赖用户服务
	user user.Service
}

func (i *TokenServiceImpl) Init() error {
	// 	return &TokenServiceImpl{
	// 		db:   conf.C().MySQL.GetDB(),
	// 		user: userServiceImpl,
	// 	}
	i.db = conf.C().MySQL.GetDB()
	// 获取对象 Controller.Get(user.AppName)
	// 断言对象实现了user.Service
	i.user = ioc.Controller.Get(user.AppName).(user.Service)
	return nil
}

// 令牌颁发
func (i *TokenServiceImpl) IssueToken(ctx context.Context, in *token.IssueTokenRequest) (*token.Token, error) {
	// 1. 查询用户对象
	// i.QueryUser 是调用的user.Service的接口吗？
	queryUser := user.NewQueryUserRequest()
	queryUser.Username = in.Username
	us, err := i.user.QueryUser(ctx, queryUser)
	if err != nil {
		return nil, err
	}

	if len(us.Items) == 0 {
		// 安全: 避免被爆破
		return nil, token.ErrAuthFailed
	}

	// 2. 比对用户密码
	u := us.Items[0]
	if err := u.CheckPassword(in.Password); err != nil {
		return nil, token.ErrAuthFailed
	}

	// 3. 颁发一个令牌(token), UUID, 自己随机生成一个多少位字符串 [abacdxxxxx] rand库去挑选
	tk := token.NewToken(u)

	// 4. 把令牌存储在数据库里面
	if err := i.db.WithContext(ctx).Create(tk).Error; err != nil {
		return nil, exception.ErrServerInternal("保存保存, %s", err)
	}

	// 5. 返回令牌
	return tk, nil
}

// 令牌撤销
func (i *TokenServiceImpl) RevolkToken(
	ctx context.Context,
	in *token.RevolkTokenRequest) (
	*token.Token, error) {
	// ErrServerInternal 没有使用这个异常
	// 后面可以用中间件来统一处理: 非 ApiExcepiton ---> ErrServerInternal
	// 直接删除数据里面存储的Token

	// 1. 查询出Token, Where AccessToken来查询
	// 查询一个
	tk := token.DefaultToken()
	err := i.db.
		WithContext(ctx).
		Where("access_token = ?", in.AccessToken).
		First(tk).
		Error
	if err == gorm.ErrRecordNotFound {
		return nil, exception.ErrNotFound("Token未找到")
	}

	if tk.RefreshToken != in.RefreshToken {
		return nil, fmt.Errorf("RefreshToken不正确")
	}

	// DELETE FROM `tokens` WHERE access_token = 'cpdutq197i6bgqoevclg'
	err = i.db.
		WithContext(ctx).
		Where("access_token = ?", in.AccessToken).
		Delete(token.Token{}).
		Error
	if err != nil {
		return nil, err
	}
	return tk, nil
}

// 令牌校验, 校验令牌合法性
func (i *TokenServiceImpl) ValidateToken(
	ctx context.Context,
	in *token.ValidateTokenRequest) (
	*token.Token, error) {
	// 1. 查询出Token, Where AccessToken来查询
	// 查询一个
	tk := token.DefaultToken()
	err := i.db.
		WithContext(ctx).
		Where("access_token = ?", in.AccessToken).
		First(tk).
		Error
	if err == gorm.ErrRecordNotFound {
		return nil, exception.ErrNotFound("Token未找到")
	}

	if err != nil {
		return nil, exception.ErrServerInternal("查询报错, %s", err)
	}

	// 2. 判断Token是否过去, 1. 先判断RefreshToken有没有过期 2. AccessToken有没有过期
	if err := tk.RefreshTokenIsExpired(); err != nil {
		return nil, err
	}
	if err := tk.AccessTokenIsExpired(); err != nil {
		return nil, err
	}

	// 3. Token合法: 1. 是我颁发, 2. 没有过期
	// 返回查询到的Token

	// 4. 补充用户角色信息
	queryUserReq := user.NewQueryUserRequest()
	queryUserReq.Username = tk.UserName
	us, err := i.user.QueryUser(ctx, queryUserReq)
	if err != nil {
		return nil, err
	}
	if len(us.Items) == 0 {
		return nil, fmt.Errorf("token user not found")
	}
	tk.Role = us.Items[0].Role
	return tk, nil
}
