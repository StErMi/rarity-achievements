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

describe('Rarity Block Sandbox Testing', () => {
  let rarityOwner: SignerWithAddress;
  let rarityAchievementOwner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let rarity;
  let achievementContract: Contract;
  let rarityBlock: Contract;
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

    // Create a Rarity Contract
    rarityBlock = await createRarityBlock(achievementContract, addr1);

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

  it('Achievements not whitelisted because difficulty is not valid', async () => {
    // Deploy achievements
    await rarityBlock.setupAchievementsMetadata();

    let metadata = await achievementContract.metadatas(1);
    checkAchievementMetadata(
      {
        id: 1,
        source: rarityBlock.address,
        source_name: 'The Fantom Dungeon',
        difficulty: 0,
        title: 'Defeated first monster',
        description: "You have been brave enough to defeat the first monster of 'The Fantom Dungeon'",
        points: 5,
      },
      metadata,
    );

    metadata = await achievementContract.metadatas(2);
    checkAchievementMetadata(
      {
        id: 2,
        source: rarityBlock.address,
        source_name: 'The Fantom Dungeon',
        difficulty: 1,
        title: 'Defeated first miniboss',
        description: "You have been brave enough to defeat the Eruptus, the mini boss of 'The Fantom Dungeon'",
        points: 10,
      },
      metadata,
    );

    metadata = await achievementContract.metadatas(3);
    checkAchievementMetadata(
      {
        id: 3,
        source: rarityBlock.address,
        source_name: 'The Fantom Dungeon',
        difficulty: 3,
        title: 'Defeated final boss',
        description: "You have been brave enough to defeat Iced Giant, the final boss of 'The Fantom Dungeon'",
        points: 50,
      },
      metadata,
    );
  });

  it('Check that achievements are correctly rewarded to the user', async () => {
    // Deploy achievements
    await rarityBlock.setupAchievementsMetadata();

    // Let a user adventure (we're triggering all the events)
    await rarityBlock.connect(addr2).adventure(summoner1Id);

    // Check everything works as expected
    expect(await achievementContract.getPoints(summoner1Id, [])).to.equal(65);
    let achievements = await achievementContract.getAchievements(summoner1Id, [], 0, 9999);

    expect(achievements.length).to.equal(3);
    expect(achievements[0].metadata.id).to.equal(1);
    expect(achievements[1].metadata.id).to.equal(2);
    expect(achievements[2].metadata.id).to.equal(3);
  });
});
