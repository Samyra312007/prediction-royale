// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GameLobby.sol";
import "./ParticipationNFT.sol";
import "./PrizeVault.sol";
import "./interfaces/IGameFactory.sol";

contract GameFactory is Ownable, ReentrancyGuard {
    uint256 public gameCount;
    uint256 public protocolFeePercent;
    address public feeRecipient;
    address public scoreEngine;
    address public participationNFT;
    mapping(uint256 => address) public games;
    mapping(address => address) public gameVaults;
    mapping(address => uint256[]) private playerGames;

    event GameCreated(uint256 indexed gameId, address gameAddress, address creator);

    constructor(address _feeRecipient, address _scoreEngine, address _participationNFT) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        scoreEngine = _scoreEngine;
        participationNFT = _participationNFT;
        protocolFeePercent = 3;
    }

    function setScoreEngine(address _scoreEngine) external onlyOwner {
        scoreEngine = _scoreEngine;
    }

    function setParticipationNFT(address _participationNFT) external onlyOwner {
        participationNFT = _participationNFT;
    }

    function createGame(
        uint256 stakeAmount,
        uint256 maxPlayers,
        uint256 roundCount,
        uint256 eliminationPercent,
        address oracleFeed
    ) external nonReentrant returns (address gameAddress) {
        require(stakeAmount > 0, "Stake must be > 0");
        require(maxPlayers >= 2 && maxPlayers <= 100, "Players 2-100");
        require(roundCount >= 1 && roundCount <= 20, "Rounds 1-20");
        require(eliminationPercent > 0 && eliminationPercent <= 50, "Elim 1-50%");
        require(oracleFeed != address(0), "Invalid oracle feed");

        gameCount++;
        GameLobby lobby = new GameLobby(
            address(this),
            gameCount,
            stakeAmount,
            maxPlayers,
            roundCount,
            eliminationPercent,
            oracleFeed
        );
        games[gameCount] = address(lobby);
        PrizeVault vault = new PrizeVault(address(this), address(lobby));
        gameVaults[address(lobby)] = address(vault);
        lobby.setPrizeVault(address(vault));
        ParticipationNFT(IGameFactory(address(this)).participationNFT()).authorizeGame(address(lobby));
        playerGames[msg.sender].push(gameCount);
        emit GameCreated(gameCount, address(lobby), msg.sender);
        return address(lobby);
    }

    function getActiveGames() external view returns (address[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= gameCount; i++) {
            if (games[i] != address(0)) {
                GameLobby lobby = GameLobby(payable(games[i]));
                if (lobby.state() == GameLobby.GameState.OPEN) {
                    count++;
                }
            }
        }
        address[] memory active = new address[](count);
        uint256 idx;
        for (uint256 i = 1; i <= gameCount; i++) {
            if (games[i] != address(0)) {
                GameLobby lobby = GameLobby(payable(games[i]));
                if (lobby.state() == GameLobby.GameState.OPEN) {
                    active[idx++] = games[i];
                }
            }
        }
        return active;
    }

    function getGamesByPlayer(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }

    function setProtocolFee(uint256 fee) external onlyOwner {
        require(fee <= 10, "Fee max 10%");
        protocolFeePercent = fee;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
}
