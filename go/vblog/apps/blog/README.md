# 博客文章管理



## 定义业务

```go
type Service interface {
	// 文章列表查询
	QueryBlog(context.Context, *QueryBlogRequest) (*BlogSet, error)

	// 文章详情
	DescribeBlog(context.Context, *DescribeBlogRequest) (*Blog, error)

	// 文章创建
	CreateBlog(context.Context, *CreateBlogRequest) (*Blog, error)

	// 文章更新
	UpdateBlog(context.Context, *UpdateBlogRequest) (*Blog, error)

	// 文章删除
	DeleteBlog(context.Context, *DeleteBlogRequest) (*Blog, error)
}
```

## 实现业务

遵循TDD编程范式

### TDD准备阶段

1. 定义业务实现:
```go
func init() {
	ioc.Controller.Registry(blog.AppName, &UserServiceImpl{})
}

// 需要资源
// 需要数据操作
type UserServiceImpl struct {
	// db conn 共享对象
	// mysql host port  ....
	db *gorm.DB
}

func (i *UserServiceImpl) Init() error {
	i.db = conf.C().MySQL.GetDB()
	return nil
}
```

2. 加载业务模块
```go
import (
	// 业务对象注册
    ...
	_ "gitlab.com/go-course-project/go15/vblog/apps/user/impl"
)
```

3. 转变测试环境初始化
```go
import (
	"github.com/spf13/cobra"
	"gitlab.com/go-course-project/go15/vblog/conf"
	"gitlab.com/go-course-project/go15/vblog/ioc"

	// 注册所有的业务模块
	_ "gitlab.com/go-course-project/go15/vblog/apps"
)

func DevelopmentSetup() {
	// 加载配置, 单元测试 通过环境变量读取, vscode 传递进来的
	if err := conf.LoadConfigFromEnv(); err != nil {
		panic(err)
	}

	// 2. 初始化Ioc
	cobra.CheckErr(ioc.Controller.Init())
	// 3. 初始化Api
	cobra.CheckErr(ioc.Api.Init())
}
```

3. 准备被测试的对象: 加载业务模块对象
```go
import (
	"context"

	"gitlab.com/go-course-project/go15/vblog/apps/blog"
	"gitlab.com/go-course-project/go15/vblog/ioc"

	// 到入被测试的对象, 全部倒入
	_ "gitlab.com/go-course-project/go15/vblog/apps"
)

var (
	// 声明被测试的对象
	serviceImpl blog.Service
	ctx         = context.Background()
)

// 被测试对象
func init() {
    test.DevelopmentSetup()
	serviceImpl = ioc.Controller.Get(blog.AppName).(blog.Service)
}
```

4.  编写单元测试:
```go

func TestCreateUser(t *testing.T) {
	req := blog.NewCreateBlogRequest()
	ins, err := serviceImpl.CreateBlog(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ins)
}
```

### TDD 业务开发阶段


## 实现接口

- 博客创建接口 CreateBlog: POST /vblog/api/v1/blogs
- 博客列表接口 Blog: GET /vblog/api/v1/blogs?page_size=10&page_number=1&....
- 博客全量修改接口 Blog: PUT /vblog/api/v1/blogs/{id}
- 博客增量修改接口 Blog: PATCH /vblog/api/v1/blogs/{id}
- 博客删除修改接口 Blog: DELETE /vblog/api/v1/blogs/{id}


## 托管给Ioc



## 测试使用