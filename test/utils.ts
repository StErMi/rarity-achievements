import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import {Contract} from 'ethers';
import {ethers} from 'hardhat';
const {expect} = chai;

const checkAchievementMetadata = (achievement: any, contractAchievement: any) => {
  expect(achievement.id).to.equal(contractAchievement.id);
  expect(achievement.difficulty).to.equal(contractAchievement.difficulty);
  expect(achievement.source).to.equal(contractAchievement.source);
  expect(achievement.source_name).to.equal(contractAchievement.source_name);
  expect(achievement.title).to.equal(contractAchievement.title);
  expect(achievement.description).to.equal(contractAchievement.description);
  expect(achievement.points).to.equal(contractAchievement.points);
};

const awardAchievement = async (
  achievementContract: Contract,
  rarityBlock: Contract,
  summonerId: number,
  metadataId: number,
  revertMessage?: string,
) => {
  await ethers.provider.send('hardhat_impersonateAccount', [rarityBlock.address]);
  const rarityBlockSigner = await ethers.getSigner(rarityBlock.address);

  const txPromise = achievementContract.connect(rarityBlockSigner).awardAchievement(summonerId, metadataId);
  if (revertMessage) {
    await expect(txPromise).to.be.revertedWith(revertMessage);
  } else {
    const tx = await txPromise;
    await tx.wait();
  }

  await ethers.provider.send('hardhat_stopImpersonatingAccount', [rarityBlock.address]);
};

const createRarityBlock = async (achievementContract: Contract, fundsSender?: SignerWithAddress) => {
  const RarityBlockFactory = await ethers.getContractFactory('RarityBlockSandbox');
  const rarityBlock: Contract = await RarityBlockFactory.deploy(achievementContract.address);
  await rarityBlock.deployed();

  // Sending funds to the new block
  if (fundsSender) {
    await rarityBlock.connect(fundsSender).supplyFunds({
      value: ethers.utils.parseEther('1'),
    });
  }

  return rarityBlock;
};

const deployAchievements = async (
  achievementContract: Contract,
  fundsSender: SignerWithAddress,
  metadatas: any[],
  revertMessage?: string,
) => {
  const rarityBlock = await createRarityBlock(achievementContract, fundsSender);

  await ethers.provider.send('hardhat_impersonateAccount', [rarityBlock.address]);
  const rarityBlockSigner = await ethers.getSigner(rarityBlock.address);

  for (let meta of metadatas) {
    meta.source = rarityBlock.address;
    const txPromise = achievementContract.connect(rarityBlockSigner).registerAchievement(meta);
    if (revertMessage) {
      await expect(txPromise).to.be.revertedWith(revertMessage);
    } else {
      const tx = await txPromise;
      await tx.wait();
    }
  }

  await ethers.provider.send('hardhat_stopImpersonatingAccount', [rarityBlock.address]);

  return rarityBlock;
};

const checkAchievements = async (
  achievementContract: Contract,
  summonerId: number,
  expectedTotalPoints: number,
  expectedAchievementsCount: number,
  whitelistedContracts: string[] = [],
) => {
  // Check points
  const acPoints = await achievementContract.getPoints(summonerId, whitelistedContracts);
  expect(acPoints).to.equal(expectedTotalPoints);

  // check metadatas
  const achievements: any[] = await achievementContract.getAchievements(summonerId, whitelistedContracts, 0, 0);

  expect(achievements.length).to.equal(expectedAchievementsCount);

  for (const [id, summonerAchievement] of Object.entries(achievements)) {
    const sourceMetadata = await achievementContract.metadatas(summonerAchievement.metadata.id);

    expect(summonerAchievement.metadata.title).to.equal(sourceMetadata.title);
    expect(summonerAchievement.summoner).to.eq(summonerId);
    expect(summonerAchievement.timestamp).to.gt(0);
    expect(summonerAchievement.metadata.description).to.equal(sourceMetadata.description);
    expect(summonerAchievement.metadata.points).to.equal(sourceMetadata.points);
  }
};

export {checkAchievementMetadata, checkAchievements, deployAchievements, awardAchievement, createRarityBlock};
