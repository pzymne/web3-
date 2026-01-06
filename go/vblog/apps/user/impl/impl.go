package impl

import (
	"context"

	"gitlab.com/go-course-project/go15/vblog/apps/user"
	"gitlab.com/go-course-project/go15/vblog/common"
	"gitlab.com/go-course-project/go15/vblog/conf"
	"gitlab.com/go-course-project/go15/vblog/ioc"
	"gorm.io/gorm"
)

// func NewUserServiceImpl() *UserServiceImpl {
// 	// 每个业务对象, 都可能依赖到 数据库
// 	// db = create conn
// 	// 获取一个全新的 mysql 连接池对象
// 	// 程序启动的时候一定要加载配置
// 	return &UserServiceImpl{
// 		db: conf.C().MySQL.GetDB(),
// 	}
// }

// import _ ---> init方法来注册 包里面的核心对象
func init() {
	ioc.Controller.Registry(user.AppName, &UserServiceImpl{})
}

// 需要资源
// 需要数据操作
type UserServiceImpl struct {
	// db conn 共享对象
	// mysql host port  ....
	db *gorm.DB
}

// 对象属性初始化
func (i *UserServiceImpl) Init() error {
	i.db = conf.C().MySQL.GetDB()
	return nil
}

func (i *UserServiceImpl) CreateUser(ctx context.Context, in *user.CreateUserRequest) (*user.User, error) {
	// 1. 校验请求的合法性
	if err := common.Validate(in); err != nil {
		return nil, err
	}

	// 不要存储用户明文密码
	if err := in.HashPassword(); err != nil {
		return nil, err
	}

	// 2. 创建user对象(资源)
	ins := user.NewUser(in)

	// 3. user 对象保持入库
	/*
	  读取数据库配置
	  获取数据库连接
	  操作连接 保证数据
	*/
	// INSERT INTO `users` (`created_at`,`updated_at`,`username`,`password`,`role`,`label`) VALUES (1716623778,1716623778,'admin','123456',0,'{}')
	if err := i.db.WithContext(ctx).Save(ins).Error; err != nil {
		return nil, err
	}

	// 4. 返回保持后的user对象
	return ins, nil
}

// 怎么查询用户: 根据过来条件 去数据库里面 过滤出具体的资源
// WhERE 以及 LIMITE
func (i *UserServiceImpl) QueryUser(
	ctx context.Context,
	in *user.QueryUserRequest) (
	*user.UserSet, error) {

	set := user.NewUserSet()

	// 构造一个查询语句, TableName() select
	// WithContext
	query := i.db.Model(&user.User{}).WithContext(ctx)

	// Where where username = ?
	// SELECT * FROM `users` WHERE username = 'admin' LIMIT 10
	if in.Username != "" {
		// 注意: 返回一个新的对象, 并没有直接修改对象
		// 新生产的query 语句才有 query
		query = query.Where("username = ?", in.Username)
	}
	// ...

	// 怎么查询Total, 需要把过滤条件: username ,key
	// 查询Total时能不能把分页参数带上
	// select COUNT(*) from xxx limit 10
	// select COUNT(*) from xxx
	// 不能携带分页参数
	if err := query.Count(&set.Total).Error; err != nil {
		return nil, err
	}

	// LIMIT ?,?
	// SELECT * FROM `users` LIMIT 10
	if err := query.
		Offset(in.Offset()).
		Limit(in.PageSize).
		Find(&set.Items).Error; err != nil {
		return nil, err
	}

	return set, nil
}
