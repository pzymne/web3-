package models

import (
	"time"
)

type Post struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title" gorm:"uniqueIndex;not null;size:50"`
	Content   string    `json:"content" gorm:"uniqueIndex;not null;size:100"`
	UserID    uint      `json:"user_id" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User    User      `gorm:"foreignKey:UserID" json:"user"` // 作者（一对一）
	Comment []Comment `gorm:"foreignKey:PostId" json:"comment"`
}
type CreatePostRequest struct {
	PostTitle string `json:"post_title" binding:"required,min=3,max=20"`
	Content   string `json:"content" binding:"required,min=3"`
}
type GetPostRequest struct {
	ID uint `json:"id"`
}
type UpdatePostRequest struct {
	PostTitle string `json:"post_title" binding:"required,min=3,max=20"`
	Content   string `json:"content" binding:"required,min=3"`
	ID        uint   `json:"id"`
}
type PostResponse struct {
	PostTitle string `json:"post_title"`
	Content   string `json:"content"`
}
