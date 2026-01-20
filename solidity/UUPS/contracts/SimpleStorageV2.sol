// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 关键：继承V1合约，确保存储布局完全一致
import "./SimpleStorageV1.sol";

/**
 * @title SimpleStorageV2
 * @dev 第二版存储合约 - 添加新功能并保持存储兼容
 * 
 * 存储布局继承：
 * SimpleStorageV1的存储布局：
 * - 插槽0: value (uint256)
 * - 插槽1: _name (string)
 * - 插槽2-51: __gap[50] (uint256[50])
 * 
 * SimpleStorageV2的存储布局：
 * - 插槽0: value (uint256)        ← 继承自V1
 * - 插槽1: _name (string)         ← 继承自V1  
 * - 插槽2: lastUpdated (uint256)   ← V2新增
 * - 插槽3-51: __gap[49] (uint256[49]) ← 更新存储间隙
 */
contract SimpleStorageV2 is SimpleStorageV1 {
     // 添加以下常量定义（与 V1 保持一致）
    bytes32 private constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    // ============ V2新增存储变量 ============
    // 重要：新变量必须添加到存储布局的末尾
    
    // 最后更新时间戳
    uint256 public lastUpdated;
    // 这个变量会被放置在存储间隙的第一个位置
    
    // 更新存储间隙：50 - 1 = 49
    // 因为我们新增了一个变量，所以减少存储间隙
    uint256[49] private __gap;
    
    // ============ V2新增事件 ============
    
    // 当数值被更新时，记录更新时间
    event ValueUpdatedWithTime(uint256 value, uint256 timestamp);
    
    // ============ 重新初始化函数（可选） ============
    
    /**
     * @dev 重新初始化V2新增的变量
     * 
     * reinitializer(2)修饰符：
     * - 表示这是第2次初始化
     * - 确保这个函数只能在升级后被调用一次
     * - 防止重复初始化
     * 
     * 注意：这不是必须的，只有需要初始化新变量时才需要
     */
    function initializeV2() public reinitializer(2) {
        // 初始化V2新增的变量
        lastUpdated = block.timestamp;
        // block.timestamp是当前区块的时间戳（秒）
    }
    
    // ============ 增强的升级授权函数 ============
    
    /**
     * @dev 重写_authorizeUpgrade，添加V2的额外验证
     * @param newImplementation 新的实现合约地址
     * 
     * 这里演示了完整的升级控制：
     * 1. 时间锁：确保距离上次升级足够时间
     * 2. 版本检查：只能升级到兼容版本
     * 3. 紧急暂停：紧急情况下阻止升级
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // 第一步：调用父合约的基础验证
        // 这包括：零地址检查、自我升级检查、UUPS合规性检查
        super._authorizeUpgrade(newImplementation);
        // super关键字调用父合约的_authorizeUpgrade函数
        
        // 第二步：时间锁验证（示例）
        // 确保距离上次更新至少过了24小时
        uint256 _timeSinceLastUpdate = block.timestamp - lastUpdated;
        uint256 requiredCooldown = 24 hours; // 24小时的时间锁
        
        require(
            _timeSinceLastUpdate >= requiredCooldown,
            "SimpleStorageV2: upgrade cooldown not met"
        );
        // 这可以防止过于频繁的升级
        
        // 第三步：验证新合约的版本（示例）
        // 这里假设新合约有version()函数
        // 在实际项目中，可以添加版本兼容性检查
        // 例如：只能升级到主版本号相同的版本
        
        // 第四步：紧急情况检查（示例）
        // 如果有紧急情况，可以阻止升级
        // require(!emergencyMode, "SimpleStorageV2: emergency mode active");
        
        // 第五步：记录升级时间
        // 更新最后更新时间
        lastUpdated = block.timestamp;
        
        // 注意：不需要额外的事件，父合约已经发出了UpgradeAuthorized
    }
    
    // ============ V2新增业务函数 ============
    
    /**
     * @dev 重写setValue，添加时间戳记录
     * @param newValue 新的数值
     * 
     * override修饰符：表示重写父合约的函数
     * 这允许我们在调用父函数前后添加额外逻辑
     */
    function setValue(uint256 newValue) public override onlyOwner {
        // 调用父合约的setValue函数
        // 这会执行原有的逻辑并触发ValueChanged事件
        super.setValue(newValue);
        
        // V2新增：更新最后修改时间
        lastUpdated = block.timestamp;
        
        // V2新增：触发带时间戳的事件
        emit ValueUpdatedWithTime(newValue, block.timestamp);
    }
    
    /**
     * @dev V2新增：带时间戳的设置函数
     * @param newValue 新的数值
     * @param customTimestamp 自定义时间戳
     * 
     * 这个函数允许指定时间戳（用于特殊情况）
     */
    function setValueWithTimestamp(uint256 newValue, uint256 customTimestamp) public onlyOwner {
        // 验证时间戳不超过当前时间
        require(customTimestamp <= block.timestamp, "SimpleStorageV2: future timestamp");
        
        // 保存旧值用于事件
        uint256 oldValue = value;
        
        // 更新数值
        value = newValue;
        
        // 更新最后修改时间
        lastUpdated = customTimestamp;
        
        // 触发事件
        emit ValueChanged(oldValue, newValue);
        emit ValueUpdatedWithTime(newValue, customTimestamp);
    }
    
    /**
     * @dev V2新增：批量增加数值
     * @param amounts 要增加的数值数组
     * 
     * 演示如何在升级中添加全新的功能
     */
    function batchIncrease(uint256[] memory amounts) public onlyOwner {
        // 检查数组不为空
        require(amounts.length > 0, "SimpleStorageV2: empty array");
        
        uint256 totalIncrease = 0;
        
        // 遍历数组，累加所有增加值
        for (uint256 i = 0; i < amounts.length; i++) {
            totalIncrease += amounts[i];
        }
        
        // 保存旧值
        uint256 oldValue = value;
        
        // 更新数值
        value = value + totalIncrease;
        
        // 更新最后修改时间
        lastUpdated = block.timestamp;
        
        // 触发事件
        emit ValueChanged(oldValue, value);
        emit ValueUpdatedWithTime(value, block.timestamp);
    }
    
    /**
     * @dev V2新增：获取数值和最后更新时间
     * @return 当前数值和最后更新时间戳
     */
    function getValueWithTimestamp() public view returns (uint256, uint256) {
        return (value, lastUpdated);
    }
    
    /**
     * @dev V2新增：验证是否可以升级（供前端使用）
     * @param newImplementation 新实现地址
     * @return 是否可以升级
     * @return 原因（如果不可升级）
     */
    function canUpgrade(address newImplementation) public view returns (bool, string memory) {
        // 检查1：是否是所有者
        if (msg.sender != owner()) {
            return (false, "Not owner");
        }
        
        // 检查2：是否为零地址
        if (newImplementation == address(0)) {
            return (false, "Zero address");
        }
        
        // 检查3：时间锁是否满足
        if (block.timestamp - lastUpdated < 24 hours) {
            return (false, "Cooldown not met");
        }
        
        // 检查4：是否UUPS合规
        try IERC1822Proxiable(newImplementation).proxiableUUID() returns (bytes32 slot) {
            if (slot != _IMPLEMENTATION_SLOT) {
                return (false, "Not UUPS compliant");
            }
        } catch {
            return (false, "Not UUPS compliant");
        }
        
        // 所有检查通过
        return (true, "Can upgrade");
    }
    
    /**
     * @dev 重写version函数，返回V2版本
     * @return 版本字符串
     */
    function version() public pure override returns (string memory) {
        return "SimpleStorageV2.0.0";
    }
    
    /**
     * @dev V2新增：计算距离上次更新的时间
     * @return 经过的秒数
     */
    function timeSinceLastUpdate() public view returns (uint256) {
        return block.timestamp - lastUpdated;
    }
    
    /**
     * @dev V2新增：检查是否可以进行升级
     * @return 是否满足升级条件
     */
    function isUpgradeAllowed() public view returns (bool) {
        return (block.timestamp - lastUpdated) >= 24 hours;
    }
}