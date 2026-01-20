// scripts/deploy/02_deploy_auction.js
const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

/**
 * @title 拍卖合约部署脚本
 * @dev 部署可升级的拍卖合约，集成Chainlink预言机
 */
async function main() {
  console.log("=== 开始部署拍卖合约 ===");
  
  // 获取账户
  const [deployer, feeRecipient] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("手续费接收地址:", feeRecipient.address);
  console.log("部署者余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // 检查环境变量
  const ethPriceFeed = process.env.CHAINLINK_ETH_USD_PRICE_FEED;
  if (!ethPriceFeed) {
    console.warn("警告: 未设置CHAINLINK_ETH_USD_PRICE_FEED环境变量");
    console.warn("使用默认的Sepolia测试网ETH/USD价格Feed");
  }
  
  console.log("ETH/USD价格Feed地址:", ethPriceFeed || "0x694AA1769357215DE4FAC081bf1f309aDC325306");
  
  // 部署拍卖合约
  console.log("\n1. 部署拍卖合约...");
  const Auction = await ethers.getContractFactory("Auction");
  
  const auction = await upgrades.deployProxy(
    Auction,
    [feeRecipient.address], // 初始化参数：手续费接收地址
    {
      initializer: "initialize",
      kind: "uups",
      timeout: 0
    }
  );
  
  // 等待部署
  console.log("等待部署交易确认...");
  await auction.waitForDeployment();
  
  const auctionAddress = await auction.getAddress();
  console.log("拍卖合约地址:", auctionAddress);
  
  // 获取实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(auctionAddress);
  console.log("实现合约地址:", implementationAddress);
  
  // 验证合约初始化
  console.log("\n2. 验证合约初始化...");
  
  const platformFee = await auction.platformFee();
  const platformFeeRecipient = await auction.platformFeeRecipient();
  const minDuration = await auction.minAuctionDuration();
  const maxDuration = await auction.maxAuctionDuration();
  
  console.log("平台手续费:", platformFee.toString(), "基点 (100 = 1%)");
  console.log("手续费接收地址:", platformFeeRecipient);
  console.log("最小拍卖时长:", minDuration.toString(), "秒");
  console.log("最大拍卖时长:", maxDuration.toString(), "秒");
  
  // 检查ETH价格Feed设置
  const ethFeed = await auction.tokenPriceFeeds(ethers.ZeroAddress);
  console.log("ETH价格Feed设置:", ethFeed);
  
  // 测试价格转换
  console.log("\n3. 测试Chainlink预言机集成...");
  try {
    // 测试获取1 ETH的USD价值
    const usdValue = await auction.getBidUSDValue(
      0, // 使用0作为测试，实际需要有效的拍卖ID
      ethers.parseEther("1")
    );
    console.log("1 ETH ≈", ethers.formatUnits(usdValue, 8), "USD");
  } catch (error) {
    console.log("价格转换测试失败（可能需要有效的拍卖ID）:", error.message);
  }
  
  // 获取合约版本
  const version = await auction.version();
  console.log("合约版本:", version);
  
  console.log("\n=== 拍卖合约部署完成 ===");
  console.log("合约地址:", auctionAddress);
  console.log("\n下一步:");
  console.log("1. 在拍卖合约中设置支持的ERC20代币价格Feed");
  console.log("2. 将NFT合约授权给拍卖合约");
  console.log("3. 开始创建拍卖!");
  
  return auctionAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });