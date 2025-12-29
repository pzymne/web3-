// 声明包名为main，表示这是一个可执行程序
package main

// 导入必要的包
import (
	// 标准库：格式化输出
	"fmt"
	// 标准库：操作系统功能，如退出程序
	"os"
	// 第三方包：urfave/cli框架，用于构建命令行应用
	"github.com/urfave/cli/v2"
)

// main函数是程序的入口点
func main() {
	// 创建一个新的CLI应用实例
	app := &cli.App{
		// 应用名称
		Name: "myapp",

		// 应用版本
		Version: "v1.0.0",

		// 应用简短描述
		Usage: "一个简单的命令行工具演示",

		// 应用详细描述，会在帮助信息中显示
		Description: `这是一个使用urfave/cli构建的命令行工具演示程序，
它可以执行多种操作，如问候、计算等。`,

		// 定义应用的命令列表
		Commands: []*cli.Command{
			{
				// 命令名称
				Name: "greet",
				// 命令别名
				Aliases: []string{"g"},
				// 命令用法说明
				Usage: "向某人问好",
				// 命令详细描述
				Description: "这个命令会向指定的名字问好",

				// 命令的标志（参数）定义
				Flags: []cli.Flag{
					// 字符串标志，用于接收用户名
					&cli.StringFlag{
						Name:     "name",
						Aliases:  []string{"n"},
						Value:    "World", // 默认值
						Usage:    "要问候的人名",
						Required: false, // 非必需
					},
					// 布尔标志，用于控制是否热情问候
					&cli.BoolFlag{
						Name:    "enthusiastic",
						Aliases: []string{"e"},
						Usage:   "热情地问候",
						Value:   false, // 默认值
					},
				},

				// 命令执行函数，当用户运行此命令时被调用
				Action: func(c *cli.Context) error {
					// 从上下文获取name标志的值
					name := c.String("name")

					// 从上下文获取enthusiastic标志的值
					enthusiastic := c.Bool("enthusiastic")

					// 根据enthusiastic标志构建问候语
					greeting := "Hello"
					if enthusiastic {
						greeting = "HELLO"
					}

					// 输出问候语
					fmt.Printf("%s, %s!\n", greeting, name)

					// 返回nil表示执行成功
					return nil
				},
			},
			{
				Name:    "add",
				Aliases: []string{"a"},
				Usage:   "计算两个数的和",
				Flags: []cli.Flag{
					// 整数标志，接收第一个数字
					&cli.IntFlag{
						Name:     "x",
						Usage:    "第一个数字",
						Required: true, // 必需参数
					},
					// 整数标志，接收第二个数字
					&cli.IntFlag{
						Name:     "y",
						Usage:    "第二个数字",
						Required: true, // 必需参数
					},
				},
				Action: func(c *cli.Context) error {
					// 获取参数值
					x := c.Int("x")
					y := c.Int("y")

					// 计算并输出结果
					fmt.Printf("%d + %d = %d\n", x, y, x+y)
					return nil
				},
			},
		},

		// 全局标志，所有命令都可用
		Flags: []cli.Flag{
			// 布尔标志，用于控制是否显示调试信息
			&cli.BoolFlag{
				Name:    "debug",
				Aliases: []string{"d"},
				Usage:   "启用调试模式",
				Value:   false,
			},
		},

		// 应用启动前的钩子函数
		Before: func(c *cli.Context) error {
			// 检查是否启用了调试模式
			if c.Bool("debug") {
				fmt.Println("调试模式已启用")
			}
			return nil
		},

		// 默认Action，当没有指定命令时执行
		Action: func(c *cli.Context) error {
			// 如果没有提供命令，显示帮助信息
			cli.ShowAppHelp(c)
			return nil
		},
	}

	// 运行应用，并处理可能的错误
	// 这里传入os.Args，它包含了命令行参数
	err := app.Run(os.Args)
	if err != nil {
		// 如果运行出错，打印错误信息并退出
		fmt.Fprintf(os.Stderr, "错误: %v\n", err)
		os.Exit(1) // 退出码1表示错误
	}
}
