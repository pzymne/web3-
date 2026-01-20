// test/Auction.test.js
const { expect } = require("chai");
const { ethers, upgrades, network } = require("hardhat");

/**
 * @title 拍卖合约测试
 * @dev 测试拍卖合约的所有功能，包括Chainlink预言机集成
 */
describe("Auction Contract", function () {
  let NFT, nft, Auction, auction;
  let owner, seller, bidder1, bidder2, feeRecipient;
  let auctionId;
  
  // 测试常量
  const DURATION = 3600; // 1小时
  const STARTING_PRICE = ethers.parseEther("0.1");
  const HIGHER_BID = ethers.parseEther("0.2");
  const LOWER_BID = ethers.parseEther("0.15");
  
  /**
   * @dev 测试前的设置
   */
  beforeEach(async function () {
    // 获取测试账户
    [owner, seller, bidder1, bidder2, feeRecipient] = await ethers.getSigners();
    
    // 部署NFT合约
    NFT = await ethers.getContractFactory("NFT");
    nft = await upgrades.deployProxy(
      NFT,
      ["AuctionNFT", "ANFT"],
      { initializer: "initialize" }
    );
    
    // 部署拍卖合约
    Auction = await ethers.getContractFactory("Auction");
    auction = await upgrades.deployProxy(
      Auction,
      [feeRecipient.address],
      { initializer: "initialize" }
    );
    
    // 铸造测试NFT并授权给拍卖合约
    await nft.mint(seller.address);
    await nft.connect(seller).approve(await auction.getAddress(), 1);
  });

  describe("部署和初始化测试", function () {
    it("应该正确初始化参数", async function () {
      expect(await auction.owner()).to.equal(owner.address);
      expect(await auction.platformFeeRecipient()).to.equal(feeRecipient.address);
      expect(await auction.platformFee()).to.equal(250); // 2.5%
      expect(await auction.minAuctionDuration()).to.equal(3600); // 1小时
      expect(await auction.maxAuctionDuration()).to.equal(2592000); // 30天
    });

    it("应该设置ETH价格Feed", async function () {
      const ethPriceFeed = await auction.tokenPriceFeeds(ethers.ZeroAddress);
      expect(ethPriceFeed).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("拍卖创建测试", function () {
    it("应该成功创建拍卖", async function () {
      const tx = await auction.connect(seller).createAuction(
        await nft.getAddress(),
        1,
        DURATION,
        STARTING_PRICE,
        ethers.ZeroAddress, // ETH支付
        ethers.ZeroAddress  // ETH价格Feed
      );
      
      const receipt = await tx.wait();
      
      // 验证事件
      const event = receipt.logs.find(log => 
        log.fragment?.name === "AuctionCreated"
      );
      expect(event).to.not.be.undefined;
      
      auctionId = event.args.auctionId;
      const auctionInfo = await auction.getAuction(auctionId);
      
      // 验证拍卖信息
      expect(auctionInfo.seller).to.equal(seller.address);
      expect(auctionInfo.nftContract).to.equal(await nft.getAddress());
      expect(auctionInfo.tokenId).to.equal(1);
      expect(auctionInfo.startingPrice).to.equal(STARTING_PRICE);
      expect(auctionInfo.paymentToken).to.equal(ethers.ZeroAddress);
      expect(auctionInfo.status).to.equal(0); // ACTIVE
      
      // 验证NFT所有权转移
      expect(await nft.ownerOf(1)).to.equal(await auction.getAddress());
    });

    it("应该拒绝无效的持续时间", async function () {
      // 测试太短的持续时间
      await expect(
        auction.connect(seller).createAuction(
          await nft.getAddress(),
          1,
          3599, // 小于1小时
          STARTING_PRICE,
          ethers.ZeroAddress,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Duration too short");
      
      // 测试太长的持续时间
      await expect(
        auction.connect(seller).createAuction(
          await nft.getAddress(),
          1,
          2592001, // 大于30天
          STARTING_PRICE,
          ethers.ZeroAddress,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Duration too long");
    });

    it("应该拒绝零起拍价", async function () {
      await expect(
        auction.connect(seller).createAuction(
          await nft.getAddress(),
          1,
          DURATION,
          0, // 零起拍价
          ethers.ZeroAddress,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Starting price must be > 0");
    });

    it("应该拒绝重复上架同一NFT", async function () {
      // 先创建拍卖
      await auction.connect(seller).createAuction(
        await nft.getAddress(),
        1,
        DURATION,
        STARTING_PRICE,
        ethers.ZeroAddress,
        ethers.ZeroAddress
      );
      
      // 尝试再次创建同一NFT的拍卖
      await expect(
        auction.connect(seller).createAuction(
          await nft.getAddress(),
          1,
          DURATION,
          STARTING_PRICE,
          ethers.ZeroAddress,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("NFT already in auction");
    });

    it("应该拒绝未授权的NFT", async function () {
      // 铸造新NFT但不授权
      await nft.mint(seller.address);
      
      await expect(
        auction.connect(seller).createAuction(
          await nft.getAddress(),
          2,
          DURATION,
          STARTING_PRICE,
          ethers.ZeroAddress,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("NFT not approved");
    });
  });

  describe("ETH出价测试", function () {
    beforeEach(async function () {
      // 创建拍卖
      const tx = await auction.connect(seller).createAuction(
        await nft.getAddress(),
        1,
        DURATION,
        STARTING_PRICE,
        ethers.ZeroAddress,
        ethers.ZeroAddress
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.fragment?.name === "AuctionCreated"
      );
      auctionId = event.args.auctionId;
    });

    it("应该接受有效的ETH出价", async function () {
      const bidAmount = HIGHER_BID;
      
      // 验证出价事件
      await expect(
        auction.connect(bidder1).bidETH(auctionId, { value: bidAmount })
      )
        .to.emit(auction, "BidPlaced")
        .withArgs(auctionId, bidder1.address, bidAmount, expect.any(Object));
      
      // 验证拍卖状态更新
      const auctionInfo = await auction.getAuction(auctionId);
      expect(auctionInfo.highestBid).to.equal(bidAmount);
      expect(auctionInfo.highestBidder).to.equal(bidder1.address);
      
      // 验证出价记录
      const bids = await auction.getAuctionBids(auctionId);
      expect(bids.length).to.equal(1);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[0].amount).to.equal(bidAmount);
    });

    it("应该拒绝低于起拍价的出价", async function () {
      const lowBid = ethers.parseEther("0.05");
      
      await expect(
        auction.connect(bidder1).bidETH(auctionId, { value: lowBid })
      ).to.be.revertedWith("Bid below starting price");
    });

    it("应该拒绝低于最高出价的出价", async function () {
      // 第一个出价
      await auction.connect(bidder1).bidETH(auctionId, { value: HIGHER_BID });
      
      // 第二个较低的出价
      await expect(
        auction.connect(bidder2).bidETH(auctionId, { value: LOWER_BID })
      ).to.be.revertedWith("Bid too low");
    });

    it("应该正确退还前一个出价者的ETH", async function () {
      const initialBalance1 = await ethers.provider.getBalance(bidder1.address);
      const initialBalance2 = await ethers.provider.getBalance(bidder2.address);
      
      // 第一个出价
      const tx1 = await auction.connect(bidder1).bidETH(auctionId, { 
        value: LOWER_BID 
      });
      const receipt1 = await tx1.wait();
      const gasUsed1 = receipt1.gasUsed * receipt1.gasPrice;
      
      // 第二个更高的出价
      const tx2 = await auction.connect(bidder2).bidETH(auctionId, { 
        value: HIGHER_BID 
      });
      const receipt2 = await tx2.wait();
      const gasUsed2 = receipt2.gasUsed * receipt2.gasPrice;
      
      const finalBalance1 = await ethers.provider.getBalance(bidder1.address);
      const finalBalance2 = await ethers.provider.getBalance(bidder2.address);
      
      // 验证bidder1收到了退款（减去gas费用）
      // 由于gas费用的不确定性，我们检查大致相等
      const expectedBalance1 = initialBalance1 - gasUsed1;
      expect(finalBalance1).to.be.closeTo(expectedBalance1, ethers.parseEther("0.01"));
      
      // 验证bidder2支付了ETH（减去gas费用）
      const expectedBalance2 = initialBalance2 - HIGHER_BID - gasUsed2;
      expect(finalBalance2).to.be.closeTo(expectedBalance2, ethers.parseEther("0.01"));
    });

    it("应该正确计算USD价值", async function () {
      const bidAmount = HIGHER_BID;
      await auction.connect(bidder1).bidETH(auctionId, { value: bidAmount });
      
      const usdValue = await auction.getBidUSDValue(auctionId, bidAmount);
      
      // USD价值应该大于0
      expect(usdValue).to.be.gt(0);
      
      // 验证事件中的USD价值
      const bids = await auction.getAuctionBids(auctionId);
      expect(bids[0].amount).to.equal(bidAmount);
    });
  });

  describe("拍卖结束测试", function () {
    beforeEach(async function () {
      // 创建拍卖
      const tx = await auction.connect(seller).createAuction(
        await nft.getAddress(),
        1,
        DURATION,
        STARTING_PRICE,
        ethers.ZeroAddress,
        ethers.ZeroAddress
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.fragment?.name === "AuctionCreated"
      );
      auctionId = event.args.auctionId;
      
      // 出价
      await auction.connect(bidder1).bidETH(auctionId, { 
        value: HIGHER_BID 
      });
      
      // 推进时间到拍卖结束
      await network.provider.send("evm_increaseTime", [DURATION + 1]);
      await network.provider.send("evm_mine");
    });

    it("应该成功结束拍卖", async function () {
      await expect(
        auction.connect(seller).endAuction(auctionId)
      )
        .to.emit(auction, "AuctionEnded")
        .withArgs(auctionId, bidder1.address, HIGHER_BID, expect.any(Object));
      
      // 验证拍卖状态
      const auctionInfo = await auction.getAuction(auctionId);
      expect(auctionInfo.status).to.equal(1); // ENDED
      
      // 验证NFT所有权转移
      expect(await nft.ownerOf(1)).to.equal(bidder1.address);
      
      // 验证映射清理
      expect(await auction.userAuctions(await nft.getAddress(), 1)).to.equal(0);
    });

    it("应该正确分配资金", async function () {
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      const initialFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);
      
      const tx = await auction.connect(seller).endAuction(auctionId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      const finalFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);
      
      // 计算预期金额
      const feeAmount = HIGHER_BID * 250n / 10000n; // 2.5%手续费
      const sellerAmount = HIGHER_BID - feeAmount;
      
      // 验证卖家余额（考虑gas费用）
      expect(finalSellerBalance - initialSellerBalance + gasUsed).to.be.closeTo(
        sellerAmount,
        ethers.parseEther("0.001")
      );
      
      // 验证手续费接收者余额
      expect(finalFeeRecipientBalance - initialFeeRecipientBalance).to.equal(feeAmount);
    });

    it("应该允许卖家提前结束拍卖", async function () {
      // 创建新拍卖
      await nft.mint(seller.address);
      await nft.connect(seller).approve(await auction.getAddress(), 2);
      
      const tx = await auction.connect(seller).createAuction(
        await nft.getAddress(),
        2,
        DURATION,
        STARTING_PRICE,
        ethers.ZeroAddress,
        ethers.ZeroAddress
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.fragment?.name === "AuctionCreated"
      );
      const newAuctionId = event.args.auctionId;
      
      // 卖家立即结束拍卖（不等待时间结束）
      await auction.connect(seller).endAuction(newAuctionId);
      
      const auctionInfo = await auction.getAuction(newAuctionId);
      expect(auctionInfo.status).to.equal(1); // ENDED
    });

    it("应该拒绝非卖家结束拍卖", async function () {
      await expect(
        auction.connect(bidder2).endAuction(auctionId)
      ).to.be.revertedWith("Cannot end active auction");
    });
  });

  describe("拍卖取消测试", function () {
    beforeEach(async function () {
      // 创建拍卖（不出价）
      const tx = await auction.connect(seller).createAuction(
        await nft.getAddress(),
        1,
        DURATION,
        STARTING_PRICE,
        ethers.ZeroAddress,
        ethers.ZeroAddress
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.fragment?.name === "AuctionCreated"
      );
      auctionId = event.args.auctionId;
    });

    it("应该允许卖家取消拍卖", async function () {
      await expect(
        auction.connect(seller).cancelAuction(auctionId)
      )
        .to.emit(auction, "AuctionCancelled")
        .withArgs(auctionId);
      
      // 验证拍卖状态
      const auctionInfo = await auction.getAuction(auctionId);
      expect(auctionInfo.status).to.equal(2); // CANCELLED
      
      // 验证NFT退回
      expect(await nft.ownerOf(1)).to.equal(seller.address);
      
      // 验证映射清理
      expect(await auction.userAuctions(await nft.getAddress(), 1)).to.equal(0);
    });

    it("应该允许所有者取消拍卖", async function () {
      await expect(
        auction.connect(owner).cancelAuction(auctionId)
      ).to.emit(auction, "AuctionCancelled");
    });

    it("应该拒绝非授权用户取消拍卖", async function () {
      await expect(
        auction.connect(bidder1).cancelAuction(auctionId)
      ).to.be.revertedWith("Not authorized");
    });

    it("应该拒绝有出价的拍卖取消", async function () {
      // 先出价
      await auction.connect(bidder1).bidETH(auctionId, { value: HIGHER_BID });
      
      // 尝试取消
      await expect(
        auction.connect(seller).cancelAuction(auctionId)
      ).to.be.revertedWith("Cannot cancel with bids");
    });
  });

  describe("管理功能测试", function () {
    it("应该允许所有者更新平台手续费", async function () {
      const newFee = 500; // 5%
      
      await auction.connect(owner).setPlatformFee(newFee);
      expect(await auction.platformFee()).to.equal(newFee);
    });

    it("应该拒绝过高手续费", async function () {
      const highFee = 1500; // 15%，超过10%限制
      
      await expect(
        auction.connect(owner).setPlatformFee(highFee)
      ).to.be.revertedWith("Fee too high");
    });

    it("应该允许所有者更新手续费接收者", async function () {
      const newRecipient = bidder1.address;
      
      await auction.connect(owner).setPlatformFeeRecipient(newRecipient);
      expect(await auction.platformFeeRecipient()).to.equal(newRecipient);
    });

    it("应该拒绝零地址作为接收者", async function () {
      await expect(
        auction.connect(owner).setPlatformFeeRecipient(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("应该允许所有者设置拍卖持续时间限制", async function () {
      const newMin = 7200; // 2小时
      const newMax = 604800; // 7天
      
      await auction.connect(owner).setAuctionDurationLimits(newMin, newMax);
      
      expect(await auction.minAuctionDuration()).to.equal(newMin);
      expect(await auction.maxAuctionDuration()).to.equal(newMax);
    });

    it("应该拒绝无效的持续时间限制", async function () {
      await expect(
        auction.connect(owner).setAuctionDurationLimits(0, 100)
      ).to.be.revertedWith("Invalid durations");
      
      await expect(
        auction.connect(owner).setAuctionDurationLimits(100, 50)
      ).to.be.revertedWith("Invalid durations");
    });
  });

  describe("Chainlink预言机集成测试", function () {
    it("应该正确获取ETH/USD价格", async function () {
      // 创建拍卖来测试价格转换
      const tx = await auction.connect(seller).createAuction(
        await nft.getAddress(),
        1,
        DURATION,
        STARTING_PRICE,
        ethers.ZeroAddress,
        ethers.ZeroAddress
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.fragment?.name === "AuctionCreated"
      );
      const testAuctionId = event.args.auctionId;
      
      // 获取USD价值
      const usdValue = await auction.getBidUSDValue(
        testAuctionId,
        ethers.parseEther("1")
      );
      
      // USD价值应该大于0（除非ETH价格为0，这不会发生）
      expect(usdValue).to.be.gt(0);
    });

    it("应该允许设置代币价格Feed", async function () {
      const testToken = bidder1.address;
      const testPriceFeed = bidder2.address;
      
      await expect(
        auction.connect(owner).setTokenPriceFeed(testToken, testPriceFeed)
      )
        .to.emit(auction, "PriceFeedSet")
        .withArgs(testToken, testPriceFeed);
      
      expect(await auction.tokenPriceFeeds(testToken)).to.equal(testPriceFeed);
    });
  });

  describe("统计功能测试", function () {
    beforeEach(async function () {
      // 创建多个拍卖
      for (let i = 0; i < 3; i++) {
        await nft.mint(seller.address);
        await nft.connect(seller).approve(await auction.getAddress(), i + 1);
        
        await auction.connect(seller).createAuction(
          await nft.getAddress(),
          i + 1,
          DURATION,
          STARTING_PRICE,
          ethers.ZeroAddress,
          ethers.ZeroAddress
        );
      }
    });

    it("应该返回正确的统计数据", async function () {
      const [totalAuctions, activeAuctions] = await auction.getStats();
      
      expect(totalAuctions).to.equal(3);
      expect(activeAuctions).to.equal(3);
      
      // 结束一个拍卖
      await network.provider.send("evm_increaseTime", [DURATION + 1]);
      await network.provider.send("evm_mine");
      await auction.connect(seller).endAuction(1);
      
      const [totalAfter, activeAfter] = await auction.getStats();
      
      expect(totalAfter).to.equal(3);
      expect(activeAfter).to.equal(2);
    });
  });
});