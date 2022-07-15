// const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
// const  hre  = require('hardhat');// require('openzeppelin-solidity/test/helpers/ether');

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { should } = require("chai").should();

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
const nodeName = ["Meta001", "Meta002"];
const enode = [
    // eslint-disable-next-line max-len
    "0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0",
    // eslint-disable-next-line max-len
    "0x777777777711c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0",
];
const ip = ["127.0.0.1", "127.0.0.2"];
const port = [8542, 8542];
const memo = ["memo1", "memo2"];
const envName = "key";
const envVal = "value";

const envParams = {
    blocksPer: 1,
    ballotDurationMin: 86400,
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

describe("Governance", function () {
    let deployer, govMem1, govMem2, govMem3, govMem4, govMem5, user1;
    let registry, staking, ballotStorage, govImp, gov, govDelegator, envStorage, envStorageImp, envDelegator;

    beforeEach("deploy", async () => {
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
        // console.log("start")
        let Registry = await hre.ethers.getContractFactory("Registry");

        // console.log("registry deploy")
        registry = await Registry.deploy();
        let EnvStorageImp = await hre.ethers.getContractFactory("EnvStorageImp");
        // console.log("env imp deploy")
        envStorageImp = await EnvStorageImp.deploy(); //await EnvStorageImp.new();
        let EnvStorage = await hre.ethers.getContractFactory("EnvStorage");
        // console.log("env deploy")
        envStorage = await EnvStorage.deploy(envStorageImp.address);
        // envStorage = await EnvStorage.new(registry.address, envStorageImp.address);
        let BallotStorage = await hre.ethers.getContractFactory("BallotStorage");
        // console.log("ballot deploy")
        ballotStorage = await BallotStorage.deploy(registry.address); //await BallotStorage.new(registry.address);
        let Staking = await hre.ethers.getContractFactory("Staking");
        // console.log("staking deploy")
        staking = await Staking.deploy(registry.address, "0x"); //await Staking.new(registry.address,"");
        let GovImp = await hre.ethers.getContractFactory("GovImp");
        // console.log("govImp deploy")
        govImp = await GovImp.deploy();
        let Gov = await hre.ethers.getContractFactory("Gov");
        // console.log("gov deploy")
        gov = await Gov.deploy(govImp.address);

        // console.log("set contracts in registry")
        await registry.setContractDomain(B322S("EnvStorage"), envStorage.address);
        await registry.setContractDomain(B322S("BallotStorage"), ballotStorage.address);
        await registry.setContractDomain(B322S("Staking"), staking.address);
        await registry.setContractDomain(B322S("GovernanceContract"), gov.address);

        // Initialize environment storage
        envDelegator = await hre.ethers.getContractAt("EnvStorageImp", envStorage.address); //EnvStorageImp.at(envStorage.address);

        const envNames = Object.keys(envParams);
        let envNamesBytes = [];
        for (let i = 0; i < envNames.length; i++) {
            envNamesBytes.push(ethers.utils.keccak256(U2B(envNames[i])));
        }
        const envVariables = Object.values(envParams);
        // console.log("init env")
        await envDelegator.initialize(registry.address, envNamesBytes, envVariables);

        // Initialize for staking
        await staking.connect(deployer).deposit({ value: amount });

        govDelegator = await hre.ethers.getContractAt("GovImp", gov.address); //await GovImp.at(govDelegator.address);
        // Initialize governance
        // console.log("init gov")
        await govDelegator.init(registry.address, amount, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0]);
        let data = await govDelegator.getNode(1);
    });

    describe("Min = Max", function () {
        it("cannot add proposal when stake min is bigger", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[0]),
                enode[0],
                U2B(ip[0]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let ballotLen = await govDelegator.ballotLength();
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newStaker = await govDelegator.getMember(2);
            let newVoter = await govDelegator.getVoter(2);
            let newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(govMem1.address);
            newReward.should.be.equal(govMem1.address);


            let newStakingMin = BigNumber.from("2000000"+"0".repeat(18))
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("stakingMinMax")),
                envTypes.Uint,
                type2Bytes(["uint256", "uint256"], [newStakingMin,newStakingMin]),
                U2B(memo[0]),
                duration
            );
            ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let result = await envDelegator.getStakingMinMax();
            result[0].should.be.equal(BigNumber.from("2000000"+"0".repeat(18)));
            result[1].should.be.equal(BigNumber.from("2000000"+"0".repeat(18)));


            await expect(govDelegator.addProposalToChangeMember(
                [deployer.address, voter0.address, deployer.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], newStakingMin, U2B(memo[0]), duration],
                deployer.address
            )).to.be.revertedWith('Invalid staking balance');

        });
        it("can add proposal when staking value is updated", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[0]),
                enode[0],
                U2B(ip[0]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let ballotLen = await govDelegator.ballotLength();
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newStaker = await govDelegator.getMember(2);
            let newVoter = await govDelegator.getVoter(2);
            let newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(govMem1.address);
            newReward.should.be.equal(govMem1.address);


            let newStakingMin = BigNumber.from("2000000"+"0".repeat(18))
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("stakingMinMax")),
                envTypes.Uint,
                type2Bytes(["uint256", "uint256"], [newStakingMin,newStakingMin]),
                U2B(memo[0]),
                duration
            );
            ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let result = await envDelegator.getStakingMinMax();
            result[0].should.be.equal(newStakingMin);
            result[1].should.be.equal(newStakingMin);

            let lockedValue = await staking.lockedBalanceOf(deployer.address);
            lockedValue.should.be.equal(amount);
            await staking.connect(deployer).deposit({ value: (newStakingMin.sub(amount)) });
            lockedValue = await staking.lockedBalanceOf(deployer.address);
            lockedValue.should.be.equal(newStakingMin);

            await govDelegator.addProposalToChangeMember(
                [deployer.address, voter0.address, deployer.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], newStakingMin, U2B(memo[0]), duration],
                deployer.address
            );
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            ballotLen = await govDelegator.ballotLength();
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            newStaker = await govDelegator.getMember(1);
            newVoter = await govDelegator.getVoter(1);
            newReward = await govDelegator.getReward(1);

            newStaker.should.be.equal(deployer.address);
            newVoter.should.be.equal(voter0.address);
            newReward.should.be.equal(deployer.address);

        });
        it("can add proposal when staking value is updated with deposit", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount.mul(BigNumber.from(2)) });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[0]),
                enode[0],
                U2B(ip[0]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let ballotLen = await govDelegator.ballotLength();
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newStaker = await govDelegator.getMember(2);
            let newVoter = await govDelegator.getVoter(2);
            let newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(govMem1.address);
            newReward.should.be.equal(govMem1.address);


            let newStakingMin = BigNumber.from("2000000"+"0".repeat(18))
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("stakingMinMax")),
                envTypes.Uint,
                type2Bytes(["uint256", "uint256"], [newStakingMin,newStakingMin]),
                U2B(memo[0]),
                duration
            );
            ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let result = await envDelegator.getStakingMinMax();
            result[0].should.be.equal(newStakingMin);
            result[1].should.be.equal(newStakingMin);

            let lockedValue = await staking.lockedBalanceOf(govMem1.address);
            lockedValue.should.be.equal(amount);
            await staking.connect(govMem1).deposit({value:1});
            lockedValue = await staking.lockedBalanceOf(govMem1.address);
            lockedValue.should.be.equal(newStakingMin);

            await govDelegator.connect(govMem1).addProposalToChangeMember(
                [govMem1.address, voter1.address, govMem1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], newStakingMin, U2B(memo[0]), duration],
                govMem1.address
            );
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            ballotLen = await govDelegator.ballotLength();
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            newStaker = await govDelegator.getMember(2);
            newVoter = await govDelegator.getVoter(2);
            newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(voter1.address);
            newReward.should.be.equal(govMem1.address);

        });
        it("can add proposal when staking value is updated with lockMore", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount.mul(BigNumber.from(2)) });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[0]),
                enode[0],
                U2B(ip[0]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let ballotLen = await govDelegator.ballotLength();
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newStaker = await govDelegator.getMember(2);
            let newVoter = await govDelegator.getVoter(2);
            let newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(govMem1.address);
            newReward.should.be.equal(govMem1.address);


            let newStakingMin = BigNumber.from("2000000"+"0".repeat(18))
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("stakingMinMax")),
                envTypes.Uint,
                type2Bytes(["uint256", "uint256"], [newStakingMin,newStakingMin]),
                U2B(memo[0]),
                duration
            );
            ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let result = await envDelegator.getStakingMinMax();
            result[0].should.be.equal(newStakingMin);
            result[1].should.be.equal(newStakingMin);

            let lockedValue = await staking.lockedBalanceOf(govMem1.address);
            lockedValue.should.be.equal(amount);
            await staking.connect(govMem1).lockMore(govMem1.address, newStakingMin.sub(amount));
            lockedValue = await staking.lockedBalanceOf(govMem1.address);
            lockedValue.should.be.equal(newStakingMin);

            await govDelegator.connect(govMem1).addProposalToChangeMember(
                [govMem1.address, voter1.address, govMem1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], newStakingMin, U2B(memo[0]), duration],
                govMem1.address
            );
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            ballotLen = await govDelegator.ballotLength();
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            newStaker = await govDelegator.getMember(2);
            newVoter = await govDelegator.getVoter(2);
            newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(voter1.address);
            newReward.should.be.equal(govMem1.address);

        });
        

        it("cannot add proposal when stake max is lower", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[0]),
                enode[0],
                U2B(ip[0]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let ballotLen = await govDelegator.ballotLength();
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newStaker = await govDelegator.getMember(2);
            let newVoter = await govDelegator.getVoter(2);
            let newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(govMem1.address);
            newReward.should.be.equal(govMem1.address);


            let newStakingMax = BigNumber.from("1000000"+"0".repeat(18))
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("stakingMinMax")),
                envTypes.Uint,
                type2Bytes(["uint256", "uint256"], [newStakingMax,newStakingMax]),
                U2B(memo[0]),
                duration
            );
            ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let result = await envDelegator.getStakingMinMax();
            result[0].should.be.equal(newStakingMax);
            result[1].should.be.equal(newStakingMax);


            await expect(govDelegator.addProposalToChangeMember(
                [deployer.address, voter0.address, deployer.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], newStakingMax, U2B(memo[0]), duration],
                deployer.address
            )).to.be.revertedWith('Invalid staking balance');

        });
        it("can add proposal when max staking value is updated", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[0]),
                enode[0],
                U2B(ip[0]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let ballotLen = await govDelegator.ballotLength();
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newStaker = await govDelegator.getMember(2);
            let newVoter = await govDelegator.getVoter(2);
            let newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(govMem1.address);
            newReward.should.be.equal(govMem1.address);


            let newStakingMax = BigNumber.from("1000000"+"0".repeat(18))
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("stakingMinMax")),
                envTypes.Uint,
                type2Bytes(["uint256", "uint256"], [newStakingMax,newStakingMax]),
                U2B(memo[0]),
                duration
            );
            ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let result = await envDelegator.getStakingMinMax();
            result[0].should.be.equal(newStakingMax);
            result[1].should.be.equal(newStakingMax);


            let lockedValue = await staking.lockedBalanceOf(deployer.address);
            lockedValue.should.be.equal(amount);
            let balance = await ethers.provider.getBalance(deployer.address)
            await staking.connect(deployer).withdraw( amount.sub(newStakingMax));
            let newbalance = await ethers.provider.getBalance(deployer.address)
            // console.log("new ",newbalance, "old ",balance,"diff ",(newbalance.sub(balance)))
            lockedValue = await staking.lockedBalanceOf(deployer.address);
            lockedValue.should.be.equal(newStakingMax);


            await govDelegator.addProposalToChangeMember(
                [deployer.address, voter0.address, deployer.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], newStakingMax, U2B(memo[0]), duration],
                deployer.address
            );
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            ballotLen = await govDelegator.ballotLength();
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            newStaker = await govDelegator.getMember(1);
            newVoter = await govDelegator.getVoter(1);
            newReward = await govDelegator.getReward(1);

            newStaker.should.be.equal(deployer.address);
            newVoter.should.be.equal(voter0.address);
            newReward.should.be.equal(deployer.address);

        });

    });

    describe("Min != Max", function () {
        it("cannot add proposal when stake min is bigger", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[0]),
                enode[0],
                U2B(ip[0]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let ballotLen = await govDelegator.ballotLength();
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newStaker = await govDelegator.getMember(2);
            let newVoter = await govDelegator.getVoter(2);
            let newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(govMem1.address);
            newReward.should.be.equal(govMem1.address);

            let newStakingMin = BigNumber.from("2000000"+"0".repeat(18))
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("stakingMinMax")),
                envTypes.Uint,
                type2Bytes(["uint256", "uint256"], [newStakingMin,newStakingMin]),
                U2B(memo[0]),
                duration
            );
            ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let result = await envDelegator.getStakingMinMax();
            result[0].should.be.equal(BigNumber.from("2000000"+"0".repeat(18)));
            result[1].should.be.equal(BigNumber.from("2000000"+"0".repeat(18)));


            await expect(govDelegator.addProposalToChangeMember(
                [deployer.address, voter0.address, deployer.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], newStakingMin, U2B(memo[0]), duration],
                deployer.address
            )).to.be.revertedWith('Invalid staking balance');

        });
        it("can add proposal when staking value is updated", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[0]),
                enode[0],
                U2B(ip[0]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let ballotLen = await govDelegator.ballotLength();
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newStaker = await govDelegator.getMember(2);
            let newVoter = await govDelegator.getVoter(2);
            let newReward = await govDelegator.getReward(2);

            newStaker.should.be.equal(govMem1.address);
            newVoter.should.be.equal(govMem1.address);
            newReward.should.be.equal(govMem1.address);


            let newStakingMin = BigNumber.from("2000000"+"0".repeat(18))
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("stakingMinMax")),
                envTypes.Uint,
                type2Bytes(["uint256", "uint256"], [newStakingMin,newStakingMin]),
                U2B(memo[0]),
                duration
            );
            ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(ballotLen, true);
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let result = await envDelegator.getStakingMinMax();
            result[0].should.be.equal(newStakingMin);
            result[1].should.be.equal(newStakingMin);

            let lockedValue = await staking.lockedBalanceOf(deployer.address);
            lockedValue.should.be.equal(amount);
            await staking.connect(deployer).deposit({ value: (newStakingMin.sub(amount)) });
            lockedValue = await staking.lockedBalanceOf(deployer.address);
            lockedValue.should.be.equal(newStakingMin);

            await govDelegator.addProposalToChangeMember(
                [deployer.address, voter0.address, deployer.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], newStakingMin, U2B(memo[0]), duration],
                deployer.address
            );
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            ballotLen = await govDelegator.ballotLength();
            state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            newStaker = await govDelegator.getMember(1);
            newVoter = await govDelegator.getVoter(1);
            newReward = await govDelegator.getReward(1);

            newStaker.should.be.equal(deployer.address);
            newVoter.should.be.equal(voter0.address);
            newReward.should.be.equal(deployer.address);

        });
        
    });
});

function type2Bytes(types, inputs) {
    const ABICoder = ethers.utils.AbiCoder;
    const abiCoder = new ABICoder();

    let parameters = abiCoder.encode(types, inputs);
    return parameters;
}
