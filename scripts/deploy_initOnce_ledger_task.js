// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

const { LedgerSigner } = require("@anders-t/ethers-ledger");
const fs =require('fs')
const GL = 30000000;//21000 * 1500;

const {largeToString} = require('./utils')

async function initOnce(hre, addrPath, configPath) {
    const addresses_file = fs.readFileSync(addrPath);
    const addresses = JSON.parse(addresses_file);

    const deploy_config_file = fs.readFileSync(configPath);
    const deploy_config = JSON.parse(deploy_config_file);
    const ethers = hre.ethers;

    const BigNumber = ethers.BigNumber; //require('bignumber.js');

    const U2B = ethers.utils.toUtf8Bytes;
    const U2S = ethers.utils.toUtf8String;

    const B322S = ethers.utils.formatBytes32String;
    const amount = largeToString(deploy_config.members[0].stake);

    let txs = [];

    // console.log(getInitOnceData(deploy_config, ethers))

    // signer0 = (await ethers.getSigners())[0]
    deployer = new LedgerSigner(ethers.provider, null);
    // deployer = deployer.connect(ethers.provider);
    // await signer0.sendTransaction({to:deployer.address, value:'100'+'0'.repeat(18)})
    console.log("deployer ", await deployer.getAddress());
    
    
    // Initialize governance
    txParam = { gasLimit: GL, gasPrice: '110'+'0'.repeat(9) };

    govDelegator = await hre.ethers.getContractAt("GovImp", addresses.GOV_ADDRESS, deployer); //await GovImp.at(govDelegator.address);
    // Initialize governance
    // tx = await govDelegator.init(
    //     registry.address,
    //     amount,
    //     U2B(deploy_config.members[0].name),
    //     deploy_config.members[0].id,
    //     U2B(deploy_config.members[0].ip),
    //     deploy_config.members[0].port,
    //     { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }
    // );
    let data = getInitOnceData(deploy_config, ethers)
    tx = await govDelegator.initOnce( amount, data,  { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice});
    await tx.wait();
    txs.push(tx);

    let txFile = {}
    txFile.txs = txs;
    let receiptFile = {};
    fs.writeFileSync('./ledger/initOnce.json', JSON.stringify(txFile, null, 2), 'utf-8');
    receipts = []
    for(i=0;i<txs.length;i++){
        hash = txs[i].hash;
        receipt = await ethers.provider.getTransactionReceipt(hash)
        receipts.push(receipt);
        if(receipt.status == 0){
            console.log(i, "is not ok")
        }
        else{console.log(i,"is ok")}
    }
    receiptFile.receipts = receipts;

    fs.writeFileSync('./ledger/initOnce_receipts.json', JSON.stringify(receiptFile, null, 2), 'utf-8');

}
function getInitOnceData(data, ethers){
    const U2B = ethers.utils.toUtf8Bytes;
    var nodes = "0x";

    for(var i=1, l=data.members.length; i<l;i++){
        var m = data.members[i], id, staker, voter, reward;
        if(m.id.length != 128 && m.id.length != 130){
            throw "Invalid enode id "+m.id
        }
        id = m.id.length == 128 ? m.id : m.id.substr(2);
        staker = m.staker//.indexOf("0x") != 0 ? m.staker : m.staker.substr(2);
        voter = m.voter//.indexOf("0x") != 0 ? m.voter : m.voter.substr(2);
        reward = m.reward//.indexOf("0x") != 0 ? m.reward : m.reward.substr(2);

        nodes += ethers.utils.hexZeroPad(staker, 32).substr(2)
        + ethers.utils.hexZeroPad(voter, 32).substr(2)
        + ethers.utils.hexZeroPad(reward, 32).substr(2)
        + packNum(m.name.length).substr(2) + ethers.utils.hexlify(U2B(m.name)).substr(2)
        + packNum(id.length / 2).substr(2) + id
        + packNum(m.ip.length).substr(2) + ethers.utils.hexlify(U2B(m.ip)).substr(2)
        + packNum(m.port).substr(2)
    }
    return nodes;
}

function packNum(num){
    return ethers.utils.hexZeroPad(ethers.utils.hexlify(num), 32)
}
module.exports = { initOnce };
