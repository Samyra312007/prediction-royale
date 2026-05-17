// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GameFactory.sol";
import "../src/ScoreEngine.sol";
import "../src/PrizeVault.sol";
import "../src/ParticipationNFT.sol";
import "../src/OracleAdapter.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");

        // Arbitrum Sepolia Chainlink feeds
        // BTC/USD: 0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69
        // ETH/USD: 0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165
        address btcFeed = 0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69;

        vm.startBroadcast(deployerPrivateKey);

        ScoreEngine scoreEngine = new ScoreEngine();
        ParticipationNFT nft = new ParticipationNFT(address(0)); // factory set below
        GameFactory factory = new GameFactory(feeRecipient, address(scoreEngine), address(nft));
        nft.setFactory(address(factory));
        nft.transferOwnership(address(factory));
        OracleAdapter oracleAdapter = new OracleAdapter(btcFeed);

        vm.stopBroadcast();

        console.log("GameFactory deployed at:", address(factory));
        console.log("ScoreEngine deployed at:", address(scoreEngine));
        console.log("ParticipationNFT deployed at:", address(nft));
        console.log("OracleAdapter deployed at:", address(oracleAdapter));
    }
}
