const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 升级到 SimpleStorageV2...");
    
    const [deployer] = await ethers.getSigners();
    
    // 确保deployments目录存在
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // 加载V1部署信息
    const v1File = path.join(deploymentsDir, `v1-${hre.network.name}.json`);
    if (!fs.existsSync(v1File)) {
        console.log("❌ 请先部署V1合约");
        console.log("运行: npx hardhat run deploy/deploy-v1.js --network localhost");
        return;
    }
    
    const v1Deployment = JSON.parse(fs.readFileSync(v1File, "utf8"));
    const proxyAddress = v1Deployment.proxy;
    
    console.log("V1代理地址:", proxyAddress);
    
    // 编译合约
    await hre.run("compile");
    
    // 获取V1合约实例
    const SimpleStorageV1 = await ethers.getContractFactory("SimpleStorageV1");
    const v1Contract = await SimpleStorageV1.attach(proxyAddress);
    
    // 记录升级前状态
    const oldValue = await v1Contract.value();
    const oldOwner = await v1Contract.owner();
    const oldVersion = await v1Contract.version();
    
    console.log("\n📊 升级前状态:");
    console.log("值:", oldValue.toString());
    console.log("版本:", oldVersion);
    
    // 部署V2并升级
    const SimpleStorageV2 = await ethers.getContractFactory("SimpleStorageV2");
    
    console.log("\n🔄 正在升级...");
    const v2Contract = await upgrades.upgradeProxy(
        proxyAddress,
        SimpleStorageV2,
        { 
            kind: "uups",
            call: { fn: "initializeV2", args: [] }
        }
    );
    
    await v2Contract.waitForDeployment();
    
    // 验证升级
    const newImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    const newValue = await v2Contract.value();
    const newVersion = await v2Contract.version();
    
    console.log("\n✅ 升级完成!");
    console.log("新实现地址:", newImplementation);
    console.log("新版本:", newVersion);
    
    // 验证数据持久性
    console.log("\n🔍 验证数据:");
    console.log("值是否保持:", newValue.toString() === oldValue.toString() ? "✅" : "❌");
    console.log("所有者是否相同:", (await v2Contract.owner()) === oldOwner ? "✅" : "❌");
    
    // 测试V2新功能
    console.log("\n🔧 测试V2新功能:");
    const lastUpdated = await v2Contract.lastUpdated();
    console.log("最后更新时间:", lastUpdated.toString());
    
    await v2Contract.setValue(300);
    console.log("V2 setValue后值:", (await v2Contract.value()).toString());
    
    // 保存部署信息
    const deployment = {
        network: hre.network.name,
        proxy: proxyAddress,
        implementation: newImplementation,
        v1Implementation: v1Deployment.implementation,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        upgraded: {
            fromVersion: oldVersion,
            toVersion: newVersion,
            valuePersisted: newValue.toString() === oldValue.toString()
        }
    };
    
    const deploymentFile = path.join(deploymentsDir, `v2-${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
    
    console.log("部署信息已保存到:", deploymentFile);
    
    // 打印使用说明
    console.log("\n📋 下一步命令:");
    console.log("验证代理: npx hardhat run scripts/verify-proxy.js --network localhost");
}

main().catch((error) => {
    console.error("❌ 升级失败:", error.message);
    process.exit(1);
});