// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

const { ethers } = require("hardhat");

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
  "maxPriorityFeePerGas" : '100',
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
async function main() {
    let accs = await hre.ethers.getSigners();
    deployer = accs[0];
    govMem1 = accs[1];
    govMem2 = accs[2];
    govMem3 = accs[3];
    staker0 = accs[4];
    staker1 = accs[5];
    staker2 = accs[6];
    staker3 = accs[7];
    user1 = accs[8];
    let Registry = await hre.ethers.getContractFactory('Registry');
    // registry = await Registry.new();
    registry = await Registry.deploy();
    console.log("Registry : ",registry.address)
    let EnvStorageImp = await hre.ethers.getContractFactory('EnvStorageImp');
    envStorageImp = await EnvStorageImp.deploy(); //await EnvStorageImp.new();
    await envStorageImp.deployed();
    console.log("EnvStorageImp : ",envStorageImp.address)
    let EnvStorage = await hre.ethers.getContractFactory('EnvStorage');
    envStorage = await EnvStorage.deploy(registry.address, envStorageImp.address);
    await envStorage.deployed();
    console.log("EnvStorage : ",envStorage.address)
    // envStorage = await EnvStorage.new(registry.address, envStorageImp.address);
    let BallotStorage = await hre.ethers.getContractFactory('BallotStorage');
    ballotStorage =  await BallotStorage.deploy(registry.address);//await BallotStorage.new(registry.address);
    await ballotStorage.deployed();
    console.log("BallotStorage : ",ballotStorage.address)
    let Staking = await hre.ethers.getContractFactory('Staking');
    let infos = []
    staking = await Staking.deploy(registry.address, infos);//await Staking.new(registry.address,"");
    await staking.deployed();
    console.log("Staking : ",staking.address)
    let GovImp = await hre.ethers.getContractFactory('GovImp');
    govImp = await GovImp.deploy();
    await govImp.deployed();
    console.log("GovImp : ",govImp.address)
    let Gov = await hre.ethers.getContractFactory('Gov');
    gov = await Gov.deploy();
    await gov.deployed();
    console.log("Gov : ",gov.address)

    await registry.setContractDomain(B322S('EnvStorage'), envStorage.address);
    await registry.setContractDomain(B322S('BallotStorage'), ballotStorage.address);
    await registry.setContractDomain(B322S('Staking'), staking.address);
    await registry.setContractDomain(B322S('GovernanceContract'), gov.address);

    // Initialize environment storage
    const {abi} = await hre.artifacts.readArtifact('EnvStorageImp');
    envDelegator = await hre.ethers.getContractAt(abi, envStorage.address);//EnvStorageImp.at(envStorage.address);

    const envNames = Object.keys(envParams);
    let envNamesBytes = [];
    for(let i=0;i<envNames.length;i++){
      envNamesBytes.push(ethers.utils.keccak256(U2B(envNames[i])));
    }
    const envVariables = Object.values(envParams);
    await envDelegator.initialize(
      envNamesBytes,
      envVariables
      );

    // let staking = await ethers.getContractAt('Staking', '0x95E91593DF1eD9e136A70c02950334E5EadC3871')
    // // Initialize for staking
    await staking.deposit({ value: amount});

    // let gov = await ethers.getContractAt('Gov','0x286f56881466C1aBf258dB7feE6F9eA6865Ac02A')
    // Initialize governance
    await gov.init(registry.address, govImp.address, amount, U2B(nodeName[0]), (enode[0]), U2B(ip[0]), (port[0]));
    // await gov.init('0xD9Ff9d4bC81edD20329D2d13a0C9C7427f33067E', '0xeD36265dbf0fc75a96a5169ecf4D05444895707E', deployer.address, '1'+'0'.repeat(18), U2B(nodeName[0]), (enode[0]), U2B(ip[0]), (port[0]));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
