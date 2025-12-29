package main

import (
	"bytes"
	"strings"
	"testing"
)

// 辅助函数：执行命令并返回输出
func executeCommand(args ...string) (string, error) {
	buf := new(bytes.Buffer)

	// 设置命令的输出
	rootCmd.SetOut(buf)
	rootCmd.SetErr(buf)
	rootCmd.SetArgs(args)

	// 执行命令
	err := rootCmd.Execute()

	// 重置输出到默认
	rootCmd.SetOut(nil)
	rootCmd.SetErr(nil)

	return buf.String(), err
}

// TestRootCommand 测试根命令
func TestRootCommand(t *testing.T) {
	// 执行根命令（无参数）
	output, err := executeCommand()

	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// 检查输出是否包含预期文本
	expected := "Welcome to my-cli-app!"
	if !strings.Contains(output, expected) {
		t.Errorf("Expected output to contain %q, got:\n%s", expected, output)
	}

	// 检查是否包含帮助提示
	expectedHelp := "--help"
	if !strings.Contains(output, expectedHelp) {
		t.Errorf("Expected output to contain %q, got:\n%s", expectedHelp, output)
	}
}

// TestHelpCommand 测试帮助命令
func TestHelpCommand(t *testing.T) {
	// 测试 --help 标志
	output, err := executeCommand("--help")

	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// 检查帮助输出是否包含关键信息
	checkStrings := []string{
		"Usage:",
		"Available Commands:",
		"add",
		"greet",
		"Flags:",
		"-v, --verbose",
	}

	for _, expected := range checkStrings {
		if !strings.Contains(output, expected) {
			t.Errorf("Help output should contain %q, got:\n%s", expected, output)
		}
	}
}

// TestAddCommand 测试加法命令
func TestAddCommand(t *testing.T) {
	tests := []struct {
		name     string
		args     []string
		contains string
	}{
		{
			name:     "add two numbers",
			args:     []string{"add", "1", "2"},
			contains: "Total: 3",
		},
		{
			name:     "add multiple numbers",
			args:     []string{"add", "1", "2", "3", "4", "5"},
			contains: "Total: 15",
		},
		{
			name:     "add with invalid number",
			args:     []string{"add", "1", "abc", "3"},
			contains: "Warning: Invalid inputs ignored",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			output, err := executeCommand(tt.args...)

			// 对于无效输入，我们不检查错误
			if !strings.Contains(tt.name, "invalid") && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			if !strings.Contains(output, tt.contains) {
				t.Errorf("Expected output to contain %q, got:\n%s", tt.contains, output)
			}
		})
	}
}

// TestAddCommandVerbose 测试详细模式的加法命令
func TestAddCommandVerbose(t *testing.T) {
	output, err := executeCommand("add", "1", "2", "3", "-v")

	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// 检查详细输出
	checkStrings := []string{
		"Starting with: 1",
		"Adding 2, running total: 3",
		"Total: 6",
	}

	for _, expected := range checkStrings {
		if !strings.Contains(output, expected) {
			t.Errorf("Verbose output should contain %q, got:\n%s", expected, output)
		}
	}
}

// TestGreetCommand 测试问候命令
func TestGreetCommand(t *testing.T) {
	tests := []struct {
		name     string
		args     []string
		contains string
	}{
		{
			name:     "greet with name",
			args:     []string{"greet", "Alice"},
			contains: "Hello, Alice!",
		},
		{
			name:     "greet without name",
			args:     []string{"greet"},
			contains: "Hello, World!",
		},
		{
			name:     "greet with verbose flag",
			args:     []string{"greet", "Bob", "-v"},
			contains: "Warm greetings, Bob!",
		},
		{
			name:     "greet with global verbose",
			args:     []string{"greet", "Charlie", "--verbose"},
			contains: "Warm greetings, Charlie!",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			output, err := executeCommand(tt.args...)

			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			if !strings.Contains(output, tt.contains) {
				t.Errorf("Expected output to contain %q, got:\n%s", tt.contains, output)
			}
		})
	}
}

// TestCommandNotFound 测试不存在的命令
func TestCommandNotFound(t *testing.T) {
	output, err := executeCommand("nonexistent")

	if err == nil {
		t.Error("Expected error for nonexistent command, got none")
	}

	if !strings.Contains(output, "unknown command") {
		t.Errorf("Expected error message about unknown command, got:\n%s", output)
	}
}
