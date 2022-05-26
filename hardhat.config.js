require("@nomiclabs/hardhat-waffle");
const { task } = require("hardhat/config");


const path = require("path")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

 module.exports = {
  networks : {
    hardhat:{

      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        initialIndex: 0,
        accountsBalance: '1000000000'+'0'.repeat(18),
      },
      // accounts : account_balance_list,
      // forking:{
      //   url:`https://api.metadium.com/dev`
      // }
    },
    localhost : {
      url : "http://127.0.0.1:8545"
    }
  },
  contractSizer:{
    runOnCompile: true
  },
  solidity: {
    compilers:[
      {
        version : "0.8.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
    ],
  },
  paths : {
    sources : path.join(__dirname,"./contracts")
  },
  mocha: {
    timeout : 1000000
  }
};
