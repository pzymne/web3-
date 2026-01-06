package blog_test

import (
	"testing"

	"gitlab.com/go-course-project/go15/vblog/apps/blog"
)

func TestNewBlog(t *testing.T) {
	ins := blog.NewBlog()
	t.Log(ins.CreateBlogRequest)
}
