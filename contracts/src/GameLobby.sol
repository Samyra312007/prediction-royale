// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IOracleAdapter.sol";
import "./interfaces/IGameFactory.sol";

contract GameLobby is ReentrancyGuard {
    enum GameState { OPEN, ACTIVE, COMPLETED, CANCELLED }

    struct RoundData {
        uint256 roundId;
        uint256 startTime;
        uint256 endTime;
        uint256 revealDeadline;
        int256 targetValue;
        int256 resolvedValue;
        bool isResolved;
    }

    struct Prediction {
        bytes32 commitment;
        int256 predictedValue;
        bool submitted;
        bool revealed;
    }

    GameState public state;
    address public factory;
    address public creator;
    address public oracleFeed;
    uint256 public stakeAmount;
    uint256 public maxPlayers;
    uint256 public roundCount;
    uint256 public eliminationPercent;
    uint256 public currentRound;
    uint256 public prizePool;
    uint256 public constant COMMIT_DURATION = 30 seconds;
    uint256 public constant REVEAL_DURATION = 60 seconds;

    address[] public players;
    address[] public activePlayers;
    mapping(address => bool) public isEliminated;
    mapping(address => uint256) public scores;
    mapping(address => mapping(uint256 => Prediction)) public predictions;
    RoundData[] public rounds;

    address public winner;
    address public secondPlace;
    address public thirdPlace;

    modifier inState(GameState _state) {
        require(state == _state, "Wrong game state");
        _;
    }

    modifier onlyActivePlayer() {
        require(!isEliminated[msg.sender], "Player eliminated");
        require(_isPlayer(msg.sender), "Not a player");
        _;
    }

    event PlayerJoined(address indexed player, uint256 totalPlayers);
    event GameStarted(uint256 timestamp);
    event RoundStarted(uint256 roundId, int256 targetValue);
    event PredictionCommitted(address indexed player, uint256 roundId);
    event PredictionRevealed(address indexed player, uint256 roundId, int256 value);
    event RoundResolved(uint256 roundId, int256 result);
    event PlayerEliminated(address indexed player, uint256 roundId);
    event GameCompleted(address indexed winner, uint256 prizeAmount);

    constructor(
        address _factory,
        uint256 _stakeAmount,
        uint256 _maxPlayers,
        uint256 _roundCount,
        uint256 _eliminationPercent,
        address _oracleFeed
    ) {
        factory = _factory;
        creator = msg.sender;
        stakeAmount = _stakeAmount;
        maxPlayers = _maxPlayers;
        roundCount = _roundCount;
        eliminationPercent = _eliminationPercent;
        oracleFeed = _oracleFeed;
        state = GameState.OPEN;
    }

    function _isPlayer(address player) internal view returns (bool) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == player) return true;
        }
        return false;
    }

    function joinGame() external payable inState(GameState.OPEN) {
        require(msg.value == stakeAmount, "Wrong stake amount");
        require(players.length < maxPlayers, "Game full");
        require(!_isPlayer(msg.sender), "Already joined");

        players.push(msg.sender);
        activePlayers.push(msg.sender);
        prizePool += msg.value;

        emit PlayerJoined(msg.sender, players.length);

        if (players.length == maxPlayers) {
            _startGame();
        }
    }

    function startGame() external inState(GameState.OPEN) {
        require(players.length >= 2, "Need at least 2 players");
        _startGame();
    }

    function _startGame() internal {
        state = GameState.ACTIVE;
        emit GameStarted(block.timestamp);
        _startRound();
    }

    function _startRound() internal {
        currentRound++;
        require(currentRound <= roundCount, "All rounds done");

        (int256 price, ) = IOracleAdapter(oracleFeed).getLatestPrice();
        int256 baseline = price;
        int256 target = baseline + (baseline * 5) / 10000;

        RoundData memory newRound = RoundData({
            roundId: currentRound,
            startTime: block.timestamp,
            endTime: block.timestamp + COMMIT_DURATION,
            revealDeadline: block.timestamp + COMMIT_DURATION + REVEAL_DURATION,
            targetValue: target,
            resolvedValue: 0,
            isResolved: false
        });
        rounds.push(newRound);

        emit RoundStarted(currentRound, target);
    }

    function submitCommitment(bytes32 commitment) external onlyActivePlayer {
        require(state == GameState.ACTIVE, "Game not active");
        RoundData storage round = rounds[currentRound - 1];
        require(block.timestamp >= round.startTime, "Round not started");
        require(block.timestamp <= round.endTime, "Commit window closed");
        require(!predictions[msg.sender][currentRound].submitted, "Already committed");

        predictions[msg.sender][currentRound] = Prediction({
            commitment: commitment,
            predictedValue: 0,
            submitted: true,
            revealed: false
        });

        emit PredictionCommitted(msg.sender, currentRound);
    }

    function revealPrediction(int256 value, bytes32 salt) external {
        require(state == GameState.ACTIVE, "Game not active");
        Prediction storage pred = predictions[msg.sender][currentRound];
        require(pred.submitted, "Not committed");
        require(!pred.revealed, "Already revealed");
        require(block.timestamp <= rounds[currentRound - 1].revealDeadline, "Reveal window closed");

        bytes32 expectedCommitment = keccak256(abi.encodePacked(value, salt, msg.sender));
        require(expectedCommitment == pred.commitment, "Invalid reveal");

        pred.revealed = true;
        pred.predictedValue = value;

        emit PredictionRevealed(msg.sender, currentRound, value);
    }

    function resolveRound() external {
        require(state == GameState.ACTIVE, "Game not active");
        RoundData storage round = rounds[currentRound - 1];
        require(!round.isResolved, "Already resolved");
        require(block.timestamp > round.revealDeadline, "Reveal window not closed");

        (int256 resolvedPrice, ) = IOracleAdapter(oracleFeed).getLatestPrice();
        round.resolvedValue = resolvedPrice;
        round.isResolved = true;

        for (uint256 i = 0; i < activePlayers.length; i++) {
            address player = activePlayers[i];
            if (isEliminated[player]) continue;

            Prediction storage pred = predictions[player][currentRound];
            if (!pred.revealed) {
                scores[player] += 0;
                continue;
            }

            uint256 roundScore = _computeScore(pred.predictedValue, resolvedPrice, round.startTime, round.endTime);
            scores[player] += roundScore;
        }

        emit RoundResolved(currentRound, resolvedPrice);
    }

    function _computeScore(int256 predicted, int256 resolved, uint256 startTime, uint256 deadline) internal pure returns (uint256) {
        if (resolved == 0) return 0;
        uint256 diff = abs(predicted - resolved);
        uint256 baseScore = 100 - (diff * 100) / uint256(resolved);
        if (baseScore > 100) baseScore = 0;

        uint256 timeBonus = 0;
        if (deadline > startTime) {
            timeBonus = ((deadline - startTime) * 10) / deadline;
        }

        return baseScore + timeBonus;
    }

    function abs(int256 x) internal pure returns (uint256) {
        return uint256(x < 0 ? -x : x);
    }

    function eliminatePlayers() external {
        require(state == GameState.ACTIVE, "Game not active");
        require(rounds[currentRound - 1].isResolved, "Round not resolved");

        uint256 remainingCount;
        for (uint256 i = 0; i < activePlayers.length; i++) {
            if (!isEliminated[activePlayers[i]]) remainingCount++;
        }

        uint256 toEliminate = maxPlayers >= 20
            ? (remainingCount * eliminationPercent) / 100
            : 1;

        if (toEliminate == 0) toEliminate = 1;
        if (toEliminate >= remainingCount) toEliminate = remainingCount - 1;

        address[] memory sorted = _sortPlayersByScore(activePlayers);
        uint256 eliminated;
        for (uint256 i = sorted.length; i > 0 && eliminated < toEliminate; i--) {
            if (!isEliminated[sorted[i - 1]]) {
                isEliminated[sorted[i - 1]] = true;
                emit PlayerEliminated(sorted[i - 1], currentRound);
                eliminated++;
            }
        }

        uint256 alive;
        for (uint256 i = 0; i < activePlayers.length; i++) {
            if (!isEliminated[activePlayers[i]]) alive++;
        }

        if (alive <= 1 || currentRound >= roundCount) {
            _completeGame();
        } else {
            _startRound();
        }
    }

    function _sortPlayersByScore(address[] memory _players) internal view returns (address[] memory) {
        address[] memory sorted = _players;
        uint256 n = sorted.length;
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (scores[sorted[j]] > scores[sorted[j + 1]]) {
                    address tmp = sorted[j];
                    sorted[j] = sorted[j + 1];
                    sorted[j + 1] = tmp;
                }
            }
        }
        return sorted;
    }

    function _completeGame() internal {
        state = GameState.COMPLETED;

        address[] memory ranked = _sortPlayersByScore(activePlayers);
        uint256 alive;
        for (uint256 i = 0; i < ranked.length; i++) {
            if (!isEliminated[ranked[i]]) alive++;
        }

        if (alive >= 3) {
            winner = ranked[ranked.length - 1];
            secondPlace = ranked[ranked.length - 2];
            thirdPlace = ranked[ranked.length - 3];
        } else if (alive == 2) {
            winner = ranked[ranked.length - 1];
            secondPlace = ranked[ranked.length - 2];
        } else if (alive == 1) {
            winner = ranked[ranked.length - 1];
        }

        uint256 fee = (prizePool * 3) / 100;
        uint256 remainingPool = prizePool - fee;

        if (winner != address(0)) {
            uint256 winnerShare = (remainingPool * 70) / 100;
            payable(winner).transfer(winnerShare);
        }
        if (secondPlace != address(0)) {
            uint256 secondShare = (remainingPool * 20) / 100;
            payable(secondPlace).transfer(secondShare);
        }
        if (thirdPlace != address(0)) {
            uint256 thirdShare = (remainingPool * 10) / 100;
            payable(thirdPlace).transfer(thirdShare);
        }

        if (fee > 0) {
            payable(IGameFactory(factory).feeRecipient()).transfer(fee);
        }

        emit GameCompleted(winner, remainingPool);
    }

    function emergencyWithdraw() external {
        require(msg.sender == factory, "Only factory");
        require(state == GameState.CANCELLED, "Not cancelled");
        for (uint256 i = 0; i < activePlayers.length; i++) {
            if (!isEliminated[activePlayers[i]]) {
                payable(activePlayers[i]).transfer(stakeAmount);
            }
        }
    }

    function getRoundCount() external view returns (uint256) {
        return rounds.length;
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getActivePlayers() external view returns (address[] memory) {
        return activePlayers;
    }

    receive() external payable {}
}
