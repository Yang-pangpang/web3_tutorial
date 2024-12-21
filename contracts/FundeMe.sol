// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// 1：创建一个收款函数
// 2：记录投资人并查看
// 3：在锁定期内，达到目标值，生产商可以提款
// 4：在锁定期内，没有达到目标值，投资人在锁定期以后退款

contract FundMe {
    mapping(address => uint256) public Amount;
    // 最小众筹额度
    uint256 constant MINI_VALUE = 100 * 10**18;
    // 喂价
    AggregatorV3Interface internal dataFeed;
    // 目标值
    uint256 constant TARGET = 1000 * 10**18;
    // 发起者
    address public owner;
    // 开始时间（部署时间）
    uint256 deploymentTimestamp;
    // 锁定期时间
    uint256 lockTime;

    address erc20Address;

    bool public getFundSuccess = false;
    /**
     * Network: Sepolia
     * Aggregator: ETH/USD
     * Address: 0x694AA1769357215DE4FAC081bf1f309aDC325306
     */
    constructor(uint256 _lockTime) {
        owner = msg.sender;
        dataFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }

    function fund() external payable {
        require((convertEthToUsd(msg.value)) >= MINI_VALUE, "send more ETH");
        Amount[msg.sender] = msg.value;
        // 如果当前区块时间小于合约创建时间+锁定期，证明在有效期内
        require(
            block.timestamp < deploymentTimestamp + lockTime,
            "window is closed"
        );
    }

    /**
     * Returns the latest answer.
     */
    function getChainlinkDataFeedLatestAnswer() public view returns (int256) {
        // prettier-ignore
        (
        /* uint80 roundID */,
            int answer,
        /*uint startedAt*/,
        /*uint timeStamp*/,
        /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function convertEthToUsd(uint256 ethAmount)
    internal
    view
    returns (uint256)
    {
        // 1: 获取ETH单价
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return (ethAmount * ethPrice) / (10**18);
    }

    function transferOwnerShip(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function getFund() external windowClosed onlyOwner {
        require(
            convertEthToUsd(address(this).balance) >= TARGET,
            "Target is not reached"
        );
        // 1: transfer
        // 2: send
        // 3: call

        // transfer:transfer ETH and return false if failed
        // payable(msg.sender).transfer(address(this).balance);

        // send: transfer ETH and return false if failed
        // bool success = payable(msg.sender).send(address(this).balance);
        // require(success,"tx failed");

        // call
        bool success;
        (success, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        require(success, "transfer tx failed");
        getFundSuccess = true;
    }

    function refund() external windowClosed {
        // 达成target，不能退款
        require(
            convertEthToUsd(address(this).balance) < TARGET,
            "Target is reached"
        );
        // 先看当前账号是否退款过，先查余额
        require(Amount[msg.sender] != 0, "there is no fund for you");
        bool success;
        (success, ) = payable(msg.sender).call{value: Amount[msg.sender]}("");
        require(success, "transfer tx failed");
        Amount[msg.sender] = 0;
    }

    function editAmount(address funder, uint256 amountToUpdate) external {
        require(msg.sender == erc20Address, "You don't have permission to call this function" );
        Amount[funder] = amountToUpdate;
    }

    function setErc20Address(address _erc20Addr) public onlyOwner {
        erc20Address = _erc20Addr;
    }

    // 函數修飾符
    modifier windowClosed() {
        // 如果当前区块时间>合约创建时间+锁定期，证明在有效期内
        require(
            block.timestamp >= deploymentTimestamp + lockTime,
            "window is not closed"
        );
        _;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "this function is can only be called by owner"
        );
        _;
    }
}
