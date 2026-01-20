const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("SimpleStorageV2 测试", function () {
    let proxy;
    let owner, user;
    
    before(async function () {
        [owner, user] = await ethers.getSigners();
        
        // 部署V1然后升级到V2
        const SimpleStorageV1 = await ethers.getContractFactory("SimpleStorageV1");
        proxy = await upgrades.deployProxy(
            SimpleStorageV1,
            [100, "Test Storage"],
            { initializer: "initialize", kind: "uups" }
        );
        
        // 升级到V2
        const SimpleStorageV2 = await ethers.getContractFactory("SimpleStorageV2");
        proxy = await upgrades.upgradeProxy(
            await proxy.getAddress(),
            SimpleStorageV2,
            { 
                kind: "uups",
                call: { fn: "initializeV2", args: [] }
            }
        );
    });
    
    it("应该升级到V2版本", async function () {
        expect(await proxy.version()).to.equal("SimpleStorageV2.0.0");
    });
    
    it("应该保持V1的数据", async function () {
        expect(await proxy.value()).to.equal(100);
        expect(await proxy.getName()).to.equal("Test Storage");
    });
    
    it("应该添加lastUpdated功能", async function () {
        const lastUpdated = await proxy.lastUpdated();
        expect(lastUpdated).to.be.greaterThan(0);
        
        // setValue应该更新lastUpdated
        const before = await proxy.lastUpdated();
        await proxy.setValue(200);
        const after = await proxy.lastUpdated();
        expect(after).to.be.greaterThan(before);
    });
    
    it("应该支持批量增加", async function () {
        const before = await proxy.value();
        await proxy.batchIncrease([10, 20, 30]);
        expect(await proxy.value()).to.equal(before + 60n);
    });
    
    it("应该支持带时间戳的获取", async function () {
        const [value, timestamp] = await proxy.getValueWithTimestamp();
        expect(value).to.equal(await proxy.value());
        expect(timestamp).to.equal(await proxy.lastUpdated());
    });
    
    it("升级控制应该工作", async function () {
        // 部署V3用于测试
        const SimpleStorageV3 = await ethers.getContractFactory("SimpleStorageV2");
        const v3 = await SimpleStorageV3.deploy();
        
        // 检查canUpgrade
        const [canUpgrade, reason] = await proxy.canUpgrade(await v3.getAddress());
        console.log("是否可以升级:", canUpgrade, "原因:", reason);
    });
});