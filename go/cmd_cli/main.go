package main

import (
	"CMD_CLI/cmd"
	"fmt"
	"os"
)

// init函数在main函数之前自动执行，用于初始化设置
func init() {
	// 为根命令添加一个全局标志（flag）
	// 参数说明：标志变量的指针，标志名，默认值，帮助信息
	cmd.RootCmd.PersistentFlags().StringVar(
		&cmd.Verbose,            // 绑定到verbose变量的指针
		"verbose",               // 标志名称，用户使用"--verbose"调用
		"false",                 // 默认值
		"Enable verbose output", // 帮助信息
	)
}

// main函数是程序的入口点
func main() {
	// 将addCmd子命令添加到根命令
	cmd.RootCmd.AddCommand(cmd.AddCmd)

	// 将greetCmd子命令添加到根命令
	cmd.RootCmd.AddCommand(cmd.GreetCmd)

	// 执行根命令
	// 如果执行出错，打印错误信息并以状态码1退出程序
	if err := cmd.RootCmd.Execute(); err != nil {
		fmt.Println(err) // 打印错误
		os.Exit(1)       // 退出程序，状态码1表示错误
	}
}
