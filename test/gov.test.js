// const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
// const  hre  = require('hardhat');// require('openzeppelin-solidity/test/helpers/ether');

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
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

describe("Governance", function () {
    let deployer, govMem1, govMem2, govMem3, govMem4, govMem5, user1;
    let registry, staking, stakingImp, ballotStorage, govImp, gov, govDelegator, envStorage, envStorageImp, envDelegator;

    async function deployGov(){
        let deployer, govMem1, govMem2, govMem3, govMem4, govMem5, user1;
        let registry, staking, stakingImp, ballotStorage, govImp, gov, govDelegator, envStorage, envStorageImp, envDelegator;
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
        let StakingImp = await hre.ethers.getContractFactory("StakingImp");
        stakingImp = await StakingImp.deploy();
        let Staking = await hre.ethers.getContractFactory("Staking");
        // console.log("staking deploy")
        staking = await Staking.deploy(stakingImp.address); //await Staking.new(registry.address,"");
        staking = await hre.ethers.getContractAt("StakingImp", staking.address, deployer);
        await staking.init(registry.address, "0x");

        let GovImp = await hre.ethers.getContractFactory("GovImp");
        // console.log("govImp deploy")
        govImp = await GovImp.deploy();
        let Gov = await hre.ethers.getContractFactory("Gov");
        // console.log("gov deploy")
        gov = await Gov.deploy(govImp.address);

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
        // await staking.connect(deployer).deposit({ value: amount });
        await staking.connect(deployer).deposit({ value: amount });

        govDelegator = await hre.ethers.getContractAt("GovImp", gov.address); //await GovImp.at(govDelegator.address);
        // Initialize governance
        // console.log("init gov")
        const configJson = require('../deploy_config_local_solo.json')
        const initData = getInitialGovernanceMembersAndNodes(configJson, ethers)
        // await govDelegator.init(registry.address, amount, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0]);
        await govDelegator.initOnce(registry.address, amount, initData.nodes)
        return {deployer, govMem1, govMem2, govMem3, voter0, voter1, staker2, staker3, user1, registry, staking, stakingImp, ballotStorage, govImp, gov, govDelegator, envStorage, envStorageImp, envDelegator}
    }

    beforeEach("deploy", async () => {
        const output = await loadFixture(deployGov);
        deployer = output.deployer;
        govMem1 = output.govMem1;
        govMem2 = output.govMem2;
        govMem3 = output.govMem3;
        voter0 = output.voter0;
        voter1 = output.voter1;
        staker2 = output.staker2;
        staker3 = output.staker3;
        user1 = output.user1;
        registry = output.registry;
        staking = output.staking;
        stakingImp = output.stakingImp;
        ballotStorage = output.ballotStorage;
        govImp = output.govImp;
        gov = output.gov;
        envStorage = output.envStorage;
        envStorageImp = output.envStorageImp;
        envDelegator = output.envDelegator;
        govDelegator = output.govDelegator;
    });

    // For short check
    describe("Contract creation ", function () {
        it("consume for govImp", async () => {
            let GovImp = await hre.ethers.getContractFactory("GovImp");
            let newGovImp = await GovImp.deploy();
            await newGovImp.deployed();
        });
        it("consume for envStorageImp", async () => {
            let EnvStorageImp = await hre.ethers.getContractFactory("EnvStorageImp");
            let newEnvStorageImp = await EnvStorageImp.deploy();
            await newEnvStorageImp.deployed();
        });
        it("consume for ballotStorage", async () => {
            let BallotStorage = await hre.ethers.getContractFactory("BallotStorage");
            let newBallotStorage = await BallotStorage.deploy(registry.address);
            await newBallotStorage.deployed();
        });
    });

    describe("Staker is voter", function () {
        it("has enode and locked staking", async () => {
            const locked = await staking.lockedBalanceOf(deployer.address);
            locked.eq(BigNumber.from(amount));
            const idx = await govDelegator.getNodeIdxFromMember(deployer.address);
            expect(idx).to.not.equal(0);
            const [nName, nEnode, nIp, nPort] = await govDelegator.getNode(idx);
            U2S(nName).should.equal(nodeName[0]);
            nEnode.should.equal(enode[0]);
            U2S(nIp).should.equal(ip[0]);
            expect(nPort).be.equal(BigNumber.from(port[0]));
        });

        it("cannot init twice", async () => {
            await expect(govDelegator.init(registry.address, amount, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0])).to.be.revertedWith(
                "Initializable: contract is already initialized"
            );
        });

        it("cannot addProposal to add member self", async () => {
            await expect(
                govDelegator.addProposalToAddMember([
                    deployer.address,
                    deployer.address,
                    deployer.address,
                    U2B(nodeName[0]),
                    enode[0],
                    U2B(ip[0]),
                    port[0],
                    amount,
                    U2B(memo[0]),
                    duration,
                ])
            ).to.be.revertedWith("Already member");
        });

        it("cannot addProposal to add member with different voter", async () => {
            await expect(
                govDelegator.addProposalToAddMember([
                    deployer.address,
                    voter0.address,
                    deployer.address,
                    U2B(nodeName[0]),
                    enode[0],
                    U2B(ip[0]),
                    port[0],
                    amount,
                    U2B(memo[0]),
                    duration,
                ])
            ).to.be.revertedWith("Already member");
        });

        it("cannot addProposal to add member with different reward", async () => {
            await expect(
                govDelegator.addProposalToAddMember([
                    deployer.address,
                    deployer.address,
                    user1.address,
                    U2B(nodeName[0]),
                    enode[0],
                    U2B(ip[0]),
                    port[0],
                    amount,
                    U2B(memo[0]),
                    duration,
                ])
            ).to.be.revertedWith("Already member");
        });
        

        it("can addProposal to add member", async () => {
            // staking first
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            const len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(1));
            const ballot = await ballotStorage.getBallotBasic(len);
            const ballotDetail = await ballotStorage.getBallotMember(len);
            ballot[3].should.be.equal(deployer.address);
            U2S(ballot[4]).should.be.equal(memo[0]);
            ballotDetail[1].should.be.equal(govMem1.address);

            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[1]),
                duration,
            ]);
            const len2 = await govDelegator.ballotLength();
            len2.should.be.equal(BigNumber.from(2));
        });

        it("cannot addProposal to remove non-member", async () => {
            // staking first
            // await staking.connect(govMem1).deposit({ value: amount});
            await expect(govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration)).to.be.revertedWith("Non-member");
        });

        it("cannot addProposal to remove a sole member", async () => {
            await expect(govDelegator.addProposalToRemoveMember(deployer.address, amount, U2B(memo[0]), duration)).to.be.revertedWith(
                "Cannot remove a sole member"
            );
        });

        // it('can addProposal to change member', async () => {
        //   await staking.connect(govMem1).deposit({value: amount});

        //   let oldMember = await govDelegator.getMember(1);
        //   oldMember.should.be.equal(deployer.address);
        //   let oldVoter = await govDelegator.getVoter(1);
        //   oldVoter.should.be.equal(deployer.address);
        //   await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
        //   const len = await govDelegator.ballotLength();
        //   len.should.be.equal(BigNumber.from(1));

        //   let newMember = await govDelegator.getMember(1);
        //   newMember.should.be.equal(govMem1.address);
        //   let newVoter = await govDelegator.getVoter(1);
        //   newVoter.should.be.equal(govMem1.address);
        //   let newReward = await govDelegator.getReward(1);
        //   newReward.should.be.equal(govMem1.address);
        // });

        it(`can addProposal to change member's other addresses self without voting`, async () => {
            let oldMember = await govDelegator.getMember(1);
            oldMember.should.be.equal(deployer.address);
            let oldVoter = await govDelegator.getVoter(1);
            oldVoter.should.be.equal(deployer.address);
            let oldReward = await govDelegator.getVoter(1);
            oldReward.should.be.equal(deployer.address);
            // console.log(result);
            await govDelegator.addProposalToChangeMember(
                [deployer.address, voter1.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            const len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(1));

            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(voter1.address);
            let newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(user1.address);
        });

        it(`can addProposal to change member's other addresses self without voting twice about node name`, async () => {
            let oldMember = await govDelegator.getMember(1);
            oldMember.should.be.equal(deployer.address);
            let oldVoter = await govDelegator.getVoter(1);
            oldVoter.should.be.equal(deployer.address);
            let oldReward = await govDelegator.getVoter(1);
            oldReward.should.be.equal(deployer.address);
            // console.log(result);
            await govDelegator.addProposalToChangeMember(
                [deployer.address, deployer.address, deployer.address, U2B(nodeName[1]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            let len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(1));

            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(deployer.address);
            let newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(deployer.address);


            await govDelegator.addProposalToChangeMember(
                [deployer.address, deployer.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));

            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(deployer.address);
            newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(deployer.address);
        });

        it(`can addProposal to change member's other addresses self without voting twice about enode`, async () => {
            let oldMember = await govDelegator.getMember(1);
            oldMember.should.be.equal(deployer.address);
            let oldVoter = await govDelegator.getVoter(1);
            oldVoter.should.be.equal(deployer.address);
            let oldReward = await govDelegator.getVoter(1);
            oldReward.should.be.equal(deployer.address);
            // console.log(result);
            await govDelegator.addProposalToChangeMember(
                [deployer.address, deployer.address, deployer.address, U2B(nodeName[0]), enode[1], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            let len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(1));

            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(deployer.address);
            let newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(deployer.address);


            await govDelegator.addProposalToChangeMember(
                [deployer.address, deployer.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));

            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(deployer.address);
            newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(deployer.address);
        });

        it(`can addProposal to change member's other addresses self without voting twice about ipport`, async () => {
            let oldMember = await govDelegator.getMember(1);
            oldMember.should.be.equal(deployer.address);
            let oldVoter = await govDelegator.getVoter(1);
            oldVoter.should.be.equal(deployer.address);
            let oldReward = await govDelegator.getVoter(1);
            oldReward.should.be.equal(deployer.address);
            // console.log(result);
            await govDelegator.addProposalToChangeMember(
                [deployer.address, deployer.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[1]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            let len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(1));

            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(deployer.address);
            let newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(deployer.address);


            await govDelegator.addProposalToChangeMember(
                [deployer.address, deployer.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));

            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(deployer.address);
            newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(deployer.address);
        });

        it(`can addProposal to change member's other addresses self without voting twice about import2`, async () => {
            let oldMember = await govDelegator.getMember(1);
            oldMember.should.be.equal(deployer.address);
            let oldVoter = await govDelegator.getVoter(1);
            oldVoter.should.be.equal(deployer.address);
            let oldReward = await govDelegator.getVoter(1);
            oldReward.should.be.equal(deployer.address);
            // console.log(result);
            await govDelegator.addProposalToChangeMember(
                [deployer.address, deployer.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[1], amount, U2B(memo[0]), duration],
                deployer.address
            );
            let len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(1));

            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(deployer.address);
            let newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(deployer.address);


            await govDelegator.addProposalToChangeMember(
                [deployer.address, deployer.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));

            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(deployer.address);
            newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(deployer.address);
        });

        // it('can addProposal to change staker with voting', async () => {
        //   await staking.connect(govMem1).deposit({value:amount});

        //   let oldMember = await govDelegator.getMember(1);
        //   oldMember.should.be.equal(deployer.address);
        //   let oldVoter = await govDelegator.getVoter(1);
        //   oldVoter.should.be.equal(voter0.address);
        //   // console.log(result);
        //   await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
        //   const len = await govDelegator.ballotLength();
        //   len.should.be.equal(BigNumber.from(1));

        //   let newMember = await govDelegator.getMember(1);
        //   newMember.should.be.equal(deployer.address);
        //   let newVoter = await govDelegator.getVoter(1);
        //   newVoter.should.be.equal(voter1.address);
        // });

        it("cannot addProposal to change non-member", async () => {
            // eslint-disable-next-line max-len
            await expect(
                govDelegator.addProposalToChangeMember(
                    [govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                    govMem2.address
                )
            ).to.be.revertedWith("Non-member");
        });

        it("can addProposal to change governance", async () => {
            let GovImp = await hre.ethers.getContractFactory("GovImp");
            let newGovImp = await GovImp.deploy();
            await govDelegator.addProposalToChangeGov(newGovImp.address, U2B(memo[0]), duration);
            const len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(1));
        });

        it("can not addProposal to change governance using EOA", async () => {
            await expect(govDelegator.addProposalToChangeGov(govMem1.address, U2B(memo[0]), duration)).to.be.revertedWith(
                "function call to a non-contract account"
            );
        });

        it("can not addProposal to change governance using non-UUPS", async () => {
            await expect(govDelegator.addProposalToChangeGov(registry.address, U2B(memo[0]), duration)).to.be.revertedWith(
                "ERC1967Upgrade: new implementation is not UUPS"
            );
        });

        it("cannot addProposal to change governance with same address", async () => {
            await expect(govDelegator.addProposalToChangeGov(govImp.address, U2B(memo[0]), duration)).to.be.revertedWith("Same contract address");
        });

        it("cannot addProposal to change governance with zero address", async () => {
            await expect(govDelegator.addProposalToChangeGov("0x" + "0".repeat(40), U2B(memo[0]), duration)).to.be.revertedWith(
                "Implementation cannot be zero"
            );
        });

        it("can addProposal to change environment", async () => {
            await govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Bytes32, U2B(envVal), U2B(memo[0]), duration);
            const len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(1));
        });

        it("cannot addProposal to change environment with wrong type", async () => {
            await expect(govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Invalid, U2B(envVal), U2B(memo[0]), duration)).to.be.revertedWith(
                "Invalid type"
            );
        });

        it("can vote approval to add member", async () => {
            //govMem1 signer
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(1);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);
            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(2));
            const nodeLen = await govDelegator.getNodeLength();
            nodeLen.should.be.equal(BigNumber.from(memberLen));
            const lock = await staking.lockedBalanceOf(govMem1.address);
            lock.should.be.equal(BigNumber.from(amount));

            let newMember = await govDelegator.getMember(memberLen);
            newMember.should.be.equal(govMem1.address);
            let newVoter = await govDelegator.getVoter(memberLen);
            newVoter.should.be.equal(govMem1.address);
            let newReward = await govDelegator.getReward(memberLen);
            newReward.should.be.equal(govMem1.address);
        });

        it("cannot vote approval to add member with insufficient staking", async () => {
            await staking.connect(govMem1).deposit({ value: amount.sub(BigNumber.from("10000000000000")) });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            //스테이킹 량 부족시 투표는 종료되며 결과가 reject로 표시
            await govDelegator.vote(1, true); //.to.be.revertedWith('invalid address');
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(1);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
        });

        it("can vote disapproval to deny adding member", async () => {
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, false);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
        });

        it("can vote approval to change member totally", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
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
            let state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);
            //govMem1 signer
            await staking.connect(govMem2).deposit({ value: amount });
            const preDeployerAvail = await staking.availableBalanceOf(govMem1.address);
            const preGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
            await govDelegator.addProposalToChangeMember(
                [govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[1]), duration],
                govMem1.address
            );
            await govDelegator.vote(2, true);
            await govDelegator.connect(govMem1).vote(2, true);
            //voteLength = 현재까지 vote()함수가 불린 함수
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(2));
            const memberAddr = await govDelegator.getMember(2);
            memberAddr.should.equal(govMem2.address);
            const [nName, nEnode, nIp, nPort] = await govDelegator.getNode(2);
            U2S(nName).should.equal(nodeName[1]);
            nEnode.should.equal(enode[1]);
            U2S(nIp).should.equal(ip[1]);
            nPort.should.be.equal(BigNumber.from(port[1]));
            const nodeIdxFromDeployer = await govDelegator.getNodeIdxFromMember(govMem1.address);
            nodeIdxFromDeployer.should.be.equal(BigNumber.from(0));
            const nodeIdxFromGovMem1 = await govDelegator.getNodeIdxFromMember(govMem2.address);
            nodeIdxFromGovMem1.should.be.equal(BigNumber.from(2));

            const postDeployerAvail = await staking.availableBalanceOf(govMem1.address);
            const postGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
            postDeployerAvail.sub(preDeployerAvail).should.be.equal(BigNumber.from(amount));
            preGovmem1Avail.sub(postGovmem1Avail).should.be.equal(BigNumber.from(amount));
        });

        it("can vote approval to change member totally", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
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
            let state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);
            //govMem1 signer
            await staking.connect(govMem2).deposit({ value: amount });
            const preDeployerAvail = await staking.availableBalanceOf(govMem1.address);
            const preGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
            await govDelegator.addProposalToChangeMember(
                [govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[1]), duration],
                govMem1.address
            );
            await govDelegator.vote(2, true);
            await govDelegator.connect(govMem1).vote(2, true);
            //voteLength = 현재까지 vote()함수가 불린 함수
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(2));
            const memberAddr = await govDelegator.getMember(2);
            memberAddr.should.equal(govMem2.address);
            const [nName, nEnode, nIp, nPort] = await govDelegator.getNode(2);
            U2S(nName).should.equal(nodeName[1]);
            nEnode.should.equal(enode[1]);
            U2S(nIp).should.equal(ip[1]);
            nPort.should.be.equal(BigNumber.from(port[1]));
            const nodeIdxFromDeployer = await govDelegator.getNodeIdxFromMember(govMem1.address);
            nodeIdxFromDeployer.should.be.equal(BigNumber.from(0));
            const nodeIdxFromGovMem1 = await govDelegator.getNodeIdxFromMember(govMem2.address);
            nodeIdxFromGovMem1.should.be.equal(BigNumber.from(2));

            const postDeployerAvail = await staking.availableBalanceOf(govMem1.address);
            const postGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
            postDeployerAvail.sub(preDeployerAvail).should.be.equal(BigNumber.from(amount));
            preGovmem1Avail.sub(postGovmem1Avail).should.be.equal(BigNumber.from(amount));
        });
        

        it("can vote approval to change enode only without voting", async () => {
            await govDelegator.addProposalToChangeMember(
                [deployer.address, deployer.address, user1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration],
                deployer.address
            );
            // await govDelegator.vote(1, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(0));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(1);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
            const memberAddr = await govDelegator.getMember(1);
            memberAddr.should.equal(deployer.address);
            const [nName, nEnode, nIp, nPort] = await govDelegator.getNode(1);
            U2S(nName).should.equal(nodeName[1]);
            nEnode.should.equal(enode[1]);
            U2S(nIp).should.equal(ip[1]);
            nPort.should.be.equal(BigNumber.from(port[1]));
        });

        it("cannot vote approval to change member with insufficient staking", async () => {
            await staking.connect(govMem1).deposit({ value: amount.sub(BigNumber.from("1000000000")) });
            await govDelegator.addProposalToChangeMember(
                [govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration],
                deployer.address
            );
            await govDelegator.vote(1, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(1);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
        });

        it("can vote approval to change governance", async () => {
            let result = await envDelegator.getGasLimitAndBaseFee();
            let MBF = await envDelegator.getMaxBaseFee();

            //deploy new imp
            const GovImp = await ethers.getContractFactory("GovImp");
            console.log("deploy new imp");
            const newGovImp = await GovImp.deploy();
            console.log("propose new imp");
            await govDelegator.addProposalToChangeGov(newGovImp.address, U2B(memo[0]), duration);
            await govDelegator.vote(1, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(1);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            const imp = await gov.implementation();
            imp.should.equal(newGovImp.address);

            newResult = await envDelegator.getGasLimitAndBaseFee();
            result[0].should.be.equal(newResult[0]);
            result[1].should.be.equal(newResult[1]);
            result[2].should.be.equal(newResult[2]);
            newMBF = await envDelegator.getMaxBaseFee();
            newMBF.should.be.equal(MBF);
        });

        it("can vote approval to change environment", async () => {
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("blocksPer")),
                envTypes.Uint,
                "0x0000000000000000000000000000000000000000000000000000000000000064",
                U2B(memo[0]),
                duration
            );
            await govDelegator.vote(1, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(1);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            const blocksPer = await envDelegator.getBlocksPer();
            blocksPer.should.be.equal(BigNumber.from(100));
        });

        it("cannot vote for a ballot already done", async () => {
            //govMem1 signer
            // let signer1 = (await ethers.getSigners())[1];
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
            await expect(govDelegator.vote(1, true)).to.be.revertedWith("Expired");
        });

        it("cannot add proposal durring period time", async () => {
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("blocksPer")),
                envTypes.Uint,
                "0x0000000000000000000000000000000000000000000000000000000000000064",
                U2B(memo[0]),
                duration
            );
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("blocksPer")),
                envTypes.Uint,
                "0x0000000000000000000000000000000000000000000000000000000000000064",
                U2B(memo[0]),
                duration
            );
            await govDelegator.setProposalTimePeriod(60);
            await expect(
                govDelegator.addProposalToChangeEnv(
                    ethers.utils.keccak256(U2B("blocksPer")),
                    envTypes.Uint,
                    "0x0000000000000000000000000000000000000000000000000000000000000064",
                    U2B(memo[0]),
                    duration
                )
            ).to.be.revertedWith("Cannot add proposal too early");
        });



        it(`cannot addProposal to add member which is already reward`, async () => {
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            // console.log(result);
            console.log(await govDelegator.ballotLength())
            let memberLen = await govDelegator.getMemberLength();
            await govDelegator
                .connect(deployer)
                .addProposalToChangeMember(
                    [deployer.address, deployer.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                    deployer.address
                );
            console.log(await govDelegator.ballotLength())
            govDelegator = govDelegator.connect(deployer);

            let newMember = await govDelegator.getMember(memberLen);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(memberLen);
            newVoter.should.be.equal(deployer.address);
            let newReward = await govDelegator.getReward(memberLen);
            newReward.should.be.equal(govMem1.address);

            await govDelegator.vote(1, true);

            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(1);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
            memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
            const nodeLen = await govDelegator.getNodeLength();
            nodeLen.should.be.equal(BigNumber.from(memberLen));
            const lock = await staking.lockedBalanceOf(govMem1.address);
            lock.should.be.equal(BigNumber.from(0));
            const bal = await staking.balanceOf(govMem1.address);
            bal.should.be.equal(BigNumber.from(amount));
        });

        it(`cannot addProposal to change member which is already reward`, async () => {
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToChangeMember(
                [govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            let memberLen = await govDelegator.getMemberLength();
            await govDelegator
                .connect(deployer)
                .addProposalToChangeMember(
                    [deployer.address, deployer.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                    deployer.address
                );
            govDelegator = govDelegator.connect(deployer);

            let newMember = await govDelegator.getMember(memberLen);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(memberLen);
            newVoter.should.be.equal(deployer.address);
            let newReward = await govDelegator.getReward(memberLen);
            newReward.should.be.equal(govMem1.address);

            await govDelegator.vote(1, true);

            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(1);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
            memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
            const nodeLen = await govDelegator.getNodeLength();
            nodeLen.should.be.equal(BigNumber.from(memberLen));
            const lock = await staking.lockedBalanceOf(govMem1.address);
            lock.should.be.equal(BigNumber.from(0));
            const bal = await staking.balanceOf(govMem1.address);
            bal.should.be.equal(BigNumber.from(amount));
        });
    });

    describe("Staker is not a voter", function () {
        beforeEach(async () => {
            //govMem1 signer
            await govDelegator.addProposalToChangeMember(
                [deployer.address, voter0.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            govDelegator = await govDelegator.connect(voter0);
        });

        it("cannot addProposal to add member self", async () => {
            await expect(
                govDelegator.addProposalToAddMember([
                    deployer.address,
                    deployer.address,
                    deployer.address,
                    U2B(nodeName[0]),
                    enode[0],
                    U2B(ip[0]),
                    port[0],
                    amount,
                    U2B(memo[0]),
                    duration,
                ])
            ).to.be.revertedWith("Already member");
        });

        it("cannot addProposal to add member with different voter", async () => {
            await expect(
                govDelegator.addProposalToAddMember([
                    deployer.address,
                    voter0.address,
                    deployer.address,
                    U2B(nodeName[0]),
                    enode[0],
                    U2B(ip[0]),
                    port[0],
                    amount,
                    U2B(memo[0]),
                    duration,
                ])
            ).to.be.revertedWith("Already member");
        });

        it("cannot addProposal to add member with same voter", async () => {
            await expect(
                govDelegator.addProposalToAddMember([
                    voter0.address,
                    voter0.address,
                    voter0.address,
                    U2B(nodeName[0]),
                    enode[0],
                    U2B(ip[0]),
                    port[0],
                    amount,
                    U2B(memo[0]),
                    duration,
                ])
            ).to.be.revertedWith("Already member");
        });

        it("cannot addProposal to add member with same reward", async () => {
            await expect(
                govDelegator.addProposalToAddMember([
                    user1.address,
                    user1.address,
                    user1.address,
                    U2B(nodeName[0]),
                    enode[0],
                    U2B(ip[0]),
                    port[0],
                    amount,
                    U2B(memo[0]),
                    duration,
                ])
            ).to.be.revertedWith("Already member");
        });

        it("can addProposal to add member", async () => {
            // staking first
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            const len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));
            const ballot = await ballotStorage.getBallotBasic(len);
            const ballotDetail = await ballotStorage.getBallotMember(len);
            ballot[3].should.be.equal(voter0.address);
            U2S(ballot[4]).should.be.equal(memo[0]);
            ballotDetail[1].should.be.equal(govMem1.address);

            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[1]),
                duration,
            ]);
            const len2 = await govDelegator.ballotLength();
            len2.should.be.equal(BigNumber.from(3));
        });

        it("cannot addProposal to remove non-member", async () => {
            // staking first
            // await staking.connect(govMem1).deposit({ value: amount});
            await expect(govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration)).to.be.revertedWith("Non-member");
        });

        it("cannot addProposal to remove a sole member", async () => {
            await expect(govDelegator.addProposalToRemoveMember(deployer.address, amount, U2B(memo[0]), duration)).to.be.revertedWith(
                "Cannot remove a sole member"
            );
        });

        // it('can addProposal to change member', async () => {
        //   await staking.connect(govMem1).deposit({value: amount});

        //   let oldMember = await govDelegator.getMember(1);
        //   oldMember.should.be.equal(deployer.address);
        //   let oldVoter = await govDelegator.getVoter(1);
        //   oldVoter.should.be.equal(deployer.address);
        //   await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
        //   const len = await govDelegator.ballotLength();
        //   len.should.be.equal(BigNumber.from(1));

        //   let newMember = await govDelegator.getMember(1);
        //   newMember.should.be.equal(govMem1.address);
        //   let newVoter = await govDelegator.getVoter(1);
        //   newVoter.should.be.equal(govMem1.address);
        //   let newReward = await govDelegator.getReward(1);
        //   newReward.should.be.equal(govMem1.address);
        // });

        it(`can addProposal to change member's other addresses self without voting`, async () => {
            let oldMember = await govDelegator.getMember(1);
            oldMember.should.be.equal(deployer.address);
            let oldVoter = await govDelegator.getVoter(1);
            oldVoter.should.be.equal(voter0.address);
            let oldReward = await govDelegator.getReward(1);
            oldReward.should.be.equal(user1.address);
            // console.log(result);
            await govDelegator.addProposalToChangeMember(
                [deployer.address, voter1.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            const len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));
            await govDelegator.vote(2, true);

            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            let newMember = await govDelegator.getMember(1);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(1);
            newVoter.should.be.equal(voter1.address);
            let newReward = await govDelegator.getReward(1);
            newReward.should.be.equal(user1.address);
        });

        it(`cannot addProposal to change member's other addresses which is already member`, async () => {
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(2, true);

            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);
            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(2));
            const nodeLen = await govDelegator.getNodeLength();
            nodeLen.should.be.equal(BigNumber.from(memberLen));
            const lock = await staking.lockedBalanceOf(govMem1.address);
            lock.should.be.equal(BigNumber.from(amount));

            let newMember = await govDelegator.getMember(memberLen);
            newMember.should.be.equal(govMem1.address);
            let newVoter = await govDelegator.getVoter(memberLen);
            newVoter.should.be.equal(govMem1.address);
            let newReward = await govDelegator.getReward(memberLen);
            newReward.should.be.equal(govMem1.address);
            // console.log(result);
            await expect(
                govDelegator.addProposalToChangeMember(
                    [deployer.address, govMem1.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                    deployer.address
                )
            ).to.be.revertedWith("Already a member");
        });

        it(`cannot addProposal to add member which is already voter`, async () => {
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            // console.log(result);
            let memberLen = await govDelegator.getMemberLength();
            await govDelegator
                .connect(deployer)
                .addProposalToChangeMember(
                    [deployer.address, govMem1.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                    deployer.address
                );
            govDelegator = govDelegator.connect(govMem1);

            let newMember = await govDelegator.getMember(memberLen);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(memberLen);
            newVoter.should.be.equal(govMem1.address);
            let newReward = await govDelegator.getReward(memberLen);
            newReward.should.be.equal(user1.address);

            await govDelegator.vote(2, true);

            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
            memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
            const nodeLen = await govDelegator.getNodeLength();
            nodeLen.should.be.equal(BigNumber.from(memberLen));
            const lock = await staking.lockedBalanceOf(govMem1.address);
            lock.should.be.equal(BigNumber.from(0));
            const bal = await staking.balanceOf(govMem1.address);
            bal.should.be.equal(BigNumber.from(amount));
        });

        it(`cannot addProposal to change member which is already voter`, async () => {
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToChangeMember(
                [govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );
            let memberLen = await govDelegator.getMemberLength();
            await govDelegator
                .connect(deployer)
                .addProposalToChangeMember(
                    [deployer.address, govMem1.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                    deployer.address
                );
            govDelegator = govDelegator.connect(govMem1);

            let newMember = await govDelegator.getMember(memberLen);
            newMember.should.be.equal(deployer.address);
            let newVoter = await govDelegator.getVoter(memberLen);
            newVoter.should.be.equal(govMem1.address);
            let newReward = await govDelegator.getReward(memberLen);
            newReward.should.be.equal(user1.address);

            await govDelegator.vote(2, true);

            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
            memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
            const nodeLen = await govDelegator.getNodeLength();
            nodeLen.should.be.equal(BigNumber.from(memberLen));
            const lock = await staking.lockedBalanceOf(govMem1.address);
            lock.should.be.equal(BigNumber.from(0));
            const bal = await staking.balanceOf(govMem1.address);
            bal.should.be.equal(BigNumber.from(amount));
        });

        // it('can addProposal to change staker with voting', async () => {
        //   await staking.connect(govMem1).deposit({value:amount});

        //   let oldMember = await govDelegator.getMember(1);
        //   oldMember.should.be.equal(deployer.address);
        //   let oldVoter = await govDelegator.getVoter(1);
        //   oldVoter.should.be.equal(voter0.address);
        //   // console.log(result);
        //   await govDelegator.addProposalToChangeMember([govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration], deployer.address);
        //   const len = await govDelegator.ballotLength();
        //   len.should.be.equal(BigNumber.from(1));

        //   let newMember = await govDelegator.getMember(1);
        //   newMember.should.be.equal(deployer.address);
        //   let newVoter = await govDelegator.getVoter(1);
        //   newVoter.should.be.equal(voter1.address);
        // });

        it("cannot addProposal to change non-member", async () => {
            // eslint-disable-next-line max-len
            await expect(
                govDelegator.addProposalToChangeMember(
                    [govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                    govMem2.address
                )
            ).to.be.revertedWith("Non-member");
        });

        it("can addProposal to change governance", async () => {
            let GovImp = await hre.ethers.getContractFactory("GovImp");
            let newGovImp = await GovImp.deploy();
            await govDelegator.addProposalToChangeGov(newGovImp.address, U2B(memo[0]), duration);
            const len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));
        });

        it("can not addProposal to change governance using EOA", async () => {
            await expect(govDelegator.addProposalToChangeGov(govMem1.address, U2B(memo[0]), duration)).to.be.revertedWith(
                "function call to a non-contract account"
            );
        });

        it("can not addProposal to change governance using non-UUPS", async () => {
            await expect(govDelegator.addProposalToChangeGov(registry.address, U2B(memo[0]), duration)).to.be.revertedWith(
                "ERC1967Upgrade: new implementation is not UUPS"
            );
        });

        it("cannot addProposal to change governance with same address", async () => {
            await expect(govDelegator.addProposalToChangeGov(govImp.address, U2B(memo[0]), duration)).to.be.revertedWith("Same contract address");
        });

        it("cannot addProposal to change governance with zero address", async () => {
            await expect(govDelegator.addProposalToChangeGov("0x" + "0".repeat(40), U2B(memo[0]), duration)).to.be.revertedWith(
                "Implementation cannot be zero"
            );
        });

        it("can addProposal to change environment", async () => {
            await govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Bytes32, U2B(envVal), U2B(memo[0]), duration);
            const len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));
        });

        it("cannot addProposal to change environment with wrong type", async () => {
            await expect(govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Invalid, U2B(envVal), U2B(memo[0]), duration)).to.be.revertedWith(
                "Invalid type"
            );
        });

        it("can vote approval to add member", async () => {
            //govMem1 signer
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(2, true);

            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);
            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(2));
            const nodeLen = await govDelegator.getNodeLength();
            nodeLen.should.be.equal(BigNumber.from(memberLen));
            const lock = await staking.lockedBalanceOf(govMem1.address);
            lock.should.be.equal(BigNumber.from(amount));

            let newMember = await govDelegator.getMember(memberLen);
            newMember.should.be.equal(govMem1.address);
            let newVoter = await govDelegator.getVoter(memberLen);
            newVoter.should.be.equal(govMem1.address);
            let newReward = await govDelegator.getReward(memberLen);
            newReward.should.be.equal(govMem1.address);
        });

        it("cannot vote approval to add member with insufficient staking", async () => {
            await staking.connect(govMem1).deposit({ value: amount.sub(BigNumber.from("10000000000000")) });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            //스테이킹 량 부족시 투표는 종료되며 결과가 reject로 표시
            await govDelegator.vote(2, true); //.to.be.revertedWith('invalid address');
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
        });

        it("can vote disapproval to deny adding member", async () => {
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(2, false);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
        });

        it("can vote approval to change member totally", async () => {
            //add
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(2, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            let state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);
            //govMem1 signer
            await staking.connect(govMem2).deposit({ value: amount });
            const preDeployerAvail = await staking.availableBalanceOf(govMem1.address);
            const preGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
            await govDelegator.addProposalToChangeMember(
                [govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[1]), duration],
                govMem1.address
            );
            await govDelegator.vote(3, true);
            await govDelegator.connect(govMem1).vote(3, true);
            //voteLength = 현재까지 vote()함수가 불린 함수
            len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(3));
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(3);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(2));
            const memberAddr = await govDelegator.getMember(2);
            memberAddr.should.equal(govMem2.address);
            const [nName, nEnode, nIp, nPort] = await govDelegator.getNode(2);
            U2S(nName).should.equal(nodeName[1]);
            nEnode.should.equal(enode[1]);
            U2S(nIp).should.equal(ip[1]);
            nPort.should.be.equal(BigNumber.from(port[1]));
            const nodeIdxFromDeployer = await govDelegator.getNodeIdxFromMember(govMem1.address);
            nodeIdxFromDeployer.should.be.equal(BigNumber.from(0));
            const nodeIdxFromGovMem1 = await govDelegator.getNodeIdxFromMember(govMem2.address);
            nodeIdxFromGovMem1.should.be.equal(BigNumber.from(2));

            const postDeployerAvail = await staking.availableBalanceOf(govMem1.address);
            const postGovmem1Avail = await staking.availableBalanceOf(govMem2.address);
            postDeployerAvail.sub(preDeployerAvail).should.be.equal(BigNumber.from(amount));
            preGovmem1Avail.sub(postGovmem1Avail).should.be.equal(BigNumber.from(amount));
        });

        it("can vote approval to change enode only without voting", async () => {
            await govDelegator.addProposalToChangeMember(
                [deployer.address, voter0.address, user1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration],
                deployer.address
            );
            await govDelegator.vote(2, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
            const memberAddr = await govDelegator.getMember(1);
            memberAddr.should.equal(deployer.address);
            const [nName, nEnode, nIp, nPort] = await govDelegator.getNode(1);
            U2S(nName).should.equal(nodeName[1]);
            nEnode.should.equal(enode[1]);
            U2S(nIp).should.equal(ip[1]);
            nPort.should.be.equal(BigNumber.from(port[1]));
        });

        it("cannot vote approval to change member with insufficient staking", async () => {
            await staking.connect(govMem1).deposit({ value: amount.sub(BigNumber.from("1000000000")) });
            await govDelegator.addProposalToChangeMember(
                [govMem1.address, govMem1.address, govMem1.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration],
                deployer.address
            );
            await govDelegator.vote(2, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state[2].should.equal(true);
        });

        it("can vote approval to change governance", async () => {
            const GovImp = await ethers.getContractFactory("GovImp");
            const newGovImp = await GovImp.deploy();
            await govDelegator.addProposalToChangeGov(newGovImp.address, U2B(memo[0]), duration);
            await govDelegator.vote(2, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            const imp = await gov.implementation();
            imp.should.equal(newGovImp.address);
        });

        it("can vote approval to change environment", async () => {
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("blocksPer")),
                envTypes.Uint,
                "0x0000000000000000000000000000000000000000000000000000000000000064",
                U2B(memo[0]),
                duration
            );
            await govDelegator.vote(2, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            const blocksPer = await envDelegator.getBlocksPer();
            blocksPer.should.be.equal(BigNumber.from(100));
        });

        it("cannot vote for a ballot already done", async () => {
            //govMem1 signer
            // let signer1 = (await ethers.getSigners())[1];
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(2, true);
            await expect(govDelegator.vote(2, true)).to.be.revertedWith("Expired");
        });

        it("cannot vote for a ballot already staker done", async () => {
            //govMem1 signer
            // let signer1 = (await ethers.getSigners())[1];
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.connect(deployer).vote(2, true);
            await expect(govDelegator.vote(2, true)).to.be.revertedWith("Expired");
        });

        it("cannot vote for a ballot already voter done", async () => {
            //govMem1 signer
            // let signer1 = (await ethers.getSigners())[1];
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(2, true);
            await expect(govDelegator.connect(deployer).vote(2, true)).to.be.revertedWith("Expired");
        });
        it("cannot add proposal durring period time", async () => {
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("blocksPer")),
                envTypes.Uint,
                "0x0000000000000000000000000000000000000000000000000000000000000064",
                U2B(memo[0]),
                duration
            );
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("blocksPer")),
                envTypes.Uint,
                "0x0000000000000000000000000000000000000000000000000000000000000064",
                U2B(memo[0]),
                duration
            );
            await govDelegator.connect(deployer).setProposalTimePeriod(60);
            await expect(
                govDelegator.addProposalToChangeEnv(
                    ethers.utils.keccak256(U2B("blocksPer")),
                    envTypes.Uint,
                    "0x0000000000000000000000000000000000000000000000000000000000000064",
                    U2B(memo[0]),
                    duration
                )
            ).to.be.revertedWith("Cannot add proposal too early");
        });
    });

    describe("Two Member ", function () {
        beforeEach(async () => {
            //govMem1 signer
            // let signer1 = (await ethers.getSigners())[1];
            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            await govDelegator.vote(1, true);
        });

        it("cannot vote with changed voter address", async () => {
            await govDelegator.addProposalToChangeEnv(B322S(envName), envTypes.Bytes32, U2B(envVal), U2B(memo[0]), duration);
            ballotIdx = await govDelegator.ballotLength();
            //change staker0's voter to voter0 without voting
            await govDelegator.addProposalToChangeMember(
                [deployer.address, voter0.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );

            await govDelegator.connect(voter0).vote(ballotIdx, true);
            await govDelegator.addProposalToChangeMember(
                [deployer.address, voter1.address, user1.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            );

            await expect(govDelegator.connect(voter1).vote(ballotIdx, true)).to.be.revertedWith("already voted");
        });

        it("cannot addProposal to add member self", async () => {
            //govMem1 signer
            // let signer1 = (await ethers.getSigners())[1];
            await expect(
                govDelegator
                    .connect(govMem1)
                    .addProposalToAddMember([
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
                    ])
            ).to.be.revertedWith("Already member");
        });

        it("can addProposal to remove member", async () => {
            await govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration);
            const len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));
        });

        it("can addProposal to add member where info is the removed member's with same govMem", async () => {
            await govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration);
            let len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));

            await govDelegator.vote(len, true);
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(len));
            let state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(len, true);
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            await staking.connect(govMem1).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem1.address,
                govMem1.address,
                govMem1.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            len = await govDelegator.ballotLength();
            await govDelegator.vote(len, true);
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);
        });

        it("can addProposal to add member where info is the removed member's", async () => {
            await govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration);
            let len = await govDelegator.ballotLength();
            len.should.be.equal(BigNumber.from(2));

            await govDelegator.vote(len, true);
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(len));
            let state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await govDelegator.connect(govMem1).vote(len, true);
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);

            console.log("member removed")

            await staking.connect(govMem2).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem2.address,
                govMem2.address,
                govMem2.address,
                U2B(nodeName[1]),
                enode[1],
                U2B(ip[1]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            len = await govDelegator.ballotLength();
            await govDelegator.vote(len, true);
            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state[2].should.equal(true);
        });

        it("can vote to add member", async () => {
            //govMem2 signer
            // let signer2 = (await ethers.getSigners())[2];
            await staking.connect(govMem2).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem2.address,
                govMem2.address,
                govMem2.address,
                U2B(nodeName[2]),
                enode[2],
                U2B(ip[2]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            const len = await govDelegator.ballotLength();
            await govDelegator.vote(len, true);
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(len));
            const state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            //govMem1 signer
            // let signer1 = (await ethers.getSigners())[1];
            await govDelegator.connect(govMem1).vote(len, true);
            const inVoting2 = await govDelegator.getBallotInVoting();
            inVoting2.should.be.equal(BigNumber.from(0));
            const state2 = await ballotStorage.getBallotState(len);
            state2[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state2[2].should.equal(true);
        });

        it("can vote to deny adding member", async () => {
            await staking.connect(govMem2).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem2.address,
                govMem2.address,
                govMem2.address,
                U2B(nodeName[2]),
                enode[2],
                U2B(ip[2]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            const len = await govDelegator.ballotLength();
            await govDelegator.vote(len, false);
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(len));
            const state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            //govMem1 signer
            await govDelegator.connect(govMem1).vote(len, false);
            const inVoting2 = await govDelegator.getBallotInVoting();
            inVoting2.should.be.equal(BigNumber.from(0));
            const state2 = await ballotStorage.getBallotState(len);
            state2[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state2[2].should.equal(true);
        });

        it("can vote to remove first member", async () => {
            const preAvail = await staking.availableBalanceOf(deployer.address);
            await govDelegator.addProposalToRemoveMember(deployer.address, amount, U2B(memo[0]), duration);
            const len = await govDelegator.ballotLength();
            await govDelegator.vote(len, true);
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(len));
            const state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            //govMem1 signer
            await govDelegator.connect(govMem1).vote(len, true);
            const inVoting2 = await govDelegator.getBallotInVoting();
            inVoting2.should.be.equal(BigNumber.from(0));
            const state2 = await ballotStorage.getBallotState(len);
            state2[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state2[2].should.equal(true);

            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
            const isMem = await govDelegator.isMember(deployer.address);
            isMem.should.equal(false);
            const nodeLen = await govDelegator.getNodeLength();
            nodeLen.should.be.equal(BigNumber.from(1));
            const nodeIdx = await govDelegator.getNodeIdxFromMember(deployer.address);
            nodeIdx.should.be.equal(BigNumber.from(0));
            const nodeIdx2 = await govDelegator.getNodeIdxFromMember(govMem1.address);
            nodeIdx2.should.be.equal(BigNumber.from(1));

            const postAvail = await staking.availableBalanceOf(deployer.address);
            postAvail.sub(preAvail).should.be.equal(BigNumber.from(amount));
        });

        it("can vote to remove last member", async () => {
            const preAvail = await staking.availableBalanceOf(deployer.address);
            await govDelegator.addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration);
            const len = await govDelegator.ballotLength();
            await govDelegator.vote(len, true);
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(len));
            const state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            //govMem1 signer
            let signer1 = (await ethers.getSigners())[1];
            await govDelegator.connect(govMem1).vote(len, true);
            const inVoting2 = await govDelegator.getBallotInVoting();
            inVoting2.should.be.equal(BigNumber.from(0));
            const state2 = await ballotStorage.getBallotState(len);
            state2[1].should.be.equal(BigNumber.from(ballotStates.Accepted));
            state2[2].should.equal(true);

            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(1));
            const isMem = await govDelegator.isMember(govMem1.address);
            isMem.should.equal(false);
            const nodeLen = await govDelegator.getNodeLength();
            nodeLen.should.be.equal(BigNumber.from(1));
            const nodeIdx = await govDelegator.getNodeIdxFromMember(govMem1.address);
            nodeIdx.should.be.equal(BigNumber.from(0));
            const nodeIdx2 = await govDelegator.getNodeIdxFromMember(deployer.address);
            nodeIdx2.should.be.equal(BigNumber.from(1));

            const postAvail = await staking.availableBalanceOf(govMem1.address);
            postAvail.sub(preAvail).should.be.equal(BigNumber.from(amount));
        });

        it("cannot vote simultaneously", async () => {
            await staking.connect(govMem2).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem2.address,
                govMem2.address,
                govMem2.address,
                U2B(nodeName[2]),
                enode[2],
                U2B(ip[2]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);

            await staking.connect(govMem3).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem3.address,
                govMem3.address,
                govMem3.address,
                U2B(nodeName[3]),
                enode[3],
                U2B(ip[3]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            const len = await govDelegator.ballotLength();
            await govDelegator.vote(len - 1, true);
            const voting = await govDelegator.getBallotInVoting();
            voting.should.be.equal(BigNumber.from(len - 1));
            await expect(govDelegator.vote(len, true)).to.be.revertedWith("Now in voting with different ballot");
        });

        it("vote is ended when the sum of voting power is max", async () => {
            //govMem2 signer
            // let signer2 = (await ethers.getSigners())[2];
            await staking.connect(govMem2).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem2.address,
                govMem2.address,
                govMem2.address,
                U2B(nodeName[2]),
                enode[2],
                U2B(ip[2]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            const len = await govDelegator.ballotLength();
            await govDelegator.vote(len, true);
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(len));
            const state = await ballotStorage.getBallotState(len);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            //govMem1 signer
            // let signer1 = (await ethers.getSigners())[1];
            await govDelegator.connect(govMem1).vote(len, false);
            const inVoting2 = await govDelegator.getBallotInVoting();
            inVoting2.should.be.equal(BigNumber.from(0));
            const state2 = await ballotStorage.getBallotState(len);
            state2[1].should.be.equal(BigNumber.from(ballotStates.Rejected));
            state2[2].should.equal(true);
        });

        it("cannot vote approval when the voting is ended", async () => {
            const delay_time = 1;
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("blocksPer")),
                envTypes.Uint,
                "0x0000000000000000000000000000000000000000000000000000000000000064",
                U2B(memo[0]),
                delay_time
            );
            let ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await sleep(delay_time * 2000);
            await expect(govDelegator.connect(govMem1).vote(ballotLen, true)).to.be.revertedWith("Expired");
            await govDelegator.finalizeEndedVote();

            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
        });

        it("Non member cannot end voting ", async () => {
            const delay_time = 1;
            await govDelegator.addProposalToChangeEnv(
                ethers.utils.keccak256(U2B("blocksPer")),
                envTypes.Uint,
                "0x0000000000000000000000000000000000000000000000000000000000000064",
                U2B(memo[0]),
                delay_time
            );
            let ballotLen = await govDelegator.ballotLength();
            await govDelegator.vote(ballotLen, true);
            let len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(2));
            let inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
            let state = await ballotStorage.getBallotState(ballotLen);
            state[1].should.be.equal(BigNumber.from(ballotStates.InProgress));
            state[2].should.equal(false);

            await sleep(delay_time * 2000);
            await expect(govDelegator.connect(govMem1).vote(ballotLen, true)).to.be.revertedWith("Expired");
            await expect(govDelegator.connect(govMem3).finalizeEndedVote()).to.be.revertedWith("No Permission");

            inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(ballotLen));
        });

        it("reject proposal  without voting about changing voter address if voter is already registered", async () => {
            await expect(govDelegator.connect(deployer).addProposalToChangeMember(
                [deployer.address, govMem1.address, deployer.address, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0], amount, U2B(memo[0]), duration],
                deployer.address
            )).to.be.revertedWith("Already a member");
            // await govDelegator.vote(1, true);
            const len = await govDelegator.voteLength();
            len.should.be.equal(BigNumber.from(1));
            const inVoting = await govDelegator.getBallotInVoting();
            inVoting.should.be.equal(BigNumber.from(0));
            const state = await ballotStorage.getBallotState(2);
            state[1].should.be.equal(BigNumber.from(ballotStates.Invalid));
            state[2].should.equal(false);

            const memberLen = await govDelegator.getMemberLength();
            memberLen.should.be.equal(BigNumber.from(2));
            const memberAddr = await govDelegator.getMember(1);
            memberAddr.should.equal(deployer.address);
            const voterAddr = await govDelegator.getVoter(1);
            voterAddr.should.equal(deployer.address);
            const rewardAddr = await govDelegator.getReward(1);
            rewardAddr.should.equal(deployer.address);
            const [nName, nEnode, nIp, nPort] = await govDelegator.getNode(1);
            U2S(nName).should.equal(nodeName[0]);
            nEnode.should.equal(enode[0]);
            U2S(nIp).should.equal(ip[0]);
            nPort.should.be.equal(BigNumber.from(port[0]));
        });
    });

    describe("Others ", function () {
        it("cannot init", async () => {
            //govMem1 signer
            await staking.connect(govMem1).deposit({ value: amount });
            await expect(govDelegator.connect(govMem1).init(registry.address, amount, U2B(nodeName[0]), enode[0], U2B(ip[0]), port[0])).to.be.revertedWith(
                "Initializable: contract is already initialized"
            );
        });

        it("cannot addProposal", async () => {
            //govMem1 signer
            await expect(
                govDelegator
                    .connect(govMem1)
                    .addProposalToAddMember([
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
                    ])
            ).to.be.revertedWith("No Permission");
            await expect(govDelegator.connect(govMem1).addProposalToRemoveMember(govMem1.address, amount, U2B(memo[0]), duration)).to.be.revertedWith(
                "No Permission"
            );
            await staking.connect(govMem2).deposit({ value: amount });
            await expect(
                govDelegator
                    .connect(govMem1)
                    .addProposalToChangeMember(
                        [govMem2.address, govMem2.address, govMem2.address, U2B(nodeName[1]), enode[1], U2B(ip[1]), port[1], amount, U2B(memo[0]), duration],
                        govMem1.address
                    )
            ).to.be.revertedWith("No Permission");
            await expect(govDelegator.connect(govMem1).addProposalToChangeGov(govMem1.address, U2B(memo[0]), duration)).to.be.revertedWith("No Permission");
            await expect(
                govDelegator.connect(govMem1).addProposalToChangeEnv(B322S(envName), envTypes.Bytes32, U2B(envVal), U2B(memo[0]), duration)
            ).to.be.revertedWith("No Permission");
        });

        it("cannot vote", async () => {
            await staking.connect(govMem2).deposit({ value: amount });
            await govDelegator.addProposalToAddMember([
                govMem2.address,
                govMem2.address,
                govMem2.address,
                U2B(nodeName[2]),
                enode[2],
                U2B(ip[2]),
                port[0],
                amount,
                U2B(memo[0]),
                duration,
            ]);
            //govMem1 signer
            await expect(govDelegator.connect(govMem1).vote(1, true)).to.be.revertedWith("No Permission");
        });
    });
});

