import {Contract} from '@ethersproject/contracts';

import {ethers, waffle} from 'hardhat';
import chai from 'chai';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

const {deployContract} = waffle;
const {expect} = chai;

// use(solidity);

describe('Rarity Achievement Testing', () => {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let rarity;
  let achievementContract: Contract;
  let rarityBlock: Contract;
  let summoner1Id = 0;

  beforeEach(async () => {
    // eslint-disable-next-line no-unused-vars
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // We get the contract to deploy
    const Rarity = await ethers.getContractFactory('rarity');
    rarity = await Rarity.deploy();
    await rarity.deployed();

    const AchievementContract = await ethers.getContractFactory('AchievementContract');
    achievementContract = await AchievementContract.deploy();
    await achievementContract.deployed();

    const RarityBlock = await ethers.getContractFactory('RarityBlock');
    rarityBlock = await RarityBlock.deploy(achievementContract.address);
    await rarityBlock.deployed();

    // Whitelist rarityBlock contract into AchievementContract
    await achievementContract.whitelistSource(rarityBlock.address, 'The Fantom Dungeon');

    // Add rarityBlock achievements to AchievementContract
    await rarityBlock.whitelistAchievements();

    // Get summoner
    summoner1Id = 0;
    let summoner1Tx = await rarity.connect(addr1).summon(1);
    await summoner1Tx.wait();
  });

  describe('Test rarityBlock.adventure() method', () => {
    it('Achievements added to summoner1 correctly', async () => {
      await rarityBlock.adventure(summoner1Id);

      const acPoints = await achievementContract.getAchievementPoints(summoner1Id);
      console.log(`Total Achievement Points for summoner ${summoner1Id} -> ${acPoints}`);
      expect(acPoints).to.equal(65);

      const achievements = await achievementContract.getAchievements(summoner1Id);
      console.log('Printing achievements');
      achievements.map((achievement: any) => {
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

      const acPoints = await achievementContract.getAchievementPoints(summoner1Id);
      console.log(`Total Achievement Points for summoner ${summoner1Id} -> ${acPoints}`);
      expect(acPoints).to.equal(65);
    });
  });

  describe('Test rarityBlock.whitelistAchievements() method', () => {
    const correctMetadata = {
      id: 0, // replaced by AchievementContract
      source: '', // replaced by AchievementContract
      difficulty: 1,
      title: 'Defeated first monster',
      description: "You have been brave enough to defeat the first monster of 'The Fantom Dungeon'",
      points: 5,
    };

    const deployMalformedAchievement = async (metadatas: any[], revertMessage?: string, whitelistSource = true) => {
      const RarityBlock = await ethers.getContractFactory('RarityBlock');
      const rarityBlock: Contract = await RarityBlock.deploy(achievementContract.address);
      await rarityBlock.deployed();
      if (whitelistSource) {
        await achievementContract.whitelistSource(rarityBlock.address, 'The Fantom Dungeon Malformed');
      }

      // Sending funds to the new block
      await rarityBlock.connect(owner).supplyFunds({
        value: ethers.utils.parseEther('1'),
      });

      for (let meta of metadatas) {
        meta.source = rarityBlock.address;
      }
      await ethers.provider.send('hardhat_impersonateAccount', [rarityBlock.address]);
      const rarityBlockSigner = await ethers.getSigner(rarityBlock.address);

      const tx = achievementContract.connect(rarityBlockSigner).whitelistAchievements(metadatas);
      if (revertMessage) {
        await expect(tx).to.be.revertedWith(revertMessage);
      } else {
        // Check that the contract has correctly
        const rarityBlockMetadata = await achievementContract.whitelistedSources(rarityBlock.address);
        const hasAddedAchievements = await achievementContract.whitelistedAddedMetadatas(rarityBlock.address);

        expect(hasAddedAchievements).to.equal(true);
        expect(rarityBlockMetadata.enabled).to.equal(true);
        expect(rarityBlockMetadata.name).to.equal('The Fantom Dungeon Malformed');
      }

      await ethers.provider.send('hardhat_stopImpersonatingAccount', [rarityBlock.address]);
    };

    it('Achievements not whitelisted because source is not whitelisted', async () => {
      await deployMalformedAchievement([correctMetadata], 'Only whitelisted source can add Achievements', false);
    });

    it('Achievements not whitelisted because array of metadata is empty', async () => {
      await deployMalformedAchievement([], 'You need to pass at least one AchievementMetadata');
    });

    it('Achievements not whitelisted because difficulty is not valid', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.difficulty = 10;
      await deployMalformedAchievement([malformedMetadata], 'function was called with incorrect parameters');
    });

    it('Achievements not whitelisted because title is empty', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.title = '';
      await deployMalformedAchievement([malformedMetadata], 'Title must not be empty');
    });

    it('Achievements not whitelisted because description is empty', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.description = '';
      await deployMalformedAchievement([malformedMetadata], 'Description must not be empty');
    });

    it('Achievements not whitelisted because achievement points are less or equal zero', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.points = 0;
      await deployMalformedAchievement([malformedMetadata], 'Points must be greater than 0');
    });

    it('Achievements whitelisted correctly', async () => {
      await deployMalformedAchievement([correctMetadata]);
    });
  });
});
