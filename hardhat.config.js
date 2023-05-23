require("@nomiclabs/hardhat-waffle");
const { task } = require("hardhat/config");
// require("hardhat-gas-reporter");
// require("hardhat-contract-sizer");
require("dotenv").config();

const path = require("path");

const deployGov = require("./scripts/deploy_task").deployGov;
const addMember = require("./scripts/addMembers_task").addMembers;
// const impersonateMember = require("./scripts/impersonateNode").impersonateMember;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        const balance = await hre.ethers.provider.getBalance(account.address);
        console.log(account.address, balance/10**18);
    }
});

task("deployGov", "Deploy governance contracts")
    .addParam("pw")
    .addParam("acc")
    .addParam("conf")
    .setAction(async (taskArgs, hre) => {
        await deployGov(hre, taskArgs.pw, taskArgs.acc, taskArgs.conf);
    });

task("addMember", "Add governance members")
    .addParam("pw")
    .addParam("addr")
    .addParam("acc")
    .addParam("conf")
    .setAction(async (taskArgs, hre) => {
        await addMember(hre, taskArgs.pw, taskArgs.addr, taskArgs.acc, taskArgs.conf);
    });

// task("impMember", "Impersonante new gov member and stake")
//     .addParam("gov")
//     .addParam("addr")
//     .setAction(async (taskArgs, hre) => {
//         await impersonateMember(hre, taskArgs.gov, taskArgs.addr);
//     });
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
                accountsBalance: "10000000000" + "0".repeat(18),
            },
            forking:{
                url: 'https://api.test.wemix.com'
            },
            allowUnlimitedContractSize: true,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        dev: {
            url: "http://127.0.0.1:9100",
            gasPrice : 110000000000,
        },
        wemix: {
            url: "https://api.wemix.com",
        },
        wtestnet: {
            url: "https://api.test.wemix.com",
        },
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
