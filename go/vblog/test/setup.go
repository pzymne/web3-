package test

import (
	"github.com/spf13/cobra"
	"gitlab.com/go-course-project/go15/vblog/conf"
	"gitlab.com/go-course-project/go15/vblog/ioc"

	// 注册所有的业务模块
	_ "gitlab.com/go-course-project/go15/vblog/apps"
)

func DevelopmentSetup() {
	// 加载配置, 单元测试 通过环境变量读取, vscode 传递进来的
	if err := conf.LoadConfigFromEnv(); err != nil {
		panic(err)
	}

	// 2. 初始化Ioc
	cobra.CheckErr(ioc.Controller.Init())
	// 3. 初始化Api
	cobra.CheckErr(ioc.Api.Init())
}
