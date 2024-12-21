// 1：deployed contracts
// 1.1: import ethers.js
// 1.2: create main function
// 1.3: execute main function

// **********************************

// 2: verify contracts
// 2.1: use hardhat-verify
// 2.2: differentiation test network,testNetwork need verify contracts

// **********************************

// 3: interact contracts
// 3.1: init 2 accounts
// 3.2: fund contract with first account
// 3.3: check balance of contract
// 3.4: fund contract with second account
// 3.5: check mapping fundersToAmount
const {ethers} = require("hardhat");

const main = async () => {
    // 创建合约工程
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    console.log("contract deploying....")
    // deploy contract from factory
    const fundMe = await fundMeFactory.deploy(300);
    // waiting contract deployed success
    await fundMe.waitForDeployment();
    console.log("contract has been deployed successfully,contract address is " + fundMe.target);

    // 如果是本地网络，一般不进行校验，测试网络需要进行验证，这里可以使用chainId进行判断
    if (hre.network.config.chainId == 11155111 && process.env.EHTERSCAN_API_KEY) {
        console.log("waiting for 5 confirmations")
        // 一般来说希望等待合约部署成功之后，需要等待~5个区块左右再做验证
        await fundMe.deploymentTransaction().wait(5);
        await verifyFundMe(fundMe.target, [300])
    } else {
        console.log("verification skipped...")
    }
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
}

async function verifyFundMe(fundMeAddr, args) {

    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
    });
}

main().then().catch((error) => {
    console.error(error);
    process.exit(1);
})
