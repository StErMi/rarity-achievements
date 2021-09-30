// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library AchievementModel {
    enum Difficulty {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    struct Achievement {
        uint256 metadataId;
        uint256 summoner;
        uint256 timestamp;
    }

    struct AchievementExpanded {
        AchievementMetadata metadata;
        uint256 summoner;
        uint256 timestamp;
    }

    struct AchievementMetadata {
        uint256 id;
        Difficulty difficulty;
        address source;
        string source_name;
        string title;
        string description;
        uint256 points;
    }
}
