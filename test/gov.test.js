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



const amount = BigNumber.from('5'+'0'.repeat(24));
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

const duration = 3600;

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
    deployer = accs[0];
    govMem1 = accs[1];
    govMem2 = accs[2];
    govMem3 = accs[3];
    staker0 = accs[4];
    staker1 = accs[5];
    staker2 = accs[6];
    staker3 = accs[6];
    user1 = accs[7];
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
    const _defaultBallotDurationMin = 1; ///TODO 0 is invalid value //86400;
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
    await staking.connect(staker0).deposit(deployer.address,{ value: amount});

    // Initialize governance
    await gov.init(registry.address, govImp.address, staker0.address, amount, U2B(nodeName[0]), (enode[0]), U2B(ip[0]), (port[0]));
    govDelegator = await hre.ethers.getContractAt('GovImp', gov.address);//await GovImp.at(gov.address);
    let data = await govDelegator.getNode(1);
  });

  // // For short check
  // describe('Contract creation ', function () {
  //   it('consume for govImp', async () => { await GovImp.new(); });
  //   it('consume for envStorageImp', async () => { await EnvStorageImp.new(); });
  //   it('consume for ballotStorage', async () => { await BallotStorage.new(registry.address); });
  // });

  describe('Deployer ', function () {
    it('has enode and locked staking', async () => {
      const locked = await staking.lockedBalanceOf(deployer.address);
      locked.eq(BigNumber.from(amount));
      const idx = await gov.getNodeIdxFromMember(deployer.address);
      expect(idx).to.not.equal(0);
      const [ nName, nEnode, nIp, nPort ] = await gov.getNode(idx);
      U2S(nName).should.equal(nodeName[0]);
      (nEnode).should.equal(enode[0]);
      (U2S(nIp)).should.equal(ip[0]);
      (nPort).should.be.equal(BigNumber.from(port[0]));
    });

    it('cannot init twice', async () => {
      await expect( gov.init(registry.address, govImp.address, staker0.address, amount, U2B(nodeName[0]), (enode[0]), U2B(ip[0]), (port[0]))).to.be.revertedWith('Already initialized');
    });

    it('cannot addProposal to add member self', async () => {
      await expect( govDelegator.addProposalToAddMember([deployer.address, staker0.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration])).to.be.revertedWith('Already member');
    });

    it('can addProposal to add member', async () => {
      // staking first
      await staking.connect(staker1).deposit(govMem1.address,{ value: amount});
      await govDelegator.addProposalToAddMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));
      const ballot = await ballotStorage.getBallotBasic(len);
      const ballotDetail = await ballotStorage.getBallotMember(len);
      ballot[3].should.be.equal(deployer.address);
      U2S(ballot[4]).should.be.equal(memo[0]);
      ballotDetail[1].should.be.equal(govMem1.address);

      await govDelegator.addProposalToAddMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[1]), duration]);
      const len2 = await gov.ballotLength();
      len2.should.be.equal(BigNumber.from(2));
    });

    it('cannot addProposal to remove non-member', async () => {
      // staking first
      await staking.connect(staker1).deposit(govMem1.address,{ value: amount});
      await expect(govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration)).to.be.revertedWith('Non-member');
    });

    it('cannot addProposal to remove a sole member', async () => {
      await expect(govDelegator.addProposalToRemoveMember(deployer.address, amount, U2B(memo[0]), duration)).to.be.revertedWith('Cannot remove a sole member');
    });

    it('can addProposal to change member', async () => {
      await staking.connect(staker1).deposit(govMem1.address, {value: amount});


      let oldMember = await gov.getMember(1);
      oldMember.should.be.equal(deployer.address);
      let oldStaker = await gov.getStaker(1);
      oldStaker.should.be.equal(staker0.address);
      await govDelegator.addProposalToChangeMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));

      let newMember = await gov.getMember(1);
      newMember.should.be.equal(govMem1.address);
      let newStaker = await gov.getStaker(1);
      newStaker.should.be.equal(staker1.address);
    });

    it('can addProposal to change member only self', async () => {
      await staking.connect(staker0).changeVoter(govMem1.address);

      let oldMember = await gov.getMember(1);
      oldMember.should.be.equal(deployer.address);
      let oldStaker = await gov.getStaker(1);
      oldStaker.should.be.equal(staker0.address);
      // console.log(result);
      await govDelegator.addProposalToChangeMember([govMem1.address, staker0.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));

      let newMember = await gov.getMember(1);
      newMember.should.be.equal(govMem1.address);
      let newStaker = await gov.getStaker(1);
      newStaker.should.be.equal(staker0.address);
    });

    it('can addProposal to change staker self', async () => {
      await staking.connect(staker1).deposit(deployer.address, {value:amount});

      let oldMember = await gov.getMember(1);
      oldMember.should.be.equal(deployer.address);
      let oldStaker = await gov.getStaker(1);
      oldStaker.should.be.equal(staker0.address);
      // console.log(result);
      await govDelegator.addProposalToChangeMember([deployer.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));

      let newMember = await gov.getMember(1);
      newMember.should.be.equal(deployer.address);
      let newStaker = await gov.getStaker(1);
      newStaker.should.be.equal(staker1.address);
    });

    it('cannot addProposal to change non-member', async () => {
      // eslint-disable-next-line max-len
      await expect(govDelegator.addProposalToChangeMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], govMem2.address)).to.be.revertedWith('Non-member');
    });

    it('can addProposal to change governance', async () => {
      await govDelegator.addProposalToChangeGov(govMem1.address, U2B(memo[0]), duration);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));
    });

    it('cannot addProposal to change governance with same address', async () => {
      await expect(govDelegator.addProposalToChangeGov(govImp.address, U2B(memo[0]), duration)).to.be.revertedWith('Same contract address');
    });

    it('cannot addProposal to change governance with zero address', async () => {
      await expect(govDelegator.addProposalToChangeGov('0x'+'0'.repeat(40), U2B(memo[0]), duration)).to.be.revertedWith('Implementation cannot be zero');
    });

    it('can addProposal to change environment', async () => {
      await govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Bytes32, U2B(envVal), U2B(memo[0]), duration);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));
    });

    it('cannot addProposal to change environment with wrong type', async () => {
      await expect(govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Invalid, U2B(envVal), U2B(memo[0]), duration)).to.be.revertedWith('Invalid type');
    });

    it('can vote approval to add member', async () => {
      //govMem1 signer
      await staking.connect(staker1).deposit(govMem1.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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
      const lock = await staking.lockedBalanceOf(staker1.address);
      lock.should.be.equal(BigNumber.from(amount));
    });

    it('cannot vote approval to add member with insufficient staking', async () => {
      await staking.connect(staker1).deposit(govMem1.address, { value: amount.sub(BigNumber.from('10000000000000')) });
      await govDelegator.addProposalToAddMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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
      await staking.connect(staker1).deposit(govMem1.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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

      //add 
      await staking.connect(staker1).deposit(govMem1.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(1, true);
      let len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      let inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      let state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);
      //govMem1 signer
      await staking.connect(staker2).deposit(govMem2.address, { value: amount });
      const preDeployerAvail = await staking.availableBalanceOf(staker1.address);
      const preGovmem1Avail = await staking.availableBalanceOf(staker2.address);
      await govDelegator.addProposalToChangeMember([govMem2.address, staker2.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[1]), duration], govMem1.address);
      await govDelegator.vote(2, true);
      await govDelegator.connect(govMem1).vote(2, true);
      //voteLength = 현재까지 vote()함수가 불린 함수
      len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(3));
      inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      state = await ballotStorage.getBallotState(2);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(2));
      const memberAddr = await gov.getMember(2);
      memberAddr.should.equal(govMem2.address);
      const [ nName,nEnode, nIp, nPort ] = await gov.getNode(2);
      U2S(nName).should.equal(nodeName[1]);
      nEnode.should.equal(enode[1]);
      U2S(nIp).should.equal(ip[1]);
      nPort.should.be.equal(BigNumber.from(port[1]));
      const nodeIdxFromDeployer = await gov.getNodeIdxFromMember(govMem1.address);
      nodeIdxFromDeployer.should.be.equal(BigNumber.from(0));
      const nodeIdxFromGovMem1 = await gov.getNodeIdxFromMember(govMem2.address);
      nodeIdxFromGovMem1.should.be.equal(BigNumber.from(2));

      const postDeployerAvail = await staking.availableBalanceOf(staker1.address);
      const postGovmem1Avail = await staking.availableBalanceOf(staker2.address);
      postDeployerAvail.sub(preDeployerAvail).should.be.equal(BigNumber.from(amount));
      preGovmem1Avail.sub(postGovmem1Avail).should.be.equal(BigNumber.from(amount));
    });

    it('can vote approval to change enode only', async () => {
      await govDelegator.addProposalToChangeMember([deployer.address, staker0.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration], deployer.address);
      // await govDelegator.vote(1, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(0));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(1));
      const memberAddr = await gov.getMember(1);
      memberAddr.should.equal(deployer.address);
      const [ nName, nEnode, nIp, nPort ] = await gov.getNode(1);
      U2S(nName).should.equal(nodeName[1]);
      nEnode.should.equal(enode[1]);
      U2S(nIp).should.equal(ip[1]);
      nPort.should.be.equal(BigNumber.from(port[1]));
    });

    it('cannot vote approval to change member with insufficient staking', async () => {
      await staking.connect(staker1).deposit(govMem1.address, { value: amount.sub(BigNumber.from("1000000000")) });
      await govDelegator.addProposalToChangeMember([govMem1.address, staker1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration], deployer.address);
      // await govDelegator.vote(1, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(0));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(1);
      state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
      state[2].should.equal(true);
    });

    it('cannot vote approval to change member without allowance', async () => {
      await expect(govDelegator.addProposalToChangeMember([govMem1.address, staker1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration], deployer.address)).to.be.revertedWith('Staker is not allowed');
    });

    it('can vote approval to change governance', async () => {
      const GovImp = await ethers.getContractFactory("GovImp");
      const newGovImp = await GovImp.deploy();
      await govDelegator.addProposalToChangeGov(newGovImp.address, U2B(memo[0]), duration);
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
      await govDelegator.addProposalToChangeEnv(ethers.utils.keccak256(U2B('blocksPer')), envTypes.Uint, '0x0000000000000000000000000000000000000000000000000000000000000064', U2B(memo[0]), duration);
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
      // let signer1 = (await ethers.getSigners())[1];
      await staking.connect(staker1).deposit(govMem1.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(1, true);
      await expect(govDelegator.vote(1, true)).to.be.revertedWith('Expired');
    });
  });

  describe('Two Member ', function () {
    beforeEach(async () => {
      //govMem1 signer
      // let signer1 = (await ethers.getSigners())[1];
      await staking.connect(staker1).deposit(govMem1.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(1, true);
    });

    it('cannot addProposal to add member self', async () => {
      //govMem1 signer
      // let signer1 = (await ethers.getSigners())[1];
      await expect(govDelegator.connect(govMem1).addProposalToAddMember([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration])).to.be.revertedWith('Already member');
    });

    it('can addProposal to remove member', async () => {
      await govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(2));
    });

    it('can vote to add member', async () => {
      //govMem2 signer
      // let signer2 = (await ethers.getSigners())[2];
      await staking.connect(staker2).deposit(govMem2.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem2.address, staker2.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      const len = await gov.ballotLength();
      await govDelegator.vote(len, true);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(len));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
      state[2].should.equal(false);

      //govMem1 signer
      // let signer1 = (await ethers.getSigners())[1];
      await govDelegator.connect(govMem1).vote(len, true);
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.equal(BigNumber.from(0));
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state2[2].should.equal(true);
    });

    it('can vote to deny adding member', async () => {
      await staking.connect(staker2).deposit(govMem2.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem2.address, staker2.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      const len = await gov.ballotLength();
      await govDelegator.vote(len, false);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(len));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
      state[2].should.equal(false);

      //govMem1 signer
      await govDelegator.connect(govMem1).vote(len, false);
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.equal(BigNumber.from(0));
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
      state2[2].should.equal(true);
    });

    it('can vote to remove first member', async () => {
      const preAvail = await staking.availableBalanceOf(staker0.address);
      await govDelegator.addProposalToRemoveMember(deployer.address, amount, U2B(memo[0]), duration);
      const len = await gov.ballotLength();
      await govDelegator.vote(len, true);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(len));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
      state[2].should.equal(false);

      //govMem1 signer
      await govDelegator.connect(govMem1).vote(len, true);
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.equal(BigNumber.from(0));
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state2[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(1));
      const isMem = await gov.isMember(deployer.address);
      isMem.should.equal(false);
      const nodeLen = await gov.getNodeLength();
      nodeLen.should.be.equal(BigNumber.from(1));
      const nodeIdx = await gov.getNodeIdxFromMember(deployer.address);
      nodeIdx.should.be.equal(BigNumber.from(0));

      const postAvail = await staking.availableBalanceOf(staker0.address);
      postAvail.sub(preAvail).should.be.equal(BigNumber.from(amount));
    });

    it('can vote to remove last member', async () => {
      const preAvail = await staking.availableBalanceOf(staker1.address);
      await govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration);
      const len = await gov.ballotLength();
      await govDelegator.vote(len, true);
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(len));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
      state[2].should.equal(false);

      //govMem1 signer
      let signer1 = (await ethers.getSigners())[1];
      await govDelegator.connect(govMem1).vote(len, true);
      const inVoting2 = await gov.getBallotInVoting();
      inVoting2.should.be.equal(BigNumber.from(0));
      const state2 = await ballotStorage.getBallotState(len);
      state2[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state2[2].should.equal(true);

      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(1));
      const isMem = await gov.isMember(govMem1.address);
      isMem.should.equal(false);
      const nodeLen = await gov.getNodeLength();
      nodeLen.should.be.equal(BigNumber.from(1));
      const nodeIdx = await gov.getNodeIdxFromMember(govMem1.address);
      nodeIdx.should.be.equal(BigNumber.from(0));

      const postAvail = await staking.availableBalanceOf(staker1.address);
      postAvail.sub(preAvail).should.be.equal(BigNumber.from(amount));
    });

    it('cannot vote simultaneously', async () => {
      await staking.connect(staker2).deposit(govMem2.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem2.address, staker2.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      
      await staking.connect(staker3).deposit(govMem3.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem3.address, staker3.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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
      await staking.connect(staker1).deposit(govMem1.address, { value: amount });
      await expect(gov.connect(govMem1).init(registry.address, govImp.address, staker1.address, amount, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0])).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('cannot addProposal', async () => {
      //govMem1 signer
      await expect(govDelegator.connect(govMem1).addProposalToAddMember(([govMem1.address, staker1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]))).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(govMem1).addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration)).to.be.revertedWith('No Permission');
      await staking.connect(staker2).deposit(govMem2.address, { value: amount });
      await expect(govDelegator.connect(govMem1).addProposalToChangeMember([govMem2.address, staker2.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration], govMem1.address)).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(govMem1).addProposalToChangeGov(govMem1.address, U2B(memo[0]), duration)).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(govMem1).addProposalToChangeEnv(B322S(envName), envTypes.Bytes32, U2B(envVal), U2B(memo[0]), duration)).to.be.revertedWith('No Permission');
    });

    it('cannot vote', async () => {
      await staking.connect(staker2).deposit(govMem2.address, { value: amount });
      await govDelegator.addProposalToAddMember([govMem2.address, staker2.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      //govMem1 signer
      await expect(govDelegator.connect(govMem1).vote(1, true)).to.be.revertedWith('No Permission');
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