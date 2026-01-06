package impl_test

import (
	"context"
	"crypto/md5"
	"fmt"
	"testing"

	"gitlab.com/go-course-project/go15/vblog/apps/user"
	"gitlab.com/go-course-project/go15/vblog/ioc"
	"gitlab.com/go-course-project/go15/vblog/test"
	"golang.org/x/crypto/bcrypt"
)

var (
	// 声明被测试的对象
	serviceImpl user.Service
	ctx         = context.Background()
)

// 招到对象
func init() {
	// 初始化单测环境
	test.DevelopmentSetup()

	// 使用构造函数
	// serviceImpl = impl.NewUserServiceImpl()
	serviceImpl = ioc.Controller.Get(user.AppName).(user.Service)
}

// 用户创建
// 1. 用户取消了请求怎么办?
// 2. 后面要做Trace, Trace ID怎么传递进来
// 3. 多个接口 需要做事务(Session), 这个事务对象怎么传递进来
// 4. CreateUser(username, password string)
//    CreateUser(username, password string, labels map[string]string)
// 能不能放到 Request里面定义
// CreateUser(context.Context, *CreateUserRequest) (*User, error)
// // 用户查询
// // 总统有多个
// QueryUser(context.Context, *QueryUserRequest) (*UserSet, error)

// 没有单元测试怎么调试 main { serviceImpl.CreateUser }
func TestCreateVisitorUser(t *testing.T) {
	req := user.NewCreateUserRequest()
	req.Username = "visitor"
	req.Password = "123456"
	req.Role = user.ROLE_VISITOR
	ins, err := serviceImpl.CreateUser(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}

func TestCreateAuthorUser(t *testing.T) {
	req := user.NewCreateUserRequest()
	req.Username = "author"
	req.Password = "123456"
	req.Role = user.ROLE_AUTHOR
	ins, err := serviceImpl.CreateUser(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}

func TestQueryUser(t *testing.T) {
	req := user.NewQueryUserRequest()
	ins, err := serviceImpl.QueryUser(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}

func TestMd5(t *testing.T) {
	h := md5.New()
	h.Write([]byte("123456"))
	fmt.Printf("%x", h.Sum(nil))
}

// $2a$14$pME0GgcoFvgTOyC7sL81VeKOwZ6O1M1gAvSXQEbs.rfC5JoQafsaW
// $2a$14$Pi0m.tNlF8Cd7LGKI.Hpb.OXAk0J1o7KNW7eOq3RBc4gwBOnFjwEa
// $2a$14$ZarejWmFibFhNHkvVxitrOyNsRwTpeQsCFQuiOSx3SL4yHjFf5yAa
func TestPasswordHash(t *testing.T) {
	password := "secret"
	hash, _ := HashPassword(password) // ignore error for the sake of simplicity

	fmt.Println("Password:", password)
	fmt.Println("Hash:    ", hash)

	match := CheckPasswordHash(password, hash)
	fmt.Println("Match:   ", match)
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func TestUserCheckPassword(t *testing.T) {
	req := user.NewCreateUserRequest()
	req.Username = "admin"
	req.Password = "123456"
	u := user.NewUser(req)

	u.HashPassword()
	t.Log(u.CheckPassword("1234561"))
}
