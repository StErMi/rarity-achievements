const {ethers} = require('hardhat');
const {use, expect} = require('chai');
const {solidity} = require('ethereum-waffle');

use(solidity);

describe('Rarity Achievement Testing', () => {
  let owner;
  let addr1;
  let addr2;
  let addrs;

  let rarity;
  let achievementContract: any;
  let rarityBlock: any;
  let summoner1Id = 0;

  beforeEach(async () => {
    // eslint-disable-next-line no-unused-vars
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // We get the contract to deploy
    const Rarity = await ethers.getContractFactory('rarity');
    rarity = await Rarity.deploy();
    await rarity.deployed();
    console.log('Rarity deployed to:', rarity.address);

    const AchievementContract = await ethers.getContractFactory('AchievementContract');
    achievementContract = await AchievementContract.deploy();
    await achievementContract.deployed();
    console.log('AchievementContract deployed to:', achievementContract.address);

    const RarityBlock = await ethers.getContractFactory('RarityBlock');
    rarityBlock = await RarityBlock.deploy(achievementContract.address);
    await rarityBlock.deployed();
    console.log('RarityBlock deployed to:', rarityBlock.address);

    // Whitelist rarityBlock contract into AchievementContract
    await achievementContract.whitelistSource(rarityBlock.address, 'The Fantom Dungeon');
    console.log('RarityBlock whitelisted into AchievementContract as a Contract');

    // Add rarityBlock achievements to AchievementContract
    await rarityBlock.whitelistAchievements();
    console.log('rarityBlock deployed own achievements into AchievementContract');

    // Get summoner
    summoner1Id = 0;
    let summoner1Tx = await rarity.connect(addr1).summon(1);
    await summoner1Tx.wait();
  });

  describe('Test rarityBlock.adventure() method', () => {
    it('Achievements added to summoner1 correctly', async () => {
      await rarityBlock.adventure(summoner1Id);

      const acPoints = await achievementContract.getAchivementPoints(summoner1Id);
      console.log(`Total Achivement Points for summoner ${summoner1Id} -> ${acPoints}`);
      expect(acPoints).to.equal(65);

      const achivements = await achievementContract.getAchivements(summoner1Id);
      console.log('Printing achievements');
      achivements.map((achievement: any) => {
        console.log(`--- Achievement: ${achievement.metadata.title}`);
        console.log(`- MetadataID: ${achievement.metadata.id}`);
        console.log(`- Source: ${achievement.metadata.source}`);
        console.log(`- Source Name: ${achievement.source_name}`);
        console.log(`- Timestamp: ${new Date(Number(achievement.timestamp.toString()) * 1000)}`);
        console.log(`- Description: ${achievement.metadata.description}`);
        console.log(`- Points: ${achievement.metadata.points}`);
      });
    });

    it('Achievements not added the second time (they are unique)', async () => {
      await rarityBlock.adventure(summoner1Id);

      const tx = rarityBlock.adventure(summoner1Id);

      await expect(tx).to.be.revertedWith('Summoner already own the achievement');

      const acPoints = await achievementContract.getAchivementPoints(summoner1Id);
      console.log(`Total Achivement Points for summoner ${summoner1Id} -> ${acPoints}`);
      expect(acPoints).to.equal(65);
    });
  });
});
