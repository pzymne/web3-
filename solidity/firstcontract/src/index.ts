// import {ethers} from "ethers";
// declare global {
//     interface Window {
//         ethereum?: {
//             request: (args: { method: string }) => Promise<string[]>;
//             isMetaMask?: boolean;
//             on: (event: string, callback: (...args: any[]) => void) => void;
//             removeListener: (event: string, callback: (...args: any[]) => void) => void;
//         };
//     }
// }


// /**
//  * 获取以太坊提供者对象
//  * @returns {Window['ethereum']} 以太坊提供者
//  * @throws {Error} 如果没有找到以太坊提供者
//  */
// function getEth(): NonNullable<Window['ethereum']> {
//     // 获取 window.ethereum 对象
//     const eth = window.ethereum;
    
//     // 检查以太坊提供者是否存在
//     if (!eth) {
//         // 抛出明确的错误信息，指导用户安装钱包
//         throw new Error("No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.");
//     }
    
//     // 返回以太坊提供者对象
//     return eth;
// }

// async function requestAccess() {
// const eth = getEth();
// const result =await eth.request({method:"eth_requestAccounts"})as string[];
// return result && result.length > 0;
// }
// async function hasSigners() {
//     const metamask =getEth();
//     const signers=await metamask.request({method:"eth_accounts"}) as string[];
//     return signers.length>0;
// }
// async function getContract(){
// const hasAccess = await requestAccess();
// if (!hasAccess&&!await hasSigners()){
//     throw new Error("No ethereum provider found");
// }
//    const provider=new ethers.BrowserProvider(getEth());
//  // const provider = new ethers.BrowserProvider(window.ethereum);
//    const address=process.env.CONTRACT_ADDRESS;
//    const contract =new ethers.Contract(
//     address,
//     [
//         "function hello() public pure returns (string memory)"
//     ],
//     provider
// );
//    document.body.innerHTML=await contract.hello();
// }

// async function main() {
//     await getContract();
// }






//导入 ethers 库，用于与以太坊区块链交互
import { ethers } from "ethers";

// 扩展 Window 接口，声明 ethereum 对象的类型
// 这是 TypeScript 必需的，用于类型安全
declare global {
    interface Window {
        // ethereum 是可选的，因为用户可能没有安装钱包
        ethereum?: {
            // 标准 EIP-1193 请求方法
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            // 标识是否为 MetaMask
            isMetaMask?: boolean;
            // 事件监听方法
            on: (event: string, callback: (...args: any[]) => void) => void;
            // 移除事件监听器
            removeListener: (event: string, callback: (...args: any[]) => void) => void;
            // 钱包当前选中的地址
            selectedAddress?: string | null;
            // 当前网络链ID
            chainId?: string;
        };
    }
}

/**
 * 获取以太坊提供者对象
 * @returns {Window['ethereum']} 以太坊提供者
 * @throws {Error} 如果没有找到以太坊提供者
 */
function getEth(): NonNullable<Window['ethereum']> {
    // 获取 window.ethereum 对象
    const eth = window.ethereum;
    
    // 检查以太坊提供者是否存在
    if (!eth) {
        // 抛出明确的错误信息，指导用户安装钱包
        throw new Error("No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.");
    }
    
    // 返回以太坊提供者对象
    return eth;
}

/**
 * 请求用户授权访问以太坊账户
 * @returns {Promise<boolean>} 是否成功获取账户访问权限
 */
async function requestAccess(): Promise<boolean> {
    // 获取以太坊提供者
    const eth = getEth();
    
    try {
        // 请求用户授权访问账户（会弹出钱包确认窗口）
        // eth_requestAccounts 是 EIP-1193 标准方法
        const result = await eth.request({ method: "eth_requestAccounts" }) as string[];
        
        // 检查是否成功获取账户（数组长度大于0表示成功）
        return Array.isArray(result) && result.length > 0;
        
    } catch (error: any) {
        // 处理用户拒绝授权的情况（错误码 4001）
        if (error.code === 4001) {
            console.warn("User rejected the connection request.");
            return false;
        }
        
        // 处理其他错误
        console.error("Failed to request account access:", error);
        return false;
    }
}

/**
 * 检查当前是否有已连接的签名者（账户）
 * @returns {Promise<boolean>} 是否有已连接的账户
 */
async function hasSigners(): Promise<boolean> {
    // 获取以太坊提供者（使用更准确的变量名）
    const ethereumProvider = getEth();
    
    try {
        // 查询当前已连接的账户（不会弹出确认窗口）
        // eth_accounts 返回当前已授权的账户列表
        const signers = await ethereumProvider.request({ method: "eth_accounts" }) as string[];
        
        // 检查是否有已连接的账户
        return Array.isArray(signers) && signers.length > 0;
        
    } catch (error) {
        // 处理查询错误
        console.error("Failed to check for connected accounts:", error);
        return false;
    }
}

/**
 * 获取智能合约实例并调用其方法
 * @throws {Error} 如果无法连接合约或调用失败
 */
