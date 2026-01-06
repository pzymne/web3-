package services

import (
	"TASK4/models"
	"TASK4/utils"
	"errors"

	"gorm.io/gorm"
)

type CommentService struct {
	db *gorm.DB
}

func NewCommentService(db *gorm.DB) *CommentService {
	return &CommentService{db: db}
}
func (p *CommentService) CreateComment(req models.CreateCommentRequest) (*models.Comment, error) {
	// 检查文章ID是否已存在
	var existingPost models.Post
	if err := p.db.Where("id = ?", req.PostId).First(&existingPost).Error; err != nil {
		return nil, utils.NewAppError(409, "PostTitle not exists")
	}

	// 创建评论
	comment := models.Comment{
		Content: req.Content,
		PostId:  req.PostId,
	}
	if err := p.db.Create(&comment).Error; err != nil {
		return nil, err
	}

	return &comment, nil
}
func (p *CommentService) GetCommentsOfOnePost(postID uint) (*models.Post, error) {
	var post models.Post
	if err := p.db.Preload("Comment").Where("id=?", postID).First(&post).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, utils.NewAppError(404, "Post  not found")
		}
		return nil, err
	}
	return &post, nil
}
