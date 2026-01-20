// scripts/deploy/01_deploy_nft.js
const { ethers, upgrades } = require("hardhat");

/**
 * @title NFT合约部署脚本
 * @dev 部署可升级的NFT合约
 */
async function main() {
  console.log("=== 开始部署NFT合约 ===");
  
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // 检查是否在测试网
  const network = await ethers.provider.getNetwork();
  console.log("网络:", network.name, "(链ID:", network.chainId, ")");
  
  // 部署NFT合约
  console.log("\n1. 部署NFT合约...");
  const NFT = await ethers.getContractFactory("NFT");
  
  // 使用UUPS模式部署代理合约
  const nft = await upgrades.deployProxy(
    NFT,
    ["Auction NFT Collection", "ANFT"], // 构造函数参数：名称和符号
    { 
      initializer: "initialize", // 初始化函数名
      kind: "uups", // UUPS升级模式
      timeout: 0 // 禁用超时
    }
  );
  
  // 等待部署确认
  console.log("等待部署交易确认...");
  await nft.waitForDeployment();
  
  // 获取合约地址
  const nftAddress = await nft.getAddress();
  console.log("NFT合约地址:", nftAddress);
  
  // 获取实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(nftAddress);
  console.log("实现合约地址:", implementationAddress);
  
  // 获取代理管理员地址
  const adminAddress = await upgrades.erc1967.getAdminAddress(nftAddress);
  console.log("代理管理员地址:", adminAddress);
  
  // 验证合约功能
  console.log("\n2. 验证合约功能...");
  
  // 检查名称和符号
  const name = await nft.name();
  const symbol = await nft.symbol();
  console.log("NFT名称:", name);
  console.log("NFT符号:", symbol);
  
  // 检查所有者
  const owner = await nft.owner();
  console.log("合约所有者:", owner);
  console.log("与部署者匹配:", owner === deployer.address);
  
  // 铸造测试NFT
  console.log("\n3. 铸造测试NFT...");
  const mintTx = await nft.mint(deployer.address);
  await mintTx.wait();
  console.log("测试NFT铸造成功，tokenId: 1");
  
  // 检查tokenId计数器
  const currentTokenId = await nft.getCurrentTokenId();
  console.log("当前tokenId计数器:", currentTokenId.toString());
  
  console.log("\n=== NFT合约部署完成 ===");
  console.log("合约地址:", nftAddress);
  console.log("请保存这个地址，用于后续的拍卖合约部署");
  
  return nftAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });