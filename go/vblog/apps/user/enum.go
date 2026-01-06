package user

// 枚举定义
type Role int

const (
	ROLE_VISITOR Role = iota
	ROLE_ADMIN
	ROLE_AUTHOR
)
