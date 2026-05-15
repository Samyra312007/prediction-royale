// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/AggregatorV3Interface.sol";

contract MockOracle is AggregatorV3Interface {
    int256 private _price;
    uint8 private _decimals;
    uint256 private _updatedAt;

    constructor(int256 initialPrice, uint8 priceDecimals) {
        _price = initialPrice;
        _decimals = priceDecimals;
        _updatedAt = block.timestamp;
    }

    function setPrice(int256 price) external {
        _price = price;
        _updatedAt = block.timestamp;
    }

    function decimals() external view returns (uint8) { return _decimals; }
    function description() external pure returns (string memory) { return "Mock Oracle"; }
    function version() external pure returns (uint256) { return 1; }

    function getRoundData(uint80) external view returns (uint80, int256, uint256, uint256, uint80) {
        return (0, _price, 0, _updatedAt, 0);
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (0, _price, 0, _updatedAt, 0);
    }
}
