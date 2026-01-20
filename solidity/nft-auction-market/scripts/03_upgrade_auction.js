// scripts/deploy/03_upgrade_auction.js
const { ethers, upgrades } = require("hardhat");

/**
 * @title 拍卖合约升级脚本
 * @dev 演示如何升级拍卖合约到新版本
 * 
 * UUPS升级模式注意事项：
 * 1. 新版本合约必须兼容旧版本的数据结构
 * 2. 不能删除或改变现有状态变量的顺序
 * 3. 只能在末尾添加新的状态变量
 * 4. 升级前必须充分测试
 */
async function main() {
  console.log("=== 开始升级拍卖合约 ===");
  
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  
  // 需要升级的代理合约地址
  const proxyAddress = process.env.AUCTION_PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("请设置AUCTION_PROXY_ADDRESS环境变量");
  }
  console.log("代理合约地址:", proxyAddress);
  
  // 检查当前实现
  console.log("\n1. 检查当前实现...");
  const currentImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("当前实现地址:", currentImpl);
  
  // 部署新版本合约
  console.log("\n2. 部署新版本合约...");
  const AuctionV2 = await ethers.getContractFactory("AuctionV2");
  
  console.log("开始升级...");
  const auctionV2 = await upgrades.upgradeProxy(proxyAddress, AuctionV2, {
    kind: "uups",
    timeout: 0,
    pollingInterval: 1000
  });
  
  console.log("等待升级交易确认...");
  await auctionV2.waitForDeployment();
  
  // 验证升级
  console.log("\n3. 验证升级...");
  const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("新实现地址:", newImpl);
  console.log("实现已更新:", newImpl !== currentImpl);
  
  // 检查新功能
  const version = await auctionV2.version();
  console.log("新合约版本:", version);
  
  // 验证数据保留
  const platformFee = await auctionV2.platformFee();
  const platformFeeRecipient = await auctionV2.platformFeeRecipient();
  console.log("平台手续费（保留）:", platformFee.toString());
  console.log("手续费接收地址（保留）:", platformFeeRecipient);
  
  // 测试新功能（如果有）
  try {
    // 假设新版本添加了getStats函数
    const [totalAuctions, activeAuctions] = await auctionV2.getStats();
    console.log("总拍卖数（保留）:", totalAuctions.toString());
    console.log("活跃拍卖数（保留）:", activeAuctions.toString());
  } catch (error) {
    console.log("新功能测试:", error.message);
  }
  
  console.log("\n=== 合约升级完成 ===");
  console.log("代理地址:", proxyAddress);
  console.log("新实现地址:", newImpl);
  console.log("\n重要提示:");
  console.log("1. 升级后请立即验证所有核心功能");
  console.log("2. 确保新版本合约通过所有测试");
  console.log("3. 通知用户关于升级的信息");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("升级失败:", error);
    process.exit(1);
  });