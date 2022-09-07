// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

const fs =require('fs')
const GL = 21000 * 1500;

const {largeToString} = require('./utils')

async function deployGov(hre, pw, accsPath, configPath) {

    const accs_file = fs.readFileSync(accsPath);
    const accs = JSON.parse(accs_file).accs;

    const deploy_config_file = fs.readFileSync(configPath);
    const deploy_config = JSON.parse(deploy_config_file);
    const ethers = hre.ethers;

    const BigNumber = ethers.BigNumber; //require('bignumber.js');

    const U2B = ethers.utils.toUtf8Bytes;
    const U2S = ethers.utils.toUtf8String;

    const B322S = ethers.utils.formatBytes32String;
    const amount = largeToString(deploy_config.members[0].stake);

    deployer = await ethers.Wallet.fromEncryptedJson(JSON.stringify(accs[0]), pw); //accs[0];
    deployer = deployer.connect(ethers.provider);
    console.log("deployer ", deployer.address);
    let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
    let Registry = await hre.ethers.getContractFactory("Registry", deployer);
    let EnvStorageImp = await hre.ethers.getContractFactory("EnvStorageImp", deployer);
    let Staking = await hre.ethers.getContractFactory("Staking", deployer);
    let BallotStorage = await hre.ethers.getContractFactory("BallotStorage", deployer);
    let EnvStorage = await hre.ethers.getContractFactory("EnvStorage", deployer);
    let GovImp = await hre.ethers.getContractFactory("GovImp", deployer);
    let StakingImp = await hre.ethers.getContractFactory("StakingImp", deployer);
    let txnonce = await ethers.provider.getTransactionCount(deployer.address);
    console.log("deploy reg, envimp");
    const [registry, envStorageImp, stakingImp] = await Promise.all([
        Registry.deploy({ gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }),
        EnvStorageImp.deploy({ gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }), //await EnvStorageImp.new();
        StakingImp.deploy({ gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }), //await EnvStorageImp.new();
    ]);
    // console.log("Waiting reg, envimp")
    // await Promise.all([ registry.deployed(), envStorageImp.deployed()])

    console.log("deploy staking, ballotStorage, envStorage, govImp");
    const [staking, ballotStorage, envStorage, govImp] = await Promise.all([
        Staking.deploy(stakingImp.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }), //await Staking.new(registry.address,"");
        BallotStorage.deploy(registry.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }), //await BallotStorage.new(registry.address);
        EnvStorage.deploy(envStorageImp.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }),
        GovImp.deploy({ gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }),
    ]);
    // console.log(staking)
    // let receipt = await txParam

    console.log("GovImp : ", govImp.address);

    let Gov = await hre.ethers.getContractFactory("Gov", deployer);
    const gov = await Gov.deploy(govImp.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ });
    const stakingDelegator = await hre.ethers.getContractAt("StakingImp", staking.address, deployer);

    // console.log("Waiting for receipt...")
    // await Promise.all([staking.deployed(), ballotStorage.deployed(), envStorage.deployed(), govImp.deployed(), gov.deployed()]);

    // Initialize environment storage
    envDelegator = await hre.ethers.getContractAt("EnvStorageImp", envStorage.address, deployer); //EnvStorageImp.at(envStorage.address);


    const envParams = {
        blocksPer: 1,
        ballotDurationMin: 86400, // 1 day
        ballotDurationMax: 604800, // 7 days
        stakingMin: amount, // 1,500,000 wemix
        stakingMax: amount, // 1,500,000 wemix
        MaxIdleBlockInterval: 5,
        blockCreationTime: 1000, // 1000 ms = 1 sec
        blockRewardAmount: "1000000000000000000", // 1 wemix
        maxPriorityFeePerGas: "100000000000", // 100 gwei
        blockRewardDistributionBlockProducer: 4000, // 40%
        blockRewardDistributionStakingReward: 1000, // 10%
        blockRewardDistributionEcosystem: 2500, // 25%
        blockRewardDistributionMaintenance: 2500, // 25%
        maxBaseFee: "5000000000000", // 50000 gwei
        blockGasLimit: "1050000000", // 21000 gas/tx * 5000 tx
        baseFeeMaxChangeRate: 55,
        gasTargetPercentage: 30,
    };

    const txs = await Promise.all([
        registry.setContractDomain(B322S("Staking"), staking.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }),
        registry.setContractDomain(B322S("EnvStorage"), envStorage.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }),
        registry.setContractDomain(B322S("BallotStorage"), ballotStorage.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }),
        registry.setContractDomain(B322S("GovernanceContract"), gov.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }),
        registry.setContractDomain(B322S("StakingReward"), deploy_config.staker, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }),
        registry.setContractDomain(B322S("Ecosystem"), deploy_config.ecosystem, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }),
        registry.setContractDomain(B322S("Maintenance"), deploy_config.maintenance, {
            gasLimit: txParam.gasLimit,
            gasPrice: txParam.gasPrice,
            nonce: txnonce++,
        }),
    ]);

    const envNames = Object.keys(envParams);
    let envNamesBytes = [];
    
    for (let i = 0; i < envNames.length; i++) {
        envNamesBytes.push(ethers.utils.keccak256(U2B(envNames[i])));
    }
    const envVariables = Object.values(envParams);
    txParam = { gasLimit: GL, gasPrice: await ethers.provider.getGasPrice() };
    console.log("Init env storage");
    tx = await envDelegator.initialize(registry.address, envNamesBytes, envVariables, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ });
    txs.push(tx);
    // // Initialize for staking
    console.log("staking amount ", amount.toString());
    txParam = { gasLimit: GL, gasPrice: await ethers.provider.getGasPrice() };
    tx = await stakingDelegator.init(registry.address, '0x',{  gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ });
    txs.push(tx)
    tx = await stakingDelegator.connect(deployer).deposit({ value: amount, gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ });
    txs.push(tx)
    // Initialize governance
    txParam = { gasLimit: GL, gasPrice: await ethers.provider.getGasPrice() };

    govDelegator = await hre.ethers.getContractAt("GovImp", gov.address, deployer); //await GovImp.at(govDelegator.address);
    // Initialize governance
    console.log("init gov", registry.address);
    txParam = { gasLimit: GL, gasPrice: await ethers.provider.getGasPrice() };
    tx = await govDelegator.init(
        registry.address,
        amount,
        U2B(deploy_config.members[0].name),
        deploy_config.members[0].id,
        U2B(deploy_config.members[0].ip),
        deploy_config.members[0].port,
        { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice, nonce: txnonce++ }
    );
    txs.push(tx);
    // tx = await registry.setMagicNumber("0x57656d6978205265676973747279");
    // txs.push(tx);
    txs.push(registry.deployTransaction);
    txs.push(envStorage.deployTransaction);
    txs.push(envStorageImp.deployTransaction);
    txs.push(ballotStorage.deployTransaction);
    txs.push(staking.deployTransaction);
    txs.push(stakingImp.deployTransaction);
    txs.push(gov.deployTransaction);
    txs.push(govImp.deployTransaction);
    let txFile = {}
    txFile.txs = txs;
    let receiptFile = {};
    fs.writeFileSync('txs.json', JSON.stringify(txFile, null, 2), 'utf-8');
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

    fs.writeFileSync('govDeploy_receipts.json', JSON.stringify(receiptFile, null, 2), 'utf-8');
    console.log("Writing Contract Address To contracts.json");

    const contractData = {};
    contractData.REGISTRY_ADDRESS = registry.address;
    contractData.STAKING_ADDRESS = staking.address;
    contractData.ENV_STORAGE_ADDRESS = envStorage.address;
    contractData.BALLOT_STORAGE_ADDRESS = ballotStorage.address;
    contractData.GOV_ADDRESS = gov.address;
    contractData.GOV_IMP_ADDRESS = govImp.address;
    console.log(contractData)

    fs.writeFileSync("gov_contracts.json", JSON.stringify(contractData), "utf-8", function (e) {
        if (e) {
            console.log(e);
        } else {
            console.log("gov_contracts.json updated!");
        }
    });

}

module.exports = { deployGov };
