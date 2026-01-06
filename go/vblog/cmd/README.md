# 程序CLI 入口


main.go 做为程序的入口:
```
1. 初始化程序: main.go
2. 程序启动: main.go


mysql start/dump/....
```

1. 你的程序启动之前需要初始化(创建管理用户)

使用CLI 管理你程序的多入口: corbra


## 定义Root Cmd

```go
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
```

## 定义start

```go
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
		if err := conf.LoadConfigFromYaml(configPath); err != nil {
			panic(err)
		}

		// 2. 初始化Ioc
		if err := ioc.Controller.Init(); err != nil {
			panic(err)
		}
		// 3. 初始化Api
		if err := ioc.Api.Init(); err != nil {
			panic(err)
		}

		if err := conf.C().Application.Start(); err != nil {
			panic(err)
		}
	},
}
```

## 定义init

```go
var Cmd = &cobra.Command{
	Use:   "init",
	Short: "init vblog service",
	Run: func(cmd *cobra.Command, args []string) {
		// Do Stuff Here
		fmt.Println("init ...")
	},
}
```