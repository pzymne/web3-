// SPDX-License-Identifier: MIT
// 使用MIT开源许可证
pragma solidity ^0.8.20;
// 指定Solidity版本为0.8.20或更高

// 导入OpenZeppelin可升级合约库
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// Initializable：提供可升级合约的初始化机制
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
// UUPSUpgradeable：提供UUPS升级功能的抽象合约
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// OwnableUpgradeable：提供可升级的所有权管理
// 在文件顶部添加这行导入
import "@openzeppelin/contracts/utils/StorageSlot.sol";
/**
 * @title SimpleStorageV1
 * @dev 第一版极简存储合约 - 包含完整的UUPS升级准备
 * 关键：V1必须包含UUPS支持才能被升级
 */
contract SimpleStorageV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // ============ 存储变量声明 ============
    // 注意：这些变量的顺序和类型在升级时绝不能改变
    // 添加以下常量定义
    bytes32 private constant _IMPLEMENTATION_SLOT = 
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    
    // 公开存储变量：存储一个数值
    uint256 public value;
    // public变量会自动生成getter函数，但存储位置固定
    
    // 私有存储变量：存储一个名称
    string private _name;
    // private变量只能在合约内部访问
    
    // 存储间隙：预留50个存储插槽供未来版本使用
    // 这是一种最佳实践，防止存储布局冲突
    uint256[50] private __gap;
    // 数组的每个元素占用一个存储插槽
    
    // ============ 事件声明 ============
    // 事件用于记录日志，不占用存储空间
    
    // 当数值被更改时触发
    event ValueChanged(uint256 oldValue, uint256 newValue);
    
    // 当升级被授权时触发
    event UpgradeAuthorized(address indexed newImplementation);
    
    // ============ 构造函数 ============
    // 可升级合约的构造函数必须禁用初始化器
    
    /**
     * @dev 构造函数 - 必须调用_disableInitializers()
     * @custom:oz-upgrades-unsafe-allow constructor
     *
     */
    constructor() {
        // 禁用逻辑合约的直接初始化
        // 防止逻辑合约被当作普通合约使用
        _disableInitializers();
        // 执行后，initialize函数将无法在逻辑合约上调用
    }
    
    // ============ 初始化函数 ============
    // 可升级合约使用initialize代替构造函数
    
    /**
     * @dev 初始化函数 - 代替传统的构造函数
     * @param initialValue 初始数值
     * @param initialName 初始名称
     * 
     * initializer修饰符确保这个函数只能被调用一次
     * 通过代理合约部署时，这个函数会被自动调用
     */
    function initialize(uint256 initialValue, string memory initialName) public initializer {
        // 第一步：初始化OwnableUpgradeable
        // __Ownable_init()设置msg.sender为合约所有者
        __Ownable_init(msg.sender);
        // 这会初始化所有者变量，并设置正确的存储布局
        
        // 第二步：初始化UUPSUpgradeable
        // __UUPSUpgradeable_init()为UUPS升级做准备
        __UUPSUpgradeable_init();
        
        // 第三步：初始化自定义状态变量
        value = initialValue;      // 设置初始数值
        _name = initialName;       // 设置初始名称
        
        // 注意：这里不需要emit事件，因为不是状态更改
    }
    function _getImplementation() internal view returns (address) {
    return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
}
    // ============ UUPS核心函数：升级授权 ============
    // 这是UUPS模式最关键的函数，控制谁能升级合约
    
    /**
     * @dev 授权升级函数 - UUPS模式的核心
     * @param newImplementation 新的实现合约地址
     * 
     * 函数修饰符：
     * - internal: 只能被合约内部调用
     * - override: 重写父合约的虚函数
     * - onlyOwner: 只有所有者可以调用（来自OwnableUpgradeable）
     * 
     * 当用户调用upgradeTo(newImplementation)时：
     * 1. 代理合约将调用转发到当前逻辑合约
     * 2. 当前逻辑合约的upgradeTo函数被调用
     * 3. upgradeTo函数调用_authorizeUpgrade进行权限检查
     * 4. 如果检查通过，执行真正的升级逻辑
     */
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {
        // 基本验证1：确保新实现地址不是零地址
        require(newImplementation != address(0), "SimpleStorageV1: zero address");
        // address(0)是特殊地址，表示空地址
        
        // 基本验证2：确保不是升级到自己
        require(newImplementation != address(this), "SimpleStorageV1: cannot upgrade to self");
        // 防止逻辑错误
        
        // 基本验证3：确保新合约支持UUPS
        // 通过EIP-1822的proxiableUUID函数验证
        // 这是一个安全措施，确保新合约是可升级的
        try IERC1822Proxiable(newImplementation).proxiableUUID() returns (bytes32 slot) {
            // 检查返回的存储槽是否正确
            require(slot == _IMPLEMENTATION_SLOT, "SimpleStorageV1: not UUPS compliant");
            // _IMPLEMENTATION_SLOT是UUPSUpgradeable定义的常量
        } catch {
            // 如果调用失败，说明不是UUPS合约
            revert("SimpleStorageV1: not UUPS compliant");
        }
        
        // 发出升级授权事件
        // indexed关键字使得这个参数可以在事件日志中被索引和过滤
        emit UpgradeAuthorized(newImplementation);
        
        // 注意：这个函数没有返回值
        // 只要不revert，就表示授权成功
        // 真正的升级逻辑在父合约UUPSUpgradeable中实现
    }
    
    // ============ 业务功能函数 ============
    
    /**
     * @dev 设置新的数值
     * @param newValue 要设置的新数值
     * 
     * onlyOwner修饰符：只有合约所有者可以调用
     * 这是一个修改状态的函数，会消耗gas
     */
    function setValue(uint256 newValue) public virtual onlyOwner {
        // 保存旧值用于事件
        uint256 oldValue = value;
        
        // 更新数值
        value = newValue;
        
        // 触发事件，记录日志
        emit ValueChanged(oldValue, newValue);
        // 事件会被记录在区块链上，供前端监听
    }
    
    /**
     * @dev 设置新的名称
     * @param newName 要设置的新名称
     */
    function setName(string memory newName) public onlyOwner {
        // 更新名称
        // 注意：这里没有保存旧名称，因为字符串比较消耗gas
        _name = newName;
        // 可以添加事件，但为了简化省略了
    }
    
    /**
     * @dev 获取当前名称
     * @return 当前存储的名称
     * 
     * view修饰符：表示这是一个只读函数
     * 只读取状态，不修改状态，不消耗gas（除了调用gas）
     */
    function getName() public view returns (string memory) {
        // 返回私有变量_name
        return _name;
    }
    
    /**
     * @dev 获取合约版本
     * @return 版本字符串
     * 
     * pure修饰符：表示不读取也不修改状态
     * 只使用函数参数和常量
     */
    function version() public pure virtual  returns (string memory) {
        // 返回硬编码的版本号
        return "SimpleStorageV1.0.0";
    }
    
    /**
     * @dev 增加数值
     * @param amount 要增加的数值
     */
    function increase(uint256 amount) public onlyOwner {
        // 使用SafeMath风格的加法（Solidity 0.8+有内置溢出检查）
        // 如果value + amount溢出，交易会自动revert
        uint256 oldValue = value;
        value = value + amount;
        
        emit ValueChanged(oldValue, value);
    }
    
    /**
     * @dev 获取当前实现地址（用于调试）
     * @return 当前逻辑合约地址
     * 
     * 这个函数返回代理合约当前指向的逻辑合约地址
     * 在升级后，这个地址会改变
     */
    function getImplementation() public view returns (address) {
        // _getImplementation()来自UUPSUpgradeable父合约
        return _getImplementation();
    }
}