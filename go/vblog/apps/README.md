# 业务分区

业务区的对象 全部迁移至Ioc里面, 由ioc来完成这些的对象的生命周期(Object Init)的管理, 因此我们通过ioc来管理所有对象


到处所有需要的业务

```go
import (
	// 业务对象注册
	_ "gitlab.com/go-course-project/go15/vblog/apps/token/api"
	_ "gitlab.com/go-course-project/go15/vblog/apps/token/impl"
	_ "gitlab.com/go-course-project/go15/vblog/apps/user/impl"
)
```