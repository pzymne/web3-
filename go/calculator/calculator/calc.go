package calculator

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

// 全局变量，存储表达式
var expression string

// 初始化函数
func init() {
	// 为根命令添加表达式标志
	RootCmd.Flags().StringVarP(
		&expression, // 绑定到expression变量
		"expr",      // 标志名称
		"e",         // 简写
		"",          // 默认值（空字符串）
		"直接计算表达式，例如：\"1 + 2\"", // 帮助信息
	)
}

// 根命令定义
var RootCmd = &cobra.Command{
	Use:   "calc",
	Short: "命令行计算器",
	Long: `命令行计算器 - 支持 +, -, *, / 四种基本运算

使用方法:
  1. 直接模式: calc --expr "1 + 2"
  2. 交互模式: calc add 1 2
  3. 批量模式: calc "1 + 2 * 3"

支持的运算:
  + : 加法
  - : 减法
  * : 乘法
  / : 除法

示例:
  calc --expr "10 + 20 * 2"
  calc add 5 10
  calc "15 / 3 + 2"`,

	Run: func(cmd *cobra.Command, args []string) {
		// 如果有表达式标志，直接计算
		if expression != "" {
			result, err := evaluateExpression(expression)
			if err != nil {
				fmt.Fprintf(os.Stderr, "错误: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("表达式: %s\n", expression)
			fmt.Printf("结果: %.2f\n", result)
			return
		}

		// 如果提供了参数，作为表达式处理
		if len(args) > 0 {
			expr := strings.Join(args, " ")
			result, err := evaluateExpression(expr)
			if err != nil {
				fmt.Fprintf(os.Stderr, "错误: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("表达式: %s\n", expr)
			fmt.Printf("结果: %.2f\n", result)
			return
		}

		// 如果没有参数，显示帮助信息
		fmt.Println("命令行计算器 - 输入 --help 查看使用方法")
		fmt.Println("使用示例: calc \"1 + 2\" 或 calc add 1 2")
	},
}

// add命令 - 加法运算
var AddCmd = &cobra.Command{
	Use:   "add <数字1> <数字2> [数字...]",
	Short: "执行加法运算",
	Args:  cobra.MinimumNArgs(2),
	Example: `  calc add 1 2          # 计算 1 + 2
  calc add 1 2 3 4 5    # 计算 1 + 2 + 3 + 4 + 5
  calc add 10.5 20.3    # 计算小数加法`,

	Run: func(cmd *cobra.Command, args []string) {
		var sum float64 = 0
		var numbers []string

		for i, arg := range args {
			num, err := strconv.ParseFloat(arg, 64)
			if err != nil {
				fmt.Fprintf(os.Stderr, "错误: '%s' 不是有效的数字\n", arg)
				os.Exit(1)
			}

			sum += num
			numbers = append(numbers, arg)

			// 显示计算过程
			if i == 0 {
				fmt.Printf("开始: %.2f\n", num)
			} else {
				fmt.Printf("+ %.2f = %.2f\n", num, sum)
			}
		}

		fmt.Printf("\n加法运算完成:\n")
		fmt.Printf("%s = %.2f\n", strings.Join(numbers, " + "), sum)
	},
}

// sub命令 - 减法运算
var SubCmd = &cobra.Command{
	Use:   "sub <被减数> <减数> [减数...]",
	Short: "执行减法运算",
	Args:  cobra.MinimumNArgs(2),
	Example: `  calc sub 10 2        # 计算 10 - 2
  calc sub 100 20 10   # 计算 100 - 20 - 10`,

	Run: func(cmd *cobra.Command, args []string) {
		// 解析第一个数字
		result, err := strconv.ParseFloat(args[0], 64)
		if err != nil {
			fmt.Fprintf(os.Stderr, "错误: '%s' 不是有效的数字\n", args[0])
			os.Exit(1)
		}

		var numbers []string
		numbers = append(numbers, args[0])

		fmt.Printf("开始: %.2f\n", result)

		// 依次减去后面的数字
		for i := 1; i < len(args); i++ {
			num, err := strconv.ParseFloat(args[i], 64)
			if err != nil {
				fmt.Fprintf(os.Stderr, "错误: '%s' 不是有效的数字\n", args[i])
				os.Exit(1)
			}

			result -= num
			numbers = append(numbers, args[i])

			fmt.Printf("- %.2f = %.2f\n", num, result)
		}

		fmt.Printf("\n减法运算完成:\n")
		fmt.Printf("%s = %.2f\n", strings.Join(numbers, " - "), result)
	},
}

// mul命令 - 乘法运算
var MulCmd = &cobra.Command{
	Use:   "mul <数字1> <数字2> [数字...]",
	Short: "执行乘法运算",
	Args:  cobra.MinimumNArgs(2),
	Example: `  calc mul 2 3        # 计算 2 * 3
  calc mul 2 3 4      # 计算 2 * 3 * 4`,

	Run: func(cmd *cobra.Command, args []string) {
		result := 1.0
		var numbers []string

		for i, arg := range args {
			num, err := strconv.ParseFloat(arg, 64)
			if err != nil {
				fmt.Fprintf(os.Stderr, "错误: '%s' 不是有效的数字\n", arg)
				os.Exit(1)
			}

			result *= num
			numbers = append(numbers, arg)

			// 显示计算过程
			if i == 0 {
				fmt.Printf("开始: %.2f\n", num)
			} else {
				fmt.Printf("* %.2f = %.2f\n", num, result)
			}
		}

		fmt.Printf("\n乘法运算完成:\n")
		fmt.Printf("%s = %.2f\n", strings.Join(numbers, " * "), result)
	},
}

// div命令 - 除法运算
var DivCmd = &cobra.Command{
	Use:   "div <被除数> <除数> [除数...]",
	Short: "执行除法运算",
	Args:  cobra.MinimumNArgs(2),
	Example: `  calc div 10 2        # 计算 10 / 2
  calc div 100 2 5     # 计算 100 / 2 / 5`,

	Run: func(cmd *cobra.Command, args []string) {
		// 解析第一个数字
		result, err := strconv.ParseFloat(args[0], 64)
		if err != nil {
			fmt.Fprintf(os.Stderr, "错误: '%s' 不是有效的数字\n", args[0])
			os.Exit(1)
		}

		var numbers []string
		numbers = append(numbers, args[0])

		fmt.Printf("开始: %.2f\n", result)

		// 依次除以后面的数字
		for i := 1; i < len(args); i++ {
			num, err := strconv.ParseFloat(args[i], 64)
			if err != nil {
				fmt.Fprintf(os.Stderr, "错误: '%s' 不是有效的数字\n", args[i])
				os.Exit(1)
			}

			// 检查除数是否为零
			if num == 0 {
				fmt.Fprintf(os.Stderr, "错误: 除数不能为零\n")
				os.Exit(1)
			}

			result /= num
			numbers = append(numbers, args[i])

			fmt.Printf("/ %.2f = %.2f\n", num, result)
		}

		fmt.Printf("\n除法运算完成:\n")
		fmt.Printf("%s = %.2f\n", strings.Join(numbers, " / "), result)
	},
}

// 交互式计算模式
var InteractiveCmd = &cobra.Command{
	Use:   "interactive",
	Short: "进入交互式计算模式",
	Long:  "进入交互式命令行计算模式，可以连续输入表达式进行计算",

	Run: func(cmd *cobra.Command, args []string) {

		fmt.Println("🚀 进入交互式计算模式")
		fmt.Println("输入表达式进行计算，例如: 1 + 2")
		fmt.Println("输入 'quit' 或 'exit' 退出")
		fmt.Println("输入 'help' 查看帮助")
		fmt.Println(strings.Repeat("-", 50))

		// 简单的交互循环
		for {
			fmt.Print("calc> ")

			var input string
			// 使用bufio读取整行输入
			reader := bufio.NewReader(os.Stdin)
			// 读取整行输入
			input, err := reader.ReadString('\n')
			if err != nil {
				fmt.Printf("读取错误: %v\n", err)
				continue
			}

			// 去除换行符和首尾空格
			input = strings.TrimSpace(input)
			// 检查退出命令
			if input == "quit" || input == "exit" {
				fmt.Println("再见！")
				break
			}

			if input == "help" {
				fmt.Println("支持的运算: +, -, *, /")
				fmt.Println("示例: 3 * 4, 10 / 2, 5 + 6 - 2")
				continue
			}

			if input == "" {
				continue
			}

			// 计算表达式
			result, err := evaluateExpression(input)
			if err != nil {
				fmt.Printf("计算错误: %v\n", err)
				continue
			}

			fmt.Printf("结果: %.2f\n", result)
		}
	},
}

// 表达式求值函数
func evaluateExpression(expr string) (float64, error) {

	// 移除空格并检查是否为空
	expr = strings.TrimSpace(expr)
	if expr == "" {
		return 0, fmt.Errorf("表达式为空")
	}

	// 分割表达式为数字和运算符
	tokens := strings.Fields(expr)
	//fmt.Printf("tokens: %s\n", tokens)

	if len(tokens) < 3 || len(tokens)%2 == 0 {
		fmt.Printf("len(tokens):%d\n", len(tokens))
		return 0, fmt.Errorf("表达式格式错误: 应为 '数字 运算符 数字'")
	}

	// 解析第一个数字
	result, err := strconv.ParseFloat(tokens[0], 64)
	if err != nil {
		return 0, fmt.Errorf("无效数字: '%s'", tokens[0])
	}

	// 逐个处理剩余的令牌
	for i := 1; i < len(tokens); i += 2 {
		// 获取运算符
		operator := tokens[i]

		// 获取下一个数字
		if i+1 >= len(tokens) {
			return 0, fmt.Errorf("表达式不完整")
		}

		num, err := strconv.ParseFloat(tokens[i+1], 64)
		if err != nil {
			return 0, fmt.Errorf("无效数字: '%s'", tokens[i+1])
		}

		// 执行运算
		switch operator {
		case "+":
			result += num
		case "-":
			result -= num
		case "*":
			result *= num
		case "/":
			if num == 0 {
				return 0, fmt.Errorf("除数不能为零")
			}
			result /= num
		default:
			return 0, fmt.Errorf("不支持的操作符: '%s'", operator)
		}
	}

	return result, nil
}
