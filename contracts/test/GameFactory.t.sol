// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GameFactory.sol";
import "../src/ScoreEngine.sol";
import "../src/ParticipationNFT.sol";
import "../src/mocks/MockOracle.sol";

contract GameFactoryTest is Test {
    GameFactory factory;
    ScoreEngine scoreEngine;
    ParticipationNFT nft;
    MockOracle oracle;
    address feeRecipient = address(0x1234);
    address player1 = address(0xABCD);
    address player2 = address(0xDCBA);

    function setUp() public {
        scoreEngine = new ScoreEngine();
        nft = new ParticipationNFT(address(0));
        factory = new GameFactory(feeRecipient, address(scoreEngine), address(nft));
        nft.setFactory(address(factory));
        nft.transferOwnership(address(factory));
        oracle = new MockOracle(50000000000, 8);
    }

    function test_CreateGame_Success() public {
        address game = factory.createGame(0.01 ether, 5, 3, 20, address(oracle));
        assertTrue(game != address(0));
        assertEq(factory.gameCount(), 1);
    }

    function test_CreateGame_InvalidStake() public {
        vm.expectRevert("Stake must be > 0");
        factory.createGame(0, 5, 3, 20, address(oracle));
    }

    function test_CreateGame_InvalidPlayers() public {
        vm.expectRevert("Players 2-100");
        factory.createGame(0.01 ether, 1, 3, 20, address(oracle));
    }

    function test_CreateGame_InvalidRounds() public {
        vm.expectRevert("Rounds 1-20");
        factory.createGame(0.01 ether, 5, 0, 20, address(oracle));
    }

    function test_ProtocolFeeDefault() public view {
        assertEq(factory.protocolFeePercent(), 3);
    }

    function test_SetProtocolFee() public {
        factory.setProtocolFee(5);
        assertEq(factory.protocolFeePercent(), 5);
    }

    function test_GetActiveGames() public {
        address game = factory.createGame(0.01 ether, 5, 3, 20, address(oracle));
        address[] memory active = factory.getActiveGames();
        assertEq(active.length, 1);
        assertEq(active[0], game);
    }
}
