package impl

import (
	"gitlab.com/go-course-project/go15/vblog/apps/blog"
	"gitlab.com/go-course-project/go15/vblog/conf"
	"gitlab.com/go-course-project/go15/vblog/ioc"
	"gorm.io/gorm"
)

func init() {
	ioc.Controller.Registry(blog.AppName, &BlogServiceImpl{})
}

// 需要资源
// 需要数据操作
type BlogServiceImpl struct {
	// db conn 共享对象
	// mysql host port  ....
	db *gorm.DB
}

func (i *BlogServiceImpl) Init() error {
	i.db = conf.C().MySQL.GetDB()
	return nil
}
