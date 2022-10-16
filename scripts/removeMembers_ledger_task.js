const fs = require("fs");
const { largeToString, ledgerSignAndClose } = require("./utils");

async function removeMember(hre, addrPath, configPath, removeMemberInfo) {
    console.log(addrPath, configPath, removeMemberInfo)
    const addresses_file = fs.readFileSync(addrPath);
    const addresses = JSON.parse(addresses_file);
    const removeInfo_file = fs.readFileSync(removeMemberInfo);
    const removeInfo = JSON.parse(removeInfo_file);
    const deploy_config_file = fs.readFileSync(configPath);
    const deploy_config = JSON.parse(deploy_config_file);

    const ethers = hre.ethers;

    const BigNumber = hre.ethers.BigNumber;

    const U2B = ethers.utils.toUtf8Bytes;

    let provider = await ethers.provider;
    let members = deploy_config.members;

    GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
    maxPFee = "100" + "0".repeat(9);
    console.log("set ledger");
    await setLedgerSetting();
    console.log("set ledger fin");
    let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
    let staking = await ethers.getContractAt("StakingImp", addresses.STAKING_ADDRESS);
    let govDelegator = await ethers.getContractAt("GovImp", addresses.GOV_ADDRESS);
    let txs = [];

    const duration = await govDelegator.getMinVotingDuration();
    let govMemberLen = await govDelegator.getMemberLength();
    console.log("Current member length : " + govMemberLen);

    console.log("remove " + removeInfo.addr + " member proposal");

    let popTx = await govDelegator.populateTransaction.addProposalToRemoveMember(
        removeInfo.addr,
        largeToString(removeInfo.stake),
        U2B(removeInfo.memo),
        duration
    );
    popTx.gasLimit = GL;
    let utx = await govDelegator.signer.populateTransaction(popTx);
    delete utx.from;
    delete utx.nonce;
    delete utx.maxFeePerGas;
    delete utx.maxPriorityFeePerGas;
    let stx = await ledgerSignAndClose(removeInfo.from, utx, ethers);
    tx = await ethers.provider.sendTransaction(stx);
    txs.push(tx);
    await tx.wait();
    
    let ballotLen = (await govDelegator.ballotLength());
    console.log("ballotLen ", ballotLen);
    console.log("limit ", parseInt(govMemberLen / 2 + 1));
    for (memIdx = 0; memIdx < parseInt(govMemberLen / 2 + 1); memIdx++) {
        console.log(memIdx + 1 + "-th vote");
        let popTx = await govDelegator.populateTransaction.vote(ballotLen, true);
        popTx.gasLimit = GL;
        let utx = await govDelegator.signer.populateTransaction(popTx);
        delete utx.from;
        delete utx.nonce;
        delete utx.maxFeePerGas;
        delete utx.maxPriorityFeePerGas;
        let stx = await ledgerSignAndClose(members[memIdx].addr, utx, ethers);
        let tx = await ethers.provider.sendTransaction(stx);
        txs.push(tx);
    }
    let txsfile = {};
    txsfile.txs = txs;
    fs.writeFileSync("removeMem_ledger_txs.json", JSON.stringify(txsfile), "utf-8", function (e) {
        if (e) {
            console.log(e);
        } else {
            console.log("txs.json updated!");
        }
    });
    for (i = 0; i < txs.length; i++) {
        hash = txs[i].hash;
        receipt = await ethers.provider.getTransactionReceipt(hash);

        if (receipt == null || receipt.status == 0) {
            console.log(i, "is not ok");
        }
    }
}
module.exports = { removeMember };
