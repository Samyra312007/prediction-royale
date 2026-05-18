// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GameFactory.sol";
import "../src/GameLobby.sol";
import "../src/ScoreEngine.sol";
import "../src/ParticipationNFT.sol";
import "../src/PrizeVault.sol";
import "../src/mocks/MockOracle.sol";
import "../src/OracleAdapter.sol";

contract EdgeCasesTest is Test {
    GameFactory factory;
    GameLobby lobby;
    PrizeVault vault;
    ScoreEngine scoreEngine;
    ParticipationNFT nft;
    MockOracle mockOracle;
    OracleAdapter oracleAdapter;
    address feeRecipient = address(0x1234);
    address player1 = address(0x1111);
    address player2 = address(0x2222);
    address player3 = address(0x3333);
    address nonPlayer = address(0xDEAD);

    function setUp() public {
        scoreEngine = new ScoreEngine();
        nft = new ParticipationNFT(address(0));
        factory = new GameFactory(feeRecipient, address(scoreEngine), address(nft));
        nft.setFactory(address(factory));
        nft.transferOwnership(address(factory));
        mockOracle = new MockOracle(50000000000, 8);
        oracleAdapter = new OracleAdapter(address(mockOracle));
        address gameAddr = factory.createGame(0.01 ether, 5, 3, 20, address(oracleAdapter));
        lobby = GameLobby(payable(gameAddr));
        vault = PrizeVault(payable(factory.gameVaults(address(lobby))));
    }

    function _join(uint256 count) internal {
        address[5] memory wallets = [player1, player2, player3, address(0x4444), address(0x5555)];
        for (uint256 i = 0; i < count && i < 5; i++) {
            vm.deal(wallets[i], 1 ether);
            vm.prank(wallets[i]);
            lobby.joinGame{value: 0.01 ether}();
        }
    }

    function test_RevertJoin_WhenFull() public {
        _join(5);
        vm.deal(address(0x6666), 1 ether);
        vm.prank(address(0x6666));
        vm.expectRevert("Wrong game state");
        lobby.joinGame{value: 0.01 ether}();
    }

    function test_RevertJoin_Duplicate() public {
        _join(1);
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        vm.expectRevert("Already joined");
        lobby.joinGame{value: 0.01 ether}();
    }

    function test_RevertJoin_WrongStake() public {
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        vm.expectRevert("Wrong stake amount");
        lobby.joinGame{value: 0.005 ether}();
    }

    function test_RevertJoin_WhenActive() public {
        _join(5);
        vm.deal(address(0x6666), 1 ether);
        vm.prank(address(0x6666));
        vm.expectRevert("Wrong game state");
        lobby.joinGame{value: 0.01 ether}();
    }

    function test_RevertCommit_AfterWindow() public {
        _join(5);
        vm.warp(block.timestamp + 31 seconds);
        vm.prank(player2);
        bytes32 cmt = keccak256(abi.encodePacked(int256(100), bytes32(0), player2));
        vm.expectRevert("Commit window closed");
        lobby.submitCommitment(cmt);
    }

    function test_RevertReveal_WithoutCommit() public {
        _join(5);
        vm.prank(player2);
        vm.expectRevert("Not committed");
        lobby.revealPrediction(100, bytes32(0));
    }

    function test_RevertCommit_IfEliminated() public {
        _join(5);
        _playOneRound();
        address eliminated = _findEliminated();
        assertTrue(eliminated != address(0), "Should have eliminated someone");
        bytes32 cmt = keccak256(abi.encodePacked(int256(100), bytes32(0), eliminated));
        vm.prank(eliminated);
        vm.expectRevert("Player eliminated");
        lobby.submitCommitment(cmt);
    }

    function test_RevertCommit_NonPlayer() public {
        vm.prank(nonPlayer);
        bytes32 cmt = keccak256(abi.encodePacked(int256(100), bytes32(0), nonPlayer));
        vm.expectRevert("Not a player");
        lobby.submitCommitment(cmt);
    }

    function test_RevertStartGame_TooFewPlayers() public {
        vm.prank(player1);
        vm.expectRevert("Need at least 2 players");
        lobby.startGame();
    }

    function test_RevertResolve_BeforeRevealWindow() public {
        _join(5);
        vm.expectRevert("Reveal window not closed");
        lobby.resolveRound();
    }

    function test_RevertEliminate_WithoutResolve() public {
        _join(5);
        vm.warp(block.timestamp + 200 seconds);
        vm.expectRevert("Round not resolved");
        lobby.eliminatePlayers();
    }

    function test_RevertReveal_WrongHash() public {
        _join(5);
        bytes32 cmt = keccak256(abi.encodePacked(int256(100), bytes32(0), player1));
        vm.prank(player1);
        lobby.submitCommitment(cmt);
        vm.warp(block.timestamp + 31 seconds);
        vm.prank(player1);
        vm.expectRevert("Invalid reveal");
        lobby.revealPrediction(999, bytes32(0));
    }

    function test_RevertDoubleReveal() public {
        _join(5);
        _commitAndReveal(player1);
        vm.warp(block.timestamp + 31 seconds);
        vm.prank(player1);
        vm.expectRevert("Already revealed");
        lobby.revealPrediction(100, bytes32(0));
    }

    function test_RevertDoubleCommit() public {
        _join(5);
        bytes32 cmt = keccak256(abi.encodePacked(int256(100), bytes32(0), player1));
        vm.prank(player1);
        lobby.submitCommitment(cmt);
        vm.prank(player1);
        vm.expectRevert("Already committed");
        lobby.submitCommitment(cmt);
    }

    function test_RevertStartGame_InWrongState() public {
        _join(5);
        vm.prank(player1);
        vm.expectRevert("Wrong game state");
        lobby.startGame();
    }

    function test_RevertEmergencyWithdraw_NotFactory() public {
        vm.prank(nonPlayer);
        vm.expectRevert("Only factory");
        lobby.emergencyWithdraw();
    }

    function test_RevertEmergencyWithdraw_NotCancelled() public {
        vm.prank(address(factory));
        vm.expectRevert("Not cancelled");
        lobby.emergencyWithdraw();
    }

    function test_ScoreComputation_Accuracy() public {
        _join(5);
        bytes32 salt = bytes32(uint256(1));
        bytes32 cmt = keccak256(abi.encodePacked(int256(50100000000), salt, player1));
        vm.prank(player1);
        lobby.submitCommitment(cmt);
        vm.warp(block.timestamp + 31 seconds);
        vm.prank(player1);
        lobby.revealPrediction(50100000000, salt);
        vm.warp(block.timestamp + 61 seconds);
        lobby.resolveRound();
        assertTrue(lobby.scores(player1) > 0, "Score should be > 0");
    }

    function test_Score_ZeroForMissedReveal() public {
        _join(5);
        bytes32 cmt = keccak256(abi.encodePacked(int256(100), bytes32(0), player1));
        vm.prank(player1);
        lobby.submitCommitment(cmt);
        vm.warp(block.timestamp + 100 seconds);
        lobby.resolveRound();
        assertEq(lobby.scores(player1), 0, "Missed reveal = 0 score");
    }

    function test_Factory_SetFee() public {
        vm.prank(factory.owner());
        factory.setProtocolFee(5);
        assertEq(factory.protocolFeePercent(), 5);
    }

    function test_Factory_RevertSetFee_NonOwner() public {
        vm.prank(nonPlayer);
        vm.expectRevert();
        factory.setProtocolFee(5);
    }

    function test_Factory_RevertSetFee_TooHigh() public {
        vm.prank(factory.owner());
        vm.expectRevert("Fee max 10%");
        factory.setProtocolFee(15);
    }

    function test_SinglePlayerLeft_Wins() public {
        _join(2);
        vm.prank(player1);
        lobby.startGame();
        _playOneRound();
        assertEq(uint256(lobby.state()), uint256(GameLobby.GameState.COMPLETED), "Should complete with 1 winner");
        assertTrue(lobby.winner() != address(0), "Winner should be set");
        assertTrue(address(vault) != address(0), "PrizeVault not set");
        assertTrue(vault.pendingPayouts(lobby.winner()) > 0, "Winner payout allocated");
    }

    function _playOneRound() internal {
        address[] memory allPlayers = lobby.getPlayers();
        uint256 ts = block.timestamp;
        for (uint256 i = 0; i < allPlayers.length; i++) {
            if (lobby.isEliminated(allPlayers[i])) continue;
            bytes32 salt = bytes32(uint256(uint160(allPlayers[i])));
            bytes32 cmt = keccak256(abi.encodePacked(int256(50000000000), salt, allPlayers[i]));
            vm.prank(allPlayers[i]);
            lobby.submitCommitment(cmt);
            ts += 2;
            vm.warp(ts);
        }
        ts += 29;
        vm.warp(ts);
        for (uint256 i = 0; i < allPlayers.length; i++) {
            if (lobby.isEliminated(allPlayers[i])) continue;
            bytes32 salt = bytes32(uint256(uint160(allPlayers[i])));
            vm.prank(allPlayers[i]);
            lobby.revealPrediction(50000000000, salt);
            ts += 2;
            vm.warp(ts);
        }
        ts += 70;
        vm.warp(ts);
        mockOracle.setPrice(50000000000);
        lobby.resolveRound();
        lobby.eliminatePlayers();
    }

    function _findEliminated() internal view returns (address) {
        address[] memory allPlayers = lobby.getPlayers();
        for (uint256 i = 0; i < allPlayers.length; i++) {
            if (lobby.isEliminated(allPlayers[i])) return allPlayers[i];
        }
        return address(0);
    }

    function _commitAndReveal(address player) internal {
        bytes32 salt = bytes32(uint256(uint160(player)));
        bytes32 cmt = keccak256(abi.encodePacked(int256(100), salt, player));
        vm.prank(player);
        lobby.submitCommitment(cmt);
        vm.warp(block.timestamp + 31 seconds);
        vm.prank(player);
        lobby.revealPrediction(100, salt);
    }
}
