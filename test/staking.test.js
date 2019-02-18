const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
const { ether } = require('openzeppelin-solidity/test/helpers/ether');
const { ethGetBalance } = require('openzeppelin-solidity/test/helpers/web3');

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const Registry = artifacts.require('Registry.sol');
const Staking = artifacts.require('Staking.sol');

contract('Staking', function ([owner, fakeGov, rewardPool, user, user2, user3, user4]) {
  let registry, staking;
  const amount = ether(4e7);

  beforeEach(async () => {
    registry = await Registry.new();
    staking = await Staking.new(registry.address);

    await registry.setContractDomain('Staking', staking.address);
    await registry.setContractDomain('GovernanceContract', fakeGov);
    await registry.setContractDomain('RewardPool', rewardPool);
  });

  describe('Staker ', function () {
    it('cannot stake zero', async () => {
      await reverting(staking.deposit({ value: 0, from: user }));
    });

    it('can stake through deposit', async () => {
      const pre = await ethGetBalance(user);
      await staking.deposit({ value: amount, from: user });
      const post = await ethGetBalance(user);
      pre.minus(post).should.be.bignumber.gt(amount);

      const bal = await staking.balanceOf(user);
      assert.equal(amount.toNumber(), bal.toNumber());
    });

    it('cannot stake through transfer', async () => {
      await reverting(staking.sendTransaction({ value: amount, from: user, gas: 4e6 }));
    });

    it('cannot withdraw over balance', async () => {
      await reverting(staking.withdraw(amount, { from: user }));
      await staking.deposit({ value: amount, from: user });
      const bal = await staking.balanceOf(user);
      await reverting(staking.withdraw(bal * 2, { from: user }));
    });

    it('can withdraw partial', async () => {
      await staking.deposit({ value: amount, from: user });
      const half = amount / 2;
      await staking.withdraw(half, { from: user });
      const bal = await staking.balanceOf(user);
      bal.should.be.bignumber.equal(half);
    });

    it('can withdraw all', async () => {
      await staking.deposit({ value: amount, from: user });
      const bal = await staking.balanceOf(user);
      const pre = await ethGetBalance(user);
      await staking.withdraw(bal, { from: user });
      const post = await ethGetBalance(user);
      post.should.be.bignumber.gt(pre);

      const remain = await staking.balanceOf(user);
      remain.should.be.bignumber.equal(0);
    });

    it('cannot lock', async () => {
      await reverting(staking.lock(user, amount, { from: user2 }));

      await staking.deposit({ value: amount, from: user });
      await reverting(staking.lock(user, amount, { from: user2 }));
    });

    it('cannot unlock', async () => {
      await staking.deposit({ value: amount, from: user });
      await reverting(staking.unlock(user, amount, { from: user2 }));

      await staking.lock(user, amount, { from: fakeGov });
      await reverting(staking.unlock(user, amount, { from: user2 }));
    });
  });

  describe('Governance ', function () {
    beforeEach(async () => {
      await staking.deposit({ value: amount, from: user });
      await staking.lock(user, amount, { from: fakeGov });
    });

    it('cannot lock over balance', async () => {
      await reverting(staking.lock(user, amount, { from: fakeGov }));
    });

    it('can lock and user cannot withdraw after lock', async () => {
      (await staking.availableBalanceOf(user)).should.be.bignumber.equal(0);
      await reverting(staking.withdraw(amount, { from: user }));
    });

    it('cannot unlock over balance locked', async () => {
      await reverting(staking.unlock(user, amount * 2, { from: fakeGov }));
    });

    it('can unlock', async () => {
      await staking.unlock(user, amount, { from: fakeGov });
      (await staking.availableBalanceOf(user)).should.be.bignumber.equal(amount);
    });

    it('can transfer', async () => {
      await staking.transferLocked(user, amount, { from: fakeGov });
      (await staking.balanceOf(user)).should.be.bignumber.equal(0);
      (await staking.balanceOf(rewardPool)).should.be.bignumber.equal(amount);
    });
  });
  describe('Revoke ', function () {
    beforeEach(async () => {
      await staking.deposit({ value: amount, from: user });
      await staking.lock(user, amount, { from: fakeGov });
      await staking.deposit({ value: amount, from: user2 });
    });

    it('cannot revoke Staking', async () => {
      const pre = await ethGetBalance(owner);
      await reverting( staking.revoke({ from: fakeGov }));
      await reverting( staking.revoke({ from: user }));
      await reverting( staking.revoke({ from: user2 }));
    });

    it('can revoke Staking', async () => {
      const pre = await ethGetBalance(owner);
      await staking.revoke({ from: owner });
      const post = await ethGetBalance(owner);
      console.log(`pre : ${pre.toFormat()}`);
      console.log(`amount : ${amount.toFormat()}`);
      console.log(`post : ${post.toFormat()}`);
      post.should.be.bignumber.gt(pre);
      const isRevoked = await staking.isRevoked();
      assert.equal(isRevoked, true,"not revoked");
    });

    it('cannot deposit/withdraw after revoke ', async () => {
      await staking.revoke({ from: owner });
      const isRevoked = await staking.isRevoked();
      assert.equal(isRevoked, true,"not revoked");
      await reverting( staking.deposit({ value: amount, from: user3 }));
    });

      it('cannot deposit/withdraw after revoke ', async () => {
      await staking.revoke({ from: owner });
      const isRevoked = await staking.isRevoked();
      assert.equal(isRevoked, true,"not revoked");
      await reverting( staking.withdraw(amount, { from: user3 }));
    });
  });

  describe('Voting weight ', function () {
    beforeEach(async () => {
      await staking.deposit({ value: amount, from: user });
      await staking.deposit({ value: amount * 2, from: user2 });
      await staking.deposit({ value: amount * 3, from: user3 });
      await staking.lock(user, amount, { from: fakeGov });
      await staking.lock(user2, amount, { from: fakeGov });
      await staking.lock(user3, amount, { from: fakeGov });
    });

    it('can be zero when no lock', async () => {
      (await staking.calcVotingWeight(user4)).should.be.bignumber.equal(0);
      (await staking.calcVotingWeight(0)).should.be.bignumber.equal(0);
    });

    it('can be calculated when distributed evenly', async () => {
      // user : user2 : user3 = 1 : 1 : 1
      const weight1 = await staking.calcVotingWeight(user);
      weight1.should.be.bignumber.equal(33);
      const weight2 = await staking.calcVotingWeight(user2);
      weight1.should.be.bignumber.equal(weight2);
      const weight3 = await staking.calcVotingWeight(user3);
      weight1.should.be.bignumber.equal(weight3);

      weight1.plus(weight2).plus(weight3).should.be.bignumber.equal(99);
    });

    it('can be calculated when distributed differently', async () => {
      // user : user2 : user3 = 1 : 2 : 3
      await staking.lock(user2, amount, { from: fakeGov });
      await staking.lock(user3, amount * 2, { from: fakeGov });

      const weight1 = await staking.calcVotingWeight(user);
      weight1.should.be.bignumber.equal(16);
      const weight2 = await staking.calcVotingWeight(user2);
      weight2.should.be.bignumber.equal(33);
      const weight3 = await staking.calcVotingWeight(user3);
      weight3.should.be.bignumber.equal(50);

      weight1.plus(weight2).plus(weight3).should.be.bignumber.equal(99);
    });

    it('can be calculated with a scale factor, 1e1, resulted in (0 ~ 10)', async () => {
      // user : user2 : user3 = 10 : 1 : 1
      await staking.unlock(user2, (amount * 9) / 10, { from: fakeGov });
      await staking.unlock(user3, (amount * 9) / 10, { from: fakeGov });

      const weight1 = await staking.calcVotingWeightWithScaleFactor(user, 1e1);
      weight1.should.be.bignumber.equal(8);
      const weight2 = await staking.calcVotingWeightWithScaleFactor(user2, 1e1);
      weight2.should.be.bignumber.equal(0);
      const weight3 = await staking.calcVotingWeightWithScaleFactor(user3, 1e1);
      weight3.should.be.bignumber.equal(0);

      weight1.plus(weight2).plus(weight3).should.be.bignumber.equal(8);
    });

    it('can be calculated with a scale factor, 1e2, resulted in (0 ~ 100)', async () => {
      // user : user2 : user3 = 10 : 1 : 1
      await staking.unlock(user2, (amount * 9) / 10, { from: fakeGov });
      await staking.unlock(user3, (amount * 9) / 10, { from: fakeGov });

      const weight1 = await staking.calcVotingWeightWithScaleFactor(user, 1e2);
      weight1.should.be.bignumber.equal(83);
      const weight2 = await staking.calcVotingWeightWithScaleFactor(user2, 1e2);
      weight2.should.be.bignumber.equal(8);
      const weight3 = await staking.calcVotingWeightWithScaleFactor(user3, 1e2);
      weight3.should.be.bignumber.equal(8);

      weight1.plus(weight2).plus(weight3).should.be.bignumber.equal(99);
    });

    it('can be calculated with a scale factor, 1e3, resulted in (0 ~ 1000)', async () => {
      // user : user2 : user3 = 10 : 1 : 1
      await staking.unlock(user2, (amount * 9) / 10, { from: fakeGov });
      await staking.unlock(user3, (amount * 9) / 10, { from: fakeGov });

      const weight1 = await staking.calcVotingWeightWithScaleFactor(user, 1e3);
      weight1.should.be.bignumber.equal(833);
      const weight2 = await staking.calcVotingWeightWithScaleFactor(user2, 1e3);
      weight2.should.be.bignumber.equal(83);
      const weight3 = await staking.calcVotingWeightWithScaleFactor(user3, 1e3);
      weight3.should.be.bignumber.equal(83);

      weight1.plus(weight2).plus(weight3).should.be.bignumber.equal(999);
    });

    it('can be calculated with a scale factor using random number in range(0 ~ 1000)', async () => {
      // user : user2 : user3 = 1000 : rand : 2*rand
      const start = 55;
      const end = 400;
      const rand = Math.floor(Math.random() * (end - start) + start);
      const sum = 1000 + rand + (2 * rand);

      await staking.unlock(user2, (amount * (1000 - rand)) / 1000, { from: fakeGov });
      await staking.unlock(user3, (amount * (1000 - (2 * rand))) / 1000, { from: fakeGov });

      const expect1 = Math.floor((1000 * 1000) / sum);
      const expect2 = Math.floor((rand * 1000) / sum);
      const expect3 = Math.floor((rand * 2 * 1000) / sum);

      const weight1 = await staking.calcVotingWeightWithScaleFactor(user, 1e3);
      weight1.should.be.bignumber.equal(expect1);
      const weight2 = await staking.calcVotingWeightWithScaleFactor(user2, 1e3);
      weight2.should.be.bignumber.equal(expect2);
      const weight3 = await staking.calcVotingWeightWithScaleFactor(user3, 1e3);
      weight3.should.be.bignumber.equal(expect3);

      weight1.plus(weight2).plus(weight3).should.be.bignumber.equal(expect1 + expect2 + expect3);
    });

    it('can be calculated with users locked randomly', async () => {
      // Make all users lock zero
      await staking.deposit({ value: amount * 2, from: user });
      await staking.deposit({ value: amount, from: user2 });
      await staking.unlock(user, amount, { from: fakeGov });
      await staking.unlock(user2, amount, { from: fakeGov });
      await staking.unlock(user3, amount, { from: fakeGov });

      // Rand
      const start = 1;
      const end = amount * 3;
      [user, user2, user3].forEach(async (u) => {
        const rand = Math.floor(Math.random() * (end - start) + start);
        await staking.lock(u, rand, { from: fakeGov });
      });

      const weight1 = await staking.calcVotingWeight(user);
      const weight2 = await staking.calcVotingWeight(user2);
      const weight3 = await staking.calcVotingWeight(user3);
      weight1.plus(weight2).plus(weight3).should.be.bignumber.gt(97);
    });
  });
});
