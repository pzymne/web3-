const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署 SimpleERC20 合约...\n");
  
  // 合约参数 - 与测试套件保持一致
  const TOKEN_NAME = "SimpleToken";
  const TOKEN_SYMBOL = "STK";
  const INITIAL_SUPPLY = 1000000; // 100万代币，合约内部会乘以 10**18
  
  console.log("📝 部署参数:");
  console.log(`   代币名称: ${TOKEN_NAME}`);
  console.log(`   代币符号: ${TOKEN_SYMBOL}`);
  console.log(`   初始供应量: ${INITIAL_SUPPLY.toLocaleString()} ${TOKEN_SYMBOL}`);
  console.log(`   注意: 合约内部会将供应量乘以 10^18 (18位小数)`);
  
  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👤 部署者地址: ${deployer.address}`);
  console.log(`   账户余额: ${hre.ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);
  
  console.log("⏳ 正在部署合约...");
  
  // 部署合约 - 传入原始数字，合约内部会处理转换
  const SimpleERC20 = await hre.ethers.getContractFactory("SimpleERC20");
  const token = await SimpleERC20.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    INITIAL_SUPPLY  // 注意：这里传入的是 1000000，不是 parseEther("1000000")
  );
  
  console.log("⏳ 等待合约确认...");
  await token.deployed();
  
  console.log("\n✅ 合约部署成功!");
  console.log(`📌 合约地址: ${token.address}`);
  
  // 验证合约信息
  console.log("\n🔍 验证合约信息:");
  console.log("=".repeat(50));
  console.log(`   代币名称: ${await token.name()}`);
  console.log(`   代币符号: ${await token.symbol()}`);
  console.log(`   小数位数: ${await token.decimals()}`);
  
  const totalSupply = await token.totalSupply();
  const expectedSupply = hre.ethers.BigNumber.from("1000000")
    .mul(hre.ethers.BigNumber.from("10").pow(18));
  
  console.log(`\n   实际总供应量: ${hre.ethers.utils.formatEther(totalSupply)} ${TOKEN_SYMBOL}`);
  console.log(`   期望总供应量: ${hre.ethers.utils.formatEther(expectedSupply)} ${TOKEN_SYMBOL}`);
  
  if (totalSupply.eq(expectedSupply)) {
    console.log("   ✅ 总供应量正确");
  } else {
    console.log("   ❌ 总供应量不正确");
  }
  
  console.log(`\n   合约所有者: ${await token.owner()}`);
  console.log(`   部署者余额: ${hre.ethers.utils.formatEther(await token.balanceOf(deployer.address))} ${TOKEN_SYMBOL}`);
  console.log("=".repeat(50));
  
  // 保存部署信息到文件
  saveDeploymentInfo(token, deployer.address, {
    name: TOKEN_NAME,
    symbol: TOKEN_SYMBOL,
    initialSupply: INITIAL_SUPPLY,
    expectedSupply: expectedSupply.toString()
  });
  
  // 生成验证命令
  const verificationCommand = `npx hardhat verify --network ${hre.network.name} ${token.address} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" ${INITIAL_SUPPLY}`;
  console.log(`\n🔗 验证命令:\n   ${verificationCommand}`);
  
  return token;
}

// 保存部署信息到文件
function saveDeploymentInfo(token, deployer, config) {
  const fs = require("fs");
  const path = require("path");
  
  const info = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contract: {
      name: "SimpleERC20",
      address: token.address,
      deployer: deployer
    },
    token: {
      name: config.name,
      symbol: config.symbol,
      decimals: 18,
      initialSupplyRaw: config.initialSupply,
      initialSupplyFormatted: `${config.initialSupply.toLocaleString()} ${config.symbol}`,
      expectedSupply: config.expectedSupply,
      expectedSupplyFormatted: hre.ethers.utils.formatEther(config.expectedSupply)
    },
    verificationCommand: `npx hardhat verify --network ${hre.network.name} ${token.address} "${config.name}" "${config.symbol}" ${config.initialSupply}`
  };
  
  const dir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filePath = path.join(dir, `${hre.network.name}-${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(info, null, 2));
  
  console.log(`\n💾 部署信息已保存到: ${filePath}`);
}

// 错误处理
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });