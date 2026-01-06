package apps

import (
	// 业务对象注册
	_ "gitlab.com/go-course-project/go15/vblog/apps/blog/api"
	_ "gitlab.com/go-course-project/go15/vblog/apps/blog/impl"
	_ "gitlab.com/go-course-project/go15/vblog/apps/token/api"
	_ "gitlab.com/go-course-project/go15/vblog/apps/token/impl"
	_ "gitlab.com/go-course-project/go15/vblog/apps/user/impl"
)
