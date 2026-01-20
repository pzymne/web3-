// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox"); // 引入Hardhat工具箱，包含测试和网络功能
require("@openzeppelin/hardhat-upgrades"); // 引入OpenZeppelin可升级合约插件
require("hardhat-deploy"); // 引入部署插件，支持命名账户和部署脚本
require("dotenv").config(); // 引入环境变量配置

module.exports = {
  solidity: {
    version: "0.8.19", // 使用Solidity 0.8.19版本
    settings: {
      optimizer: {
        enabled: true, // 启用优化器
        runs: 200, // 优化运行次数，越高gas越优化但编译越慢
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337, // Hardhat本地网络链ID
      allowUnlimitedContractSize: true, // 允许无限制合约大小（仅测试用）
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "", // Sepolia网络RPC URL
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // 部署账户
      chainId: 11155111, // Sepolia链ID
    },
    localhost: {
      url: "http://127.0.0.1:8545", // 本地节点URL
      chainId: 31337, // 本地网络链ID
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Etherscan API密钥，用于验证合约
  },
  namedAccounts: {
    deployer: {
      default: 0, // 默认使用第一个账户作为部署者
    },
    feeRecipient: {
      default: 1, // 默认使用第二个账户作为手续费接收者
    },
  },
  paths: {
    sources: "./contracts", // 合约源文件目录
    tests: "./test", // 测试文件目录
    cache: "./cache", // 编译缓存目录
    artifacts: "./artifacts", // 编译产物目录
    deploy: "./scripts/deploy", // 部署脚本目录
  },
};