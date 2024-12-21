const {task} = require("hardhat/config")

task("deploy-fundMe","deploy and verify fundMe contract").setAction(async (taskArgs, hre) => {
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
})


async function verifyFundMe(fundMeAddr, args) {

    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
    });
}

module.exports= {}
