package main

import (
	"CALCULATOR/calculator"
	"fmt"
	"os"
)

// 主函数
func main() {
	// 设置输出流，避免帮助信息弹出问题
	calculator.RootCmd.SetOut(os.Stdout)
	calculator.RootCmd.SetErr(os.Stderr)

	// 添加子命令
	calculator.RootCmd.AddCommand(calculator.AddCmd)
	calculator.RootCmd.AddCommand(calculator.SubCmd)
	calculator.RootCmd.AddCommand(calculator.MulCmd)
	calculator.RootCmd.AddCommand(calculator.DivCmd)
	calculator.RootCmd.AddCommand(calculator.InteractiveCmd)

	// 执行命令
	if err := calculator.RootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "错误: %v\n", err)
		os.Exit(1)
	}
}
