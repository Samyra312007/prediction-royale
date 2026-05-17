// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GameFactory.sol";
import "../src/GameLobby.sol";
import "../src/ScoreEngine.sol";
import "../src/ParticipationNFT.sol";
import "../src/mocks/MockOracle.sol";
import "../src/OracleAdapter.sol";

contract GameLobbyTest is Test {
    GameFactory factory;
    GameLobby lobby;
    MockOracle mockOracle;
    OracleAdapter oracleAdapter;
    ScoreEngine scoreEngine;
    ParticipationNFT nft;
    address feeRecipient = address(0x1234);
    address player1 = address(0x1111);
    address player2 = address(0x2222);
    address player3 = address(0x3333);
    address player4 = address(0x4444);
    address player5 = address(0x5555);

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
    }

    function test_JoinGame_Success() public {
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        lobby.joinGame{value: 0.01 ether}();
        assertEq(lobby.getPlayers().length, 1);
    }

    function test_JoinGame_WrongStake() public {
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        vm.expectRevert("Wrong stake amount");
        lobby.joinGame{value: 0.005 ether}();
    }

    function test_CommitReveal_Success() public {
        _joinAll();

        bytes32 salt = keccak256("salt123");
        int256 predictedValue = 50050000000;

        bytes32 commitment = keccak256(abi.encodePacked(predictedValue, salt, player1));

        vm.prank(player1);
        lobby.submitCommitment(commitment);

        skip(31 seconds);

        vm.prank(player1);
        lobby.revealPrediction(predictedValue, salt);
    }

    function test_FullGameFlow() public {
        _joinAll();
        _playRounds();
        _verifyPayouts();
    }

    function _joinAll() internal {
        address[5] memory players = [player1, player2, player3, player4, player5];
        for (uint256 i = 0; i < players.length; i++) {
            vm.deal(players[i], 1 ether);
            vm.prank(players[i]);
            lobby.joinGame{value: 0.01 ether}();
        }
    }

    function _playRounds() internal {
        for (uint256 r = 1; r <= 3; r++) {
            _doCommitPhase(r);
            _doRevealPhase();
            _doResolveAndEliminate();
        }
    }

    function _doCommitPhase(uint256 roundNum) internal {
        address[5] memory players = [player1, player2, player3, player4, player5];
        for (uint256 i = 0; i < players.length; i++) {
            if (lobby.isEliminated(players[i])) continue;

            bytes32 salt = keccak256(abi.encodePacked("salt", players[i], roundNum));
            int256 val = int256(50000000000 + int256(i) * 100000000);
            bytes32 commitment = keccak256(abi.encodePacked(val, salt, players[i]));

            vm.prank(players[i]);
            lobby.submitCommitment(commitment);

            skip(2 seconds);
        }
    }

    function _doRevealPhase() internal {
        skip(35 seconds);

        address[5] memory players = [player1, player2, player3, player4, player5];
        for (uint256 i = 0; i < players.length; i++) {
            if (lobby.isEliminated(players[i])) continue;

            bytes32 salt = keccak256(abi.encodePacked("salt", players[i], lobby.currentRound()));
            int256 val = int256(50000000000 + int256(i) * 100000000);

            vm.prank(players[i]);
            lobby.revealPrediction(val, salt);
        }
    }

    function _doResolveAndEliminate() internal {
        skip(70 seconds);
        mockOracle.setPrice(50000000000);
        lobby.resolveRound();
        lobby.eliminatePlayers();
    }

    function _verifyPayouts() internal {
        assertTrue(lobby.state() == GameLobby.GameState.COMPLETED);
        assertTrue(lobby.winner() != address(0));
    }
}
