const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
const { ether } = require('openzeppelin-solidity/test/helpers/ether');
const time = require('openzeppelin-solidity/test/helpers/time');

const web3Utils = require('web3-utils');
const web3EthAbi = require('web3-eth-abi');

const Registry = artifacts.require('Registry.sol');
const EnvStorage = artifacts.require('EnvStorage.sol');
const EnvStorageImp = artifacts.require('EnvStorageImp.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

contract('EnvStorage', accounts => {
  const [deployer, creator, addMem, govAddr, govAddr2] = accounts;
  let registry, iEnvStorage, envStorage, envStorageImp;

  const _defaultBlockPer =  new web3.BigNumber(1000);
  const _defaultBallotDurationMin = time.duration.days(1);
  const _defaultBallotDurationMax = time.duration.days(7);
  const _defaultStakingMin = ether (4980000);
  const _defaultStakingMax = ether (39840000);
  const _defaultGasPrice = ether (0.00000008);

  beforeEach(async () => {
    registry = await Registry.new();
    // console.log(`registry : ${registry.address}`);
    envStorageImp = await EnvStorageImp.new();
    //console.log(`envStorageImp : ${envStorageImp.address}`);
    envStorage = await EnvStorage.new(registry.address, envStorageImp.address);
    // console.log(`envStorage : ${envStorage.address}`);
    await registry.setContractDomain('EnvStorage', envStorage.address);
    await registry.setContractDomain('GovernanceContract', govAddr);

    iEnvStorage = EnvStorageImp.at(envStorage.address);
    await iEnvStorage.initialize(
      _defaultBlockPer,
      _defaultBallotDurationMin,
      _defaultBallotDurationMax,
      _defaultStakingMin,
      _defaultStakingMax,
      _defaultGasPrice,
      { from: deployer });
  });

  describe('EnvStorage', function () {

    const _blockPer =  100;
    const _blockPerBytes = web3EthAbi.encodeParameter('uint', _blockPer);
    const _ballotDurationMin = time.duration.days(2);
    const _ballotDurationMinBytes = web3EthAbi.encodeParameter('uint', _ballotDurationMin.toString(10));
    const _ballotDurationMax = time.duration.weeks(2);
    const _ballotDurationMaxBytes = web3EthAbi.encodeParameter('uint', _ballotDurationMax.toString(10));
    const _stakingMin = ether (1000);
    const _stakingMinBytes = web3EthAbi.encodeParameter('uint', _stakingMin.toString(10));
    const _stakingMax = ether (1000);
    const _stakingMaxBytes = web3EthAbi.encodeParameter('uint', _stakingMax.toString(10));

    const _testInt = -100;
    const _testIntBytes = web3EthAbi.encodeParameter('int', _testInt);
    const _testaddress = "0x961c20596e7EC441723FBb168461f4B51371D8aA";
    const _testBytes32 = web3.sha3('stakingMax');
    const _testBytes = "0x961c20596e7ec441723fbb168461f4b51371d8aa961c20596e7ec441723fbb168461f4b51371d8aa";
    const _testString = "testtesttest";
    const _testStringBytes =web3Utils.fromUtf8(_testString);

    it('Check Owner', async () => {
      const _owner = await envStorage.owner();
      assert.equal(_owner, deployer);
    });

    it('Check Registry', async () => {
      const _govAddr = await iEnvStorage.reg.call();
      assert.equal(_govAddr, registry.address);
    });

    it('Upgrade Implementation', async () => {
      let newEnvStorageImp = await EnvStorageImp.new();
      //console.log(`newEnvStorageImp : ${newEnvStorageImp.address}`);
      await envStorage.upgradeTo(newEnvStorageImp.address);
      const _impAddr = await envStorage.implementation();
      assert.equal(_impAddr, newEnvStorageImp.address);
      let newEnvStorageImp2 = await EnvStorageImp.new();
      //console.log(`newEnvStorageImp2 : ${newEnvStorageImp2.address}`);
      await envStorage.upgradeTo(newEnvStorageImp2.address,{ value: 0, from: govAddr });
      const _impAddr2 = await envStorage.implementation();
      assert.equal(_impAddr2, newEnvStorageImp2.address);
    });
    
    it('Check Variable Default Value', async () => {
      const blockPer = await iEnvStorage.getBlockPer();
      const durationMin = await iEnvStorage.getBallotDurationMin();
      const durationMax = await iEnvStorage.getBallotDurationMax();
      const stakingMin = await iEnvStorage.getStakingMin();
      const stakingMax = await iEnvStorage.getStakingMax();
      const gasPrice = await iEnvStorage.getGasPrice();

      blockPer.should.be.bignumber.equal( _defaultBlockPer, "is not Default of BlockPer");
      console.log(`blockPer : ${blockPer.toFormat()}`);
      durationMin.should.be.bignumber.equal( _defaultBallotDurationMin, "is not Default of BallotDurationMin");
      console.log(`durationMin : ${durationMin.toFormat()}`);
      durationMax.should.be.bignumber.equal( _defaultBallotDurationMax, "is not Default of BallotDurationMax");
      console.log(`durationMax : ${durationMax.toFormat()}`);
      stakingMin.should.be.bignumber.equal( _defaultStakingMin, "is not Default of StakingMin");
      console.log(`stakingMin : ${stakingMin.toFormat()}`);
      stakingMax.should.be.bignumber.equal( _defaultStakingMax, "is not Default of StakingMax");
     
      console.log(`stakingMax : ${stakingMax.toFormat()}`);
      gasPrice.should.be.bignumber.equal( _defaultGasPrice, "is not Default of GasPrice");
      
      console.log(`gasPrice : ${gasPrice.toFormat()}`);
    });

    it('Type Test', async () => {
      let _result = await iEnvStorage.setTestIntByBytes(_testIntBytes, { value: 0, from: govAddr });
      let _value = await iEnvStorage.getTestInt();
      // console.log(`bytes32 : ${web3.sha3('stakingMax')}`);
      _value.should.be.bignumber.equal(_testInt,"not pass test int");
      // console.log(`getTestInt : ${_value} / ${_testIntBytes}`);

      _result = await iEnvStorage.setTestAddressByBytes(_testaddress, { value: 0, from: govAddr });
      _value = await iEnvStorage.getTestAddress();
      assert.equal(web3Utils.toChecksumAddress(_value), _testaddress,"not pass test address");
      // console.log(`getTestAddress : ${_value} `);

      _result = await iEnvStorage.setTestBytes32ByBytes(_testBytes32, { value: 0, from: govAddr });
      _value = await iEnvStorage.getTestBytes32();
      assert.equal(_value, _testBytes32);
      // console.log(`getTestBytes32 :  ${_value} / ${_testBytes32}`);

      _result = await iEnvStorage.setTestBytesByBytes(_testBytes, { value: 0, from: govAddr });
      _value = await iEnvStorage.getTestBytes();
      assert.equal(_value, _testBytes);
      // console.log(`getTestBytes : ${_value}`);

      _result = await iEnvStorage.setTestStringByBytes(_testStringBytes, { value: 0, from: govAddr });
      _value = await iEnvStorage.getTestString();
      assert.equal(_value, _testString);
      // console.log(`getTestString : ${_value}`);
    });

    it('Canot Set block per variable(not govAddr)', async () => {
      await reverting(iEnvStorage.setBlockPerByBytes(_blockPerBytes), { value: 0, from: creator });
      await reverting(iEnvStorage.setBlockPer(_blockPerBytes), { value: 0, from: creator });
    });

    it('Update block per String variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setBlockPerByBytes(_blockPerBytes, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('blockPer') && ev._value == _blockPer;
      // });
      const _value = await iEnvStorage.getBlockPer();
      _value.should.be.bignumber.equal(_blockPer);
    });

    it('Update block per uint variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setBlockPer(_blockPer, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('blockPer') && ev._value == _blockPer;
      // });
      const _value = await iEnvStorage.getBlockPer();
      _value.should.be.bignumber.equal(_blockPer);
    });

    it('Update BallotDurationMin String variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setBallotDurationMinByBytes(_ballotDurationMinBytes, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('ballotDurationMin') && ev._value == _ballotDurationMin;
      // });
      const _value = await iEnvStorage.getBallotDurationMin();
      _value.should.be.bignumber.equal(_ballotDurationMin);
    });

    it('Update BallotDurationMin Uint variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setBallotDurationMin(_ballotDurationMin, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('ballotDurationMin') && ev._value == _ballotDurationMin;
      // });
      const _value = await iEnvStorage.getBallotDurationMin();
      _value.should.be.bignumber.equal(_ballotDurationMin);
    });

    it('Update BallotDurationMax string variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setBallotDurationMaxByBytes(_ballotDurationMaxBytes, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('ballotDurationMax') && ev._value == _ballotDurationMax;
      // });
      const _value = await iEnvStorage.getBallotDurationMax();
      _value.should.be.bignumber.equal(_ballotDurationMax);
    });

    it('Update BallotDurationMax int variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setBallotDurationMax(_ballotDurationMax, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('ballotDurationMax') && ev._value == _ballotDurationMax;
      // });
      const _value = await iEnvStorage.getBallotDurationMax();
      _value.should.be.bignumber.equal(_ballotDurationMax);
    });

    it('Update StakingMin variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setStakingMinByBytes(_stakingMinBytes, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('stakingMin') && ev._value == _stakingMin;
      // });
      const _value = await iEnvStorage.getStakingMin();
      _value.should.be.bignumber.equal(_stakingMin);
    });

    it('Update StakingMin variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setStakingMin(_stakingMin, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('stakingMin') && ev._value == _stakingMin;
      // });
      const _value = await iEnvStorage.getStakingMin();
      _value.should.be.bignumber.equal(_stakingMin);
    });

    it('Update StakingMax variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setStakingMaxByBytes(_stakingMaxBytes, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('stakingMax') && ev._value == _stakingMax;
      // });
      const _value = await iEnvStorage.getStakingMax();
      _value.should.be.bignumber.equal(_stakingMax);
    });

    it('Update StakingMax variable  with VariableChange Event', async () => {
      const _result = await iEnvStorage.setStakingMax(_stakingMax, { value: 0, from: govAddr });
      // truffleAssert.eventEmitted(_result, 'UintVarableChanged', (ev) => {
      //   return ev._name === web3.sha3('stakingMax') && ev._value == _stakingMax;
      // });
      const _value = await iEnvStorage.getStakingMax();
      _value.should.be.bignumber.equal(_stakingMax);
    });
  });
});
