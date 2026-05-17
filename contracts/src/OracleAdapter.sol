// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/AggregatorV3Interface.sol";

contract OracleAdapter {
    AggregatorV3Interface public priceFeed;

    event OraclePriceUpdated(int256 price, uint256 updatedAt);

    constructor(address feedAddress) {
        require(feedAddress != address(0), "Invalid feed");
        priceFeed = AggregatorV3Interface(feedAddress);
    }

    function getLatestPrice() external view returns (int256, uint256) {
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        require(block.timestamp - updatedAt <= 300, "Price stale");
        return (price, updatedAt);
    }

    function getPriceAt(uint256) external view returns (int256) {
        revert("Historical lookup not supported");
    }

    function decimals() external view returns (uint8) {
        return priceFeed.decimals();
    }
}
