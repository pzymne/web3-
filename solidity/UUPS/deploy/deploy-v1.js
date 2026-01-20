const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 部署 SimpleStorageV1...");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者:", deployer.address);
    
    // 编译合约
    await hre.run("compile");
    
    // 部署V1
    const SimpleStorageV1 = await ethers.getContractFactory("SimpleStorageV1");
    const proxy = await upgrades.deployProxy(
        SimpleStorageV1,
        [100, "Storage V1"],
        { 
            initializer: "initialize", 
            kind: "uups" 
        }
    );
    
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    
    // 获取实现地址
    const implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    
    console.log("\n✅ 部署完成!");
    console.log("代理合约:", proxyAddress);
    console.log("实现合约:", implementation);
    
    // 确保deployments目录存在
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // 保存部署信息
    const deployment = {
        network: hre.network.name,
        proxy: proxyAddress,
        implementation: implementation,
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };
    
    const deploymentFile = path.join(deploymentsDir, `v1-${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
    
    console.log("部署信息已保存到:", deploymentFile);
    
    // 测试基本功能
    console.log("\n🔧 测试基本功能...");
    console.log("初始值:", (await proxy.value()).toString());
    console.log("版本:", await proxy.version());
    
    await proxy.setValue(200);
    console.log("设置后值:", (await proxy.value()).toString());
    
    // 打印使用说明
    console.log("\n📋 下一步命令:");
    console.log("部署V2: npx hardhat run deploy/deploy-v2.js --network localhost");
}

main().catch((error) => {
    console.error("❌ 部署失败:", error.message);
    process.exit(1);
});