// 包声明：main包是Go程序的入口点，包含可执行代码
package main

// 导入语句：引入程序所需的外部包
import (
	"fmt"     // 格式化I/O包，用于打印输出和格式化字符串
	"os"      // 操作系统功能包，用于文件操作和退出程序
	"strconv" // 字符串转换包，用于字符串和数字的相互转换
	"strings" // 字符串操作包，提供字符串处理函数

	"github.com/spf13/cobra" // Cobra CLI框架，用于构建命令行应用
)

// 全局变量声明：在整个程序范围内可访问的变量
var (
	// 标志变量：存储命令行标志的值
	verbose bool   // -v, --verbose 标志，控制详细输出
	output  string // -o, --output 标志，指定输出格式
)

// init函数：Go自动调用的初始化函数，在main函数之前执行
func init() {
	// 为根命令添加持久化标志（所有子命令都可访问）
	rootCmd.PersistentFlags().BoolVarP(
		&verbose,   // 变量的内存地址，用于存储标志值
		"verbose",  // 标志的长名称，使用 --verbose
		"v",        // 标志的短名称，使用 -v
		false,      // 默认值
		"启用详细输出模式", // 帮助信息
	)

	rootCmd.PersistentFlags().StringVarP(
		&output,                 // 绑定到output变量
		"output",                // 标志名称
		"o",                     // 短名称
		"text",                  // 默认值
		"输出格式：text, json 或 csv", // 帮助信息
	)
}

// 根命令定义：CLI应用的入口点
var rootCmd = &cobra.Command{
	// Use字段：命令的使用方式，显示在用法说明中
	Use: "myapp", // 用户通过输入"myapp"来调用程序

	// Short字段：简短描述，显示在命令列表中
	Short: "一个多功能命令行工具",

	// Long字段：详细描述，显示在帮助信息中
	Long: `myapp 是一个使用Go和Cobra构建的命令行工具。
它可以执行多种操作，包括计算、文本处理和文件操作。

示例:
  myapp add 1 2 3 4 5      # 计算数字之和
  myapp greet Alice        # 向Alice问好
  myapp upper "hello"      # 将文本转换为大写`,

	// Version字段：版本信息
	Version: "1.0.0",

	// Run字段：命令执行时调用的函数
	Run: func(cmd *cobra.Command, args []string) {
		// cmd: 当前命令对象，包含命令相关信息
		// args: 用户传入的参数数组

		// 当用户只运行myapp而没有子命令时显示欢迎信息
		fmt.Println("👋 欢迎使用 myapp！")
		fmt.Println("📖 使用 'myapp --help' 查看可用命令")
		fmt.Println("🔍 使用 'myapp [命令] --help' 查看具体命令帮助")
	},
}

// 加法命令：计算数字之和
var addCmd = &cobra.Command{
	Use:   "add <数字1> <数字2> ...", // 使用说明，<>表示必需参数
	Short: "计算数字之和",              // 简短描述
	Long:  "计算一系列数字的总和，支持整数和浮点数", // 详细描述

	// Args字段：参数验证器，确保至少传入一个参数
	Args: cobra.MinimumNArgs(1), // 最少需要1个参数

	// Example字段：使用示例
	Example: `  myapp add 1 2 3           # 计算1+2+3
  myapp add 10 20 30 40     # 计算10+20+30+40
  myapp add -v 5.5 4.5      # 详细模式计算`,

	// RunE字段：返回错误的Run函数，可以更好地处理错误
	RunE: func(cmd *cobra.Command, args []string) error {
		// 调用加法函数
		return addNumbers(args)
	},
}

// greet命令：问候用户
var greetCmd = &cobra.Command{
	Use:   "greet [姓名]", // []表示可选参数
	Short: "向某人问好",
	Args:  cobra.MaximumNArgs(1), // 最多接受1个参数

	// PreRun函数：在Run函数之前执行
	PreRun: func(cmd *cobra.Command, args []string) {
		if verbose {
			fmt.Println("🔧 开始执行greet命令...")
		}
	},

	// PostRun函数：在Run函数之后执行
	PostRun: func(cmd *cobra.Command, args []string) {
		if verbose {
			fmt.Println("✅ greet命令执行完成")
		}
	},

	Run: func(cmd *cobra.Command, args []string) {
		// 确定问候的名称
		name := "朋友" // 默认值
		if len(args) > 0 {
			name = args[0] // 使用用户提供的名称
		}

		// 根据输出格式选择不同的问候方式
		switch output {
		case "json":
			fmt.Printf(`{"greeting": "你好，%s！"}\n`, name)
		case "csv":
			fmt.Printf("greeting,\"你好，%s！\"\n", name)
		default: // text格式
			fmt.Printf("👋 你好，%s！\n", name)
		}
	},
}

