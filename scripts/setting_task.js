// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.


const accs = require("../accounts_test").accs;

const addresses = require("../addresses");


async function set(hre, password) {
    const ethers = hre.ethers;
    deployer = await ethers.Wallet.fromEncryptedJson(JSON.stringify(accs[0]), password); //accs[0];

    accounts = [];
    let provider = await ethers.provider;
    for (i = 0; i < 10; i++) {
        accounts.push(await ethers.Wallet.fromEncryptedJson(JSON.stringify(accs[i]), password));
        accounts[i] = accounts[i].connect(provider);
    }
    provider = await ethers.provider;

    govDelegator = await ethers.getContractAt("GovImp", addresses.GOV_ADDRESS, accounts[0]);
    envDelegator = await ethers.getContractAt("EnvStorageImp", addresses.ENV_STORAGE_ADDRESS, accounts[0]); //EnvStorageImp.at(envStorage.address);
    ballotStorage = await ethers.getContractAt("BallotStorage", addresses.BALLOT_STORAGE_ADDRESS, accounts[0]);
    return { accounts: accounts, govDelegator: govDelegator, envDelegator: envDelegator, ballotStorage: ballotStorage, provider: provider };
}

module.exports = {
    set: set,
};
