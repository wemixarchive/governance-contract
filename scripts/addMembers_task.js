const addresses = require("../addresses"); // require("../contracts.json");
const fs = require("fs");

const accs = require("../accounts_test").accs;
const deploy_config = require("../deploy_config_test.json");

const amount = "1500000" + "0".repeat(18);
const duration = 86400;

async function addMembers(hre, pw) {
    const ethers = hre.ethers;

    const BigNumber = hre.ethers.BigNumber; 

    const U2B = ethers.utils.toUtf8Bytes;

    let provider = await ethers.provider;
    let members = deploy_config.members;
    if (accs.length != members.length) {
        console.log("accounts length is not equal members length");
        return;
    }
    //remove first node
    members.shift();

    let firstMember;
    let accounts = await Promise.all(
        accs.map((acc, idx)=>{
            return ethers.Wallet.fromEncryptedJson(JSON.stringify(acc), pw).then(console.log("unlock",idx))
        })
    )
    for(i=0;i<accounts.length;i++){
        accounts[i] = accounts[i].connect(provider);
    }
    firstMember = accounts.shift();

    GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
    maxPFee = "100" + "0".repeat(9);
    let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
    let staking = await ethers.getContractAt("Staking", addresses.STAKING_ADDRESS);
    let govDelegator = await ethers.getContractAt("GovImp", addresses.GOV_ADDRESS);
    let ballotLen = await govDelegator.ballotLength();
    let txs = [];
    for (idx = 0; idx < accounts.length; idx++) {
        console.log("staking ", idx);

        tx = await staking.connect(accounts[idx]).deposit({ value: amount, gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
        txs.push(tx);
    }
    for (idx = 0; idx < accounts.length; idx++) {
        let govMemberLen = idx + 1; //await govDelegator.getMemberLength();
        console.log("Current member length : " + govMemberLen);

        console.log("Add " + (idx + 2) + "-th member proposal");

        tx = await govDelegator
            .connect(firstMember)
            .addProposalToAddMember(
                [
                    accounts[idx].address,
                    accounts[idx].address,
                    accounts[idx].address,
                    U2B(members[idx].name),
                    members[idx].id,
                    U2B(members[idx].ip),
                    members[idx].port,
                    amount,
                    U2B("add member " + idx),
                    duration,
                ],
                txParam
            );
        txs.push(tx);
        ballotLen = ballotLen.add(BigNumber.from(1));
        console.log("ballotLen ", ballotLen);

        console.log("limit ", parseInt(govMemberLen / 2 + 1));
        console.log("first vote");
        tx = await govDelegator.connect(firstMember).vote(ballotLen, true, txParam);
        txs.push(tx);
        for (memIdx = 0; memIdx < parseInt(govMemberLen / 2); memIdx++) {
            console.log(memIdx + 2 + "-th vote");
            tx = await govDelegator.connect(accounts[memIdx]).vote(ballotLen, true, txParam);

            txs.push(tx);
        }
    }
    let txsfile = {};
    txsfile.txs = txs;
    fs.writeFileSync("txs.json", JSON.stringify(txsfile), "utf-8", function (e) {
        if (e) {
            console.log(e);
        } else {
            console.log("txs.json updated!");
        }
    });
    for(i=0;i<txs.length;i++){
        hash = txs[i].hash;
        receipt = await ethers.provider.getTransactionReceipt(hash)

        if(receipt.status == 0){
            console.log(i, "is not ok")
        }
        else{console.log(i,"is ok")}
    }
}
module.exports = {addMembers}