// upper命令：将文本转换为大写
var upperCmd = &cobra.Command{
	Use:   "upper <文本>",
	Short: "将文本转换为大写",
	Args:  cobra.ExactArgs(1), // 必须恰好有1个参数

	Run: func(cmd *cobra.Command, args []string) {
		text := args[0] // 获取用户输入的文本

		// 转换为大写
		result := strings.ToUpper(text)

		// 输出结果
		if verbose {
			fmt.Printf("原始文本: %s\n", text)
			fmt.Printf("转换结果: %s\n", result)
		} else {
			fmt.Println(result)
		}
	},
}

// info命令：显示程序信息
var infoCmd = &cobra.Command{
	Use:   "info",
	Short: "显示程序信息",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("📋 程序信息")
		fmt.Println("==========")
		fmt.Printf("名称: %s\n", rootCmd.Use)
		fmt.Printf("版本: %s\n", rootCmd.Version)
		fmt.Printf("描述: %s\n", rootCmd.Short)
		fmt.Println("")
		fmt.Println("可用命令:")
		fmt.Println("  add     - 计算数字之和")
		fmt.Println("  greet   - 向某人问好")
		fmt.Println("  upper   - 将文本转换为大写")
		fmt.Println("  info    - 显示此信息")
	},
}

// addNumbers函数：执行实际的加法计算
func addNumbers(args []string) error {
	// 初始化总和为0
	total := 0.0    // 使用float64支持浮点数
	validCount := 0 // 有效数字计数

	// 遍历所有参数
	for i, arg := range args {
		// 尝试将字符串转换为浮点数
		num, err := strconv.ParseFloat(arg, 64) // 64表示float64类型

		if err != nil {
			// 转换失败，显示错误信息但不停止程序
			fmt.Printf("⚠️  警告: 忽略无效数字 '%s'\n", arg)
			continue // 跳过无效数字
		}

		// 累加到总和
		total += num
		validCount++

		// 如果启用了详细模式，显示计算过程
		if verbose {
			if i == 0 {
				fmt.Printf("➡️  起始数字: %.2f\n", num)
			} else {
				fmt.Printf("➕  加 %.2f，当前总计: %.2f\n", num, total)
			}
		}
	}

	// 检查是否有有效数字
	if validCount == 0 {
		return fmt.Errorf("❌ 错误: 没有有效的数字可计算")
	}

	// 根据输出格式显示结果
	switch output {
	case "json":
		fmt.Printf(`{"total": %.2f, "count": %d}\n`, total, validCount)
	case "csv":
		fmt.Printf("total,count\n%.2f,%d\n", total, validCount)
	default: // text格式
		fmt.Printf("📊 计算结果:\n")
		fmt.Printf("数字个数: %d\n", validCount)
		fmt.Printf("总和: %.2f\n", total)
		fmt.Printf("平均值: %.2f\n", total/float64(validCount))
	}

	return nil // 返回nil表示没有错误
}

// printBanner函数：打印程序横幅（私有函数，小写开头）
func printBanner() {
	banner := `
    ┌─────────────────────────────────┐
    │        🚀 MYAPP CLI工具         │
    │     版本: %-10s             │
    └─────────────────────────────────┘
    `
	fmt.Printf(banner, rootCmd.Version)
}

// main函数：程序入口点
func main() {
	// 1. 打印程序横幅
	printBanner()

	// 2. 将所有子命令添加到根命令
	rootCmd.AddCommand(addCmd)   // 添加add命令
	rootCmd.AddCommand(greetCmd) // 添加greet命令
	rootCmd.AddCommand(upperCmd) // 添加upper命令
	rootCmd.AddCommand(infoCmd)  // 添加info命令

	// 3. 为add命令添加特定标志（仅对add命令有效）
	addCmd.Flags().BoolP("average", "a", false, "同时显示平均值")

	// 4. 执行命令
	if err := rootCmd.Execute(); err != nil {
		// 如果执行出错，将错误信息输出到标准错误流
		fmt.Fprintf(os.Stderr, "❌ 错误: %v\n", err)

		// 以非零状态码退出程序，表示错误
		os.Exit(1) // 1表示一般性错误
	}
}
