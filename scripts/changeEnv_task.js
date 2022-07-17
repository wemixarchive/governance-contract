
async function changeEnvVal(hre, setts, envName, types, values, msg) {
    const ethers = hre.ethers;
const U2B = ethers.utils.toUtf8Bytes;

    console.log("setting...")
    let testAccs, gov, envD, ballotS, provider;
    // let setts = await setting.set();
    testAccs = setts.accounts;
    gov = setts.govDelegator;
    envD = setts.envDelegator;
    ballotS = setts.ballotStorage;
    provider = setts.provider;
    // envName = maxPriorityFeePerGas
    console.log("change :",envName)


    bfMP = await envD.getMaxPriorityFeePerGas();
    bfGLB = await envD.getGasLimitAndBaseFee();
    bfMB = await envD.getMaxBaseFee();

    // Initialize governance

    txParam = { gasPrice: await ethers.provider.getGasPrice() };
    tx = await gov.addProposalToChangeEnv(ethers.utils.keccak256(U2B(envName)), 2, type2Bytes(ethers, types, values), U2B(msg), 86400, txParam );
    await tx.wait();
    txParam = {  gasPrice: await ethers.provider.getGasPrice() };
    let ballotLen = await gov.ballotLength()
    console.log("ballotLen ",ballotLen);
    console.log("tx 1")
    tx = await gov.connect(testAccs[0]).vote(ballotLen, true, txParam);
    await tx.wait();

    txParam = { gasPrice: await ethers.provider.getGasPrice() };
    console.log("tx 2")
    tx = await gov.connect(testAccs[1]).vote(ballotLen, true, txParam);
    await tx.wait();

    txParam = {  gasPrice: await ethers.provider.getGasPrice() };
    console.log("tx 3")
    tx = await gov.connect(testAccs[2]).vote(ballotLen, true, txParam);
    await tx.wait();
    inVoting = await gov.getBallotInVoting();
    console.log("inVoting",inVoting)
    state = await ballotS.getBallotState(ballotLen);
    console.log("state",state)

    afterMP = await envD.getMaxPriorityFeePerGas();
    afterGLB = await envD.getGasLimitAndBaseFee();
    afterMB = await envD.getMaxBaseFee();
    console.log("max priority", bfMP,"->",afterMP);
    console.log("blockGasLimit", bfGLB[0],"->",afterGLB[0]);
    console.log("baseFeeMaxChangeRate", bfGLB[1],"->",afterGLB[1]);
    console.log("gasTargetPercentage", bfGLB[2],"->",afterGLB[2]);
    console.log("maxBaseFee", bfMB,"->",afterMB);
}


module.exports = {changeEnvVal};

function type2Bytes(ethers, types, inputs) {
    const ABICoder = ethers.utils.AbiCoder;
    const abiCoder = new ABICoder();

    let parameters = abiCoder.encode(types, inputs);
    return parameters;
}
