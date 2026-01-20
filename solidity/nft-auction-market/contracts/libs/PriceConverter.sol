// contracts/libs/PriceConverter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// 引入Chainlink价格Feed接口
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title 价格转换库
 * @dev 使用Chainlink预言机进行价格转换
 * @notice 这个库提供了ETH/USD和ERC20/USD的价格转换功能
 * 
 * Chainlink预言机解释：
 * 1. Chainlink是去中心化的预言机网络
 * 2. AggregatorV3Interface是Chainlink价格Feed的标准接口
 * 3. 价格Feed提供实时资产价格数据
 * 4. 数据通过多个节点验证，确保准确性
 */
library PriceConverter {
    // Sepolia测试网的ETH/USD价格Feed地址
    address public constant ETH_USD_FEED = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
    
    /**
     * @dev 获取ETH/USD价格
     * @return 当前ETH/USD价格（带8位小数）
     * @notice Chainlink价格Feed返回的价格有8位小数
     */
    function getETHPrice() internal view returns (uint256) {
        // 创建Chainlink价格Feed接口实例
        AggregatorV3Interface priceFeed = AggregatorV3Interface(ETH_USD_FEED);
        
        // 获取最新价格数据
        (
            , // uint80 roundId - 轮次ID，不使用
            int256 price, // 价格（带8位小数）
            , // uint256 startedAt - 开始时间，不使用
            , // uint256 updatedAt - 更新时间，不使用
             // uint80 answeredInRound - 回答轮次，不使用
        ) = priceFeed.latestRoundData();
        
        // 验证价格有效性
        require(price > 0, "Invalid price");
        
        // 将价格转换为18位小数（与wei单位一致）
        return uint256(price * 1e10);
    }
    
    /**
     * @dev 获取ERC20代币/USD价格
     * @param tokenFeed 代币价格Feed地址
     * @return 当前代币/USD价格（带18位小数）
     */
    function getTokenPrice(
        address tokenFeed
    ) internal view returns (uint256) {
        require(tokenFeed != address(0), "Invalid price feed address");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(tokenFeed);
        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid token price");
        
        return uint256(price * 1e10);
    }
    
    /**
     * @dev 将ETH数量转换为USD价值
     * @param ethAmount ETH数量（以wei为单位）
     * @return USD价值（带18位小数）
     * 
     * 计算公式：
     * USD价值 = (ETH数量 * ETH价格) / 1e18
     * 
     * 注意：
     * 1. ethAmount是18位小数（1 ETH = 1e18 wei）
     * 2. getETHPrice()返回18位小数的价格
     * 3. 结果也是18位小数
     */
    function ethToUSD(
        uint256 ethAmount
    ) internal view returns (uint256) {
        uint256 ethPrice = getETHPrice(); // 获取ETH价格（18位小数）
        // 计算USD价值，注意精度处理
        return (ethAmount * ethPrice) / 1e18;
    }
    
    /**
     * @dev 将ERC20代币数量转换为USD价值
     * @param tokenAmount 代币数量（假设代币有18位小数）
     * @param tokenFeed 代币价格Feed地址
     * @return USD价值（带18位小数）
     */
    function tokenToUSD(
        uint256 tokenAmount,
        address tokenFeed
    ) internal view returns (uint256) {
        uint256 tokenPrice = getTokenPrice(tokenFeed);
        return (tokenAmount * tokenPrice) / 1e18;
    }
    
    /**
     * @dev 获取转换率
     * @param amount 要转换的金额
     * @param tokenFeed 代币价格Feed地址（address(0)表示ETH）
     * @return USD价值
     */
    function getConversionRate(
        uint256 amount,
        address tokenFeed
    ) internal view returns (uint256) {
        if (tokenFeed == address(0)) {
            return ethToUSD(amount);
        } else {
            return tokenToUSD(amount, tokenFeed);
        }
    }
    
    /**
     * @dev 获取价格Feed的小数位数
     * @param priceFeed 价格Feed地址
     * @return 小数位数
     */
    function getDecimals(
        address priceFeed
    ) internal view returns (uint8) {
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        return feed.decimals();
    }
    
    /**
     * @dev 获取价格Feed描述
     * @param priceFeed 价格Feed地址
     * @return 描述字符串
     */
    function getDescription(
        address priceFeed
    ) internal view returns (string memory) {
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        return feed.description();
    }
}