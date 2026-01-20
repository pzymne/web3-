// contracts/upgradable/AuctionV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Auction.sol";

/**
 * @title 拍卖合约V2版本
 * @dev 演示如何升级合约，添加新功能而不影响现有数据
 * 
 * 升级原则：
 * 1. 继承原合约
 * 2. 只能添加新状态变量，不能修改现有变量
 * 3. 新变量必须添加到所有现有变量之后
 * 4. 不能删除或修改现有函数签名
 */
contract AuctionV2 is Auction {
    // 新添加的状态变量（必须放在最后）
    uint256 public totalVolume; // 总交易量统计
    mapping(address => uint256) public userVolume; // 用户交易量统计
    
    // 新事件
    event VolumeUpdated(address indexed user, uint256 amount);
    
    // 保留现有存储布局 - 不要修改现有状态变量
    
    /**
     * @dev 重写endAuction函数以添加新功能
     */
    function endAuction(uint256 auctionId) public override nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(
            block.timestamp >= auction.endTime || msg.sender == auction.seller,
            "Cannot end active auction"
        );
        
        auction.status = AuctionStatus.ENDED;
        
        if (auction.highestBidder != address(0)) {
            // 记录交易量统计（新功能）
            totalVolume += auction.highestBid;
            userVolume[auction.seller] += auction.highestBid;
            userVolume[auction.highestBidder] += auction.highestBid;
            
            emit VolumeUpdated(auction.seller, auction.highestBid);
            emit VolumeUpdated(auction.highestBidder, auction.highestBid);
            
            // 原有逻辑保持不变
            IERC721Upgradeable nft = IERC721Upgradeable(auction.nftContract);
            nft.transferFrom(address(this), auction.highestBidder, auction.tokenId);
            
            uint256 feeAmount = (auction.highestBid * platformFee) / BASIS_POINTS;
            uint256 sellerAmount = auction.highestBid - feeAmount;
            
            if (auction.paymentToken == address(0)) {
                payable(platformFeeRecipient).transfer(feeAmount);
                payable(auction.seller).transfer(sellerAmount);
            } else {
                IERC20Upgradeable token = IERC20Upgradeable(auction.paymentToken);
                token.transfer(platformFeeRecipient, feeAmount);
                token.transfer(auction.seller, sellerAmount);
            }
            
            address priceFeed = auction.paymentToken == address(0) 
                ? address(0) 
                : tokenPriceFeeds[auction.paymentToken];
            uint256 usdValue = auction.highestBid.getConversionRate(priceFeed);
            
            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid, usdValue);
        } else {
            IERC721Upgradeable nft = IERC721Upgradeable(auction.nftContract);
            nft.transferFrom(address(this), auction.seller, auction.tokenId);
        }
        
        delete userAuctions[auction.nftContract][auction.tokenId];
    }
    
    /**
     * @dev 新功能：获取用户统计数据
     */
    function getUserStats(address user) external view returns (
        uint256 volume,
        uint256 auctionsCreated,
        uint256 auctionsWon
    ) {
        volume = userVolume[user];
        auctionsCreated = 0;
        auctionsWon = 0;
        
        // 统计用户创建的拍卖
        for (uint256 i = 1; i <= _auctionIds.current(); i++) {
            if (auctions[i].seller == user) {
                auctionsCreated++;
            }
            if (auctions[i].highestBidder == user) {
                auctionsWon++;
            }
        }
    }
    
    /**
     * @dev 新功能：批量获取拍卖信息
     */
    function getAuctionsBatch(
        uint256 start,
        uint256 count
    ) external view returns (Auction[] memory) {
        require(start > 0 && count > 0, "Invalid parameters");
        require(start + count - 1 <= _auctionIds.current(), "Out of range");
        
        Auction[] memory result = new Auction[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = auctions[start + i];
        }
        return result;
    }
    
    /**
     * @dev 覆盖版本信息
     */
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }
    
    /**
     * @dev 确保升级授权仍然有效
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}