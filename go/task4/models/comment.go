package models

import (
	"time"
)

type Comment struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Content   string    `json:"content" gorm:"not null;size:100"`
	UserId    uint      `json:"user_id" gorm:"not null"`
	PostId    uint      `json:"post_id" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
}
type CreateCommentRequest struct {
	PostId  uint   `json:"post_id" gorm:"not null"`
	Content string `json:"content" binding:"required,min=3"`
}
type GetCommentRequest struct {
	ID uint `json:"id"`
}
type CommentResponse struct {
	PostId  uint   `json:"post_id" gorm:"not null"`
	Content string `json:"content"`
}
type GetCommentsResponse struct {
	PostId  uint      `json:"post_id" gorm:"not null"`
	Comment []Comment `json:"comment"`
}
