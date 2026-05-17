// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ScoreEngine {
    function computeScore(
        int256 predictedValue,
        int256 resolvedValue,
        uint256 submissionTime,
        uint256 roundDeadline
    ) external pure returns (uint256 score) {
        if (resolvedValue == 0) return 0;
        uint256 diff = abs(predictedValue - resolvedValue);
        uint256 baseScore = 100 - (diff * 100) / uint256(resolvedValue);
        if (baseScore > 100) baseScore = 0;
        uint256 timeBonus = 0;
        if (roundDeadline > submissionTime) {
            timeBonus = ((roundDeadline - submissionTime) * 10) / (roundDeadline - submissionTime + 1 days);
        }
        return baseScore + timeBonus;
    }

    function rankPlayers(
        address[] calldata players,
        uint256[] calldata scores_
    ) external pure returns (address[] memory ranked) {
        require(players.length == scores_.length, "Length mismatch");
        ranked = players;
        uint256[] memory scoresMem = scores_;
        uint256 n = ranked.length;
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (scoresMem[j] > scoresMem[j + 1]) {
                    address tmpAddr = ranked[j];
                    ranked[j] = ranked[j + 1];
                    ranked[j + 1] = tmpAddr;
                    uint256 tmpScore = scoresMem[j];
                    scoresMem[j] = scoresMem[j + 1];
                    scoresMem[j + 1] = tmpScore;
                }
            }
        }
    }

    function getEliminationCutoff(
        uint256 totalPlayers,
        uint256 eliminationPercent
    ) external pure returns (uint256 cutoffIndex) {
        uint256 toEliminate = (totalPlayers * eliminationPercent) / 100;
        if (toEliminate == 0) toEliminate = 1;
        if (toEliminate >= totalPlayers) toEliminate = totalPlayers - 1;
        return toEliminate;
    }

    function abs(int256 x) internal pure returns (uint256) {
        return uint256(x < 0 ? -x : x);
    }
}
