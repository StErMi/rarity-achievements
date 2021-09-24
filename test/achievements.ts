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
  let summoner2Id = 1;

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

    // Get first summoner
    let summoner1Tx = await rarity.connect(addr1).summon(1);
    await summoner1Tx.wait();

    // Get first summoner
    let summoner2Tx = await rarity.connect(addr1).summon(2);
    await summoner2Tx.wait();
  });

  const achievementMetadatas = [
    {
      id: 4,
      source: '',
      difficulty: 0,
      title: 'Defeated first monster',
      description: "You have been brave enough to defeat the first monster of 'The Fantom Dungeon'",
      points: 5,
    },
    {
      id: 5,
      source: '',
      difficulty: 1,
      title: 'Defeated first miniboss',
      description: "You have been brave enough to defeat the Eruptus, the mini boss of 'The Fantom Dungeon'",
      points: 10,
    },
    {
      id: 6,
      source: '',
      difficulty: 2,
      title: 'Defeated final boss',
      description: "You have been brave enough to defeat Iced Giant, the final boss of 'The Fantom Dungeon'",
      points: 50,
    },
  ];

  const dungeonName = 'The Fantom Dungeon';

  const deployAchievements = async (
    metadatas: any[],
    revertMessage?: string,
    whitelistSource = true,
    doubleAddMetadata = false,
    sourceName = 'The Fantom Dungeon',
  ) => {
    const RarityBlock = await ethers.getContractFactory('RarityBlockSandbox');
    const block: Contract = await RarityBlock.deploy(achievementContract.address);
    await block.deployed();
    if (whitelistSource) {
      await achievementContract.whitelistSource(block.address, sourceName);
    }

    // Sending funds to the new block
    await block.connect(owner).supplyFunds({
      value: ethers.utils.parseEther('1'),
    });

    for (let meta of metadatas) {
      meta.source = block.address;
    }
    await ethers.provider.send('hardhat_impersonateAccount', [block.address]);
    const rarityBlockSigner = await ethers.getSigner(block.address);

    const tx = achievementContract.connect(rarityBlockSigner).whitelistAchievements(metadatas);
    if (revertMessage && !doubleAddMetadata) {
      await expect(tx).to.be.revertedWith(revertMessage);
    } else {
      // Check that the contract has correctly
      const rarityBlockMetadata = await achievementContract.whitelistedSources(block.address);
      const hasAddedAchievements = await achievementContract.whitelistedAddedMetadatas(block.address);

      expect(hasAddedAchievements).to.equal(true);
      expect(rarityBlockMetadata.enabled).to.equal(true);
      expect(rarityBlockMetadata.name).to.equal(dungeonName);
    }

    if (doubleAddMetadata) {
      const secondTx = achievementContract.connect(rarityBlockSigner).whitelistAchievements(metadatas);
      if (revertMessage) {
        await expect(secondTx).to.be.revertedWith(revertMessage);
      }
    }

    await ethers.provider.send('hardhat_stopImpersonatingAccount', [block.address]);

    return block;
  };

  const printSummonerAchievements = (summonerId: number, achievements: any[], points: number) => {
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
    console.log(`Total Achievement Points for summoner ${summonerId} -> ${points}`);
  };

  const checkAchievements = async (
    blockContract: Contract,
    summonerId: number,
    expectedTotalPoints: number,
    expectedAchievementsCount: number,
  ) => {
    // Check points
    const acPoints = await achievementContract.getAchievementPoints(summonerId);
    expect(acPoints).to.equal(expectedTotalPoints);

    // check metadatas
    const achievements: any[] = await achievementContract.getAchievements(summonerId);
    expect(achievements.length).to.equal(expectedAchievementsCount);

    for (const [id, summonerAchievement] of Object.entries(achievements)) {
      // const sourceMetadata = achievementMetadatas.find((el) => el.id === Number(summonerAchievement.metadata.id))!;
      const sourceMetadata = await achievementContract.metadatas(summonerAchievement.metadata.id);

      expect(summonerAchievement.metadata.title).to.equal(sourceMetadata.title);
      expect(summonerAchievement.metadata.source).to.equal(blockContract.address);
      expect(summonerAchievement.source_name).to.equal('The Fantom Dungeon');
      expect(summonerAchievement.summoner).to.eq(summonerId);
      expect(summonerAchievement.timestamp).to.gt(0);
      expect(summonerAchievement.metadata.description).to.equal(sourceMetadata.description);
      expect(summonerAchievement.metadata.points).to.equal(sourceMetadata.points);
    }
  };

  describe('Test rarityBlock.adventure() method', () => {
    it('[Emulated RarityBlock] from a real contract added to summoner1 correctly', async () => {
      const blockContract = await deployAchievements(achievementMetadatas);

      await ethers.provider.send('hardhat_impersonateAccount', [blockContract.address]);

      // set metadata
      await blockContract.setMobAchievement(await achievementContract.metadatas(4));
      await blockContract.setMiniBossAchievement(await achievementContract.metadatas(5));
      await blockContract.setBossAchievement(await achievementContract.metadatas(6));

      // unlock achievements
      await blockContract.unlockAchievementMob(summoner2Id);
      await blockContract.unlockAchievementBoss(summoner2Id);
      await blockContract.adventure(summoner1Id);
      await ethers.provider.send('hardhat_stopImpersonatingAccount', [blockContract.address]);

      await checkAchievements(blockContract, summoner1Id, 65, 3);
      await checkAchievements(blockContract, summoner2Id, 55, 2);
    });

    it('[Real RarityBlock] from a real contract added to summoner1 correctly', async () => {
      await rarityBlock.adventure(summoner1Id);
      await rarityBlock.adventure(summoner2Id);

      await checkAchievements(rarityBlock, summoner1Id, 65, 3);
      await checkAchievements(rarityBlock, summoner2Id, 65, 3);
    });

    it('[Real RarityBlock] Achievements not added the second time (they are unique)', async () => {
      await rarityBlock.adventure(summoner1Id);
      const tx = rarityBlock.adventure(summoner1Id);
      await expect(tx).to.be.revertedWith('Summoner already own the achievement');
      const acPoints = await achievementContract.getAchievementPoints(summoner1Id);
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

    it('Achievements not whitelisted because source is not whitelisted', async () => {
      await deployAchievements([correctMetadata], 'Only whitelisted source can add Achievements', false);
    });

    it('Achievements not whitelisted because array of metadata is empty', async () => {
      await deployAchievements([], 'You need to pass at least one AchievementMetadata');
    });

    it('Achievements not whitelisted because difficulty is not valid', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.difficulty = 10;
      await deployAchievements([malformedMetadata], 'function was called with incorrect parameters');
    });

    it('Achievements not whitelisted because title is empty', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.title = '';
      await deployAchievements([malformedMetadata], 'Title must not be empty');
    });

    it('Achievements not whitelisted because description is empty', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.description = '';
      await deployAchievements([malformedMetadata], 'Description must not be empty');
    });

    it('Achievements not whitelisted because achievement points are less or equal zero', async () => {
      const malformedMetadata = JSON.parse(JSON.stringify(correctMetadata));
      malformedMetadata.points = 0;
      await deployAchievements([malformedMetadata], 'Points must be greater than 0');
    });

    it("Contracts can't add achievements a second time", async () => {
      await deployAchievements([correctMetadata], 'Source already defined their metadata', true, true);
    });

    it('Achievements whitelisted correctly', async () => {
      await deployAchievements([correctMetadata]);
    });
  });
});
