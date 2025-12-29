package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

// 定义addCmd变量，作为根命令的子命令
var AddCmd = &cobra.Command{
	// Use字段定义子命令的使用方式，"add"是子命令名
	Use: "add [numbers...]",

	// Short字段是简短描述
	Short: "Add numbers together",

	// Args字段验证参数数量，cobra.MinimumNArgs(1)表示至少需要1个参数
	Args: cobra.MinimumNArgs(1),

	// Example字段显示使用示例
	Example: "  my-cli-app add 1 2 3 4 5",

	// Run字段是子命令执行时调用的函数
	Run: func(cmd *cobra.Command, args []string) {
		// 调用addNumbers函数处理加法运算
		AddNumbers(args)
	},
}

// greetCmd变量定义另一个子命令
var GreetCmd = &cobra.Command{
	Use:   "greet [name]",
	Short: "Greet a person",
	Args:  cobra.RangeArgs(0, 1), // 允许0或1个参数
	Run: func(cmd *cobra.Command, args []string) {
		name := "World" // 默认名称
		if len(args) > 0 {
			name = args[0] // 如果提供了参数，使用该参数作为名称
		}
		fmt.Printf("Hello, %s!\n", name)
	},
}

// 定义全局变量，用于存储标志值
var Verbose string

// addNumbers函数执行实际的加法计算
func AddNumbers(args []string) {
	// 初始化总和为0
	total := 0

	// 遍历所有传入的参数
	for i, arg := range args {
		var num int
		// 将字符串参数转换为整数，_忽略错误返回值
		_, err := fmt.Sscan(arg, &num)

		// 检查转换是否出错
		if err != nil {
			// 如果转换失败，打印错误信息并退出
			fmt.Printf("Error: '%s' is not a valid number\n", arg)
			return
		}

		// 累加到总和
		total += num

		// 如果启用了详细模式，显示计算过程
		if Verbose == "true" {
			if i == 0 {
				fmt.Printf("Starting with: %d\n", num)
			} else {
				fmt.Printf("Adding %d, total: %d\n", num, total)
			}
		}
	}

	// 打印最终结果
	fmt.Printf("Total: %d\n", total)
}
