// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CandyCrushBase
 * @dev A simple smart contract to record on-chain activity for the Candy Crush game on Base.
 */
contract CandyCrushBase {
    // Events to track on-chain activity
    event CheckIn(address indexed user, uint256 timestamp);
    event ScoreSubmitted(address indexed user, uint256 score, uint256 timestamp);

    /**
     * @dev Called by the user for daily check-in.
     */
    function checkIn() external {
        emit CheckIn(msg.sender, block.timestamp);
    }

    /**
     * @dev Called by the user to submit their score.
     * @param score The score achieved in the game.
     */
    function submitScore(uint256 score) external {
        emit ScoreSubmitted(msg.sender, score, block.timestamp);
    }
}
