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
    uint256 private mobAchievement;
    uint256 private miniBossAchievement;
    uint256 private bossAchievement;

    constructor(address achievementContractAddress) {
        _ac = AchievementContractInterface(achievementContractAddress);
    }

    function supplyFunds() public payable onlyOwner {
        // this function is only made for testing purpose
        // it's needed to send funds to the contract that need to whitelist achievements
        // and unlock them on behalf of summoners
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
        _ac.awardAchievement(summonerId, mobAchievement);
        _ac.awardAchievement(summonerId, miniBossAchievement);
        _ac.awardAchievement(summonerId, bossAchievement);
    }

    function awardAchievementMob(uint256 summonerId) public {
        _ac.awardAchievement(summonerId, mobAchievement);
    }

    function awardAchievementMiniBoss(uint256 summonerId) public {
        _ac.awardAchievement(summonerId, miniBossAchievement);
    }

    function awardAchievementBoss(uint256 summonerId) public {
        _ac.awardAchievement(summonerId, bossAchievement);
    }
}
