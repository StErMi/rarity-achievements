//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./AchievementInterface.sol";
import "./AchievementModel.sol";

/**
 @title A contract to set a World Purpose
 @author Emanuele Ricci @StErMi
*/
contract AchievementContract is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _achievementId;

    /// @notice Contracts that can push achievements
    mapping(address => AchievementModel.SourceMetadata) public whitelistedSources;
    mapping(address => bool) public whitelistedAddedMetadatas;

    mapping(uint256 => AchievementModel.AchievementMetadata) metadatas;
    mapping(uint256 => AchievementModel.Achievement[]) summonerAchievements;
    mapping(uint256 => uint256) summonerAchievementPoints;

    /// @notice Event to track new Purpose
    event AchievementUnlocked(uint256 indexed summonerId, string purpose, uint256 investment);

    modifier onlyWhitelisted() {
        require(whitelistedSources[msg.sender].enabled == true, "Only whitelisted source can add Achievements");
        _;
    }

    function whitelistSource(address source, string memory name) public onlyOwner {
        require(Address.isContract(source), "Achievement source must be a contract");
        whitelistedSources[source] = AchievementModel.SourceMetadata(true, name);
    }

    function whitelistAchievements(AchievementModel.AchievementMetadata[] memory _metadatas)
        external
        onlyWhitelisted
        returns (AchievementModel.AchievementMetadata[] memory)
    {
        require(whitelistedAddedMetadatas[msg.sender] == false, "Source already defined their metadata");
        require(_metadatas.length > 0, "You need to pass at least one AchievementMetadata");

        for (uint256 i = 0; i < _metadatas.length; i++) {
            checkMetadataStructure(_metadatas[i]);
            _metadatas[i].source = msg.sender;
            _metadatas[i].id = _achievementId.current();
            metadatas[_metadatas[i].id] = _metadatas[i];
            _achievementId.increment();
        }
        whitelistedAddedMetadatas[msg.sender] = true;
        return _metadatas;
    }

    function getAchievementPoints(uint256 summonerId) public view returns (uint256 points) {
        return summonerAchievementPoints[summonerId];
    }

    function getAchievements(uint256 summonerId)
        public
        view
        returns (AchievementModel.AchievementExpanded[] memory achievements)
    {
        AchievementModel.AchievementExpanded[] memory _achievements = new AchievementModel.AchievementExpanded[](
            summonerAchievements[summonerId].length
        );
        for (uint256 i = 0; i < summonerAchievements[summonerId].length; i++) {
            AchievementModel.Achievement storage _achievement = summonerAchievements[summonerId][i];
            AchievementModel.AchievementMetadata memory metadata = metadatas[_achievement.id];
            AchievementModel.AchievementExpanded memory achievement = AchievementModel.AchievementExpanded({
                metadata: metadata,
                source_name: whitelistedSources[metadata.source].name,
                summoner: _achievement.summoner,
                timestamp: _achievement.timestamp
            });
            _achievements[i] = achievement;
        }
        return _achievements;
    }

    function unlockAchievement(uint256 summonerId, uint256 achievementId) external onlyWhitelisted {
        require(metadatas[achievementId].source == msg.sender, "Source does not own the achievement metadata");

        for (uint256 i = 0; i < summonerAchievements[summonerId].length; i++) {
            AchievementModel.Achievement storage _achievement = summonerAchievements[summonerId][i];
            require(_achievement.id != achievementId, "Summoner already own the achievement");
        }
        summonerAchievements[summonerId].push(AchievementModel.Achievement(achievementId, summonerId, block.timestamp));
        summonerAchievementPoints[summonerId] += metadatas[achievementId].points;

        // TOOD emit CreateAchievement
    }

    function checkMetadataStructure(AchievementModel.AchievementMetadata memory _metadata) internal pure {
        require(
            _metadata.difficulty >= AchievementModel.Difficulty.Common &&
                _metadata.difficulty <= AchievementModel.Difficulty.Legendary,
            "Invalid difficulty"
        );
        require(bytes(_metadata.title).length > 0, "Title must not be empty");
        require(bytes(_metadata.description).length > 0, "Description must not be empty");
        require(_metadata.points > 0, "Points must be greater than 0");
    }
}
