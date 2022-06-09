// const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
// const  hre  = require('hardhat');// require('openzeppelin-solidity/test/helpers/ether');

const { ethers } = require("hardhat");
const { expect } = require("chai");
const {should} = require("chai").should();

const BigNumber = hre.ethers.BigNumber;//require('bignumber.js');

const U2B =  ethers.utils.toUtf8Bytes;
const U2S = ethers.utils.toUtf8String;

const B322S = hre.ethers.utils.formatBytes32String;

const zeroAddress = '0x'+'0'.repeat(40);

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

const envParams = {
  "blocksPer" : 1000,
  "ballotDurationMin" : 1,
  "ballotDurationMax" : 604800,
  "stakingMin" : '4980000'+'0'.repeat(18),
  "stakingMax" : '39840000'+'0'.repeat(18),
  "gasPrice" : '80'+'0'.repeat(9),
  "MaxIdleBlockInterval" : 5,
  "blockCreationTime" : 1000,
  "blockRewardAmount" : '1'+'0'.repeat(18),
  "maxPriorityFeePerGas" : '100'+'0'.repeat(9),
  "blockRewardDistrbutionBlockProducer" : 4000,
  "blockRewardDistrbutionStakingReward" : 1000,
  "blockRewardDistrbutionEcosystem" : 2500,
  "blockRewardDistrbutionMaintanance" : 2500,
  "blockGasLimit" : '100000000',
  "baseFeeMaxChangeDenominator" : 2,
  "elasticityMultiplier" : 1
  // "stakingAddress" : zeroAddress,
  // "ecofundAddress" : zeroAddress,
  // "maintananceAddress" : zeroAddress
}

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
    voter0 = accs[4];
    voter1 = accs[5];
    staker2 = accs[6];
    staker3 = accs[7];
    user1 = accs[8];
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
    staking = await Staking.deploy(registry.address);//await Staking.new(registry.address,"");
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

    const envNames = Object.keys(envParams);
    let envNamesBytes = [];
    for(let i=0;i<envNames.length;i++){
      envNamesBytes.push(ethers.utils.keccak256(U2B(envNames[i])));
    }
    const envVariables = Object.values(envParams);
    await envDelegator.initialize(
      envNamesBytes,
      envVariables
      // _defaultBlocksPer,
      // _defaultBallotDurationMin,
      // _defaultBallotDurationMax,
      // _defaultStakingMin,
      // _defaultStakingMax,
      // _defaultGasPrice,
      // _defaultMaxIdleBlockInterval
      );

    // Initialize for staking
    await staking.connect(deployer).deposit({ value: amount});

    // Initialize governance
    await gov.init(registry.address, govImp.address, amount, U2B(nodeName[0]), (enode[0]), U2B(ip[0]), (port[0]));
    govDelegator = await hre.ethers.getContractAt('GovImp', gov.address);//await GovImp.at(gov.address);
    let data = await govDelegator.getNode(1);
  });

  // For short check
  describe('Contract creation ', function () {
    it('consume for govImp', async () => { 
      let GovImp = await hre.ethers.getContractFactory('GovImp');
      let newGovImp = await GovImp.deploy();
      await newGovImp.deployed();
     });
    it('consume for envStorageImp', async () => { 
      let EnvStorageImp = await hre.ethers.getContractFactory('EnvStorageImp');
      let newEnvStorageImp = await EnvStorageImp.deploy();
      await newEnvStorageImp.deployed();
     });
    it('consume for ballotStorage', async () => { 
      let BallotStorage = await hre.ethers.getContractFactory('BallotStorage');
      let newBallotStorage =  await BallotStorage.deploy(registry.address);
      await newBallotStorage.deployed();
     });
  });

  describe('Staker is voter', function () {
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
      await expect( gov.init(registry.address, govImp.address, amount, U2B(nodeName[0]), (enode[0]), U2B(ip[0]), (port[0]))).to.be.revertedWith('Already initialized');
    });

    it('cannot addProposal to add member self', async () => {
      await expect( govDelegator.addProposalToAddMember([deployer.address, deployer.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration])).to.be.revertedWith('Already member');
    });

    it('cannot addProposal to add member with different voter', async () => {
      await expect( govDelegator.addProposalToAddMember([deployer.address, voter0.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration])).to.be.revertedWith('Already member');
    });

    it('can addProposal to add member', async () => {
      // staking first
      await staking.connect(govMem1).deposit({ value: amount});
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));
      const ballot = await ballotStorage.getBallotBasic(len);
      const ballotDetail = await ballotStorage.getBallotMember(len);
      ballot[3].should.be.equal(deployer.address);
      U2S(ballot[4]).should.be.equal(memo[0]);
      ballotDetail[1].should.be.equal(govMem1.address);

      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[1]), duration]);
      const len2 = await gov.ballotLength();
      len2.should.be.equal(BigNumber.from(2));
    });

    it('cannot addProposal to remove non-member', async () => {
      // staking first
      // await staking.connect(govMem1).deposit({ value: amount});
      await expect(govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration)).to.be.revertedWith('Non-member');
    });

    it('cannot addProposal to remove a sole member', async () => {
      await expect(govDelegator.addProposalToRemoveMember(deployer.address, amount, U2B(memo[0]), duration)).to.be.revertedWith('Cannot remove a sole member');
    });

    // it('can addProposal to change member', async () => {
    //   await staking.connect(govMem1).deposit({value: amount});


    //   let oldMember = await gov.getMember(1);
    //   oldMember.should.be.equal(deployer.address);
    //   let oldVoter = await gov.getVoter(1);
    //   oldVoter.should.be.equal(deployer.address);
    //   await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
    //   const len = await gov.ballotLength();
    //   len.should.be.equal(BigNumber.from(1));

    //   let newMember = await gov.getMember(1);
    //   newMember.should.be.equal(govMem1.address);
    //   let newVoter = await gov.getVoter(1);
    //   newVoter.should.be.equal(govMem1.address);
    //   let newReward = await gov.getReward(1);
    //   newReward.should.be.equal(govMem1.address);
    // });

    it(`can addProposal to change member's other addresses self without voting`, async () => {
      let oldMember = await gov.getMember(1);
      oldMember.should.be.equal(deployer.address);
      let oldVoter = await gov.getVoter(1);
      oldVoter.should.be.equal(deployer.address);
      let oldReward = await gov.getVoter(1);
      oldReward.should.be.equal(deployer.address);
      // console.log(result);
      await govDelegator.addProposalToChangeMember([deployer.address, voter1.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));

      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      let newMember = await gov.getMember(1);
      newMember.should.be.equal(deployer.address);
      let newVoter = await gov.getVoter(1);
      newVoter.should.be.equal(voter1.address);
      let newReward = await gov.getReward(1);
      newReward.should.be.equal(user1.address);
    });

    // it('can addProposal to change staker with voting', async () => {
    //   await staking.connect(govMem1).deposit({value:amount});

    //   let oldMember = await gov.getMember(1);
    //   oldMember.should.be.equal(deployer.address);
    //   let oldVoter = await gov.getVoter(1);
    //   oldVoter.should.be.equal(voter0.address);
    //   // console.log(result);
    //   await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
    //   const len = await gov.ballotLength();
    //   len.should.be.equal(BigNumber.from(1));

    //   let newMember = await gov.getMember(1);
    //   newMember.should.be.equal(deployer.address);
    //   let newVoter = await gov.getVoter(1);
    //   newVoter.should.be.equal(voter1.address);
    // });

    it('cannot addProposal to change non-member', async () => {
      // eslint-disable-next-line max-len
      await expect(govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], govMem2.address)).to.be.revertedWith('Non-member');
    });

    it('can addProposal to change governance', async () => {
      let GovImp = await hre.ethers.getContractFactory('GovImp');
      let newGovImp = await GovImp.deploy();
      await govDelegator.addProposalToChangeGov(newGovImp.address, U2B(memo[0]), duration);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(1));
    });

    it('can not addProposal to change governance using EOA', async () => {
      await expect(govDelegator.addProposalToChangeGov(govMem1.address, U2B(memo[0]), duration)).to.be.revertedWith('function call to a non-contract account');
    });

    it('can not addProposal to change governance using non-UUPS', async () => {
      await expect(govDelegator.addProposalToChangeGov(registry.address, U2B(memo[0]), duration)).to.be.revertedWith('ERC1967Upgrade: new implementation is not UUPS');
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
      await staking.connect(govMem1).deposit( { value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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
      nodeLen.should.be.equal(BigNumber.from(memberLen));
      const lock = await staking.lockedBalanceOf(govMem1.address);
      lock.should.be.equal(BigNumber.from(amount));

      let newMember = await gov.getMember(memberLen);
      newMember.should.be.equal(govMem1.address);
      let newVoter = await gov.getVoter(memberLen);
      newVoter.should.be.equal(govMem1.address);
      let newReward = await gov.getReward(memberLen);
      newReward.should.be.equal(govMem1.address);
    });

    it('cannot vote approval to add member with insufficient staking', async () => {
      await staking.connect(govMem1).deposit({ value: amount.sub(BigNumber.from('10000000000000')) });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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
      await staking.connect(govMem1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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
      await staking.connect(govMem1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(1, true);
      let len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      let inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      let state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);
      //govMem1 signer
      await staking.connect(govMem2).deposit({ value: amount });
      const preDeployerAvail = await staking.availableBalanceOf(govMem1.address);
      const preGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
      await govDelegator.addProposalToChangeMember([govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[1]), duration], govMem1.address);
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

      const postDeployerAvail = await staking.availableBalanceOf(govMem1.address);
      const postGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
      postDeployerAvail.sub(preDeployerAvail).should.be.equal(BigNumber.from(amount));
      preGovmem1Avail.sub(postGovmem1Avail).should.be.equal(BigNumber.from(amount));
    });

    it('can vote approval to change enode only without voting', async () => {
      await govDelegator.addProposalToChangeMember([deployer.address, deployer.address, deployer.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration], deployer.address);
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
      await staking.connect(govMem1).deposit({ value: amount.sub(BigNumber.from("1000000000")) });
      await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration], deployer.address);
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
      await staking.connect(govMem1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(1, true);
      await expect(govDelegator.vote(1, true)).to.be.revertedWith('Expired');
    });
  });

  describe('Staker is not a voter', function () {

    beforeEach(async () => {
      //govMem1 signer
      await govDelegator.addProposalToChangeMember([deployer.address, voter0.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
      govDelegator = await govDelegator.connect(voter0);
    });
    

    it('cannot addProposal to add member self', async () => {
      await expect( govDelegator.addProposalToAddMember([deployer.address, deployer.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration])).to.be.revertedWith('Already member');
    });

    it('cannot addProposal to add member with different voter', async () => {
      await expect( govDelegator.addProposalToAddMember([deployer.address, voter0.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration])).to.be.revertedWith('Already member');
    });

    it('can addProposal to add member', async () => {
      // staking first
      await staking.connect(govMem1).deposit({ value: amount});
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(2));
      const ballot = await ballotStorage.getBallotBasic(len);
      const ballotDetail = await ballotStorage.getBallotMember(len);
      ballot[3].should.be.equal(voter0.address);
      U2S(ballot[4]).should.be.equal(memo[0]);
      ballotDetail[1].should.be.equal(govMem1.address);

      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[1]), duration]);
      const len2 = await gov.ballotLength();
      len2.should.be.equal(BigNumber.from(3));
    });

    it('cannot addProposal to remove non-member', async () => {
      // staking first
      // await staking.connect(govMem1).deposit({ value: amount});
      await expect(govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration)).to.be.revertedWith('Non-member');
    });

    it('cannot addProposal to remove a sole member', async () => {
      await expect(govDelegator.addProposalToRemoveMember(deployer.address, amount, U2B(memo[0]), duration)).to.be.revertedWith('Cannot remove a sole member');
    });

    // it('can addProposal to change member', async () => {
    //   await staking.connect(govMem1).deposit({value: amount});


    //   let oldMember = await gov.getMember(1);
    //   oldMember.should.be.equal(deployer.address);
    //   let oldVoter = await gov.getVoter(1);
    //   oldVoter.should.be.equal(deployer.address);
    //   await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
    //   const len = await gov.ballotLength();
    //   len.should.be.equal(BigNumber.from(1));

    //   let newMember = await gov.getMember(1);
    //   newMember.should.be.equal(govMem1.address);
    //   let newVoter = await gov.getVoter(1);
    //   newVoter.should.be.equal(govMem1.address);
    //   let newReward = await gov.getReward(1);
    //   newReward.should.be.equal(govMem1.address);
    // });

    it(`can addProposal to change member's other addresses self without voting`, async () => {
      let oldMember = await gov.getMember(1);
      oldMember.should.be.equal(deployer.address);
      let oldVoter = await gov.getVoter(1);
      oldVoter.should.be.equal(voter0.address);
      let oldReward = await gov.getReward(1);
      oldReward.should.be.equal(user1.address);
      // console.log(result);
      await govDelegator.addProposalToChangeMember([deployer.address, voter1.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(2));
      await govDelegator.vote(2, true);

      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(len);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      let newMember = await gov.getMember(1);
      newMember.should.be.equal(deployer.address);
      let newVoter = await gov.getVoter(1);
      newVoter.should.be.equal(voter1.address);
      let newReward = await gov.getReward(1);
      newReward.should.be.equal(user1.address);
    });

    // it('can addProposal to change staker with voting', async () => {
    //   await staking.connect(govMem1).deposit({value:amount});

    //   let oldMember = await gov.getMember(1);
    //   oldMember.should.be.equal(deployer.address);
    //   let oldVoter = await gov.getVoter(1);
    //   oldVoter.should.be.equal(voter0.address);
    //   // console.log(result);
    //   await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
    //   const len = await gov.ballotLength();
    //   len.should.be.equal(BigNumber.from(1));

    //   let newMember = await gov.getMember(1);
    //   newMember.should.be.equal(deployer.address);
    //   let newVoter = await gov.getVoter(1);
    //   newVoter.should.be.equal(voter1.address);
    // });

    it('cannot addProposal to change non-member', async () => {
      // eslint-disable-next-line max-len
      await expect(govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], govMem2.address)).to.be.revertedWith('Non-member');
    });

    it('can addProposal to change governance', async () => {
      let GovImp = await hre.ethers.getContractFactory('GovImp');
      let newGovImp = await GovImp.deploy();
      await govDelegator.addProposalToChangeGov(newGovImp.address, U2B(memo[0]), duration);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(2));
    });

    it('can not addProposal to change governance using EOA', async () => {
      await expect(govDelegator.addProposalToChangeGov(govMem1.address, U2B(memo[0]), duration)).to.be.revertedWith('function call to a non-contract account');
    });

    it('can not addProposal to change governance using non-UUPS', async () => {
      await expect(govDelegator.addProposalToChangeGov(registry.address, U2B(memo[0]), duration)).to.be.revertedWith('ERC1967Upgrade: new implementation is not UUPS');
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
      len.should.be.equal(BigNumber.from(2));
    });

    it('cannot addProposal to change environment with wrong type', async () => {
      await expect(govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Invalid, U2B(envVal), U2B(memo[0]), duration)).to.be.revertedWith('Invalid type');
    });

    it('can vote approval to add member', async () => {
      //govMem1 signer
      await staking.connect(govMem1).deposit( { value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(2, true);

      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(2);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);
      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(2));
      const nodeLen = await gov.getNodeLength();
      nodeLen.should.be.equal(BigNumber.from(memberLen));
      const lock = await staking.lockedBalanceOf(govMem1.address);
      lock.should.be.equal(BigNumber.from(amount));

      let newMember = await gov.getMember(memberLen);
      newMember.should.be.equal(govMem1.address);
      let newVoter = await gov.getVoter(memberLen);
      newVoter.should.be.equal(govMem1.address);
      let newReward = await gov.getReward(memberLen);
      newReward.should.be.equal(govMem1.address);
    });

    it('cannot vote approval to add member with insufficient staking', async () => {
      await staking.connect(govMem1).deposit({ value: amount.sub(BigNumber.from('10000000000000')) });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      //스테이킹 량 부족시 투표는 종료되며 결과가 reject로 표시
      await (govDelegator.vote(2, true));//.to.be.revertedWith('invalid address');
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(2);
      state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
      state[2].should.equal(true);
      const memberLen = await gov.getMemberLength();
      memberLen.should.be.equal(BigNumber.from(1));
    });

    it('can vote disapproval to deny adding member', async () => {
      await staking.connect(govMem1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(2, false);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(2);
      state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
      state[2].should.equal(true);
    });

    it('can vote approval to change member totally', async () => {

      //add 
      await staking.connect(govMem1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(2, true);
      let len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      let inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      let state = await ballotStorage.getBallotState(2);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);
      //govMem1 signer
      await staking.connect(govMem2).deposit({ value: amount });
      const preDeployerAvail = await staking.availableBalanceOf(govMem1.address);
      const preGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
      await govDelegator.addProposalToChangeMember([govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[1]), duration], govMem1.address);
      await govDelegator.vote(3, true);
      await govDelegator.connect(govMem1).vote(3, true);
      //voteLength = 현재까지 vote()함수가 불린 함수
      len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(3));
      inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      state = await ballotStorage.getBallotState(3);
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

      const postDeployerAvail = await staking.availableBalanceOf(govMem1.address);
      const postGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
      postDeployerAvail.sub(preDeployerAvail).should.be.equal(BigNumber.from(amount));
      preGovmem1Avail.sub(postGovmem1Avail).should.be.equal(BigNumber.from(amount));
    });

    it('can vote approval to change enode only without voting', async () => {
      await govDelegator.addProposalToChangeMember([deployer.address, voter0.address, user1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration], deployer.address);
      await govDelegator.vote(2, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(2);
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
      await staking.connect(govMem1).deposit({ value: amount.sub(BigNumber.from("1000000000")) });
      await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration], deployer.address);
      await govDelegator.vote(2, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(2);
      state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
      state[2].should.equal(true);
    });

    it('can vote approval to change governance', async () => {
      const GovImp = await ethers.getContractFactory("GovImp");
      const newGovImp = await GovImp.deploy();
      await govDelegator.addProposalToChangeGov(newGovImp.address, U2B(memo[0]), duration);
      await govDelegator.vote(2, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(2);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      const imp = await gov.implementation();
      imp.should.equal(newGovImp.address);
    });

    it('can vote approval to change environment', async () => {
      await govDelegator.addProposalToChangeEnv(ethers.utils.keccak256(U2B('blocksPer')), envTypes.Uint, '0x0000000000000000000000000000000000000000000000000000000000000064', U2B(memo[0]), duration);
      await govDelegator.vote(2, true);
      const len = await gov.voteLength();
      len.should.be.equal(BigNumber.from(1));
      const inVoting = await gov.getBallotInVoting();
      inVoting.should.be.equal(BigNumber.from(0));
      const state = await ballotStorage.getBallotState(2);
      state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
      state[2].should.equal(true);

      const blocksPer = await envDelegator.getBlocksPer();
      blocksPer.should.be.equal(BigNumber.from(100));
    });

    it('cannot vote for a ballot already done', async () => {
      //govMem1 signer
      // let signer1 = (await ethers.getSigners())[1];
      await staking.connect(govMem1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(2, true);
      await expect(govDelegator.vote(2, true)).to.be.revertedWith('Expired');
    });

    it('cannot vote for a ballot already staker done', async () => {
      //govMem1 signer
      // let signer1 = (await ethers.getSigners())[1];
      await staking.connect(govMem1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.connect(deployer).vote(2, true);
      await expect(govDelegator.vote(2, true)).to.be.revertedWith('Expired');
    });

    it('cannot vote for a ballot already voter done', async () => {
      //govMem1 signer
      // let signer1 = (await ethers.getSigners())[1];
      await staking.connect(govMem1).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(2, true);
      await expect(govDelegator.connect(deployer).vote(2, true)).to.be.revertedWith('Expired');
    });
  });

  describe('Two Member ', function () {
    beforeEach(async () => {
      //govMem1 signer
      // let signer1 = (await ethers.getSigners())[1];
      await staking.connect(govMem1).deposit({value: amount });
      await govDelegator.addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      await govDelegator.vote(1, true);
    });

    it('cannot addProposal to add member self', async () => {
      //govMem1 signer
      // let signer1 = (await ethers.getSigners())[1];
      await expect(govDelegator.connect(govMem1).addProposalToAddMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration])).to.be.revertedWith('Already member');
    });

    it('can addProposal to remove member', async () => {
      await govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration);
      const len = await gov.ballotLength();
      len.should.be.equal(BigNumber.from(2));
    });

    it('can vote to add member', async () => {
      //govMem2 signer
      // let signer2 = (await ethers.getSigners())[2];
      await staking.connect(govMem2).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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
      await staking.connect(govMem2).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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
      const preAvail = await staking.availableBalanceOf(deployer.address);
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
      const nodeIdx2 = await gov.getNodeIdxFromMember(govMem1.address);
      nodeIdx2.should.be.equal(BigNumber.from(1));

      const postAvail = await staking.availableBalanceOf(deployer.address);
      postAvail.sub(preAvail).should.be.equal(BigNumber.from(amount));
    });

    it('can vote to remove last member', async () => {
      const preAvail = await staking.availableBalanceOf(deployer.address);
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
      const nodeIdx2 = await gov.getNodeIdxFromMember(deployer.address);
      nodeIdx2.should.be.equal(BigNumber.from(1));

      const postAvail = await staking.availableBalanceOf(govMem1.address);
      postAvail.sub(preAvail).should.be.equal(BigNumber.from(amount));
    });

    it('cannot vote simultaneously', async () => {
      await staking.connect(govMem2).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
      
      await staking.connect(govMem3).deposit({ value: amount });
      await govDelegator.addProposalToAddMember([govMem3.address, govMem3.address, govMem3.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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
      await staking.connect(govMem1).deposit({ value: amount });
      await expect(gov.connect(govMem1).init(registry.address, govImp.address, amount, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0])).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('cannot addProposal', async () => {
      //govMem1 signer
      await expect(govDelegator.connect(govMem1).addProposalToAddMember(([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]))).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(govMem1).addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration)).to.be.revertedWith('No Permission');
      await staking.connect(govMem2).deposit({ value: amount });
      await expect(govDelegator.connect(govMem1).addProposalToChangeMember([govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration], govMem1.address)).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(govMem1).addProposalToChangeGov(govMem1.address, U2B(memo[0]), duration)).to.be.revertedWith('No Permission');
      await expect(govDelegator.connect(govMem1).addProposalToChangeEnv(B322S(envName), envTypes.Bytes32, U2B(envVal), U2B(memo[0]), duration)).to.be.revertedWith('No Permission');
    });

    it('cannot vote', async () => {
      await staking.connect(govMem2).deposit( { value: amount });
      await govDelegator.addProposalToAddMember([govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration]);
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