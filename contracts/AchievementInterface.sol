// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AchievementModel.sol";

interface AchievementContractInterface {
    function whitelistAchievements(AchievementModel.AchievementMetadata[] memory _metadatas)
        external
        returns (AchievementModel.AchievementMetadata[] memory);

    function unlockAchievement(uint256 summonerId, uint256 achievementId) external;
}
