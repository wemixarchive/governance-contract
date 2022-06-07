pragma solidity ^0.8.0;
// pragma abicod

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../abstract/EnvConstants.sol";
import "../abstract/AEnvStorage.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract EnvStorageImp is AEnvStorage, EnvConstants, UUPSUpgradeable {
    using SafeMath for uint256;

    // struct EnvInitInfo{
    //     uint256 blocksPer;
    //     uint256 ballotDurationMin;
    //     uint256 ballotDurationMax;
    //     uint256 stakingMin;
    //     uint256 stakingMax;
    //     uint256 gasPrice;
    //     uint256 maxIdleBlockInterval;
    //     //======NXTMeta=====
    //     uint256 blockCreationTime;
    //     uint256 blockRewardAmount;
    //     uint256 maxPriorityFeePerGas;
    //     uint256 blockRewardDistributionBlockProducer;
    //     uint256 blockRewardDistributionStakingReward;
    //     uint256 blockRewardDistributionEcoSystem;
    //     uint256 blockRewardDistributionMaintanance;
    //     uint256 gasLimit;
    //     uint256 baseFeeMaxChangeDenominator;
    //     uint256 elasticityMultiplier;
    // }
    function initialize(
        bytes32[] memory names,
        uint256[] memory infos
        // EnvInitInfo memory infos
        // uint256 _blocksPer, 
        // uint256 _ballotDurationMin,
        // uint256 _ballotDurationMax,
        // uint256 _stakingMin,
        // uint256 _stakingMax,
        // uint256 _gasPrice,
        // uint256 _maxIdleBlockInterval
    ) public onlyOwner {
        // uint256 blocksPer = getBlocksPer();
        // uint256 ballotDurationMin = getBallotDurationMin();
        // uint256 ballotDurationMax = getBallotDurationMax();
        // uint256 stakingMin = getStakingMin();
        // uint256 stakingMax = getStakingMax();
        // uint256 gasPrice = getGasPrice();
        // uint256 maxIdleBlockInterval = getMaxIdleBlockInterval();

        // require(infos.blocksPer != 0 || blocksPer != 0, "invalid blocksPer values");
        // require(infos.ballotDurationMin != 0 || ballotDurationMin != 0, "invalid ballotDurationMin values");
        // require(infos.ballotDurationMax != 0 || ballotDurationMax != 0, "invalid ballotDurationMax values");
        // require(infos.stakingMin != 0 || stakingMin != 0, "invalid stakingMin values");
        // require(infos.stakingMax != 0 || stakingMax != 0, "invalid stakingMax values");
        // require(infos.gasPrice != 0 || gasPrice != 0, "invalid gasPrice values");
        // require(infos.maxIdleBlockInterval != 0 || maxIdleBlockInterval != 0, "invalid max Idle Block Interval values");
        // if (blocksPer == 0) {
        //     setUint(BLOCKS_PER_NAME, infos.blocksPer);
        // }
        // if (ballotDurationMin == 0) {
        //     setUint(BALLOT_DURATION_MIN_NAME, infos.ballotDurationMin);
        // }
        // if (ballotDurationMax == 0) {
        //     setUint(BALLOT_DURATION_MAX_NAME, infos.ballotDurationMax);
        // }
        // if (stakingMin == 0) {
        //     setUint(STAKING_MIN_NAME, infos.stakingMin);
        // }
        // if (stakingMax == 0) {
        //     setUint(STAKING_MAX_NAME, infos.stakingMax);
        // }
        // if (gasPrice == 0) {
        //     setUint(GAS_PRICE_NAME, infos.gasPrice);
        // }
        // if (maxIdleBlockInterval == 0) {
        //     setUint(MAX_IDLE_BLOCK_INTERVAL_NAME, infos.maxIdleBlockInterval);
        // }

        for(uint i = 0;i<infos.length;i++){
            uint256 temp = getUint(names[i]);
            require(infos[i] !=0 || temp !=0, "invalid variable");
            if(temp == 0){
                setUint(names[i], infos[i]);
            }
        }
        //=====NXTMeta=====/
        // uint256 blockCreationTime = getBlockCreationTime();
        // uint256 blockRewardAmount = getBlockRewardAmount();
        // uint256 maxPriorityFeePerGas = getMaxPriorityFeePerGas();
        // (uint256 blockRewardDistributionBlockProducer,
        // uint256 blockRewardDistributionStakingReward,
        // uint256 blockRewardDistributionEcoSystem,
        // uint256 blockRewardDistributionMaintanance) = getBlockRewardDistributionMethod();
        // (uint256 gasLimit,
        // uint256 baseFeeMaxChangeDenominator,
        // uint256 elasticityMultiplier) = getGasLimitAndBaseFee();
        // //=====NXTMeta=====/
        // if (blockCreationTime == 0) {
        //     setUint(BLOCK_CREATION_TIME, infos.blockCreationTime);
        // }

        // if (blockRewardAmount == 0) {
        //     setUint(BLOCK_REWARD_AMOUNT, infos.blockRewardAmount);
        // }

        // if (maxPriorityFeePerGas == 0) {
        //     setUint(MAX_PRIORITY_FEE_PER_GAS, infos.maxPriorityFeePerGas);
        // }

        // if (blockRewardDistributionBlockProducer == 0) {
        //     setUint(BLOCK_REWARD_DISTRIBUTION_BLOCK_PRODUCER, infos.blockRewardDistributionBlockProducer);
        // }

    }

    function getBlocksPer() public view returns (uint256) {
        return getUint(BLOCKS_PER_NAME);
    }

    function getBallotDurationMin() public view returns (uint256) {
        return getUint(BALLOT_DURATION_MIN_NAME);
    }

    function getBallotDurationMax() public view returns (uint256) {
        return getUint(BALLOT_DURATION_MAX_NAME);
    }

    function getStakingMin() public view returns (uint256) {
        return getUint(STAKING_MIN_NAME);
    }

    function getStakingMax() public view returns (uint256) {
        return getUint(STAKING_MAX_NAME);
    }

    function getGasPrice() public view returns (uint256) {
        return getUint(GAS_PRICE_NAME);
    }

    function getMaxIdleBlockInterval() public view returns (uint256) {
        return getUint(MAX_IDLE_BLOCK_INTERVAL_NAME);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyGov{}

    function setBlocksPer(uint256 _value) public onlyGov { 
        setUint(BLOCKS_PER_NAME, _value);
    }

    function setBallotDurationMin(uint256 _value) public onlyGov { 
        setUint(BALLOT_DURATION_MIN_NAME, _value);
    }

    function setBallotDurationMax(uint256 _value) public onlyGov { 
        setUint(BALLOT_DURATION_MAX_NAME, _value);
    }

    function setStakingMin(uint256 _value) public onlyGov { 
        setUint(STAKING_MIN_NAME, _value);
    }

    function setStakingMax(uint256 _value) public onlyGov { 
        setUint(STAKING_MAX_NAME, _value);
    }

    function setGasPrice(uint256 _value) public onlyGov { 
        setUint(GAS_PRICE_NAME, _value);
    }
    
    function setMaxIdleBlockInterval(uint256 _value) public onlyGov { 
        setUint(MAX_IDLE_BLOCK_INTERVAL_NAME, _value);
    }

    function setBlocksPerByBytes(bytes memory _value ) public onlyGov { 
        setBlocksPer(toUint(_value));
    }

    function setBallotDurationMinByBytes(bytes memory _value ) public onlyGov { 
        setBallotDurationMin(toUint(_value));
    }

    function setBallotDurationMaxByBytes(bytes memory _value ) public onlyGov { 
        setBallotDurationMax(toUint(_value));
    }

    function setStakingMinByBytes(bytes memory _value ) public onlyGov { 
        setStakingMin(toUint(_value));
    }

    function setStakingMaxByBytes(bytes memory _value ) public onlyGov { 
        setStakingMax(toUint(_value));
    }

    function setGasPriceByBytes(bytes memory _value ) public onlyGov { 
        setGasPrice(toUint(_value));
    }

    function setMaxIdleBlockIntervalByBytes(bytes memory _value ) public onlyGov { 
        setMaxIdleBlockInterval(toUint(_value));
    }

    //=======NXTMeta=======/


    function getBallotDurationMinMax() public view returns (uint256, uint256) {
        return 
        (
            getUint(BALLOT_DURATION_MIN_NAME),
            getUint(BALLOT_DURATION_MAX_NAME)
        );
    }

    function getStakingMinMax() public view returns (uint256, uint256) {
        return 
        (
            getUint(STAKING_MIN_NAME),
            getUint(STAKING_MAX_NAME)
        );
    }

    function getBlockCreationTime() public view returns (uint256) {
        return getUint(BLOCK_CREATION_TIME_NAME);
    }

    function getBlockRewardAmount() public view returns (uint256) {
        return getUint(BLOCK_REWARD_AMOUNT_NAME);
    }

    function getMaxPriorityFeePerGas() public view returns (uint256) {
        return getUint(MAX_PRIORITY_FEE_PER_GAS_NAME);
    }

    function getBlockRewardDistributionMethod() public view returns (uint256,uint256,uint256,uint256) {
        return (
            getUint(BLOCK_REWARD_DISTRIBUTION_BLOCK_PRODUCER_NAME),
            getUint(BLOCK_REWARD_DISTRIBUTION_STAKING_REWARD_NAME),
            getUint(BLOCK_REWARD_DISTRIBUTION_ECOSYSTEM_NAME),
            getUint(BLOCK_REWARD_DISTRIBUTION_MAINTANANCE_NAME)
        );

    }

    function getGasLimitAndBaseFee() public view returns (uint256, uint256, uint256) {
        return (
            getUint(BLOCK_GASLIMIT_NAME),
            getUint(BASE_FEE_MAX_CHANGE_DENOMINATOR_NAME),
            getUint(ELASTICITY_MULTIPLIER_NAME)
        );
    }

    function getStakingRewardAddress() public view returns(address){
        return getAddress(STAKING_REWARD_ADDRESS_NAME);
    }

    function getEcofundAddress() public view returns(address){
        return getAddress(ECOFUND_ADDRESS_NAME);
    }

    function getMaintananceAddress() public view returns(address){
        return getAddress(MAINTANANCE_ADDRESS_NAME);
    }

    function setBallotDurationMinMax(uint256 _min, uint256 _max) public onlyGov { 
        require(_min <= _max, "Minimum duration must be smaller and equal than maximum duration");
        setUint(BALLOT_DURATION_MIN_NAME, _min);
        setUint(BALLOT_DURATION_MAX_NAME, _max);
    }

    function setStakingMinMax(uint256 _min, uint256 _max) public onlyGov { 
        require(_min <= _max, "Minimum staking must be smaller and equal than maximum staking");
        setUint(STAKING_MIN_NAME, _min);
        setUint(STAKING_MAX_NAME, _max);
    }

    function setBlockCreationTime(uint256 _value) public onlyGov { 
        setUint(BLOCK_CREATION_TIME_NAME, _value);
    }

    function setBlockRewardAmount(uint256 _value) public onlyGov { 
        setUint(BLOCK_REWARD_AMOUNT_NAME, _value);
    }

    function setMaxPriorityFeePerGas(uint256 _value) public onlyGov { 
        setUint(MAX_PRIORITY_FEE_PER_GAS_NAME, _value);
    }

    function setBlockRewardDistributionMethod(
        uint256 _block_producer,
        uint256 _staking_reward,
        uint256 _ecofund,
        uint256 _maintanance
        ) public onlyGov {
        require((_block_producer + _staking_reward + _ecofund + _maintanance) == DENOMINATOR,
            "Wrong reward distrubtion ratio");
        setUint(BLOCK_REWARD_DISTRIBUTION_BLOCK_PRODUCER_NAME, _block_producer);
        setUint(BLOCK_REWARD_DISTRIBUTION_STAKING_REWARD_NAME, _staking_reward);
        setUint(BLOCK_REWARD_DISTRIBUTION_ECOSYSTEM_NAME, _ecofund);
        setUint(BLOCK_REWARD_DISTRIBUTION_MAINTANANCE_NAME, _maintanance);
    }

    function setGasLimitAndBaseFee(
        uint256 _block_GasLimit,
        uint256 _baseFeeMaxChangeDenominator,
        uint256 _elasticityMultiplier
        ) public onlyGov { 
        setUint(BLOCK_GASLIMIT_NAME, _block_GasLimit);
        setUint(BASE_FEE_MAX_CHANGE_DENOMINATOR_NAME, _baseFeeMaxChangeDenominator);
        setUint(ELASTICITY_MULTIPLIER_NAME, _elasticityMultiplier);
    }

    function setStakingAddress(address _value) public onlyGov { 
        setAddress(STAKING_REWARD_ADDRESS_NAME, _value);
    }
    function setEcofundAddress(address _value) public onlyGov { 
        setAddress(ECOFUND_ADDRESS_NAME, _value);
    }
    function setMaintananceAddress(address _value) public onlyGov { 
        setAddress(MAINTANANCE_ADDRESS_NAME, _value);
    }

    function setBallotDurationMinMaxByBytes(bytes memory _value ) public onlyGov { 
        (uint256 _min, uint256 _max) = to2Uint(_value);
        setBallotDurationMinMax(_min, _max);
    }

    function setStakingMinMaxByBytes(bytes memory _value ) public onlyGov { 
        (uint256 _min, uint256 _max) = to2Uint(_value);
        setStakingMinMax(_min, _max);
    }

    function setBlockCreationTimeByBytes(bytes memory _value ) public onlyGov { 
        setBlockCreationTime(toUint(_value));
    }

    function setBlockRewardAmountByBytes(bytes memory _value ) public onlyGov { 
        setBlockRewardAmount(toUint(_value));
    }

    function setMaxPriorityFeePerGasByBytes(bytes memory _value ) public onlyGov { 
        setMaxPriorityFeePerGas(toUint(_value));
    }

    function setBlockRewardDistributionMethodByBytes(bytes memory _value ) public onlyGov {
        (uint256 _block_producer,
        uint256 _staking_reward,
        uint256 _ecosystem,
        uint256 _maintanance) = to4Uint(_value);
        setBlockRewardDistributionMethod(
            _block_producer,
            _staking_reward,
            _ecosystem,
            _maintanance
            );
    }

    function setGasLimitAndBaseFeeByBytes(bytes memory _value ) public onlyGov { 
        (
        uint256 _block_GasLimit,
        uint256 _baseFeeMaxChangeDenominator,
        uint256 _elasticityMultiplier
        )= to3Uint(_value);
        setGasLimitAndBaseFee( _block_GasLimit, _baseFeeMaxChangeDenominator, _elasticityMultiplier);
    }

    function setStakingAddressByBytes(bytes memory _value ) public onlyGov { 
        setStakingAddress(toAddress(_value));
    }

    function setEcofundAddressByBytes(bytes memory _value ) public onlyGov { 
        setEcofundAddress(toAddress(_value));
    }

    function setMaintananceAddressByBytes(bytes memory _value ) public onlyGov { 
        setMaintananceAddress(toAddress(_value));
    }

    // function getTestInt() public view returns (int256) {
    //     return getInt(TEST_INT);
    // }

    // function getTestAddress() public view returns (address) {
    //     return getAddress(TEST_ADDRESS);
    // }

    // function getTestBytes32() public view returns (bytes32) {
    //     return getBytes32(TEST_BYTES32);
    // }

    // function getTestBytes() public view returns (bytes) {
    //     return getBytes(TEST_BYTES);
    // }

    // function getTestString() public view returns (string) {
    //     return getString(TEST_STRING);
    // }

    // function setTestIntByBytes(bytes memory _value ) public onlyGov { 
    //     setInt(TEST_INT, toInt(_value));
    // }

    // function setTestAddressByBytes(bytes memory _value ) public onlyGov { 
    //     setAddress(TEST_ADDRESS, toAddress(_value));
    // }

    // function setTestBytes32ByBytes(bytes memory _value ) public onlyGov { 
    //     setBytes32(TEST_BYTES32, toBytes32(_value));
    // }

    // function setTestBytesByBytes(bytes memory _value ) public onlyGov { 
    //     setBytes(TEST_BYTES, _value);
    // }

    // function setTestStringByBytes(bytes memory _value ) public onlyGov { 
    //     setString(TEST_STRING, string(_value));
    // }

    function toBytes32(bytes memory _input) internal pure returns (bytes32 _output) {
        assembly {
            _output := mload(add(_input, 32))
        }
    }

    function toInt(bytes memory _input) internal pure returns (int256 _output) {
        assembly {
            _output := mload(add(_input, 32))
        }
    }

    function toUint(bytes memory _input) internal pure returns (uint256 _output) {
        assembly {
            _output := mload(add(_input, 32))
        }
    }


    function to2Uint(bytes memory _input) internal pure returns (uint256 _output0, uint256 _output1) {
        assembly {
            _output0 := mload(add(_input, 32))
            _output1 := mload(add(_input, 64))
        }
    }

    function to3Uint(bytes memory _input) internal pure returns (uint256 _output0, uint256 _output1, uint256 _output2) {
        assembly {
            _output0 := mload(add(_input, 32))
            _output1 := mload(add(_input, 64))
            _output2 := mload(add(_input, 96))
        }
    }

    function to4Uint(bytes memory _input) internal pure returns (uint256 _output0, uint256 _output1, uint256 _output2, uint256 _output3) {
        assembly {
            _output0 := mload(add(_input, 32))
            _output1 := mload(add(_input, 64))
            _output2 := mload(add(_input, 96))
            _output3 := mload(add(_input, 128))
        }
    }

    function toAddress(bytes memory _input) internal pure returns (address _output) {
        _output = abi.decode(_input, (address));
        // assembly {
        //     _output := mload(add(_input, 20))
        // }
    }
}