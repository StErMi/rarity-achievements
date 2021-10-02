// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../data/AchievementModel.sol";

interface AchievementContractInterface {
    function registerAchievement(AchievementModel.AchievementMetadata memory metadata) external returns (uint256 metadataId);

    function awardAchievement(uint256 summonerId, uint256 metadataId) external returns (bool success, string memory revertMessage);
}
