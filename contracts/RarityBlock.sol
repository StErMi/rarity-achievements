//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AchievementInterface.sol";
import "./AchievementModel.sol";

/**
 @title Virtual Rarity block contract
 @author Emanuele Ricci @StErMi
*/
contract RarityBlock is Ownable {
    AchievementContractInterface _ac;
    AchievementModel.AchievementMetadata private mobAchievement;
    AchievementModel.AchievementMetadata private miniBossAchievement;
    AchievementModel.AchievementMetadata private bossAchievement;

    constructor(address achievementContractAddress) {
        _ac = AchievementContractInterface(achievementContractAddress);
    }

    function supplyFunds() public payable onlyOwner {
        // this function is only made for testing purpose
        // it's needed to send funds to the contract that need to whitelist achievements
        // and unlock them on behalf of summoners
    }

    function whitelistAchievements() public onlyOwner {
        AchievementModel.AchievementMetadata[] memory achievements = new AchievementModel.AchievementMetadata[](3);

        achievements[0] = AchievementModel.AchievementMetadata({
            id: 0, // ID here is not important, will be replaced by the AchievementContract
            source: address(this), // source is not important, will be replaced by the AchievementContract
            difficulty: AchievementModel.Difficulty.Common,
            title: "Defeated first monster",
            description: "You have been brave enough to defeat the first monster of 'The Fantom Dungeon'",
            points: 5
        });

        achievements[1] = AchievementModel.AchievementMetadata({
            id: 0, // ID here is not important, will be replaced by the AchievementContract
            source: address(this), // source is not important, will be replaced by the AchievementContract
            difficulty: AchievementModel.Difficulty.Uncommon,
            title: "Defeated first miniboss",
            description: "You have been brave enough to defeat the Eruptus, the mini boss of 'The Fantom Dungeon'",
            points: 10
        });

        achievements[2] = AchievementModel.AchievementMetadata({
            id: 0, // ID here is not important, will be replaced by the AchievementContract
            source: address(this), // source is not important, will be replaced by the AchievementContract
            difficulty: AchievementModel.Difficulty.Epic,
            title: "Defeated final boss",
            description: "You have been brave enough to defeat Iced Giant, the final boss of 'The Fantom Dungeon'",
            points: 50
        });

        AchievementModel.AchievementMetadata[] memory createdAchievements = _ac.whitelistAchievements(achievements);
        mobAchievement = createdAchievements[0];
        miniBossAchievement = createdAchievements[1];
        bossAchievement = createdAchievements[2];
    }

    function adventure(uint256 summonerId) public {
        _ac.unlockAchievement(summonerId, mobAchievement.id);
        _ac.unlockAchievement(summonerId, miniBossAchievement.id);
        _ac.unlockAchievement(summonerId, bossAchievement.id);
    }
}
