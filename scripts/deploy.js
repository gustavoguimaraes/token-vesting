const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const startBlock = (await ethers.provider.getBlock()).number;
  const endBlock = startBlock + 1000;

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const testToken = await MockERC20.deploy("Test", "VEST");
  testToken.deployTransaction.wait();

  const TokenVesting = await hre.ethers.getContractFactory("TokenVesting");
  const tokenVesting = await TokenVesting.deploy(
    startBlock,
    endBlock,
    testToken.address
  );
  tokenVesting.deployTransaction.wait();

  console.log("TokenVesting deployed to:", tokenVesting.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
