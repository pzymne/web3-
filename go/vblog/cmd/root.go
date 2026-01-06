package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	initCmd "gitlab.com/go-course-project/go15/vblog/cmd/init"
	"gitlab.com/go-course-project/go15/vblog/cmd/start"
	"gitlab.com/go-course-project/go15/vblog/conf"
	"gitlab.com/go-course-project/go15/vblog/ioc"

	// 注册所有的业务模块
	_ "gitlab.com/go-course-project/go15/vblog/apps"
)

var (
	configPath string
)

var RootCmd = &cobra.Command{
	Use:   "vblog",
	Short: "vblog service",
	Run: func(cmd *cobra.Command, args []string) {
		// vblog version
		// v0.0.1
		if len(args) > 0 {
			if args[0] == "verson" {
				fmt.Println("v0.0.1")
			}
		} else {
			cmd.Help()
		}
	},
}

func Execute() error {
	// 初始化需要执行的逻辑
	cobra.OnInitialize(func() {
		// 1. 加载配置
		cobra.CheckErr(conf.LoadConfigFromYaml(configPath))

		// 2. 初始化Ioc
		cobra.CheckErr(ioc.Controller.Init())
		// 3. 初始化Api
		cobra.CheckErr(ioc.Api.Init())
	})

	return RootCmd.Execute()
}

func init() {
	// --config
	RootCmd.PersistentFlags().StringVarP(&configPath, "config", "c", "etc/application.yaml", "the service config file")

	// Root--> init
	RootCmd.AddCommand(initCmd.Cmd)
	// Root --> start
	RootCmd.AddCommand(start.Cmd)
}
