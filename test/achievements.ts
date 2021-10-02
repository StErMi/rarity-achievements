import {Contract} from '@ethersproject/contracts';

import {ethers, waffle} from 'hardhat';
import chai from 'chai';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {
  awardAchievement,
  checkAchievementMetadata,
  checkAchievements,
  createRarityBlock,
  deployAchievements,
} from './utils';

const {deployContract} = waffle;
const {expect} = chai;

// use(solidity);

describe('Rarity Achievement Testing', () => {
  let rarityOwner: SignerWithAddress;
  let rarityAchievementOwner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let rarity;
  let achievementContract: Contract;
  let summoner1Id = 0;
  let summoner2Id = 1;
  let summoner3Id = 2;

  beforeEach(async () => {
    // eslint-disable-next-line no-unused-vars
    [rarityOwner, rarityAchievementOwner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // We get the contract to deploy
    const Rarity = await ethers.getContractFactory('rarity');
    rarity = await Rarity.connect(rarityOwner).deploy();
    await rarity.deployed();

    const RarityAchievement = await ethers.getContractFactory('RarityAchievement');
    achievementContract = await RarityAchievement.connect(rarityAchievementOwner).deploy();
    await achievementContract.deployed();

    // Get first summoner
    let summoner1Tx = await rarity.connect(addr2).summon(1);
    await summoner1Tx.wait();

    // Get first summoner
    let summoner2Tx = await rarity.connect(addr2).summon(2);
    await summoner2Tx.wait();

    // Get first summoner
    let summoner3Tx = await rarity.connect(addr2).summon(3);
    await summoner3Tx.wait();
  });

  const achievementMetadatas = [
    {
      id: 1,
      source: '',
      source_name: 'The Fantom Dungeon',
      difficulty: 0,
      title: 'Defeated first monster',
      description: "You have been brave enough to defeat the first monster of 'The Fantom Dungeon'",
      points: 5,
    },
    {
      id: 2,
      source: '',
      source_name: 'The Fantom Dungeon',
      difficulty: 1,
      title: 'Defeated first miniboss',
      description: "You have been brave enough to defeat the Eruptus, the mini boss of 'The Fantom Dungeon'",
      points: 10,
    },
    {
      id: 3,
      source: '',
      source_name: 'The Fantom Dungeon',
      difficulty: 3,
      title: 'Defeated final boss',
      description: "You have been brave enough to defeat Iced Giant, the final boss of 'The Fantom Dungeon'",
      points: 50,
    },
  ];

  describe('Test registerAchievement method', () => {
    const correctMetadata = JSON.parse(JSON.stringify(achievementMetadatas[0]));

    it('Achievements not whitelisted because difficulty is not valid', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.difficulty = 10;
      await deployAchievements(
        achievementContract,
        addr1,
        [malformedMetadata],
        'function was called with incorrect parameters',
      );
    });

    it('Achievements not whitelisted because source_name is empty', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.source_name = '';
      await deployAchievements(achievementContract, addr1, [malformedMetadata], 'Source Name must not be empty');
    });

    it('Achievements not whitelisted because title is empty', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.title = '';
      await deployAchievements(achievementContract, addr1, [malformedMetadata], 'Title must not be empty');
    });

    it('Achievements not whitelisted because description is empty', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.description = '';
      await deployAchievements(achievementContract, addr1, [malformedMetadata], 'Description must not be empty');
    });

    it('Achievements not whitelisted because achievement points are less or equal zero', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.points = 0;
      await deployAchievements(achievementContract, addr1, [malformedMetadata], 'Points must be greater than 0');
    });

    it('Achievements whitelisted correctly', async () => {
      await deployAchievements(achievementContract, addr1, [achievementMetadatas[0]]);
      await deployAchievements(achievementContract, addr1, [achievementMetadatas[1]]);
      await deployAchievements(achievementContract, addr1, [achievementMetadatas[2]]);

      checkAchievementMetadata(await achievementContract.metadatas(1), achievementMetadatas[0]);
      checkAchievementMetadata(await achievementContract.metadatas(2), achievementMetadatas[1]);
      checkAchievementMetadata(await achievementContract.metadatas(3), achievementMetadatas[2]);
    });
  });

  describe('Test awardAchievement method', () => {
    it('Award an achievement that does not exist', async () => {
      const rarityBlock = await deployAchievements(achievementContract, addr1, achievementMetadatas);
      await awardAchievement(rarityBlock, summoner1Id, 30, 'Requested metadata not exist');
    });

    it('Award an achievement that your contract does not own', async () => {
      const anotherRarityBlock = await createRarityBlock(achievementContract, addr1);

      await deployAchievements(achievementContract, addr1, achievementMetadatas);
      await awardAchievement(anotherRarityBlock, summoner1Id, 1, 'You are not the owner of the metadata');
    });

    it('Award the same achievement to the same summoner', async () => {
      const rarityBlock = await deployAchievements(achievementContract, addr1, achievementMetadatas);
      await awardAchievement(rarityBlock, summoner1Id, 1);
      await awardAchievement(rarityBlock, summoner2Id, 1);
      await awardAchievement(rarityBlock, summoner1Id, 1, 'Summoner already own the achievement');
    });

    it('Award an achievement to a summoner successfully', async () => {
      const rarityBlock = await deployAchievements(achievementContract, addr1, achievementMetadatas);
      const rarityBlock2 = await deployAchievements(achievementContract, addr1, achievementMetadatas);

      await awardAchievement(rarityBlock, summoner1Id, 1);
      await awardAchievement(rarityBlock, summoner1Id, 2);
      await awardAchievement(rarityBlock, summoner1Id, 3);
      await awardAchievement(rarityBlock, summoner2Id, 1);

      await awardAchievement(rarityBlock2, summoner1Id, 4);
      await awardAchievement(rarityBlock2, summoner1Id, 5);
      await awardAchievement(rarityBlock2, summoner2Id, 4);
      await awardAchievement(rarityBlock2, summoner2Id, 6);

      await checkAchievements(achievementContract, summoner1Id, 80, 5);
      await checkAchievements(achievementContract, summoner2Id, 60, 3);
      await checkAchievements(achievementContract, summoner3Id, 0, 0);
    });

    it('Track the AchievementAwarded event', async () => {
      const metadata = achievementMetadatas[0];
      const rarityBlock = await deployAchievements(achievementContract, addr1, achievementMetadatas);

      await ethers.provider.send('hardhat_impersonateAccount', [rarityBlock.address]);
      const rarityBlockSigner = await ethers.getSigner(rarityBlock.address);

      const txPromise = achievementContract.connect(rarityBlockSigner).awardAchievement(summoner1Id, metadata.id);
      await expect(txPromise).to.emit(achievementContract, 'AchievementAwarded');

      await ethers.provider.send('hardhat_stopImpersonatingAccount', [rarityBlock.address]);
    });
  });

  describe('Test utility methods', () => {
    it('Test hasAchievement, check if summoner has an achievement awarded', async () => {
      const rarityBlock = await deployAchievements(achievementContract, addr1, achievementMetadatas);
      await awardAchievement(rarityBlock, summoner1Id, 1);

      const summoner1HasAchievement = await achievementContract.hasAchievement(summoner1Id, 1);
      expect(summoner1HasAchievement).to.equal(true);

      const summoner2HasAchievement = await achievementContract.hasAchievement(summoner2Id, 1);
      expect(summoner2HasAchievement).to.equal(false);
    });

    it('Test getAchievements, get a list of achievements filterable by source', async () => {
      const rarityBlock1 = await deployAchievements(achievementContract, addr1, achievementMetadatas);
      const rarityBlock2 = await deployAchievements(achievementContract, addr1, achievementMetadatas);
      const rarityBlock3 = await deployAchievements(achievementContract, addr1, achievementMetadatas);
      await awardAchievement(rarityBlock1, summoner1Id, 1);
      await awardAchievement(rarityBlock1, summoner1Id, 2);
      await awardAchievement(rarityBlock2, summoner1Id, 4);
      await awardAchievement(rarityBlock2, summoner1Id, 5);
      await awardAchievement(rarityBlock2, summoner1Id, 6);

      await awardAchievement(rarityBlock1, summoner2Id, 1);
      await awardAchievement(rarityBlock1, summoner2Id, 2);
      await awardAchievement(rarityBlock2, summoner2Id, 6);

      // Check points

      expect(await achievementContract.getPoints(summoner1Id, [])).to.equal(80);
      expect(await achievementContract.getPoints(summoner1Id, [rarityBlock1.address])).to.equal(15);
      expect(await achievementContract.getPoints(summoner1Id, [rarityBlock2.address])).to.equal(65);
      expect(await achievementContract.getPoints(summoner1Id, [rarityBlock3.address])).to.equal(0);

      expect(await achievementContract.getPoints(summoner2Id, [])).to.equal(65);
      expect(await achievementContract.getPoints(summoner2Id, [rarityBlock1.address])).to.equal(15);
      expect(await achievementContract.getPoints(summoner2Id, [rarityBlock2.address])).to.equal(50);
      expect(await achievementContract.getPoints(summoner2Id, [rarityBlock3.address])).to.equal(0);

      // Get achievements without whitelisting, wihtout limits
      const summoner1AllAchievements = await achievementContract.getAchievements(summoner1Id, [], 0, 9999);
      expect(summoner1AllAchievements.length).to.equal(5);

      // // Get achievements without whitelisting, wihtout limits
      let summoner1LimitedAchievements = await achievementContract.getAchievements(summoner1Id, [], 0, 1);
      expect(summoner1LimitedAchievements.length).to.equal(1);
      expect(summoner1LimitedAchievements[0].metadata.id).to.equal(1);

      summoner1LimitedAchievements = await achievementContract.getAchievements(summoner1Id, [], 1, 1);
      expect(summoner1LimitedAchievements.length).to.equal(1);
      expect(summoner1LimitedAchievements[0].metadata.id).to.equal(2);

      summoner1LimitedAchievements = await achievementContract.getAchievements(summoner1Id, [], 2, 9999);
      expect(summoner1LimitedAchievements.length).to.equal(3);
      expect(summoner1LimitedAchievements[0].metadata.id).to.equal(4);
      expect(summoner1LimitedAchievements[1].metadata.id).to.equal(5);
      expect(summoner1LimitedAchievements[2].metadata.id).to.equal(6);

      // Get achievements with whitelisting, wihtout limits
      let summoner1AllFiltered = await achievementContract.getAchievements(
        summoner1Id,
        [rarityBlock2.address],
        0,
        9999,
      );
      expect(summoner1AllFiltered.length).to.equal(3);
      expect(summoner1LimitedAchievements[0].metadata.id).to.equal(4);
      expect(summoner1LimitedAchievements[1].metadata.id).to.equal(5);
      expect(summoner1LimitedAchievements[2].metadata.id).to.equal(6);

      summoner1AllFiltered = await achievementContract.getAchievements(summoner1Id, [rarityBlock2.address], 1, 9999);
      expect(summoner1AllFiltered.length).to.equal(2);
      expect(summoner1LimitedAchievements[1].metadata.id).to.equal(5);
      expect(summoner1LimitedAchievements[2].metadata.id).to.equal(6);

      // Offset greater than remaining
      const txOffsetGreaterThanAchievementNumber = achievementContract.getAchievements(
        summoner1Id,
        [rarityBlock2.address],
        10,
        9999,
      );
      await expect(txOffsetGreaterThanAchievementNumber).to.be.revertedWith(
        'Offset is greater than number of records available',
      );

      const summoner1NoSource = await achievementContract.getAchievements(summoner1Id, [rarityBlock3.address], 0, 9999);
      expect(summoner1NoSource.length).to.equal(0);
    });
  });
});
