const {ethers} = require("hardhat");
const B322S = ethers.utils.formatBytes32String;

 async function getGovs(){
    const mainnetrpc = "https://api.test.wemix.com" // "http://127.0.0.1:8545"// "https://api.wemix.com"
    const overrideProvider = new ethers.providers.JsonRpcProvider(mainnetrpc);
    overrideProvider.getFeeData = async () => {
        return {
            gasPrice : ethers.utils.parseUnits("101", "gwei"),
            maxFeePerGas : ethers.utils.parseUnits("101", "gwei"),
            maxPriorityFeePerGas : ethers.utils.parseUnits("100", "gwei"),
            lastBaseFeePerGas : ethers.utils.parseUnits("1", "wei"),
        };
    };
    const wallet = (ethers.Wallet.createRandom()).connect(overrideProvider);
    const registry_mainnet = await ethers.getContractAt('Registry', '0xa68a135ccd37e720000fc30cfcc453b15f8040df', (wallet));
    const gov_mainnet = await ethers.getContractAt('GovImp', await registry_mainnet.getContractAddress(B322S('GovernanceContract')), wallet)
    const ballot_mainnet = await ethers.getContractAt('BallotStorage', await registry_mainnet.getContractAddress(B322S('BallotStorage')), wallet)
    const envStorage_mainnet = await ethers.getContractAt('EnvStorageImp', await registry_mainnet.getContractAddress(B322S('EnvStorage')), wallet)
    const staking_mainnet = await ethers.getContractAt('StakingImp', await registry_mainnet.getContractAddress(B322S('Staking')), wallet)

    const registry = await ethers.getContractAt('Registry', '0xa68a135ccd37e720000fc30cfcc453b15f8040df');
    const gov = await ethers.getContractAt('TestnetGovImp', await registry.getContractAddress(B322S('GovernanceContract')));
    const ballot = await ethers.getContractAt('BallotStorage', await registry.getContractAddress(B322S('BallotStorage')))
    const envStorage = await ethers.getContractAt('EnvStorageImp', await registry.getContractAddress(B322S('EnvStorage')))
    const staking = await ethers.getContractAt('StakingImp', await registry.getContractAddress(B322S('Staking')))

    const TestnetGovImp = await ethers.getContractFactory("TestnetGovImp");
    const testnetGovImp = await TestnetGovImp.deploy();
    await testnetGovImp.deployed();
    let imps = [];
    const signer =( await ethers.getSigners())[0];
    console.log("Start")
    const memberLength = await gov.getMemberLength();
    for(let i=0;i < memberLength;i++){
        const member = await gov.getVoter(i+1);
        await signer.sendTransaction({to:member, value:ethers.utils.parseEther("1")});
        imps.push(await ethers.getImpersonatedSigner(member));
    }
    console.log(imps[0].address)
    await gov.connect(imps[0]).addProposalToChangeGov(testnetGovImp.address, "0x", 86400);
    console.log("propose new imp", await gov.ballotLength());
    const ballotNum = await gov.ballotLength();
    await Promise.all(imps.map(async (imp, id) => {
        if(memberLength/2 + 1 > id)
            await gov.connect(imp).vote(ballotNum, true);
    }));

    console.log(await gov.getBallotInVoting(), await gov.ballotLength());

    const GovImp = await ethers.getContractFactory("GovImp");
    const newGovImp = await GovImp.deploy();
    await newGovImp.deployed();
    const Gov = await ethers.getContractFactory("Gov");
    const newGov = await Gov.deploy(newGovImp.address);
    await newGov.deployed();
    const ownerAddr = await registry.owner();
    const owner = await ethers.getImpersonatedSigner(ownerAddr);
    await gov.connect(owner).maigration(newGov.address);
    await registry.connect(owner).setContractDomain(B322S("GovernanceContract"), newGov.address);
    

    return {
        mainnet: {
            registry: registry_mainnet,
            gov: gov_mainnet,
            ballot: ballot_mainnet,
            envStorage: envStorage_mainnet,
            staking: staking_mainnet,
        },
        localhost: {
            registry: registry,
            gov: await ethers.getContractAt('GovImp', newGov.address),
            ballot: ballot,
            envStorage: envStorage,
            staking: staking,
        },
    };
}

module.exports = {
    getGovs,
};