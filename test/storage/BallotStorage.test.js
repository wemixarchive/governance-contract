const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
const time = require('openzeppelin-solidity/test/helpers/time');

const Registry = artifacts.require('Registry.sol');
const Staking = artifacts.require('Staking.sol');
const BallotStorage = artifacts.require('BallotStorage.sol');
const EnvStorage = artifacts.require('EnvStorage.sol');
const EnvStorageImp = artifacts.require('EnvStorageImp.sol');
const { ether } = require('openzeppelin-solidity/test/helpers/ether');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const util = require('ethereumjs-util');
const moment = require('moment');
const web3Utils = require('web3-utils');

// const enum BallotBasicParams{
//   StartTime = 0,
//   EndTime = 1,
//   BallotType = 2,
//   Creator = 3,
//   Memo = 4,
//   TotalVoters = 5,
//   PowerOfAccepts = 6 ,
//   PowerOfRejects = 7,
//   State = 8,
//   IsFinalized = 9,
//   Duration = 10
// }
const BallotBasicParams = {
  StartTime: 0,
  EndTime: 1,
  BallotType: 2,
  Creator: 3,
  Memo: 4,
  TotalVoters: 5,
  PowerOfAccepts: 6,
  PowerOfRejects: 7,
  State: 8,
  IsFinalized: 9,
  Duration: 10,
};
const BallotMemberParams = {
  oldMemberAddress:0,
  newMemberAddress:1,
  newNodeName:2, // name
  newNodeId:3, // admin.nodeInfo.id is 512 bit public key
  newNodeIp:4,
  newNodePort:5,
  lockAmount:6
}

const BallotStates = {
  Invalid:0,
  Ready:1,
  InProgress:2,
  Accepted:3,
  Rejected:4,
  Canceled:5
};
const BallotStatesPrams = {
  ballotType:0,
  state:1,
  isFinalized:2
}

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

