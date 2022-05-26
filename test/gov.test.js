// const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
// const  hre  = require('hardhat');// require('openzeppelin-solidity/test/helpers/ether');

const { ethers } = require("hardhat");
const { expect } = require("chai");
const {should} = require("chai").should();

const BigNumber = hre.ethers.BigNumber;//require('bignumber.js');

const U2B =  ethers.utils.toUtf8Bytes;
const U2S = ethers.utils.toUtf8String;

const B322S = hre.ethers.utils.formatBytes32String;


// require('chai')
//   .use(require('chai-bignumber')(web3.BigNumber))
//   .should();

// const Registry = artifacts.require('Registry.sol');
// const Staking = artifacts.require('Staking.sol');
// const BallotStorage = artifacts.require('BallotStorage.sol');
// const Gov = artifacts.require('Gov.sol');
// const GovImp = artifacts.require('GovImp.sol');
// const EnvStorage = artifacts.require('EnvStorage.sol');
// const EnvStorageImp = artifacts.require('EnvStorageImp.sol');

const amount = '5'+'0'.repeat(24);
const nodeName = [
  'Meta001',
  'Meta002'
];
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

describe('Governance', function () {
  let deployer, govMem1, govMem2, govMem3, govMem4, govMem5, user1;
  let registry, staking, ballotStorage, govImp, gov, govDelegator, envStorage, envStorageImp, envDelegator;

  

  beforeEach('deploy', async () => {
    let accs = await hre.ethers.getSigners();
    deployer = accs[0].address;
    govMem1 = accs[1].address;
    govMem2 = accs[2].address;
    govMem3 = accs[3].address;
    govMem4 = accs[4].address;
    govMem5 = accs[5].address;
    user1 = accs[6].address;
    let Registry = await hre.ethers.getContractFactory('Registry');
    // registry = await Registry.new();
    registry = await Registry.deploy();
    let EnvStorageImp = await hre.ethers.getContractFactory('EnvStorageImp');
    envStorageImp = await EnvStorageImp.deploy(); //await EnvStorageImp.new();
    let EnvStorage = await hre.ethers.getContractFactory('EnvStorage');
    envStorage = await EnvStorage.deploy(registry.address, envStorageImp.address);
    // envStorage = await EnvStorage.new(registry.address, envStorageImp.address);
    let BallotStorage = await hre.ethers.getContractFactory('BallotStorage');
    ballotStorage =  await BallotStorage.deploy(registry.address);//await BallotStorage.new(registry.address);
    let Staking = await hre.ethers.getContractFactory('Staking');
    let infos = []
    staking = await Staking.deploy(registry.address, infos);//await Staking.new(registry.address,"");
    let GovImp = await hre.ethers.getContractFactory('GovImp');
    govImp = await GovImp.deploy();
    let Gov = await hre.ethers.getContractFactory('Gov');
    gov = await Gov.deploy();

    await registry.setContractDomain(B322S('EnvStorage'), envStorage.address);
    await registry.setContractDomain(B322S('BallotStorage'), ballotStorage.address);
    await registry.setContractDomain(B322S('Staking'), staking.address);
    await registry.setContractDomain(B322S('GovernanceContract'), gov.address);

    // Initialize environment storage
    const {abi} = await hre.artifacts.readArtifact('EnvStorageImp');
    envDelegator = await hre.ethers.getContractAt(abi, envStorage.address);//EnvStorageImp.at(envStorage.address);
    const _defaultBlocksPer =  1000;
    const _defaultBallotDurationMin = 86400;
    const _defaultBallotDurationMax = 604800;
    const _defaultStakingMin =  '4980000'+'0'.repeat(18);
    const _defaultStakingMax = '39840000'+'0'.repeat(18);
    const _defaultGasPrice = '80'+'0'.repeat(9);
    const _defaultMaxIdleBlockInterval = 5;

    await envDelegator.initialize(
      _defaultBlocksPer,
      _defaultBallotDurationMin,
      _defaultBallotDurationMax,
      _defaultStakingMin,
      _defaultStakingMax,
      _defaultGasPrice,
      _defaultMaxIdleBlockInterval);

    // Initialize for staking
    await staking.deposit({ value: amount});

    // Initialize governance
    await gov.init(registry.address, govImp.address, amount, U2B(nodeName[0]), (enode[0]), U2B(ip[0]), (port[0]));
    govDelegator = await hre.ethers.getContractAt('GovImp', gov.address);//await GovImp.at(gov.address);
    let data = await govDelegator.getNode(0);
  });

  // // For short check
  // describe('Contract creation ', function () {
  //   it('consume for govImp', async () => { await GovImp.new(); });
  //   it('consume for envStorageImp', async () => { await EnvStorageImp.new(); });
  //   it('consume for ballotStorage', async () => { await BallotStorage.new(registry.address); });
  // });

  describe('Deployer ', function () {
    it('has enode and locked staking', async () => {
      const locked = await staking.lockedBalanceOf(deployer);
      locked.eq(BigNumber.from(amount));
      const idx = await gov.getNodeIdxFromMember(deployer);
      expect(idx).to.not.equal(0);
      const [ nName, nEnode, nIp, nPort ] = await gov.getNode(idx);
      console.log(U2S(nName),nodeName[0])
      U2S(nName).should.equal(nodeName[0]);
      (nEnode).should.equal(enode[0]);
      (U2S(nIp)).should.equal(ip[0]);
      (nPort).should.be.equal(BigNumber.from(port[0]));
    });

    it('cannot init twice', async () => {
      await expect( gov.init(registry.address, govImp.address, amount, U2B(nodeName[0]), (enode[0]), U2B(ip[0]), (port[0]))).to.be.revertedWith('Already initialized');
    });

    it('cannot addProposal to add member self', async () => {
      await expect( govDelegator.addProposalToAddMember(deployer, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]))).to.be.revertedWith('Already member');
    });

    it('can addProposal to add member', async () => {
      await govDelegator.addProposalToAddMember(govMem1, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));
      const ballot = await ballotStorage.getBallotBasic(len);
      const ballotDetail = await ballotStorage.getBallotMember(len);
      ballot[3].should.be.equal(deployer);
      U2S(ballot[4]).should.be.equal(memo[0]);
      ballotDetail[1].should.be.equal(govMem1);

      await govDelegator.addProposalToAddMember(govMem1,  U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[1]));
      const len2 = await gov.ballotLength();
      len2.should.be.equal(BigNumber.from(2));
    });

    it('cannot addProposal to remove non-member', async () => {
      await expect(govDelegator.addProposalToRemoveMember(govMem1, amount, U2B(memo[0]))).to.be.revertedWith('Non-member');
    });

    it('cannot addProposal to remove a sole member', async () => {
      await expect(govDelegator.addProposalToRemoveMember(deployer, amount, U2B(memo[0]))).to.be.revertedWith('Cannot remove a sole member');
    });

    it('can addProposal to change member', async () => {
      await govDelegator.addProposalToChangeMember([deployer, govMem1], U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      const len = await gov.ballotLength();
      ///TODO check '3' was '1'
      len.should.be.equal(BigNumber.from(1));
    });

    it('cannot addProposal to change non-member', async () => {
      // eslint-disable-next-line max-len
      await expect(govDelegator.addProposalToChangeMember([govMem1, govMem2], U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]))).to.be.revertedWith('Non-member');
    });

    it('can addProposal to change governance', async () => {
      await govDelegator.addProposalToChangeGov(govMem1, U2B(memo[0]));
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));
    });

    it('cannot addProposal to change governance with same address', async () => {
      await expect(govDelegator.addProposalToChangeGov(govImp.address, U2B(memo[0]))).to.be.revertedWith('Same contract address');
    });

    it('cannot addProposal to change governance with zero address', async () => {
      await expect(govDelegator.addProposalToChangeGov('0x'+'0'.repeat(40), U2B(memo[0]))).to.be.revertedWith('Implementation cannot be zero');
    });

    it('can addProposal to change environment', async () => {
      await govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Bytes32, U2B(envVal), U2B(memo[0]));
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));
    });

    it('cannot addProposal to change environment with wrong type', async () => {
      await expect(govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Invalid, U2B(envVal), U2B(memo[0]))).to.be.revertedWith('Invalid type');
    });

    it('can vote approval to add member', async () => {
      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await staking.connect(signer1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember(govMem1,  U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      await govDelegator.vote(1, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);
      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(2));
      const nodeLen = await gov.getNodeLength();
      nodeLen.should.be.equal(BigNumber.from(2));
      const lock = await staking.lockedBalanceOf(govMem1);
      lock.should.be.equal(BigNumber.from(amount));
    });

    it('cannot vote approval to add member with insufficient staking', async () => {
      await govDelegator.addProposalToAddMember(govMem1,  U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      //스테이킹 량 부족시 투표는 종료되며 결과가 reject로 표시
      await (govDelegator.vote(1, true));//.to.be.revertedWith('invalid address');
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
      state[2].should.equal(true);
      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(1));
    });

    it('can vote disapproval to deny adding member', async () => {
      await govDelegator.addProposalToAddMember(govMem1,  U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      await govDelegator.vote(1, false);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
      state[2].should.equal(true);
    });

    it('can vote approval to change member totally', async () => {
      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await staking.connect(signer1).deposit({ value: amount });
      const preDeployerAvail = await staking.availableBalanceOf(deployer);
      const preGovmem1Avail = await staking.availableBalanceOf(govMem1);
      await govDelegator.addProposalToChangeMember([deployer, govMem1], U2B(nodeName[1]), enode[1], U2B(ip[1]), [port[1], amount], U2B(memo[0]));
      await govDelegator.vote(1, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(1));
      const memberAddr = await gov.getMember(1);
      memberAddr.should.equal(govMem1);
      const [ nName,nEnode, nIp, nPort ] = await gov.getNode(1);
      U2S(nName).should.equal(nodeName[1]);
      nEnode.should.equal(enode[1]);
      U2S(nIp).should.equal(ip[1]);
      nPort.should.be.equal(BigNumber.from(port[1]));
      const nodeIdxFromDeployer = await gov.getNodeIdxFromMember(deployer);
      nodeIdxFromDeployer.should.be.equal(BigNumber.from(0));
      const nodeIdxFromGovMem1 = await gov.getNodeIdxFromMember(govMem1);
      nodeIdxFromGovMem1.should.be.equal(BigNumber.from(1));

      const postDeployerAvail = await staking.availableBalanceOf(deployer);
      const postGovmem1Avail = await staking.availableBalanceOf(govMem1);
      postDeployerAvail.sub(preDeployerAvail).should.be.equal(BigNumber.from(amount));
      preGovmem1Avail.sub(postGovmem1Avail).should.be.equal(BigNumber.from(amount));
    });

    it('can vote approval to change enode only', async () => {
      await govDelegator.addProposalToChangeMember([deployer, deployer], U2B(nodeName[1]), enode[1], U2B(ip[1]), [port[1], amount], U2B(memo[0]));
      await govDelegator.vote(1, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(1));
      const memberAddr = await gov.getMember(1);
      memberAddr.should.equal(deployer);
      const [ nName, nEnode, nIp, nPort ] = await gov.getNode(1);
      U2S(nName).should.equal(nodeName[1]);
      nEnode.should.equal(enode[1]);
      U2S(nIp).should.equal(ip[1]);
      nPort.should.be.equal(BigNumber.from(port[1]));
    });

    it('cannot vote approval to change member with insufficient staking', async () => {
      await govDelegator.addProposalToChangeMember([deployer, govMem1], U2B(nodeName[0]), enode[1], U2B(ip[1]), [port[1], amount], U2B(memo[0]));
      await govDelegator.vote(1, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
      state[2].should.equal(true);
    });

    it('can vote approval to change governance', async () => {
      const GovImp = await ethers.getContractFactory("GovImp");
      const newGovImp = await GovImp.deploy();
      await govDelegator.addProposalToChangeGov(newGovImp.address, U2B(memo[0]));
      await govDelegator.vote(1, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      const imp = await gov.implementation();
      imp.should.equal(newGovImp.address);
    });

    it('can vote approval to change environment', async () => {
      await govDelegator.addProposalToChangeEnv(ethers.utils.keccak256(U2B('blocksPer')), envTypes.Uint, '0x0000000000000000000000000000000000000000000000000000000000000064', U2B(memo[0]));
      await govDelegator.vote(1, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      const blocksPer = await envDelegator.getBlocksPer();
      blocksPer.should.be.equal(BigNumber.from(100));
    });

    it('cannot vote for a ballot already done', async () => {
      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await staking.connect(signer1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember(govMem1,  U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      await govDelegator.vote(1, true);
      await expect(govDelegator.vote(1, true)).to.be.revertedWith('Expired');
    });
  });

  describe('Two Member ', function () {
    beforeEach(async () => {
      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await staking.connect(signer1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember(govMem1, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      await govDelegator.vote(1, true);
    });

    it('cannot addProposal to add member self', async () => {
      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await expect(govDelegator.connect(signer1).addProposalToAddMember(govMem1, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]))).to.be.revertedWith('Already member');
    });

    it('can addProposal to remove member', async () => {
      await govDelegator.addProposalToRemoveMember(govMem1, amount, U2B(memo[0]));
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(2));
    });

    it('can vote to add member', async () => {
      //govMem2 signer
      let signer2 = (await ethers.getSigners())[2];
      await staking.connect(signer2).deposit({ value: amount });
      await govDelegator.addProposalToAddMember(govMem2, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      const len = await gov.ballotLength();
      await govDelegator.vote(len, true);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(len));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
      state[2].should.equal(false);

      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await govDelegator.connect(signer1).vote(len, true);
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.equal(BigNumber.from(0));
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state2[2].should.equal(true);
    });

    it('can vote to deny adding member', async () => {
      await govDelegator.addProposalToAddMember(govMem2, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      const len = await gov.ballotLength();
      await govDelegator.vote(len, false);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(len));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
      state[2].should.equal(false);

      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await govDelegator.connect(signer1).vote(len, false);
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.equal(BigNumber.from(0));
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
      state2[2].should.equal(true);
    });

    it('can vote to remove first member', async () => {
      const preAvail = await staking.availableBalanceOf(deployer);
      await govDelegator.addProposalToRemoveMember(deployer, amount, U2B(memo[0]));
      const len = await gov.ballotLength();
      await govDelegator.vote(len, true);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(len));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
      state[2].should.equal(false);

      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await govDelegator.connect(signer1).vote(len, true);
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.equal(BigNumber.from(0));
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state2[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(1));
      const isMem = await gov.isMember(deployer);
      isMem.should.equal(false);
      const nodeLen = await gov.getNodeLength();
      nodeLen.should.be.equal(BigNumber.from(1));
      const nodeIdx = await gov.getNodeIdxFromMember(deployer);
      nodeIdx.should.be.equal(BigNumber.from(0));

      const postAvail = await staking.availableBalanceOf(deployer);
      postAvail.sub(preAvail).should.be.equal(BigNumber.from(amount));
    });

    it('can vote to remove last member', async () => {
      const preAvail = await staking.availableBalanceOf(govMem1);
      await govDelegator.addProposalToRemoveMember(govMem1, amount, U2B(memo[0]));
      const len = await gov.ballotLength();
      await govDelegator.vote(len, true);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(len));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
      state[2].should.equal(false);

      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await govDelegator.connect(signer1).vote(len, true);
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.equal(BigNumber.from(0));
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state2[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(1));
      const isMem = await gov.isMember(govMem1);
      isMem.should.equal(false);
      const nodeLen = await gov.getNodeLength();
      nodeLen.should.be.equal(BigNumber.from(1));
      const nodeIdx = await gov.getNodeIdxFromMember(govMem1);
      nodeIdx.should.be.equal(BigNumber.from(0));

      const postAvail = await staking.availableBalanceOf(govMem1);
      postAvail.sub(preAvail).should.be.equal(BigNumber.from(amount));
    });

    it('cannot vote simultaneously', async () => {
      await govDelegator.addProposalToAddMember(govMem2, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      await govDelegator.addProposalToAddMember(govMem3, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      const len = await gov.ballotLength();
      await govDelegator.vote(len - 1, true);
      const voting = await gov.getBallotInVoting();
      voting.should.be.equal(BigNumber.from(len - 1));
      await expect(govDelegator.vote(len, true)).to.be.revertedWith('Now in voting with different ballot');
    });
  });

  describe('Others ', function () {
    it('cannot init', async () => {
      //govMem1 signer
      let signer6 = (await ethers.getSigners())[6];
      await expect(gov.connect(signer6).init(registry.address, govImp.address, amount, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0])).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('cannot addProposal', async () => {
      //govMem1 signer
      let signer6 = (await ethers.getSigners())[6];
      await expect(govDelegator.connect(signer6).addProposalToAddMember(govMem1, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]))).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(signer6).addProposalToRemoveMember(govMem1, amount, U2B(memo[0]))).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(signer6).addProposalToChangeMember([govMem1, govMem2], U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]))).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(signer6).addProposalToChangeGov(govMem1, U2B(memo[0]))).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(signer6).addProposalToChangeEnv(B322S(envName), envTypes.Bytes32, U2B(envVal), U2B(memo[0]))).to.be.revertedWith('No Permission');
    });

    it('cannot vote', async () => {
      await govDelegator.addProposalToAddMember(govMem2, U2B(nodeName[0]), enode[0], U2B(ip[0]), [port[0], amount], U2B(memo[0]));
      //govMem1 signer
      let signer6 = (await ethers.getSigners())[6];
      await expect(govDelegator.connect(signer6).vote(1, true)).to.be.revertedWith('No Permission');
    });
  });
});


function string2Bytes(input){
  const ABICoder = ethers.utils.AbiCoder;
  const abiCoder = new ABICoder();
  
  abitypes = ["bytes"]
  let parameters = abiCoder.encode(abitypes, [input])
  return parameters;
}