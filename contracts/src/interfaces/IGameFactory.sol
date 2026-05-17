// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGameFactory {
    function feeRecipient() external view returns (address);
    function protocolFeePercent() external view returns (uint256);
    function scoreEngine() external view returns (address);
    function participationNFT() external view returns (address);
}
