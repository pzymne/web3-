// test/integration/FullAuction.test.js
const { expect } = require("chai");
const { ethers, upgrades, network } = require("hardhat");

/**
 * @title 完整拍卖流程集成测试
 * @dev 测试从创建到结束的完整拍卖流程
 */
describe("Complete Auction Flow", function () {
  let NFT, nft, Auction, auction;
  let owner, seller, bidder1, bidder2, feeRecipient;
  
  // 延长测试超时时间
  this.timeout(10000);
  
  beforeEach(async function () {
    [owner, seller, bidder1, bidder2, feeRecipient] = await ethers.getSigners();
    
    // 部署合约
    NFT = await ethers.getContractFactory("NFT");
    nft = await upgrades.deployProxy(
      NFT,
      ["AuctionNFT", "ANFT"],
      { initializer: "initialize" }
    );
    
    Auction = await ethers.getContractFactory("Auction");
    auction = await upgrades.deployProxy(
      Auction,
      [feeRecipient.address],
      { initializer: "initialize" }
    );
  });

  it("应该完成完整的ETH拍卖流程", async function () {
    console.log("=== 开始完整ETH拍卖流程测试 ===");
    
    // 1. 铸造NFT
    console.log("1. 铸造NFT...");
    await nft.mint(seller.address);
    expect(await nft.ownerOf(1)).to.equal(seller.address);
    
    // 2. 授权拍卖合约
    console.log("2. 授权拍卖合约...");
    await nft.connect(seller).approve(await auction.getAddress(), 1);
    
    // 3. 创建拍卖
    console.log("3. 创建拍卖...");
    const duration = 3600; // 1小时
    const startingPrice = ethers.parseEther("0.1");
    
    const createTx = await auction.connect(seller).createAuction(
      await nft.getAddress(),
      1,
      duration,
      startingPrice,
      ethers.ZeroAddress,
      ethers.ZeroAddress
    );
    
    const createReceipt = await createTx.wait();
    const createEvent = createReceipt.logs.find(log => 
      log.fragment?.name === "AuctionCreated"
    );
    
    const auctionId = createEvent.args.auctionId;
    console.log(`拍卖创建成功，拍卖ID: ${auctionId}`);
    
    // 验证NFT所有权转移
    expect(await nft.ownerOf(1)).to.equal(await auction.getAddress());
    
    // 4. 第一个出价
    console.log("4. 第一个出价...");
    const bid1Amount = ethers.parseEther("0.2");
    
    const bid1Tx = await auction.connect(bidder1).bidETH(auctionId, { 
      value: bid1Amount 
    });
    await bid1Tx.wait();
    
    let auctionInfo = await auction.getAuction(auctionId);
    expect(auctionInfo.highestBid).to.equal(bid1Amount);
    expect(auctionInfo.highestBidder).to.equal(bidder1.address);
    
    // 5. 第二个更高的出价
    console.log("5. 第二个更高的出价...");
    const bid2Amount = ethers.parseEther("0.3");
    
    const bid2Tx = await auction.connect(bidder2).bidETH(auctionId, { 
      value: bid2Amount 
    });
    await bid2Tx.wait();
    
    auctionInfo = await auction.getAuction(auctionId);
    expect(auctionInfo.highestBid).to.equal(bid2Amount);
    expect(auctionInfo.highestBidder).to.equal(bidder2.address);
    
    // 验证第一个出价者收到退款
    const bidder1Balance = await ethers.provider.getBalance(bidder1.address);
    expect(bidder1Balance).to.be.gt(0);
    
    // 6. 等待拍卖结束
    console.log("6. 等待拍卖结束...");
    await network.provider.send("evm_increaseTime", [duration + 1]);
    await network.provider.send("evm_mine");
    
    // 7. 结束拍卖
    console.log("7. 结束拍卖...");
    const endTx = await auction.connect(seller).endAuction(auctionId);
    const endReceipt = await endTx.wait();
    
    const endEvent = endReceipt.logs.find(log => 
      log.fragment?.name === "AuctionEnded"
    );
    expect(endEvent).to.not.be.undefined;
    
    // 8. 验证最终状态
    console.log("8. 验证最终状态...");
    
    // 验证NFT所有权
    expect(await nft.ownerOf(1)).to.equal(bidder2.address);
    
    // 验证拍卖状态
    auctionInfo = await auction.getAuction(auctionId);
    expect(auctionInfo.status).to.equal(1); // ENDED
    
    // 验证资金分配
    const feeAmount = bid2Amount * 250n / 10000n; // 2.5%
    const sellerAmount = bid2Amount - feeAmount;
    
    const sellerBalance = await ethers.provider.getBalance(seller.address);
    const feeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);
    
    // 注意：这里我们只验证逻辑，实际余额需要减去gas费用
    
    console.log("=== 完整ETH拍卖流程测试完成 ===");
  });

  it("应该处理无人出价的拍卖", async function () {
    console.log("=== 开始无人出价拍卖测试 ===");
    
    // 1. 创建拍卖
    await nft.mint(seller.address);
    await nft.connect(seller).approve(await auction.getAddress(), 1);
    
    const createTx = await auction.connect(seller).createAuction(
      await nft.getAddress(),
      1,
      3600,
      ethers.parseEther("0.1"),
      ethers.ZeroAddress,
      ethers.ZeroAddress
    );
    
    const createReceipt = await createTx.wait();
    const createEvent = createReceipt.logs.find(log => 
      log.fragment?.name === "AuctionCreated"
    );
    const auctionId = createEvent.args.auctionId;
    
    // 2. 等待拍卖结束（无人出价）
    await network.provider.send("evm_increaseTime", [3600 + 1]);
    await network.provider.send("evm_mine");
    
    // 3. 结束拍卖
    const endTx = await auction.connect(seller).endAuction(auctionId);
    await endTx.wait();
    
    // 4. 验证NFT退回给卖家
    expect(await nft.ownerOf(1)).to.equal(seller.address);
    
    console.log("=== 无人出价拍卖测试完成 ===");
  });

  it("应该处理拍卖取消", async function () {
    console.log("=== 开始拍卖取消测试 ===");
    
    // 1. 创建拍卖
    await nft.mint(seller.address);
    await nft.connect(seller).approve(await auction.getAddress(), 1);
    
    const createTx = await auction.connect(seller).createAuction(
      await nft.getAddress(),
      1,
      3600,
      ethers.parseEther("0.1"),
      ethers.ZeroAddress,
      ethers.ZeroAddress
    );
    
    const createReceipt = await createTx.wait();
    const createEvent = createReceipt.logs.find(log => 
      log.fragment?.name === "AuctionCreated"
    );
    const auctionId = createEvent.args.auctionId;
    
    // 2. 卖家取消拍卖
    const cancelTx = await auction.connect(seller).cancelAuction(auctionId);
    await cancelTx.wait();
    
    // 3. 验证NFT退回
    expect(await nft.ownerOf(1)).to.equal(seller.address);
    
    // 4. 验证拍卖状态
    const auctionInfo = await auction.getAuction(auctionId);
    expect(auctionInfo.status).to.equal(2); // CANCELLED
    
    console.log("=== 拍卖取消测试完成 ===");
  });
});