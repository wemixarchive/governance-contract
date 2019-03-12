const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
const { ether } = require('openzeppelin-solidity/test/helpers/ether');

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const Registry = artifacts.require('Registry.sol');
const Staking = artifacts.require('Staking.sol');
const BallotStorage = artifacts.require('BallotStorage.sol');
const Gov = artifacts.require('Gov.sol');
const GovImp = artifacts.require('GovImp.sol');
const EnvStorage = artifacts.require('EnvStorage.sol');
const EnvStorageImp = artifacts.require('EnvStorageImp.sol');

const amount = ether(5e6);

const enode = [
  // eslint-disable-next-line max-len
  '0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0',
  // eslint-disable-next-line max-len
  '0x777777777711c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0',
];
const ip = [
  '127.0.0.1',
  '127.0.0.2',
];
const port = [
  8542,
  8542,
];
const memo = [
  'memo1',
  'memo2'
];
const envName = 'key';
const envVal = 'value';

// SHOULD double-check below map to follow contract code
const ballotStates = {
  Invalid: 0,
  Ready: 1,
  InProgress: 2,
  Accepted: 3,
  Rejected: 4,
};

const envTypes = {
  Invalid: 0,
  Int: 1,
  Uint: 2,
  Address: 3,
  Bytes32: 4,
  Bytes: 5,
  String: 6,
};

