package blog

// 草稿/已发布
// Go本事并没有枚举类型
type Status int

const (
	// 草稿
	STATUS_DRAFT = iota
	// 已发布
	STATUS_PUBLISH
)
