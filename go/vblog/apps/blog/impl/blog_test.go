package impl_test

import (
	"testing"

	"gitlab.com/go-course-project/go15/vblog/apps/blog"
	"gitlab.com/go-course-project/go15/vblog/common"
)

func TestCreateUser(t *testing.T) {
	req := blog.NewCreateBlogRequest()
	req.Title = "Go全站开发"
	req.Author = "will"
	req.Content = "Md内容填充"
	req.Summary = "文章概要信息"
	ins, err := serviceImpl.CreateBlog(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}

func TestQueryBlog(t *testing.T) {
	req := blog.NewQueryBlogRequest()
	ins, err := serviceImpl.QueryBlog(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}

func TestDescribeBlog(t *testing.T) {
	req := blog.NewDescribeBlogRequest("1")
	ins, err := serviceImpl.DescribeBlog(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}

// UPDATE `blogs` SET `created_at`=1717832260,`updated_at`=1717837066,`title`='更新后文章标题',`author`='will',`content`='Md内容填充',`summary`='文章概要信息',`tags`='{}' WHERE `id` = 1
func TestPatchUpdateBlog(t *testing.T) {
	req := blog.NewUpdateBlogRequest("1")
	req.UpdateMode = common.UPDATE_MODE_PATCH
	req.Title = "更新后文章标题"
	ins, err := serviceImpl.UpdateBlog(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}

// UPDATE `blogs` SET `created_at`=1717832260,`updated_at`=1717837436,`title`='更新后文章标题PUT',`author`='patch',`content`='patch',`summary`=”,`create_by`=”,`tags`='{}',`published_at`=0,`status`=0 WHERE `id` = 1
func TestPutUpdateBlog(t *testing.T) {
	req := blog.NewUpdateBlogRequest("1")
	req.UpdateMode = common.UPDATE_MODE_PUT
	req.Title = "更新后文章标题PUT"
	req.Author = "patch"
	req.Content = "patch"
	ins, err := serviceImpl.UpdateBlog(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}

// UPDATE `blogs` SET `published_at`=1717838875,`status`=1 WHERE id = '1'
func TestUpdateBlogStatus(t *testing.T) {
	req := blog.NewUpdateBlogStatusRequest("2")
	req.SetStatus(blog.STATUS_PUBLISH)
	ins, err := serviceImpl.UpdateBlogStatus(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}

// DELETE FROM `blogs` WHERE id = '1'
func TestDeleteBlog(t *testing.T) {
	req := blog.NewDeleteBlogRequest("1")
	ins, err := serviceImpl.DeleteBlog(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}
