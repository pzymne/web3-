// contracts/upgradable/NFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// 引入OpenZeppelin可升级合约库
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol"; // ERC721实现
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol"; // 权限管理
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol"; // 初始化功能
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol"; // UUPS升级模式
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol"; // 计数器工具

/**
 * @title NFT合约
 * @dev 可升级的ERC721 NFT合约，支持UUPS升级模式
 * @notice 这个合约使用UUPS升级模式，允许在不丢失数据的情况下升级合约逻辑
 */
contract NFT is 
    Initializable, // 初始化合约基类
    ERC721Upgradeable, // ERC721可升级实现
    OwnableUpgradeable, // 所有者权限管理
    UUPSUpgradeable // UUPS升级模式
{
    // 使用计数器库管理tokenId
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter; // Token ID计数器
    
    string private _baseTokenURI; // 基础URI，用于构建tokenURI
    
    /**
     * @dev 初始化函数（替代构造函数）
     * @param name NFT集合名称
     * @param symbol NFT集合符号
     * @notice 这个函数只会在代理合约部署时调用一次
     */
    function initialize(
        string memory name, 
        string memory symbol
    ) public initializer { // initializer修饰符确保只初始化一次
        __ERC721_init(name, symbol); // 初始化ERC721
        __Ownable_init(msg.sender); // 初始化所有者，设置msg.sender为所有者
        __UUPSUpgradeable_init(); // 初始化UUPS升级功能
        // 不需要初始化_tokenIdCounter，因为它默认从0开始
    }
    
    /**
     * @dev 铸造单个NFT
     * @param to 接收NFT的地址
     * @return 新铸造的NFT的tokenId
     */
    function mint(address to) external returns (uint256) {
        require(to != address(0), "Cannot mint to zero address"); // 验证接收地址
        _tokenIdCounter.increment(); // 递增tokenId计数器
        uint256 tokenId = _tokenIdCounter.current(); // 获取当前tokenId
        _safeMint(to, tokenId); // 安全铸造NFT（检查合约接收）
        return tokenId;
    }
    
    /**
     * @dev 批量铸造NFT
     * @param to 接收NFT的地址
     * @param count 要铸造的数量
     * @return 新铸造的NFT的tokenId数组
     */
    function mintBatch(
        address to, 
        uint256 count
    ) external returns (uint256[] memory) {
        require(to != address(0), "Cannot mint to zero address"); // 验证接收地址
        require(count > 0 && count <= 100, "Count must be 1-100"); // 限制批量铸造数量
        
        uint256[] memory tokenIds = new uint256[](count); // 创建tokenId数组
        
        for (uint256 i = 0; i < count; i++) {
            _tokenIdCounter.increment(); // 递增计数器
            uint256 tokenId = _tokenIdCounter.current(); // 获取当前tokenId
            _safeMint(to, tokenId); // 安全铸造
            tokenIds[i] = tokenId; // 存储到数组
        }
        
        return tokenIds;
    }
    
    /**
     * @dev 设置基础URI
     * @param baseURI 新的基础URI
     * @notice 只有合约所有者可以调用
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev 获取指定tokenId的URI
     * @param tokenId 要查询的NFT的tokenId
     * @return NFT的完整URI
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        _requireOwned(tokenId); // 验证tokenId存在且被拥有
        return string(
            abi.encodePacked( // 拼接字符串
                _baseTokenURI, 
                "/", 
                Strings.toString(tokenId) // 将tokenId转换为字符串
            )
        );
    }
    
    /**
     * @dev UUPS升级授权函数
     * @param newImplementation 新的合约实现地址
     * @notice 只有合约所有者可以授权升级
     * @dev 这是UUPS升级模式的核心，控制谁可以升级合约
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {
        // 可以在这里添加升级前的验证逻辑
        // 例如检查新实现是否安全
    }
    
    /**
     * @dev 获取当前tokenId计数
     * @return 下一个可用的tokenId
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev 获取合约版本
     * @return 版本字符串
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
    
    /**
     * @dev 重写_transfer函数，可以在这里添加自定义逻辑
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        // 可以在这里添加转账限制逻辑
        // 例如：禁止在拍卖期间转移
        super._transfer(from, to, tokenId);
    }
}