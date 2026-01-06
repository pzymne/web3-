package api

import (
	"github.com/gin-gonic/gin"
	"gitlab.com/go-course-project/go15/vblog/apps/blog"
	"gitlab.com/go-course-project/go15/vblog/apps/token"
	"gitlab.com/go-course-project/go15/vblog/apps/user"
	"gitlab.com/go-course-project/go15/vblog/common"
	"gitlab.com/go-course-project/go15/vblog/exception"
	"gitlab.com/go-course-project/go15/vblog/ioc"
	"gitlab.com/go-course-project/go15/vblog/middleware"
	"gitlab.com/go-course-project/go15/vblog/response"
)

func (h *BlogApiHandler) Registry(appRouter gin.IRouter) {
	// 不需要鉴权，公开访问
	appRouter.GET("/", h.QueryBlog)
	appRouter.GET("/:id", h.DescribeBlog)

	// 修改变更需要认证
	appRouter.Use(middleware.Auth)
	appRouter.POST("/", middleware.RequireRole(user.ROLE_AUTHOR), h.CreateBlog)
	appRouter.PUT("/:id", middleware.RequireRole(user.ROLE_AUTHOR), h.PutUpdateBlog)
	appRouter.PATCH("/:id", middleware.RequireRole(user.ROLE_AUTHOR), h.PatchUpdateBlog)
	appRouter.POST("/:id/status", middleware.RequireRole(user.ROLE_AUTHOR), h.UpdateBlogStatus)
	appRouter.DELETE("/:id", middleware.RequireRole(user.ROLE_AUTHOR), h.DeleteBlog)
}

// func (h *BlogApiHandler) auth(ctx *gin.Context) bool {
// 	// 补充坚强逻辑
// 	tk, _ := ctx.Cookie(token.COOKIE_TOKEY_KEY)
// 	ioc.Controller.
// 		Get(token.AppName).(token.Service).
// 		ValidateToken(ctx.Request.Context(), token.NewValidateTokenRequest(tk))

// 	return true
// }

// - 博客列表接口 Blog: GET /vblog/api/v1/blogs?page_size=10&page_number=1&....
func (h *BlogApiHandler) QueryBlog(ctx *gin.Context) {
	// if !h.auth(ctx) {
	// 	return
	// }

	// 获取 用户请求
	req := blog.NewQueryBlogRequest()
	req.PageRequest = common.NewPageRequestFromGinCtx(ctx)
	req.KeyWords = ctx.Query("keywords")

	// 业务处理
	set, err := h.svc.QueryBlog(ctx.Request.Context(), req)
	if err != nil {
		response.Failed(err, ctx)
		return
	}

	// 返回结果
	response.Success(set, ctx)
}

// - 博客列表详情 Blog: GET /vblog/api/v1/blogs/{id}
func (h *BlogApiHandler) DescribeBlog(ctx *gin.Context) {
	tk, _ := ctx.Cookie(token.COOKIE_TOKEY_KEY)
	ioc.Controller.
		Get(token.AppName).(token.Service).
		ValidateToken(ctx.Request.Context(), token.NewValidateTokenRequest(tk))

	// 获取用户请求
	req := blog.NewDescribeBlogRequest(ctx.Param("id"))

	// 业务处理
	ins, err := h.svc.DescribeBlog(ctx.Request.Context(), req)
	if err != nil {
		response.Failed(err, ctx)
		return
	}

	// 返回结果
	response.Success(ins, ctx)
}

// @Role("admin"): Python中给予装饰器的权限判定
// - 博客创建接口 CreateBlog: POST /vblog/api/v1/blogs
func (h *BlogApiHandler) CreateBlog(ctx *gin.Context) {
	// 获取用户请求
	req := blog.NewCreateBlogRequest()
	if err := ctx.Bind(req); err != nil {
		response.Failed(exception.ErrValidateFailed(err.Error()), ctx)
		return
	}

	// 补充上下文中注入的 中间数据
	if v, ok := ctx.Get(token.GIN_TOKEN_KEY_NAME); ok {
		req.CreateBy = v.(*token.Token).UserName
		if req.Author == "" {
			req.Author = req.CreateBy
		}
	}

	// 业务处理
	ins, err := h.svc.CreateBlog(ctx.Request.Context(), req)
	if err != nil {
		response.Failed(err, ctx)
		return
	}

	// 返回结果
	response.Success(ins, ctx)
}

// - 博客全量修改接口 Blog: PUT /vblog/api/v1/blogs/{id}
func (h *BlogApiHandler) PutUpdateBlog(ctx *gin.Context) {
	// 获取用户请求
	req := blog.NewUpdateBlogRequest(ctx.Param("id"))
	req.UpdateMode = common.UPDATE_MODE_PUT

	if err := ctx.Bind(req.CreateBlogRequest); err != nil {
		response.Failed(exception.ErrValidateFailed(err.Error()), ctx)
		return
	}

	// 业务处理
	ins, err := h.svc.UpdateBlog(ctx, req)
	if err != nil {
		response.Failed(err, ctx)
		return
	}

	// 返回结果
	response.Success(ins, ctx)
}

// - 博客增量修改接口 Blog: PATCH /vblog/api/v1/blogs/{id}
func (h *BlogApiHandler) PatchUpdateBlog(ctx *gin.Context) {
	// 获取用户请求
	req := blog.NewUpdateBlogRequest(ctx.Param("id"))
	req.UpdateMode = common.UPDATE_MODE_PATCH

	// body
	if err := ctx.Bind(req.CreateBlogRequest); err != nil {
		response.Failed(exception.ErrValidateFailed(err.Error()), ctx)
		return
	}

	// 业务处理
	ins, err := h.svc.UpdateBlog(ctx, req)
	if err != nil {
		response.Failed(err, ctx)
		return
	}

	// 返回结果
	response.Success(ins, ctx)
}

// - 博客删除修改接口 Blog: POST /vblog/api/v1/blogs/{id}/status
func (h *BlogApiHandler) UpdateBlogStatus(ctx *gin.Context) {
	// 获取用户请求
	req := blog.NewUpdateBlogStatusRequest(ctx.Param("id"))

	// body
	if err := ctx.Bind(req.ChangedBlogStatusRequest); err != nil {
		response.Failed(exception.ErrValidateFailed(err.Error()), ctx)
		return
	}

	// 业务处理
	ins, err := h.svc.UpdateBlogStatus(ctx.Request.Context(), req)
	if err != nil {
		response.Failed(err, ctx)
		return
	}

	// 返回结果
	response.Success(ins, ctx)
}

// - 博客删除修改接口 Blog: DELETE /vblog/api/v1/blogs/{id}
func (h *BlogApiHandler) DeleteBlog(ctx *gin.Context) {
	// 获取用户请求
	req := blog.NewDeleteBlogRequest(ctx.Param("id"))

	// 业务处理
	ins, err := h.svc.DeleteBlog(ctx.Request.Context(), req)
	if err != nil {
		response.Failed(err, ctx)
		return
	}

	// 返回结果
	response.Success(ins, ctx)
}
