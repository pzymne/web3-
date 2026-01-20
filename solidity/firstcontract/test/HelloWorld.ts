// 导入 Hardhat 的以太坊交互工具包
// 这行代码注册了 Hardhat 与 ethers.js 的集成
import "@nomicfoundation/hardhat-ethers";

// 导入 chai 断言库的 expect 函数，用于编写测试断言
import { expect } from "chai";

// 使用 Mocha 测试框架的 describe 函数定义测试套件
// "HelloWorld" 是测试套件的名称，function() 是测试套件的实现
describe("HelloWorld", function() {
  
  // 定义一个具体的测试用例
  // "should say hello" 是测试用例的描述
  // async function() 表示这是一个异步测试用例
  it("should say hello", async function() {
    
    // 注释说明：在函数内部动态获取 ethers 对象
    // 使用 CommonJS 的 require 方式导入 hardhat 模块
    // 解构赋值获取 ethers 对象
    const { ethers } = require("hardhat");

    // 使用 ethers 获取 HelloWorld 合约的工厂（ContractFactory）
    // ContractFactory 是用于部署合约的类
    // getContractFactory 是一个异步函数，需要 await
    const HW = await ethers.getContractFactory("HelloWorld");
    
    // 使用合约工厂部署合约
    // deploy() 方法创建合约实例并部署到（测试）区块链
    // 这是一个异步操作，需要 await
    const hw = await HW.deploy();
    
    // 等待合约部署交易被确认
    // waitForDeployment() 确保合约已成功部署到区块链
    // 这是 ethers.js v6 中的新方法（v5 中使用 deployed()）
    await hw.waitForDeployment();

    // 测试断言：验证合约的 hello() 函数返回值是否符合预期
    // 这里有语法错误，正确写法应该是：expect(await hw.hello()).to.equal("Hello, World")
    // 当前写法的问题：
    // 1. await hw.hello() 应该在 expect() 内部，而不是链式调用的一部分
    // 2. .to.equal() 是 chai 断言的方法，不能在 promise 上直接调用
    // 3. 字符串应该是 "Hello, World"（可能有空格，取决于合约实现）
    expect(await hw.hello()).to.equal("Hello World");
  })
  
  // 注意：这里缺少一个分号，但 JavaScript 会自动插入分号
});

// 关键概念解释：
// describe()：Mocha 的测试套件函数，用于组织相关测试用例

// it()：定义单个测试用例

// ContractFactory：以太坊智能合约的"蓝图"，用于部署新合约实例

// waitForDeployment()：确保合约部署交易被矿工确认

// expect().to.equal()：Chai 断言库的语法，用于验证期望值