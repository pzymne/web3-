package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	//"gorm.io/driver/sqlite"
	// 替换 gorm.io/driver/sqlite
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"TASK4/config"
	"TASK4/handlers"
	"TASK4/middleware"
	"TASK4/models"
	"TASK4/services"
	"TASK4/utils"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	// db, err := gorm.Open(sqlite.Open("users.db"), &gorm.Config{})
	// if err != nil {
	// 	log.Fatalf("Failed to connect database: %v", err)
	// }

	// MySQL 连接字符串格式：
	// "user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Database.Username, cfg.Database.Password, cfg.Database.Host, cfg.Database.Port, cfg.Database.DBName)

	// 打开数据库连接
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}

	log.Println("数据库连接成功!")

	// 自动迁移
	if err := db.AutoMigrate(&models.User{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	if err := db.AutoMigrate(&models.Post{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	if err := db.AutoMigrate(&models.Comment{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// 初始化服务
	userService := services.NewUserService(db)
	userHandler := handlers.NewUserHandler(userService, []byte(cfg.JWT.Secret))
	postService := services.NewPostService(db)
	postHandler := handlers.NewPostHandler(postService, []byte(cfg.JWT.Secret))
	commentService := services.NewCommentService(db)
	commentHandler := handlers.NewCommentHandler(commentService, []byte(cfg.JWT.Secret))

	// 创建 Gin 引擎
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.Logger())
	r.Use(middleware.CORS())

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		utils.Success(c, gin.H{
			"status": "ok",
		})
	})

	// 公开路由
	public := r.Group("/api/v1")
	{
		public.POST("/users/register", userHandler.Register)
		public.POST("/users/login", userHandler.Login)
		public.GET("/posts/postlists", postHandler.GetPostProfile)
		public.GET("/posts/onepost", postHandler.GetPostProfileOne)
		public.GET("/comments/onepost", commentHandler.GetCommentsOfOnePost)
	}

	// 需要认证的路由
	protected := r.Group("/api/v1")
	protected.Use(middleware.Auth([]byte(cfg.JWT.Secret)))
	{
		protected.GET("/users/me", userHandler.GetProfile)
		protected.PUT("/users/me", userHandler.UpdateProfile)

		protected.POST("/posts/create", postHandler.CreatePost)
		protected.PUT("/posts/updateone", postHandler.UpdateProfileOne)

		protected.POST("/comments/create", commentHandler.CreateComment)
	}

	// 启动服务器
	addr := cfg.Server.Host + ":" + cfg.Server.Port
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