function getInitialGovernanceMembersAndNodes(data, ethers) {
    var nodes = "0x",
        stakes = "0x";

    for (var i = 0, l = data.members.length; i < l; i++) {
        var m = data.members[i],
            id,
            staker, voter, reward;
        if (m.id.length != 128 && m.id.length != 130) throw "Invalid enode id " + m.id;
        id = m.id.length == 128 ? m.id : m.id.substr(2);
        staker = m.staker.indexOf("0x") != 0 ? m.staker : m.staker.substr(2);
        voter = m.voter.indexOf("0x") != 0 ? m.voter : m.voter.substr(2);
        reward = m.reward.indexOf("0x") != 0 ? m.reward : m.reward.substr(2);
        nodes +=
            ethers.utils.hexZeroPad("0x" + staker, 32).substr(2) +
            ethers.utils.hexZeroPad("0x" + voter, 32).substr(2) +
            ethers.utils.hexZeroPad("0x" + reward, 32).substr(2) +
            packNum(m.name.length) +
            str2hex(m.name).substr(2) +
            packNum(id.length / 2) +
            id +
            packNum(m.ip.length) +
            str2hex(m.ip).substr(2) +
            packNum(m.port);

        stakes += ethers.utils.hexZeroPad("0x" + staker, 32).substr(2) + packNum(toBigInt(m.stake));
    }
    return {
        nodes: nodes,
        stakes: stakes,
        staker: data.staker,
        ecosystem: data.ecosystem,
        maintenance: data.maintenance,
    };
};

function packNum(num) {
    // return web3.padLeft(web3.toHex(num).substr(2), 64, "0")
    return ethers.utils.hexZeroPad(num, 32).slice(2);
};

function toBigInt(v) {
    return ethers.BigNumber.from(v.toLocaleString("fullwide", { useGrouping: false }));
};

function str2hex(s) {
    return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));
};

function type2Bytes(types, inputs) {
    const ABICoder = ethers.utils.AbiCoder;
    const abiCoder = new ABICoder();

    let parameters = abiCoder.encode(types, inputs);
    return parameters;
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
