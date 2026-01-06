package start

import (
	"os"

	"github.com/spf13/cobra"

	//.....
	"gitlab.com/go-course-project/go15/vblog/conf"
)

var (
	testParam string
)

var Cmd = &cobra.Command{
	Use:   "start",
	Short: "start vblog api server",
	Run: func(cmd *cobra.Command, args []string) {
		// Do Stuff Here
		// 1. 加载配置
		configPath := os.Getenv("CONFIG_PATH")
		if configPath == "" {
			configPath = "etc/application.yaml"
		}

		// 2. 启动服务
		cobra.CheckErr(conf.C().Application.Start())
	},
}

func init() {
	Cmd.Flags().StringVarP(&testParam, "test", "t", "test", "test flag")
	// Root--> Init
	// -config xxxx
}
