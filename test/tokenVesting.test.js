const { expect, use } = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const { constants, BigNumber } = ethers;

use(solidity);

describe("TokenVesting", function () {
  let admin, alice, bob;

  beforeEach(async function () {
    const [adminSig, aliceSig, bobSig] = await ethers.getSigners();
    admin = adminSig;
    alice = aliceSig;
    bob = bobSig;

    const startBlock = (await ethers.provider.getBlock()).number;
    const endBlock = startBlock + 1000;
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    this.token = await MockERC20.deploy("Test", "VEST");

    this.token.mint(admin.address, 10000); // mint tokens so admin can use them for vesting

    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    this.tokenVesting = await TokenVesting.deploy(
      startBlock,
      endBlock,
      this.token.address
    );

    this.token.approve(this.tokenVesting.address, 150); // approve tokenVesting to use tokens
  });

  describe("#claim", function () {
    it("reverts when called incorrectly", async function () {
      await expect(
        this.tokenVesting.connect(alice).vest(alice.address, 1000)
      ).to.be.revertedWith("!admin");

      await expect(
        this.tokenVesting.vest(constants.AddressZero, 1000)
      ).to.be.revertedWith("!account");

      await expect(this.tokenVesting.vest(alice.address, 0)).to.be.revertedWith(
        "amount must be greater than 0"
      );
    });

    it("allows admin to add vested tokens for an account", async function () {
      const aliceVestedTokensAmount = 100;
      const bobVestedTokensAmount = 50;

      await this.tokenVesting.vest(alice.address, aliceVestedTokensAmount);
      await this.tokenVesting.vest(bob.address, bobVestedTokensAmount);

      expect(await this.tokenVesting.fundsVestedFor(alice.address)).to.eql(
        BigNumber.from(aliceVestedTokensAmount)
      );
      expect(await this.tokenVesting.fundsVestedFor(bob.address)).to.eql(
        BigNumber.from(bobVestedTokensAmount)
      );
    });
  });
});
