
async function sendTxKeep(hre, sets, fromIdx, toIdx, value) {
    let i = 0;
    from = sets.accounts[fromIdx];
    to = sets.accounts[toIdx];
    while(1){
        i++;
        gasPrice =  await hre.ethers.provider.getGasPrice()
        tx = await from.sendTransaction({to:to.address, value:value, gasPrice : gasPrice});
        console.log("send "+i+"-th tx, gasPrice : ",gasPrice);
        if(i % 10 == 0) await tx.wait();
    }
}


module.exports = {sendTxKeep};
