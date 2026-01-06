package clients

import (
	"context"
	"fmt"

	"github.com/go-resty/resty/v2"
	"gitlab.com/go-course-project/go15/vblog/apps/blog"
	"gitlab.com/go-course-project/go15/vblog/apps/token"
	"gitlab.com/go-course-project/go15/vblog/apps/user"
)

// NewClient().Auth(username,password)
func NewClient(address string) *Client {
	// username, password --> token
	c := resty.New()
	c.BaseURL = address
	c.Header.Add("Content-Type", "application/json")
	c.OnAfterResponse(func(c *resty.Client, r *resty.Response) error {
		if r.StatusCode()/100 != 2 {
			return fmt.Errorf("resp not 2xx, %s", string(r.Body()))
		}
		return nil
	})
	return &Client{
		c: c,
	}
}

type Client struct {
	c *resty.Client
}

func (c *Client) Debug(v bool) {
	c.c.Debug = v
}

// 使用标准HTTP Client 会很繁琐, Resty: https://github.com/go-resty/resty
func (c *Client) Auth(username, password string) error {
	tk := token.DefaultToken()
	_, err := c.c.R().SetContext(context.Background()).SetBody(token.NewIssueTokenRequest(username, password)).SetResult(tk).Post("/vblog/api/v1/tokens")
	if err != nil {
		return err
	}
	c.c.SetAuthToken(tk.AccessToken)
	return nil
	// 	url := "http://127.0.0.1:8080/vblog/api/v1/tokens"
	// 	method := "POST"

	// 	payload := strings.NewReader(`{
	// 	  "username": "author",
	// 	  "password": "123456"
	//   }`)

	// 	client := &http.Client{}
	// 	req, err := http.NewRequest(method, url, payload)

	// 	if err != nil {
	// 		fmt.Println(err)
	// 		return
	// 	}
	// 	req.Header.Add("Content-Type", "application/json")

	// 	res, err := client.Do(req)
	// 	if err != nil {
	// 		fmt.Println(err)
	// 		return
	// 	}
	// 	defer res.Body.Close()

	// body, err := ioutil.ReadAll(res.Body)
	//
	//	if err != nil {
	//		fmt.Println(err)
	//		return
	//	}
	//
	// fmt.Println(string(body))
}

// Client实现了 user.Service 的接口？
// user.Service
// 用户管理接口
// 接口定义的原则:  站在调用方(使用者)的角度来设计接口
// userServiceImpl.CreateUser(ctx, *CreateUserRequest)
// 站在接口的调用方, triaceId, 其他非业务参数 他不理解
//
//	type Service interface {
//		// 用户创建
//		// 1. 用户取消了请求怎么办?
//		// 2. 后面要做Trace, Trace ID怎么传递进来
//		// 3. 多个接口 需要做事务(Session), 这个事务对象怎么传递进来
//		// 4. CreateUser(username, password string)
//		//    CreateUser(username, password string, labels map[string]string)
//		// 能不能放到 Request里面定义
//		CreateUser(context.Context, *CreateUserRequest) (*User, error)
//		// 用户查询
//		// 总统有多个
//		QueryUser(context.Context, *QueryUserRequest) (*UserSet, error)
//	}
//

// 之前依赖user.Service的对象，比如token服务，能不能直接切换到依赖 这个client？

// 无Restful接口
// us, err := i.user.QueryUser(ctx, queryUser)
func (c *Client) QueryUser(ctx context.Context, req *user.QueryUserRequest) (*user.UserSet, error) {
	set := user.NewUserSet()
	_, err := c.c.R().SetContext(ctx).SetResult(set).Post("/vblog/api/v1/users")
	if err != nil {
		return nil, err
	}
	return set, nil
}

// us, err := i.user.CreateUser(ctx, queryUser)
func (c *Client) CreateUser(ctx context.Context, req *user.QueryUserRequest) (*user.UserSet, error) {
	set := user.NewUserSet()
	_, err := c.c.R().SetContext(ctx).SetResult(set).Post("/vblog/api/v1/users")
	if err != nil {
		return nil, err
	}
	return set, nil
}

func (c *Client) QueryBlog(ctx context.Context, req *blog.QueryBlogRequest) (*blog.BlogSet, error) {
	set := blog.NewBlogSet()
	_, err := c.c.R().SetContext(ctx).SetResult(set).Get("/vblog/api/v1/blogs")

	if err != nil {
		return nil, err
	}

	return set, nil
}
