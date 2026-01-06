package services

import (
	"TASK4/models"
	"TASK4/utils"
	"errors"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PostService struct {
	db *gorm.DB
}

func NewPostService(db *gorm.DB) *PostService {
	return &PostService{db: db}
}
func (p *PostService) CreatePost(req models.CreatePostRequest) (*models.Post, error) {
	// 检查文章标题是否已存在
	var existingPost models.Post
	if err := p.db.Where("postname = ?", req.PostTitle).First(&existingPost).Error; err == nil {
		return nil, utils.NewAppError(409, "PostTitle already exists")
	}

	// 创建文章
	post := models.Post{
		Title:   req.PostTitle,
		Content: req.Content,
	}
	if err := p.db.Create(&post).Error; err != nil {
		return nil, err
	}

	return &post, nil
}
func (p *PostService) GetPostProfile() ([]models.Post, error) {
	var posts []models.Post
	if err := p.db.Find(&posts).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, utils.NewAppError(404, "Post not found")
		}
		return nil, err
	}
	return posts, nil
}
func (p *PostService) GetPostProfileOne(postID uint) (*models.Post, error) {
	var post models.Post
	if err := p.db.Preload("User").Where("id=?", postID).First(&post).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, utils.NewAppError(404, "Post not found")
		}
		return nil, err
	}
	return &post, nil
}

func (s *PostService) UpdatePost(c *gin.Context, req models.UpdatePostRequest) (*models.Post, error) {
	userID, exists := c.Get("userID")
	if !exists {

		return nil, utils.NewAppError(404, "error userID is not exist")
	}

	post, err := s.GetPostProfileOne(req.ID)
	if err != nil {
		return nil, err
	}
	if userID != post.UserID {
		return nil, utils.NewAppError(404, "request user id is not qual UserID")
	}
	// 如果更新内容，检查是否已存在并且与请求的content是否相等
	if req.Content != "" && req.Content != post.Content {
		// var existingPost models.Post
		// if err := s.db.Where("content = ?", req.Content).First(&existingPost).Error; err == nil {
		// 	return nil, utils.NewAppError(409, "Email already exists")
		// }
		post.Content = req.Content
	}

	if err := s.db.Save(post).Error; err != nil {
		return nil, err
	}

	return post, nil
}
