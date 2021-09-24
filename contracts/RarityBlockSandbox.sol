//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AchievementInterface.sol";
import "./AchievementModel.sol";

/**
 @title Virtual Rarity block contract
 @author Emanuele Ricci @StErMi
*/
contract RarityBlockSandbox is Ownable {
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

    function setMobAchievement(AchievementModel.AchievementMetadata memory achievementMetadata) public onlyOwner {
        mobAchievement = achievementMetadata;
    }

    function setMiniBossAchievement(AchievementModel.AchievementMetadata memory achievementMetadata) public onlyOwner {
        miniBossAchievement = achievementMetadata;
    }

    function setBossAchievement(AchievementModel.AchievementMetadata memory achievementMetadata) public onlyOwner {
        bossAchievement = achievementMetadata;
    }

    function adventure(uint256 summonerId) public {
        _ac.unlockAchievement(summonerId, mobAchievement.id);
        _ac.unlockAchievement(summonerId, miniBossAchievement.id);
        _ac.unlockAchievement(summonerId, bossAchievement.id);
    }

    function unlockAchievementMob(uint256 summonerId) public {
        _ac.unlockAchievement(summonerId, mobAchievement.id);
    }

    function unlockAchievementMiniBoss(uint256 summonerId) public {
        _ac.unlockAchievement(summonerId, miniBossAchievement.id);
    }

    function unlockAchievementBoss(uint256 summonerId) public {
        _ac.unlockAchievement(summonerId, bossAchievement.id);
    }
}
