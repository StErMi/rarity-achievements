// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers} from 'hardhat';

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Rarity = await ethers.getContractFactory('rarity');
  const rarity = await Rarity.deploy();
  await rarity.deployed();
  console.log('Rarity deployed to:', rarity.address);

  const AchievementContract = await ethers.getContractFactory('AchievementContract');
  const achievementContract = await AchievementContract.deploy();
  await achievementContract.deployed();
  console.log('AchievementContract deployed to:', achievementContract.address);

  const RarityBlock = await ethers.getContractFactory('RarityBlock');
  const rarityBlock = await RarityBlock.deploy(achievementContract.address);
  await rarityBlock.deployed();
  console.log('RarityBlock deployed to:', rarityBlock.address);

  // Whitelist rarityBlock contract into AchievementContract
  await achievementContract.whitelistSource(rarityBlock.address);

  // Add rarityBlock achievements to AchievementContract
  await rarityBlock.whitelistAchievements();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
