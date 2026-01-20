// test/NFT.test.js
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

/**
 * @title NFT合约测试
 * @dev 测试NFT合约的所有功能
 */
describe("NFT Contract", function () {
  let NFT, nft;
  let owner, addr1, addr2;
  
  /**
   * @dev 测试前的设置
   * 在每个测试用例之前运行
   */
  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // 部署NFT合约（使用UUPS升级模式）
    NFT = await ethers.getContractFactory("NFT");
    nft = await upgrades.deployProxy(
      NFT,
      ["AuctionNFT", "ANFT"], // 构造函数参数
      { 
        initializer: "initialize", // 初始化函数名
        kind: "uups" // UUPS升级模式
      }
    );
  });

  describe("部署测试", function () {
    it("应该正确设置名称和符号", async function () {
      expect(await nft.name()).to.equal("AuctionNFT");
      expect(await nft.symbol()).to.equal("ANFT");
    });

    it("应该正确设置所有者", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("应该返回正确的版本", async function () {
      expect(await nft.version()).to.equal("1.0.0");
    });
  });

  describe("铸造功能测试", function () {
    it("应该成功铸造单个NFT", async function () {
      const tx = await nft.mint(addr1.address);
      await tx.wait();
      
      // 验证NFT所有权
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      
      // 验证tokenId递增
      expect(await nft.getCurrentTokenId()).to.equal(2); // 下一个可用tokenId
    });

    it("应该成功批量铸造NFT", async function () {
      const count = 3;
      const tx = await nft.mintBatch(addr1.address, count);
      await tx.wait();
      
      // 验证铸造数量
      expect(await nft.balanceOf(addr1.address)).to.equal(count);
      
      // 验证每个NFT的所有权
      for (let i = 1; i <= count; i++) {
        expect(await nft.ownerOf(i)).to.equal(addr1.address);
      }
      
      // 验证tokenId计数器
      expect(await nft.getCurrentTokenId()).to.equal(count + 1);
    });

    it("应该拒绝铸造到零地址", async function () {
      await expect(
        nft.mint(ethers.ZeroAddress)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("应该限制批量铸造数量", async function () {
      // 测试超过限制的情况
      await expect(
        nft.mintBatch(addr1.address, 101)
      ).to.be.revertedWith("Count must be 1-100");
      
      // 测试零数量的情况
      await expect(
        nft.mintBatch(addr1.address, 0)
      ).to.be.revertedWith("Count must be 1-100");
    });
  });

  describe("转移功能测试", function () {
    beforeEach(async function () {
      // 先铸造一个NFT
      await nft.mint(owner.address);
    });

    it("应该允许所有者转移NFT", async function () {
      await nft.transferFrom(owner.address, addr1.address, 1);
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
    });

    it("应该允许授权用户转移NFT", async function () {
      // 授权addr1转移tokenId 1
      await nft.approve(addr1.address, 1);
      
      // addr1转移NFT到addr2
      await nft.connect(addr1).transferFrom(owner.address, addr2.address, 1);
      
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });

    it("应该允许设置全局授权", async function () {
      // 设置addr1为全局授权
      await nft.setApprovalForAll(addr1.address, true);
      
      // addr1转移NFT
      await nft.connect(addr1).transferFrom(owner.address, addr2.address, 1);
      
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });

    it("应该拒绝未授权的转移", async function () {
      await expect(
        nft.connect(addr1).transferFrom(owner.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(nft, "ERC721InsufficientApproval");
    });
  });

  describe("URI功能测试", function () {
    beforeEach(async function () {
      await nft.mint(owner.address);
    });

    it("应该返回正确的tokenURI", async function () {
      // 设置基础URI
      const baseURI = "https://api.nft.com/metadata/";
      await nft.setBaseURI(baseURI);
      
      // 验证tokenURI
      const tokenURI = await nft.tokenURI(1);
      expect(tokenURI).to.equal(`${baseURI}/1`);
    });

    it("应该拒绝查询不存在的tokenURI", async function () {
      await expect(
        nft.tokenURI(999)
      ).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
    });
  });

  describe("可升级性测试", function () {
    it("应该允许合约升级", async function () {
      // 部署新版本合约
      const NFTV2 = await ethers.getContractFactory("NFTV2");
      
      // 升级合约
      const nftV2 = await upgrades.upgradeProxy(
        await nft.getAddress(),
        NFTV2
      );
      
      // 验证升级成功
      expect(await nftV2.version()).to.equal("2.0.0");
    });

    it("应该保留数据在升级后", async function () {
      // 先铸造一些NFT
      await nft.mint(addr1.address);
      await nft.mint(addr2.address);
      
      // 升级合约
      const NFTV2 = await ethers.getContractFactory("NFTV2");
      const nftV2 = await upgrades.upgradeProxy(
        await nft.getAddress(),
        NFTV2
      );
      
      // 验证数据保留
      expect(await nftV2.ownerOf(1)).to.equal(addr1.address);
      expect(await nftV2.ownerOf(2)).to.equal(addr2.address);
      expect(await nftV2.balanceOf(addr1.address)).to.equal(1);
    });
  });
});