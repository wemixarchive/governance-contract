require("@nomiclabs/hardhat-waffle");
const { task } = require("hardhat/config");

require('@openzeppelin/hardhat-upgrades');

require("hardhat-gas-reporter");
require("hardhat-contract-sizer");

require("dotenv").config();

const path = require("path");

const sendTx = require("./scripts/sendTx_task").sendTxKeep;
const changeEnv = require("./scripts/changeEnv_task").changeEnvVal;
const deployGov = require("./scripts/deploy_task").deployGov;
const deployTestGov = require("./scripts/deploy_test_task").deployGov;
const addMember = require("./scripts/addMembers_task").addMembers;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

task("deployGov", "Deploy governance contracts")
.addParam("pw").addParam('acc').addParam('conf').setAction(async (taskArgs, hre)=>{
    await deployGov(hre, taskArgs.pw, taskArgs.acc, taskArgs.conf);
})

task("addMember", "Add governance members")
.addParam("pw")
.addParam("addr")
.addParam("acc")
.addParam("conf")
.setAction(async (taskArgs, hre)=>{
    await addMember(hre, taskArgs.pw, taskArgs.addr, taskArgs.acc, taskArgs.conf);
})
task("deployGovTest", "Deploy governance contracts")
.addParam("pw").setAction(async (taskArgs, hre)=>{
    await deployTestGov(hre, taskArgs.pw);
})

task("deployLocalTest", "Deploy governance contracts").addParam("conf")
.setAction(async (taskArgs, hre)=>{
    await deployLocalGov(hre, taskArgs.conf);
})
task("changeMP", "Change maxPrioirtyFeePerGas")
    .addParam("pw")
    .addParam("envValue")
    .setAction(async (args, hre) => {
        let envName = "maxPriorityFeePerGas";

        let envTypes = ["uint256"];
        let envValue = [args.envValue];
        envMsg = "mp test";
        // console.log(envName, types, envValue, msg)
        const sets = await setting(hre, args.pw);
        await changeEnv(hre, sets, envName, envTypes, envValue, envMsg);
    });

task("changeFee", "Change gasLimitAndBaseFee")
    .addParam("pw")
    .addParam("gasLimit")
    .addParam("changeRate")
    .addParam("targetPerc")
    .addParam("maxBasefee")
    .setAction(async (args, hre) => {
        let envName = "gasLimitAndBaseFee";

        let envTypes = ["uint256", "uint256", "uint256", "uint256"];
        let envValue = [args.gasLimit, args.changeRate, args.targetPerc, args.maxBasefee + "0".repeat(9)];
        envMsg = "mp test";
        // console.log(envName, types, envValue, msg)
        const sets = await setting(hre, args.pw);
        await changeEnv(hre, sets, envName, envTypes, envValue, envMsg);
    });

task("sendTx", "send tx")
    .addParam("pw")
    .addParam("fromIdx")
    .addParam("toIdx")
    .addParam("value")
    .setAction(async (args, hre) => {
        const sets = await setting(hre, args.pw);
        await sendTx(hre, sets, args.fromIdx, args.toIdx, args.value);
    });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */


 module.exports = {
     networks: {
         hardhat: {
             accounts: {
                 mnemonic: "test test test test test test test test test test test junk",
                 initialIndex: 0,
                 accountsBalance: "100000000000" + "0".repeat(18),
                 count : 40
             },
             forking:{
                 url: 'https://api.test.wemix.com'
             },
             allowUnlimitedContractSize : true
         },
         localhost: {
             url: "http://127.0.0.1:8545",
         },
         wtestnet: {
             url: 'https://api.test.wemix.com'
         },
         wemix: {
             url: 'https://api.wemix.com'
         }
     },
     contractSizer: {
         runOnCompile: true,
     },
     solidity: {
         compilers: [
             {
                 version: "0.8.6",
                 settings: {
                     optimizer: {
                         enabled: true,
                         runs: 200,
                     },
                 },
             },
         ],
     },
     paths: {
         sources: path.join(__dirname, "./contracts"),
     },
     mocha: {
         timeout: 1000000,
     },
     gasReporter: {
         enabled: true,
     },
 };
 