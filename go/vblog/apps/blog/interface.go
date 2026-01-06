package blog

import (
	"context"

	"gitlab.com/go-course-project/go15/vblog/common"
)

const (
	AppName = "blogs"
)

// func test(a int ,b string)
// pkg.test(a, b)
//

type Service interface {
	// 文章列表查询
	QueryBlog(context.Context, *QueryBlogRequest) (*BlogSet, error)

	// 文章详情
	DescribeBlog(context.Context, *DescribeBlogRequest) (*Blog, error)

	// 文章创建
	CreateBlog(context.Context, *CreateBlogRequest) (*Blog, error)

	// 文章更新
	UpdateBlog(context.Context, *UpdateBlogRequest) (*Blog, error)

	// 文章发布
	UpdateBlogStatus(context.Context, *UpdateBlogStatusRequest) (*Blog, error)

	// 文章删除
	DeleteBlog(context.Context, *DeleteBlogRequest) (*Blog, error)
}

func NewUpdateBlogStatusRequest(bid string) *UpdateBlogStatusRequest {
	return &UpdateBlogStatusRequest{
		BlogId:                   bid,
		ChangedBlogStatusRequest: &ChangedBlogStatusRequest{},
	}
}

type UpdateBlogStatusRequest struct {
	BlogId string
	*ChangedBlogStatusRequest
}

func NewQueryBlogRequest() *QueryBlogRequest {
	return &QueryBlogRequest{
		PageRequest: common.NewPageRequest(),
	}
}

type QueryBlogRequest struct {
	*common.PageRequest

	// 关键词参数, 根据文章名称进行模糊搜索
	KeyWords string `json:"keywords"`

	// 状态过滤, 0/1, nil
	Status *Status `json:"status"`
}

func (c *QueryBlogRequest) SetStatus(v Status) {
	c.Status = &v
}

func NewDescribeBlogRequest(id string) *DescribeBlogRequest {
	return &DescribeBlogRequest{
		BlogId: id,
	}
}

type DescribeBlogRequest struct {
	BlogId string `json:"blog_id"`
}

func NewUpdateBlogRequest(blogId string) *UpdateBlogRequest {
	return &UpdateBlogRequest{
		BlogId:            blogId,
		UpdateMode:        common.UPDATE_MODE_PUT,
		CreateBlogRequest: NewCreateBlogRequest(),
	}
}

func (req *UpdateBlogRequest) Validate() error {
	return common.Validate(req)
}

type UpdateBlogRequest struct {
	// 博客Id
	BlogId string `json:"blog_id" validate:"required"`
	// 更新模型 全量/部分更新
	UpdateMode common.UPDATE_MODE `json:"update_mode"`
	// 需要更新数据
	*CreateBlogRequest `validate:"required"`
}

func NewDeleteBlogRequest(id string) *DeleteBlogRequest {
	return &DeleteBlogRequest{
		BlogId: id,
	}
}

type DeleteBlogRequest struct {
	BlogId string `json:"blog_id"`
}