contract('BallotStorage', function ([deployer, creator, addMem, addMem2, govAddr, govAddr2, member1, member2, member3]) {
  let registry, staking, ballotStorage, envStorageImp, envStorage, iEnvStorage;
  before(async () => {
    registry = await Registry.new();
    staking = await Staking.new(registry.address,"");
    await registry.setContractDomain('Staking', staking.address);
    await registry.setContractDomain('GovernanceContract', govAddr);

    envStorageImp = await EnvStorageImp.new();
    envStorage = await EnvStorage.new(registry.address, envStorageImp.address);
    await registry.setContractDomain('EnvStorage', envStorage.address);

    const _defaultBlocksPer =  new web3.BigNumber(1000);
    const _defaultBallotDurationMin = time.duration.days(1);
    const _defaultBallotDurationMax = time.duration.days(7);
    const _defaultStakingMin = ether (4980000);
    const _defaultStakingMax = ether (39840000);
    const _defaultGasPrice = ether (0.00000008);
    const _defaultMaxIdleBlockInterval = 5;

    iEnvStorage = EnvStorageImp.at(envStorage.address);
    //await iEnvStorage.initialize({ from: deployer });
    await iEnvStorage.initialize(
      _defaultBlocksPer,
      _defaultBallotDurationMin,
      _defaultBallotDurationMax,
      _defaultStakingMin,
      _defaultStakingMax,
      _defaultGasPrice,
      _defaultMaxIdleBlockInterval,
      { from: deployer }
    );

  });
  describe('Ballot', function () {
    beforeEach(async () => {
      ballotStorage = await BallotStorage.new(registry.address);
      await registry.setContractDomain('BallotStorage', ballotStorage.address);
    });

    const _id = 1;
    const _start_time = moment.utc().add(20, 'seconds').unix();
    const _end_time = moment.utc().add(10, 'days').unix();
    const _memo = 'test message for ballot';
    const _nodeName = 'Meta001'
    const _enodeid = '0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0';
    const _nodeip = '123.11.111.111';
    const _nodePort = 9545;
    const _duration = time.duration.weeks(1);
    const _lockAmount = new web3.BigNumber(100000000);
    describe('UpdateContract', function () {
      it('change ballotContract Address', async () => {
        let newBallotStorage = await BallotStorage.new(registry.address);
        await newBallotStorage.setPreviousBallotStorage(ballotStorage.address);
        let state1 = await ballotStorage.isDisabled();
        assert.equal(state1, false);
        let state2 = await newBallotStorage.isDisabled();
        assert.equal(state2, true);

        await registry.setContractDomain('BallotStorage', newBallotStorage.address);
        state1 = await ballotStorage.isDisabled();
        assert.equal(state1, true);
        state2 = await newBallotStorage.isDisabled();
        assert.equal(state2, false);
      });
      
      it('cannot create pchange ballotContract Address', async () => {
        const _ballotType = new web3.BigNumber(1);
        let newBallotStorage = await BallotStorage.new(registry.address);
        await newBallotStorage.setPreviousBallotStorage(ballotStorage.address);
        await reverting(newBallotStorage.createBallotForMember(
          _id, // ballot id
          _ballotType, // ballot type
          creator, // creator
          ZERO_ADDRESS, // oldMemberAddress
          addMem, // newMemberAddress
          _nodeName, // newNodeName
          _enodeid, // newNodeId
          _nodeip, // newNodeIp
          _nodePort, // newNodePort
          { value: 0, from: creator }
        ));

        await registry.setContractDomain('BallotStorage', newBallotStorage.address);
        await reverting(ballotStorage.createBallotForMember(
          _id, // ballot id
          _ballotType, // ballot type
          creator, // creator
          ZERO_ADDRESS, // oldMemberAddress
          addMem, // newMemberAddress
          _nodeName, // newNodeName
          _enodeid, // newNodeId
          _nodeip, // newNodeIp
          _nodePort, // newNodePort
          { value: 0, from: creator }
        ));
        await newBallotStorage.createBallotForMember(
          _id, // ballot id
          _ballotType, // ballot type
          creator, // creator
          ZERO_ADDRESS, // oldMemberAddress
          addMem, // newMemberAddress
          _nodeName, // newNodeName
          _enodeid, // newNodeId
          _nodeip, // newNodeIp
          _nodePort, // newNodePort
          { value: 0, from: govAddr }
        ); // .should.be.rejectedWith(ERROR_MSG);
      });
    });
    describe('Member', function () {
      describe('create', function () {
        describe('add', function () {
          const _ballotType = new web3.BigNumber(1);
          it('Cannot create Ballot for MemberAdd.(not govAddr)', async () => {
            await reverting(ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _nodeName, // newNodeName
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });
          it('Cannot create Ballot for MemberAdd by Invalid param(oldMemberAddress)', async () => {
            // case oldMemberAddress is set
            await reverting(ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              addMem2, // newMemberAddress
              _nodeName, // newNodeName
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('Cannot create Ballot for MemberAdd by Invalid param(mewMemberAddress)', async () => {
            // case newMemberAddress is not set
            await reverting(ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              ZERO_ADDRESS, // newMemberAddress
              _nodeName, // newNodeName
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));

            // case newMemberAddress is set invalid address
            await reverting(ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              '0xabbb12', // newMemberAddress
              _nodeName, // newNodeName
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('Cannot create Ballot for MemberAdd by null param(newNodeId)', async () => {
            const _emptyEnodeid = '';
            // case newNodeId is not set
            await reverting(ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _nodeName, // newNodeName
              _emptyEnodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('Cannot create Ballot for MemberAdd by null param(newNodeIp)', async () => {
            const _emptyNodeip = '';

            // case newNodeIp is not set
            await reverting(ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _nodeName, // newNodeName
              _enodeid, // newNodeId
              _emptyNodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('Cannot create Ballot for MemberAdd by null param(newNodePort)', async () => {
            const _emptyNodePort = 0;

            // case newNodePort is not set
            await reverting(ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _nodeName, // newNodeName
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _emptyNodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('create Ballot for MemberAdd', async () => {
            await ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _nodeName, // newNodeName
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: govAddr }
            ); // .should.be.rejectedWith(ERROR_MSG);

            const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);

            ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
            assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
            
            ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfAccepts].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
            assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);

            const ballotDetailInfo = await ballotStorage.getBallotMember(_id);

            assert.equal(ballotDetailInfo[BallotMemberParams.oldMemberAddress], ZERO_ADDRESS);
            assert.equal(ballotDetailInfo[BallotMemberParams.newMemberAddress], addMem);
            assert.equal(web3Utils.toUtf8(ballotDetailInfo[BallotMemberParams.newNodeName]), _nodeName);
            assert.equal(ballotDetailInfo[BallotMemberParams.newNodeId], _enodeid);
            assert.equal(web3Utils.toUtf8(ballotDetailInfo[BallotMemberParams.newNodeIp]), _nodeip);
            assert.equal(ballotDetailInfo[BallotMemberParams.newNodePort], _nodePort);

            const _ballotCount = await ballotStorage.getBallotCount();
            _ballotCount.should.be.bignumber.equal(1);
          });
          it('cannot create Ballot by duplicated id ', async () => {
            await ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _nodeName, // newNodeName
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: govAddr }
            );
            const _ballotType2 = 1; // new web3.BigNumber(1);
            const _nodeName2 = 'Meta2'; // newNodeName
            const _enodeid2 = '0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92bb';
            const _nodeip2 = '123.11.111.112';
            const _nodePort2 = 9541;
            await reverting(ballotStorage.createBallotForMember(
              _id, // ballot id
              _ballotType2, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem2, // newMemberAddress
              _nodeName2, // newNodeName
              _enodeid2, // newNodeId
              _nodeip2, // newNodeIp
              _nodePort2, // newNodePort
              { value: 0, from: govAddr }
            )); // .should.be.rejectedWith(ERROR_MSG);
          });
          describe('remove', function () {
            const _ballotType = new web3.BigNumber(2);
            it('Cannot create Ballot for MemberRemoval by invalid param', async () => {
              const _emptyNodePort = 0;

              // case newMemberAddress is not empty
              await reverting(ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                addMem, // newMemberAddress
                _nodeName, // newNodeName
                '', // newNodeId
                '', // newNodeIp
                0, // newNodePort
                { value: 0, from: creator }
              ));
              // case newNodeId is not empty
              await reverting(ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                ZERO_ADDRESS, // newMemberAddress
                _nodeName, // newNodeName
                _enodeid, // newNodeId
                '', // newNodeIp
                0, // newNodePort
                { value: 0, from: creator }
              ));
              // case newNodeIp is not empty
              await reverting(ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                ZERO_ADDRESS, // newMemberAddress
                _nodeName, // newNodeName
                '', // newNodeId
                _nodeip, // newNodeIp
                0, // newNodePort
                { value: 0, from: creator }
              ));
              // case newNodePort is not empty
              await reverting(ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                ZERO_ADDRESS, // newMemberAddress
                _nodeName, // newNodeName
                '', // newNodeId
                '', // newNodeIp
                _nodePort, // newNodePort
                { value: 0, from: creator }
              ));
            });
            it('create Ballot for MemberRemove', async () => {
              await ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                ZERO_ADDRESS, // newMemberAddress
                '0x', // newNodeName
                '0x', // newNodeId
                '', // newNodeIp
                0, // newNodePort
                { value: 0, from: govAddr }
              ); // .should.be.rejectedWith(ERROR_MSG);

              const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);

              ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
              assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
              ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
              ballotBasicInfo[BallotBasicParams.PowerOfAccepts].should.be.bignumber.equal(0);
              ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
              ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
              assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);

              const ballotDetailInfo = await ballotStorage.getBallotMember(_id);

              assert.equal(ballotDetailInfo[BallotMemberParams.oldMemberAddress], addMem);
              assert.equal(ballotDetailInfo[BallotMemberParams.newMemberAddress], ZERO_ADDRESS);
              //assert.equal(web3Utils.toUtf8(ballotDetailInfo[BallotMemberParams.newNodeName]), _nodeName);
              assert.equal(ballotDetailInfo[BallotMemberParams.newNodeName], '0x');
              assert.equal(ballotDetailInfo[BallotMemberParams.newNodeId], '0x');
              assert.equal(web3Utils.toUtf8(ballotDetailInfo[BallotMemberParams.newNodeIp]), '');
              assert.equal(ballotDetailInfo[BallotMemberParams.newNodePort], 0);

            });
          });
          describe('swap', function () {
            const _ballotType = new web3.BigNumber(3);
            it('Cannot create Ballot for MemberSwap by invalid param', async () => {
            // case oldMemberAddress is empty
              await reverting(ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                ZERO_ADDRESS, // oldMemberAddress
                addMem, // newMemberAddress
                _nodeName, // newNodeName
                _enodeid, // newNodeId
                _nodeip, // newNodeIp
                _nodePort, // newNodePort
                { value: 0, from: creator }
              ));
              // case newMemberAddress is empty
              await reverting(ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                ZERO_ADDRESS, // newMemberAddress
                _nodeName, // newNodeName
                _enodeid, // newNodeId
                _nodeip, // newNodeIp
                _nodePort, // newNodePort
                { value: 0, from: creator }
              ));
              // case newNodeId is  empty
              await reverting(ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                addMem, // newMemberAddress
                _nodeName, // newNodeName
                '0x', // newNodeId
                _nodeip, // newNodeIp
                _nodePort, // newNodePort
                { value: 0, from: creator }
              ));
              // case newNodeIp is empty
              await reverting(ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                addMem, // newMemberAddress
                _nodeName, // newNodeName
                _enodeid, // newNodeId
                '0x', // newNodeIp
                _nodePort, // newNodePort
                { value: 0, from: creator }
              ));
              // case newNodePort is  empty
              await reverting(ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                addMem, // newMemberAddress
                _nodeName, // newNodeName
                _enodeid, // newNodeId
                _nodeip, // newNodeIp
                0, // newNodePort
                { value: 0, from: creator }
              ));
            });
            it('create Ballot for MemberSwap', async () => {
              await ballotStorage.createBallotForMember(
                _id, // ballot id
                _ballotType, // ballot type
                creator, // creator
                addMem, // oldMemberAddress
                addMem, // newMemberAddress
                _nodeName, // newNodeName
                _enodeid, // newNodeId
                _nodeip, // newNodeIp
                _nodePort, // newNodePort
                { value: 0, from: govAddr }
              ); // .should.be.rejectedWith(ERROR_MSG);

              const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);

              ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
              assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
              ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
              ballotBasicInfo[BallotBasicParams.PowerOfAccepts].should.be.bignumber.equal(0);
              ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
              ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
              assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);

              const ballotDetailInfo = await ballotStorage.getBallotMember(_id);

              assert.equal(ballotDetailInfo[BallotMemberParams.oldMemberAddress], addMem);
              assert.equal(ballotDetailInfo[BallotMemberParams.newMemberAddress], addMem);
              assert.equal(web3Utils.toUtf8(ballotDetailInfo[BallotMemberParams.newNodeName]), _nodeName);
              assert.equal(ballotDetailInfo[BallotMemberParams.newNodeId], _enodeid);
              assert.equal(web3Utils.toUtf8(ballotDetailInfo[BallotMemberParams.newNodeIp]),  _nodeip);
              assert.equal(ballotDetailInfo[BallotMemberParams.newNodePort], _nodePort);
            });
          });
        });
        describe('address', function () {
          const _ballotType = new web3.BigNumber(4);

          it('Canot create Ballot for Governance Address(not govAddr)', async () => {
            await reverting(ballotStorage.createBallotForAddress(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              govAddr2, // new governance contract address
              { value: 0, from: creator }
            ));
          });

          it('create Ballot for Governance Address', async () => {
            await ballotStorage.createBallotForAddress(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              govAddr2, // new governance contract address
              { value: 0, from: govAddr }
            ); // .should.be.rejectedWith(ERROR_MSG);

            const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
            ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
            assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
            // memo 4
            ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfAccepts].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
            assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);

            const ballotDetailInfo = await ballotStorage.getBallotAddress(_id);
            // console.log(`MemberBallot : ${ballotDetailInfo}`);
            assert.equal(ballotDetailInfo, govAddr2);
          });
        });
        describe('variable', function () {
          const _id = new web3.BigNumber(4);
          const _start_time = 0;
          const _end_time = 0;
          const _ballotType = new web3.BigNumber(5);
          const _memo = 'test message for ballot';
          const _varName = web3.sha3('blocksPer');
          const _varType = new web3.BigNumber(2);

          const _varVal = '0x0000000000000000000000000000000000000000000000000000000000007530';

          it('Canot create Ballot for Enviroment Variable(not govAddr)', async () => {
          // const _id = new web3.BigNumber(4);
          // const _ballotType = new web3.BigNumber(4);
          // const _memo = 'test message for ballot';
          // const _varName = web3.sha3('blocksPer');
          // const _varType = new web3.BigNumber(2);
          // const _varVal = new web3.BigNumber(1000);
            await reverting(ballotStorage.createBallotForVariable(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              _varName,
              _varType,
              _varVal,
              { value: 0, from: creator }
            ));
          });

          it('create Ballot for Enviroment Variable', async () => {
            await ballotStorage.createBallotForVariable(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              _varName,
              _varType,
              _varVal,
              { value: 0, from: govAddr }
            ); // .should.be.rejectedWith(ERROR_MSG);

            const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
            ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
            assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
            // memo 4
            ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
            ballotBasicInfo[6].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
            assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);

            const ballotDetailInfo = await ballotStorage.getBallotVariable(_id);
            // console.log(`VariableBallot : ${ballotDetailInfo}`);

            assert.equal(ballotDetailInfo[0], _varName);
            ballotDetailInfo[1].should.be.bignumber.equal(_varType);

            // const _val = web3Utils.hexToNumber(ballotDetailInfo[3]);
            // console.log(`Variable Value : ${_val}`);
            assert.equal(ballotDetailInfo[2], _varVal);
          });
        });
      });
    });
    describe('update', function () {
      const _ballotType = new web3.BigNumber(1);
      beforeEach(async () => {
        await ballotStorage.createBallotForMember(
          _id, // ballot id
          _ballotType, // ballot type
          creator, // creator
          ZERO_ADDRESS, // oldMemberAddress
          addMem, // newMemberAddress
          _nodeName, // newNodeName
          _enodeid, // newNodeId
          _nodeip, // newNodeIp
          _nodePort, // newNodePort
          { value: 0, from: govAddr }
        ); // .should.be.rejectedWith(ERROR_MSG);
      });
      describe('start', function () {
        it('Start Ballot for MemberAdd', async () => {
          await ballotStorage.startBallot(_id, _start_time, _end_time, { value: 0, from: govAddr });

          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(ballotBasicInfo[BallotBasicParams.StartTime], _start_time);
          assert.equal(ballotBasicInfo[BallotBasicParams.EndTime], _end_time);
          ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(2); // InProgress

          const ballotBasicTime = await ballotStorage.getBallotPeriod(_id);
          assert.equal(ballotBasicTime[0], _start_time);
          assert.equal(ballotBasicTime[1], _end_time);

          const ballotBasicState = await ballotStorage.getBallotState(_id);
          ballotBasicState[0].should.be.bignumber.equal(_ballotType);
          ballotBasicState[1].should.be.bignumber.equal(2);
          assert.equal(ballotBasicState[2], false);

          const ballotBasicVotingInfo = await ballotStorage.getBallotVotingInfo(_id);
          ballotBasicVotingInfo[0].should.be.bignumber.equal(0);
          ballotBasicVotingInfo[1].should.be.bignumber.equal(0);
          ballotBasicVotingInfo[2].should.be.bignumber.equal(0);
        });
      });
      describe('cancel', function () {
        it('cancel Ballot for MemberAdd from gov', async () => {
          await ballotStorage.cancelBallot(_id, { value: 0, from: govAddr });
          const ballotBasicState = await ballotStorage.getBallotState(_id);
          ballotBasicState[BallotStatesPrams.ballotType].should.be.bignumber.equal(_ballotType);
          ballotBasicState[BallotStatesPrams.state].should.be.bignumber.equal(BallotStates.Canceled);
          assert.equal(ballotBasicState[BallotStatesPrams.isFinalized], false);
        });
        it('cancel Ballot for MemberAdd from creator', async () => {
          await ballotStorage.cancelBallot(_id, { value: 0, from: creator });
          const ballotBasicState = await ballotStorage.getBallotState(_id);
          ballotBasicState[BallotStatesPrams.ballotType].should.be.bignumber.equal(_ballotType);
          ballotBasicState[BallotStatesPrams.state].should.be.bignumber.equal(BallotStates.Canceled);
          assert.equal(ballotBasicState[BallotStatesPrams.isFinalized], false);
        });
        it('cannot cancel Ballot for MemberAdd from non-permition user', async () => {
          await reverting(ballotStorage.cancelBallot(_id, { value: 0, from: member3 }));
          const ballotBasicState = await ballotStorage.getBallotState(_id);
          ballotBasicState[BallotStatesPrams.ballotType].should.be.bignumber.equal(_ballotType);
          ballotBasicState[BallotStatesPrams.state].should.be.bignumber.equal(BallotStates.Ready);
          assert.equal(ballotBasicState[BallotStatesPrams.isFinalized], false);
        });
      });
      describe('setMemo', function () {
        it('update Ballot memo for MemberAdd', async () => {
          await ballotStorage.updateBallotMemo(_id, _memo, { value: 0, from: govAddr });
          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(web3Utils.toUtf8(ballotBasicInfo[BallotBasicParams.Memo]), _memo);
        });
        it('update Ballot memo for MemberAdd from creator', async () => {
          await ballotStorage.updateBallotMemo(_id, _memo, { value: 0, from: creator });
          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(web3Utils.toUtf8(ballotBasicInfo[BallotBasicParams.Memo]), _memo);
        });
      });
      describe('setDuration', function () {
        it('update Ballot duration for MemberAdd', async () => {
          await ballotStorage.updateBallotDuration(_id, _duration, { value: 0, from: govAddr });
          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(ballotBasicInfo[BallotBasicParams.Duration], _duration);
          const ballotPeriodInfo = await ballotStorage.getBallotPeriod(_id);
          assert.equal(ballotPeriodInfo[2], _duration);
        });
        it('update Ballot duration for MemberAdd from creator', async () => {
          await ballotStorage.updateBallotDuration(_id, _duration, { value: 0, from: creator });
          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(ballotBasicInfo[BallotBasicParams.Duration], _duration);
          const ballotPeriodInfo = await ballotStorage.getBallotPeriod(_id);
          assert.equal(ballotPeriodInfo[2], _duration);
        });
        it('cannot update Ballot duration for MemberAdd by invalid duration ', async () => {
          let _minDuration = await iEnvStorage.getBallotDurationMin();
          _minDuration -= 1 ;
          await reverting(ballotStorage.updateBallotDuration(_id, _minDuration, { value: 0, from: govAddr }));

          let _maxDuration = await iEnvStorage.getBallotDurationMax();
          _maxDuration += 1 ;
          await reverting(ballotStorage.updateBallotDuration(_id, _maxDuration, { value: 0, from: govAddr }));
          // const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          // assert.equal(ballotBasicInfo[BallotBasicParams.Duration], _duration);
          // const ballotPeriodInfo = await ballotStorage.getBallotPeriod(_id);
          // assert.equal(ballotPeriodInfo[2], _duration);
        });
      });
      describe('updateLockAmount', function () {
        it('update lockAmount for MemberAdd', async () => {
          await ballotStorage.updateBallotMemberLockAmount(_id, _lockAmount, { value: 0, from: govAddr });
          const ballotMemberInfo = await ballotStorage.getBallotMember(_id);
          ballotMemberInfo[BallotMemberParams.lockAmount].should.be.bignumber.equal(_lockAmount);
        });
      });
      describe('finalize', function () {
        it('finalize Ballot for MemberAdd', async () => {
          await ballotStorage.startBallot(_id, _start_time, _end_time, { value: 0, from: govAddr });
          let ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(ballotBasicInfo[BallotBasicParams.StartTime], _start_time);
          assert.equal(ballotBasicInfo[BallotBasicParams.EndTime], _end_time);
          ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(2); // InProgress
          const _state = 3;// accepted
          await ballotStorage.finalizeBallot(_id, _state, { value: 0, from: govAddr });
          ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(_state);
          assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], true);
          const ballotBasicState = await ballotStorage.getBallotState(_id);
          ballotBasicState[0].should.be.bignumber.equal(_ballotType);
          ballotBasicState[1].should.be.bignumber.equal(_state);
          assert.equal(ballotBasicState[2], true);
        });
      });
    });
  });
  describe('vote', function () {
    const _id = 1;
    let _start_time = 0;
    let _end_time = 0;
    // let after_end_time =  moment.utc().add(10, 'days').add(1,'seconds').unix();

    beforeEach(async () => {
      // registry = await Registry.new();
      // staking = await Staking.new(registry.address,"");
      // await registry.setContractDomain('Staking', staking.address);
      ballotStorage = await BallotStorage.new(registry.address);
      await registry.setContractDomain('BallotStorage', ballotStorage.address);
      // await registry.setContractDomain('GovernanceContract', govAddr);

      _start_time = moment.utc().add(1, 'seconds').unix();
      _end_time = moment.utc().add(10, 'days').unix();
      const _ballotType = 1; // new web3.BigNumber(1);
      const _nodeName ='Meta001';
      const _enodeid = '0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0';
      // let _enodeid = web3Utils.hexToBytes(_enodidHexString);
      const _nodeip = '123.11.111.111';
      const _nodePort = 9545;
      await ballotStorage.createBallotForMember(
        _id, // ballot id
        _ballotType, // ballot type
        creator, // creator
        ZERO_ADDRESS, // oldMemberAddress
        addMem, // newMemberAddress
        _nodeName, // newNodeName
        _enodeid, // newNodeId
        _nodeip, // newNodeIp
        _nodePort, // newNodePort
        { value: 0, from: govAddr }
      );

      await ballotStorage.startBallot(_id, _start_time, _end_time, { value: 0, from: govAddr });
    });
    describe('create', function () {
      it('create votes', async () => {
        // 1st vote
        const _voteId = 1;
        const _decision = 1; // accept
        const _power = 10000;

        await ballotStorage.createVote(
          _voteId, // _voteId,
          _id, // _ballotId,
          member1, // _voter,
          _decision, // _decision,
          _power, // _power,
          { value: 0, from: govAddr }
        ); // .should.be.rejectedWith(ERROR_MSG);

        const voteInfo = await ballotStorage.getVote(_voteId);
        // console.log(`MemberBallotBasic : ${ballotBasicInfo}`);

        // assert.equal(voteInfo[0], _voteId);
        voteInfo[0].should.be.bignumber.equal(_voteId);
        // assert.equal(voteInfo[1], _Id);
        voteInfo[1].should.be.bignumber.equal(_id);
        assert.equal(voteInfo[2], member1);
        assert.equal(voteInfo[3], _decision);
        // assert.equal(voteInfo[4], _power);
        voteInfo[4].should.be.bignumber.equal(_power);

        let ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(1); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0); // powerOfRejects
        let ballotBasicVotingInfo = await ballotStorage.getBallotVotingInfo(_id);
        ballotBasicVotingInfo[0].should.be.bignumber.equal(1);
        ballotBasicVotingInfo[1].should.be.bignumber.equal(_power);
        ballotBasicVotingInfo[2].should.be.bignumber.equal(0);

        let _hasVoted = await ballotStorage.hasAlreadyVoted(_id, member1);
        assert.equal(_hasVoted, true);

        // 2nd Vote
        const _voteId2 = 2;
        const _decision2 = 1; // reject
        const _power2 = 40000;
        await ballotStorage.createVote(
          _voteId2, // _voteId,
          _id, // _ballotId,
          member2, // _voter,
          _decision2, // _decision,
          _power2, // _power,
          { value: 0, from: govAddr }
        );
        ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(2); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power + _power2); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0); // powerOfRejects

        ballotBasicVotingInfo = await ballotStorage.getBallotVotingInfo(_id);
        ballotBasicVotingInfo[0].should.be.bignumber.equal(2);
        ballotBasicVotingInfo[1].should.be.bignumber.equal(_power + _power2);
        ballotBasicVotingInfo[2].should.be.bignumber.equal(0);

        _hasVoted = await ballotStorage.hasAlreadyVoted(_id, member2);
        assert.equal(_hasVoted, true);

        // 3rd Vote
        const _voteId3 = 3;
        const _decision3 = 2; // reject
        const _power3 = 50000;
        await ballotStorage.createVote(
          _voteId3, // _voteId,
          _id, // _ballotId,
          member3, // _voter,
          _decision3, // _decision,
          _power3, // _power,
          { value: 0, from: govAddr }
        );
        ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(3); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power + _power2); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(_power3); // powerOfRejects

        ballotBasicVotingInfo = await ballotStorage.getBallotVotingInfo(_id);
        ballotBasicVotingInfo[0].should.be.bignumber.equal(3);
        ballotBasicVotingInfo[1].should.be.bignumber.equal(_power + _power2);
        ballotBasicVotingInfo[2].should.be.bignumber.equal(_power3);
        _hasVoted = await ballotStorage.hasAlreadyVoted(_id, member3);
        assert.equal(_hasVoted, true);
      });

      it('cannot create vote - same voteId', async () => {
        const _voteId = 1;
        const _decision = 1; // accept
        const _power = 10000;

        const _decision2 = 2; // Reject
        const _power2 = 20000;

        await ballotStorage.createVote(
          _voteId, // _voteId,
          _id, // _ballotId,
          member1, // _voter,
          _decision, // _decision,
          _power, // _power,
          { value: 0, from: govAddr }
        ); // .should.be.rejectedWith(ERROR_MSG);

        await reverting(ballotStorage.createVote(
          _voteId, // _voteId,
          _id, // _ballotId,
          member2, // _voter,
          _decision2, // _decision,
          _power2, // _power,
          { value: 0, from: govAddr }
        ));

        const voteInfo = await ballotStorage.getVote(_voteId);
        // console.log(`MemberBallotBasic : ${ballotBasicInfo}`);

        // assert.equal(voteInfo[0], _voteId);
        voteInfo[0].should.be.bignumber.equal(_voteId);
        // assert.equal(voteInfo[1], _Id);
        voteInfo[1].should.be.bignumber.equal(_id);
        assert.equal(voteInfo[2], member1);
        assert.equal(voteInfo[3], _decision);
        // assert.equal(voteInfo[4], _power);
        voteInfo[4].should.be.bignumber.equal(_power);

        const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(1); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0); // powerOfRejects

        const _hasVoted = await ballotStorage.hasAlreadyVoted(_id, member1);
        assert.equal(_hasVoted, true);
      });

      it('cannot create vote - multiple vote', async () => {
        const _voteId = 1;
        const _decision = 1; // accept
        const _power = 10000;

        const _voteId2 = 2;
        const _decision2 = 2; // Reject
        const _power2 = 20000;

        await ballotStorage.createVote(
          _voteId, // _voteId,
          _id, // _ballotId,
          member1, // _voter,
          _decision, // _decision,
          _power, // _power,
          { value: 0, from: govAddr }
        ); // .should.be.rejectedWith(ERROR_MSG);

        await reverting(ballotStorage.createVote(
          _voteId2, // _voteId,
          _id, // _ballotId,
          member1, // _voter,
          _decision2, // _decision,
          _power2, // _power,
          { value: 0, from: govAddr }
        ));

        const voteInfo = await ballotStorage.getVote(_voteId);
        // console.log(`MemberBallotBasic : ${ballotBasicInfo}`);

        // assert.equal(voteInfo[0], _voteId);
        voteInfo[0].should.be.bignumber.equal(_voteId);
        // assert.equal(voteInfo[1], _Id);
        voteInfo[1].should.be.bignumber.equal(_id);
        assert.equal(voteInfo[2], member1);
        assert.equal(voteInfo[3], _decision);
        // assert.equal(voteInfo[4], _power);
        voteInfo[4].should.be.bignumber.equal(_power);

        const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(1); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0); // powerOfRejects
      });

      it('cannot create vote - not Existed ballot', async () => {
        const _notExistedId = 3;
        const _voteId = 1;
        const _decision = 1; // accept
        const _power = 10000;
        // await time.increaseTo(_start_time+1);
        // let _latestTime1 = await time.latest();
        // let _nowTime = await ballotStorage.getTime();
        // console.log(`step_(${_nowTime}):  ${_latestTime1},  ${_start_time}, ${_end_time}`);
        await reverting(ballotStorage.createVote(
          _voteId, // _voteId,
          _notExistedId, // _ballotId,
          member1, // _voter,
          _decision, // _decision,
          _power, // _power,
          { value: 0, from: govAddr }
        ));
      });
    });
    // describe('updateBallot Check', function () {
    // });
  });
});
