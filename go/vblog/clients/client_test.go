package clients_test

import (
	"context"
	"testing"

	"gitlab.com/go-course-project/go15/vblog/apps/blog"
	"gitlab.com/go-course-project/go15/vblog/clients"
)

// clients: QueryBlog
// impl:  QueryBlog
// Restful 调用 用作RPC:  JSON ON HTTP
// client: 就是vblog这个服务的 SDK, 给其他服务使用
func TestQueryUser(t *testing.T) {
	client := clients.NewClient("http://127.0.0.1:8080")
	if err := client.Auth("admin", "123456"); err != nil {
		t.Fatal(err)
	}

	client.Debug(false)

	set, err := client.QueryBlog(context.TODO(), blog.NewQueryBlogRequest())
	if err != nil {
		t.Fatal(err)
	}
	t.Log(set)
}
