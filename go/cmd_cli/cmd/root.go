package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

// 定义rootCmd变量，这是根命令
// &cobra.Command{} 创建一个新的Command结构体实例
var RootCmd = &cobra.Command{
	// Use字段定义命令的使用方式，用户输入"my-cli-app"时会调用此命令
	Use: "my-cli-app",

	// Short字段是命令的简短描述，在帮助信息中显示
	Short: "A simple CLI application built with Go and Cobra",

	// Long字段是详细的命令描述，当用户查看完整帮助时显示
	Long: `This is a demo CLI application built using the Cobra framework in Go.
It demonstrates how to create commands, subcommands, flags, and arguments.`,

	// Run字段是命令执行时调用的函数
	// cmd是命令对象，args是用户传入的参数数组
	Run: func(cmd *cobra.Command, args []string) {
		// 当用户只运行根命令时执行这里的代码
		fmt.Println("Hello from my-cli-app!")
		fmt.Println("Use '--help' to see available commands.")
	},
}
