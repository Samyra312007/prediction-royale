// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/OracleAdapter.sol";

contract DeployOracle is Script {
    function run() external {
        address btcFeed = vm.envAddress("BTC_USD_FEED");
        vm.startBroadcast();
        OracleAdapter oracle = new OracleAdapter(btcFeed);
        vm.stopBroadcast();
        console.log("OracleAdapter deployed at:", address(oracle));
    }
}
