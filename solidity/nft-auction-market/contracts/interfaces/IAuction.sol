// contracts/interfaces/IAuction.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title 拍卖合约接口
 * @dev 定义拍卖合约的标准接口
 */
interface IAuction {
    /**
     * @dev 拍卖状态枚举
     * ACTIVE - 拍卖进行中
     * ENDED - 拍卖已结束
     * CANCELLED - 拍卖已取消
     */
    enum AuctionStatus {
        ACTIVE,
        ENDED,
        CANCELLED
    }
    
    /**
     * @dev 支付代币类型枚举
     * ETH - 以太坊支付
     * ERC20 - ERC20代币支付
     */
    enum PaymentToken {
        ETH,
        ERC20
    }
    
    /**
     * @dev 拍卖结构体
     * 存储单个拍卖的所有信息
     */
    struct Auction {
        uint256 auctionId; // 拍卖ID
        address seller; // 卖家地址
        address nftContract; // NFT合约地址
        uint256 tokenId; // NFT的tokenId
        uint256 startTime; // 开始时间
        uint256 endTime; // 结束时间
        uint256 startingPrice; // 起拍价
        uint256 highestBid; // 当前最高出价
        address highestBidder; // 当前最高出价者
        address paymentToken; // 支付代币地址（0x0表示ETH）
        AuctionStatus status; // 拍卖状态
    }
    
    /**
     * @dev 出价结构体
     * 存储单个出价的信息
     */
    struct Bid {
        address bidder; // 出价者地址
        uint256 amount; // 出价金额
        uint256 timestamp; // 出价时间
    }
    
    // 事件定义
    
    /**
     * @dev 拍卖创建事件
     */
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 startTime,
        uint256 endTime,
        uint256 startingPrice,
        address paymentToken
    );
    
    /**
     * @dev 出价事件
     */
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 usdValue
    );
    
    /**
     * @dev 拍卖结束事件
     */
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid,
        uint256 usdValue
    );
    
    /**
     * @dev 拍卖取消事件
     */
    event AuctionCancelled(uint256 indexed auctionId);
    
    /**
     * @dev 价格Feed设置事件
     */
    event PriceFeedSet(address indexed token, address indexed priceFeed);
    
    // 函数定义
    
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 duration,
        uint256 startingPrice,
        address paymentToken,
        address priceFeed
    ) external returns (uint256);
    
    function bidETH(uint256 auctionId) external payable;
    
    function bidERC20(uint256 auctionId, uint256 amount) external;
    
    function endAuction(uint256 auctionId) external;
    
    function cancelAuction(uint256 auctionId) external;
    
    function getAuction(uint256 auctionId) external view returns (Auction memory);
    
    function getAuctionBids(uint256 auctionId) external view returns (Bid[] memory);
    
    function getBidUSDValue(uint256 auctionId, uint256 bidAmount) external view returns (uint256);
    
    function setPlatformFee(uint256 fee) external;
    
    function setPlatformFeeRecipient(address recipient) external;
    
    function setTokenPriceFeed(address token, address priceFeed) external;
}