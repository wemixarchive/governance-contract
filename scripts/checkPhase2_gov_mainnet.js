const {ethers} = require("hardhat");
const B322S = ethers.utils.formatBytes32String;

 async function getGovs(){
    const mainnetrpc = "https://api.wemix.com" // "http://127.0.0.1:8545"// "https://api.wemix.com"
    const overrideProvider = new ethers.providers.JsonRpcProvider(mainnetrpc);
    overrideProvider.getFeeData = async () => {
        return {
            gasPrice : ethers.utils.parseUnits("101", "gwei"),
            maxFeePerGas : ethers.utils.parseUnits("101", "gwei"),
            maxPriorityFeePerGas : ethers.utils.parseUnits("100", "gwei"),
            lastBaseFeePerGas : ethers.utils.parseUnits("1", "wei"),
        };
    };
    const signers = await ethers.getSigners();
    const wallet = (ethers.Wallet.createRandom()).connect(overrideProvider);
    const registry_mainnet = await ethers.getContractAt('Registry', '0x2e051a657014024f3e6099fbf3931f8dc14ef0f8', (wallet));
    const gov_mainnet = await ethers.getContractAt('GovImp', await registry_mainnet.getContractAddress(B322S('GovernanceContract')), wallet)
    const ballot_mainnet = await ethers.getContractAt('BallotStorage', await registry_mainnet.getContractAddress(B322S('BallotStorage')), wallet)
    const envStorage_mainnet = await ethers.getContractAt('EnvStorageImp', await registry_mainnet.getContractAddress(B322S('EnvStorage')), wallet)
    const staking_mainnet = await ethers.getContractAt('StakingImp', await registry_mainnet.getContractAddress(B322S('Staking')), wallet)

    const registry = await ethers.getContractAt('Registry', '0x2e051a657014024f3e6099fbf3931f8dc14ef0f8');
    const gov = await ethers.getContractAt('GovImp', await registry.getContractAddress(B322S('GovernanceContract')));
    const ballot = await ethers.getContractAt('BallotStorage', await registry.getContractAddress(B322S('BallotStorage')))
    const envStorage = await ethers.getContractAt('EnvStorageImp', await registry.getContractAddress(B322S('EnvStorage')))
    const staking = await ethers.getContractAt('StakingImp', await registry.getContractAddress(B322S('Staking')))

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
            gov: gov,
            ballot: ballot,
            envStorage: envStorage,
            staking: staking,
        },
    };
}

module.exports = {
    getGovs,
};