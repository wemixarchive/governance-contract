// const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
// const  hre  = require('hardhat');// require('openzeppelin-solidity/test/helpers/ether');

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { should } = require("chai").should();
const {getGovs} = require('../scripts/migration_gov_testnet');

const BigNumber = hre.ethers.BigNumber; //require('bignumber.js');

const U2B = ethers.utils.toUtf8Bytes;
const U2S = ethers.utils.toUtf8String;

const B322S = hre.ethers.utils.formatBytes32String;

const zeroAddress = "0x" + "0".repeat(40);

// require('chai')
//   .use(require('chai-bignumber')(web3.BigNumber))
//   .should();

// const Registry = artifacts.require('Registry.sol');
// const Staking = artifacts.require('Staking.sol');
// const BallotStorage = artifacts.require('BallotStorage.sol');
// const Gov = artifacts.require('govDelegator.sol');
// const GovImp = artifacts.require('GovImp.sol');
// const EnvStorage = artifacts.require('EnvStorage.sol');
// const EnvStorageImp = artifacts.require('EnvStorageImp.sol');

const amount = BigNumber.from("1500000" + "0".repeat(18));
const nodeName = ["Meta001", "Meta002", "Meta003", "Meta004"];
const changeNodeName = ["Meta001", "Meta002", "Meta003", "Meta004"];
const enode = [
    // eslint-disable-next-line max-len
    "0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0",
    // eslint-disable-next-line max-len
    "0x777777777711c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0",
    // eslint-disable-next-line max-len
    "0x888777777711c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a1",
    // eslint-disable-next-line max-len
    "0x999777777711c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a1"
];
const changeEnode = [
    // eslint-disable-next-line max-len
    "0x0f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0",
    // eslint-disable-next-line max-len
    "0x177777777711c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0",
    // eslint-disable-next-line max-len
    "0x288777777711c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a1",
    // eslint-disable-next-line max-len
    "0x399777777711c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a1"
];
const ip = ["127.0.0.1", "127.0.0.2", "127.0.0.3", "127.0.0.4"];
const changeIp = ["127.0.0.5", "127.0.0.6", "127.0.0.7", "127.0.0.8"];
const port = [8542, 8542, 8542,8542];
const memo = ["memo1", "memo2"];
const envName = "key";
const envVal = "value";

const envParams = {
    blocksPer: 1,
    ballotDurationMin: 1,
    ballotDurationMax: 604800,
    stakingMin: "1500000000000000000000000",
    stakingMax: "1500000000000000000000000",
    MaxIdleBlockInterval: 5,
    blockCreationTime: 1000,
    blockRewardAmount: "1000000000000000000",
    maxPriorityFeePerGas: "100000000000",
    blockRewardDistributionBlockProducer: 4000,
    blockRewardDistributionStakingReward: 1000,
    blockRewardDistributionEcosystem: 2500,
    blockRewardDistributionMaintenance: 2500,
    maxBaseFee: "5000000000000",
    blockGasLimit: "1050000000",
    baseFeeMaxChangeRate: 46,
    gasTargetPercentage: 30,
};

const duration = 86400;

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

