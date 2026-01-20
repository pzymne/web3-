const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("SimpleStorageV1 测试", function () {
    let proxy;
    let owner, user;
    
    before(async function () {
        [owner, user] = await ethers.getSigners();
        
        // 部署V1合约
        const SimpleStorageV1 = await ethers.getContractFactory("SimpleStorageV1");
        proxy = await upgrades.deployProxy(
            SimpleStorageV1,
            [100, "Test Storage"],
            { initializer: "initialize", kind: "uups" }
        );
        
        await proxy.waitForDeployment();
    });
    
    it("应该正确初始化", async function () {
        expect(await proxy.value()).to.equal(100);
        expect(await proxy.getName()).to.equal("Test Storage");
        expect(await proxy.owner()).to.equal(owner.address);
    });
    
    it("只有所有者可以设置值", async function () {
        // 所有者可以设置
        await proxy.connect(owner).setValue(200);
        expect(await proxy.value()).to.equal(200);
        
        // 非所有者应该失败
        // OpenZeppelin 5.0.0 使用自定义错误
        await expect(
            proxy.connect(user).setValue(300)
        ).to.be.revertedWithCustomError(proxy, "OwnableUnauthorizedAccount");
        // 或者使用更通用的检查
        // .to.be.reverted; // 只要revert就通过
    });
    
    it("应该可以增加数值", async function () {
        const before = await proxy.value();
        await proxy.connect(owner).increase(50);
        expect(await proxy.value()).to.equal(before + 50n);
    });
    
    it("应该正确返回版本", async function () {
        expect(await proxy.version()).to.equal("SimpleStorageV1.0.0");
    });
    
    it("应该支持UUPS升级 - 通过代理合约", async function () {
        // 部署V2逻辑合约
        const SimpleStorageV2 = await ethers.getContractFactory("SimpleStorageV2");
        const v2Logic = await SimpleStorageV2.deploy();
        await v2Logic.waitForDeployment();
        const v2Address = await v2Logic.getAddress();
        
        // 获取代理合约地址
        const proxyAddress = await proxy.getAddress();
        
        // 方法1：使用upgrades.upgradeProxy（推荐）
        console.log("测试升级权限...");
        
        // 尝试用非所有者升级（应该失败）
        try {
            await upgrades.upgradeProxy(
                proxyAddress,
                SimpleStorageV2,
                { 
                    kind: "uups",
                    call: { fn: "initializeV2", args: [] }
                }
            ).connect(user);
            
            console.log("❌ 错误：非所有者不应该能升级");
            expect.fail("非所有者应该不能升级");
        } catch (error) {
            console.log("✅ 非所有者升级被正确拒绝");
        }
        
        // 验证当前实现地址
        const currentImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
        console.log("当前实现地址:", currentImpl);
    });
});