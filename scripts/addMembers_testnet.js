
const { ethers } = require("hardhat");
const addresses = require("../addresses");

const accs = require("../accounts").accs;
const members = require("../member").members;

const BigNumber = hre.ethers.BigNumber; //require('bignumber.js', deployer);

const U2B = ethers.utils.toUtf8Bytes;
const U2S = ethers.utils.toUtf8String;

const B322S = hre.ethers.utils.formatBytes32String;

const zeroAddress = "0x" + "0".repeat(40);
const amount = "1500000" + "0".repeat(18); //BigNumber.from('5'+'0'.repeat(24));
const duration = 86400;

async function main() {
    // let accs = await hre.ethers.getSigners();
    if (accs.length != members.length) {
        console.log("accounts file length is not equal members file length");
        return;
    }
    accounts = [];
    let provider = await ethers.provider;
    for (i = 0; i < accs.length; i++) {
        accounts.push(await ethers.Wallet.fromEncryptedJson(JSON.stringify(accs[i]), "account_password_required"));
        accounts[i] = accounts[i].connect(provider);
        console.log("unlock", i);
    }
    GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
    maxPFee = "100" + "0".repeat(9);
    let txParam = { gasLimit: GL, gasPrice: await ethers.provider.getGasPrice() };

    let staking = await ethers.getContractAt("Staking", addresses.STAKING_ADDRESS);
    let govDelegator = await ethers.getContractAt("GovImp", addresses.GOV_ADDRESS);
    let ballotStorage = await ethers.getContractAt("BallotStorage", addresses.BALLOT_STORAGE_ADDRESS);
    for (idx = 1; idx < members.length; idx++) {
        let govMemberLen = await govDelegator.getMemberLength();
        console.log("Current member length : " + govMemberLen);
        console.log("staking ", idx);

        txParam = { gasLimit: GL, gasPrice: await ethers.provider.getGasPrice() };
        tx = await staking.connect(accounts[idx]).deposit({ value: amount, gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
        await tx.wait();

        console.log("Add " + idx + "-th member proposal");

        txParam = { gasLimit: GL, gasPrice: await ethers.provider.getGasPrice() };
        tx = await govDelegator
            .connect(accounts[0])
            .addProposalToAddMember(
                [
                    accs[idx].address,
                    accs[idx].address,
                    accs[idx].address,
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
        await tx.wait();
        let ballotLen = await govDelegator.ballotLength();
        console.log("ballotLen ", ballotLen);

        // let state = await ballotStorage.getBallotState(ballotLen);
        // console.log("state", state);
        // let ballotBasic = await ballotStorage.getBallotBasic(ballotLen);
        // console.log("basic");
        // console.log(ballotBasic);
        // let ballotInfo = await ballotStorage.getBallotMember(ballotLen);
        // console.log("info");
        // console.log(ballotInfo);
        console.log("limit ", parseInt(govMemberLen / 2 + 1));
        for (memIdx = 0; memIdx < parseInt(govMemberLen / 2 + 1); memIdx++) {
            txParam = { gasLimit: GL, gasPrice: await ethers.provider.getGasPrice() };

            console.log(memIdx + 1 + "-th vote");
            tx = await govDelegator.connect(accounts[memIdx]).vote(ballotLen, true, txParam);
            await tx.wait();
            let len = await govDelegator.voteLength();
            console.log("len ", len);
        }
        let inVoting = await govDelegator.getBallotInVoting();
        console.log("inVoting", inVoting);
        state = await ballotStorage.getBallotState(ballotLen);
        console.log("state", state);
        console.log("End vote");
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
