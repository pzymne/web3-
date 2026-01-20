// contracts/upgradable/Auction.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// OpenZeppelin可升级合约库
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol"; // 初始化
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol"; // UUPS升级
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol"; // 权限管理
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol"; // 重入保护
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol"; // ERC721接口
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol"; // ERC20接口
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol"; // 计数器

// 自定义接口和库
import "../interfaces/IAuction.sol"; // 拍卖接口
import "../libs/PriceConverter.sol"; // 价格转换库

/**
 * @title NFT拍卖合约
 * @dev 支持ETH和ERC20代币出价，集成Chainlink预言机，使用UUPS升级模式
 * 
 * UUPS升级模式解释：
 * 1. UUPS (Universal Upgradeable Proxy Standard) 是一种可升级合约模式
 * 2. 升级逻辑存储在逻辑合约中，而不是代理合约中
 * 3. 更节省gas，但需要更严格的安全性检查
 * 4. 必须实现_authorizeUpgrade函数来控制升级权限
 */
contract Auction is 
    Initializable, // 初始化
    OwnableUpgradeable, // 所有者权限
    UUPSUpgradeable, // UUPS升级
    ReentrancyGuardUpgradeable, // 重入保护
    IAuction // 拍卖接口
{
    // 使用库
    using PriceConverter for uint256; // 为uint256类型添加价格转换功能
    using CountersUpgradeable for CountersUpgradeable.Counter; // 使用计数器
    
    // 状态变量
    CountersUpgradeable.Counter private _auctionIds; // 拍卖ID计数器
    
    // 存储映射
    mapping(uint256 => Auction) public auctions; // 拍卖ID => 拍卖信息
    mapping(uint256 => Bid[]) public bids; // 拍卖ID => 出价数组
    mapping(address => mapping(uint256 => uint256)) public userAuctions; // NFT合约 => tokenId => 拍卖ID
    mapping(address => address) public tokenPriceFeeds; // 代币地址 => 价格Feed地址
    
    // 配置变量
    uint256 public minAuctionDuration; // 最小拍卖持续时间
    uint256 public maxAuctionDuration; // 最大拍卖持续时间
    uint256 public platformFee; // 平台手续费（基点，100 = 1%）
    address public platformFeeRecipient; // 手续费接收地址
    
    // 常量
    uint256 public constant BASIS_POINTS = 10000; // 基点基数（10000 = 100%）
    
    /**
     * @dev 初始化函数
     * @param _feeRecipient 手续费接收地址
     * @notice 这个函数在代理合约部署时调用一次
     */
    function initialize(
        address _feeRecipient
    ) public initializer {
        // 初始化父合约
        __Ownable_init(msg.sender); // 设置部署者为所有者
        __UUPSUpgradeable_init(); // 初始化UUPS
        __ReentrancyGuard_init(); // 初始化重入保护
        
        // 设置默认参数
        minAuctionDuration = 1 hours; // 最小1小时
        maxAuctionDuration = 30 days; // 最大30天
        platformFee = 250; // 2.5%的平台手续费（250个基点）
        platformFeeRecipient = _feeRecipient; // 手续费接收地址
        
        // 设置ETH价格Feed（address(0)表示ETH）
        tokenPriceFeeds[address(0)] = PriceConverter.ETH_USD_FEED;
    }
    
    /**
     * @dev 创建拍卖
     * @param nftContract NFT合约地址
     * @param tokenId NFT的tokenId
     * @param duration 拍卖持续时间（秒）
     * @param startingPrice 起拍价
     * @param paymentToken 支付代币地址（address(0)表示ETH）
     * @param priceFeed 代币价格Feed地址
     * @return auctionId 创建的拍卖ID
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 duration,
        uint256 startingPrice,
        address paymentToken,
        address priceFeed
    ) external override nonReentrant returns (uint256) {
        // 参数验证
        require(duration >= minAuctionDuration, "Duration too short");
        require(duration <= maxAuctionDuration, "Duration too long");
        require(startingPrice > 0, "Starting price must be > 0");
        require(userAuctions[nftContract][tokenId] == 0, "NFT already in auction");
        
        // 验证NFT所有权和授权
        IERC721Upgradeable nft = IERC721Upgradeable(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(
            nft.getApproved(tokenId) == address(this) || 
            nft.isApprovedForAll(msg.sender, address(this)), 
            "NFT not approved"
        );
        
        // 转移NFT到拍卖合约
        nft.transferFrom(msg.sender, address(this), tokenId);
        
        // 记录价格Feed（如果不是ETH）
        if (paymentToken != address(0)) {
            require(priceFeed != address(0), "Price feed required for ERC20");
            tokenPriceFeeds[paymentToken] = priceFeed;
            emit PriceFeedSet(paymentToken, priceFeed);
        }
        
        // 创建拍卖记录
        _auctionIds.increment();
        uint256 auctionId = _auctionIds.current();
        
        auctions[auctionId] = Auction({
            auctionId: auctionId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            startingPrice: startingPrice,
            highestBid: 0,
            highestBidder: address(0),
            paymentToken: paymentToken,
            status: AuctionStatus.ACTIVE
        });
        
        // 更新映射
        userAuctions[nftContract][tokenId] = auctionId;
        
        // 发出事件
        emit AuctionCreated(
            auctionId,
            msg.sender,
            nftContract,
            tokenId,
            block.timestamp,
            block.timestamp + duration,
            startingPrice,
            paymentToken
        );
        
        return auctionId;
    }
    
    /**
     * @dev 使用ETH出价
     * @param auctionId 拍卖ID
     * @notice 调用者必须发送足够的ETH
     */
    function bidETH(
        uint256 auctionId
    ) external payable override nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        // 验证拍卖状态
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(auction.paymentToken == address(0), "Use ERC20 for bidding");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");
        require(msg.value >= auction.startingPrice, "Bid below starting price");
        
        // 退还前一位最高出价者的ETH
        if (auction.highestBidder != address(0)) {
            (bool success, ) = payable(auction.highestBidder).call{
                value: auction.highestBid
            }("");
            require(success, "ETH refund failed");
        }
        
        // 更新拍卖信息
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;
        
        // 记录出价
        bids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        
        // 计算USD价值并发出事件
        uint256 usdValue = msg.value.getConversionRate(address(0));
        emit BidPlaced(auctionId, msg.sender, msg.value, usdValue);
    }
    
    /**
     * @dev 使用ERC20代币出价
     * @param auctionId 拍卖ID
     * @param amount 出价金额
     */
    function bidERC20(
        uint256 auctionId,
        uint256 amount
    ) external override nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        // 验证拍卖状态
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(auction.paymentToken != address(0), "Use ETH for bidding");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(amount > auction.highestBid, "Bid too low");
        require(amount >= auction.startingPrice, "Bid below starting price");
        
        // 获取代币合约
        IERC20Upgradeable token = IERC20Upgradeable(auction.paymentToken);
        
        // 转移代币到拍卖合约
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        
        // 退还前一位最高出价者的代币
        if (auction.highestBidder != address(0)) {
            require(
                token.transfer(auction.highestBidder, auction.highestBid),
                "Token refund failed"
            );
        }
        
        // 更新拍卖信息
        auction.highestBid = amount;
        auction.highestBidder = msg.sender;
        
        // 记录出价
        bids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));
        
        // 计算USD价值并发出事件
        address priceFeed = tokenPriceFeeds[auction.paymentToken];
        uint256 usdValue = amount.getConversionRate(priceFeed);
        emit BidPlaced(auctionId, msg.sender, amount, usdValue);
    }
    
    /**
     * @dev 结束拍卖
     * @param auctionId 拍卖ID
     */
    function endAuction(
        uint256 auctionId
    ) external override nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        // 验证拍卖状态
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(
            block.timestamp >= auction.endTime || msg.sender == auction.seller,
            "Cannot end active auction"
        );
        
        // 更新状态
        auction.status = AuctionStatus.ENDED;
        
        if (auction.highestBidder != address(0)) {
            // 有出价者，转移NFT给获胜者
            IERC721Upgradeable nft = IERC721Upgradeable(auction.nftContract);
            nft.transferFrom(address(this), auction.highestBidder, auction.tokenId);
            
            // 计算平台手续费
            uint256 feeAmount = (auction.highestBid * platformFee) / BASIS_POINTS;
            uint256 sellerAmount = auction.highestBid - feeAmount;
            
            // 分配资金
            if (auction.paymentToken == address(0)) {
                // ETH支付
                (bool feeSuccess, ) = payable(platformFeeRecipient).call{
                    value: feeAmount
                }("");
                require(feeSuccess, "ETH fee transfer failed");
                
                (bool sellerSuccess, ) = payable(auction.seller).call{
                    value: sellerAmount
                }("");
                require(sellerSuccess, "ETH seller transfer failed");
            } else {
                // ERC20支付
                IERC20Upgradeable token = IERC20Upgradeable(auction.paymentToken);
                require(
                    token.transfer(platformFeeRecipient, feeAmount),
                    "Token fee transfer failed"
                );
                require(
                    token.transfer(auction.seller, sellerAmount),
                    "Token seller transfer failed"
                );
            }
            
            // 计算USD价值并发出事件
            address priceFeed = auction.paymentToken == address(0) 
                ? address(0) 
                : tokenPriceFeeds[auction.paymentToken];
            uint256 usdValue = auction.highestBid.getConversionRate(priceFeed);
            
            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid, usdValue);
        } else {
            // 无人出价，退回NFT给卖家
            IERC721Upgradeable nft = IERC721Upgradeable(auction.nftContract);
            nft.transferFrom(address(this), auction.seller, auction.tokenId);
        }
        
        // 清理映射
        delete userAuctions[auction.nftContract][auction.tokenId];
    }
    
    /**
     * @dev 取消拍卖
     * @param auctionId 拍卖ID
     */
    function cancelAuction(
        uint256 auctionId
    ) external override nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        // 验证权限和状态
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(
            msg.sender == auction.seller || msg.sender == owner(),
            "Not authorized"
        );
        require(auction.highestBidder == address(0), "Cannot cancel with bids");
        
        // 更新状态
        auction.status = AuctionStatus.CANCELLED;
        
        // 退回NFT给卖家
        IERC721Upgradeable nft = IERC721Upgradeable(auction.nftContract);
        nft.transferFrom(address(this), auction.seller, auction.tokenId);
        
        // 清理映射
        delete userAuctions[auction.nftContract][auction.tokenId];
        
        emit AuctionCancelled(auctionId);
    }
    
    /**
     * @dev 获取拍卖详情
     * @param auctionId 拍卖ID
     * @return 拍卖信息结构体
     */
    function getAuction(
        uint256 auctionId
    ) external view override returns (Auction memory) {
        return auctions[auctionId];
    }
    
    /**
     * @dev 获取拍卖的所有出价
     * @param auctionId 拍卖ID
     * @return 出价数组
     */
    function getAuctionBids(
        uint256 auctionId
    ) external view override returns (Bid[] memory) {
        return bids[auctionId];
    }
    
    /**
     * @dev 获取出价的USD价值
     * @param auctionId 拍卖ID
     * @param bidAmount 出价金额
     * @return USD价值
     */
    function getBidUSDValue(
        uint256 auctionId,
        uint256 bidAmount
    ) external view override returns (uint256) {
        Auction memory auction = auctions[auctionId];
        address priceFeed = auction.paymentToken == address(0) 
            ? address(0) 
            : tokenPriceFeeds[auction.paymentToken];
        return bidAmount.getConversionRate(priceFeed);
    }
    
    /**
     * @dev 设置平台手续费
     * @param _fee 手续费（基点，100 = 1%）
     */
    function setPlatformFee(
        uint256 _fee
    ) external override onlyOwner {
        require(_fee <= 1000, "Fee too high"); // 最大10%
        platformFee = _fee;
    }
    
    /**
     * @dev 设置手续费接收地址
     * @param _recipient 接收地址
     */
    function setPlatformFeeRecipient(
        address _recipient
    ) external override onlyOwner {
        require(_recipient != address(0), "Invalid address");
        platformFeeRecipient = _recipient;
    }
    
    /**
     * @dev 设置拍卖持续时间限制
     * @param min 最小持续时间（秒）
     * @param max 最大持续时间（秒）
     */
    function setAuctionDurationLimits(
        uint256 min,
        uint256 max
    ) external onlyOwner {
        require(min > 0 && max > min, "Invalid durations");
        minAuctionDuration = min;
        maxAuctionDuration = max;
    }
    
    /**
     * @dev 设置代币价格Feed
     * @param token 代币地址
     * @param priceFeed 价格Feed地址
     */
    function setTokenPriceFeed(
        address token,
        address priceFeed
    ) external override onlyOwner {
        tokenPriceFeeds[token] = priceFeed;
        emit PriceFeedSet(token, priceFeed);
    }
    
    /**
     * @dev UUPS升级授权函数
     * @param newImplementation 新的实现合约地址
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {
        // 这里可以添加升级前的验证逻辑
        // 例如：检查新实现是否安全，是否有正确的接口等
    }
    
    /**
     * @dev 获取合约版本
     * @return 版本字符串
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
    
    /**
     * @dev 接收ETH的回退函数
     * 允许合约接收ETH
     */
    receive() external payable {}
    
    /**
     * @dev 获取拍卖统计数据
     * @return totalAuctions 总拍卖数
     * @return activeAuctions 活跃拍卖数
     */
    function getStats() external view returns (uint256 totalAuctions, uint256 activeAuctions) {
        totalAuctions = _auctionIds.current();
        activeAuctions = 0;
        
        for (uint256 i = 1; i <= totalAuctions; i++) {
            if (auctions[i].status == AuctionStatus.ACTIVE) {
                activeAuctions++;
            }
        }
    }
}