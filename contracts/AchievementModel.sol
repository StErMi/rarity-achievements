// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library AchievementModel {
    enum Kind {
        General,
        Quests,
        Exploration,
        PvP,
        Dungeons,
        Professions,
        WorldEvents
    }

    enum Difficulty {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    struct Achievement {
        uint256 id;
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
        // Kind kind;
        Difficulty difficulty;
        address source;
        string title;
        string description;
        uint256 points;
    }
}
