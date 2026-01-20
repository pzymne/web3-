#!/usr/bin/env node
/**
 * 快速验证脚本 - 简化的验证流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONTRACT_ADDRESS = "0xb92f9BdE7B306a2b907802c9c21A24Cb0f147691";

console.log("⚡ SimpleERC20 快速验证\n");

try {
  console.log("🔧 尝试自动验证...");
  
  const command = `npx hardhat verify --network sepolia \
    ${CONTRACT_ADDRESS} \
    "SimpleToken" \
    "STK" \
    1000000`;
  
  console.log(`📝 执行命令: ${command}\n`);
  
  const output = execSync(command, { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
} catch (error) {
  console.log("\n❌ 自动验证失败，生成手动验证信息...\n");
  
  // 生成手动验证信息
  const manualInfo = `
手动验证信息:
====================
合约地址: ${CONTRACT_ADDRESS}
网络: Sepolia
验证页面: https://sepolia.etherscan.io/verifyContract?a=${CONTRACT_ADDRESS}

验证设置:
1. Compiler Type: Solidity (Single file)
2. Compiler Version: v0.8.20+commit.a1b79de6
3. Open Source License: MIT License (MIT)
4. Optimization: Yes, 200 runs

构造函数参数:
["SimpleToken","STK",1000000]

合约页面:
https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}
====================
  `;
  
  console.log(manualInfo);
  
  // 保存到文件
  const infoFile = path.join(__dirname, '../quick-verify-info.txt');
  fs.writeFileSync(infoFile, manualInfo);
  console.log(`💾 信息已保存到: ${infoFile}`);
}