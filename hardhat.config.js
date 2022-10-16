require("@nomiclabs/hardhat-waffle");
const { task } = require("hardhat/config");
// require("hardhat-gas-reporter");
// require("hardhat-contract-sizer");

require("dotenv").config();

const path = require("path");

const sendTx = require("./scripts/sendTx_task").sendTxKeep;
const setting = require("./scripts/setting_task").set;
const changeEnv = require("./scripts/changeEnv_task").changeEnvVal;
const deployGov = require("./scripts/deploy_task").deployGov;
const deployGovNoLedger = require("./scripts/deploy_no_ledger_task").deployGov;
const deployGovLedger = require("./scripts/deploy_ledger_task").deployGov;
const initOnce = require("./scripts/deploy_initOnce_ledger_task").initOnce;
const initOnceNoLedger = require("./scripts/deploy_initOnce_no_ledger").initOnce;
const deployGovNoLedgerOnce = require("./scripts/deploy_initOnce_no_ledger_once").deployGov;
const deployGovNoLedgerOnceFake = require("./scripts/deploy_initOnce_no_ledger_fake").deployGov;
const deployTestGov = require("./scripts/deploy_test_task").deployGov;
const deployLocalGov = require("./scripts/deploy_local_task").deployGov;
const addMember = require("./scripts/addMembers_task").addMembers;
const deposit = require("./scripts/deposit_task").deposit;
const depositNoLedger = require("./scripts/deposit_no_ledger_task").deposit;
const removeMemberLedger = require("./scripts/removeMembers_ledger_task").removeMember;
const addMemberLedger = require("./scripts/addMembers_ledger_task").addMembers;
const changeMemberLedger = require("./scripts/changeMembers_ledger_task").changeMembers;
const changeMemberLedgerWithSK = require("./scripts/changeMembers_ledger_with_sk_task ").changeMembers;
const changeMemberSelfLedger = require("./scripts/changeMembersSelf_ledger_task").changeMembers;
const changeMemberSelfSK = require("./scripts/changeMembersSelf_sk_task").changeMembers;

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

task("deployGovLedger", "Deploy governance contracts")
.addParam('conf').setAction(async (taskArgs, hre)=>{
    await deployGovLedger(hre, taskArgs.conf);
})

task("deployGovNoLedger", "Deploy governance contracts")
.addParam("pw").addParam('acc').addParam('conf').setAction(async (taskArgs, hre)=>{
    await deployGovNoLedger(hre, taskArgs.pw, taskArgs.acc, taskArgs.conf);
})


task("deployGovNoLedgerOnceFake", "Deploy governance contracts")
.setAction(async (taskArgs, hre)=>{
    await deployGovNoLedgerOnceFake(hre);
})

task("deployGovNoLedgerOnce", "Deploy governance contracts")
.addParam("pw").addParam('acc').addParam('conf').setAction(async (taskArgs, hre)=>{
    await deployGovNoLedgerOnce(hre, taskArgs.pw, taskArgs.acc, taskArgs.conf);
})

task("initOnceNoLedger", "Deploy governance contracts")
.addParam("pw").addParam('acc').addParam("addr").addParam('conf').setAction(async (taskArgs, hre)=>{
    await initOnceNoLedger(hre, taskArgs.pw, taskArgs.acc, taskArgs.addr, taskArgs.conf);
})

task("initOnceLedger", "Deploy governance contracts")
.addParam("addr").addParam('conf').setAction(async (taskArgs, hre)=>{
    await initOnce(hre, taskArgs.addr, taskArgs.conf);
})

task("depositNoLedger", "deposit to staking contract")
.addParam("pw").addParam('acc').addParam("addr").addParam('conf').setAction(async (taskArgs, hre)=>{
    await depositNoLedger(hre, taskArgs.pw, taskArgs.acc,taskArgs.addr, taskArgs.conf);
})

task("deposit", "deposit to staking contract")
.addParam("addr").addParam('conf').setAction(async (taskArgs, hre)=>{
    await deposit(hre, taskArgs.addr, taskArgs.conf);
})

task("addMember", "Add governance members")
.addParam("pw")
.addParam("addr")
.addParam("acc")
.addParam("conf")
.setAction(async (taskArgs, hre)=>{
    await addMember(hre, taskArgs.pw, taskArgs.addr, taskArgs.acc, taskArgs.conf);
})

task("addMemberLedger", "Add governance members")
.addParam("addr")
.addParam("conf")
.addParam("info")
.setAction(async (taskArgs, hre)=>{
    await addMemberLedger(hre, taskArgs.addr, taskArgs.conf, taskArgs.info);
})

task("changeMemberLedger", "Change governance members")
.addParam("addr")
.addParam("conf")
.addParam("info")
.setAction(async (taskArgs, hre)=>{
    await changeMemberLedger(hre, taskArgs.addr, taskArgs.conf, taskArgs.info);
})

task("changeMemberLedgerWithSK", "Change governance members")
.addParam("addr")
.addParam("conf")
.addParam("info")
.setAction(async (taskArgs, hre)=>{
    await changeMemberLedgerWithSK(hre, taskArgs.addr, taskArgs.conf, taskArgs.info);
})

task("changeMemberSK", "Change governance members")
.addParam("addr")
.addParam("conf")
.addParam("info")
.setAction(async (taskArgs, hre)=>{
    await changeMemberSelfSK(hre, taskArgs.addr, taskArgs.conf, taskArgs.info);
})

task("changeMembeSelfrLedger", "Change governance members")
.addParam("addr")
.addParam("conf")
.addParam("info")
.setAction(async (taskArgs, hre)=>{
    await changeMemberSelfLedger(hre, taskArgs.addr, taskArgs.conf, taskArgs.info);
})

task("removeMemberLedger", "Remove governance members")
.addParam("addr")
.addParam("conf")
.addParam("info")
.setAction(async (taskArgs, hre)=>{
    await removeMemberLedger(hre, taskArgs.addr, taskArgs.conf, taskArgs.info);
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

const privateKey = process.env.SK;

//hardhat test key
const dummySK = '0x232cace830056fc37af5a4b2015b2e7163d04874a5d6e715e70d5867f42257e7';
const rpcURL = process.env.rpc;

module.exports = {
    networks: {
        hardhat: {
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                initialIndex: 0,
                accountsBalance: "1000000000" + "0".repeat(18),
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
        tg4: {
            url: 'http://127.0.0.1:9100'
        },
        mj: {
            accounts : [dummySK],
            url: 'http://127.0.0.1:8588'
        },
        rpc:{
            url: rpcURL
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