async function getContract(): Promise<void> {
    try {
        // 第一步：尝试请求账户访问权限
        const hasAccess = await requestAccess();
        
        // 第二步：检查是否有已连接的签名者
        const hasConnectedSigners = await hasSigners();
        
        // 如果既没有访问权限也没有已连接的签名者，则抛出错误
        // ✅ 优化：使用 || 而不是 &&，逻辑更清晰
        if (!hasAccess && !hasConnectedSigners) {
            throw new Error("Failed to connect to Ethereum wallet. Please check your wallet connection.");
        }
        
        // 第三步：创建以太坊提供者
        // ✅ 优化：直接传递 window.ethereum 而不是 getEth() 的返回值
        // ethers.BrowserProvider 期望 EIP-1193 提供者
        const provider = new ethers.BrowserProvider(window.ethereum!);
        
        
        // 第四步：获取合约地址
        // ✅ 优化：处理前端环境变量（不同构建工具有不同的环境变量前缀）
        let address = "";
        if (typeof process.env.CONTRACT_ADDRESS !== 'undefined') {
         address = process.env.CONTRACT_ADDRESS;
         } 
        
        // 验证合约地址
        if (!address) {
            throw new Error("Contract address is not configured. Please set CONTRACT_ADDRESS environment variable.");
        }
        
        if (!ethers.isAddress(address)) {
            throw new Error(`Invalid contract address format: ${address}`);
        }


/************************************************************************************ */
//   // 1. 检查合约代码是否存在
//     const code = await provider.getCode(address);
//     console.log("Contract code:", code);
    
//     // 如果 code 是 "0x"，表示地址上没有合约
//     if (code === "0x") {
//         throw new Error("No contract found at this address. Please check the contract address.");
//     }
    
//     // 2. 检查网络是否正确
//     const network = await provider.getNetwork();
//     console.log("Current network:", network);
    
//     // 3. 尝试调用其他简单方法（如果存在）
//     const _contract = new ethers.Contract(
//         address,
//         [
//             "function name() view returns (string)",
//             "function symbol() view returns (string)",
//             "function owner() view returns (address)"
//         ],
//         provider
//     );

/********************************************************************************** */
        
        // 第五步：创建合约实例
        // ✅ 优化：添加完整的函数定义，包含正确的可见性和状态可变性
        const contract = new ethers.Contract(
            address,  // 合约地址
            [
                // hello 函数应该是 view 或 pure，因为它不修改状态
                "function hello() public pure returns (string memory)"
            ],
            provider  // 以太坊提供者
        );
        
        // 第六步：调用合约函数并安全地显示结果
        // ✅ 优化：先获取结果，再安全地更新页面
        const greeting = await contract.hello();
        
        // 安全地更新页面内容（避免 XSS 攻击和页面内容丢失）
        // ✅ 优化：不直接覆盖整个 body.innerHTML，而是追加或更新特定元素
        const resultElement = document.createElement("div");
        resultElement.id = "contract-result";
        resultElement.textContent = `Contract Response: ${greeting}`;
        resultElement.style.cssText = `
            padding: 20px;
            margin: 20px;
            background: #f0f8ff;
            border: 1px solid #87ceeb;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 16px;
        `;
        
        // 检查是否已存在结果元素
        const existingResult = document.getElementById("contract-result");
        if (existingResult) {
            existingResult.replaceWith(resultElement);
        } else {
            document.body.appendChild(resultElement);
        }
        
        console.log("✅ Contract called successfully:", greeting);
        
    } catch (error: any) {
        // 增强错误处理，提供更友好的错误信息
        console.error("❌ Failed to interact with contract:", error);
        
        // 显示用户友好的错误信息
        const errorElement = document.createElement("div");
        errorElement.id = "contract-error";
        errorElement.textContent = `Error: ${error.message || "Unknown error"}`;
        errorElement.style.cssText = `
            padding: 20px;
            margin: 20px;
            background: #ffe6e6;
            border: 1px solid #ff6666;
            border-radius: 8px;
            color: #cc0000;
            font-family: Arial, sans-serif;
        `;
        
        // 移除旧的错误信息（如果存在）
        const existingError = document.getElementById("contract-error");
        if (existingError) {
            existingError.replaceWith(errorElement);
        } else {
            document.body.appendChild(errorElement);
        }
        
        // 重新抛出错误，以便上层调用者可以处理
        throw error;
    }
}

/**
 * 主函数，程序的入口点
 */
async function main(): Promise<void> {
    try {
        console.log("🚀 Starting DApp...");
        
        // 在调用合约前，可以先显示加载状态
        const loadingElement = document.createElement("div");
        loadingElement.id = "loading";
        loadingElement.textContent = "⏳ Connecting to contract...";
        loadingElement.style.cssText = `
            padding: 20px;
            margin: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(loadingElement);
        
        // 调用合约函数
        await getContract();
        
        // 移除加载状态
        const loading = document.getElementById("loading");
        if (loading) {
            loading.remove();
        }
        
        console.log("✅ DApp execution completed successfully.");
        
    } catch (error) {
        console.error("❌ DApp execution failed:", error);
        
        // 确保移除加载状态（即使在错误情况下）
        const loading = document.getElementById("loading");
        if (loading) {
            loading.remove();
        }
        
        // 可以在这里添加全局错误处理，如发送错误日志等
    }
}

// 立即执行主函数（如果是脚本文件）
// 在实际应用中，可能需要在页面加载完成后执行
if (typeof window !== 'undefined' && document.readyState === 'loading') {
    // 如果文档还在加载，等待加载完成
    document.addEventListener('DOMContentLoaded', main);
} else {
    // 如果文档已加载完成，直接执行
    main();
}

// 导出函数，以便在模块化环境中使用
export {
    getEth,
    requestAccess,
    hasSigners,
    getContract,
    main
};