const { expect, use } = require("chai");
const { solidity } = require("ethereum-waffle");
const hardhat = require("hardhat");
const { ethers } = hardhat;
const { constants, BigNumber } = ethers;

use(solidity);

async function increaseBlocks(times) {
  for (let index = 1; index < times; index++) {
    await hardhat.network.provider.request({ method: "evm_mine", params: [] });
  }
}

describe("TokenVesting", function () {
  let admin, alice, bob;

  beforeEach(async function () {
    const [adminSig, aliceSig, bobSig] = await ethers.getSigners();
    admin = adminSig;
    alice = aliceSig;
    bob = bobSig;

    const startBlock = (await ethers.provider.getBlock()).number + 6;
    const endBlock = startBlock + 100;
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

  describe("#vest", function () {
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

  describe("#claim", function () {
    let aliceVestedTokensAmount, bobVestedTokensAmount;
    beforeEach(async function () {
      aliceVestedTokensAmount = 100;
      bobVestedTokensAmount = 50;

      await this.tokenVesting.vest(alice.address, aliceVestedTokensAmount);
      await this.tokenVesting.vest(bob.address, bobVestedTokensAmount);
    });

    it("reverts when account has no funds to claims", async function () {
      await expect(this.tokenVesting.claim()).to.be.revertedWith(
        "no funds to claim"
      );
    });

    it("allows account to claim", async function () {
      await increaseBlocks(50); // must release half

      await this.tokenVesting.connect(alice).claim();
      await this.tokenVesting.connect(bob).claim();

      let aliceBalanceOfClaimedFunds = await this.tokenVesting.fundsClaimedFor(
        alice.address
      );
      let bobBalanceOfClaimedFunds = await this.tokenVesting.fundsClaimedFor(
        bob.address
      );

      let aliceBalanceOfToken = await this.token.balanceOf(alice.address);
      let bobBalanceOfToken = await this.token.balanceOf(bob.address);

      expect(aliceBalanceOfClaimedFunds).to.eql(
        BigNumber.from(aliceVestedTokensAmount / 2)
      );
      expect(bobBalanceOfClaimedFunds).to.eql(
        BigNumber.from(bobVestedTokensAmount / 2)
      );

      expect(aliceBalanceOfToken).to.eql(
        BigNumber.from(aliceVestedTokensAmount / 2)
      );
      expect(bobBalanceOfToken).to.eql(
        BigNumber.from(bobVestedTokensAmount / 2)
      );

      // advance 50 more blocks. All should be claimable
      await increaseBlocks(50);
      await this.tokenVesting.connect(alice).claim();
      await this.tokenVesting.connect(bob).claim();

      aliceBalanceOfClaimedFunds = await this.tokenVesting.fundsClaimedFor(
        alice.address
      );
      bobBalanceOfClaimedFunds = await this.tokenVesting.fundsClaimedFor(
        bob.address
      );

      aliceBalanceOfToken = await this.token.balanceOf(alice.address);
      bobBalanceOfToken = await this.token.balanceOf(bob.address);

      expect(aliceBalanceOfClaimedFunds).to.eql(
        BigNumber.from(aliceVestedTokensAmount)
      );
      expect(bobBalanceOfClaimedFunds).to.eql(
        BigNumber.from(bobVestedTokensAmount)
      );

      expect(aliceBalanceOfToken).to.eql(
        BigNumber.from(aliceVestedTokensAmount)
      );
      expect(bobBalanceOfToken).to.eql(BigNumber.from(bobVestedTokensAmount));
    });
  });
});
