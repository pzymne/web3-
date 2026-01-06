package handlers

import (
	"github.com/gin-gonic/gin"

	"TASK4/models"
	"TASK4/services"
	"TASK4/utils"
)

type PostHandler struct {
	postService *services.PostService
	jwtSecret   []byte
}

func NewPostHandler(postService *services.PostService, jwtSecret []byte) *PostHandler {
	return &PostHandler{
		postService: postService,
		jwtSecret:   jwtSecret,
	}
}

func (h *PostHandler) CreatePost(c *gin.Context) {
	var req models.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, parseValidationErrors(err))
		return
	}

	post, err := h.postService.CreatePost(req)
	if err != nil {
		utils.HandleError(c, err)
		return
	}

	utils.Success(c, models.PostResponse{
		PostTitle: post.Title,
		Content:   post.Content,
	})
}
func (h *PostHandler) GetPostProfile(c *gin.Context) {

	posts, err := h.postService.GetPostProfile()
	if err != nil {
		utils.HandleError(c, err)
		return
	}
	// 1. 准备响应数据切片
	var responses []models.PostResponse
	// 2. 遍历转换数据（不在循环内发送响应）
	for _, post := range posts {
		responses = append(responses, models.PostResponse{
			PostTitle: post.Title,
			Content:   post.Content,
		})
	}

	utils.Success(c, gin.H{
		"posts": responses,
		"total": len(responses),
	})

}
func (h *PostHandler) GetPostProfileOne(c *gin.Context) {
	var req *models.GetPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, parseValidationErrors(err))
		return
	}

	post, err := h.postService.GetPostProfileOne(req.ID)
	if err != nil {
		utils.HandleError(c, err)
		return
	}

	utils.Success(c, models.Post{
		ID:        post.ID,
		Title:     post.Title,
		Content:   post.Content,
		UserID:    post.UserID,
		CreatedAt: post.CreatedAt,

		User: post.User,
	})
}
func (h *PostHandler) UpdateProfileOne(c *gin.Context) {

	var req models.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, parseValidationErrors(err))
		return
	}

	post, err := h.postService.UpdatePost(c, req)
	if err != nil {
		utils.HandleError(c, err)
		return
	}

	utils.Success(c, models.PostResponse{
		PostTitle: post.Title,
		Content:   post.Content,
	})
}
