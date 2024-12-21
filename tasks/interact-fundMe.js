const { task } = require("hardhat/config");

task("interact-fundMe","interact with fundMe contract")
    .addParam("addr","fundMe contract address")
    .setAction(async (taskArgs,hre)=>{
        const fundMeFactory = await ethers.getContractFactory("FundMe");
        const fundMe = fundMeFactory.attach(taskArgs.addr);
    // 3: interact contracts
    // 3.1: init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners();

    // 3.2: fund contract with first account
    const fundTx = await fundMe.fund({value:ethers.parseEther("0.5")});
    await  fundTx.wait();

    // 3.3: check balance of contract
    const balanceOfContract = ethers.provider.getBalance(fundMe.target);
    console.log(`balance of the contract is ${balanceOfContract}`);

    // 3.4: fund contract with second account
    const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({value:ethers.parseEther("0.5")});
    await  fundTxWithSecondAccount.wait();

    // 3.3: check balance of contract
    const balanceOfContractAfterSecondFund = ethers.provider.getBalance(fundMe.target);
    console.log(`balance of the contract is ${balanceOfContractAfterSecondFund}`);

    // 3.5: check mapping fundersToAmount
    const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address);
    const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address);
    console.log(`Balance of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`);
    console.log(`Balance of second account ${secondAccount.address} is ${secondAccountBalanceInFundMe}`);
});

module.exports = {}
