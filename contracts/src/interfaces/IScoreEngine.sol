// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IScoreEngine {
    function computeScore(
        int256 predictedValue,
        int256 resolvedValue,
        uint256 submissionTime,
        uint256 roundDeadline
    ) external pure returns (uint256 score);

    function rankPlayers(
        address[] calldata players,
        uint256[] calldata scores
    ) external pure returns (address[] memory ranked);

    function getEliminationCutoff(
        uint256 totalPlayers,
        uint256 eliminationPercent
    ) external pure returns (uint256 cutoffIndex);
}
