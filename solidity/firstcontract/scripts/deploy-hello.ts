// 导入 Hardhat 的以太坊交互工具包
// 这个导入会注册 Hardhat 与 ethers.js 的集成，使 ethers 对象可用
import "@nomicfoundation/hardhat-ethers";

// 从 hardhat 模块导入 ethers 对象
// ethers 是一个用于与以太坊区块链交互的 JavaScript 库
import { ethers } from "hardhat";

// 定义一个异步函数 deploy，用于部署智能合约
// async 关键字表示这个函数返回一个 Promise
async function deploy() {
  // 使用 ethers 获取 HelloWorld 合约的工厂（ContractFactory）
  // ContractFactory 是用于部署新合约实例的类
  // getContractFactory 是异步函数，需要 await 等待
  const HelloWorld = await ethers.getContractFactory("HelloWorld");
  
  // 使用合约工厂部署合约到区块链
  // deploy() 方法发送交易创建合约，返回合约实例
  const hello = await HelloWorld.deploy();
  
  // 等待合约部署交易被确认
  // waitForDeployment() 确保合约已成功部署并获取到合约地址
  // 这是 ethers.js v6 的写法（v5 中使用 deployed()）
  await hello.waitForDeployment();
  
  // 返回部署好的合约实例
  // 这个实例包含了合约地址和所有合约方法的调用能力
  return hello;
}

// 定义一个异步函数 sayHello，用于调用合约的 hello 函数
// 参数 hello 是已部署的合约实例
// :any 是 TypeScript 类型注解，表示参数可以是任意类型（不严格）
async function sayHello(hello: any) {
  // 调用合约的 hello() 函数并打印结果
  // hello.hello() 调用合约中的 hello 函数
  // await 等待合约调用完成（因为是异步的区块链调用）
  console.log("Say Hello:", await hello.hello());
}

// 执行部署流程：先调用 deploy()，部署完成后将合约实例传给 sayHello()
// deploy() 返回一个 Promise，.then() 方法指定成功时的回调
// 这是 Promise 链式调用的写法：部署完成后自动调用 sayHello
deploy().then(sayHello);