contract('Governance', function ([deployer, govMem1, govMem2, govMem3, govMem4, govMem5, user1]) {
  let registry, staking, ballotStorage, govImp, gov, govDelegator, envStorage, envStorageImp, envDelegator;

  

  beforeEach(async () => {
    registry = await Registry.new();
    envStorageImp = await EnvStorageImp.new();
    envStorage = await EnvStorage.new(registry.address, envStorageImp.address);
    ballotStorage = await BallotStorage.new(registry.address);
    staking = await Staking.new(registry.address,"");
    govImp = await GovImp.new();
    gov = await Gov.new();

    await registry.setContractDomain('EnvStorage', envStorage.address);
    await registry.setContractDomain('BallotStorage', ballotStorage.address);
    await registry.setContractDomain('Staking', staking.address);
    await registry.setContractDomain('GovernanceContract', gov.address);

    // Initialize environment storage
    envDelegator = EnvStorageImp.at(envStorage.address);
    const _defaultBlockPer =  1000;
    const _defaultBallotDurationMin = 86400;
    const _defaultBallotDurationMax = 604800;
    const _defaultStakingMin = ether (4980000);
    const _defaultStakingMax = ether (39840000);
    const _defaultGasPrice = ether (0.00000008);
    await envDelegator.initialize(
      _defaultBlockPer,
      _defaultBallotDurationMin,
      _defaultBallotDurationMax,
      _defaultStakingMin,
      _defaultStakingMax,
      _defaultGasPrice,
      { from: deployer });

    // Initialize for staking
    await staking.deposit({ value: amount, from: deployer });

    // Initialize governance
    await gov.init(registry.address, govImp.address, amount, enode[0], ip[0], port[0]);
    govDelegator = await GovImp.at(gov.address);
  });

  // For short check
  describe('Contract creation ', function () {
    it('consume for govImp', async () => { await GovImp.new(); });
    it('consume for envStorageImp', async () => { await EnvStorageImp.new(); });
    it('consume for ballotStorage', async () => { await BallotStorage.new(registry.address); });
  });

  describe('Deployer ', function () {
    it('has enode and locked staking', async () => {
      const locked = await staking.lockedBalanceOf(deployer);
      locked.should.be.bignumber.equal(amount);
      const idx = await gov.getNodeIdxFromMember(deployer);
      assert.notEqual(idx, 0);
      const [ nEnode, nIp, nPort ] = await gov.getNode(idx);
      nEnode.should.equal(enode[0]);
      web3.toUtf8(nIp).should.equal(ip[0]);
      nPort.should.be.bignumber.equal(port[0]);
    });

    it('cannot init twice', async () => {
      await reverting(gov.init(registry.address, govImp.address, amount, enode[0], ip[0], port[0]));
    });

    it('cannot addProposal to add member self', async () => {
      await reverting(govDelegator.addProposalToAddMember(deployer, enode[0], ip[0], port[0], amount, memo[0], { from: deployer }));
    });

    it('can addProposal to add member', async () => {
      await govDelegator.addProposalToAddMember(govMem1, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      len.should.be.bignumber.equal(1);
      const ballot = await ballotStorage.getBallotBasic(len);
      const ballotDetail = await ballotStorage.getBallotMember(len);
      assert.equal(ballot[3], deployer);
      assert.equal(web3.toUtf8(ballot[4]), memo[0]);
      assert.equal(ballotDetail[1], govMem1);

      await govDelegator.addProposalToAddMember(govMem1, enode[0], ip[0], port[0], amount, memo[1], { from: deployer });
      const len2 = await gov.ballotLength();
      len2.should.be.bignumber.equal(2);
    });

    it('cannot addProposal to remove non-member', async () => {
      await reverting(govDelegator.addProposalToRemoveMember(govMem1, amount, memo[0], { from: deployer }));
    });

    it('cannot addProposal to remove a sole member', async () => {
      await reverting(govDelegator.addProposalToRemoveMember(deployer, amount, memo[0], { from: deployer }));
    });

    it('can addProposal to change member', async () => {
      await govDelegator.addProposalToChangeMember(deployer, govMem1, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      len.should.be.bignumber.equal(1);
    });

    it('cannot addProposal to change non-member', async () => {
      // eslint-disable-next-line max-len
      await reverting(govDelegator.addProposalToChangeMember(govMem1, govMem2, enode[0], ip[0], port[0], amount, memo[0], { from: deployer }));
    });

    it('can addProposal to change governance', async () => {
      await govDelegator.addProposalToChangeGov(govMem1, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      len.should.be.bignumber.equal(1);
    });

    it('cannot addProposal to change governance with same address', async () => {
      await reverting(govDelegator.addProposalToChangeGov(govImp.address, memo[0], { from: deployer }));
    });

    it('cannot addProposal to change governance with zero address', async () => {
      await reverting(govDelegator.addProposalToChangeGov('0x0', memo[0], { from: deployer }));
    });

    it('can addProposal to change environment', async () => {
      await govDelegator.addProposalToChangeEnv(envName, envTypes.Bytes32, envVal, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      len.should.be.bignumber.equal(1);
    });

    it('cannot addProposal to change environment with wrong type', async () => {
      await reverting(govDelegator.addProposalToChangeEnv(envName, envTypes.Invalid, envVal, memo[0], { from: deployer }));
    });

    it('can vote approval to add member', async () => {
      await staking.deposit({ value: amount, from: govMem1 });
      await govDelegator.addProposalToAddMember(govMem1, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      await govDelegator.vote(1, true, { from: deployer });
      const len = await gov.voteLength();
      len.should.be.bignumber.equal(1);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(0);
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.bignumber.equal(ballotStates.Accepted);
      state[2].should.equal(true);
      const memberLen = await gov.getMemberLength();
      memberLen.should.be.bignumber.equal(2);
      const nodeLen = await gov.getNodeLength();
      nodeLen.should.be.bignumber.equal(2);
      const lock = await staking.lockedBalanceOf(govMem1);
      lock.should.be.bignumber.equal(amount);
    });

    it('cannot vote approval to add member with insufficient staking', async () => {
      await govDelegator.addProposalToAddMember(govMem1, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      await reverting(govDelegator.vote(1, true, { from: deployer }));
      const len = await gov.voteLength();
      len.should.be.bignumber.equal(0);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(0);
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.bignumber.equal(ballotStates.Ready);
      state[2].should.equal(false);
      const memberLen = await gov.getMemberLength();
      memberLen.should.be.bignumber.equal(1);
    });

    it('can vote disapproval to deny adding member', async () => {
      await govDelegator.addProposalToAddMember(govMem1, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      await govDelegator.vote(1, false, { from: deployer });
      const len = await gov.voteLength();
      len.should.be.bignumber.equal(1);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(0);
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.bignumber.equal(ballotStates.Rejected);
      state[2].should.equal(true);
    });

    it('can vote approval to change member totally', async () => {
      await staking.deposit({ value: amount, from: govMem1 });
      const preDeployerAvail = await staking.availableBalanceOf(deployer);
      const preGovmem1Avail = await staking.availableBalanceOf(govMem1);
      await govDelegator.addProposalToChangeMember(deployer, govMem1, enode[1], ip[1], port[1], amount, memo[0], { from: deployer });
      await govDelegator.vote(1, true, { from: deployer });
      const len = await gov.voteLength();
      len.should.be.bignumber.equal(1);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(0);
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.bignumber.equal(ballotStates.Accepted);
      state[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.bignumber.equal(1);
      const memberAddr = await gov.getMember(1);
      memberAddr.should.equal(govMem1);
      const [ nEnode, nIp, nPort ] = await gov.getNode(1);
      nEnode.should.equal(enode[1]);
      web3.toUtf8(nIp).should.equal(ip[1]);
      nPort.should.be.bignumber.equal(port[1]);
      const nodeIdxFromDeployer = await gov.getNodeIdxFromMember(deployer);
      nodeIdxFromDeployer.should.be.bignumber.equal(0);
      const nodeIdxFromGovMem1 = await gov.getNodeIdxFromMember(govMem1);
      nodeIdxFromGovMem1.should.be.bignumber.equal(1);

      const postDeployerAvail = await staking.availableBalanceOf(deployer);
      const postGovmem1Avail = await staking.availableBalanceOf(govMem1);
      postDeployerAvail.minus(preDeployerAvail).should.be.bignumber.equal(amount);
      preGovmem1Avail.minus(postGovmem1Avail).should.be.bignumber.equal(amount);
    });

    it('can vote approval to change enode only', async () => {
      await govDelegator.addProposalToChangeMember(deployer, deployer, enode[1], ip[1], port[1], amount, memo[0], { from: deployer });
      await govDelegator.vote(1, true, { from: deployer });
      const len = await gov.voteLength();
      len.should.be.bignumber.equal(1);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(0);
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.bignumber.equal(ballotStates.Accepted);
      state[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.bignumber.equal(1);
      const memberAddr = await gov.getMember(1);
      memberAddr.should.equal(deployer);
      const [ nEnode, nIp, nPort ] = await gov.getNode(1);
      nEnode.should.equal(enode[1]);
      web3.toUtf8(nIp).should.equal(ip[1]);
      nPort.should.be.bignumber.equal(port[1]);
    });

    it('cannot vote approval to change member with insufficient staking', async () => {
      await govDelegator.addProposalToChangeMember(deployer, govMem1, enode[1], ip[1], port[1], amount, memo[0], { from: deployer });
      await reverting(govDelegator.vote(1, true, { from: deployer }));
    });

    it('can vote approval to change governance', async () => {
      const newGovImp = await GovImp.new();
      await govDelegator.addProposalToChangeGov(newGovImp.address, memo[0], { from: deployer });
      await govDelegator.vote(1, true, { from: deployer });
      const len = await gov.voteLength();
      len.should.be.bignumber.equal(1);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(0);
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.bignumber.equal(ballotStates.Accepted);
      state[2].should.equal(true);

      const imp = await gov.implementation();
      imp.should.equal(newGovImp.address);
    });

    it('can vote approval to change environment', async () => {
      await govDelegator.addProposalToChangeEnv(web3.sha3('blockPer'), envTypes.Uint, '0x0000000000000000000000000000000000000000000000000000000000000064', memo[0], { from: deployer });
      await govDelegator.vote(1, true, { from: deployer });
      const len = await gov.voteLength();
      len.should.be.bignumber.equal(1);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(0);
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.bignumber.equal(ballotStates.Accepted);
      state[2].should.equal(true);

      const blockPer = await envDelegator.getBlockPer();
      blockPer.should.be.bignumber.equal(100);
    });

    it('cannot vote for a ballot already done', async () => {
      await staking.deposit({ value: amount, from: govMem1 });
      await govDelegator.addProposalToAddMember(govMem1, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      await govDelegator.vote(1, true, { from: deployer });
      await reverting(govDelegator.vote(1, true, { from: deployer }));
    });
  });

  describe('Two Member ', function () {
    beforeEach(async () => {
      await staking.deposit({ value: amount, from: govMem1 });
      await govDelegator.addProposalToAddMember(govMem1, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      await govDelegator.vote(1, true, { from: deployer });
    });

    it('cannot addProposal to add member self', async () => {
      await reverting(govDelegator.addProposalToAddMember(govMem1, enode[0], ip[0], port[0], amount, memo[0], { from: govMem1 }));
    });

    it('can addProposal to remove member', async () => {
      await govDelegator.addProposalToRemoveMember(govMem1, amount, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      len.should.be.bignumber.equal(2);
    });

    it('can vote to add member', async () => {
      await staking.deposit({ value: amount, from: govMem2 });
      await govDelegator.addProposalToAddMember(govMem2, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      await govDelegator.vote(len, true, { from: deployer });
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(len);
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.bignumber.equal(ballotStates.InProgress);
      state[2].should.equal(false);

      await govDelegator.vote(len, true, { from: govMem1 });
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.bignumber.equal(0);
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.bignumber.equal(ballotStates.Accepted);
      state2[2].should.equal(true);
    });

    it('can vote to deny adding member', async () => {
      await govDelegator.addProposalToAddMember(govMem2, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      await govDelegator.vote(len, false, { from: deployer });
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(len);
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.bignumber.equal(ballotStates.InProgress);
      state[2].should.equal(false);

      await govDelegator.vote(len, false, { from: govMem1 });
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.bignumber.equal(0);
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.bignumber.equal(ballotStates.Rejected);
      state2[2].should.equal(true);
    });

    it('can vote to remove first member', async () => {
      const preAvail = await staking.availableBalanceOf(deployer);
      await govDelegator.addProposalToRemoveMember(deployer, amount, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      await govDelegator.vote(len, true, { from: deployer });
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(len);
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.bignumber.equal(ballotStates.InProgress);
      state[2].should.equal(false);

      await govDelegator.vote(len, true, { from: govMem1 });
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.bignumber.equal(0);
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.bignumber.equal(ballotStates.Accepted);
      state2[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.bignumber.equal(1);
      const isMem = await gov.isMember(deployer);
      isMem.should.equal(false);
      const nodeLen = await gov.getNodeLength();
      nodeLen.should.be.bignumber.equal(1);
      const nodeIdx = await gov.getNodeIdxFromMember(deployer);
      nodeIdx.should.be.bignumber.equal(0);

      const postAvail = await staking.availableBalanceOf(deployer);
      postAvail.minus(preAvail).should.be.bignumber.equal(amount);
    });

    it('can vote to remove last member', async () => {
      const preAvail = await staking.availableBalanceOf(govMem1);
      await govDelegator.addProposalToRemoveMember(govMem1, amount, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      await govDelegator.vote(len, true, { from: deployer });
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.bignumber.equal(len);
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.bignumber.equal(ballotStates.InProgress);
      state[2].should.equal(false);

      await govDelegator.vote(len, true, { from: govMem1 });
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.bignumber.equal(0);
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.bignumber.equal(ballotStates.Accepted);
      state2[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.bignumber.equal(1);
      const isMem = await gov.isMember(govMem1);
      isMem.should.equal(false);
      const nodeLen = await gov.getNodeLength();
      nodeLen.should.be.bignumber.equal(1);
      const nodeIdx = await gov.getNodeIdxFromMember(govMem1);
      nodeIdx.should.be.bignumber.equal(0);

      const postAvail = await staking.availableBalanceOf(govMem1);
      postAvail.minus(preAvail).should.be.bignumber.equal(amount);
    });

    it('cannot vote simultaneously', async () => {
      await govDelegator.addProposalToAddMember(govMem2, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      await govDelegator.addProposalToAddMember(govMem3, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      const len = await gov.ballotLength();
      await govDelegator.vote(len - 1, true, { from: deployer });
      const voting = await gov.getBallotInVoting();
      voting.should.be.bignumber.equal(len - 1);
      await reverting(govDelegator.vote(len, true, { from: deployer }));
    });
  });

  describe('Others ', function () {
    it('cannot init', async () => {
      await reverting(gov.init(registry.address, govImp.address, amount, enode[0], ip[0], port[0], { from: user1 }));
    });

    it('cannot addProposal', async () => {
      await reverting(govDelegator.addProposalToAddMember(govMem1, enode[0], ip[0], port[0], amount, memo[0], { from: user1 }));
      await reverting(govDelegator.addProposalToRemoveMember(govMem1, amount, memo[0], { from: user1 }));
      await reverting(govDelegator.addProposalToChangeMember(govMem1, govMem2, enode[0], ip[0], port[0], amount, memo[0], { from: user1 }));
      await reverting(govDelegator.addProposalToChangeGov(govMem1, memo[0], { from: user1 }));
      await reverting(govDelegator.addProposalToChangeEnv(envName, envTypes.Bytes32, envVal, memo[0], { from: user1 }));
    });

    it('cannot vote', async () => {
      await govDelegator.addProposalToAddMember(govMem2, enode[0], ip[0], port[0], amount, memo[0], { from: deployer });
      await reverting(govDelegator.vote(1, true, { from: user1 }));
    });
  });
});
