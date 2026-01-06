package user

import (
	"encoding/json"
	"fmt"

	"gitlab.com/go-course-project/go15/vblog/common"
	"golang.org/x/crypto/bcrypt"
)

// 存放的是PO, 需要入库的对象

// 为了避免对象内部出现很空指针, 指针对象为初始化, 为该对象提供一个构造函数
// 还能做一些相关兼容，补充默认值的功能, New+对象名称()
func NewCreateUserRequest() *CreateUserRequest {
	return &CreateUserRequest{
		Role:  ROLE_VISITOR,
		Label: map[string]string{},
	}
}

// 用户创建的参数
type CreateUserRequest struct {
	Username string `json:"username" validate:"required" gorm:"column:username"`
	Password string `json:"password" validate:"required" gorm:"column:password"`
	Role     Role   `json:"role" gorm:"column:role"`
	// https://gorm.io/docs/serializer.html
	// 用户标签 {"group": "a"} --json-> "{}"
	// 专门设计: label   id key value
	Label map[string]string `json:"label" gorm:"column:label;serializer:json"`
}

// validator
// 1. 初始化一个校验器 validator.New()
func (req *CreateUserRequest) Validate() error {
	if req.Username == "" {
		return fmt.Errorf("用户名必填")
	}

	return nil
}

func (req *CreateUserRequest) HashPassword() error {
	cryptoPass, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	req.Password = string(cryptoPass)
	return nil
}

func (req *CreateUserRequest) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(req.Password), []byte(password))
}

// 通用参数
type Meta struct {
	// 用户Id
	Id int `json:"id" gorm:"column:id"`
	// 创建时间, 时间戳 10位, 秒
	CreatedAt int64 `json:"created_at" gorm:"column:created_at"`
	// 更新时间, 时间戳 10位, 秒
	UpdatedAt int64 `json:"updated_at" gorm:"column:updated_at"`
}

// 存放 需要入口的数据结构(PO)
// 构造User对象的时候 就需要把明文密码转化为hash后的密码
func NewUser(req *CreateUserRequest) *User {
	// hash密码

	return &User{
		Meta:              common.NewMeta(),
		CreateUserRequest: req,
	}
}

// 用户创建成功后返回一个User对象
// CreatedAt 为啥没用time.Time, int64(TimeStamp), 统一标准化, 避免时区你的程序产生影响
// 在需要对时间进行展示的时候，由前端根据具体展示那个时区的时间
type User struct {
	*common.Meta

	// 用户参数
	*CreateUserRequest
}

func (req *User) String() string {
	dj, _ := json.MarshalIndent(req, "", "	")
	return string(dj)
}

func (req *User) TableName() string {
	return "users"
}

func NewUserSet() *UserSet {
	return &UserSet{
		Items: []*User{},
	}
}

// 一个对象的集合 UserCollection
type UserSet struct {
	// 总共有多个(分页,数据库里面总共)
	Total int64 `json:"total"`
	// 对象清单
	Items []*User `json:"items"`
}
