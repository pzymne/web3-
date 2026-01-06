package blog

import (
	"encoding/json"
	"time"

	"gitlab.com/go-course-project/go15/vblog/common"
)

func NewBlogSet() *BlogSet {
	return &BlogSet{
		Items: []*Blog{},
	}
}

type BlogSet struct {
	Total int64   `json:"total"`
	Items []*Blog `json:"item"`
}

func (req *BlogSet) String() string {
	dj, _ := json.MarshalIndent(req, "", "	")
	return string(dj)
}

// 构造函数, 对对象进行初始化, 统一对对象的初始者进行管理,
// 保证构造的对象 是可用的, 不容易出现nil
func NewBlog() *Blog {
	return &Blog{
		common.NewMeta(),
		&CreateBlogRequest{
			Tags: map[string]string{},
		},
		NewChangedBlogStatusRequest().SetStatus(STATUS_DRAFT),
	}
}

type Blog struct {
	*common.Meta
	*CreateBlogRequest
	*ChangedBlogStatusRequest
}

func (req *Blog) String() string {
	dj, _ := json.MarshalIndent(req, "", "	")
	return string(dj)
}

func NewCreateBlogRequest() *CreateBlogRequest {
	return &CreateBlogRequest{
		Tags: map[string]string{},
	}
}

// `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文章标题',
// `author` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '作者',
// `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文章内容',
// `summary` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文章概要信息',
// `create_by` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT '创建人',
// `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '标签',
type CreateBlogRequest struct {
	// 文章标题
	Title string `json:"title" gorm:"column:title" validate:"required"`
	// 作者
	Author string `json:"author" gorm:"column:author" validate:"required"`
	// 文章内容
	Content string `json:"content" gorm:"column:content" validate:"required"`
	// 文章概要信息
	Summary string `json:"summary" gorm:"column:summary"`
	// 创建人
	CreateBy string `json:"create_by" gorm:"column:create_by"`
	// 标签 https://gorm.io/docs/serializer.html
	Tags map[string]string `json:"tags" gorm:"column:tags;serializer:json"`
}

func (req *CreateBlogRequest) Validate() error {
	return common.Validate(req)
}

func (req *CreateBlogRequest) String() string {
	dj, _ := json.MarshalIndent(req, "", "	")
	return string(dj)
}

func NewChangedBlogStatusRequest() *ChangedBlogStatusRequest {
	return &ChangedBlogStatusRequest{}
}

// 发布才能修改文章状态
// `published_at` int NOT NULL COMMENT '发布时间',
// `status` tinyint NOT NULL COMMENT '文章状态: 草稿/已发布',
type ChangedBlogStatusRequest struct {
	// 发布时间
	PublishedAt int64 `json:"published_at" gorm:"column:published_at"`
	// 文章状态: 草稿/已发布, 修改回STATUS_DRAFT
	// gorm 默认不修改零值
	Status *Status `json:"status" gorm:"column:status"`
}

func (req *ChangedBlogStatusRequest) SetStatus(s Status) *ChangedBlogStatusRequest {
	req.Status = &s
	switch *req.Status {
	case STATUS_PUBLISH:
		req.PublishedAt = time.Now().Unix()
	}

	return req
}

func (req *ChangedBlogStatusRequest) String() string {
	dj, _ := json.MarshalIndent(req, "", "	")
	return string(dj)
}
