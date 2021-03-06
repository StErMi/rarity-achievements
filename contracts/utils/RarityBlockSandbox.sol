//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/AchievementInterface.sol";
import "../data/AchievementModel.sol";

/**
 @title Virtual Rarity block contract
 @author Emanuele Ricci @StErMi
*/
contract RarityBlockSandbox is Ownable {
    AchievementContractInterface _ac;
    uint256 private mobAchievement;
    uint256 private miniBossAchievement;
    uint256 private bossAchievement;

    string constant contractName = "The Fantom Dungeon";

    constructor(address achievementContractAddress) {
        _ac = AchievementContractInterface(achievementContractAddress);
    }

    /// @dev this function is only made for testing purpose
    /// it's needed to send funds to the contract that need to whitelist achievements
    /// and unlock them on behalf of summoners
    function supplyFunds() public payable onlyOwner {}

    function setupAchievementsMetadata() public onlyOwner {
        AchievementModel.AchievementMetadata[] memory achievements = new AchievementModel.AchievementMetadata[](3);

        achievements[0] = AchievementModel.AchievementMetadata({
            id: 0, // ID here is not important, will be replaced by the AchievementContract
            source: address(this), // source is not important, will be replaced by the AchievementContract
            source_name: contractName,
            difficulty: AchievementModel.Difficulty.Common,
            title: "Defeated first monster",
            description: "You have been brave enough to defeat the first monster of 'The Fantom Dungeon'",
            points: 5
        });

        achievements[1] = AchievementModel.AchievementMetadata({
            id: 0, // ID here is not important, will be replaced by the AchievementContract
            source: address(this), // source is not important, will be replaced by the AchievementContract
            source_name: contractName,
            difficulty: AchievementModel.Difficulty.Uncommon,
            title: "Defeated first miniboss",
            description: "You have been brave enough to defeat the Eruptus, the mini boss of 'The Fantom Dungeon'",
            points: 10
        });

        achievements[2] = AchievementModel.AchievementMetadata({
            id: 0, // ID here is not important, will be replaced by the AchievementContract
            source: address(this), // source is not important, will be replaced by the AchievementContract
            source_name: contractName,
            difficulty: AchievementModel.Difficulty.Epic,
            title: "Defeated final boss",
            description: "You have been brave enough to defeat Iced Giant, the final boss of 'The Fantom Dungeon'",
            points: 50
        });

        mobAchievement = _ac.registerAchievement(achievements[0]);
        miniBossAchievement = _ac.registerAchievement(achievements[1]);
        bossAchievement = _ac.registerAchievement(achievements[2]);
    }

    function setMobAchievement(uint256 metadataId) public onlyOwner {
        mobAchievement = metadataId;
    }

    function setMiniBossAchievement(uint256 metadataId) public onlyOwner {
        miniBossAchievement = metadataId;
    }

    function setBossAchievement(uint256 metadataId) public onlyOwner {
        bossAchievement = metadataId;
    }

    function adventure(uint256 summonerId) public {
        // IMPORTANT
        // In your contract don't revert if awardAchievement fail, it could be because user
        // already own the achievement. Revert only when you are testing this integration
        bool success;
        string memory revertMessage;
        (success, revertMessage) = _ac.awardAchievement(summonerId, mobAchievement);
        require(success, revertMessage);
        (success, revertMessage) = _ac.awardAchievement(summonerId, miniBossAchievement);
        require(success, revertMessage);
        (success, revertMessage) = _ac.awardAchievement(summonerId, bossAchievement);
        require(success, revertMessage);
    }

    function awardAchievementMob(uint256 summonerId) public {
        // IMPORTANT
        // In your contract don't revert if awardAchievement fail, it could be because user
        // already own the achievement. Revert only when you are testing this integration
        (bool success, string memory revertMessage) = _ac.awardAchievement(summonerId, mobAchievement);
        require(success, revertMessage);
    }

    function awardAchievementMiniBoss(uint256 summonerId) public {
        // IMPORTANT
        // In your contract don't revert if awardAchievement fail, it could be because user
        // already own the achievement. Revert only when you are testing this integration
        (bool success, string memory revertMessage) = _ac.awardAchievement(summonerId, miniBossAchievement);
        require(success, revertMessage);
    }

    function awardAchievementBoss(uint256 summonerId) public {
        // IMPORTANT
        // In your contract don't revert if awardAchievement fail, it could be because user
        // already own the achievement. Revert only when you are testing this integration
        (bool success, string memory revertMessage) = _ac.awardAchievement(summonerId, bossAchievement);
        require(success, revertMessage);
    }

    function awardAchievementOnlyDev(uint256 summonerId, uint256 metadataId) public onlyOwner {
        // IMPORTANT
        // In your contract don't revert if awardAchievement fail, it could be because user
        // already own the achievement. Revert only when you are testing this integration
        (bool success, string memory revertMessage) = _ac.awardAchievement(summonerId, metadataId);
        require(success, revertMessage);
    }
}
