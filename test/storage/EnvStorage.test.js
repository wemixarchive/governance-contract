// const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
// const { ether } = require('openzeppelin-solidity/test/helpers/ether');
// const time = require('openzeppelin-solidity/test/helpers/time');

// const web3Utils = require('web3-utils');
// const web3EthAbi = require('web3-eth-abi');

// const Registry = artifacts.require('Registry.sol');
// const EnvStorage = artifacts.require('EnvStorage.sol');
// const EnvStorageImp = artifacts.require('EnvStorageImp.sol');


const { ethers } = require("hardhat");
const { expect } = require("chai");
const {should} = require("chai").should();

// require('chai')
//   .use(require('chai-as-promised'))
//   .use(require('chai-bignumber')(web3.BigNumber))
//   .should();


const BigNumber = hre.ethers.BigNumber;//require('bignumber.js');

const U2B =  ethers.utils.toUtf8Bytes;
const U2S = ethers.utils.toUtf8String;

const B322S = hre.ethers.utils.formatBytes32String;

const zeroAddress = '0x'+'0'.repeat(40);

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


describe('EnvStorage start', async () => {
  // const [deployer, creator, addMem, govAddr, govAddr2] = accounts;
  let deployer, creator, addMem, govAddr, govAddr2;
  let registry, iEnvStorage, envStorage, envStorageImp;

  // const _defaultBlocksPer =  new web3.BigNumber(1000);
  // const _defaultBallotDurationMin = time.duration.days(1);
  // const _defaultBallotDurationMax = time.duration.days(7);
  // const _defaultStakingMin = ether (4980000);
  // const _defaultStakingMax = ether (39840000);
  // const _defaultGasPrice = ether (0.00000008);
  // const _defaultMaxIdleBlockInterval = 5;

  beforeEach('Deplyoing', async () => {
    let accs = await hre.ethers.getSigners();
    deployer = accs[0];
    creator = accs[1];
    addMem = accs[2];
    govAddr = accs[3];
    govAddr2 = accs[4];
    staker0 = accs[5];
    staker1 = accs[6];
    staker2 = accs[7];
    user1 = accs[8];
    user2 = accs[9];

    let Registry = await hre.ethers.getContractFactory('Registry');
    // registry = await Registry.new();
    registry = await Registry.deploy();
    let EnvStorageImp = await hre.ethers.getContractFactory('EnvStorageImp');
    envStorageImp = await EnvStorageImp.deploy(); //await EnvStorageImp.new();
    let EnvStorage = await hre.ethers.getContractFactory('EnvStorage');
    envStorage = await EnvStorage.deploy(registry.address, envStorageImp.address);

    await registry.setContractDomain(B322S('EnvStorage'), envStorage.address);
    await registry.setContractDomain(B322S('GovernanceContract'), govAddr.address);

    iEnvStorage = await ethers.getContractAt('EnvStorageImp', envStorage.address);

    const envNames = Object.keys(envParams);
    let envNamesBytes = [];
    for(let i=0;i<envNames.length;i++){
      envNamesBytes.push(ethers.utils.keccak256(U2B(envNames[i])));
    }
    const envVariables = Object.values(envParams);
    await iEnvStorage.initialize(
      envNamesBytes,
      envVariables
      // _defaultBlocksPer,
      // _defaultBallotDurationMin,
      // _defaultBallotDurationMax,
      // _defaultStakingMin,
      // _defaultStakingMax,
      // _defaultGasPrice,
      // _defaultMaxIdleBlockInterval,
      // { from: deployer }
      );
  });

  describe('EnvStorage', function () {

    const _blocksPer =  100;
    const _blocksPerBytes = type2Bytes(['uint256'], [_blocksPer]);//web3EthAbi.encodeParameter('uint', _blocksPer);
    const _ballotDurationMin = 3600 * 24 * 2; //time.duration.days(2);
    const _ballotDurationMinBytes = type2Bytes(['uint256'], [_ballotDurationMin]);// web3EthAbi.encodeParameter('uint', _ballotDurationMin.toString(10));
    const _ballotDurationMax = 3600 * 24 * 2; //time.duration.weeks(2);
    const _ballotDurationMaxBytes = type2Bytes(['uint256'], [_ballotDurationMin])// web3EthAbi.encodeParameter('uint', _ballotDurationMax.toString(10));
    const _stakingMin = ether (1000);
    const _stakingMinBytes = type2Bytes(['uint256'], [_stakingMin]) //web3EthAbi.encodeParameter('uint', _stakingMin.toString(10));
    const _stakingMax = ether (1000);
    const _stakingMaxBytes = type2Bytes(['uint256'], [_stakingMax])// web3EthAbi.encodeParameter('uint', _stakingMax.toString(10));
    
    const _blockCreationTime = 1100;
    const _blockRewardAmount = ether(2);
    const _maxPriorityFeePerGas = '110'+'0'.repeat(9);
    const _blockRewardDistrbutionBlockProducer = 5000;
    const _blockRewardDistrbutionStakingReward = 1000;
    const _blockRewardDistrbutionEcosystem = 2000;
    const _blockRewardDistrbutionMaintanance = 2000;
    const _blockGasLimit = '11000'+'0'.repeat(9);
    const _baseFeeMaxChangeDenominator = 3;
    const _elasticityMultiplier = 2;
    const _stakingAddress = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'// user1.address;
    const _ecofundAddress = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'//user1.address;
    const _maintananceAddress = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'// user1.address;
    // const _testInt = -100;
    // const _testIntBytes = web3EthAbi.encodeParameter('int', _testInt);
    // const _testaddress = "0x961c20596e7EC441723FBb168461f4B51371D8aA";
    // const _testBytes32 = web3.sha3('stakingMax');
    // const _testBytes = "0x961c20596e7ec441723fbb168461f4b51371d8aa961c20596e7ec441723fbb168461f4b51371d8aa";
    // const _testString = "testtesttest";
    // const _testStringBytes =web3Utils.fromUtf8(_testString);

    it('Check Owner', async () => {
      const _owner = await envStorage.owner();
      _owner.should.be.equal(deployer.address);
    });

    it('Check Registry', async () => {
      const _govAddr = await iEnvStorage.reg.call();
      _govAddr.should.be.equal(registry.address);
    });

    it('Upgrade Implementation', async () => {
      let EnvStorageImp = await hre.ethers.getContractFactory('EnvStorageImp');
      let newEnvStorageImp = await EnvStorageImp.deploy();
      //console.log(`newEnvStorageImp : ${newEnvStorageImp.address}`);
      await envStorage.upgradeTo(newEnvStorageImp.address);
      const _impAddr = await envStorage.implementation();
      _impAddr.should.be.equal(newEnvStorageImp.address);
      let newEnvStorageImp2 = await EnvStorageImp.deploy();
      //console.log(`newEnvStorageImp2 : ${newEnvStorageImp2.address}`);
      await envStorage.connect(govAddr).upgradeTo(newEnvStorageImp2.address);
      const _impAddr2 = await envStorage.implementation();
      _impAddr2.should.be.equal(newEnvStorageImp2.address);
    });
    
    it('Check Variable Default Value', async () => {
      const blocksPer = await iEnvStorage.getBlocksPer();
      const durationMin = await iEnvStorage.getBallotDurationMin();
      const durationMax = await iEnvStorage.getBallotDurationMax();
      const stakingMin = await iEnvStorage.getStakingMin();
      const stakingMax = await iEnvStorage.getStakingMax();
      const gasPrice = await iEnvStorage.getGasPrice();
      const maxIdleBlockInterval = await iEnvStorage.getMaxIdleBlockInterval();
      
      blocksPer.should.be.equal( BigNumber.from(envParams['blocksPer']), "is not Default of BlocksPer");
      console.log(`blocksPer : ${blocksPer.toString()}`);
      durationMin.should.be.equal( BigNumber.from(envParams['ballotDurationMin']), "is not Default of BallotDurationMin");
      console.log(`durationMin : ${durationMin.toString()}`);
      durationMax.should.be.equal( BigNumber.from(envParams['ballotDurationMax']), "is not Default of BallotDurationMax");
      console.log(`durationMax : ${durationMax.toString()}`);
      stakingMin.should.be.equal( BigNumber.from(envParams['stakingMin']), "is not Default of StakingMin");
      console.log(`stakingMin : ${stakingMin.toString()}`);
      stakingMax.should.be.equal( BigNumber.from(envParams['stakingMax']), "is not Default of StakingMax");
      console.log(`stakingMax : ${stakingMax.toString()}`);
      gasPrice.should.be.equal( BigNumber.from(envParams['gasPrice']), "is not Default of GasPrice");
      console.log(`gasPrice : ${gasPrice.toString()}`);
      maxIdleBlockInterval.should.be.equal( BigNumber.from(envParams['MaxIdleBlockInterval']), "is not Default of MaxIdleBlockInterval");
      
      console.log(`MaxIdleBlockInterval : ${maxIdleBlockInterval.toString()}`);
    });

    // it('Type Test', async () => {
    //   let _result = await iEnvStorage.setTestIntByBytes(_testIntBytes);
    //   let _value = await iEnvStorage.getTestInt();
    //   // console.log(`bytes32 : ${web3.sha3('stakingMax')}`);
    //   _value.should.be.equal(BigNumber.from(_testInt,"not pass test int");
    //   // console.log(`getTestInt : ${_value} / ${_testIntBytes}`);

    //   _result = await iEnvStorage.setTestAddressByBytes(_testaddress);
    //   _value = await iEnvStorage.getTestAddress();
    //   assert.equal(web3Utils.toChecksumAddress(_value), _testaddress,"not pass test address");
    //   // console.log(`getTestAddress : ${_value} `);

    //   _result = await iEnvStorage.setTestBytes32ByBytes(_testBytes32);
    //   _value = await iEnvStorage.getTestBytes32();
    //   assert.equal(_value, _testBytes32);
    //   // console.log(`getTestBytes32 :  ${_value} / ${_testBytes32}`);

    //   _result = await iEnvStorage.setTestBytesByBytes(_testBytes);
    //   _value = await iEnvStorage.getTestBytes();
    //   assert.equal(_value, _testBytes);
    //   // console.log(`getTestBytes : ${_value}`);

    //   _result = await iEnvStorage.setTestStringByBytes(_testStringBytes);
    //   _value = await iEnvStorage.getTestString();
    //   assert.equal(_value, _testString);
    //   // console.log(`getTestString : ${_value}`);
    // });

    it('Canot Set blocks per variable(not govAddr)', async () => {
      await expect(iEnvStorage.connect(creator).setBlocksPerByBytes(_blocksPerBytes)).to.be.revertedWith('No Permission');
      await expect(iEnvStorage.connect(creator).setBlocksPer(_blocksPerBytes)).to.be.revertedWith('No Permission');
    });

    it('Update blocks per String variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setBlocksPerByBytes(_blocksPerBytes);
      const _value = await iEnvStorage.getBlocksPer();
      _value.should.be.equal(BigNumber.from(_blocksPer));
    });

    it('Update blocks per uint variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setBlocksPer(_blocksPer);
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('blocksPer') && ev._value == _blocksPer;
      // });
      const _value = await iEnvStorage.getBlocksPer();
      _value.should.be.equal(BigNumber.from(_blocksPer));
    });

    it('Update BallotDurationMin String variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setBallotDurationMinByBytes(_ballotDurationMinBytes);
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('ballotDurationMin') && ev._value == _ballotDurationMin;
      // });
      const _value = await iEnvStorage.getBallotDurationMin();
      _value.should.be.equal(BigNumber.from(_ballotDurationMin));
    });

    it('Update BallotDurationMin Uint variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setBallotDurationMin(_ballotDurationMin);
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('ballotDurationMin') && ev._value == _ballotDurationMin;
      // });
      const _value = await iEnvStorage.getBallotDurationMin();
      _value.should.be.equal(BigNumber.from(_ballotDurationMin));
    });

    it('Update BallotDurationMax string variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setBallotDurationMaxByBytes(_ballotDurationMaxBytes);
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('ballotDurationMax') && ev._value == _ballotDurationMax;
      // });
      const _value = await iEnvStorage.getBallotDurationMax();
      _value.should.be.equal(BigNumber.from(_ballotDurationMax));
    });

    it('Update BallotDurationMax int variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setBallotDurationMax(_ballotDurationMax);
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('ballotDurationMax') && ev._value == _ballotDurationMax;
      // });
      const _value = await iEnvStorage.getBallotDurationMax();
      _value.should.be.equal(BigNumber.from(_ballotDurationMax));
    });

    it('Update StakingMin variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setStakingMinByBytes(_stakingMinBytes);
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('stakingMin') && ev._value == _stakingMin;
      // });
      const _value = await iEnvStorage.getStakingMin();
      _value.should.be.equal(BigNumber.from(_stakingMin));
    });

    it('Update StakingMin variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setStakingMin(_stakingMin);
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('stakingMin') && ev._value == _stakingMin;
      // });
      const _value = await iEnvStorage.getStakingMin();
      _value.should.be.equal(BigNumber.from(_stakingMin));
    });

    it('Update StakingMax variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setStakingMaxByBytes(_stakingMaxBytes);
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('stakingMax') && ev._value == _stakingMax;
      // });
      const _value = await iEnvStorage.getStakingMax();
      _value.should.be.equal(BigNumber.from(_stakingMax));
    });

    it('Update StakingMax variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.connect(govAddr).setStakingMax(_stakingMax);
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('stakingMax') && ev._value == _stakingMax;
      // });
      const _value = await iEnvStorage.getStakingMax();
      _value.should.be.equal(BigNumber.from(_stakingMax));
    });

    it('Update ballot duration min max at one time', async () => {
      const _durationMinMaxByBytes = type2Bytes(['uint256','uint256'],[_ballotDurationMin, _ballotDurationMax]);
      const _result = await iEnvStorage.connect(govAddr).setBallotDurationMinMaxByBytes(_durationMinMaxByBytes);
      const _value = await iEnvStorage.getBallotDurationMinMax();
      _value[0].should.be.equal(BigNumber.from(_ballotDurationMin));
      _value[1].should.be.equal(BigNumber.from(_ballotDurationMax));
    });

    it('Update staking min max at one time', async () => {
      const _stakingMinMaxByBytes = type2Bytes(['uint256','uint256'],[_stakingMin, _stakingMax]);
      const _result = await iEnvStorage.connect(govAddr).setStakingMinMaxByBytes(_stakingMinMaxByBytes);
      const _value = await iEnvStorage.getStakingMinMax();
      _value[0].should.be.equal(BigNumber.from(_stakingMin));
      _value[1].should.be.equal(BigNumber.from(_stakingMax));
    });

    it('Update block creation time', async () => {
      const _blockCreationTimeByBytes = type2Bytes(['uint256'],[_blockCreationTime]);
      const _result = await iEnvStorage.connect(govAddr).setBlockCreationTimeByBytes(_blockCreationTimeByBytes);
      const _value = await iEnvStorage.getBlockCreationTime();
      _value.should.be.equal(BigNumber.from(_blockCreationTime));
    });

    it('Update block reward amount', async () => {
      const _blockRewardAmountByBytes = type2Bytes(['uint256'],[_blockRewardAmount]);
      const _result = await iEnvStorage.connect(govAddr).setBlockRewardAmountByBytes(_blockRewardAmountByBytes);
      const _value = await iEnvStorage.getBlockRewardAmount();
      _value.should.be.equal(BigNumber.from(_blockRewardAmount));
    });

    it('Update maxPriorityFeePerGas', async () => {
      const _maxPriorityFeePerGasByBytes = type2Bytes(['uint256'],[_maxPriorityFeePerGas]);
      const _result = await iEnvStorage.connect(govAddr).setMaxPriorityFeePerGasByBytes(_maxPriorityFeePerGasByBytes);
      const _value = await iEnvStorage.getMaxPriorityFeePerGas();
      _value.should.be.equal(BigNumber.from(_maxPriorityFeePerGas));
    });

    it('Update maxPriorityFeePerGas', async () => {
      const _blockRewardDistributionByBytes = type2Bytes(['uint256', 'uint256', 'uint256', 'uint256'],[_blockRewardDistrbutionBlockProducer,_blockRewardDistrbutionStakingReward, _blockRewardDistrbutionEcosystem, _blockRewardDistrbutionMaintanance]);
      const _result = await iEnvStorage.connect(govAddr).setBlockRewardDistributionMethodByBytes(_blockRewardDistributionByBytes);
      const _value = await iEnvStorage.getBlockRewardDistributionMethod();
      _value[0].should.be.equal(BigNumber.from(_blockRewardDistrbutionBlockProducer));
      _value[1].should.be.equal(BigNumber.from(_blockRewardDistrbutionStakingReward));
      _value[2].should.be.equal(BigNumber.from(_blockRewardDistrbutionEcosystem));
      _value[3].should.be.equal(BigNumber.from(_blockRewardDistrbutionMaintanance));
    });

    it('Update maxPriorityFeePerGas', async () => {
      const _gasLimitAndBaseFeeByBytes = type2Bytes(['uint256', 'uint256', 'uint256'],[_blockGasLimit,_baseFeeMaxChangeDenominator, _elasticityMultiplier]);
      const _result = await iEnvStorage.connect(govAddr).setGasLimitAndBaseFeeByBytes(_gasLimitAndBaseFeeByBytes);
      const _value = await iEnvStorage.getGasLimitAndBaseFee();
      _value[0].should.be.equal(BigNumber.from(_blockGasLimit));
      _value[1].should.be.equal(BigNumber.from(_baseFeeMaxChangeDenominator));
      _value[2].should.be.equal(BigNumber.from(_elasticityMultiplier));
    });
  });
});


function type2Bytes(abitypes, inputs){
  const ABICoder = ethers.utils.AbiCoder;
  const abiCoder = new ABICoder();
  
  // abitypes = [type]
  let parameters = abiCoder.encode(abitypes, inputs)
  return parameters;
}

function ether(val){
  return val.toString() + '0'.repeat(18);
}