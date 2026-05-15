// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGameFactory {
    function feeRecipient() external view returns (address);
    function protocolFeePercent() external view returns (uint256);
}
