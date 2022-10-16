// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

const { LedgerSigner } = require("@anders-t/ethers-ledger");
const fs = require("fs");
const GL = 30000000; //21000 * 1500;

const { largeToString } = require("./utils");

async function deposit(hre, addrPath, configPath) {
    const addresses_file = fs.readFileSync(addrPath);
    const addresses = JSON.parse(addresses_file);

    const deploy_config_file = fs.readFileSync(configPath);
    const deploy_config = JSON.parse(deploy_config_file);
    const ethers = hre.ethers;

    const amount = largeToString(deploy_config.members[0].stake);

    console.log("start staking")

    deployer = new LedgerSigner(ethers.provider, null);
    // deployer = deployer.connect(ethers.provider);
    const deployerAddress = await deployer.getAddress();
    
    const stakingDelegator = await hre.ethers.getContractAt("StakingImp", addresses.STAKING_ADDRESS, deployer);
    console.log("staking amount ", amount.toString());
    let txs = []
    txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
    tx = await stakingDelegator.connect(deployer).deposit({ value: amount, gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    await tx.wait();
    txs.push(tx);

    let txFile = {};
    txFile.txs = txs;
    let receiptFile = {};
    fs.writeFileSync("./ledger/deposit_Txs"+deployerAddress+".json", JSON.stringify(txFile, null, 2), "utf-8");
    receipts = [];
    for (i = 0; i < txs.length; i++) {
        hash = txs[i].hash;
        receipt = await ethers.provider.getTransactionReceipt(hash);
        receipts.push(receipt);
        if (receipt == null || receipt.status == 0) {
            console.log(i, "is not ok");
        } else {
            console.log(i, "is ok");
        }
    }
    receiptFile.receipts = receipts;

    fs.writeFileSync("./ledger/deposit_txs"+deployerAddress+"_receipts.json", JSON.stringify(receiptFile, null, 2), "utf-8");
    console.log("Writing receipt To contracts.json");

}
module.exports = { deposit };
