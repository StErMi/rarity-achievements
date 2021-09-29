//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./AchievementInterface.sol";
import "./AchievementModel.sol";

/**
 @title A contract to set a World Purpose
 @author Emanuele Ricci @StErMi
*/
contract RarityAchievement {
    using Counters for Counters.Counter;
    Counters.Counter private _metadataId;

    mapping(uint256 => AchievementModel.AchievementMetadata) public metadatas;
    mapping(uint256 => AchievementModel.Achievement[]) public achievements;
    mapping(uint256 => mapping(uint256 => bool)) private _ownerships;

    event AchievementAwarded(uint256 indexed summonerId, uint256 indexed metadataId, uint256 timestamp, uint256 points);

    /// @notice Register an achievement metadata
    function registerAchievement(AchievementModel.AchievementMetadata memory metadata) external returns (uint256 metadataId) {
        checkMetadata(metadata);
        _metadataId.increment();

        metadata.source = msg.sender;
        metadata.id = _metadataId.current();
        metadatas[metadata.id] = metadata;

        return metadata.id;
    }

    function awardAchievement(uint256 summonerId, uint256 metadataId) external {
        AchievementModel.AchievementMetadata storage metadata = metadatas[metadataId];
        require(metadata.source != address(0), "Requested metadata not exist");
        require(metadata.source == msg.sender, "You are not the owner of the metadata");
        require(_ownerships[summonerId][metadataId] == false, "Summoner already own the achievement");

        // Add the ownership to the summoner
        _ownerships[summonerId][metadataId] = true;

        // Add the achievement to the summoner's list
        uint256 timestamp = block.timestamp;
        achievements[summonerId].push(AchievementModel.Achievement(metadataId, summonerId, timestamp));

        emit AchievementAwarded(summonerId, metadataId, timestamp, metadata.points);
    }

    /////////////////////////
    // External Utilities
    /////////////////////////

    function hasAchievement(uint256 summonerId, uint256 metadataId) public view returns (bool) {
        return _ownerships[summonerId][metadataId];
    }

    function getPoints(uint256 summonerId, address[] memory sources) public view returns (uint256) {
        (, , uint256 points) = filterAchievements(summonerId, sources);
        return points;
    }

    function getAchievements(
        uint256 summonerId,
        address[] memory sources,
        uint256 offset,
        uint256 limit
    ) public view returns (AchievementModel.AchievementExpanded[] memory) {
        (AchievementModel.AchievementExpanded[] memory _tempList, uint256 maxWhitelistedLength, ) = filterAchievements(summonerId, sources);

        uint256 safeLimit = limit == 0 ? 2**32 - 1 : limit;

        if (safeLimit > maxWhitelistedLength) {
            require(maxWhitelistedLength >= offset, "Offset is greater than number of records available");
        }

        uint256 maxLen = safeLimit > maxWhitelistedLength ? maxWhitelistedLength - offset : safeLimit;
        AchievementModel.AchievementExpanded[] memory _achievements = new AchievementModel.AchievementExpanded[](maxLen);

        for (uint256 i = 0; i < maxLen; i++) {
            _achievements[i] = _tempList[offset + i];
        }

        return _achievements;
    }

    /////////////////////////
    // Internal Utilities
    /////////////////////////

    function filterAchievements(uint256 summonerId, address[] memory sources)
        internal
        view
        returns (
            AchievementModel.AchievementExpanded[] memory,
            uint256,
            uint256
        )
    {
        // Get the correct length
        uint256 achievementCount = achievements[summonerId].length;
        uint256 points = 0;
        AchievementModel.AchievementExpanded[] memory _tempList = new AchievementModel.AchievementExpanded[](achievementCount);

        uint256 maxWhitelistedLength = 0;
        for (uint256 i = 0; i < achievementCount; i++) {
            AchievementModel.Achievement storage _achievement = achievements[summonerId][i];
            AchievementModel.AchievementMetadata memory metadata = metadatas[_achievement.metadataId];

            bool whitelisted = false;
            if (sources.length > 0) {
                for (uint256 j = 0; j < sources.length; j++) {
                    if (metadata.source == sources[j]) {
                        whitelisted = true;
                        break;
                    }
                }

                if (whitelisted == false) {
                    // skip this achivement
                    continue;
                }
            }

            points += metadata.points;

            AchievementModel.AchievementExpanded memory achievement = AchievementModel.AchievementExpanded({
                metadata: metadata,
                summoner: _achievement.summoner,
                timestamp: _achievement.timestamp
            });
            _tempList[maxWhitelistedLength] = achievement;
            maxWhitelistedLength++;
        }

        return (_tempList, maxWhitelistedLength, points);
    }

    function checkMetadata(AchievementModel.AchievementMetadata memory _metadata) internal pure {
        require(
            _metadata.difficulty >= AchievementModel.Difficulty.Common && _metadata.difficulty <= AchievementModel.Difficulty.Legendary,
            "Invalid difficulty"
        );
        require(bytes(_metadata.source_name).length > 0, "Source Name must not be empty");
        require(bytes(_metadata.title).length > 0, "Title must not be empty");
        require(bytes(_metadata.description).length > 0, "Description must not be empty");
        require(_metadata.points > 0, "Points must be greater than 0");
    }
}
