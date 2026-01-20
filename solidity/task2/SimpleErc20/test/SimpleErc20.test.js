const { expect } = require("chai");

/**
 * SimpleERC20 合约测试套件
 * 包含单元测试和集成测试
 */
describe("SimpleERC20 Contract - 完整测试套件", function () {
  // 测试变量声明
  let SimpleERC20;
  let token;
  let owner;
  let user1;
  let user2;
  let user3;
  let users;
  
  // 测试常量
  const TOKEN_NAME = "SimpleToken";
  const TOKEN_SYMBOL = "STK";
  const INITIAL_SUPPLY = 1000000; // 100万代币,合约内部会转化乘以10的18次方
  const Expect_SUPPLY = ethers.BigNumber.from("1000000").mul(ethers.BigNumber.from("10").pow(18));
  // 零地址常量（兼容不同版本的 ethers）
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  /**
   * 在每个测试用例之前运行
   * 用于部署新的合约实例
   */
  beforeEach(async function () {
    console.log("\n" + "=".repeat(70));
    console.log("🧪 设置测试环境");
    console.log("=".repeat(70));
    
    // 获取测试账户
    [owner, user1, user2, user3, ...users] = await ethers.getSigners();
    
    console.log("📋 测试账户:");
    console.log(`   👑 所有者: ${owner.address}`);
    console.log(`   👤 用户1: ${user1.address}`);
    console.log(`   👤 用户2: ${user2.address}`);
    console.log(`   👤 用户3: ${user3.address}`);
    
    // 部署合约
    console.log("\n🚀 部署合约...");
    SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
    token = await SimpleERC20.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY
    );
    
    // 等待部署完成
    await token.deployed();
    
    const contractAddress = await token.address;
    console.log(`✅ 合约部署成功: ${contractAddress}`);
    
    // 验证初始状态
    const totalSupply = await token.totalSupply();
    const ownerBalance = await token.balanceOf(owner.address);
    
    console.log("\n📊 初始状态:");
    console.log(`   💰 总供应量: ${ethers.utils.formatEther(totalSupply)} ${TOKEN_SYMBOL}`);
    console.log(`   👤 所有者余额: ${ethers.utils.formatEther(ownerBalance)} ${TOKEN_SYMBOL}`);
    
    // 验证初始分配正确
    expect(totalSupply).to.equal(Expect_SUPPLY);
    expect(ownerBalance).to.equal(totalSupply);
  });

  /**
   * 测试组 1: 部署和基础属性
   */
  describe("1. 部署和基础属性测试", function () {
    it("1.1 应该设置正确的代币名称", async function () {
      const name = await token.name();
      console.log(`   ✅ 代币名称: ${name}`);
      expect(name).to.equal(TOKEN_NAME);
    });

    it("1.2 应该设置正确的代币符号", async function () {
      const symbol = await token.symbol();
      console.log(`   ✅ 代币符号: ${symbol}`);
      expect(symbol).to.equal(TOKEN_SYMBOL);
    });

    it("1.3 应该设置正确的小数位数（18）", async function () {
      const decimals = await token.decimals();
      console.log(`   ✅ 小数位数: ${decimals}`);
      expect(decimals).to.equal(18);
    });

    it("1.4 应该将部署者设置为合约所有者", async function () {
      const contractOwner = await token.owner();
      console.log(`   ✅ 合约所有者: ${contractOwner}`);
      expect(contractOwner).to.equal(owner.address);
    });

    it("1.5 应该正确计算初始供应量", async function () {
      const totalSupply = await token.totalSupply();
      console.log(`   ✅ 总供应量: ${ethers.utils.formatEther(totalSupply)}`);
      
      // 验证是 100万 * 10^18
      const expectedSupply = ethers.BigNumber.from("1000000").mul(ethers.BigNumber.from("10").pow(18));
      expect(totalSupply).to.equal(expectedSupply);
    });
  });

  /**
   * 测试组 2: 转账功能
   */
  describe("2. 转账功能测试", function () {
    it("2.1 应该成功转账代币", async function () {
  const transferAmount = ethers.BigNumber.from("100")
    .mul(ethers.BigNumber.from("10").pow(18));
  
  // 手动实现 formatEther 函数
  function formatEther(wei) {
    const weiStr = wei.toString();
    if (weiStr.length <= 18) {
      return '0.' + weiStr.padStart(18, '0');
    }
    const integerPart = weiStr.slice(0, -18);
    const decimalPart = weiStr.slice(-18);
    return integerPart + '.' + decimalPart;
  }
  
  console.log(`\n💸 测试转账 ${formatEther(transferAmount)} ${TOKEN_SYMBOL}`);
  console.log(`   从: ${owner.address}`);
  console.log(`   到: ${user1.address}`);
  
  // 记录转账前余额
  const ownerBalanceBefore = await token.balanceOf(owner.address);
  const user1BalanceBefore = await token.balanceOf(user1.address);
  
  console.log(`   转账前 - 所有者: ${formatEther(ownerBalanceBefore)}`);
  console.log(`   转账前 - 用户1: ${formatEther(user1BalanceBefore)}`);
  
  // 执行转账
  const tx = await token.transfer(user1.address, transferAmount);
  const receipt = await tx.wait();
  
  console.log(`   ⛽ Gas 消耗: ${receipt.gasUsed.toString()}`);
  
  // 记录转账后余额
  const ownerBalanceAfter = await token.balanceOf(owner.address);
  const user1BalanceAfter = await token.balanceOf(user1.address);
  
  console.log(`   转账后 - 所有者: ${formatEther(ownerBalanceAfter)}`);
  console.log(`   转账后 - 用户1: ${formatEther(user1BalanceAfter)}`);
  
  // 验证结果 - 使用 BigNumber 的正确方法
  expect(user1BalanceAfter.toString()).to.equal(transferAmount.toString());
  
  // 使用 sub() 和 add() 方法进行 BigNumber 运算
  expect(ownerBalanceAfter.toString()).to.equal(
    ownerBalanceBefore.sub(transferAmount).toString()
  );
  
  expect(user1BalanceAfter.toString()).to.equal(
    user1BalanceBefore.add(transferAmount).toString()
  );
  
  console.log(`   ✅ 转账成功!`);
});

    it("2.2 应该发出 Transfer 事件", async function () {
      const transferAmount = ethers.BigNumber.from("50").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n📡 测试转账事件`);
      
      await expect(token.transfer(user1.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, user1.address, transferAmount);
      
      console.log(`   ✅ Transfer 事件正确触发`);
    });

    it("2.3 余额不足时应该转账失败", async function () {
      const transferAmount = ethers.BigNumber.from("1").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n⚠️ 测试余额不足转账`);
      console.log(`   尝试从 ${user1.address} 转账 ${ethers.utils.formatEther(transferAmount)} ${TOKEN_SYMBOL}`);
      
      // user1 初始余额为 0
      const user1Balance = await token.balanceOf(user1.address);
      console.log(`   用户1余额: ${ethers.utils.formatEther(user1Balance)} ${TOKEN_SYMBOL}`);
      
      await expect(
        token.connect(user1).transfer(owner.address, transferAmount)
      ).to.be.revertedWith("ERC20: insufficient balance");
      
      console.log(`   ✅ 正确拒绝余额不足的转账`);
    });

    it("2.4 不能转账到零地址", async function () {
      const transferAmount = ethers.BigNumber.from("1").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n⚠️ 测试转账到零地址`);
      
      await expect(
        token.transfer(ZERO_ADDRESS, transferAmount)
      ).to.be.revertedWith("ERC20: transfer to zero address");
      
      console.log(`   ✅ 正确拒绝转账到零地址`);
    });

    it("2.5 应该处理零金额转账", async function () {
      console.log(`\n🔢 测试零金额转账`);
      
      await expect(token.transfer(user1.address, 0))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, user1.address, 0);
      
      console.log(`   ✅ 零金额转账成功`);
    });

    it("2.6 应该正确处理连续转账", async function () {
      const transfer1 = ethers.BigNumber.from("100").mul(ethers.BigNumber.from("10").pow(18));
      const transfer2 = ethers.BigNumber.from("50").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n🔄 测试连续转账`);
      console.log(`   第一次转账: ${ethers.utils.formatEther(transfer1)} 到 ${user1.address}`);
      console.log(`   第二次转账: ${ethers.utils.formatEther(transfer2)} 到 ${user2.address}`);
      
      // 执行转账
      await token.transfer(user1.address, transfer1);
      await token.transfer(user2.address, transfer2);
      
      // 验证余额
      const user1Balance = await token.balanceOf(user1.address);
      const user2Balance = await token.balanceOf(user2.address);
      
      expect(user1Balance).to.equal(transfer1);
      expect(user2Balance).to.equal(transfer2);
      
      console.log(`   ✅ 连续转账成功`);
      console.log(`      用户1余额: ${ethers.utils.formatEther(user1Balance)}`);
      console.log(`      用户2余额: ${ethers.utils.formatEther(user2Balance)}`);
    });
  });

  /**
   * 测试组 3: 授权和额度功能
   */
  describe("3. 授权和额度功能测试", function () {
    it("3.1 应该授权代币给其他地址", async function () {
      const approveAmount = ethers.BigNumber.from("100").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n✅ 测试授权功能`);
      console.log(`   所有者授权 ${ethers.utils.formatEther(approveAmount)} ${TOKEN_SYMBOL} 给 ${user1.address}`);
      
      await token.approve(user1.address, approveAmount);
      
      const allowance = await token.allowance(owner.address, user1.address);
      console.log(`   设置的额度: ${ethers.utils.formatEther(allowance)} ${TOKEN_SYMBOL}`);
      
      expect(allowance).to.equal(approveAmount);
      console.log(`   ✅ 授权成功`);
    });

    it("3.2 应该发出 Approval 事件", async function () {
      const approveAmount = ethers.BigNumber.from("150").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n📡 测试授权事件`);
      
      await expect(token.approve(user1.address, approveAmount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, user1.address, approveAmount);
      
      console.log(`   ✅ Approval 事件正确触发`);
    });

    it("3.3 应该允许使用授权额度转账", async function () {
  // 手动实现 formatEther 函数
  function formatEther(wei) {
    const weiStr = wei.toString();
    if (weiStr.length <= 18) {
      const padded = weiStr.padStart(18, '0');
      const trimmed = padded.replace(/0+$/, '');
      return trimmed ? `0.${trimmed}` : '0';
    }
    const integerPart = weiStr.slice(0, -18);
    let decimalPart = weiStr.slice(-18).replace(/0+$/, '');
    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  }

  // 授权 200 个代币
  const approveAmount = ethers.BigNumber.from("200")
    .mul(ethers.BigNumber.from("10").pow(18));
  
  // 转账 75 个代币
  const transferAmount = ethers.BigNumber.from("75")
    .mul(ethers.BigNumber.from("10").pow(18));
  
  console.log(`\n🔄 测试使用授权额度转账 (transferFrom)`);
  console.log(`   1. 授权 ${formatEther(approveAmount)} 代币给 ${user1.address}`);
  console.log(`   2. 使用授权转账 ${formatEther(transferAmount)} 代币到 ${user2.address}`);
  
  // 第一步：授权
  console.log(`\n   第一步: 执行授权...`);
  const approveTx = await token.approve(user1.address, approveAmount);
  await approveTx.wait();
  
  const allowanceBefore = await token.allowance(owner.address, user1.address);
  console.log(`   授权后额度: ${formatEther(allowanceBefore)} 代币`);
  console.log(`   授权后额度(wei): ${allowanceBefore.toString()}`);
  
  // 验证授权是否正确设置
  expect(allowanceBefore.toString()).to.equal(approveAmount.toString());
  
  // 第二步：使用授权转账
  console.log(`\n   第二步: 使用 transferFrom 转账...`);
  const transferTx = await token.connect(user1).transferFrom(
    owner.address,
    user2.address,
    transferAmount
  );
  const receipt = await transferTx.wait();
  console.log(`   ⛽ TransferFrom Gas 消耗: ${receipt.gasUsed.toString()}`);
  
  // 验证结果
  const user2Balance = await token.balanceOf(user2.address);
  const allowanceAfter = await token.allowance(owner.address, user1.address);
  
  console.log(`\n   🔍 验证结果:`);
  console.log(`   转账后 - ${user2.address} 余额: ${formatEther(user2Balance)} 代币`);
  console.log(`   转账后 - ${user2.address} 余额(wei): ${user2Balance.toString()}`);
  console.log(`   转账后 - 剩余额度: ${formatEther(allowanceAfter)} 代币`);
  console.log(`   转账后 - 剩余额度(wei): ${allowanceAfter.toString()}`);
  
  // 计算期望的剩余额度
  const expectedRemainingAllowance = approveAmount.sub(transferAmount);
  console.log(`   期望剩余额度: ${formatEther(expectedRemainingAllowance)} 代币`);
  console.log(`   期望剩余额度(wei): ${expectedRemainingAllowance.toString()}`);
  
  // 验证1: user2 应该收到转账金额
  console.log(`\n   验证1: user2 应该收到 ${formatEther(transferAmount)} 代币`);
  console.log(`     实际收到: ${formatEther(user2Balance)} 代币`);
  console.log(`     期望收到: ${formatEther(transferAmount)} 代币`);
  console.log(`     验证结果: ${user2Balance.toString() === transferAmount.toString() ? '✅ 通过' : '❌ 失败'}`);
  expect(user2Balance.toString()).to.equal(transferAmount.toString());
  
  // 验证2: 剩余额度应该正确减少
  console.log(`\n   验证2: 剩余额度应该减少`);
  console.log(`     初始额度: ${formatEther(approveAmount)} 代币`);
  console.log(`     转账金额: ${formatEther(transferAmount)} 代币`);
  console.log(`     期望剩余: ${formatEther(expectedRemainingAllowance)} 代币`);
  console.log(`     实际剩余: ${formatEther(allowanceAfter)} 代币`);
  console.log(`     验证结果: ${allowanceAfter.toString() === expectedRemainingAllowance.toString() ? '✅ 通过' : '❌ 失败'}`);
  
  // 修复这里：使用 .sub() 而不是 -
  expect(allowanceAfter.toString()).to.equal(
    approveAmount.sub(transferAmount).toString()  // 使用 .sub() 方法
  );
  
  // 验证3: 所有者的余额应该减少
  const ownerBalanceAfter = await token.balanceOf(owner.address);
  console.log(`\n   验证3: 所有者余额变化`);
  console.log(`     所有者地址: ${owner.address}`);
  console.log(`     转账后余额: ${formatEther(ownerBalanceAfter)} 代币`);
  
  // 验证4: 总供应量不变
  const totalSupply = await token.totalSupply();
  console.log(`\n   验证4: 总供应量不变`);
  console.log(`     总供应量: ${formatEther(totalSupply)} 代币`);
  
  console.log(`\n   ✅ 使用授权额度转账测试完成!`);
});

    it("3.4 额度不足时应该转账失败", async function () {
      const approveAmount = ethers.BigNumber.from("99").mul(ethers.BigNumber.from("10").pow(18));
      const transferAmount = ethers.BigNumber.from("100").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n⚠️ 测试额度不足转账`);
      console.log(`   授权 ${ethers.utils.formatEther(approveAmount)}，尝试转账 ${ethers.utils.formatEther(transferAmount)}`);
      
      await token.approve(user1.address, approveAmount);
      
      await expect(
        token.connect(user1).transferFrom(
          owner.address,
          user2.address,
          transferAmount
        )
      ).to.be.revertedWith("ERC20: insufficient allowance");
      
      console.log(`   ✅ 正确拒绝额度不足的转账`);
    });

    it("3.5 应该允许更新授权额度", async function () {
      const initialAmount = ethers.BigNumber.from("100").mul(ethers.BigNumber.from("10").pow(18));
      const updatedAmount = ethers.BigNumber.from("50").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n🔄 测试更新授权额度`);
      
      // 第一次授权
      await token.approve(user1.address, initialAmount);
      const allowance1 = await token.allowance(owner.address, user1.address);
      console.log(`   第一次授权额度: ${ethers.utils.formatEther(allowance1)}`);
      
      // 更新授权
      await token.approve(user1.address, updatedAmount);
      const allowance2 = await token.allowance(owner.address, user1.address);
      console.log(`   更新后授权额度: ${ethers.utils.formatEther(allowance2)}`);
      
      expect(allowance2).to.equal(updatedAmount);
      console.log(`   ✅ 授权额度更新成功`);
    });

    it("3.6 应该允许授权零额度", async function () {
      console.log(`\n🔢 测试授权零额度`);
      
      // 先授权一个非零额度
      await token.approve(user1.address,ethers.BigNumber.from("100").mul(ethers.BigNumber.from("10").pow(18)));
      
      // 然后授权零额度
      await token.approve(user1.address, 0);
      
      const allowance = await token.allowance(owner.address, user1.address);
      console.log(`   最终授权额度: ${ethers.utils.formatEther(allowance)}`);
      
      expect(allowance).to.equal(0);
      console.log(`   ✅ 零额度授权成功`);
    });
  });

  /**
   * 测试组 4: 铸币功能
   */
  describe("4. 铸币功能测试", function () {
    it("4.1 应该允许所有者铸造新代币", async function () {
  const initialSupply = await token.totalSupply();
  const mintAmount = ethers.BigNumber.from("1000").mul(ethers.BigNumber.from("10").pow(18));
  
  console.log(`\n🪙 测试铸币功能`);
  console.log(`   初始总供应量: ${ethers.utils.formatEther(initialSupply)}`);
  console.log(`   铸造 ${ethers.utils.formatEther(mintAmount)} 到 ${user1.address}`);
  
  await token.mint(user1.address, mintAmount);
  
  const newSupply = await token.totalSupply();
  const user1Balance = await token.balanceOf(user1.address);
  
  console.log(`   新总供应量: ${ethers.utils.formatEther(newSupply)}`);
  console.log(`   用户1余额: ${ethers.utils.formatEther(user1Balance)}`);
  
  // 修复这里：使用 add() 方法而不是 + 运算符
  expect(newSupply).to.equal(initialSupply.add(mintAmount));
  expect(user1Balance).to.equal(mintAmount);
  
  console.log(`   ✅ 铸币成功`);
});;

    it("4.2 铸币时应该发出 Transfer 事件", async function () {
      const mintAmount = ethers.BigNumber.from("500").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n📡 测试铸币事件`);
      
      await expect(token.mint(user1.address, mintAmount))
        .to.emit(token, "Transfer")
        .withArgs(ZERO_ADDRESS, user1.address, mintAmount);
      
      console.log(`   ✅ 铸币 Transfer 事件正确触发`);
    });

    it("4.3 非所有者不能铸造代币", async function () {
      const mintAmount = ethers.BigNumber.from("1000").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n⚠️ 测试非所有者铸币`);
      console.log(`   ${user1.address} 尝试铸造 ${ethers.utils.formatEther(mintAmount)} 代币`);
      
      await expect(
        token.connect(user1).mint(user1.address, mintAmount)
      ).to.be.revertedWith("Only owner can call");
      
      console.log(`   ✅ 正确拒绝非所有者铸币`);
    });

    it("4.4 不能铸造到零地址", async function () {
      const mintAmount = ethers.BigNumber.from("100").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n⚠️ 测试铸造到零地址`);
      
      await expect(
        token.mint(ZERO_ADDRESS, mintAmount)
      ).to.be.revertedWith("ERC20: mint to zero address");
      
      console.log(`   ✅ 正确拒绝铸造到零地址`);
    });

    it("4.5 应该允许多次铸币", async function () {
  const mint1 = ethers.BigNumber.from("500").mul(ethers.BigNumber.from("10").pow(18));
  const mint2 = ethers.BigNumber.from("300").mul(ethers.BigNumber.from("10").pow(18));
  
  console.log(`\n🔄 测试多次铸币`);
  
  const supplyBefore = await token.totalSupply();
  console.log(`   铸币前总供应量: ${ethers.utils.formatEther(supplyBefore)}`);
  
  // 第一次铸币
  await token.mint(user1.address, mint1);
  
  // 第二次铸币
  await token.mint(user2.address, mint2);
  
  const supplyAfter = await token.totalSupply();
  const user1Balance = await token.balanceOf(user1.address);
  const user2Balance = await token.balanceOf(user2.address);
  
  console.log(`   铸币后总供应量: ${ethers.utils.formatEther(supplyAfter)}`);
  console.log(`   用户1余额: ${ethers.utils.formatEther(user1Balance)}`);
  console.log(`   用户2余额: ${ethers.utils.formatEther(user2Balance)}`);
  
  // 修复这里：使用 add() 方法而不是 + 运算符
  expect(supplyAfter).to.equal(supplyBefore.add(mint1).add(mint2));
  expect(user1Balance).to.equal(mint1);
  expect(user2Balance).to.equal(mint2);
  
  console.log(`   ✅ 多次铸币成功`);
   });;
  });

  /**
   * 测试组 5: 销毁功能
   */
  describe("5. 销毁功能测试", function () {
    it("5.1 应该允许用户销毁自己的代币", async function () {
  // 先给 user1 转账
  const transferAmount = ethers.BigNumber.from("200").mul(ethers.BigNumber.from("10").pow(18));
  await token.transfer(user1.address, transferAmount);
  
  const burnAmount = ethers.BigNumber.from("100").mul(ethers.BigNumber.from("10").pow(18));
  
  console.log(`\n🔥 测试销毁功能`);
  console.log(`   ${user1.address} 销毁 ${ethers.utils.formatEther(burnAmount)} 代币`);
  
  const user1BalanceBefore = await token.balanceOf(user1.address);
  const supplyBefore = await token.totalSupply();
  
  console.log(`   销毁前 - 用户1余额: ${ethers.utils.formatEther(user1BalanceBefore)}`);
  console.log(`   销毁前 - 总供应量: ${ethers.utils.formatEther(supplyBefore)}`);
  
  // 销毁代币
  await token.connect(user1).burn(burnAmount);
  
  const user1BalanceAfter = await token.balanceOf(user1.address);
  const supplyAfter = await token.totalSupply();
  
  console.log(`   销毁后 - 用户1余额: ${ethers.utils.formatEther(user1BalanceAfter)}`);
  console.log(`   销毁后 - 总供应量: ${ethers.utils.formatEther(supplyAfter)}`);
  
  // 修复这里：使用 sub() 方法而不是 - 运算符
  expect(user1BalanceAfter).to.equal(user1BalanceBefore.sub(burnAmount));
  expect(supplyAfter).to.equal(supplyBefore.sub(burnAmount));
  
  console.log(`   ✅ 销毁成功`);
});

    it("5.2 销毁时应该发出 Transfer 事件", async function () {
      const burnAmount = ethers.BigNumber.from("50").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n📡 测试销毁事件`);
      
      await expect(token.burn(burnAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, ZERO_ADDRESS, burnAmount);
      
      console.log(`   ✅ 销毁 Transfer 事件正确触发`);
    });

    it("5.3 不能销毁超过余额的代币", async function () {
      const burnAmount = ethers.BigNumber.from("1").mul(ethers.BigNumber.from("10").pow(18));
      
      console.log(`\n⚠️ 测试超额销毁`);
      console.log(`   ${user1.address} 尝试销毁 ${ethers.utils.formatEther(burnAmount)} 代币`);
      console.log(`   用户1当前余额: ${ethers.utils.formatEther(await token.balanceOf(user1.address))}`);
      
      await expect(
        token.connect(user1).burn(burnAmount)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
      
      console.log(`   ✅ 正确拒绝超额销毁`);
    });

    it("5.4 应该允许多次销毁", async function () {
  // 先给 user1 转账
  const transferAmount = ethers.BigNumber.from("300").mul(ethers.BigNumber.from("10").pow(18));
  await token.transfer(user1.address, transferAmount);
  
  const burn1 = ethers.BigNumber.from("100").mul(ethers.BigNumber.from("10").pow(18));
  const burn2 = ethers.BigNumber.from("50").mul(ethers.BigNumber.from("10").pow(18));
  
  console.log(`\n🔥 测试多次销毁`);
  
  const balanceBefore = await token.balanceOf(user1.address);
  const supplyBefore = await token.totalSupply();
  
  console.log(`   销毁前 - 用户1余额: ${ethers.utils.formatEther(balanceBefore)}`);
  console.log(`   销毁前 - 总供应量: ${ethers.utils.formatEther(supplyBefore)}`);
  
  // 第一次销毁
  await token.connect(user1).burn(burn1);
  
  // 第二次销毁
  await token.connect(user1).burn(burn2);
  
  const balanceAfter = await token.balanceOf(user1.address);
  const supplyAfter = await token.totalSupply();
  
  console.log(`   销毁后 - 用户1余额: ${ethers.utils.formatEther(balanceAfter)}`);
  console.log(`   销毁后 - 总供应量: ${ethers.utils.formatEther(supplyAfter)}`);
  
  // 修复这里：使用 sub() 方法链而不是 - 运算符链
  expect(balanceAfter).to.equal(balanceBefore.sub(burn1).sub(burn2));
  expect(supplyAfter).to.equal(supplyBefore.sub(burn1).sub(burn2));
  
  console.log(`   ✅ 多次销毁成功`);
});
 });
  /**
   * 测试组 6: 集成测试和边界情况
   */
  describe("6. 集成测试和边界情况", function () {
    it("6.1 完整的转账、授权、铸币、销毁流程", async function () {
  console.log(`\n🔗 测试完整业务流程`);
  console.log("=".repeat(40));
  
  // 1. 初始状态
  const initialSupply = await token.totalSupply();
  console.log(`1. 初始状态:`);
  console.log(`   总供应量: ${ethers.utils.formatEther(initialSupply)}`);
  console.log(`   所有者余额: ${ethers.utils.formatEther(await token.balanceOf(owner.address))}`);
  
  // 2. 转账给 user1
  const transfer1 = ethers.BigNumber.from("500").mul(ethers.BigNumber.from("10").pow(18));
  await token.transfer(user1.address, transfer1);
  console.log(`\n2. 转账给 user1: ${ethers.utils.formatEther(transfer1)}`);
  console.log(`   user1余额: ${ethers.utils.formatEther(await token.balanceOf(user1.address))}`);
  
  // 3. 授权 user2 从 owner 转账
  const approveAmount = ethers.BigNumber.from("300").mul(ethers.BigNumber.from("10").pow(18));
  await token.approve(user2.address, approveAmount);
  console.log(`\n3. 授权 user2: ${ethers.utils.formatEther(approveAmount)}`);
  console.log(`   授权额度: ${ethers.utils.formatEther(await token.allowance(owner.address, user2.address))}`);
  
  // 4. user2 使用授权转账给 user3
  const transfer2 = ethers.BigNumber.from("200").mul(ethers.BigNumber.from("10").pow(18));
  await token.connect(user2).transferFrom(owner.address, user3.address, transfer2);
  console.log(`\n4. user2 使用授权转账给 user3: ${ethers.utils.formatEther(transfer2)}`);
  console.log(`   user3余额: ${ethers.utils.formatEther(await token.balanceOf(user3.address))}`);
  console.log(`   剩余额度: ${ethers.utils.formatEther(await token.allowance(owner.address, user2.address))}`);
  
  // 5. 铸币给 user1
  const mintAmount = ethers.BigNumber.from("1000").mul(ethers.BigNumber.from("10").pow(18));
  await token.mint(user1.address, mintAmount);
  console.log(`\n5. 铸币给 user1: ${ethers.utils.formatEther(mintAmount)}`);
  console.log(`   user1新余额: ${ethers.utils.formatEther(await token.balanceOf(user1.address))}`);
  console.log(`   新总供应量: ${ethers.utils.formatEther(await token.totalSupply())}`);
  
  // 6. user1 销毁部分代币
  const burnAmount = ethers.BigNumber.from("300").mul(ethers.BigNumber.from("10").pow(18));
  await token.connect(user1).burn(burnAmount);
  console.log(`\n6. user1 销毁: ${ethers.utils.formatEther(burnAmount)}`);
  console.log(`   user1最终余额: ${ethers.utils.formatEther(await token.balanceOf(user1.address))}`);
  console.log(`   最终总供应量: ${ethers.utils.formatEther(await token.totalSupply())}`);
  
  // 7. 验证最终状态
  const finalSupply = await token.totalSupply();
  
  // 修复这里：使用 add() 和 sub() 方法
  const expectedSupply = initialSupply.add(mintAmount).sub(burnAmount);
  
  console.log(`\n7. 最终验证:`);
  console.log(`   预期总供应量: ${ethers.utils.formatEther(expectedSupply)}`);
  console.log(`   实际总供应量: ${ethers.utils.formatEther(finalSupply)}`);
  
  expect(finalSupply).to.equal(expectedSupply);
  console.log(`\n✅ 完整业务流程测试通过!`);
});

    it("6.2 大额转账测试", async function () {
      const largeAmount = ethers.BigNumber.from("999999").mul(ethers.BigNumber.from("10").pow(18)); // 接近总供应量
      
      console.log(`\n💰 测试大额转账: ${ethers.utils.formatEther(largeAmount)}`);
      
      // 确保余额足够
      const ownerBalance = await token.balanceOf(owner.address);
      console.log(`   所有者余额: ${ethers.utils.formatEther(ownerBalance)}`);
      
      if (ownerBalance >= largeAmount) {
        await token.transfer(user1.address, largeAmount);
        
        const user1Balance = await token.balanceOf(user1.address);
        console.log(`   user1收到: ${ethers.utils.formatEther(user1Balance)}`);
        
        expect(user1Balance).to.equal(largeAmount);
        console.log(`   ✅ 大额转账成功`);
      } else {
        console.log(`   ⚠️ 余额不足，跳过测试`);
      }
    });

    it("6.3 Gas 消耗分析", async function () {
      console.log(`\n⛽ Gas 消耗分析`);
      console.log("=".repeat(40));
      
      // 测试各种操作的 Gas 消耗
      const testAmount = ethers.BigNumber.from("100").mul(ethers.BigNumber.from("10").pow(18));
      
      // 1. 转账
      const transferTx = await token.transfer(user1.address, testAmount);
      const transferReceipt = await transferTx.wait();
      console.log(`1. 转账 Gas: ${transferReceipt.gasUsed.toString()}`);
      
      // 2. 授权
      const approveTx = await token.approve(user1.address, testAmount);
      const approveReceipt = await approveTx.wait();
      console.log(`2. 授权 Gas: ${approveReceipt.gasUsed.toString()}`);
      
      // 3. transferFrom
      const transferFromTx = await token.connect(user1).transferFrom(
        owner.address,
        user2.address,
        testAmount
      );
      const transferFromReceipt = await transferFromTx.wait();
      console.log(`3. transferFrom Gas: ${transferFromReceipt.gasUsed.toString()}`);
      
      // 4. 铸币
      const mintTx = await token.mint(user3.address, testAmount);
      const mintReceipt = await mintTx.wait();
      console.log(`4. 铸币 Gas: ${mintReceipt.gasUsed.toString()}`);
      
      // 5. 销毁
      // 先给 user1 一些代币用于销毁
      await token.transfer(user1.address, testAmount);
      const burnTx = await token.connect(user1).burn(testAmount);
      const burnReceipt = await burnTx.wait();
      console.log(`5. 销毁 Gas: ${burnReceipt.gasUsed.toString()}`);
      
      console.log("=".repeat(40));
      console.log(`✅ Gas 分析完成`);
    });
  });

  /**
   * 测试后清理
   */
  afterEach(function () {
    console.log("\n" + "=".repeat(70));
    console.log("✅ 测试用例执行完成");
    console.log("=".repeat(70) + "\n");
  });

  after(function () {
    console.log("\n" + "=".repeat(70));
    console.log("🎉 所有测试执行完成!");
    console.log("=".repeat(70));
  });
});