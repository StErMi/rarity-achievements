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

  const RarityAchievement = await ethers.getContractFactory('RarityAchievement');
  const rarityAchievement = await RarityAchievement.deploy();
  await rarityAchievement.deployed();
  console.log('RarityAchievement deployed to:', rarityAchievement.address);

  const RarityBlockSandbox = await ethers.getContractFactory('RarityBlockSandbox');
  const rarityBlockSandbox = await RarityBlockSandbox.deploy(rarityAchievement.address);
  await rarityBlockSandbox.deployed();
  console.log('RarityBlockSandbox1 deployed to:', rarityBlockSandbox.address);

  const RarityBlockSandbox2 = await ethers.getContractFactory('RarityBlockSandbox');
  const rarityBlockSandbox2 = await RarityBlockSandbox2.deploy(rarityAchievement.address);
  await rarityBlockSandbox2.deployed();
  console.log('RarityBlockSandbox2 deployed to:', rarityBlockSandbox2.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