describe("Governance", async function () {

    async function getGovContracts() {
        return await getGovs();
    }

    it("member check", async function () {
        const {mainnet, localhost} = await loadFixture(getGovContracts);

        expect(mainnet.envStorage.address).to.equal(localhost.envStorage.address);
        expect(mainnet.staking.address).to.equal(localhost.staking.address);
        expect(mainnet.ballot.address).to.equal(localhost.ballot.address);
        expect(mainnet.registry.address).to.equal(localhost.registry.address);
        let govMems_mainnet = [];
        for(i=0; i<await mainnet.gov.getMemberLength(); i++){
            let member = {}
            member.staker = await mainnet.gov.getMember(i+1);
            member.voter = await mainnet.gov.getVoter(i+1);
            member.reward = await mainnet.gov.getReward(i+1);
            member.node = await mainnet.gov.getNode(i+1);
            govMems_mainnet.push(member);
        }
        let govMems_localhost = [];
        for(i=0; i<await localhost.gov.getMemberLength(); i++){
            let member = {}
            member.staker = await localhost.gov.getMember(i+1);
            member.voter = await localhost.gov.getVoter(i+1);
            member.reward = await localhost.gov.getReward(i+1);
            member.node = await localhost.gov.getNode(i+1);
            govMems_localhost.push(member);
        }
        expect(govMems_mainnet).to.deep.equal(govMems_localhost);
    });

    it("AGov check", async function () {
        const {mainnet, localhost} = await loadFixture(getGovContracts);
        for(i=0; i<await mainnet.gov.getMemberLength(); i++){
            /// check voter
            let voter = await mainnet.gov.getVoter(i+1);

            let voterIdx_mainnet = await mainnet.gov.voterIdx(voter);
            let voterIdx_localhost = await localhost.gov.voterIdx(voter);
            expect(voterIdx_mainnet).to.equal(voterIdx_localhost);

            let isvoter_mainnet = await mainnet.gov.isVoter(voter);
            let isvoter_localhost = await localhost.gov.isVoter(voter);
            expect(isvoter_mainnet).to.equal(isvoter_localhost);


            let stakerAddrFromVoter_mainnet = await mainnet.gov.getStakerAddr(voter);
            let stakerAddrFromVoter_localhost = await localhost.gov.getStakerAddr(voter);
            expect(stakerAddrFromVoter_mainnet).to.equal(stakerAddrFromVoter_localhost);

            /// check staker
            let staker = await mainnet.gov.getMember(i+1);

            let stakerIdx_mainnet = await mainnet.gov.stakerIdx(staker);
            let stakerIdx_localhost = await localhost.gov.stakerIdx(staker);
            expect(stakerIdx_mainnet).to.equal(stakerIdx_localhost);

            let isstaker_mainnet = await mainnet.gov.isStaker(staker);
            let isstaker_localhost = await localhost.gov.isStaker(staker);
            expect(isstaker_mainnet).to.equal(isstaker_localhost);

            let nodeIdx_mainnet = await mainnet.gov.getNodeIdxFromMember(staker);
            let nodeIdx_localhost = await localhost.gov.getNodeIdxFromMember(staker);
            expect(nodeIdx_mainnet).to.equal(nodeIdx_localhost);

            let memberFromNodeIdx_mainnet = await mainnet.gov.getMemberFromNodeIdx(nodeIdx_mainnet);
            let memberFromNodeIdx_localhost = await localhost.gov.getMemberFromNodeIdx(nodeIdx_localhost);
            expect(memberFromNodeIdx_mainnet).to.equal(memberFromNodeIdx_localhost);

            let stakerAddrFromStaker_mainnet = await mainnet.gov.getStakerAddr(staker);
            let stakerAddrFromStaker_localhost = await localhost.gov.getStakerAddr(staker);
            expect(stakerAddrFromStaker_mainnet).to.equal(stakerAddrFromStaker_localhost);
            expect(stakerAddrFromStaker_mainnet).to.equal(stakerAddrFromVoter_mainnet);
            expect(stakerAddrFromStaker_localhost).to.equal(stakerAddrFromVoter_localhost);

            // let lastAddProposalTime_mainnet = await mainnet.gov.lastAddProposalTime(staker);
            // let lastAddProposalTime_localhost = await localhost.gov.lastAddProposalTime(staker);
            // expect(lastAddProposalTime_mainnet).to.equal(lastAddProposalTime_localhost);

            /// check reward
            let reward = await mainnet.gov.getReward(i+1);

            let rewardIdx_mainnet = await mainnet.gov.rewardIdx(reward);
            let rewardIdx_localhost = await localhost.gov.rewardIdx(reward);
            expect(rewardIdx_mainnet).to.equal(rewardIdx_localhost);

            // let isreward_mainnet = await mainnet.gov.isReward(reward);
            let isreward_localhost = await localhost.gov.isReward(reward);
            expect(isreward_localhost).to.equal(true);

        }

        let govMemberLength_mainnet = await mainnet.gov.getMemberLength();
        let govMemberLength_localhost = await localhost.gov.getMemberLength();
        expect(govMemberLength_mainnet).to.equal(govMemberLength_localhost);

        let nodeLength_mainnet = await mainnet.gov.getNodeLength();
        let nodeLength_localhost = await localhost.gov.getNodeLength();
        expect(nodeLength_mainnet).to.equal(nodeLength_localhost);

        let ballotInVoting_mainnet = await mainnet.gov.getBallotInVoting();
        let ballotInVoting_localhost = await localhost.gov.getBallotInVoting();
        expect(ballotInVoting_mainnet).to.equal(ballotInVoting_localhost);
        expect(ballotInVoting_mainnet).to.equal(0);
    });

    it("GovImp check", async function () {
        const {mainnet, localhost} = await loadFixture(getGovContracts);
        let minStaking_mainnet = await mainnet.gov.getMinStaking();
        let minStaking_localhost = await localhost.gov.getMinStaking();
        expect(minStaking_mainnet).to.equal(minStaking_localhost);
        
        let maxStaking_mainnet = await mainnet.gov.getMaxStaking();
        let maxStaking_localhost = await localhost.gov.getMaxStaking();
        expect(maxStaking_mainnet).to.equal(maxStaking_localhost);
        expect(maxStaking_localhost).to.equal(ethers.constants.MaxUint256);

        let minVoting_mainnet = await mainnet.gov.getMinVotingDuration();
        let minVoting_localhost = await localhost.gov.getMinVotingDuration();
        expect(minVoting_mainnet).to.equal(minVoting_localhost);

        let maxVoting_mainnet = await mainnet.gov.getMaxVotingDuration();
        let maxVoting_localhost = await localhost.gov.getMaxVotingDuration();
        expect(maxVoting_mainnet).to.equal(maxVoting_localhost);

        let threshold_mainnet = await mainnet.gov.getThreshold();
        let threshold_localhost = await localhost.gov.getThreshold();
        expect(threshold_mainnet).to.equal(threshold_localhost);
    });

    it("envStorage check", async function () {
        const {mainnet, localhost} = await loadFixture(getGovContracts);
        expect(mainnet.envStorage.address).to.equal(localhost.envStorage.address);
        
        let blocksPer_mainnet = await mainnet.envStorage.getBlocksPer();
        let blocksPer_localhost = await localhost.envStorage.getBlocksPer();
        expect(blocksPer_mainnet).to.equal(blocksPer_localhost);

        let ballotDurationMin_mainnet = await mainnet.envStorage.getBallotDurationMin();
        let ballotDurationMin_localhost = await localhost.envStorage.getBallotDurationMin();
        expect(ballotDurationMin_mainnet).to.equal(ballotDurationMin_localhost);

        let ballotDurationMax_mainnet = await mainnet.envStorage.getBallotDurationMax();
        let ballotDurationMax_localhost = await localhost.envStorage.getBallotDurationMax();
        expect(ballotDurationMax_mainnet).to.equal(ballotDurationMax_localhost);

        let stakingMin_mainnet = await mainnet.envStorage.getStakingMin();
        let stakingMin_localhost = await localhost.envStorage.getStakingMin();
        expect(stakingMin_mainnet).to.equal(stakingMin_localhost);

        let stakingMax_mainnet = await mainnet.envStorage.getStakingMax();
        let stakingMax_localhost = await localhost.envStorage.getStakingMax();
        expect(stakingMax_mainnet).to.equal(stakingMax_localhost);

        let maxIdleBlockInterval_mainnet = await mainnet.envStorage.getMaxIdleBlockInterval();
        let maxIdleBlockInterval_localhost = await localhost.envStorage.getMaxIdleBlockInterval();
        expect(maxIdleBlockInterval_mainnet).to.equal(maxIdleBlockInterval_localhost);

        let ballotDurationMinMax_mainnet = await mainnet.envStorage.getBallotDurationMinMax();
        let ballotDurationMinMax_localhost = await localhost.envStorage.getBallotDurationMinMax();
        expect(ballotDurationMinMax_mainnet).to.deep.equal(ballotDurationMinMax_localhost);

        let stakingMinMax_mainnet = await mainnet.envStorage.getStakingMinMax();
        let stakingMinMax_localhost = await localhost.envStorage.getStakingMinMax();
        expect(stakingMinMax_mainnet).to.deep.equal(stakingMinMax_localhost);

        let blockCreationTime_mainnet = await mainnet.envStorage.getBlockCreationTime();
        let blockCreationTime_localhost = await localhost.envStorage.getBlockCreationTime();
        expect(blockCreationTime_mainnet).to.equal(blockCreationTime_localhost);

        let blockRewardAmount_mainnet = await mainnet.envStorage.getBlockRewardAmount();
        let blockRewardAmount_localhost = await localhost.envStorage.getBlockRewardAmount();
        expect(blockRewardAmount_mainnet).to.equal(blockRewardAmount_localhost);

        let maxPriorityFeePerGas_mainnet = await mainnet.envStorage.getMaxPriorityFeePerGas();
        let maxPriorityFeePerGas_localhost = await localhost.envStorage.getMaxPriorityFeePerGas();
        expect(maxPriorityFeePerGas_mainnet).to.equal(maxPriorityFeePerGas_localhost);

        let maxBaseFee_mainnet = await mainnet.envStorage.getMaxBaseFee();
        let maxBaseFee_localhost = await localhost.envStorage.getMaxBaseFee();
        expect(maxBaseFee_mainnet).to.equal(maxBaseFee_localhost);

        let blockRewardDistributionMethod_mainnet = await mainnet.envStorage.getBlockRewardDistributionMethod();
        let blockRewardDistributionMethod_localhost = await localhost.envStorage.getBlockRewardDistributionMethod();
        expect(blockRewardDistributionMethod_mainnet).to.deep.equal(blockRewardDistributionMethod_localhost);

        let gasLimitAndBaseFee_mainnet = await mainnet.envStorage.getGasLimitAndBaseFee();
        let gasLimitAndBaseFee_localhost = await localhost.envStorage.getGasLimitAndBaseFee();
        expect(gasLimitAndBaseFee_mainnet).to.deep.equal(gasLimitAndBaseFee_localhost);
    });

    it("Registry check", async function () {
        const {mainnet, localhost} = await loadFixture(getGovContracts);
        let envStorage_mainnet = await mainnet.registry.getContractAddress(B322S("EnvStorage"));
        let ballotStorage_mainnet = await mainnet.registry.getContractAddress(B322S("BallotStorage"));
        let staking_mainnet = await mainnet.registry.getContractAddress(B322S("Staking"));
        let governanceContract_mainnet = await mainnet.registry.getContractAddress(B322S("Maintenance"));
        let maintenance_mainnet = await mainnet.registry.getContractAddress(B322S("Ecosystem"));
        let stakingReward_mainnet = await mainnet.registry.getContractAddress(B322S("StakingReward"));
        // let feeCollector_mainnet = await mainnet.registry.getContractAddress(B322S("FeeCollector"));

        let envStorage_localhost = await localhost.registry.getContractAddress(B322S("EnvStorage"));
        let ballotStorage_localhost = await localhost.registry.getContractAddress(B322S("BallotStorage"));
        let staking_localhost = await localhost.registry.getContractAddress(B322S("Staking"));
        let governanceContract_localhost = await localhost.registry.getContractAddress(B322S("Maintenance"));
        let maintenance_localhost = await localhost.registry.getContractAddress(B322S("Ecosystem"));
        let stakingReward_localhost = await localhost.registry.getContractAddress(B322S("StakingReward"));
        // let feeCollector_localhost = await localhost.registry.getContractAddress(B322S("FeeCollector"));

        expect(envStorage_mainnet).to.equal(envStorage_localhost);
        expect(ballotStorage_mainnet).to.equal(ballotStorage_localhost);
        expect(staking_mainnet).to.equal(staking_localhost);
        expect(governanceContract_mainnet).to.equal(governanceContract_localhost);
        expect(maintenance_mainnet).to.equal(maintenance_localhost);
        expect(stakingReward_mainnet).to.equal(stakingReward_localhost);
        // expect(feeCollector_mainnet).to.equal("0x" + "0".repeat(40));
        // expect(feeCollector_localhost).to.equal("0x3d1f1b5122C9cBC1E6BA5361b246562C5e227e86");

    });


});