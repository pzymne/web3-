package handlers

import (
	"github.com/gin-gonic/gin"

	"TASK4/models"
	"TASK4/services"
	"TASK4/utils"
)

type CommentHandler struct {
	commentService *services.CommentService
	jwtSecret      []byte
}

func NewCommentHandler(commentService *services.CommentService, jwtSecret []byte) *CommentHandler {
	return &CommentHandler{
		commentService: commentService,
		jwtSecret:      jwtSecret,
	}
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	var req models.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, parseValidationErrors(err))
		return
	}

	comment, err := h.commentService.CreateComment(req)
	if err != nil {
		utils.HandleError(c, err)
		return
	}

	utils.Success(c, models.CommentResponse{
		PostId:  comment.PostId,
		Content: comment.Content,
	})
}
func (h *CommentHandler) GetCommentsOfOnePost(c *gin.Context) {
	var req *models.GetCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, parseValidationErrors(err))
		return
	}

	post, err := h.commentService.GetCommentsOfOnePost(req.ID)
	if err != nil {
		utils.HandleError(c, err)
		return
	}

	utils.Success(c, models.GetCommentsResponse{
		PostId:  post.ID,
		Comment: post.Comment,
	})
}
