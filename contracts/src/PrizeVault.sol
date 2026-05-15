// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PrizeVault is ReentrancyGuard {
    address public linkedGame;
    address public factory;
    uint256 public totalPoolAmount;
    mapping(address => uint256) public pendingPayouts;
    mapping(address => bool) public hasClaimed;

    event Deposited(address indexed from, uint256 amount);
    event PayoutAllocated(address indexed player, uint256 amount);
    event PayoutClaimed(address indexed player, uint256 amount);

    modifier onlyLinkedGame() {
        require(msg.sender == linkedGame || msg.sender == factory, "Not authorized");
        _;
    }

    constructor(address _factory, address _linkedGame) {
        factory = _factory;
        linkedGame = _linkedGame;
    }

    function deposit() external payable {
        totalPoolAmount += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function allocatePrizes(
        address[] calldata winners,
        uint256[] calldata amounts
    ) external onlyLinkedGame nonReentrant {
        require(winners.length == amounts.length, "Length mismatch");
        uint256 total;
        for (uint256 i = 0; i < winners.length; i++) {
            require(winners[i] != address(0), "Invalid winner");
            require(amounts[i] > 0, "Zero amount");
            pendingPayouts[winners[i]] += amounts[i];
            total += amounts[i];
            emit PayoutAllocated(winners[i], amounts[i]);
        }
        require(total <= totalPoolAmount, "Exceeds pool");
        totalPoolAmount -= total;
    }

    function claimPayout() external nonReentrant {
        uint256 amount = pendingPayouts[msg.sender];
        require(amount > 0, "No pending payout");
        require(!hasClaimed[msg.sender], "Already claimed");
        hasClaimed[msg.sender] = true;
        pendingPayouts[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit PayoutClaimed(msg.sender, amount);
    }

    function getPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
